// src/hooks/useEvents.ts
import { useState, useEffect, useCallback } from 'react';
import {
    eventsApi,
    Event,
    EventInstance,
    EventRegistration,
    EventStatistics,
    EventFilters,
    CreateEventDTO,
    UpdateEventDTO,
    CreateEventInstanceDTO,
    CreateRegistrationDTO,
    ShareEventDTO,
    ShareResult,
    CheckInDTO,
    CheckInResult,
} from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface UseEventsReturn {
    events: Event[];
    statistics: EventStatistics | null;
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    } | null;
    isLoading: boolean;
    isLoadingStats: boolean;
    filters: EventFilters;
    setFilters: (filters: EventFilters) => void;
    createEvent: (data: CreateEventDTO) => Promise<Event | null>;
    updateEvent: (id: string, data: UpdateEventDTO) => Promise<Event | null>;
    deleteEvent: (id: string) => Promise<boolean>;
    startEvent: (id: string) => Promise<EventInstance | null>;
    shareEvent: (id: string, data: ShareEventDTO) => Promise<ShareResult | null>;
    refetch: () => void;
}

export function useEvents(): UseEventsReturn {
    const [events, setEvents] = useState<Event[]>([]);
    const [statistics, setStatistics] = useState<EventStatistics | null>(null);
    const [pagination, setPagination] = useState<{
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [filters, setFilters] = useState<EventFilters>({
        page: 1,
        limit: 20,
    });
    const { toast } = useToast();

    const fetchEvents = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await eventsApi.getAll(filters);
            setEvents(result.events);
            setPagination(result.pagination);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to load events',
                description: error.message || 'Something went wrong',
            });
        } finally {
            setIsLoading(false);
        }
    }, [filters, toast]);

    const fetchStatistics = useCallback(async () => {
        setIsLoadingStats(true);
        try {
            const stats = await eventsApi.getStatistics();
            setStatistics(stats);
        } catch (error: any) {
            console.error('Failed to load statistics:', error);
        } finally {
            setIsLoadingStats(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    useEffect(() => {
        fetchStatistics();
    }, [fetchStatistics]);

    const createEvent = async (data: CreateEventDTO): Promise<Event | null> => {
        try {
            const event = await eventsApi.create(data);
            toast({
                title: 'Event created',
                description: `${data.name} has been created successfully.`,
            });
            refetch();
            return event;
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to create event',
                description: error.message || 'Something went wrong',
            });
            return null;
        }
    };

    const updateEvent = async (id: string, data: UpdateEventDTO): Promise<Event | null> => {
        try {
            const event = await eventsApi.update(id, data);
            toast({
                title: 'Event updated',
                description: 'Event has been updated successfully.',
            });
            refetch();
            return event;
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to update event',
                description: error.message || 'Something went wrong',
            });
            return null;
        }
    };

    const deleteEvent = async (id: string): Promise<boolean> => {
        try {
            await eventsApi.delete(id);
            toast({
                title: 'Event deleted',
                description: 'Event has been deleted successfully.',
            });
            refetch();
            return true;
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to delete event',
                description: error.message || 'Something went wrong',
            });
            return false;
        }
    };

    const startEvent = async (id: string): Promise<EventInstance | null> => {
        try {
            const instance = await eventsApi.start(id);
            toast({
                title: 'Event started',
                description: 'Event instance has been created and started.',
            });
            return instance;
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to start event',
                description: error.message || 'Something went wrong',
            });
            return null;
        }
    };

    const shareEvent = async (id: string, data: ShareEventDTO): Promise<ShareResult | null> => {
        try {
            const result = await eventsApi.share(id, data);
            toast({
                title: 'Event shared',
                description: result.message,
            });
            return result;
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to share event',
                description: error.message || 'Something went wrong',
            });
            return null;
        }
    };

    const refetch = () => {
        fetchEvents();
        fetchStatistics();
    };

    return {
        events,
        statistics,
        pagination,
        isLoading,
        isLoadingStats,
        filters,
        setFilters,
        createEvent,
        updateEvent,
        deleteEvent,
        startEvent,
        shareEvent,
        refetch,
    };
}

