"""
profiles.py — the ShittyAss profile system (test setup: everything stored locally).

  * Profiles, follows and username history live in ONE SQLite file:  <DATA_DIR>/profiles.db
  * Avatars and banners are re-encoded to WebP and saved to disk:    <DATA_DIR>/uploads/...
  * Both sit behind small classes (ProfileStore, LocalStorage). To go live later, swap them for a
    Postgres store and an R2/S3 storage with the same methods. Nothing else in this file changes.
  * DATA_DIR defaults to ./data. On Render's free tier that disk is wiped on every deploy and restart,
    so profiles reset there. Fine for testing, not for real users.

Profiles are keyed by the logged-in EXE account id. That id is PRIVATE: the public JSON only ever
shows a random profile id and the @username.

Wired in from AccountAuth.py:  app.include_router(build_profile_router(current_user, check_origin))
"""
import io
import os
import re
import secrets
import sqlite3
import time
import unicodedata
import uuid
import warnings
from collections import defaultdict, deque
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlsplit

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse
from PIL import Image, ImageOps, UnidentifiedImageError
from pydantic import BaseModel

# ---------- settings ----------

DATA_DIR = Path(os.environ.get("DATA_DIR", "./data")).resolve()
USERNAME_COOLDOWN_DAYS = int(os.environ.get("USERNAME_COOLDOWN_DAYS", "30"))   # between username changes
USERNAME_HOLD_DAYS = 14                                                         # old names stay reserved for their owner
MAX_UPLOAD_BYTES = {"avatars": 5 * 1024 * 1024, "banners": 8 * 1024 * 1024}
IMAGE_TARGET = {"avatars": (512, 512), "banners": (1500, 500)}
IMAGE_MIN = {"avatars": (64, 64), "banners": (300, 100)}
Image.MAX_IMAGE_PIXELS = 40_000_000   # decompression-bomb guard

BIO_MAX, NAME_MAX, LOCATION_MAX, WEBSITE_MAX, PRONOUNS_MAX = 200, 40, 40, 100, 24

USERNAME_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_]{1,18}[A-Za-z0-9]$")
RESERVED_USERNAMES = {
    "me", "you", "u", "admin", "administrator", "root", "support", "help", "staff", "moderator", "mod", "mods",
    "official", "system", "security", "abuse", "contact", "info", "team", "owner", "api", "auth", "login", "logout",
    "signup", "register", "settings", "explore", "search", "factions", "faction", "notifications", "messages",
    "bookmarks", "about", "privacy", "terms", "safety", "accessibility", "cookies", "post", "posts", "welcome",
    "home", "null", "undefined", "anonymous", "everyone", "here", "www", "mail", "exe", "shittyass",
}
RESERVED_SUBSTRINGS = ("shittyass", "exedevelopment", "exedev")
INVISIBLE = dict.fromkeys(map(ord, "\u200b\u200c\u200d\u200e\u200f\u202a\u202b\u202c\u202d\u202e\u2060\u2066\u2067\u2068\u2069\ufeff"), None)


def now() -> datetime:
    return datetime.now(timezone.utc)


def iso(dt: datetime) -> str:
    return dt.replace(microsecond=0).isoformat()


# ---------- storage layers (swap these for production) ----------

class LocalStorage:
    """Image files on local disk. Production version: same four methods, backed by R2/S3."""

    def __init__(self, root: Path):
        self.root = root
        for kind in ("avatars", "banners"):
            (root / kind).mkdir(parents=True, exist_ok=True)

    def put(self, kind: str, data: bytes) -> str:
        name = f"{uuid.uuid4().hex}.webp"
        target = self.root / kind / name
        temp = target.with_suffix(".tmp")
        temp.write_bytes(data)
        temp.replace(target)          # atomic: never serve half-written files
        return name

    def delete(self, kind: str, name: str | None) -> None:
        if name:
            try:
                (self.root / kind / name).unlink()
            except FileNotFoundError:
                pass

    def path(self, kind: str, name: str) -> Path | None:
        target = self.root / kind / name
        return target if target.is_file() else None

    def url(self, kind: str, name: str | None) -> str | None:
        return f"/media/{kind}/{name}" if name else None


