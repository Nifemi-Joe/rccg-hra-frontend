// src/hooks/useMembers.ts
import { useState, useEffect, useCallback } from 'react';
import { membersApi, Member, MemberStatistics, PaginatedMembers, MemberFilters, CreateMemberDTO } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface UseMembersReturn {
    members: Member[];
    statistics: MemberStatistics | null;
    pagination: PaginatedMembers['pagination'] | null;
    isLoading: boolean;
    isLoadingStats: boolean;
    error: string | null;
    filters: MemberFilters;
    setFilters: (filters: MemberFilters) => void;
    fetchMembers: () => Promise<void>;
    fetchStatistics: () => Promise<void>;
    createMember: (data: CreateMemberDTO) => Promise<Member | null>;
    updateMember: (id: string, data: Partial<CreateMemberDTO>) => Promise<Member | null>;
    deleteMember: (id: string) => Promise<boolean>;
    searchMembers: (query: string) => Promise<Member[]>;
    refetch: () => Promise<void>;
}

export function useMembers(initialFilters?: MemberFilters): UseMembersReturn {
    const [members, setMembers] = useState<Member[]>([]);
    const [statistics, setStatistics] = useState<MemberStatistics | null>(null);
    const [pagination, setPagination] = useState<PaginatedMembers['pagination'] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<MemberFilters>(initialFilters || { page: 1, limit: 20 });
    const { toast } = useToast();

    const fetchMembers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await membersApi.getAll(filters);
            setMembers(result.members);
            setPagination(result.pagination);
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to fetch members';
            setError(errorMessage);
            console.error('Error fetching members:', err);
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    const fetchStatistics = useCallback(async () => {
        setIsLoadingStats(true);
        try {
            const stats = await membersApi.getStatistics();
            setStatistics(stats);
        } catch (err: any) {
            console.error('Error fetching statistics:', err);
        } finally {
            setIsLoadingStats(false);
        }
    }, []);

    const createMember = async (data: CreateMemberDTO): Promise<Member | null> => {
        try {
            const member = await membersApi.create(data);
            toast({
                title: 'Member created',
                description: `${data.firstName} ${data.lastName} has been added successfully.`,
            });
            await fetchMembers();
            await fetchStatistics();
            return member;
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to create member',
                description: err.message || 'Something went wrong.',
            });
            return null;
        }
    };

    const updateMember = async (id: string, data: Partial<CreateMemberDTO>): Promise<Member | null> => {
        try {
            const member = await membersApi.update(id, data);
            toast({
                title: 'Member updated',
                description: 'Member information has been updated successfully.',
            });
            await fetchMembers();
            await fetchStatistics();
            return member;
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to update member',
                description: err.message || 'Something went wrong.',
            });
            return null;
        }
    };

    const deleteMember = async (id: string): Promise<boolean> => {
        try {
            await membersApi.delete(id);
            toast({
                title: 'Member deleted',
                description: 'Member has been removed successfully.',
            });
            await fetchMembers();
            await fetchStatistics();
            return true;
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to delete member',
                description: err.message || 'Something went wrong.',
            });
            return false;
        }
    };

    const searchMembers = async (query: string): Promise<Member[]> => {
        try {
            return await membersApi.search(query);
        } catch (err: any) {
            console.error('Error searching members:', err);
            return [];
        }
    };

    const refetch = async () => {
        await Promise.all([fetchMembers(), fetchStatistics()]);
    };

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    useEffect(() => {
        fetchStatistics();
    }, [fetchStatistics]);

    return {
        members,
        statistics,
        pagination,
        isLoading,
        isLoadingStats,
        error,
        filters,
        setFilters,
        fetchMembers,
        fetchStatistics,
        createMember,
        updateMember,
        deleteMember,
        searchMembers,
        refetch,
    };
}