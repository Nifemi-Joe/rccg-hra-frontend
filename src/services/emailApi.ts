// src/services/emailApi.ts
import api from '@/lib/api.ts';
import type {
    EmailConfiguration,
    EmailTemplate,
    EmailCampaign,
    EmailStats,
    EmailCampaignReport,
    PaginatedEmailCampaigns,
    CreateEmailConfigDTO,
    CreateEmailTemplateDTO,
    UpdateEmailTemplateDTO,
    ComposeEmailDTO,
    EmailCampaignFilters,
} from '@/types/email.types';

export const emailApi = {
    // Configurations
    createConfiguration: (data: CreateEmailConfigDTO): Promise<EmailConfiguration> =>
        api.post<EmailConfiguration>('/email/configurations', data),

    getConfigurations: (): Promise<EmailConfiguration[]> =>
        api.get<EmailConfiguration[]>('/email/configurations'),

    setDefaultConfiguration: (id: string): Promise<void> =>
        api.put(`/email/configurations/${id}/default`),

    deleteConfiguration: (id: string): Promise<void> =>
        api.delete(`/email/configurations/${id}`),

    // Templates
    createTemplate: (data: CreateEmailTemplateDTO): Promise<EmailTemplate> =>
        api.post<EmailTemplate>('/email/templates', data),

    getTemplates: (activeOnly?: boolean): Promise<EmailTemplate[]> =>
        api.get<EmailTemplate[]>('/email/templates', { params: { activeOnly } }),

    getTemplateById: (id: string): Promise<EmailTemplate> =>
        api.get<EmailTemplate>(`/email/templates/${id}`),

    updateTemplate: (id: string, data: UpdateEmailTemplateDTO): Promise<EmailTemplate> =>
        api.put<EmailTemplate>(`/email/templates/${id}`, data),

    deleteTemplate: (id: string): Promise<void> =>
        api.delete(`/email/templates/${id}`),

    // Send single email
    sendEmail: (data: {
        toEmail: string;
        toName?: string;
        subject: string;
        htmlContent: string;
        textContent?: string;
        attachments?: any[];
    }): Promise<any> =>
        api.post('/email/send', data),

    // Compose campaign
    composeEmail: (data: ComposeEmailDTO): Promise<EmailCampaign> =>
        api.post<EmailCampaign>('/email/compose', data),

    // Campaigns
    getCampaigns: (params?: Partial<EmailCampaignFilters>): Promise<PaginatedEmailCampaigns> =>
        api.get<PaginatedEmailCampaigns>('/email/campaigns', { params }),

    getCampaignById: (id: string): Promise<EmailCampaign> =>
        api.get<EmailCampaign>(`/email/campaigns/${id}`),

    getCampaignReport: (id: string): Promise<EmailCampaignReport> =>
        api.get<EmailCampaignReport>(`/email/campaigns/${id}/report`),

    deleteCampaign: (id: string): Promise<void> =>
        api.delete(`/email/campaigns/${id}`),

    // Drafts & Scheduled
    getDrafts: (): Promise<EmailCampaign[]> =>
        api.get<EmailCampaign[]>('/email/campaigns/drafts'),

    getScheduled: (): Promise<EmailCampaign[]> =>
        api.get<EmailCampaign[]>('/email/campaigns/scheduled'),

    // Stats
    getStats: (): Promise<EmailStats> =>
        api.get<EmailStats>('/email/stats'),
};

// Re-export types for convenience
export type {
    EmailConfiguration,
    EmailTemplate,
    EmailCampaign,
    EmailStats,
    EmailCampaignReport,
    PaginatedEmailCampaigns,
    CreateEmailConfigDTO,
    CreateEmailTemplateDTO,
    UpdateEmailTemplateDTO,
    ComposeEmailDTO,
    EmailCampaignFilters,
} from '@/types/email.types';