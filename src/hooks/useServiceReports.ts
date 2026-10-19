// src/hooks/useServiceReports.ts

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { serviceReportApi } from '@/services/serviceReportApi';
import {
    ServiceReport,
    CreateServiceReportDTO,
    UpdateServiceReportDTO,
    ServiceReportFilters,
} from '@/types/serviceReport';

/**
 * Hook for managing service reports
 */
export function useServiceReports(initialFilters: ServiceReportFilters = {}) {
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState<ServiceReportFilters>(initialFilters);

    // Fetch all reports
    const {
        data: reports = [],
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ['service-reports', filters],
        queryFn: () => serviceReportApi.getAllReports(filters),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });

    // Create report mutation
    const createMutation = useMutation({
        mutationFn: serviceReportApi.createReport,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['service-reports'] });
            queryClient.invalidateQueries({ queryKey: ['service-report-summary'] });
            queryClient.invalidateQueries({ queryKey: ['events'] });
            queryClient.invalidateQueries({ queryKey: ['event-instances'] });
            toast.success('Service report created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create service report');
        },
    });

    // Update report mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateServiceReportDTO }) =>
            serviceReportApi.updateReport(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['service-reports'] });
            queryClient.invalidateQueries({ queryKey: ['service-report-summary'] });
            toast.success('Service report updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update service report');
        },
    });

    // Delete report mutation
    const deleteMutation = useMutation({
        mutationFn: serviceReportApi.deleteReport,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['service-reports'] });
            queryClient.invalidateQueries({ queryKey: ['service-report-summary'] });
            toast.success('Service report deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete service report');
        },
    });

    const updateFilters = useCallback((newFilters: Partial<ServiceReportFilters>) => {
        setFilters((prev) => ({ ...prev, ...newFilters }));
    }, []);

    return {
        reports,
        isLoading,
        error,
        filters,
        setFilters: updateFilters,
        refetch,
        createReport: createMutation.mutateAsync,
        updateReport: updateMutation.mutateAsync,
        deleteReport: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}

/**
 * Hook for fetching a single service report
 */
export function useServiceReport(reportId: string | null) {
    const { data: report, isLoading, error, refetch } = useQuery({
        queryKey: ['service-report', reportId],
        queryFn: () => (reportId ? serviceReportApi.getReportById(reportId) : null),
        enabled: !!reportId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    return {
        report,
        isLoading,
        error,
        refetch,
    };
}

/**
 * Hook for fetching service report summary
 */
export function useServiceReportSummary(startDate?: string, endDate?: string) {
    const { data: summary, isLoading, error, refetch } = useQuery({
        queryKey: ['service-report-summary', startDate, endDate],
        queryFn: () => serviceReportApi.getSummary(startDate, endDate),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    return {
        summary,
        isLoading,
        error,
        refetch,
    };
}

/**
 * Hook for fetching reports by event
 */
export function useServiceReportsByEvent(eventId: string | null) {
    const { data: reports = [], isLoading, error, refetch } = useQuery({
        queryKey: ['service-reports', 'event', eventId],
        queryFn: () => (eventId ? serviceReportApi.getReportsByEvent(eventId) : []),
        enabled: !!eventId,
        staleTime: 2 * 60 * 1000,
    });

    return {
        reports,
        isLoading,
        error,
        refetch,
    };
}

/**
 * Hook for fetching report by event instance
 */
export function useServiceReportByInstance(instanceId: string | null) {
    const { data: report, isLoading, error, refetch } = useQuery({
        queryKey: ['service-report', 'instance', instanceId],
        queryFn: () => (instanceId ? serviceReportApi.getReportByInstance(instanceId) : null),
        enabled: !!instanceId,
        staleTime: 2 * 60 * 1000,
    });

    return {
        report,
        isLoading,
        error,
        refetch,
    };
}