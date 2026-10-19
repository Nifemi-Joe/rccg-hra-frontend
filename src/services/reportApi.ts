// src/services/reportApi.ts

import api from '@/lib/api';
import {
    ReportFilters,
    DashboardStats,
    AttendanceTrendReport,
    MemberGrowthReport,
    FirstTimerConversionReport,
    FinancialSummaryReport,
    EventPerformanceReport,
    InactiveMemberReport,
    FamilyAttendanceReport,
    FullReport,
} from '@/types/report';

const BASE_URL = '/reports';

const extractData = (response: any): any => {
    if (response?.data?.data) return response.data.data;
    if (response?.data) return response.data;
    return response;
};

const buildQueryParams = (filters: ReportFilters): string => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.granularity) params.append('granularity', filters.granularity);
    if (filters.eventType) params.append('event_type', filters.eventType);
    if (filters.eventId) params.append('event_id', filters.eventId);
    return params.toString();
};

export const reportApi = {
    getDashboardStats: async (): Promise<DashboardStats> => {
        const response = await api.get(`${BASE_URL}/dashboard`);
        return extractData(response);
    },

    getAttendanceTrends: async (filters: ReportFilters = {}): Promise<AttendanceTrendReport[]> => {
        const queryString = buildQueryParams(filters);
        const response = await api.get(`${BASE_URL}/attendance-trends?${queryString}`);
        return extractData(response) || [];
    },

    getMemberGrowth: async (filters: ReportFilters = {}): Promise<MemberGrowthReport[]> => {
        const queryString = buildQueryParams(filters);
        const response = await api.get(`${BASE_URL}/member-growth?${queryString}`);
        return extractData(response) || [];
    },

    getFirstTimerConversion: async (filters: ReportFilters = {}): Promise<FirstTimerConversionReport[]> => {
        const queryString = buildQueryParams(filters);
        const response = await api.get(`${BASE_URL}/first-timer-conversion?${queryString}`);
        return extractData(response) || [];
    },

    getFinancialSummary: async (filters: ReportFilters = {}): Promise<FinancialSummaryReport[]> => {
        const queryString = buildQueryParams(filters);
        const response = await api.get(`${BASE_URL}/financial-summary?${queryString}`);
        return extractData(response) || [];
    },

    getEventPerformance: async (filters: ReportFilters = {}): Promise<EventPerformanceReport[]> => {
        const queryString = buildQueryParams(filters);
        const response = await api.get(`${BASE_URL}/event-performance?${queryString}`);
        return extractData(response) || [];
    },

    getInactiveMembers: async (daysThreshold: number = 30): Promise<InactiveMemberReport[]> => {
        const response = await api.get(`${BASE_URL}/inactive-members?days=${daysThreshold}`);
        return extractData(response) || [];
    },

    getFamilyAttendance: async (filters: ReportFilters = {}): Promise<FamilyAttendanceReport[]> => {
        const queryString = buildQueryParams(filters);
        const response = await api.get(`${BASE_URL}/family-attendance?${queryString}`);
        return extractData(response) || [];
    },

    getFullReport: async (filters: ReportFilters = {}): Promise<FullReport> => {
        const queryString = buildQueryParams(filters);
        const response = await api.get(`${BASE_URL}/full?${queryString}`);
        return extractData(response);
    },
};