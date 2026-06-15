// =============================================================================
// File: frontend/src/services/notification.service.ts
// Purpose: Access and manage in-app notifications
// =============================================================================

import { api } from './api';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
}

export const getNotifications = async (
  params?: GetNotificationsParams
): Promise<{
  data: Notification[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> => {
  const response = await api.get('/notifications', { params });

  return {
    data: response.data.data ?? [],
    pagination: response.data.pagination,
  };
};

export const getUnreadNotificationsCount = async (): Promise<number> => {
  const response = await api.get('/notifications/unread-count');
  return response.data.data.unreadCount;
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  await api.patch('/notifications/read-all');
};

export const markNotificationAsRead = async (
  notificationId: string
): Promise<void> => {
  await api.patch(`/notifications/${notificationId}/read`);
};