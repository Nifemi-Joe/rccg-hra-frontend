// src/types/auditLog.ts

export type AuditAction =
    | 'create'
    | 'update'
    | 'delete'
    | 'view'
    | 'login'
    | 'logout'
    | 'import'
    | 'export'
    | 'checkin'
    | 'checkout'
    | 'convert'
    | 'assign'
    | 'unassign'
    | 'approve'
    | 'reject'
    | 'send'
    | 'receive';

export type AuditActionType =
    | 'auth'
    | 'member'
    | 'first_timer'
    | 'family'
    | 'event'
    | 'attendance'
    | 'financial'
    | 'offering'
    | 'expense'
    | 'staff'
    | 'settings'
    | 'report'
    | 'notification'
    | 'system';

export type AuditStatus = 'success' | 'failure' | 'pending';

export interface AuditLog {
    id: string;
    churchId: string;
    userId?: string;
    userEmail?: string;
    userName?: string;
    action: AuditAction;
    actionType: AuditActionType;
    description?: string;
    entityType: string;
    entityId?: string;
    entityName?: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    changes?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    requestMethod?: string;
    requestPath?: string;
    metadata?: Record<string, any>;
    status: AuditStatus;
    errorMessage?: string;
    createdAt: string;
}

export interface AuditLogFilters {
    userId?: string;
    action?: AuditAction | AuditAction[];
    actionType?: AuditActionType | AuditActionType[];
    entityType?: string;
    entityId?: string;
    status?: AuditStatus;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedAuditLogs {
    logs: AuditLog[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface AuditLogStats {
    totalLogs: number;
    todayLogs: number;
    byAction: Record<string, number>;
    byActionType: Record<string, number>;
    byUser: Array<{ userId: string; userName: string; count: number }>;
    recentActivity: AuditLog[];
}