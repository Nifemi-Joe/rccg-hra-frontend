// src/hooks/useProfile.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '@/services/profileApi';
import {
    UpdateProfileDTO,
    ChangePasswordDTO,
    CreateStaffDTO,
    UpdateStaffDTO,
    UpdateMemberProfileDTO,
} from '@/types/profile';
import { toast } from 'sonner';

export const useProfile = () => {
    const query = useQuery({
        queryKey: ['profile'],
        queryFn: profileApi.getProfile,
        staleTime: 5 * 60 * 1000,
    });

    return {
        profile: query.data,
        user: query.data?.user,
        church: query.data?.church,
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
};

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: UpdateProfileDTO) => profileApi.updateProfile(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            toast.success('Profile updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update profile');
        },
    });
};

export const useChangePassword = () => {
    return useMutation({
        mutationFn: (data: ChangePasswordDTO) => profileApi.changePassword(data),
        onSuccess: () => {
            toast.success('Password changed successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to change password');
        },
    });
};

// ============================================================================
// MEMBER PROFILE HOOKS (For staff/users with linked member records)
// ============================================================================

export const useMemberProfile = () => {
    const query = useQuery({
        queryKey: ['member-profile'],
        queryFn: profileApi.getMemberProfile,
        staleTime: 5 * 60 * 1000,
        retry: false, // Don't retry if member profile doesn't exist
    });

    return {
        member: query.data,
        isLoading: query.isLoading,
        error: query.error,
        hasMemberProfile: !!query.data && !query.error,
        refetch: query.refetch,
    };
};

export const useUpdateMemberProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: UpdateMemberProfileDTO) => profileApi.updateMemberProfile(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['member-profile'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            toast.success('Personal information updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update personal information');
        },
    });
};

// ============================================================================
// STAFF MANAGEMENT HOOKS
// ============================================================================

export const useStaffMembers = (options?: {
    page?: number;
    search?: string;
    role?: string;
    status?: string;
}) => {
    const query = useQuery({
        queryKey: ['staff-members', options],
        queryFn: () => profileApi.getStaffMembers(options),
        staleTime: 2 * 60 * 1000,
    });

    return {
        staff: query.data?.staff || [],
        pagination: query.data?.pagination,
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
};

export const useCreateStaffMember = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateStaffDTO) => profileApi.createStaffMember(data),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['staff-members'] });
            toast.success(result.message);
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create staff member');
        },
    });
};

export const useUpdateStaffMember = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateStaffDTO }) =>
            profileApi.updateStaffMember(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff-members'] });
            toast.success('Staff member updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update staff member');
        },
    });
};

export const useDeleteStaffMember = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => profileApi.deleteStaffMember(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff-members'] });
            toast.success('Staff member deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete staff member');
        },
    });
};

export const useResendInvitation = () => {
    return useMutation({
        mutationFn: (id: string) => profileApi.resendInvitation(id),
        onSuccess: () => {
            toast.success('Invitation resent successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to resend invitation');
        },
    });
};

export const useAvailablePermissions = () => {
    return useQuery({
        queryKey: ['available-permissions'],
        queryFn: profileApi.getAvailablePermissions,
        staleTime: 30 * 60 * 1000,
    });
};