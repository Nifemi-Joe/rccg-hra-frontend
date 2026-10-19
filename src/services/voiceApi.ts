// src/services/api/voiceApi.ts
import api from '@/lib/api.ts';

export const voiceApi = {
    sendVoiceCall: (data: {
        phoneNumber: string;
        code: number;
        recipientName?: string;
    }) =>
        api.post('/voice/call', data),

    sendVoiceOTP: (data: {
        phoneNumber: string;
        pinLength?: number;
        pinAttempts?: number;
        pinTimeToLive?: number;
    }) =>
        api.post('/voice/otp', data),

    getVoiceCalls: (params?: {
        status?: string;
        page?: number;
        limit?: number;
    }) =>
        api.get('/voice/calls', { params }),
};