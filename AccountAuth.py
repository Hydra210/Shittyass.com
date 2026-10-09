import os

import httpx
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from starlette.exceptions import HTTPException as StarletteHTTPException

# ---------- config ----------

ACCOUNTS_API_URL = os.environ["ACCOUNTS_API_URL"].rstrip("/")
SITE_ORIGINS = [o.strip().rstrip("/") for o in os.environ["SITE_ORIGINS"].split(",") if o.strip()]
COOKIE_SECURE = os.environ.get("COOKIE_SECURE", "true").lower() != "false"
# Only for embedding the site inside another site (e.g. a preview iframe). Leave off in production:
# SameSite=Lax is the safer default and is what a normal deployment wants.
COOKIE_SAMESITE_NONE = os.environ.get("COOKIE_SAMESITE_NONE", "false").lower() == "true"
APP_NAME = "exe-web"

AT_COOKIE = "exe_at"   # access token  (15 min)
RT_COOKIE = "exe_rt"   # refresh token (30 days)

# Long timeout because Render's free tier sleeps and the first call can be slow.
http = httpx.AsyncClient(base_url=ACCOUNTS_API_URL, timeout=60)


# ---------- auth helpers ----------

async def upstream(method: str, path: str, request: Request | None = None,
                   json: dict | None = None, token: str | None = None) -> httpx.Response:
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if request is not None:
        if request.headers.get("user-agent"):
            headers["User-Agent"] = request.headers["user-agent"]
        if request.client:
            headers["X-Forwarded-For"] = request.client.host
    try:
        return await http.request(method, path, json=json, headers=headers)
    except httpx.HTTPError:
        raise HTTPException(502, "Account service is unreachable")


def raise_from(r: httpx.Response):
    try:
        detail = r.json().get("detail", "Request failed")
    except Exception:
        detail = "Request failed"
    raise HTTPException(r.status_code, detail)


def set_session(response: Response, data: dict):
    opts = dict(httponly=True, secure=COOKIE_SECURE, samesite="lax", path="/")
    response.set_cookie(AT_COOKIE, data["access_token"], max_age=15 * 60, **opts)
    response.set_cookie(RT_COOKIE, data["refresh_token"], max_age=30 * 24 * 3600, **opts)


def clear_session(response: Response):
    response.delete_cookie(AT_COOKIE, path="/")
    response.delete_cookie(RT_COOKIE, path="/")


async def check_origin(request: Request):
    """CSRF guard for state-changing routes (on top of SameSite=Lax)."""
    origin = (request.headers.get("origin") or "").rstrip("/")
    if origin not in SITE_ORIGINS:
        raise HTTPException(403, "Bad origin")


async def current_user(request: Request, response: Response) -> dict:
    """Dependency: returns the logged-in user or 401. Refreshes silently if needed."""
    at = request.cookies.get(AT_COOKIE)
    if at:
        r = await upstream("GET", "/auth/me", token=at)
        if r.status_code == 200:
            return r.json()

    rt = request.cookies.get(RT_COOKIE)
    if rt:
        r = await upstream("POST", "/auth/refresh", request, json={"refresh_token": rt})
        if r.status_code == 200:
            data = r.json()
            set_session(response, data)
            me = await upstream("GET", "/auth/me", token=data["access_token"])
            if me.status_code == 200:
                return me.json()

    raise HTTPException(401, "Not logged in")


# ---------- auth routes ----------

auth = APIRouter(prefix="/auth", tags=["auth"])


class RegisterBody(BaseModel):
    email: str
    password: str
    display_name: str


class LoginBody(BaseModel):
    email: str
    password: str


class Verify2FABody(BaseModel):
    challenge_token: str
    code: str


@auth.post("/register", dependencies=[Depends(check_origin)])
async def register(body: RegisterBody, request: Request):
    r = await upstream("POST", "/auth/register", request,
                       json={**body.model_dump(), "app": APP_NAME})
    if r.status_code >= 400:
        raise_from(r)
    return r.json()


@auth.post("/login", dependencies=[Depends(check_origin)])
async def login(body: LoginBody, request: Request, response: Response):
    r = await upstream("POST", "/auth/login", request,
                       json={**body.model_dump(), "app": APP_NAME})
    if r.status_code >= 400:
        raise_from(r)
    data = r.json()
    if data.get("requires_2fa"):
        return {"requires_2fa": True, "challenge_token": data["challenge_token"],
                "message": data.get("message")}
    set_session(response, data)
    return {"user": data["user"]}          # tokens never go to the browser


@auth.post("/verify-2fa", dependencies=[Depends(check_origin)])
async def verify_2fa(body: Verify2FABody, request: Request, response: Response):
    r = await upstream("POST", "/auth/verify-2fa", request, json=body.model_dump())
    if r.status_code >= 400:
        raise_from(r)
    data = r.json()
    set_session(response, data)
    return {"user": data["user"]}


@auth.post("/logout", dependencies=[Depends(check_origin)])
async def logout(request: Request, response: Response):
    rt = request.cookies.get(RT_COOKIE)
    if rt:
        await upstream("POST", "/auth/logout", request, json={"refresh_token": rt})
    clear_session(response)
    return {"ok": True}


@auth.get("/me")
async def me(user: dict = Depends(current_user)):
    return user


# ---------- app ----------

app = FastAPI(title="EXE Site", docs_url=None, redoc_url=None)

app.include_router(auth)   # login/accounts (above)


@app.get("/health")
def health():
    return {"ok": True}


# ---------- YOUR ROUTES ----------
# Everything lives under /api so it never clashes with your website files.
#   user=Depends(current_user)             -> login-only route, gives you the user dict
#   dependencies=[Depends(check_origin)]   -> add to POST/PUT/PATCH/DELETE (CSRF check)

@app.get("/api/hello")
async def hello(user: dict = Depends(current_user)):
    # Login-only example. Delete once you have real routes.
    return {"message": f"hi {user.get('display_name') or user.get('email')}"}


@app.post("/api/echo", dependencies=[Depends(check_origin)])
async def echo(payload: dict, user: dict = Depends(current_user)):
    # Login-only POST example with CSRF check.
    return {"you_sent": payload}


# Static site LAST so it doesn't swallow the routes above.
@app.middleware("http")
async def adapt_https_auth_cookies(request: Request, call_next):
    response = await call_next(request)
    origin = (request.headers.get("origin") or "").rstrip("/")
    if not origin:
        referer = request.headers.get("referer") or ""
        if referer:
            from urllib.parse import urlsplit

            parsed = urlsplit(referer)
            origin = f"{parsed.scheme}://{parsed.netloc}".rstrip("/")
    if COOKIE_SAMESITE_NONE and origin.startswith("https://") and origin in SITE_ORIGINS:
        updated_headers = []
        for name, value in response.raw_headers:
            if name.lower() == b"set-cookie" and value.split(b"=", 1)[0].lower() in {b"exe_at", b"exe_rt"}:
                parts = value.split(b";")
                cookie = parts[0]
                attributes = [part.strip() for part in parts[1:] if not part.strip().lower().startswith(b"samesite=") and part.strip().lower() != b"secure"]
                value = b"; ".join([cookie, *attributes, b"SameSite=None", b"Secure"])
            updated_headers.append((name, value))
        response.raw_headers = tuple(updated_headers)
    return response

class SPAStaticFiles(StaticFiles):
    async def get_response(self, path, scope):
        try:
            return await super().get_response(path, scope)
        except StarletteHTTPException as e:
            if e.status_code == 404:
                return await super().get_response("index.html", scope)
            raise


app.mount("/", SPAStaticFiles(directory="dist", html=True, check_dir=False), name="site")
