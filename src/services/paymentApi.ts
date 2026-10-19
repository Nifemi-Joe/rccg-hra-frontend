// src/services/paymentApi.ts
import api from '@/lib/api.ts';

export interface PaymentInitResponse {
    reference: string;
    authorizationUrl: string;
    accessCode: string;
    amount: number;
    units: number;
}

export interface PaymentVerificationData {
    success: boolean;
    churchId: string;
    channel: string;
    units: number;
    amount: number;
}

export interface PaymentVerificationResponse {
    success: boolean;
    message: string;
    data: PaymentVerificationData;
}

export interface PaymentInitApiResponse {
    success: boolean;
    message: string;
    data: PaymentInitResponse;
}

export interface PublicKeyResponse {
    success: boolean;
    data: {
        publicKey: string;
    };
}

export interface PaymentHistoryItem {
    id: string;
    church_id: string;
    channel: string;
    type: string;
    units: number;
    amount: number;
    reference: string;
    description: string;
    status: string;
    created_at: string;
}

export interface PaymentHistoryResponse {
    success: boolean;
    data: PaymentHistoryItem[];
    pagination: {
        total: number;
        page: number;
        limit: number;
    };
}

export const paymentApi = {
    getPublicKey: (): Promise<PublicKeyResponse> =>
        api.get<PublicKeyResponse>('/payments/paystack/public-key'),

    initializePurchase: (data: {
        channel: 'sms' | 'email' | 'whatsapp' | 'voice' | 'combo';
        packageId?: string;
        units?: number;
        email: string;
        callbackUrl?: string;
    }): Promise<PaymentInitApiResponse> =>
        api.post<PaymentInitApiResponse>('/payments/purchase/initialize', data),

    verifyPayment: (reference: string): Promise<PaymentVerificationResponse> =>
        api.get<PaymentVerificationResponse>(`/payments/purchase/verify/${reference}`),

    getPaymentHistory: (params?: {
        status?: string;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
    }): Promise<PaymentHistoryResponse> =>
        api.get<PaymentHistoryResponse>('/payments/history', { params }),
};