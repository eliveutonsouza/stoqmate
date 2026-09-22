import { NotificationSettings } from '@/features/settings/notification-settings';
import { loadNotificationPreferences } from '@/features/network-admin/notifications-queries';

export default async function Page() {
  const preferences = await loadNotificationPreferences();
  return <NotificationSettings preferences={preferences} />;
}
