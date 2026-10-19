// src/services/supportApi.ts

import api from '@/lib/api';
import {
    SupportTicket,
    CreateTicketDTO,
    TicketMessage,
    FAQ,
} from '@/types/support';

const BASE_URL = '/support';

const transformTicket = (t: any): SupportTicket => ({
    id: t.id,
    churchId: t.church_id || t.churchId,
    userId: t.user_id || t.userId,
    ticketNumber: t.ticket_number || t.ticketNumber,
    subject: t.subject,
    description: t.description,
    category: t.category,
    priority: t.priority,
    status: t.status,
    contactEmail: t.contact_email || t.contactEmail,
    contactName: t.contact_name || t.contactName,
    contactPhone: t.contact_phone || t.contactPhone,
    assignedTo: t.assigned_to || t.assignedTo,
    resolvedAt: t.resolved_at || t.resolvedAt,
    resolutionNotes: t.resolution_notes || t.resolutionNotes,
    attachments: t.attachments || [],
    createdAt: t.created_at || t.createdAt,
    updatedAt: t.updated_at || t.updatedAt,
});

const transformMessage = (m: any): TicketMessage => ({
    id: m.id,
    ticketId: m.ticket_id || m.ticketId,
    userId: m.user_id || m.userId,
    message: m.message,
    isStaffReply: m.is_staff_reply ?? m.isStaffReply ?? false,
    attachments: m.attachments || [],
    createdAt: m.created_at || m.createdAt,
    firstName: m.first_name || m.firstName,
    lastName: m.last_name || m.lastName,
    userEmail: m.user_email || m.userEmail,
});

export const supportApi = {
    createTicket: async (data: CreateTicketDTO): Promise<SupportTicket> => {
        const response = await api.post(`${BASE_URL}/tickets`, data);
        return transformTicket(response.data?.data || response.data);
    },

    getTickets: async (filters: any = {}): Promise<{ tickets: SupportTicket[]; pagination: any }> => {
        const params = new URLSearchParams();

        if (filters.status) params.append('status', filters.status);
        if (filters.category) params.append('category', filters.category);
        if (filters.priority) params.append('priority', filters.priority);
        if (filters.search) params.append('search', filters.search);
        if (filters.page) params.append('page', String(filters.page));
        if (filters.limit) params.append('limit', String(filters.limit));

        const response = await api.get(`${BASE_URL}/tickets?${params.toString()}`);
        const data = response.data?.data || response.data;

        return {
            tickets: (data.tickets || []).map(transformTicket),
            pagination: data.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 },
        };
    },

    getTicketById: async (id: string): Promise<SupportTicket> => {
        const response = await api.get(`${BASE_URL}/tickets/${id}`);
        return transformTicket(response.data?.data || response.data);
    },

    updateTicket: async (id: string, data: any): Promise<SupportTicket> => {
        const response = await api.patch(`${BASE_URL}/tickets/${id}`, data);
        return transformTicket(response.data?.data || response.data);
    },

    addMessage: async (ticketId: string, message: string): Promise<TicketMessage> => {
        const response = await api.post(`${BASE_URL}/tickets/${ticketId}/messages`, { message });
        return transformMessage(response.data?.data || response.data);
    },

    getTicketMessages: async (ticketId: string): Promise<TicketMessage[]> => {
        const response = await api.get(`${BASE_URL}/tickets/${ticketId}/messages`);
        const data = response.data?.data || response.data;
        return (Array.isArray(data) ? data : []).map(transformMessage);
    },

    getFAQs: async (): Promise<FAQ[]> => {
        const response = await api.get(`${BASE_URL}/faqs`);
        return response.data?.data || [];
    },
};