// src/services/notificationApi.ts

import api from '@/lib/api';
import {
    Notification,
    NotificationFilters,
    PaginatedNotifications,
    NotificationStats,
} from '@/types/notification';

const BASE_URL = '/notifications';

const transformNotification = (n: any): Notification => ({
    id: n.id,
    churchId: n.church_id || n.churchId,
    userId: n.user_id || n.userId,
    type: n.type,
    title: n.title,
    message: n.message,
    actionType: n.action_type || n.actionType,
    actionUrl: n.action_url || n.actionUrl,
    entityType: n.entity_type || n.entityType,
    entityId: n.entity_id || n.entityId,
    data: n.data || {},
    isRead: n.is_read ?? n.isRead ?? false,
    readAt: n.read_at || n.readAt,
    actorId: n.actor_id || n.actorId,
    actorName: n.actor_name || n.actorName,
    createdAt: n.created_at || n.createdAt,
    updatedAt: n.updated_at || n.updatedAt,
});

export const notificationApi = {
    getNotifications: async (filters: NotificationFilters = {}): Promise<PaginatedNotifications> => {
        const params = new URLSearchParams();

        if (filters.type) params.append('type', String(filters.type));
        if (filters.isRead !== undefined) params.append('isRead', String(filters.isRead));
        if (filters.entityType) params.append('entityType', filters.entityType);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.page) params.append('page', String(filters.page));
        if (filters.limit) params.append('limit', String(filters.limit));

        const response = await api.get(`${BASE_URL}?${params.toString()}`);
        console.log(response);
        const data = response

        return {
            notifications: (data.notifications || []).map(transformNotification),
            pagination: data.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 },
            unreadCount: data.unreadCount || 0,
        };
    },

    getNotificationById: async (id: string): Promise<Notification> => {
        const response = await api.get(`${BASE_URL}/${id}`);
        return transformNotification(response || response.data);
    },

    markAsRead: async (id: string): Promise<Notification> => {
        const response = await api.patch(`${BASE_URL}/${id}/read`);
        return transformNotification(response || response.data);
    },

    markAllAsRead: async (): Promise<{ count: number }> => {
        const response = await api.patch(`${BASE_URL}/mark-all-read`);
        return response || { count: 0 };
    },

    deleteNotification: async (id: string): Promise<void> => {
        await api.delete(`${BASE_URL}/${id}`);
    },

    getUnreadCount: async (): Promise<number> => {
        const response = await api.get(`${BASE_URL}/unread-count`);
        return response.count || 0;
    },

    getStats: async (): Promise<NotificationStats> => {
        const response = await api.get(`${BASE_URL}/stats`);
        return response.data?.data || { total: 0, unread: 0, byType: {} };
    },
};