// src/services/followUpApi.ts

import api from '@/lib/api';
import {
    FollowUpDepartment,
    FollowUpMember,
    FollowUpAssignment,
    FollowUpActivity,
    MessageTemplate,
    FollowUpStatistics,
    CreateAssignmentDTO,
    BulkCreateAssignmentsDTO,
    UpdateAssignmentDTO,
    SendMessageDTO,
    RecordActivityDTO,
    CreateTemplateDTO,
    UpdateTemplateDTO,
    CreateFollowUpMemberDTO,
    UpdateFollowUpMemberDTO,
    FollowUpFilters,
    PaginatedAssignments,
    PaginatedActivities,
    UnassignedFirstTimer,
    FollowUpDepartmentSettings,
} from '@/types/followUp';

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

// ============================================================================
// DEPARTMENT API
// ============================================================================

export const followUpDepartmentApi = {
    getDepartment: async (): Promise<FollowUpDepartment> => {
        const response = await api.get<ApiResponse<FollowUpDepartment>>('/follow-up/department');
        return response.data;
    },

    updateSettings: async (settings: Partial<FollowUpDepartmentSettings>): Promise<FollowUpDepartment> => {
        const response = await api.patch<ApiResponse<FollowUpDepartment>>(
            '/follow-up/department/settings',
            settings
        );
        return response.data;
    },
};

// ============================================================================
// TEAM MEMBERS API
// ============================================================================

export const followUpMembersApi = {
    getMembers: async (): Promise<FollowUpMember[]> => {
        const response = await api.get<ApiResponse<FollowUpMember[]>>('/follow-up/members');
        return response.data;
    },

    addMember: async (data: CreateFollowUpMemberDTO): Promise<FollowUpMember> => {
        const response = await api.post<ApiResponse<FollowUpMember>>('/follow-up/members', data);
        return response.data;
    },

    updateMember: async (memberId: string, data: UpdateFollowUpMemberDTO): Promise<FollowUpMember> => {
        const response = await api.patch<ApiResponse<FollowUpMember>>(
            `/follow-up/members/${memberId}`,
            data
        );
        return response.data;
    },

    removeMember: async (memberId: string): Promise<void> => {
        await api.delete(`/follow-up/members/${memberId}`);
    },
};

// ============================================================================
// ASSIGNMENTS API
// ============================================================================

export const followUpAssignmentsApi = {
    getAssignments: async (filters?: FollowUpFilters): Promise<PaginatedAssignments> => {
        const response = await api.get<ApiResponse<PaginatedAssignments>>('/follow-up/assignments', {
            params: filters,
        });
        return response.data;
    },

    getAssignment: async (assignmentId: string): Promise<FollowUpAssignment> => {
        const response = await api.get<ApiResponse<FollowUpAssignment>>(
            `/follow-up/assignments/${assignmentId}`
        );
        return response.data;
    },

    getMyAssignments: async (filters?: FollowUpFilters): Promise<PaginatedAssignments> => {
        const response = await api.get<ApiResponse<PaginatedAssignments>>(
            '/follow-up/my-assignments',
            { params: filters }
        );
        return response.data;
    },

    createAssignment: async (data: CreateAssignmentDTO): Promise<FollowUpAssignment> => {
        const response = await api.post<ApiResponse<FollowUpAssignment>>(
            '/follow-up/assignments',
            data
        );
        return response.data;
    },

    bulkCreateAssignments: async (data: BulkCreateAssignmentsDTO): Promise<{
        created: number;
        failed: number;
        assignments: FollowUpAssignment[];
        errors?: Array<{ firstTimerId: string; error: string }>;
    }> => {
        const response = await api.post<ApiResponse<{
            created: number;
            failed: number;
            assignments: FollowUpAssignment[];
            errors?: Array<{ firstTimerId: string; error: string }>;
        }>>('/follow-up/assignments/bulk', data);
        return response.data;
    },

    updateAssignment: async (
        assignmentId: string,
        data: UpdateAssignmentDTO
    ): Promise<FollowUpAssignment> => {
        const response = await api.patch<ApiResponse<FollowUpAssignment>>(
            `/follow-up/assignments/${assignmentId}`,
            data
        );
        return response.data;
    },

    completeAssignment: async (
        assignmentId: string,
        notes?: string
    ): Promise<FollowUpAssignment> => {
        const response = await api.post<ApiResponse<FollowUpAssignment>>(
            `/follow-up/assignments/${assignmentId}/complete`,
            { notes }
        );
        return response.data;
    },

    reassignMember: async (
        assignmentId: string,
        data: {
            removeMemberId?: string;
            addMemberId?: string;
            makePrimary?: boolean;
        }
    ): Promise<FollowUpAssignment> => {
        const response = await api.post<ApiResponse<FollowUpAssignment>>(
            `/follow-up/assignments/${assignmentId}/reassign`,
            data
        );
        return response.data;
    },

    getUnassignedFirstTimers: async (): Promise<UnassignedFirstTimer[]> => {
        const response = await api.get<ApiResponse<UnassignedFirstTimer[]>>(
            '/follow-up/unassigned-first-timers'
        );
        return response.data;
    },

    getAssignmentByFirstTimer: async (firstTimerId: string): Promise<FollowUpAssignment | null> => {
        try {
            const response = await api.get<ApiResponse<FollowUpAssignment>>(
                `/follow-up/first-timers/${firstTimerId}/assignment`
            );
            return response.data;
        } catch {
            return null;
        }
    },
};

