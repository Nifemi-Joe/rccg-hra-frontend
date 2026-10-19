// src/services/celebrationApi.ts

import api from '@/lib/api';
import {
    Celebration,
    CelebrationFilters,
    PaginatedCelebrations,
} from '@/types/celebration';

const BASE_URL = '/celebrations';

const extractData = (response: any): any => {
    if (response?.data?.data) return response.data.data;
    if (response?.data) return response.data;
    return response;
};

const transformCelebration = (c: any): Celebration => ({
    id: c.id,
    memberId: c.memberId || c.member_id,
    memberName: c.memberName || c.member_name,
    firstName: c.firstName || c.first_name,
    lastName: c.lastName || c.last_name,
    email: c.email,
    phone: c.phone,
    profileImageUrl: c.profileImageUrl || c.profile_image_url,
    date: c.date,
    dayLabel: c.dayLabel || c.day_label,
    type: c.type,
    age: c.age,
    yearsMarried: c.yearsMarried || c.years_married,
    daysUntil: c.daysUntil || c.days_until || 0,
});

export const celebrationApi = {
    getCelebrations: async (filters: CelebrationFilters = {}): Promise<PaginatedCelebrations> => {
        const params = new URLSearchParams();
        if (filters.type) params.append('type', filters.type);
        if (filters.daysAhead) params.append('daysAhead', String(filters.daysAhead));
        if (filters.page) params.append('page', String(filters.page));
        if (filters.limit) params.append('limit', String(filters.limit));

        const response = await api.get(`${BASE_URL}?${params.toString()}`);
        const data = extractData(response);

        return {
            celebrations: (data.celebrations || []).map(transformCelebration),
            pagination: data.pagination || { total: 0, page: 1, limit: 50, totalPages: 0 },
            summary: data.summary || {
                todayBirthdays: 0,
                todayAnniversaries: 0,
                thisWeekBirthdays: 0,
                thisWeekAnniversaries: 0,
                thisMonthBirthdays: 0,
                thisMonthAnniversaries: 0,
            },
        };
    },

    getTodayCelebrations: async (): Promise<Celebration[]> => {
        const response = await api.get(`${BASE_URL}/today`);
        const data = extractData(response);
        return (Array.isArray(data) ? data : []).map(transformCelebration);
    },
};