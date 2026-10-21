import { NOTIFICATION_ENDPOINTS, USE_MOCK_API } from './api/config';
import { httpClient } from './api/httpClient';
import { NotificationItem } from '../types';
import { INITIAL_NOTIFICATIONS } from './mockData';

const NOTIFICATIONS_KEY = 'skillswap_notifications_store';

function getStoredNotifications(): NotificationItem[] {
  const saved = localStorage.getItem(NOTIFICATIONS_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // ignore
    }
  }
  return [];
}

function saveStoredNotifications(notifs: NotificationItem[]): void {
  if (Array.isArray(notifs)) {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifs));
  }
}

export const notificationService = {
  async getNotifications(): Promise<NotificationItem[]> {
    if (!USE_MOCK_API) {
      try {
        const res = await httpClient.get<NotificationItem[]>(NOTIFICATION_ENDPOINTS.LIST);
        if (Array.isArray(res)) {
          return res;
        }
      } catch (err) {
        console.warn('Backend notifications failed, using local store:', err);
      }
    }
    return getStoredNotifications();
  },

  async markNotificationRead(id: string): Promise<NotificationItem[]> {
    if (!USE_MOCK_API) {
      try {
        const res = await httpClient.post<NotificationItem[]>(NOTIFICATION_ENDPOINTS.MARK_READ(id), {});
        if (Array.isArray(res)) {
          return res;
        }
      } catch (err) {
        console.warn('Backend mark read failed, updating locally:', err);
      }
    }

    const current = getStoredNotifications();
    const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
    saveStoredNotifications(updated);
    return updated;
  },

  async markAllNotificationsRead(): Promise<NotificationItem[]> {
    if (!USE_MOCK_API) {
      try {
        const res = await httpClient.post<NotificationItem[]>(NOTIFICATION_ENDPOINTS.MARK_ALL_READ, {});
        if (Array.isArray(res)) {
          return res;
        }
      } catch (err) {
        console.warn('Backend mark all read failed, updating locally:', err);
      }
    }

    const current = getStoredNotifications();
    const updated = current.map((n) => ({ ...n, read: true }));
    saveStoredNotifications(updated);
    return updated;
  },
};
