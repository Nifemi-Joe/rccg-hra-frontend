// src/hooks/useGroups.ts
import { useState, useEffect, useCallback } from 'react';
import {
    groupsApi,
    Group,
    GroupType,
    GroupMember,
    GroupMeeting,
    GroupStatistics,
    PaginatedGroups,
    PendingApprovals,
    GroupFilters,
    CreateGroupDTO,
    UpdateGroupDTO,
    CreateMeetingDTO,
} from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface UseGroupsReturn {
    // Data
    groups: Group[];
    groupTypes: GroupType[];
    statistics: GroupStatistics | null;
    pagination: PaginatedGroups['pagination'] | null;
    selectedGroup: Group | null;
    groupMembers: GroupMember[];
    groupMeetings: GroupMeeting[];
    allMeetings: GroupMeeting[];
    pendingApprovals: PendingApprovals | null;

    // Loading states
    isLoading: boolean;
    isLoadingStats: boolean;
    isLoadingMembers: boolean;
    isLoadingMeetings: boolean;
    isLoadingPending: boolean;

    // Filters
    filters: GroupFilters;
    setFilters: (filters: GroupFilters | ((prev: GroupFilters) => GroupFilters)) => void;

    // Group operations
    fetchGroups: () => Promise<void>;
    fetchGroupById: (id: string) => Promise<Group | null>;
    createGroup: (data: CreateGroupDTO) => Promise<Group | null>;
    updateGroup: (id: string, data: UpdateGroupDTO) => Promise<Group | null>;
    deleteGroup: (id: string) => Promise<boolean>;

    // Group Type operations
    fetchGroupTypes: () => Promise<void>;
    createGroupType: (data: { name: string; description?: string }) => Promise<GroupType | null>;

    // Member operations
    fetchGroupMembers: (groupId: string, filters?: { approvalStatus?: string }) => Promise<void>;
    addMember: (groupId: string, memberId: string, role?: string) => Promise<boolean>;
    removeMember: (groupId: string, memberId: string) => Promise<boolean>;
    updateMemberRole: (groupId: string, memberId: string, role: string) => Promise<boolean>;

    // Meeting operations
    fetchGroupMeetings: (groupId: string, options?: { upcoming?: boolean }) => Promise<void>;
    fetchAllMeetings: (options?: { upcoming?: boolean }) => Promise<void>;
    createMeeting: (data: CreateMeetingDTO) => Promise<GroupMeeting | null>;
    updateMeeting: (groupId: string, meetingId: string, data: Partial<CreateMeetingDTO>) => Promise<GroupMeeting | null>;
    cancelMeeting: (groupId: string, meetingId: string, reason?: string) => Promise<boolean>;
    deleteMeeting: (groupId: string, meetingId: string) => Promise<boolean>;
    shareMeeting: (groupId: string, meetingId: string, shareVia: 'email' | 'sms' | 'whatsapp', options?: { recipientIds?: string[]; customMessage?: string; includeAllMembers?: boolean }) => Promise<{ success: boolean; message: string } | null>;

    // Approval operations - Groups
    fetchPendingApprovals: () => Promise<void>;
    approveGroup: (groupId: string) => Promise<boolean>;
    rejectGroup: (groupId: string, reason: string) => Promise<boolean>;

    // Approval operations - Members
    approveGroupMember: (groupId: string, memberId: string) => Promise<boolean>;
    rejectGroupMember: (groupId: string, memberId: string, reason: string) => Promise<boolean>;

    // Utilities
    refetch: () => Promise<void>;
    setSelectedGroup: (group: Group | null) => void;
}

