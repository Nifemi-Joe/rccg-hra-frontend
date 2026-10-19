// src/services/profileApi.ts

import { api } from '@/lib/api';
import {
    UpdateProfileDTO,
    ChangePasswordDTO,
    CreateStaffDTO,
    UpdateStaffDTO,
    StaffMember,
    UpdateMemberProfileDTO,
    MemberProfile,
} from '@/types/profile';

interface ProfileResponse {
    user: any;
    church: any;
}

interface StaffListResponse {
    staff: StaffMember[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

interface CreateStaffResponse {
    staff: StaffMember;
    member?: any;
    temporaryPassword?: string;
    message: string;
}

interface PermissionsResponse {
    permissions: Array<{ value: string; label: string; category: string }>;
    roleDefaults: Record<string, string[]>;
}

export const profileApi = {
    // Profile endpoints
    getProfile: (): Promise<ProfileResponse> =>
        api.get<ProfileResponse>('/profile/me'),

    updateProfile: (data: UpdateProfileDTO): Promise<any> =>
        api.put<any>('/profile/me', data),

    changePassword: (data: ChangePasswordDTO): Promise<{ message: string }> =>
        api.post<{ message: string }>('/profile/me/password', data),

    updateProfileImage: (imageUrl: string): Promise<{ profileImageUrl: string }> =>
        api.put<{ profileImageUrl: string }>('/profile/me/image', { imageUrl }),

    // Member profile endpoints (for users with linked member records)
    getMemberProfile: (): Promise<MemberProfile> =>
        api.get<MemberProfile>('/profile/member'),

    updateMemberProfile: (data: UpdateMemberProfileDTO): Promise<MemberProfile> =>
        api.put<MemberProfile>('/profile/member', data),

    // Staff management endpoints
    getStaffMembers: (options?: {
        page?: number;
        search?: string;
        role?: string;
        status?: string;
    }): Promise<StaffListResponse> => {
        const params = new URLSearchParams();
        if (options?.page) params.append('page', options.page.toString());
        if (options?.search) params.append('search', options.search);
        if (options?.role) params.append('role', options.role);
        if (options?.status) params.append('status', options.status);
        const queryString = params.toString();
        return api.get<StaffListResponse>(`/profile/staff${queryString ? `?${queryString}` : ''}`);
    },

    getStaffMember: (id: string): Promise<StaffMember> =>
        api.get<StaffMember>(`/profile/staff/${id}`),

    createStaffMember: (data: CreateStaffDTO): Promise<CreateStaffResponse> =>
        api.post<CreateStaffResponse>('/profile/staff', data),

    updateStaffMember: (id: string, data: UpdateStaffDTO): Promise<StaffMember> =>
        api.put<StaffMember>(`/profile/staff/${id}`, data),

    deleteStaffMember: (id: string): Promise<{ message: string }> =>
        api.delete<{ message: string }>(`/profile/staff/${id}`),

    resendInvitation: (id: string): Promise<{ message: string }> =>
        api.post<{ message: string }>(`/profile/staff/${id}/resend-invite`, {}),

    getAvailablePermissions: (): Promise<PermissionsResponse> =>
        api.get<PermissionsResponse>('/profile/permissions'),
};