// src/services/walletApi.ts
import api from '@/lib/api';

// ============================================================================
// TYPES
// ============================================================================

export interface Wallet {
    id: string;
    church_id: string;
    sms_balance: number;
    email_balance: number;
    whatsapp_balance: number;
    voice_balance: number;
    currency: string;
    created_at: string;
    updated_at: string;
}

export interface WalletTransaction {
    id: string;
    church_id: string;
    type: 'credit' | 'debit' | 'refund' | 'bonus';
    channel: 'sms' | 'email' | 'whatsapp' | 'voice' | 'all';
    units: number;
    amount: number;
    balance_before: number;
    balance_after: number;
    reference?: string;
    description?: string;
    payment_method?: string;
    payment_reference?: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded' | 'processing';
    metadata?: any;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

export interface WalletAnalytics {
    totalRevenue: number;
    totalRefunds: number;
    totalPurchases: number;
    totalUnitsDistributed: number;
    byChannel?: Array<{
        channel: string;
        total_revenue: number;
        total_refunds: number;
        total_purchases: number;
        units_used: number;
        units_purchased: number;
    }>;
}

export interface UnitPackage {
    id: string;
    name: string;
    channel: 'sms' | 'email' | 'whatsapp' | 'voice' | 'combo';
    units: number;
    price: number;
    bonus_units: number;
    discount_percent: number;
    currency: string;
    is_popular: boolean;
    is_active: boolean;
    sort_order: number;
    description?: string;
    created_at: string;
    updated_at: string;
}

export interface TransactionFilters {
    channel?: string;
    type?: string;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface WalletResponse {
    success: boolean;
    data: Wallet;
}

export interface AllBalancesResponse {
    success: boolean;
    data: {
        sms: number;
        email: number;
        whatsapp: number;
        voice: number;
        termii?: {
            balance: number;
            currency: string;
        };
    };
}

export interface TransactionsResponse {
    success: boolean;
    data: WalletTransaction[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface AnalyticsResponse {
    success: boolean;
    data: WalletAnalytics;
}

export interface BalanceResponse {
    success: boolean;
    data: {
        channel: string;
        balance: number;
    };
}

export interface RefundResponse {
    success: boolean;
    message: string;
    data: WalletTransaction;
}

export interface PricingResponse {
    success: boolean;
    data: any[];
}

export interface PricingChannelResponse {
    success: boolean;
    data: any;
}

export interface PackagesResponse {
    success: boolean;
    data: UnitPackage[];
}

export interface PackageResponse {
    success: boolean;
    data: UnitPackage;
}

// ============================================================================
// API
// ============================================================================

export const walletApi = {
    // Wallet
    getWallet: async (): Promise<WalletResponse> => {
        const { data } = await api.get<WalletResponse>('/wallet');
        return data;
    },

    getAllBalances: async (): Promise<AllBalancesResponse> => {
        const { data } = await api.get<AllBalancesResponse>('/wallet/balances');
        return data;
    },

    getBalance: async (channel: string): Promise<BalanceResponse> => {
        const { data } = await api.get<BalanceResponse>(`/wallet/balance/${channel}`);
        return data;
    },

    // Transactions
    getTransactions: async (filters: TransactionFilters): Promise<TransactionsResponse> => {
        const params: Record<string, any> = {};
        if (filters.channel) params.channel = filters.channel;
        if (filters.type) params.type = filters.type;
        if (filters.status) params.status = filters.status;
        if (filters.search) params.search = filters.search;
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;
        if (filters.page) params.page = filters.page;
        if (filters.limit) params.limit = filters.limit;

        const { data } = await api.get<TransactionsResponse>('/wallet/transactions', { params });
        return data;
    },

    // Analytics
    getAnalytics: async (startDate: string, endDate: string): Promise<AnalyticsResponse> => {
        const { data } = await api.get<AnalyticsResponse>('/wallet/analytics', {
            params: { startDate, endDate },
        });
        return data;
    },

    // Refund
    refundTransaction: async (
        transactionId: string,
        refundAmount: number,
        reason: string
    ): Promise<RefundResponse> => {
        const { data } = await api.post<RefundResponse>(
            `/wallet/transactions/${transactionId}/refund`,
            { refundAmount, reason }
        );
        return data;
    },

    // Export
    exportTransactions: async (filters: {
        channel?: string;
        type?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<Blob> => {
        const params: Record<string, any> = {};
        if (filters.channel) params.channel = filters.channel;
        if (filters.type) params.type = filters.type;
        if (filters.status) params.status = filters.status;
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;

        const response = await api.get('/wallet/transactions/export', {
            params,
            responseType: 'blob',
        });
        return response.data as Blob;
    },

    // Pricing
    getAllPricing: async (): Promise<PricingResponse> => {
        const { data } = await api.get<PricingResponse>('/pricing');
        return data;
    },

    getPricingByChannel: async (
        channel: string,
        countryCode?: string
    ): Promise<PricingChannelResponse> => {
        const params: Record<string, any> = {};
        if (countryCode) params.countryCode = countryCode;
        const { data } = await api.get<PricingChannelResponse>(`/pricing/${channel}`, { params });
        return data;
    },

    calculateCost: async (
        channel: string,
        units: number,
        countryCode?: string
    ): Promise<{ success: boolean; data: any }> => {
        const params: Record<string, any> = { channel, units };
        if (countryCode) params.countryCode = countryCode;
        const { data } = await api.get('/pricing/calculate', { params });
        return data;
    },

    // Packages
    getAllPackages: async (channel?: string): Promise<PackagesResponse> => {
        const params: Record<string, any> = {};
        if (channel) params.channel = channel;
        const { data } = await api.get<PackagesResponse>('/packages', { params });
        return data;
    },

    getPackageById: async (id: string): Promise<PackageResponse> => {
        const { data } = await api.get<PackageResponse>(`/packages/${id}`);
        return data;
    },
};