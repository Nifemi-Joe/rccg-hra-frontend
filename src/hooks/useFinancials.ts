// src/hooks/useFinancials.ts

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { financialApi } from '@/services/financialApi';
import {
    Account,
    CreateAccountDTO,
    UpdateAccountDTO,
    Transaction,
    CreateTransactionDTO,
    CreateExpenseDTO,
    TransactionFilters,
    ExpenseCategory,
    CreateExpenseCategoryDTO,
    BatchOfferingDTO,
    ApproveExpenseDTO,
    ExpenseApprovalSummary,
} from '@/types/financial';

// ============ ACCOUNTS HOOK ============
export function useAccounts() {
    const queryClient = useQueryClient();

    const { data: accounts = [], isLoading, error, refetch } = useQuery({
        queryKey: ['accounts'],
        queryFn: financialApi.getAccounts,
        staleTime: 5 * 60 * 1000,
    });

    const createMutation = useMutation({
        mutationFn: financialApi.createAccount,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            toast.success('Account created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create account');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateAccountDTO }) =>
            financialApi.updateAccount(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            toast.success('Account updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update account');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: financialApi.deleteAccount,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            toast.success('Account deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete account');
        },
    });

    return {
        accounts,
        isLoading,
        error,
        refetch,
        createAccount: createMutation.mutateAsync,
        updateAccount: updateMutation.mutateAsync,
        deleteAccount: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}

// ============ TRANSACTIONS HOOK ============
export function useTransactions(initialFilters: TransactionFilters = {}) {
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState<TransactionFilters>(initialFilters);

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['transactions', filters],
        queryFn: () => financialApi.getTransactions(filters),
        staleTime: 2 * 60 * 1000,
    });

    const createMutation = useMutation({
        mutationFn: financialApi.createTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
            queryClient.invalidateQueries({ queryKey: ['events-for-offering'] });
            toast.success('Transaction recorded successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to record transaction');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: financialApi.deleteTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['events-for-offering'] });
            toast.success('Transaction deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete transaction');
        },
    });

    return {
        transactions: data?.data || [],
        pagination: data?.pagination,
        isLoading,
        error,
        filters,
        setFilters,
        refetch,
        createTransaction: createMutation.mutateAsync,
        deleteTransaction: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}

// ============ EXPENSE APPROVAL SUMMARY HOOK ============
export function useExpenseApprovalSummary() {
    const { data, isLoading, error, refetch } = useQuery<ExpenseApprovalSummary>({
        queryKey: ['expense-approval-summary'],
        queryFn: financialApi.getExpenseApprovalSummary,
        staleTime: 2 * 60 * 1000,
    });

    return {
        summary: data,
        isLoading,
        error,
        refetch,
    };
}

// ============ EXPENSES HOOK ============
export function useExpenses(initialFilters: TransactionFilters = {}) {
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState<TransactionFilters>({
        transactionType: 'expense',
        ...initialFilters,
    });

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['expenses', filters],
        queryFn: () => financialApi.getTransactions(filters),
        staleTime: 2 * 60 * 1000,
    });

    const approveMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: ApproveExpenseDTO }) =>
            financialApi.approveExpense(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['expense-approval-summary'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
            toast.success('Expense updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update expense');
        },
    });

    const recordExpenseMutation = useMutation({
        mutationFn: financialApi.recordExpense,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['expense-approval-summary'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
            toast.success('Expense submitted for approval');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to record expense');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: financialApi.deleteTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['expense-approval-summary'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
            toast.success('Expense deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete expense');
        },
    });

    return {
        expenses: data?.data || [],
        pagination: data?.pagination,
        isLoading,
        error,
        filters,
        setFilters,
        refetch,
        approveExpense: (id: string, data: ApproveExpenseDTO) =>
            approveMutation.mutateAsync({ id, data }),
        recordExpense: recordExpenseMutation.mutateAsync,
        deleteTransaction: deleteMutation.mutateAsync,
        isApproving: approveMutation.isPending,
        isRecording: recordExpenseMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}

// ============ EVENTS FOR OFFERINGS HOOK ============
export function useEventsForOffering() {
    const { data: events = [], isLoading, error, refetch } = useQuery({
        queryKey: ['events-for-offering'],
        queryFn: financialApi.getEventsForOffering,
        staleTime: 5 * 60 * 1000,
    });

    return {
        events,
        isLoading,
        error,
        refetch,
    };
}

// ============ EVENT INSTANCES HOOK ============
export function useEventInstances(eventId: string | null) {
    const { data: instances = [], isLoading, error, refetch } = useQuery({
        queryKey: ['event-instances', eventId],
        queryFn: () => eventId ? financialApi.getEventInstances(eventId) : Promise.resolve([]),
        enabled: !!eventId,
        staleTime: 2 * 60 * 1000,
    });

    return {
        instances,
        isLoading,
        error,
        refetch,
    };
}

// ============ OFFERINGS HOOK ============
export function useOfferings() {
    const queryClient = useQueryClient();

    const invalidateQueries = () => {
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['accounts'] });
        queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
        queryClient.invalidateQueries({ queryKey: ['events-for-offering'] });
    };

    const recordBatchMutation = useMutation({
        mutationFn: financialApi.recordBatchOffering,
        onSuccess: () => {
            invalidateQueries();
            toast.success('Offerings recorded successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to record offerings');
        },
    });

    return {
        recordBatchOffering: recordBatchMutation.mutateAsync,
        isRecording: recordBatchMutation.isPending,
    };
}

// ============ EXPENSE CATEGORIES HOOK ============
export function useExpenseCategories() {
    const queryClient = useQueryClient();

    const { data: categories = [], isLoading, error, refetch } = useQuery({
        queryKey: ['expense-categories'],
        queryFn: financialApi.getExpenseCategories,
        staleTime: 10 * 60 * 1000,
    });

    const createMutation = useMutation({
        mutationFn: financialApi.createExpenseCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
            toast.success('Category created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create category');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: CreateExpenseCategoryDTO }) =>
            financialApi.updateExpenseCategory(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
            toast.success('Category updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update category');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: financialApi.deleteExpenseCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
            toast.success('Category deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete category');
        },
    });

    return {
        categories,
        isLoading,
        error,
        refetch,
        createCategory: createMutation.mutateAsync,
        updateCategory: updateMutation.mutateAsync,
        deleteCategory: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}

// ============ FINANCIAL SUMMARY HOOK ============
export function useFinancialSummary(startDate?: string, endDate?: string) {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['financial-summary', startDate, endDate],
        queryFn: () => financialApi.getFinancialSummary(startDate, endDate),
        staleTime: 5 * 60 * 1000,
    });

    return {
        summary: data,
        isLoading,
        error,
        refetch,
    };
}