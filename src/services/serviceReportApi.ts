// src/services/serviceReportApi.ts

import api from '@/lib/api';
import {
    ServiceReport,
    CreateServiceReportDTO,
    UpdateServiceReportDTO,
    ServiceReportFilters,
    ServiceReportSummary
} from '@/types/serviceReport';

const BASE_URL = '/service-reports';

// Helper to format date to yyyy-MM-dd
const formatDateForInput = (date: string | Date | undefined): string => {
    if (!date) return '';
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().split('T')[0];
    } catch {
        return '';
    }
};

// Helper to transform snake_case to camelCase
const transformReport = (report: any): ServiceReport => ({
    id: report.id,
    church_id: report.church_id || report.churchId,
    event_instance_id: report.event_instance_id || report.eventInstanceId,
    event_name: report.event_name || report.eventName,
    service_date: new Date(report.service_date || report.serviceDate),
    preacher: report.preacher,
    sermon_title: report.sermon_title || report.sermonTitle,
    sermon_notes: report.sermon_notes || report.sermonNotes,

    attendance_men: parseInt(report.attendance_men || report.attendanceMen || 0),
    attendance_women: parseInt(report.attendance_women || report.attendanceWomen || 0),
    attendance_children: parseInt(report.attendance_children || report.attendanceChildren || 0),
    total_attendance: parseInt(report.total_attendance || report.totalAttendance || 0),
    first_timers: parseInt(report.first_timers || report.firstTimers || 0),
    new_comers: parseInt(report.new_comers || report.newComers || 0),

    offerings: parseFloat(report.offerings || 0),
    tithes: parseFloat(report.tithes || 0),
    donations: parseFloat(report.donations || 0),
    other_income: parseFloat(report.other_income || report.otherIncome || 0),
    total_income: parseFloat(report.total_income || report.totalIncome || 0),
    expenses: parseFloat(report.expenses || 0),
    net_income: parseFloat(report.net_income || report.netIncome || 0),

    cash_amount: parseFloat(report.cash_amount || report.cashAmount || 0),
    bank_transfer_amount: parseFloat(report.bank_transfer_amount || report.bankTransferAmount || 0),
    card_amount: parseFloat(report.card_amount || report.cardAmount || 0),
    mobile_money_amount: parseFloat(report.mobile_money_amount || report.mobileMoneyAmount || 0),

    notes: report.notes,
    recorded_by: report.recorded_by || report.recordedBy,
    recorded_by_name: report.recorded_by_name || report.recordedByName,
    event_type_name: report.event_type_name || report.eventTypeName,
    event_id: report.event_id || report.eventId,
    created_at: new Date(report.created_at || report.createdAt),
    updated_at: new Date(report.updated_at || report.updatedAt),
});

// Helper to extract data from response
const extractData = (response: any): any => {
    if (response?.data?.data) return response.data.data;
    if (response?.data) return response.data;
    return response;
};

export const serviceReportApi = {
    /**
     * Create a new service report
     */
    createReport: async (data: CreateServiceReportDTO): Promise<ServiceReport> => {
        const response = await api.post(BASE_URL, data);
        return transformReport(extractData(response));
    },

    /**
     * Get all service reports with optional filters
     */
    getAllReports: async (filters: ServiceReportFilters = {}): Promise<ServiceReport[]> => {
        const params = new URLSearchParams();

        if (filters.start_date) params.append('start_date', filters.start_date);
        if (filters.end_date) params.append('end_date', filters.end_date);
        if (filters.event_id) params.append('event_id', filters.event_id);
        if (filters.preacher) params.append('preacher', filters.preacher);

        const response = await api.get(`${BASE_URL}?${params.toString()}`);
        const data = extractData(response);
        const reports = Array.isArray(data) ? data : (data?.reports || []);

        return reports.map(transformReport);
    },

    /**
     * Get a single service report by ID
     */
    getReportById: async (id: string): Promise<ServiceReport> => {
        const response = await api.get(`${BASE_URL}/${id}`);
        return transformReport(extractData(response));
    },

    /**
     * Update a service report
     */
    updateReport: async (id: string, data: UpdateServiceReportDTO): Promise<ServiceReport> => {
        const response = await api.put(`${BASE_URL}/${id}`, data);
        return transformReport(extractData(response));
    },

    /**
     * Delete a service report
     */
    deleteReport: async (id: string): Promise<void> => {
        await api.delete(`${BASE_URL}/${id}`);
    },

    /**
     * Get service report summary/statistics
     */
    getSummary: async (startDate?: string, endDate?: string): Promise<ServiceReportSummary> => {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);

        const response = await api.get(`${BASE_URL}/summary?${params.toString()}`);
        const data = extractData(response);

        return {
            total_reports: parseInt(data.total_reports || data.totalReports || 0),
            average_attendance: parseInt(data.average_attendance || data.averageAttendance || 0),
            total_income: parseFloat(data.total_income || data.totalIncome || 0),
            total_first_timers: parseInt(data.total_first_timers || data.totalFirstTimers || 0),
            average_men: parseInt(data.average_men || data.averageMen || 0),
            average_women: parseInt(data.average_women || data.averageWomen || 0),
            average_children: parseInt(data.average_children || data.averageChildren || 0),
        };
    },

    /**
     * Get all reports for a specific event
     */
    getReportsByEvent: async (eventId: string): Promise<ServiceReport[]> => {
        const response = await api.get(`${BASE_URL}/event/${eventId}`);
        const data = extractData(response);
        const reports = Array.isArray(data) ? data : (data?.reports || []);

        return reports.map(transformReport);
    },

    /**
     * Get report for a specific event instance
     */
    getReportByInstance: async (instanceId: string): Promise<ServiceReport | null> => {
        try {
            const response = await api.get(`${BASE_URL}/instance/${instanceId}`);
            return transformReport(extractData(response));
        } catch (error: any) {
            if (error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    },
};