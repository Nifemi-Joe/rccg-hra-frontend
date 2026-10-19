// src/hooks/useFollowUp.ts

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import followUpApi from '@/services/followUpApi';
import {
    FollowUpDepartment,
    FollowUpMember,
    FollowUpAssignment,
    FollowUpActivity,
    MessageTemplate,
    FollowUpStatistics,
    FollowUpFilters,
    CreateAssignmentDTO,
    UpdateAssignmentDTO,
    SendMessageDTO,
    RecordActivityDTO,
    CreateTemplateDTO,
    UpdateTemplateDTO,
    CreateFollowUpMemberDTO,
    UpdateFollowUpMemberDTO,
    UnassignedFirstTimer,
} from '@/types/followUp';

// ============================================================================
// DEPARTMENT HOOK
// ============================================================================

export function useFollowUpDepartment() {
    const [department, setDepartment] = useState<FollowUpDepartment | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchDepartment = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await followUpApi.department.getDepartment();
            setDepartment(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch department');
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load follow-up department',
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const updateSettings = useCallback(async (settings: any) => {
        try {
            const updated = await followUpApi.department.updateSettings(settings);
            setDepartment(updated);
            toast({
                title: 'Success',
                description: 'Settings updated successfully',
            });
            return updated;
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: err.message || 'Failed to update settings',
            });
            throw err;
        }
    }, [toast]);

    useEffect(() => {
        fetchDepartment();
    }, [fetchDepartment]);

    return {
        department,
        isLoading,
        error,
        updateSettings,
        refetch: fetchDepartment,
    };
}

// ============================================================================
// TEAM MEMBERS HOOK
// ============================================================================

export function useFollowUpMembers() {
    const [members, setMembers] = useState<FollowUpMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchMembers = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await followUpApi.members.getMembers();
            setMembers(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch members');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const addMember = useCallback(async (data: CreateFollowUpMemberDTO) => {
        try {
            const member = await followUpApi.members.addMember(data);
            setMembers(prev => [...prev, member]);
            toast({
                title: 'Success',
                description: 'Team member added successfully',
            });
            return member;
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: err.message || 'Failed to add team member',
            });
            throw err;
        }
    }, [toast]);

    const updateMember = useCallback(async (memberId: string, data: UpdateFollowUpMemberDTO) => {
        try {
            const updated = await followUpApi.members.updateMember(memberId, data);
            setMembers(prev => prev.map(m => m.id === memberId ? updated : m));
            toast({
                title: 'Success',
                description: 'Team member updated successfully',
            });
            return updated;
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: err.message || 'Failed to update team member',
            });
            throw err;
        }
    }, [toast]);

    const removeMember = useCallback(async (memberId: string) => {
        try {
            await followUpApi.members.removeMember(memberId);
            setMembers(prev => prev.filter(m => m.id !== memberId));
            toast({
                title: 'Success',
                description: 'Team member removed successfully',
            });
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: err.message || 'Failed to remove team member',
            });
            throw err;
        }
    }, [toast]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    return {
        members,
        isLoading,
        error,
        addMember,
        updateMember,
        removeMember,
        refetch: fetchMembers,
    };
}

// ============================================================================
// ASSIGNMENTS HOOK
// ============================================================================

export function useFollowUpAssignments(initialFilters?: FollowUpFilters) {
    const [assignments, setAssignments] = useState<FollowUpAssignment[]>([]);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
    });
    const [filters, setFilters] = useState<FollowUpFilters>(initialFilters || {});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchAssignments = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await followUpApi.assignments.getAssignments(filters);
            setAssignments(data.assignments);
            setPagination(data.pagination);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch assignments');
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    const createAssignment = useCallback(async (data: CreateAssignmentDTO) => {
        try {
            const assignment = await followUpApi.assignments.createAssignment(data);
            await fetchAssignments();
            toast({
                title: 'Success',
                description: 'Assignment created successfully',
            });
            return assignment;
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: err.message || 'Failed to create assignment',
            });
            throw err;
        }
    }, [fetchAssignments, toast]);

    const updateAssignment = useCallback(async (assignmentId: string, data: UpdateAssignmentDTO) => {
        try {
            const updated = await followUpApi.assignments.updateAssignment(assignmentId, data);
            setAssignments(prev => prev.map(a => a.id === assignmentId ? updated : a));
            toast({
                title: 'Success',
                description: 'Assignment updated successfully',
            });
            return updated;
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: err.message || 'Failed to update assignment',
            });
            throw err;
        }
    }, [toast]);

    const completeAssignment = useCallback(async (assignmentId: string, notes?: string) => {
        try {
            const updated = await followUpApi.assignments.completeAssignment(assignmentId, notes);
            setAssignments(prev => prev.map(a => a.id === assignmentId ? updated : a));
            toast({
                title: 'Success',
                description: 'Assignment completed successfully',
            });
            return updated;
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: err.message || 'Failed to complete assignment',
            });
            throw err;
        }
    }, [toast]);

    useEffect(() => {
        fetchAssignments();
    }, [fetchAssignments]);

    return {
        assignments,
        pagination,
        filters,
        setFilters,
        isLoading,
        error,
        createAssignment,
        updateAssignment,
        completeAssignment,
        refetch: fetchAssignments,
    };
}

