import { SignInGate } from '../components/SignInGate';

export function NotificationsPage() {
  return <div className="page activity-page"><header className="page-heading"><h1>Notifications</h1></header><SignInGate feature="view notifications" description="Your notification list will be available when the social service is connected." /></div>;
}

export function BookmarksPage() {
  return <div className="page activity-page"><header className="page-heading"><h1>Bookmarks</h1></header><SignInGate feature="view your bookmarks" description="Saved posts will appear when the social service is connected." /></div>;
}

export function MessagesPage() {
  return <div className="page messages-page"><header className="page-heading"><h1>Messages</h1></header><SignInGate feature="view your messages" description="Direct messages will be available when the messaging service is connected." /></div>;
}