// Hook for single event with details
interface UseEventReturn {
    event: Event | null;
    instances: EventInstance[];
    registrations: EventRegistration[];
    isLoading: boolean;
    isLoadingInstances: boolean;
    isLoadingRegistrations: boolean;
    createInstance: (data: Omit<CreateEventInstanceDTO, 'eventId'>) => Promise<EventInstance | null>;
    register: (data: Omit<CreateRegistrationDTO, 'eventId'>) => Promise<EventRegistration | null>;
    checkIn: (data: CheckInDTO) => Promise<CheckInResult | null>;
    getQRCode: () => Promise<string | null>;
    refetch: () => void;
}

export function useEvent(eventId: string | null): UseEventReturn {
    const [event, setEvent] = useState<Event | null>(null);
    const [instances, setInstances] = useState<EventInstance[]>([]);
    const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingInstances, setIsLoadingInstances] = useState(false);
    const [isLoadingRegistrations, setIsLoadingRegistrations] = useState(false);
    const { toast } = useToast();

    const fetchEvent = useCallback(async () => {
        if (!eventId) return;

        setIsLoading(true);
        try {
            const data = await eventsApi.getById(eventId);
            setEvent(data);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to load event',
                description: error.message || 'Something went wrong',
            });
        } finally {
            setIsLoading(false);
        }
    }, [eventId, toast]);

    const fetchInstances = useCallback(async () => {
        if (!eventId) return;

        setIsLoadingInstances(true);
        try {
            const data = await eventsApi.getInstances(eventId);
            setInstances(data);
        } catch (error: any) {
            console.error('Failed to load instances:', error);
        } finally {
            setIsLoadingInstances(false);
        }
    }, [eventId]);

    const fetchRegistrations = useCallback(async () => {
        if (!eventId) return;

        setIsLoadingRegistrations(true);
        try {
            const data = await eventsApi.getRegistrations(eventId);
            setRegistrations(data.registrations);
        } catch (error: any) {
            console.error('Failed to load registrations:', error);
        } finally {
            setIsLoadingRegistrations(false);
        }
    }, [eventId]);

    useEffect(() => {
        fetchEvent();
        fetchInstances();
        fetchRegistrations();
    }, [fetchEvent, fetchInstances, fetchRegistrations]);

    const createInstance = async (data: Omit<CreateEventInstanceDTO, 'eventId'>): Promise<EventInstance | null> => {
        if (!eventId) return null;

        try {
            const instance = await eventsApi.createInstance({ ...data, eventId });
            toast({
                title: 'Instance created',
                description: 'Event instance has been created.',
            });
            fetchInstances();
            return instance;
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to create instance',
                description: error.message || 'Something went wrong',
            });
            return null;
        }
    };

    const register = async (data: Omit<CreateRegistrationDTO, 'eventId'>): Promise<EventRegistration | null> => {
        if (!eventId) return null;

        try {
            const registration = await eventsApi.register({ ...data, eventId });
            toast({
                title: 'Registration successful',
                description: `Confirmation code: ${registration.confirmationCode}`,
            });
            fetchRegistrations();
            fetchEvent(); // Refresh registration count
            return registration;
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Registration failed',
                description: error.message || 'Something went wrong',
            });
            return null;
        }
    };

    const checkIn = async (data: CheckInDTO): Promise<CheckInResult | null> => {
        try {
            const result = await eventsApi.checkIn(data);
            if (result.success) {
                toast({
                    title: 'Check-in successful',
                    description: `${result.attendee?.name} has been checked in.`,
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Check-in failed',
                    description: result.message,
                });
            }
            return result;
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Check-in failed',
                description: error.message || 'Something went wrong',
            });
            return null;
        }
    };

    const getQRCode = async (): Promise<string | null> => {
        if (!eventId) return null;

        try {
            const result = await eventsApi.getQRCode(eventId);
            return result.qrCode;
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to generate QR code',
                description: error.message || 'Something went wrong',
            });
            return null;
        }
    };

    const refetch = () => {
        fetchEvent();
        fetchInstances();
        fetchRegistrations();
    };

    return {
        event,
        instances,
        registrations,
        isLoading,
        isLoadingInstances,
        isLoadingRegistrations,
        createInstance,
        register,
        checkIn,
        getQRCode,
        refetch,
    };
}