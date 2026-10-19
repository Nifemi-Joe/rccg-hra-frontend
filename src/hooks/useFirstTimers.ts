// src/hooks/useFirstTimers.ts
import { useState, useEffect, useCallback } from 'react';
import {
    firstTimersApi,
    FirstTimer,
    FirstTimerStatistics,
    PaginatedFirstTimers,
    FirstTimerFilters,
    CreateFirstTimerDTO,
    UpdateFirstTimerDTO,
    ConversionSettings
} from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface UseFirstTimersReturn {
    firstTimers: FirstTimer[];
    statistics: FirstTimerStatistics | null;
    pagination: PaginatedFirstTimers['pagination'] | null;
    conversionSettings: ConversionSettings | null;
    isLoading: boolean;
    isLoadingStats: boolean;
    error: string | null;
    filters: FirstTimerFilters;
    setFilters: (filters: FirstTimerFilters) => void;
    fetchFirstTimers: () => Promise<void>;
    fetchStatistics: () => Promise<void>;
    createFirstTimer: (data: CreateFirstTimerDTO) => Promise<FirstTimer | null>;
    updateFirstTimer: (id: string, data: UpdateFirstTimerDTO) => Promise<FirstTimer | null>;
    deleteFirstTimer: (id: string) => Promise<boolean>;
    recordVisit: (id: string, visitDate?: string) => Promise<FirstTimer | null>;
    recordContact: (id: string, notes?: string) => Promise<FirstTimer | null>;
    convertToMember: (id: string, additionalData?: any) => Promise<boolean>;
    updateConversionSettings: (days: number) => Promise<boolean>;
    refetch: () => Promise<void>;
}

export function useFirstTimers(initialFilters?: FirstTimerFilters): UseFirstTimersReturn {
    const [firstTimers, setFirstTimers] = useState<FirstTimer[]>([]);
    const [statistics, setStatistics] = useState<FirstTimerStatistics | null>(null);
    const [conversionSettings, setConversionSettings] = useState<ConversionSettings | null>(null);
    const [pagination, setPagination] = useState<PaginatedFirstTimers['pagination'] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<FirstTimerFilters>(initialFilters || { page: 1, limit: 20 });
    const { toast } = useToast();

    const fetchFirstTimers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await firstTimersApi.getAll(filters);
            setFirstTimers(result.firstTimers);
            setPagination(result.pagination);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch first timers');
            console.error('Error fetching first timers:', err);
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    const fetchStatistics = useCallback(async () => {
        setIsLoadingStats(true);
        try {
            const [stats, settings] = await Promise.all([
                firstTimersApi.getStatistics(),
                firstTimersApi.getConversionSettings(),
            ]);
            setStatistics(stats);
            setConversionSettings(settings);
        } catch (err: any) {
            console.error('Error fetching statistics:', err);
        } finally {
            setIsLoadingStats(false);
        }
    }, []);

    const createFirstTimer = async (data: CreateFirstTimerDTO): Promise<FirstTimer | null> => {
        try {
            const firstTimer = await firstTimersApi.create(data);
            toast({
                title: 'First timer registered! 🎉',
                description: `Welcome ${data.firstName}! They have been added to follow-up.`,
            });
            await refetch();
            return firstTimer;
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to register first timer',
                description: err.message || 'Something went wrong.',
            });
            return null;
        }
    };

    const updateFirstTimer = async (id: string, data: UpdateFirstTimerDTO): Promise<FirstTimer | null> => {
        try {
            const firstTimer = await firstTimersApi.update(id, data);
            toast({
                title: 'First timer updated',
                description: 'Information has been updated successfully.',
            });
            await fetchFirstTimers();
            return firstTimer;
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to update',
                description: err.message || 'Something went wrong.',
            });
            return null;
        }
    };

    const deleteFirstTimer = async (id: string): Promise<boolean> => {
        try {
            await firstTimersApi.delete(id);
            toast({
                title: 'First timer deleted',
                description: 'Record has been removed successfully.',
            });
            await refetch();
            return true;
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to delete',
                description: err.message || 'Something went wrong.',
            });
            return false;
        }
    };

    const recordVisit = async (id: string, visitDate?: string): Promise<FirstTimer | null> => {
        try {
            const firstTimer = await firstTimersApi.recordVisit(id, visitDate);
            toast({
                title: 'Visit recorded',
                description: `Visit count: ${firstTimer.visit_count}`,
            });
            await fetchFirstTimers();
            return firstTimer;
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to record visit',
                description: err.message || 'Something went wrong.',
            });
            return null;
        }
    };

    const recordContact = async (id: string, notes?: string): Promise<FirstTimer | null> => {
        try {
            const firstTimer = await firstTimersApi.recordContact(id, notes);
            toast({
                title: 'Contact recorded',
                description: 'Contact attempt has been logged.',
            });
            await fetchFirstTimers();
            return firstTimer;
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to record contact',
                description: err.message || 'Something went wrong.',
            });
            return null;
        }
    };

    const convertToMember = async (id: string, additionalData?: any): Promise<boolean> => {
        try {
            await firstTimersApi.convertToMember(id, additionalData);
            toast({
                title: 'Converted to member! 🎉',
                description: 'First timer has been successfully converted to a member.',
            });
            await refetch();
            return true;
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to convert',
                description: err.message || 'Something went wrong.',
            });
            return false;
        }
    };

    const updateConversionSettings = async (days: number): Promise<boolean> => {
        try {
            const settings = await firstTimersApi.updateConversionSettings(days);
            setConversionSettings(settings);
            toast({
                title: 'Settings updated',
                description: `Conversion period set to ${days} days.`,
            });
            return true;
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to update settings',
                description: err.message || 'Something went wrong.',
            });
            return false;
        }
    };

    const refetch = async () => {
        await Promise.all([fetchFirstTimers(), fetchStatistics()]);
    };

    useEffect(() => {
        fetchFirstTimers();
    }, [fetchFirstTimers]);

    useEffect(() => {
        fetchStatistics();
    }, [fetchStatistics]);

    return {
        firstTimers,
        statistics,
        pagination,
        conversionSettings,
        isLoading,
        isLoadingStats,
        error,
        filters,
        setFilters,
        fetchFirstTimers,
        fetchStatistics,
        createFirstTimer,
        updateFirstTimer,
        deleteFirstTimer,
        recordVisit,
        recordContact,
        convertToMember,
        updateConversionSettings,
        refetch,
    };
}