// src/hooks/useCelebrations.ts

import { useQuery } from '@tanstack/react-query';
import { celebrationApi } from '@/services/celebrationApi';
import { CelebrationFilters } from '@/types/celebration';

export const useCelebrations = (filters: CelebrationFilters = {}) => {
    const query = useQuery({
        queryKey: ['celebrations', filters],
        queryFn: () => celebrationApi.getCelebrations(filters),
        staleTime: 5 * 60 * 1000,
    });

    return {
        celebrations: query.data?.celebrations || [],
        pagination: query.data?.pagination,
        summary: query.data?.summary,
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
};

export const useTodayCelebrations = () => {
    const query = useQuery({
        queryKey: ['today-celebrations'],
        queryFn: celebrationApi.getTodayCelebrations,
        staleTime: 5 * 60 * 1000,
    });

    return {
        celebrations: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
};