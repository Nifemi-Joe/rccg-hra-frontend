// src/hooks/useSupport.ts

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supportApi } from '@/services/supportApi';
import { CreateTicketDTO } from '@/types/support';

export function useSupport() {
    const queryClient = useQueryClient();

    const { data: faqs, isLoading: isLoadingFaqs } = useQuery({
        queryKey: ['faqs'],
        queryFn: supportApi.getFAQs,
        staleTime: 10 * 60 * 1000,
    });

    const createTicketMutation = useMutation({
        mutationFn: supportApi.createTicket,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            toast.success('Support ticket created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create ticket');
        },
    });

    return {
        faqs: faqs || [],
        isLoadingFaqs,
        createTicket: createTicketMutation.mutateAsync,
        isCreating: createTicketMutation.isPending,
    };
}

export function useTickets(filters: any = {}) {
    const [currentFilters, setFilters] = useState(filters);

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['tickets', currentFilters],
        queryFn: () => supportApi.getTickets(currentFilters),
    });

    return {
        tickets: data?.tickets || [],
        pagination: data?.pagination,
        isLoading,
        error,
        filters: currentFilters,
        setFilters,
        refetch,
    };
}

export function useTicket(ticketId: string) {
    const queryClient = useQueryClient();

    const { data: ticket, isLoading: isLoadingTicket } = useQuery({
        queryKey: ['ticket', ticketId],
        queryFn: () => supportApi.getTicketById(ticketId),
        enabled: !!ticketId,
    });

    const { data: messages, isLoading: isLoadingMessages, refetch: refetchMessages } = useQuery({
        queryKey: ['ticket-messages', ticketId],
        queryFn: () => supportApi.getTicketMessages(ticketId),
        enabled: !!ticketId,
    });

    const addMessageMutation = useMutation({
        mutationFn: (message: string) => supportApi.addMessage(ticketId, message),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ticket-messages', ticketId] });
            toast.success('Message sent');
        },
    });

    return {
        ticket,
        messages: messages || [],
        isLoadingTicket,
        isLoadingMessages,
        refetchMessages,
        addMessage: addMessageMutation.mutateAsync,
        isSending: addMessageMutation.isPending,
    };
}