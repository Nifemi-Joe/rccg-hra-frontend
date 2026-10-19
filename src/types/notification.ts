// src/types/notification.ts

export type NotificationType =
    | 'member_added'
    | 'member_imported'
    | 'members_bulk_imported'
    | 'first_timer_added'
    | 'first_timer_converted'
    | 'offering_recorded'
    | 'expense_recorded'
    | 'event_created'
    | 'event_checkin'
    | 'attendance_recorded'
    | 'staff_added'
    | 'staff_removed'
    | 'password_changed'
    | 'profile_updated'
    | 'family_created'
    | 'system_alert'
    | 'reminder';

export interface Notification {
    id: string;
    churchId: string;
    userId?: string;
    type: NotificationType;
    title: string;
    message: string;
    actionType?: string;
    actionUrl?: string;
    entityType?: string;
    entityId?: string;
    data: Record<string, any>;
    isRead: boolean;
    readAt?: string;
    actorId?: string;
    actorName?: string;
    createdAt: string;
    updatedAt: string;
}

export interface NotificationFilters {
    type?: NotificationType | NotificationType[];
    isRead?: boolean;
    entityType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}

export interface PaginatedNotifications {
    notifications: Notification[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    unreadCount: number;
}

export interface NotificationStats {
    total: number;
    unread: number;
    byType: Record<string, number>;
}