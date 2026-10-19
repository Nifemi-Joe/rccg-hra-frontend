// src/hooks/useFamilies.ts
import { useState, useEffect, useCallback } from 'react';
import {
    familiesApi,
    Family,
    FamilyMember,
    FamilyStatistics,
    FamilyFilters,
    CreateFamilyDTO,
    UpdateFamilyDTO,
    AddFamilyMemberDTO,
    FamilyRole,
} from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface UseFamiliesReturn {
    families: Family[];
    statistics: FamilyStatistics | null;
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    } | null;
    isLoading: boolean;
    isLoadingStats: boolean;
    filters: FamilyFilters;
    setFilters: (filters: FamilyFilters) => void;
    createFamily: (data: CreateFamilyDTO) => Promise<Family | null>;
    updateFamily: (id: string, data: UpdateFamilyDTO) => Promise<Family | null>;
    deleteFamily: (id: string) => Promise<boolean>;
    refetch: () => void;
}

export function useFamilies(): UseFamiliesReturn {
    const [families, setFamilies] = useState<Family[]>([]);
    const [statistics, setStatistics] = useState<FamilyStatistics | null>(null);
    const [pagination, setPagination] = useState<{
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [filters, setFilters] = useState<FamilyFilters>({
        page: 1,
        limit: 20,
    });
    const { toast } = useToast();

    const fetchFamilies = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await familiesApi.getAll(filters);
            setFamilies(result.families);
            setPagination(result.pagination);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to load families',
                description: error.message || 'Something went wrong',
            });
        } finally {
            setIsLoading(false);
        }
    }, [filters, toast]);

    const fetchStatistics = useCallback(async () => {
        setIsLoadingStats(true);
        try {
            const stats = await familiesApi.getStatistics();
            setStatistics(stats);
        } catch (error: any) {
            console.error('Failed to load statistics:', error);
        } finally {
            setIsLoadingStats(false);
        }
    }, []);

    useEffect(() => {
        fetchFamilies();
    }, [fetchFamilies]);

    useEffect(() => {
        fetchStatistics();
    }, [fetchStatistics]);

    const createFamily = async (data: CreateFamilyDTO): Promise<Family | null> => {
        try {
            const family = await familiesApi.create(data);
            toast({
                title: 'Family created',
                description: `${data.name} has been created successfully.`,
            });
            refetch();
            return family;
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to create family',
                description: error.message || 'Something went wrong',
            });
            return null;
        }
    };

    const updateFamily = async (id: string, data: UpdateFamilyDTO): Promise<Family | null> => {
        try {
            const family = await familiesApi.update(id, data);
            toast({
                title: 'Family updated',
                description: 'Family has been updated successfully.',
            });
            refetch();
            return family;
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to update family',
                description: error.message || 'Something went wrong',
            });
            return null;
        }
    };

    const deleteFamily = async (id: string): Promise<boolean> => {
        try {
            await familiesApi.delete(id);
            toast({
                title: 'Family deleted',
                description: 'Family has been deleted successfully.',
            });
            refetch();
            return true;
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to delete family',
                description: error.message || 'Something went wrong',
            });
            return false;
        }
    };

    const refetch = () => {
        fetchFamilies();
        fetchStatistics();
    };

    return {
        families,
        statistics,
        pagination,
        isLoading,
        isLoadingStats,
        filters,
        setFilters,
        createFamily,
        updateFamily,
        deleteFamily,
        refetch,
    };
}

// Hook for single family with members
interface UseFamilyReturn {
    family: Family | null;
    members: FamilyMember[];
    isLoading: boolean;
    isLoadingMembers: boolean;
    addMember: (data: AddFamilyMemberDTO) => Promise<boolean>;
    removeMember: (memberId: string) => Promise<boolean>;
    updateMember: (memberId: string, data: { familyRole?: FamilyRole; familyRoleOther?: string; isHead?: boolean }) => Promise<boolean>;
    refetch: () => void;
}

export function useFamily(familyId: string | null): UseFamilyReturn {
    const [family, setFamily] = useState<Family | null>(null);
    const [members, setMembers] = useState<FamilyMember[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const { toast } = useToast();

    const fetchFamily = useCallback(async () => {
        if (!familyId) return;

        setIsLoading(true);
        try {
            const data = await familiesApi.getById(familyId);
            setFamily(data);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to load family',
                description: error.message || 'Something went wrong',
            });
        } finally {
            setIsLoading(false);
        }
    }, [familyId, toast]);

    const fetchMembers = useCallback(async () => {
        if (!familyId) return;

        setIsLoadingMembers(true);
        try {
            const data = await familiesApi.getMembers(familyId);
            setMembers(data);
        } catch (error: any) {
            console.error('Failed to load members:', error);
        } finally {
            setIsLoadingMembers(false);
        }
    }, [familyId]);

    useEffect(() => {
        fetchFamily();
        fetchMembers();
    }, [fetchFamily, fetchMembers]);

    const addMember = async (data: AddFamilyMemberDTO): Promise<boolean> => {
        if (!familyId) return false;

        try {
            const updatedMembers = await familiesApi.addMember(familyId, data);
            setMembers(updatedMembers);
            toast({
                title: 'Member added',
                description: 'Member has been added to the family.',
            });
            return true;
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to add member',
                description: error.message || 'Something went wrong',
            });
            return false;
        }
    };

    const removeMember = async (memberId: string): Promise<boolean> => {
        if (!familyId) return false;

        try {
            const updatedMembers = await familiesApi.removeMember(familyId, memberId);
            setMembers(updatedMembers);
            toast({
                title: 'Member removed',
                description: 'Member has been removed from the family.',
            });
            return true;
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to remove member',
                description: error.message || 'Something went wrong',
            });
            return false;
        }
    };

    const updateMember = async (
        memberId: string,
        data: { familyRole?: FamilyRole; familyRoleOther?: string; isHead?: boolean }
    ): Promise<boolean> => {
        if (!familyId) return false;

        try {
            const updatedMembers = await familiesApi.updateMember(familyId, memberId, data);
            setMembers(updatedMembers);
            toast({
                title: 'Member updated',
                description: 'Family member has been updated.',
            });
            return true;
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to update member',
                description: error.message || 'Something went wrong',
            });
            return false;
        }
    };

    const refetch = () => {
        fetchFamily();
        fetchMembers();
    };

    return {
        family,
        members,
        isLoading,
        isLoadingMembers,
        addMember,
        removeMember,
        updateMember,
        refetch,
    };
}