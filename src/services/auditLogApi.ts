// src/services/auditLogApi.ts

import api from '@/lib/api';
import {
    AuditLog,
    AuditLogFilters,
    PaginatedAuditLogs,
    AuditLogStats,
} from '@/types/auditLog';

const BASE_URL = '/audit-logs';

const transformAuditLog = (log: any): AuditLog => ({
    id: log.id,
    churchId: log.church_id || log.churchId,
    userId: log.user_id || log.userId,
    userEmail: log.user_email || log.userEmail,
    userName: log.user_name || log.userName,
    action: log.action,
    actionType: log.action_type || log.actionType,
    description: log.description,
    entityType: log.entity_type || log.entityType,
    entityId: log.entity_id || log.entityId,
    entityName: log.entity_name || log.entityName,
    oldValues: log.old_values || log.oldValues,
    newValues: log.new_values || log.newValues,
    changes: log.changes,
    ipAddress: log.ip_address || log.ipAddress,
    userAgent: log.user_agent || log.userAgent,
    requestMethod: log.request_method || log.requestMethod,
    requestPath: log.request_path || log.requestPath,
    metadata: log.metadata || {},
    status: log.status,
    errorMessage: log.error_message || log.errorMessage,
    createdAt: log.created_at || log.createdAt,
});

export const auditLogApi = {
    getLogs: async (filters: AuditLogFilters = {}): Promise<PaginatedAuditLogs> => {
        const params = new URLSearchParams();

        if (filters.userId) params.append('userId', filters.userId);
        if (filters.action) params.append('action', String(filters.action));
        if (filters.actionType) params.append('actionType', String(filters.actionType));
        if (filters.entityType) params.append('entityType', filters.entityType);
        if (filters.entityId) params.append('entityId', filters.entityId);
        if (filters.status) params.append('status', filters.status);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.search) params.append('search', filters.search);
        if (filters.page) params.append('page', String(filters.page));
        if (filters.limit) params.append('limit', String(filters.limit));
        if (filters.sortBy) params.append('sortBy', filters.sortBy);
        if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

        const response = await api.get(`${BASE_URL}?${params.toString()}`);
        const data = response || response.data;

        return {
            logs: (data.logs || []).map(transformAuditLog),
            pagination: data.pagination || { total: 0, page: 1, limit: 50, totalPages: 0 },
        };
    },

    getLogById: async (id: string): Promise<AuditLog> => {
        const response = await api.get(`${BASE_URL}/${id}`);
        return transformAuditLog(response.data?.data || response.data);
    },

    getStats: async (): Promise<AuditLogStats> => {
        const response = await api.get(`${BASE_URL}/stats`);
        console.log(response);
        const data = response || response.data;
        return {
            totalLogs: data.totalLogs || 0,
            todayLogs: data.todayLogs || 0,
            byAction: data.byAction || {},
            byActionType: data.byActionType || {},
            byUser: data.byUser || [],
            recentActivity: (data.recentActivity || []).map(transformAuditLog),
        };
    },

    getEntityHistory: async (entityType: string, entityId: string): Promise<AuditLog[]> => {
        const response = await api.get(`${BASE_URL}/entity/${entityType}/${entityId}`);
        const data = response.data?.data || response.data;
        return (Array.isArray(data) ? data : []).map(transformAuditLog);
    },
};