// ============================================================================
// MY ASSIGNMENTS HOOK (For follow-up team members)
// ============================================================================

export function useMyAssignments(initialFilters?: FollowUpFilters) {
    const [assignments, setAssignments] = useState<FollowUpAssignment[]>([]);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
    });
    const [filters, setFilters] = useState<FollowUpFilters>(initialFilters || {});
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchMyAssignments = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await followUpApi.assignments.getMyAssignments(filters);
            setAssignments(data.assignments);
            setPagination(data.pagination);
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load your assignments',
            });
        } finally {
            setIsLoading(false);
        }
    }, [filters, toast]);

    useEffect(() => {
        fetchMyAssignments();
    }, [fetchMyAssignments]);

    return {
        assignments,
        pagination,
        filters,
        setFilters,
        isLoading,
        refetch: fetchMyAssignments,
    };
}

// ============================================================================
// ACTIVITIES HOOK
// ============================================================================

export function useFollowUpActivities(assignmentId: string) {
    const [activities, setActivities] = useState<FollowUpActivity[]>([]);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchActivities = useCallback(async (page = 1) => {
        try {
            setIsLoading(true);
            const data = await followUpApi.activities.getActivities(assignmentId, { page });
            setActivities(data.activities);
            setPagination(data.pagination);
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load activities',
            });
        } finally {
            setIsLoading(false);
        }
    }, [assignmentId, toast]);

    const recordActivity = useCallback(async (data: RecordActivityDTO) => {
        try {
            const activity = await followUpApi.activities.recordActivity(data);
            setActivities(prev => [activity, ...prev]);
            toast({
                title: 'Success',
                description: 'Activity recorded successfully',
            });
            return activity;
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: err.message || 'Failed to record activity',
            });
            throw err;
        }
    }, [toast]);

    useEffect(() => {
        if (assignmentId) {
            fetchActivities();
        }
    }, [assignmentId, fetchActivities]);

    return {
        activities,
        pagination,
        isLoading,
        recordActivity,
        refetch: fetchActivities,
    };
}

// ============================================================================
// TEMPLATES HOOK
// ============================================================================

export function useFollowUpTemplates(channel?: string) {
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchTemplates = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await followUpApi.templates.getTemplates(channel);
            setTemplates(data);
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load templates',
            });
        } finally {
            setIsLoading(false);
        }
    }, [channel, toast]);

    const createTemplate = useCallback(async (data: CreateTemplateDTO) => {
        try {
            const template = await followUpApi.templates.createTemplate(data);
            setTemplates(prev => [...prev, template]);
            toast({
                title: 'Success',
                description: 'Template created successfully',
            });
            return template;
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: err.message || 'Failed to create template',
            });
            throw err;
        }
    }, [toast]);

    const updateTemplate = useCallback(async (templateId: string, data: UpdateTemplateDTO) => {
        try {
            const updated = await followUpApi.templates.updateTemplate(templateId, data);
            setTemplates(prev => prev.map(t => t.id === templateId ? updated : t));
            toast({
                title: 'Success',
                description: 'Template updated successfully',
            });
            return updated;
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: err.message || 'Failed to update template',
            });
            throw err;
        }
    }, [toast]);

    const deleteTemplate = useCallback(async (templateId: string) => {
        try {
            await followUpApi.templates.deleteTemplate(templateId);
            setTemplates(prev => prev.filter(t => t.id !== templateId));
            toast({
                title: 'Success',
                description: 'Template deleted successfully',
            });
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: err.message || 'Failed to delete template',
            });
            throw err;
        }
    }, [toast]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    return {
        templates,
        isLoading,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        refetch: fetchTemplates,
    };
}

// ============================================================================
// STATISTICS HOOK
// ============================================================================

export function useFollowUpStatistics(dateFrom?: string, dateTo?: string) {
    const [statistics, setStatistics] = useState<FollowUpStatistics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchStatistics = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await followUpApi.statistics.getStatistics(dateFrom, dateTo);
            setStatistics(data);
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load statistics',
            });
        } finally {
            setIsLoading(false);
        }
    }, [dateFrom, dateTo, toast]);

    useEffect(() => {
        fetchStatistics();
    }, [fetchStatistics]);

    return {
        statistics,
        isLoading,
        refetch: fetchStatistics,
    };
}

// ============================================================================
// UNASSIGNED FIRST TIMERS HOOK
// ============================================================================

export function useUnassignedFirstTimers() {
    const [firstTimers, setFirstTimers] = useState<UnassignedFirstTimer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchUnassigned = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await followUpApi.assignments.getUnassignedFirstTimers();
            setFirstTimers(data);
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load unassigned first timers',
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchUnassigned();
    }, [fetchUnassigned]);

    return {
        firstTimers,
        isLoading,
        refetch: fetchUnassigned,
    };
}