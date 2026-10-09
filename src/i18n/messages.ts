export type Language = 'en' | 'es' | 'fr';

const messages: Record<Language, Record<string, string>> = {
  en: {
    'nav.home': 'Timeline', 'nav.explore': 'Explore', 'nav.factions': 'Factions', 'nav.notifications': 'Notifications', 'nav.messages': 'Messages', 'nav.bookmarks': 'Bookmarks', 'nav.settings': 'Settings',
    'action.post': 'Post', 'action.signin': 'Sign in', 'action.signup': 'Create account', 'action.search': 'Search ShittyAss.com',
    'feed.title': 'Timeline', 'feed.forYou': 'For you', 'feed.following': 'Following',
    'feed.reply': 'Reply', 'feed.repost': 'Repost', 'feed.like': 'Like', 'feed.bookmark': 'Bookmark', 'feed.share': 'Share',
    'auth.signinTitle': 'Sign in', 'auth.create': 'Create account', 'auth.email': 'Email address', 'auth.password': 'Password', 'auth.name': 'Name',
    'auth.forgot': 'Forgot password?', 'auth.noAccount': 'New around here?', 'auth.hasAccount': 'Already have an account?', 'auth.signup': 'Create account',
  },
  es: {
    'nav.home': 'Cronología', 'nav.explore': 'Explorar', 'nav.factions': 'Facciones', 'nav.notifications': 'Notificaciones', 'nav.messages': 'Mensajes', 'nav.bookmarks': 'Guardados', 'nav.settings': 'Ajustes',
    'action.post': 'Publicar', 'action.signin': 'Iniciar sesión', 'action.signup': 'Crear cuenta', 'action.search': 'Buscar en ShittyAss.com',
    'feed.title': 'Cronología', 'feed.forYou': 'Para ti', 'feed.following': 'Siguiendo',
    'feed.reply': 'Responder', 'feed.repost': 'Republicar', 'feed.like': 'Me gusta', 'feed.bookmark': 'Guardar', 'feed.share': 'Compartir',
    'auth.signinTitle': 'Iniciar sesión', 'auth.create': 'Crear cuenta', 'auth.email': 'Correo electrónico', 'auth.password': 'Contraseña', 'auth.name': 'Nombre',
    'auth.forgot': '¿Olvidaste tu contraseña?', 'auth.noAccount': '¿Eres nuevo por aquí?', 'auth.hasAccount': '¿Ya tienes una cuenta?', 'auth.signup': 'Crear cuenta',
  },
  fr: {
    'nav.home': 'Fil d’actualité', 'nav.explore': 'Explorer', 'nav.factions': 'Factions', 'nav.notifications': 'Notifications', 'nav.messages': 'Messages', 'nav.bookmarks': 'Enregistrés', 'nav.settings': 'Paramètres',
    'action.post': 'Publier', 'action.signin': 'Se connecter', 'action.signup': 'Créer un compte', 'action.search': 'Rechercher sur ShittyAss.com',
    'feed.title': 'Fil d’actualité', 'feed.forYou': 'Pour vous', 'feed.following': 'Abonnements',
    'feed.reply': 'Répondre', 'feed.repost': 'Republier', 'feed.like': 'J’aime', 'feed.bookmark': 'Enregistrer', 'feed.share': 'Partager',
    'auth.signinTitle': 'Se connecter', 'auth.create': 'Créer un compte', 'auth.email': 'Adresse e-mail', 'auth.password': 'Mot de passe', 'auth.name': 'Nom',
    'auth.forgot': 'Mot de passe oublié ?', 'auth.noAccount': 'Nouveau ici ?', 'auth.hasAccount': 'Vous avez déjà un compte ?', 'auth.signup': 'Créer un compte',
  },
};

export default messages;