// ============================================================================
// ACTIVITIES API
// ============================================================================

export const followUpActivitiesApi = {
    getActivities: async (
        assignmentId: string,
        filters?: { page?: number; limit?: number }
    ): Promise<PaginatedActivities> => {
        const response = await api.get<ApiResponse<PaginatedActivities>>(
            `/follow-up/assignments/${assignmentId}/activities`,
            { params: filters }
        );
        return response.data;
    },

    recordActivity: async (data: RecordActivityDTO): Promise<FollowUpActivity> => {
        const response = await api.post<ApiResponse<FollowUpActivity>>('/follow-up/activities', data);
        return response.data;
    },

    recordResponse: async (activityId: string, response: string): Promise<FollowUpActivity> => {
        const res = await api.post<ApiResponse<FollowUpActivity>>(
            `/follow-up/activities/${activityId}/response`,
            { response }
        );
        return res.data;
    },
};

// ============================================================================
// MESSAGING API
// ============================================================================

export const followUpMessagingApi = {
    sendMessage: async (data: SendMessageDTO): Promise<{
        success: boolean;
        messageId?: string;
        externalId?: string;
        channel: string;
        deliveryStatus: string;
        error?: string;
        activity?: FollowUpActivity;
    }> => {
        const response = await api.post<ApiResponse<{
            success: boolean;
            messageId?: string;
            externalId?: string;
            channel: string;
            deliveryStatus: string;
            error?: string;
            activity?: FollowUpActivity;
        }>>('/follow-up/messages/send', data);
        return response.data;
    },
};

// ============================================================================
// TEMPLATES API
// ============================================================================

export const followUpTemplatesApi = {
    getTemplates: async (channel?: string): Promise<MessageTemplate[]> => {
        const response = await api.get<ApiResponse<MessageTemplate[]>>('/follow-up/templates', {
            params: { channel },
        });
        return response.data;
    },

    createTemplate: async (data: CreateTemplateDTO): Promise<MessageTemplate> => {
        const response = await api.post<ApiResponse<MessageTemplate>>('/follow-up/templates', data);
        return response.data;
    },

    updateTemplate: async (templateId: string, data: UpdateTemplateDTO): Promise<MessageTemplate> => {
        const response = await api.patch<ApiResponse<MessageTemplate>>(
            `/follow-up/templates/${templateId}`,
            data
        );
        return response.data;
    },

    deleteTemplate: async (templateId: string): Promise<void> => {
        await api.delete(`/follow-up/templates/${templateId}`);
    },
};

// ============================================================================
// STATISTICS API
// ============================================================================

export const followUpStatisticsApi = {
    getStatistics: async (dateFrom?: string, dateTo?: string): Promise<FollowUpStatistics> => {
        const response = await api.get<ApiResponse<FollowUpStatistics>>('/follow-up/statistics', {
            params: { dateFrom, dateTo },
        });
        return response.data;
    },
};

// Combined export
export const followUpApi = {
    department: followUpDepartmentApi,
    members: followUpMembersApi,
    assignments: followUpAssignmentsApi,
    activities: followUpActivitiesApi,
    messaging: followUpMessagingApi,
    templates: followUpTemplatesApi,
    statistics: followUpStatisticsApi,
};

export default followUpApi;