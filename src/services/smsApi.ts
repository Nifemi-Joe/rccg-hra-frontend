import api from '@/lib/api';

// ============================================================================
// TYPES
// ============================================================================

export interface SmsSenderId {
    id: string;
    sender_id: string;
    provider_sender_id?: string;
    status: 'pending' | 'verified' | 'approved' | 'rejected';
    verification_status?: string;
    rejection_reason?: string;
    use_case?: string;
    is_default: boolean;
    metadata?: any;
    created_at: string;
    updated_at: string;
}

export interface SmsBalance {
    id: string;
    church_id: string;
    units: number;
    last_updated: string;
}

export interface SmsTransaction {
    id: string;
    type: 'purchase' | 'usage' | 'refund' | 'bonus';
    units: number;
    balance_after: number;
    description?: string;
    amount?: number;
    payment_method?: string;
    payment_reference?: string;
    created_at: string;
}

export interface SmsCampaign {
    id: string;
    church_id: string;
    name?: string;
    message: string;
    sender_id?: string;
    destination_type: 'all_contacts' | 'groups' | 'members' | 'phone_numbers' | 'uploaded';
    group_ids?: string[];
    member_ids?: string[];
    phone_numbers?: string[];
    uploaded_contacts?: Array<{ phone: string; name?: string }>;
    contact_list_ids?: string[];
    status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'partial' | 'failed' | 'cancelled';
    scheduled_at?: string;
    sent_at?: string;
    total_recipients: number;
    successful_count: number;
    failed_count: number;
    units_used: number;
    error_message?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

export interface SmsMessage {
    id: string;
    campaign_id?: string;
    phone_number: string;
    recipient_name?: string;
    message: string;
    sender_id?: string;
    direction?: 'outbound' | 'inbound';
    status: 'pending' | 'sent' | 'delivered' | 'failed' | 'rejected';
    delivery_status?: string;
    provider_message_id?: string;
    error_message?: string;
    units: number;
    sent_at?: string;
    delivered_at?: string;
    created_at: string;
}

export interface SmsReply {
    id: string;
    church_id: string;
    original_message_id?: string;
    phone_number: string;
    sender_name?: string;
    message: string;
    is_read: boolean;
    received_at: string;
}

export interface SmsContactList {
    id: string;
    name: string;
    description?: string;
    contact_count: number;
    created_at: string;
    updated_at: string;
}

export interface SmsContactListItem {
    id: string;
    list_id: string;
    phone_number: string;
    name?: string;
    custom_fields?: any;
    created_at: string;
}

export interface SmsStats {
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    unitsUsed: number;
    unitsRemaining: number;
    repliesCount: number;
    unreadReplies: number;
}

export interface UploadedContact {
    phone: string;
    name?: string;
}

export interface ComposeSmsData {
    destinationType: 'all_contacts' | 'groups' | 'members' | 'phone_numbers' | 'uploaded';
    groupIds?: string[];
    memberIds?: string[];
    phoneNumbers?: string[];
    uploadedContacts?: UploadedContact[];
    contactListIds?: string[];
    senderId?: string;
    message: string;
    sendOption: 'now' | 'schedule' | 'draft';
    scheduledAt?: string;
    name?: string;
}

export interface CampaignReport {
    campaign: SmsCampaign;
    messages: SmsMessage[];
    stats: {
        total: number;
        sent: number;
        delivered: number;
        failed: number;
        pending: number;
        unitsUsed: number;
    };
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ============================================================================
// Helper: Extract data from backend response
//
// Your api interceptor already unwraps Axios response (response.data),
// so we receive the backend's response object: { success, data, message, ... }
// Sometimes it returns the data directly (array), sometimes wrapped.
// This helper normalizes it.
// ============================================================================

function extractData<T>(response: any): T {
    // If response has a 'data' property with the actual payload, unwrap it
    if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
        return response.data as T;
    }
    // Otherwise response IS the data (interceptor fully unwrapped it)
    return response as T;
}

function extractPaginated<T>(response: any): PaginatedResult<T> {
    // Case 1: response = { success, data: { data: [...], total, page, ... } }
    if (response?.data?.data && Array.isArray(response.data.data)) {
        return {
            data: response.data.data,
            total: response.data.total || response.data.data.length,
            page: response.data.page || 1,
            limit: response.data.limit || 20,
            totalPages: response.data.totalPages || 1,
        };
    }

    // Case 2: response = { success, data: [...], pagination: { ... } }
    if (response?.data && Array.isArray(response.data)) {
        return {
            data: response.data,
            total: response.pagination?.total || response.total || response.data.length,
            page: response.pagination?.page || response.page || 1,
            limit: response.pagination?.limit || response.limit || 20,
            totalPages: response.pagination?.totalPages || response.totalPages || 1,
        };
    }

    // Case 3: response = { data: [...], total, page, totalPages }
    if (response?.data && Array.isArray(response.data)) {
        return {
            data: response.data,
            total: response.total || response.data.length,
            page: response.page || 1,
            limit: response.limit || 20,
            totalPages: response.totalPages || 1,
        };
    }

    // Case 4: response IS the array directly
    if (Array.isArray(response)) {
        return {
            data: response,
            total: response.length,
            page: 1,
            limit: 20,
            totalPages: 1,
        };
    }

    // Case 5: response has the paginated structure directly
    if (response?.totalPages !== undefined) {
        return {
            data: response.data || [],
            total: response.total || 0,
            page: response.page || 1,
            limit: response.limit || 20,
            totalPages: response.totalPages || 1,
        };
    }

    // Fallback
    console.warn('Unexpected response structure:', response);
    return {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1,
    };
}

// ============================================================================
// SMS API
// ============================================================================

export const smsApi = {
    // ========================================================================
    // SENDER IDS
    // ========================================================================

    requestSenderId: async (senderId: string, useCase: string): Promise<SmsSenderId> => {
        const response = await api.post('/sms/sender-ids', {
            senderId: senderId.trim().toUpperCase(),
            useCase: useCase.trim(),
        });
        return extractData<SmsSenderId>(response);
    },

    getSenderIds: async (): Promise<SmsSenderId[]> => {
        const response = await api.get('/sms/sender-ids');
        const data = extractData<SmsSenderId[]>(response);
        return Array.isArray(data) ? data : [];
    },

    getApprovedSenderIds: async (): Promise<SmsSenderId[]> => {
        const response = await api.get('/sms/sender-ids/approved');
        const data = extractData<SmsSenderId[]>(response);
        return Array.isArray(data) ? data : [];
    },

    syncSenderIds: async (): Promise<void> => {
        await api.post('/sms/sender-ids/sync');
    },

    setDefaultSenderId: async (senderIdId: string): Promise<void> => {
        await api.put(`/sms/sender-ids/${senderIdId}/default`);
    },

    deleteSenderId: async (senderIdId: string): Promise<void> => {
        await api.delete(`/sms/sender-ids/${senderIdId}`);
    },

    // ========================================================================
    // BALANCE
    // ========================================================================

    getBalance: async (): Promise<SmsBalance> => {
        const response = await api.get('/sms/balance');
        return extractData<SmsBalance>(response);
    },

    // ========================================================================
    // COMPOSE & SEND
    // ========================================================================

    compose: async (data: ComposeSmsData): Promise<SmsCampaign> => {
        const response = await api.post('/sms/compose', data);
        return extractData<SmsCampaign>(response);
    },

    sendSingle: async (data: {
        phoneNumber: string;
        message: string;
        senderId?: string;
        recipientName?: string;
    }): Promise<SmsMessage> => {
        const response = await api.post('/sms/send', data);
        return extractData<SmsMessage>(response);
    },

    // ========================================================================
    // CAMPAIGNS
    // ========================================================================

    getCampaigns: async (params?: {
        status?: string;
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<PaginatedResult<SmsCampaign>> => {
        const response = await api.get('/sms/campaigns', { params });
        console.log('getCampaigns raw response:', response);
        return extractPaginated<SmsCampaign>(response);
    },

    getCampaignById: async (campaignId: string): Promise<SmsCampaign> => {
        const response = await api.get(`/sms/campaigns/${campaignId}`);
        return extractData<SmsCampaign>(response);
    },

    updateCampaign: async (campaignId: string, data: Partial<ComposeSmsData>): Promise<SmsCampaign> => {
        const response = await api.put(`/sms/campaigns/${campaignId}`, data);
        return extractData<SmsCampaign>(response);
    },

    deleteCampaign: async (campaignId: string): Promise<void> => {
        await api.delete(`/sms/campaigns/${campaignId}`);
    },

    getCampaignReport: async (campaignId: string): Promise<CampaignReport> => {
        const response = await api.get(`/sms/campaigns/${campaignId}/report`);
        return extractData<CampaignReport>(response);
    },

    // ========================================================================
    // DRAFTS & SCHEDULED
    // ========================================================================

    getDrafts: async (): Promise<SmsCampaign[]> => {
        const response = await api.get('/sms/campaigns/drafts');
        const data = extractData<SmsCampaign[]>(response);
        return Array.isArray(data) ? data : [];
    },

    getScheduled: async (): Promise<SmsCampaign[]> => {
        const response = await api.get('/sms/campaigns/scheduled');
        const data = extractData<SmsCampaign[]>(response);
        return Array.isArray(data) ? data : [];
    },

    cancelScheduled: async (campaignId: string): Promise<SmsCampaign> => {
        const response = await api.put(`/sms/campaigns/${campaignId}`, {
            status: 'cancelled',
        });
        return extractData<SmsCampaign>(response);
    },

    // ========================================================================
    // MESSAGES
    // ========================================================================

    getMessages: async (params?: {
        status?: string;
        direction?: 'outbound' | 'inbound';
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<PaginatedResult<SmsMessage>> => {
        const response = await api.get('/sms/messages', { params });
        return extractPaginated<SmsMessage>(response);
    },

    getMessagesByCampaign: async (campaignId: string): Promise<SmsMessage[]> => {
        const response = await api.get(`/sms/campaigns/${campaignId}/messages`);
        const data = extractData<SmsMessage[]>(response);
        return Array.isArray(data) ? data : [];
    },

    syncMessageStatus: async (messageId: string): Promise<void> => {
        await api.post(`/sms/messages/${messageId}/sync`);
    },

    // ========================================================================
    // REPLIES
    // ========================================================================

    getReplies: async (params?: {
        page?: number;
        limit?: number;
        unreadOnly?: boolean;
    }): Promise<{ data: SmsReply[]; total: number }> => {
        const response = await api.get('/sms/replies', { params });
        const result = extractPaginated<SmsReply>(response);
        return { data: result.data, total: result.total };
    },

    markReplyAsRead: async (replyId: string): Promise<void> => {
        await api.put(`/sms/replies/${replyId}/read`);
    },

    markAllRepliesAsRead: async (): Promise<void> => {
        await api.put('/sms/replies/read-all');
    },

    replyToMessage: async (replyId: string, message: string, senderId?: string): Promise<SmsMessage> => {
        const response = await api.post('/sms/replies/send', {
            replyId,
            message,
            senderId,
        });
        return extractData<SmsMessage>(response);
    },

    // ========================================================================
    // CONTACT LISTS
    // ========================================================================

    getContactLists: async (): Promise<SmsContactList[]> => {
        const response = await api.get('/sms/contact-lists');
        const data = extractData<SmsContactList[]>(response);
        return Array.isArray(data) ? data : [];
    },

    createContactList: async (data: { name: string; description?: string }): Promise<SmsContactList> => {
        const response = await api.post('/sms/contact-lists', data);
        return extractData<SmsContactList>(response);
    },

    getContactListById: async (listId: string): Promise<SmsContactList> => {
        const response = await api.get(`/sms/contact-lists/${listId}`);
        return extractData<SmsContactList>(response);
    },

    updateContactList: async (
        listId: string,
        data: { name?: string; description?: string }
    ): Promise<SmsContactList> => {
        const response = await api.put(`/sms/contact-lists/${listId}`, data);
        return extractData<SmsContactList>(response);
    },

    deleteContactList: async (listId: string): Promise<void> => {
        await api.delete(`/sms/contact-lists/${listId}`);
    },

    getContactListItems: async (
        listId: string,
        page = 1,
        limit = 50
    ): Promise<PaginatedResult<SmsContactListItem>> => {
        const response = await api.get(`/sms/contact-lists/${listId}/contacts`, {
            params: { page, limit },
        });
        return extractPaginated<SmsContactListItem>(response);
    },

    addContactsToList: async (
        listId: string,
        contacts: Array<{ phoneNumber: string; name?: string }>
    ): Promise<number> => {
        const response = await api.post(
            `/sms/contact-lists/${listId}/contacts`,
            { contacts }
        );
        const data = extractData<any>(response);
        return data?.addedCount || data?.added_count || 0;
    },

    removeContactFromList: async (listId: string, contactId: string): Promise<void> => {
        await api.delete(`/sms/contact-lists/${listId}/contacts/${contactId}`);
    },

    // ========================================================================
    // STATISTICS
    // ========================================================================

    getStats: async (): Promise<SmsStats> => {
        const response = await api.get('/sms/stats');
        return extractData<SmsStats>(response);
    },

    getSMSHistory: async (params?: { page?: number; limit?: number }): Promise<any> => {
        const response = await api.get('/sms/history', { params });
        return extractData<any>(response);
    },
};

export default smsApi;