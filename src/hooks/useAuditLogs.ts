// src/hooks/useAuditLogs.ts

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditLogApi } from '@/services/auditLogApi';
import { AuditLogFilters } from '@/types/auditLog';

export function useAuditLogs(initialFilters: AuditLogFilters = {}) {
    const [filters, setFilters] = useState<AuditLogFilters>(initialFilters);

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['audit-logs', filters],
        queryFn: () => auditLogApi.getLogs(filters),
        staleTime: 60 * 1000,
    });

    return {
        logs: data?.logs || [],
        pagination: data?.pagination,
        isLoading,
        error,
        filters,
        setFilters,
        refetch,
    };
}

export function useAuditLogStats() {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['audit-log-stats'],
        queryFn: auditLogApi.getStats,
        staleTime: 5 * 60 * 1000,
    });

    return {
        stats: data,
        isLoading,
        error,
        refetch,
    };
}

export function useEntityHistory(entityType: string, entityId: string) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['entity-history', entityType, entityId],
        queryFn: () => auditLogApi.getEntityHistory(entityType, entityId),
        enabled: !!entityType && !!entityId,
    });

    return {
        history: data || [],
        isLoading,
        error,
    };
}