SCHEMA = """
CREATE TABLE IF NOT EXISTS profiles (
  id                  TEXT PRIMARY KEY,                  -- public profile id (random)
  user_id             TEXT NOT NULL UNIQUE,              -- private EXE account id
  username            TEXT NOT NULL UNIQUE COLLATE NOCASE,
  display_name        TEXT NOT NULL,
  bio                 TEXT NOT NULL DEFAULT '',
  location            TEXT NOT NULL DEFAULT '',
  website             TEXT NOT NULL DEFAULT '',
  pronouns            TEXT NOT NULL DEFAULT '',
  avatar_key          TEXT,
  banner_key          TEXT,
  status              TEXT NOT NULL DEFAULT 'active',    -- active | suspended | banned (moderation plugs in here)
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL,
  username_changed_at TEXT
);
CREATE TABLE IF NOT EXISTS username_history (
  username   TEXT PRIMARY KEY COLLATE NOCASE,
  user_id    TEXT NOT NULL,
  held_until TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS follows (
  follower_id TEXT NOT NULL,
  followee_id TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  PRIMARY KEY (follower_id, followee_id)
);
CREATE INDEX IF NOT EXISTS idx_follows_followee ON follows (followee_id, created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_display ON profiles (display_name COLLATE NOCASE);
"""

PROFILE_SELECT = """
SELECT p.*,
  (SELECT COUNT(*) FROM follows f WHERE f.followee_id = p.user_id) AS followers,
  (SELECT COUNT(*) FROM follows f WHERE f.follower_id = p.user_id) AS following
FROM profiles p
"""


class ProfileStore:
    """All SQL lives here. Production version: same methods on Postgres."""

    def __init__(self, path: Path):
        self.path = path
        path.parent.mkdir(parents=True, exist_ok=True)
        with self.tx() as db:
            db.execute("PRAGMA journal_mode=WAL")
            db.executescript(SCHEMA)

    @contextmanager
    def tx(self):
        db = sqlite3.connect(self.path, timeout=10)
        db.row_factory = sqlite3.Row
        db.execute("PRAGMA foreign_keys=ON")
        try:
            yield db
            db.commit()
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    def by_user(self, db, user_id: str):
        return db.execute(PROFILE_SELECT + " WHERE p.user_id = ?", (user_id,)).fetchone()

    def by_username(self, db, username: str):
        return db.execute(PROFILE_SELECT + " WHERE p.username = ? COLLATE NOCASE", (username,)).fetchone()

    def username_taken(self, db, username: str, me: str | None) -> bool:
        row = db.execute("SELECT user_id FROM profiles WHERE username = ? COLLATE NOCASE", (username,)).fetchone()
        if row and row["user_id"] != me:
            return True
        held = db.execute("SELECT user_id, held_until FROM username_history WHERE username = ? COLLATE NOCASE", (username,)).fetchone()
        return bool(held and held["user_id"] != me and held["held_until"] > iso(now()))


# ---------- validation ----------

def bad(message: str, status: int = 422):
    raise HTTPException(status, message)


def clean_text(value: str | None, label: str, max_len: int, *, required=False, multiline=False) -> str:
    text = unicodedata.normalize("NFC", value or "").translate(INVISIBLE)
    text = "".join(ch for ch in text if ch in "\n" or unicodedata.category(ch)[0] != "C")
    if multiline:
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
    else:
        text = re.sub(r"\s+", " ", text)
    text = text.strip()
    if required and not text:
        bad(f"{label} can't be empty.")
    if len(text) > max_len:
        bad(f"{label} must be {max_len} characters or fewer.")
    return text


