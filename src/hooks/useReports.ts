// src/hooks/useReports.ts

import { useQuery } from '@tanstack/react-query';
import { reportApi } from '@/services/reportApi';
import { ReportFilters } from '@/types/report';

export const useDashboardStats = () => {
    const query = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: reportApi.getDashboardStats,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    return {
        stats: query.data,
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
};

export const useAttendanceTrends = (filters: ReportFilters = {}) => {
    const query = useQuery({
        queryKey: ['attendance-trends', filters],
        queryFn: () => reportApi.getAttendanceTrends(filters),
        staleTime: 5 * 60 * 1000,
    });

    return {
        trends: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
};

export const useMemberGrowth = (filters: ReportFilters = {}) => {
    const query = useQuery({
        queryKey: ['member-growth', filters],
        queryFn: () => reportApi.getMemberGrowth(filters),
        staleTime: 5 * 60 * 1000,
    });

    return {
        growth: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
};

export const useFirstTimerConversion = (filters: ReportFilters = {}) => {
    const query = useQuery({
        queryKey: ['first-timer-conversion', filters],
        queryFn: () => reportApi.getFirstTimerConversion(filters),
        staleTime: 5 * 60 * 1000,
    });

    return {
        conversion: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
};

export const useFinancialSummary = (filters: ReportFilters = {}) => {
    const query = useQuery({
        queryKey: ['financial-summary-report', filters],
        queryFn: () => reportApi.getFinancialSummary(filters),
        staleTime: 5 * 60 * 1000,
    });

    return {
        summary: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
};

export const useEventPerformance = (filters: ReportFilters = {}) => {
    const query = useQuery({
        queryKey: ['event-performance', filters],
        queryFn: () => reportApi.getEventPerformance(filters),
        staleTime: 5 * 60 * 1000,
    });

    return {
        events: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
};

export const useInactiveMembers = (daysThreshold: number = 30) => {
    const query = useQuery({
        queryKey: ['inactive-members', daysThreshold],
        queryFn: () => reportApi.getInactiveMembers(daysThreshold),
        staleTime: 5 * 60 * 1000,
    });

    return {
        members: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
};

export const useFamilyAttendance = (filters: ReportFilters = {}) => {
    const query = useQuery({
        queryKey: ['family-attendance', filters],
        queryFn: () => reportApi.getFamilyAttendance(filters),
        staleTime: 5 * 60 * 1000,
    });

    return {
        families: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
};

export const useFullReport = (filters: ReportFilters = {}) => {
    const query = useQuery({
        queryKey: ['full-report', filters],
        queryFn: () => reportApi.getFullReport(filters),
        staleTime: 10 * 60 * 1000, // 10 minutes for full report
    });

    return {
        report: query.data,
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
};