export function useGroups(initialFilters?: GroupFilters): UseGroupsReturn {
    // Data states
    const [groups, setGroups] = useState<Group[]>([]);
    const [groupTypes, setGroupTypes] = useState<GroupType[]>([]);
    const [statistics, setStatistics] = useState<GroupStatistics | null>(null);
    const [pagination, setPagination] = useState<PaginatedGroups['pagination'] | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
    const [groupMeetings, setGroupMeetings] = useState<GroupMeeting[]>([]);
    const [allMeetings, setAllMeetings] = useState<GroupMeeting[]>([]);
    const [pendingApprovals, setPendingApprovals] = useState<PendingApprovals | null>(null);

    // Loading states
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [isLoadingMeetings, setIsLoadingMeetings] = useState(false);
    const [isLoadingPending, setIsLoadingPending] = useState(false);

    // Filters
    const [filters, setFilters] = useState<GroupFilters>(
        initialFilters || { page: 1, limit: 20, approvalStatus: 'all' }
    );

    const { toast } = useToast();

    // ============================================================================
    // GROUPS
    // ============================================================================

    const fetchGroups = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await groupsApi.getAll(filters);
            setGroups(result.groups);
            setPagination(result.pagination);
        } catch (error: any) {
            console.error('Error fetching groups:', error);
            toast({
                variant: 'destructive',
                title: 'Failed to load groups',
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    }, [filters, toast]);

    const fetchStatistics = useCallback(async () => {
        setIsLoadingStats(true);
        try {
            const stats = await groupsApi.getStatistics();
            setStatistics(stats);
        } catch (error: any) {
            console.error('Error fetching statistics:', error);
        } finally {
            setIsLoadingStats(false);
        }
    }, []);

    const fetchGroupTypes = useCallback(async () => {
        try {
            const types = await groupsApi.getTypes();
            setGroupTypes(Array.isArray(types) ? types : []);
        } catch (error: any) {
            console.error('Error fetching group types:', error);
        }
    }, []);

    const fetchGroupById = async (id: string): Promise<Group | null> => {
        try {
            const group = await groupsApi.getById(id);
            setSelectedGroup(group);
            return group;
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to load group',
                description: error.message,
            });
            return null;
        }
    };

    const createGroup = async (data: CreateGroupDTO): Promise<Group | null> => {
        try {
            const group = await groupsApi.create(data);
            toast({
                title: 'Group submitted for approval',
                description: `${data.name} has been created and is pending approval.`,
            });
            await refetch();
            return group;
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to create group',
                description: error.message,
            });
            return null;
        }
    };

    const updateGroup = async (id: string, data: UpdateGroupDTO): Promise<Group | null> => {
        try {
            const group = await groupsApi.update(id, data);
            toast({
                title: 'Group updated',
                description: 'Group has been updated successfully.',
            });
            await fetchGroups();
            if (selectedGroup?.id === id) {
                setSelectedGroup(group);
            }
            return group;
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to update group',
                description: error.message,
            });
            return null;
        }
    };

    const deleteGroup = async (id: string): Promise<boolean> => {
        try {
            await groupsApi.delete(id);
            toast({
                title: 'Group deleted',
                description: 'Group has been deleted successfully.',
            });
            await refetch();
            if (selectedGroup?.id === id) {
                setSelectedGroup(null);
            }
            return true;
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to delete group',
                description: error.message,
            });
            return false;
        }
    };

    // ============================================================================
    // GROUP TYPES
    // ============================================================================

    const createGroupType = async (data: { name: string; description?: string }): Promise<GroupType | null> => {
        try {
            const type = await groupsApi.createType(data);
            toast({
                title: 'Group type created',
                description: `${data.name} type has been created.`,
            });
            await fetchGroupTypes();
            return type;
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to create group type',
                description: error.message,
            });
            return null;
        }
    };

    // ============================================================================
    // MEMBERS
    // ============================================================================

    const fetchGroupMembers = async (
        groupId: string,
        memberFilters?: { approvalStatus?: string }
    ): Promise<void> => {
        setIsLoadingMembers(true);
        try {
            const members = await groupsApi.getMembers(groupId, memberFilters);
            setGroupMembers(Array.isArray(members) ? members : []);
        } catch (error: any) {
            console.error('Error fetching group members:', error);
            setGroupMembers([]);
        } finally {
            setIsLoadingMembers(false);
        }
    };

    const addMember = async (groupId: string, memberId: string, role?: string): Promise<boolean> => {
        try {
            await groupsApi.addMember(groupId, { memberId, role });
            toast({
                title: 'Member added',
                description: 'Member has been added and is pending approval.',
            });
            await fetchGroupMembers(groupId);
            await fetchGroups();
            await fetchPendingApprovals();
            return true;
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to add member',
                description: error.message,
            });
            return false;
        }
    };

    const removeMember = async (groupId: string, memberId: string): Promise<boolean> => {
        try {
            await groupsApi.removeMember(groupId, memberId);
            toast({
                title: 'Member removed',
                description: 'Member has been removed from the group.',
            });
            await fetchGroupMembers(groupId);
            await fetchGroups();
            return true;
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to remove member',
                description: error.message,
            });
            return false;
        }
    };

    const updateMemberRole = async (groupId: string, memberId: string, role: string): Promise<boolean> => {
        try {
            await groupsApi.updateMemberRole(groupId, memberId, role);
            toast({
                title: 'Role updated',
                description: 'Member role has been updated.',
            });
            await fetchGroupMembers(groupId);
            return true;
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to update role',
                description: error.message,
            });
            return false;
        }
    };

    // ============================================================================
    // MEETINGS
    // ============================================================================

    const fetchGroupMeetings = async (groupId: string, options?: { upcoming?: boolean }): Promise<void> => {
        setIsLoadingMeetings(true);
        try {
            const meetings = await groupsApi.getGroupMeetings(groupId, options);
            setGroupMeetings(Array.isArray(meetings) ? meetings : []);
        } catch (error: any) {
            console.error('Error fetching group meetings:', error);
        } finally {
            setIsLoadingMeetings(false);
        }
    };

    const fetchAllMeetings = async (options?: { upcoming?: boolean }): Promise<void> => {
        setIsLoadingMeetings(true);
        try {
            const meetings = await groupsApi.getAllMeetings(options);
            setAllMeetings(Array.isArray(meetings) ? meetings : []);
        } catch (error: any) {
            console.error('Error fetching all meetings:', error);
        } finally {
            setIsLoadingMeetings(false);
        }
    };

    const createMeeting = async (data: CreateMeetingDTO): Promise<GroupMeeting | null> => {
        try {
            const meeting = await groupsApi.createMeeting(data);
            toast({
                title: 'Meeting scheduled',
                description: `${data.title} has been scheduled.`,
            });
            await fetchGroupMeetings(data.groupId, { upcoming: true });
            await fetchStatistics();
            return meeting;
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to create meeting',
                description: error.message,
            });
            return null;
        }
    };

    const updateMeeting = async (groupId: string, meetingId: string, data: Partial<CreateMeetingDTO>): Promise<GroupMeeting | null> => {
        try {
            const meeting = await groupsApi.updateMeeting(groupId, meetingId, data);
            toast({
                title: 'Meeting updated',
                description: 'Meeting has been updated.',
            });
            await fetchGroupMeetings(groupId, { upcoming: true });
            return meeting;
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to update meeting',
                description: error.message,
            });
            return null;
        }
    };

    const cancelMeeting = async (groupId: string, meetingId: string, reason?: string): Promise<boolean> => {
        try {
            await groupsApi.cancelMeeting(groupId, meetingId, reason);
            toast({
                title: 'Meeting cancelled',
                description: 'Meeting has been cancelled.',
            });
            await fetchGroupMeetings(groupId, { upcoming: true });
            await fetchStatistics();
            return true;
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to cancel meeting',
                description: error.message,
            });
            return false;
        }
    };

    const deleteMeeting = async (groupId: string, meetingId: string): Promise<boolean> => {
        try {
            await groupsApi.deleteMeeting(groupId, meetingId);
            toast({
                title: 'Meeting deleted',
                description: 'Meeting has been deleted.',
            });
            await fetchGroupMeetings(groupId, { upcoming: true });
            await fetchStatistics();
            return true;
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to delete meeting',
                description: error.message,
            });
            return false;
        }
    };

    const shareMeeting = async (
        groupId: string,
        meetingId: string,
        shareVia: 'email' | 'sms' | 'whatsapp',
        options?: { recipientIds?: string[]; customMessage?: string; includeAllMembers?: boolean }
    ): Promise<{ success: boolean; message: string } | null> => {
        try {
            const result = await groupsApi.shareMeeting(groupId, meetingId, {
                shareVia,
                ...options,
            });

            if (shareVia === 'whatsapp') {
                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(result.message)}`;
                window.open(whatsappUrl, '_blank');
            }

            toast({
                title: 'Meeting shared',
                description: result.message,
            });

            return result;
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to share meeting',
                description: error.message,
            });
            return null;
        }
    };

    // ============================================================================
    // APPROVALS - MAKER/CHECKER
    // ============================================================================

    const fetchPendingApprovals = useCallback(async (): Promise<void> => {
        setIsLoadingPending(true);
        try {
            const result = await groupsApi.getPendingApprovals();
            console.log(result);
            setPendingApprovals(result);
        } catch (error: any) {
            console.error('Error fetching pending approvals:', error);
        } finally {
            setIsLoadingPending(false);
        }
    }, []);

    const approveGroup = async (groupId: string): Promise<boolean> => {
        try {
            await groupsApi.approveGroup(groupId);
            toast({
                title: 'Group approved',
                description: 'The group has been approved and is now active.',
            });
            await refetch();
            return true;
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to approve group',
                description: error.message,
            });
            return false;
        }
    };

    const rejectGroup = async (groupId: string, reason: string): Promise<boolean> => {
        try {
            await groupsApi.rejectGroup(groupId, reason);
            toast({
                title: 'Group rejected',
                description: 'The group has been rejected.',
            });
            await refetch();
            return true;
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to reject group',
                description: error.message,
            });
            return false;
        }
    };

    const approveGroupMember = async (groupId: string, memberId: string): Promise<boolean> => {
        try {
            await groupsApi.approveGroupMember(groupId, memberId);
            toast({
                title: 'Member approved',
                description: 'The member has been approved and added to the group.',
            });
            await fetchGroupMembers(groupId);
            await fetchPendingApprovals();
            await fetchStatistics();
            return true;
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to approve member',
                description: error.message,
            });
            return false;
        }
    };

    const rejectGroupMember = async (groupId: string, memberId: string, reason: string): Promise<boolean> => {
        try {
            await groupsApi.rejectGroupMember(groupId, memberId, reason);
            toast({
                title: 'Member rejected',
                description: 'The member addition has been rejected.',
            });
            await fetchGroupMembers(groupId);
            await fetchPendingApprovals();
            return true;
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to reject member',
                description: error.message,
            });
            return false;
        }
    };

    // ============================================================================
    // UTILITIES
    // ============================================================================

    const refetch = async () => {
        await Promise.all([
            fetchGroups(),
            fetchStatistics(),
            fetchGroupTypes(),
            fetchPendingApprovals(),
        ]);
    };

    // Initial data fetch
    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    useEffect(() => {
        fetchStatistics();
        fetchGroupTypes();
        fetchPendingApprovals();
    }, [fetchStatistics, fetchGroupTypes, fetchPendingApprovals]);

    return {
        // Data
        groups,
        groupTypes,
        statistics,
        pagination,
        selectedGroup,
        groupMembers,
        groupMeetings,
        allMeetings,
        pendingApprovals,

        // Loading states
        isLoading,
        isLoadingStats,
        isLoadingMembers,
        isLoadingMeetings,
        isLoadingPending,

        // Filters
        filters,
        setFilters,

        // Group operations
        fetchGroups,
        fetchGroupById,
        createGroup,
        updateGroup,
        deleteGroup,

        // Group Type operations
        fetchGroupTypes,
        createGroupType,

        // Member operations
        fetchGroupMembers,
        addMember,
        removeMember,
        updateMemberRole,

        // Meeting operations
        fetchGroupMeetings,
        fetchAllMeetings,
        createMeeting,
        updateMeeting,
        cancelMeeting,
        deleteMeeting,
        shareMeeting,

        // Approval operations
        fetchPendingApprovals,
        approveGroup,
        rejectGroup,
        approveGroupMember,
        rejectGroupMember,

        // Utilities
        refetch,
        setSelectedGroup,
    };
}