def check_username(raw: str) -> str:
    name = (raw or "").strip().lstrip("@")
    if not USERNAME_RE.match(name):
        bad("Usernames are 3 to 20 characters: letters, numbers and underscores, starting and ending with a letter or number.")
    lowered = name.lower()
    if lowered in RESERVED_USERNAMES or any(part in lowered for part in RESERVED_SUBSTRINGS):
        bad("That username isn't available.")
    if "__" in name:
        bad("Usernames can't contain two underscores in a row.")
    return name


def check_website(raw: str | None) -> str:
    text = clean_text(raw, "Website", WEBSITE_MAX)
    if not text:
        return ""
    if "://" not in text:
        text = "https://" + text
    try:
        parts = urlsplit(text)
        host = parts.hostname or ""
    except ValueError:
        bad("That website address doesn't look right.")
    if parts.scheme not in ("http", "https") or "." not in host or parts.username or parts.password or " " in text:
        bad("Enter a normal website address, like example.com.")
    return text.split("#", 1)[0]


# ---------- automatic usernames ----------

def username_ok(name: str) -> bool:
    lowered = name.lower()
    return bool(USERNAME_RE.match(name)) and "__" not in name and lowered not in RESERVED_USERNAMES \
        and not any(part in lowered for part in RESERVED_SUBSTRINGS)


def pick_username(store: "ProfileStore", db, display_name: str) -> str:
    """Every account gets a profile on first use, so it needs a username straight away.
    Built from the account's display name ONLY (never the email address, which would leak it).
    Falls back to user_1234 style names, and the person can change it any time."""
    ascii_name = unicodedata.normalize("NFKD", display_name or "").encode("ascii", "ignore").decode()
    base = re.sub(r"[^A-Za-z0-9]+", "_", ascii_name).strip("_").lower()[:20].strip("_")
    if username_ok(base) and not store.username_taken(db, base, None):
        return base
    stem = base[:15].rstrip("_")
    lowered = stem.lower()
    if len(stem) < 3 or lowered in RESERVED_USERNAMES or any(part in lowered for part in RESERVED_SUBSTRINGS):
        stem = "user"      # never start an automatic name from a reserved word (admin_1234 would look like staff)
    for _ in range(25):
        candidate = f"{stem}_{secrets.randbelow(9000) + 1000}"
        if username_ok(candidate) and not store.username_taken(db, candidate, None):
            return candidate
    return f"user_{uuid.uuid4().hex[:10]}"


# ---------- images ----------

def process_image(data: bytes, kind: str) -> bytes:
    """Validate, strip metadata, crop to the right shape and re-encode as WebP."""
    unsupported = "That file isn't a supported image. Use a JPEG, PNG, WebP or GIF."
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)   # near-limit images are rejected too
            img = Image.open(io.BytesIO(data))
            if (img.format or "").upper() not in {"JPEG", "PNG", "WEBP", "GIF"}:
                bad(unsupported, 400)
            img.load()                               # decode fully; catches truncated or corrupt files
    except HTTPException:
        raise
    except (UnidentifiedImageError, OSError, ValueError, Warning, Image.DecompressionBombError):
        bad(unsupported, 400)

    img = ImageOps.exif_transpose(img)               # respect phone rotation, then drop all EXIF
    min_w, min_h = IMAGE_MIN[kind]
    if img.width < min_w or img.height < min_h:
        bad(f"That image is too small. It needs to be at least {min_w}×{min_h} pixels.", 400)
    has_alpha = img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info)
    img = img.convert("RGBA" if has_alpha else "RGB")
    img = ImageOps.fit(img, IMAGE_TARGET[kind], Image.LANCZOS, centering=(0.5, 0.5))
    out = io.BytesIO()
    img.save(out, "WEBP", quality=86, method=4)
    return out.getvalue()


