// src/hooks/useNotifications.ts

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { notificationApi } from '@/services/notificationApi';
import { NotificationFilters } from '@/types/notification';

export function useNotifications(initialFilters: NotificationFilters = {}) {
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState<NotificationFilters>(initialFilters);

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['notifications', filters],
        queryFn: () => notificationApi.getNotifications(filters),
        staleTime: 30 * 1000, // 30 seconds
    });

    const markAsReadMutation = useMutation({
        mutationFn: notificationApi.markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notification-count'] });
        },
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: notificationApi.markAllAsRead,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notification-count'] });
            toast.success(`Marked ${data.count} notifications as read`);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: notificationApi.deleteNotification,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notification-count'] });
            toast.success('Notification deleted');
        },
    });

    return {
        notifications: data?.notifications || [],
        pagination: data?.pagination,
        unreadCount: data?.unreadCount || 0,
        isLoading,
        error,
        filters,
        setFilters,
        refetch,
        markAsRead: markAsReadMutation.mutateAsync,
        markAllAsRead: markAllAsReadMutation.mutateAsync,
        deleteNotification: deleteMutation.mutateAsync,
    };
}

export function useUnreadNotificationCount() {
    const { data, isLoading } = useQuery({
        queryKey: ['notification-count'],
        queryFn: notificationApi.getUnreadCount,
        staleTime: 30 * 1000,
        refetchInterval: 60 * 1000, // Refetch every minute
    });

    return { count: data || 0, isLoading };
}

export function useNotificationStats() {
    const { data, isLoading } = useQuery({
        queryKey: ['notification-stats'],
        queryFn: notificationApi.getStats,
    });

    return { stats: data, isLoading };
}