// src/services/whatsappApi.ts
import api from '@/lib/api';

// ============================================================================
// TYPES
// ============================================================================

export interface WhatsAppStats {
    totalSent: number;
    totalDelivered: number;
    totalRead: number;
    totalFailed: number;
    activeConversations: number;
}

export interface WhatsAppMessage {
    id: string;
    church_id: string;
    recipient: string;
    recipient_name?: string;
    message: string;
    template_id?: string;
    template_name?: string;
    media_url?: string;
    media_type?: 'image' | 'video' | 'document' | 'audio';
    status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
    error_message?: string;
    sent_at?: string;
    delivered_at?: string;
    read_at?: string;
    created_at: string;
    updated_at: string;
}

export interface WhatsAppTemplate {
    id: string;
    church_id: string;
    name: string;
    content: string;
    category?: string;
    language?: string;
    variables?: string[];
    status: 'draft' | 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
}

export interface WhatsAppDraft {
    id: string;
    church_id: string;
    recipients: string[];
    message: string;
    template_id?: string;
    media_url?: string;
    media_type?: string;
    created_at: string;
    updated_at: string;
}

export interface WhatsAppScheduled {
    id: string;
    church_id: string;
    recipients: string[];
    message: string;
    template_id?: string;
    media_url?: string;
    media_type?: string;
    scheduled_at: string;
    status: 'scheduled' | 'processing' | 'completed' | 'cancelled';
    created_at: string;
    updated_at: string;
}

export interface SendWhatsAppDTO {
    recipients: string[];
    message: string;
    templateId?: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video' | 'document' | 'audio';
    scheduledAt?: string;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface WhatsAppStatsResponse {
    success: boolean;
    data: WhatsAppStats;
}

export interface WhatsAppMessagesResponse {
    success: boolean;
    data: WhatsAppMessage[];
    pagination?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface WhatsAppMessageResponse {
    success: boolean;
    data: WhatsAppMessage;
}

export interface WhatsAppTemplatesResponse {
    success: boolean;
    data: WhatsAppTemplate[];
}

export interface WhatsAppTemplateResponse {
    success: boolean;
    data: WhatsAppTemplate;
}

export interface WhatsAppDraftsResponse {
    success: boolean;
    data: WhatsAppDraft[];
}

export interface WhatsAppDraftResponse {
    success: boolean;
    data: WhatsAppDraft;
}

export interface WhatsAppScheduledResponse {
    success: boolean;
    data: WhatsAppScheduled[];
}

export interface WhatsAppScheduledItemResponse {
    success: boolean;
    data: WhatsAppScheduled;
}

export interface SendWhatsAppResponse {
    success: boolean;
    message: string;
    data: {
        messageId: string;
        recipientCount: number;
        unitsUsed: number;
    };
}

// ============================================================================
// API
// ============================================================================

export const whatsappApi = {
    // Stats
    getStats: async (): Promise<WhatsAppStatsResponse> => {
        const { data } = await api.get<WhatsAppStatsResponse>('/whatsapp/stats');
        return data;
    },

    // Send message
    send: async (payload: SendWhatsAppDTO): Promise<SendWhatsAppResponse> => {
        const { data } = await api.post<SendWhatsAppResponse>('/whatsapp/send', payload);
        return data;
    },

    // Sent messages
    getSentMessages: async (params?: {
        page?: number;
        limit?: number;
        status?: string;
        search?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<WhatsAppMessagesResponse> => {
        const { data } = await api.get<WhatsAppMessagesResponse>('/whatsapp/sent', { params });
        return data;
    },

    getMessageById: async (id: string): Promise<WhatsAppMessageResponse> => {
        const { data } = await api.get<WhatsAppMessageResponse>(`/whatsapp/messages/${id}`);
        return data;
    },

    // Templates
    getTemplates: async (): Promise<WhatsAppTemplatesResponse> => {
        const { data } = await api.get<WhatsAppTemplatesResponse>('/whatsapp/templates');
        return data;
    },

    getTemplateById: async (id: string): Promise<WhatsAppTemplateResponse> => {
        const { data } = await api.get<WhatsAppTemplateResponse>(`/whatsapp/templates/${id}`);
        return data;
    },

    createTemplate: async (template: {
        name: string;
        content: string;
        category?: string;
        language?: string;
        variables?: string[];
    }): Promise<WhatsAppTemplateResponse> => {
        const { data } = await api.post<WhatsAppTemplateResponse>('/whatsapp/templates', template);
        return data;
    },

    updateTemplate: async (
        id: string,
        template: Partial<{
            name: string;
            content: string;
            category: string;
            language: string;
            variables: string[];
        }>
    ): Promise<WhatsAppTemplateResponse> => {
        const { data } = await api.put<WhatsAppTemplateResponse>(`/whatsapp/templates/${id}`, template);
        return data;
    },

    deleteTemplate: async (id: string): Promise<{ success: boolean; message: string }> => {
        const { data } = await api.delete(`/whatsapp/templates/${id}`);
        return data;
    },

    // Drafts
    getDrafts: async (): Promise<WhatsAppDraftsResponse> => {
        const { data } = await api.get<WhatsAppDraftsResponse>('/whatsapp/drafts');
        return data;
    },

    getDraftById: async (id: string): Promise<WhatsAppDraftResponse> => {
        const { data } = await api.get<WhatsAppDraftResponse>(`/whatsapp/drafts/${id}`);
        return data;
    },

    saveDraft: async (draft: {
        recipients: string[];
        message: string;
        templateId?: string;
        mediaUrl?: string;
        mediaType?: string;
    }): Promise<WhatsAppDraftResponse> => {
        const { data } = await api.post<WhatsAppDraftResponse>('/whatsapp/drafts', draft);
        return data;
    },

    updateDraft: async (
        id: string,
        draft: Partial<{
            recipients: string[];
            message: string;
            templateId: string;
            mediaUrl: string;
            mediaType: string;
        }>
    ): Promise<WhatsAppDraftResponse> => {
        const { data } = await api.put<WhatsAppDraftResponse>(`/whatsapp/drafts/${id}`, draft);
        return data;
    },

    deleteDraft: async (id: string): Promise<{ success: boolean; message: string }> => {
        const { data } = await api.delete(`/whatsapp/drafts/${id}`);
        return data;
    },

    sendDraft: async (id: string): Promise<SendWhatsAppResponse> => {
        const { data } = await api.post<SendWhatsAppResponse>(`/whatsapp/drafts/${id}/send`);
        return data;
    },

    // Scheduled
    getScheduled: async (): Promise<WhatsAppScheduledResponse> => {
        const { data } = await api.get<WhatsAppScheduledResponse>('/whatsapp/scheduled');
        return data;
    },

    getScheduledById: async (id: string): Promise<WhatsAppScheduledItemResponse> => {
        const { data } = await api.get<WhatsAppScheduledItemResponse>(`/whatsapp/scheduled/${id}`);
        return data;
    },

    cancelScheduled: async (id: string): Promise<{ success: boolean; message: string }> => {
        const { data } = await api.post(`/whatsapp/scheduled/${id}/cancel`);
        return data;
    },

    reschedule: async (
        id: string,
        scheduledAt: string
    ): Promise<WhatsAppScheduledItemResponse> => {
        const { data } = await api.put<WhatsAppScheduledItemResponse>(`/whatsapp/scheduled/${id}`, {
            scheduledAt,
        });
        return data;
    },
};