async def read_limited(request: Request, limit: int) -> bytes:
    declared = request.headers.get("content-length")
    if declared and declared.isdigit() and int(declared) > limit:
        bad("That image is too large.", 413)
    size, chunks = 0, []
    async for chunk in request.stream():
        size += len(chunk)
        if size > limit:
            bad("That image is too large.", 413)
        chunks.append(chunk)
    if not size:
        bad("No image was sent.", 400)
    return b"".join(chunks)


# ---------- rate limiting (in memory, per process) ----------

_hits: dict[str, deque] = defaultdict(deque)


def rate_limit(name: str, max_hits: int, window_seconds: int, *, by_ip=False):
    def check(request: Request):
        who = (request.headers.get("x-forwarded-for", "").split(",")[0].strip() or (request.client.host if request.client else "?")) if by_ip \
            else (request.cookies.get("exe_rt") or request.cookies.get("exe_at") or "anon")[-24:]
        bucket = _hits[f"{name}:{who}"]
        cutoff = time.monotonic() - window_seconds
        while bucket and bucket[0] < cutoff:
            bucket.popleft()
        if len(bucket) >= max_hits:
            raise HTTPException(429, "You're doing that too fast. Please wait a moment and try again.")
        bucket.append(time.monotonic())
    return check


# ---------- request bodies ----------

class ProfilePatch(BaseModel):
    display_name: str | None = None
    bio: str | None = None
    location: str | None = None
    website: str | None = None
    pronouns: str | None = None


class UsernameChange(BaseModel):
    username: str


# ---------- router ----------

