import { Notifications } from '@/features/network-admin/notifications';
import { loadNotifications, loadNotificationPreferences } from '@/features/network-admin/notifications-queries';

export default async function Page() {
  const [notifications, preferences] = await Promise.all([
    loadNotifications(),
    loadNotificationPreferences(),
  ]);
  return <Notifications notifications={notifications} preferences={preferences} />;
}
