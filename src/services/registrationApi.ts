// src/services/registrationApi.ts
import axios from 'axios';
import {
    RegistrantSearchResult,
    EventOption,
    EventInstance,
    TicketType,
    ManualRegistrationForm,
    RegistrationResponse,
    RegistrationStats,
    ProfileFormData, EventAttendee, QuickCheckInMember
} from '@/types/registration';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://rccghralekkibackend.onrender.com/api/v1';

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const registrationApi = {
    // Search for registrants
    searchRegistrants: async (
        search: string,
        includeMembers = true,
        includeFirstTimers = true
    ): Promise<RegistrantSearchResult[]> => {
        const { data } = await api.get('/registrations/search', {
            params: { search, includeMembers, includeFirstTimers, limit: 20 }
        });
        return data.data;
    },

    // Get registrant details
    getRegistrantDetails: async (
        id: string,
        type: 'member' | 'first_timer'
    ): Promise<RegistrantSearchResult> => {
        const { data } = await api.get(`/registrations/registrant/${id}`, {
            params: { type }
        });
        return data.data;
    },

    // Get event options for registration
    getEventOptions: async (eventId: string): Promise<{
        event: EventOption;
        instances: EventInstance[];
        ticketTypes: TicketType[];
    }> => {
        const { data } = await api.get(`/registrations/event/${eventId}/options`);
        return data.data;
    },

    // Register for event
    registerForEvent: async (formData: ManualRegistrationForm): Promise<RegistrationResponse> => {
        const { data } = await api.post('/registrations', formData);
        return data.data;
    },

    // Bulk register
    bulkRegister: async (eventId: string, registrations: any[], options?: {
        sendNotifications?: boolean;
        notificationChannels?: string[];
    }): Promise<any> => {
        const { data } = await api.post('/registrations/bulk', {
            eventId,
            registrations,
            ...options
        });
        return data.data;
    },

    // Get registration stats for event
    getEventStats: async (eventId: string): Promise<RegistrationStats> => {
        const { data } = await api.get(`/registrations/event/${eventId}/stats`);
        return data.data;
    },

    // Get event attendees (registered people)
    getEventAttendees: async (
        eventId: string,
        options?: { instanceId?: string; search?: string }
    ): Promise<EventAttendee[]> => {
        const params = new URLSearchParams();
        if (options?.instanceId) params.append('instanceId', options.instanceId);
        if (options?.search) params.append('search', options.search);

        const { data } = await api.get(
            `/registrations/event/${eventId}/attendees?${params.toString()}`
        );
        return data.data;
    },

    // Get all members for quick check-in
    getAllMembers: async (search?: string, limit = 100): Promise<QuickCheckInMember[]> => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        params.append('limit', limit.toString());

        const { data } = await api.get(`/registrations/members/all?${params.toString()}`);
        return data.data;
    },

    // Quick check-in
    quickCheckIn: async (checkInData: {
        eventId: string;
        eventInstanceId?: string;
        registrationId?: string;
        memberId?: string;
        walkIn?: {
            type: 'first_timer' | 'guest';
            firstName: string;
            lastName: string;
            email?: string;
            phone?: string;
            gender?: string;
            isFirstTimer?: boolean;
        };
    }): Promise<{
        registrationId: string;
        registrantName: string;
        checkInTime: string;
        newRecord?: any;
    }> => {
        const { data } = await api.post('/registrations/quick-checkin', checkInData);
        return data.data;
    },

    // Undo check-in
    undoCheckIn: async (registrationId: string): Promise<void> => {
        await api.post(`/registrations/undo-checkin/${registrationId}`);
    },

    // Get recent check-ins
    getRecentCheckIns: async (
        eventId: string,
        options?: { instanceId?: string; limit?: number }
    ): Promise<Array<{
        id: string;
        name: string;
        time: string;
        type: string;
    }>> => {
        const params = new URLSearchParams();
        if (options?.instanceId) params.append('instanceId', options.instanceId);
        if (options?.limit) params.append('limit', options.limit.toString());

        const { data } = await api.get(
            `/registrations/event/${eventId}/recent-checkins?${params.toString()}`
        );
        return data.data;
    },

    // Resend notification
    resendNotification: async (
        registrationId: string,
        channels: string[]
    ): Promise<{ sent: string[]; failed: string[] }> => {
        const { data } = await api.post(
            `/registrations/${registrationId}/resend-notification`,
            { channels }
        );
        return data.data;
    },

    // Get all events for dropdown
    getEvents: async (): Promise<EventOption[]> => {
        const { data } = await api.get('/events', {
            params: { isActive: true, limit: 50 }
        });
        return data.data.events;
    }
};

// Public API (no auth required)
export const publicApi = {
    // Get profile form data
    getProfileForm: async (token: string): Promise<ProfileFormData> => {
        const { data } = await axios.get(`${API_BASE_URL}/complete-profile/${token}`);
        return data.data;
    },

    // Submit profile completion
    submitProfile: async (token: string, profileData: Record<string, any>): Promise<any> => {
        const { data } = await axios.post(`${API_BASE_URL}/complete-profile/${token}`, profileData);
        return data.data;
    },

    // Upload profile file
    uploadProfileFile: async (token: string, file: File): Promise<any> => {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await axios.post(
            `${API_BASE_URL}/complete-profile/${token}/upload`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return data.data;
    },

    // Download template
    getTemplateUrl: (format: 'csv' | 'xlsx', type: 'member' | 'first_timer'): string => {
        return `${API_BASE_URL}/templates/profile-completion.${format}?type=${type}`;
    }
};