def build_profile_router(current_user, check_origin) -> APIRouter:
    store = ProfileStore(DATA_DIR / "profiles.db")
    storage = LocalStorage(DATA_DIR / "uploads")
    router = APIRouter(tags=["profiles"])

    async def maybe_user(request: Request, response: Response):
        """Logged-in user, or None. Public pages never fail just because of auth trouble.
        `response` must be the real one: a silent token refresh has to reach the browser's cookies."""
        try:
            return await current_user(request, response)
        except HTTPException:
            return None

    def user_id(user: dict) -> str:
        uid = user.get("id") if user else None
        if uid is None:
            raise HTTPException(401, "Not logged in")
        return str(uid)

    def ensure_profile(db, user: dict):
        """Every signed-in account has a profile. The first time we see an account, create one:
        username picked automatically, display name = username, no photo (the app shows a gray icon)."""
        uid = user_id(user)
        row = store.by_user(db, uid)
        if row:
            return row
        display = clean_text(str(user.get("display_name") or user.get("name") or ""), "Name", 200)
        for _ in range(6):
            username = pick_username(store, db, display)
            stamp = iso(now())
            try:
                db.execute("INSERT INTO profiles (id, user_id, username, display_name, created_at, updated_at) VALUES (?,?,?,?,?,?)",
                           (uuid.uuid4().hex, uid, username, username, stamp, stamp))
                break
            except sqlite3.IntegrityError:          # a parallel request made it first, or the name was just taken
                row = store.by_user(db, uid)
                if row:
                    return row
        row = store.by_user(db, uid)
        if not row:
            raise HTTPException(503, "Couldn't set up your profile. Please try again.")
        return row

    def view(row, viewer: str | None = None, following: bool | None = None, full=True) -> dict:
        is_self = viewer is not None and row["user_id"] == viewer
        data = {
            "id": row["id"],
            "handle": row["username"],
            "displayName": row["display_name"],
            "avatarUrl": storage.url("avatars", row["avatar_key"]),
            "bio": row["bio"],
            "isSelf": is_self,
            "isFollowing": bool(following),
        }
        if full:
            data.update({
                "bannerUrl": storage.url("banners", row["banner_key"]),
                "location": row["location"],
                "website": row["website"],
                "pronouns": row["pronouns"],
                "createdAt": row["created_at"],
                "followerCount": row["followers"],
                "followingCount": row["following"],
                "postCount": 0,
            })
        if is_self:
            data["status"] = row["status"]
            changed = row["username_changed_at"]
            nxt = datetime.fromisoformat(changed) + timedelta(days=USERNAME_COOLDOWN_DAYS) if changed else None
            data["usernameChangeAvailableAt"] = iso(nxt) if nxt and nxt > now() else None
        return data

    def is_following(db, viewer: str | None, target_user_id: str) -> bool:
        if not viewer:
            return False
        return db.execute("SELECT 1 FROM follows WHERE follower_id = ? AND followee_id = ?", (viewer, target_user_id)).fetchone() is not None

    def own_active_profile(db, user: dict):
        row = ensure_profile(db, user)
        if row["status"] != "active":
            raise HTTPException(403, "Your profile is restricted, so it can't be changed right now.")
        return row

    # ----- your own profile -----

    @router.get("/api/me/profile")
    def my_profile(user: dict = Depends(current_user)):
        uid = user_id(user)
        with store.tx() as db:
            return {"profile": view(ensure_profile(db, user), uid)}

    @router.patch("/api/me/profile", dependencies=[Depends(check_origin), Depends(rate_limit("edit", 40, 3600))])
    def update_profile(body: ProfilePatch, user: dict = Depends(current_user)):
        uid = user_id(user)
        fields = body.model_dump(exclude_unset=True)
        updates = {}
        if "display_name" in fields:
            updates["display_name"] = clean_text(fields["display_name"], "Display name", NAME_MAX, required=True)
        if "bio" in fields:
            updates["bio"] = clean_text(fields["bio"], "Bio", BIO_MAX, multiline=True)
        if "location" in fields:
            updates["location"] = clean_text(fields["location"], "Location", LOCATION_MAX)
        if "website" in fields:
            updates["website"] = check_website(fields["website"])
        if "pronouns" in fields:
            updates["pronouns"] = clean_text(fields["pronouns"], "Pronouns", PRONOUNS_MAX)
        with store.tx() as db:
            own_active_profile(db, user)
            if updates:
                sets = ", ".join(f"{col} = ?" for col in updates)
                db.execute(f"UPDATE profiles SET {sets}, updated_at = ? WHERE user_id = ?", (*updates.values(), iso(now()), uid))
            return {"profile": view(store.by_user(db, uid), uid)}

    @router.post("/api/me/username", dependencies=[Depends(check_origin), Depends(rate_limit("username", 10, 3600))])
    def change_username(body: UsernameChange, user: dict = Depends(current_user)):
        uid = user_id(user)
        username = check_username(body.username)
        with store.tx() as db:
            row = own_active_profile(db, user)
            if row["username"] == username:
                return {"profile": view(row, uid)}
            if row["username"].lower() == username.lower():            # only the capitalisation changed: always allowed
                db.execute("UPDATE profiles SET username = ?, updated_at = ? WHERE user_id = ?", (username, iso(now()), uid))
                return {"profile": view(store.by_user(db, uid), uid)}
            changed = row["username_changed_at"]
            if changed and datetime.fromisoformat(changed) + timedelta(days=USERNAME_COOLDOWN_DAYS) > now():
                when = datetime.fromisoformat(changed) + timedelta(days=USERNAME_COOLDOWN_DAYS)
                raise HTTPException(429, f"You can change your username again on {when:%B %d, %Y}.")
            if store.username_taken(db, username, uid):
                raise HTTPException(409, "That username is taken.")
            stamp = iso(now())
            try:
                db.execute("INSERT OR REPLACE INTO username_history (username, user_id, held_until) VALUES (?,?,?)",
                           (row["username"], uid, iso(now() + timedelta(days=USERNAME_HOLD_DAYS))))
                db.execute("UPDATE profiles SET username = ?, username_changed_at = ?, updated_at = ? WHERE user_id = ?",
                           (username, stamp, stamp, uid))
            except sqlite3.IntegrityError:
                raise HTTPException(409, "That username is taken.")
            return {"profile": view(store.by_user(db, uid), uid)}

    @router.get("/api/username-available", dependencies=[Depends(rate_limit("avail", 60, 60, by_ip=True))])
    async def username_available(request: Request, response: Response, u: str = ""):
        user = await maybe_user(request, response)
        try:
            name = check_username(u)
        except HTTPException as exc:
            return {"available": False, "reason": exc.detail}
        with store.tx() as db:
            taken = store.username_taken(db, name, user_id(user) if user else None)
        return {"available": not taken, "reason": "That username is taken." if taken else None}

    # ----- images -----

    async def save_image(kind: str, request: Request, user: dict):
        uid = user_id(user)
        data = await read_limited(request, MAX_UPLOAD_BYTES[kind])
        webp = await run_in_threadpool(process_image, data, kind)
        key = storage.put(kind, webp)
        column = "avatar_key" if kind == "avatars" else "banner_key"
        try:
            with store.tx() as db:
                row = own_active_profile(db, user)
                db.execute(f"UPDATE profiles SET {column} = ?, updated_at = ? WHERE user_id = ?", (key, iso(now()), uid))
                result = view(store.by_user(db, uid), uid)
        except Exception:
            storage.delete(kind, key)           # don't leave an orphan file behind
            raise
        storage.delete(kind, row[column])        # remove the previous image
        return {"profile": result}

    def remove_image(kind: str, user: dict):
        uid = user_id(user)
        column = "avatar_key" if kind == "avatars" else "banner_key"
        with store.tx() as db:
            row = own_active_profile(db, user)
            db.execute(f"UPDATE profiles SET {column} = NULL, updated_at = ? WHERE user_id = ?", (iso(now()), uid))
            result = view(store.by_user(db, uid), uid)
        storage.delete(kind, row[column])
        return {"profile": result}

    @router.post("/api/me/avatar", dependencies=[Depends(check_origin), Depends(rate_limit("upload", 30, 3600))])
    async def upload_avatar(request: Request, user: dict = Depends(current_user)):
        return await save_image("avatars", request, user)

    @router.post("/api/me/banner", dependencies=[Depends(check_origin), Depends(rate_limit("upload", 30, 3600))])
    async def upload_banner(request: Request, user: dict = Depends(current_user)):
        return await save_image("banners", request, user)

    @router.delete("/api/me/avatar", dependencies=[Depends(check_origin)])
    def delete_avatar(user: dict = Depends(current_user)):
        return remove_image("avatars", user)

    @router.delete("/api/me/banner", dependencies=[Depends(check_origin)])
    def delete_banner(user: dict = Depends(current_user)):
        return remove_image("banners", user)

    @router.get("/media/{kind}/{name}")
    def media(kind: str, name: str):
        if kind not in ("avatars", "banners") or not re.fullmatch(r"[a-f0-9]{32}\.webp", name):
            raise HTTPException(404, "Not found")
        path = storage.path(kind, name)
        if not path:
            raise HTTPException(404, "Not found")
        return FileResponse(path, media_type="image/webp", headers={
            "Cache-Control": "public, max-age=31536000, immutable",      # file names are random and never reused
            "X-Content-Type-Options": "nosniff",
        })

    # ----- public profiles, follows, search -----

    def visible(row, viewer: str | None) -> bool:
        return bool(row) and (row["status"] == "active" or (viewer is not None and row["user_id"] == viewer))

    @router.get("/api/profiles/search", dependencies=[Depends(rate_limit("search", 60, 60, by_ip=True))])
    async def search_profiles(request: Request, response: Response, q: str = ""):
        user = await maybe_user(request, response)
        viewer = user_id(user) if user else None
        term = clean_text(q, "Search", 60)
        if len(term) < 2:
            return {"people": []}
        like = "%" + term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"
        starts = like[1:]
        with store.tx() as db:
            rows = db.execute(
                PROFILE_SELECT + """ WHERE p.status = 'active' AND (p.username LIKE ? ESCAPE '\\' OR p.display_name LIKE ? ESCAPE '\\')
                   ORDER BY (p.username LIKE ? ESCAPE '\\') DESC, (p.display_name LIKE ? ESCAPE '\\') DESC, followers DESC, p.username LIMIT 20""",
                (like, like, starts, starts)).fetchall()
            return {"people": [view(r, viewer, is_following(db, viewer, r["user_id"]), full=False) for r in rows]}

    @router.get("/api/profiles/{username}")
    async def get_profile(username: str, request: Request, response: Response):
        user = await maybe_user(request, response)
        viewer = user_id(user) if user else None
        with store.tx() as db:
            row = store.by_username(db, username)
            if not visible(row, viewer):
                raise HTTPException(404, "This profile doesn't exist or isn't available.")
            return {"profile": view(row, viewer, is_following(db, viewer, row["user_id"]))}

    def follow_change(username: str, user: dict, follow: bool):
        uid = user_id(user)
        with store.tx() as db:
            own_active_profile(db, user)
            target = store.by_username(db, username)
            if not visible(target, uid):
                raise HTTPException(404, "This profile doesn't exist or isn't available.")
            if target["user_id"] == uid:
                raise HTTPException(400, "You can't follow yourself.")
            if follow:
                db.execute("INSERT OR IGNORE INTO follows (follower_id, followee_id, created_at) VALUES (?,?,?)", (uid, target["user_id"], iso(now())))
            else:
                db.execute("DELETE FROM follows WHERE follower_id = ? AND followee_id = ?", (uid, target["user_id"]))
            return {"profile": view(store.by_user(db, target["user_id"]), uid, follow)}

    @router.post("/api/profiles/{username}/follow", dependencies=[Depends(check_origin), Depends(rate_limit("follow", 150, 3600))])
    def follow(username: str, user: dict = Depends(current_user)):
        return follow_change(username, user, True)

    @router.delete("/api/profiles/{username}/follow", dependencies=[Depends(check_origin), Depends(rate_limit("follow", 150, 3600))])
    def unfollow(username: str, user: dict = Depends(current_user)):
        return follow_change(username, user, False)

    async def people_list(username: str, request: Request, response: Response, offset: int, limit: int, direction: str):
        user = await maybe_user(request, response)
        viewer = user_id(user) if user else None
        limit, offset = max(1, min(limit, 50)), max(0, offset)
        # "followers": rows where followee_id is this profile, listing the follower_ids.  "following": the reverse.
        join_col = "follower_id" if direction == "followers" else "followee_id"
        where_col = "followee_id" if direction == "followers" else "follower_id"
        with store.tx() as db:
            target = store.by_username(db, username)
            if not visible(target, viewer):
                raise HTTPException(404, "This profile doesn't exist or isn't available.")
            total = db.execute(f"SELECT COUNT(*) FROM follows f JOIN profiles p ON p.user_id = f.{join_col} WHERE f.{where_col} = ? AND p.status = 'active'",
                               (target["user_id"],)).fetchone()[0]
            rows = db.execute(
                PROFILE_SELECT.replace("FROM profiles p", f"FROM follows f JOIN profiles p ON p.user_id = f.{join_col}")
                + f" WHERE f.{where_col} = ? AND p.status = 'active' ORDER BY f.created_at DESC LIMIT ? OFFSET ?",
                (target["user_id"], limit, offset)).fetchall()
            people = [view(r, viewer, is_following(db, viewer, r["user_id"]), full=False) for r in rows]
        return {"people": people, "total": total, "nextOffset": offset + limit if offset + limit < total else None}

    @router.get("/api/profiles/{username}/followers")
    async def followers(username: str, request: Request, response: Response, offset: int = 0, limit: int = 30):
        return await people_list(username, request, response, offset, limit, "followers")

    @router.get("/api/profiles/{username}/following")
    async def following(username: str, request: Request, response: Response, offset: int = 0, limit: int = 30):
        return await people_list(username, request, response, offset, limit, "following")

    return router
