// src/services/financialApi.ts

import api from '@/lib/api';
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
    FinancialSummary,
    PaginatedResponse,
    BatchOfferingDTO,
    EventForOffering,
    EventInstanceForOffering,
    EventFinancials,
    MonthlyTrendItem,
    MonthlyTrendFilters,
} from '@/types/financial';

const BASE_URL = '/financials';

// Helper to format date to yyyy-MM-dd
const formatDateForInput = (date: string | Date | undefined): string => {
    if (!date) return '';
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().split('T')[0];
    } catch {
        return '';
    }
};

// Helper to transform snake_case to camelCase for accounts
const transformAccount = (acc: any): Account => ({
    id: acc.id,
    churchId: acc.church_id || acc.churchId,
    name: acc.name,
    accountType: acc.account_type || acc.accountType,
    description: acc.description,
    accountNumber: acc.account_number || acc.accountNumber,
    bankName: acc.bank_name || acc.bankName,
    balance: parseFloat(acc.balance || 0),
    isActive: acc.is_active ?? acc.isActive ?? true,
    transactionCount: parseInt(acc.transaction_count || acc.transactionCount || 0),
    createdAt: acc.created_at || acc.createdAt,
    updatedAt: acc.updated_at || acc.updatedAt,
});

// Helper to transform transaction
const transformTransaction = (t: any): Transaction => ({
    id: t.id,
    churchId: t.churchId || t.church_id,
    accountId: t.accountId || t.account_id,
    accountName: t.accountName || t.account_name,
    transactionType: t.transactionType || t.transaction_type,
    amount: parseFloat(t.amount || 0),
    description: t.description,
    referenceNumber: t.referenceNumber || t.reference_number,
    memberId: t.memberId || t.member_id,
    memberFirstName: t.memberFirstName || t.member_first_name,
    memberLastName: t.memberLastName || t.member_last_name,
    donorName: t.donorName || t.donor_name,
    eventId: t.eventId || t.event_id,
    eventInstanceId: t.eventInstanceId || t.event_instance_id,
    eventName: t.eventName || t.event_name,
    eventDate: formatDateForInput(t.eventDate || t.event_date),
    eventType: t.eventType || t.event_type,
    serviceReportId: t.serviceReportId || t.service_report_id,
    expenseCategoryId: t.expenseCategoryId || t.expense_category_id,
    expenseCategoryName: t.expenseCategoryName || t.expense_category_name,
    paymentMethod: t.paymentMethod || t.payment_method,
    transactionDate: formatDateForInput(t.transactionDate || t.transaction_date),
    recordedBy: t.recordedBy || t.recorded_by,
    recordedByName: t.recordedByName || t.recorded_by_name,

    // Approval fields
    approvalStatus: t.approvalStatus || t.approval_status,
    submittedBy: t.submittedBy || t.submitted_by,
    submittedByName: t.submittedByName || t.submitted_by_name,
    submittedAt: t.submittedAt || t.submitted_at,
    approvedBy: t.approvedBy || t.approved_by,
    approvedByName: t.approvedByName || t.approved_by_name,
    approvedAt: t.approvedAt || t.approved_at,
    rejectionReason: t.rejectionReason || t.rejection_reason,

    createdAt: t.createdAt || t.created_at,
    updatedAt: t.updatedAt || t.updated_at,
});

// Helper to transform monthly trend item
const transformMonthlyTrendItem = (item: any): MonthlyTrendItem => ({
    month: item.month,
    monthFull: item.monthFull || item.month_full,
    monthNumber: parseInt(item.monthNumber || item.month_number || 0),
    year: parseInt(item.year || 0),
    income: parseFloat(item.income || 0),
    expenses: parseFloat(item.expenses || 0),
    net: parseFloat(item.net || 0),
    transactionCount: parseInt(item.transactionCount || item.transaction_count || 0),
    incomeCount: parseInt(item.incomeCount || item.income_count || 0),
    expenseCount: parseInt(item.expenseCount || item.expense_count || 0),
});



// Helper to transform summary
const transformSummary = (data: any): FinancialSummary => {
    // Transform monthly trend if present
    let monthlyTrend: MonthlyTrendItem[] | undefined;
    const rawTrend = data.monthly_trend || data.monthlyTrend;

    if (rawTrend && Array.isArray(rawTrend)) {
        monthlyTrend = rawTrend.map(transformMonthlyTrendItem);
    }

    return {
        totalIncome: parseFloat(data.total_income || data.totalIncome || 0),
        totalExpenses: parseFloat(data.total_expenses || data.totalExpenses || 0),
        netBalance: parseFloat(data.net_balance || data.netBalance || 0),
        incomeBreakdown: {
            tithes: parseFloat(data.income_breakdown?.tithes || data.incomeBreakdown?.tithes || 0),
            offerings: parseFloat(data.income_breakdown?.offerings || data.incomeBreakdown?.offerings || 0),
            donations: parseFloat(data.income_breakdown?.donations || data.incomeBreakdown?.donations || 0),
            pledges: parseFloat(data.income_breakdown?.pledges || data.incomeBreakdown?.pledges || 0),
            other: parseFloat(data.income_breakdown?.other || data.incomeBreakdown?.other || 0),
        },
        paymentChannels: {
            cash: parseFloat(data.payment_channels?.cash || data.paymentChannels?.cash || 0),
            bankTransfer: parseFloat(data.payment_channels?.bank_transfer || data.paymentChannels?.bankTransfer || 0),
            card: parseFloat(data.payment_channels?.card || data.paymentChannels?.card || 0),
            mobileMoney: parseFloat(data.payment_channels?.mobile_money || data.paymentChannels?.mobileMoney || 0),
            online: parseFloat(data.payment_channels?.online || data.paymentChannels?.online || 0),
            other: parseFloat(data.payment_channels?.other || data.paymentChannels?.other || 0),
        },
        expensesByCategory: (data.expenses_by_category || data.expensesByCategory || []).map((cat: any) => ({
            categoryId: cat.category_id || cat.categoryId,
            categoryName: cat.category_name || cat.categoryName,
            amount: parseFloat(cat.amount || 0)
        })),
        monthlyTrend,
    };
};

// Helper to transform expense category
const transformCategory = (cat: any): ExpenseCategory => ({
    id: cat.id,
    churchId: cat.churchId || cat.church_id,
    name: cat.name,
    description: cat.description,
    isPredefined: cat.isPredefined || cat.is_predefined || false,
    usageCount: parseInt(cat.usage_count || cat.usageCount || 0),
    createdAt: cat.createdAt || cat.created_at,
});

// Helper to safely extract data from response
const extractData = (response: any): any => {
    if (response?.data?.data) return response.data.data;
    if (response?.data) return response.data;
    return response;
};

export const financialApi = {
    // ============ ACCOUNTS ============

    getAccounts: async (): Promise<Account[]> => {
        const response = await api.get(`${BASE_URL}/accounts`);
        const data = extractData(response);
        const accounts = Array.isArray(data) ? data : (data?.accounts || []);
        return accounts.map(transformAccount);
    },

    getAccountById: async (id: string): Promise<Account> => {
        const response = await api.get(`${BASE_URL}/accounts/${id}`);
        return transformAccount(extractData(response));
    },

    createAccount: async (data: CreateAccountDTO): Promise<Account> => {
        const response = await api.post(`${BASE_URL}/accounts`, data);
        return transformAccount(extractData(response));
    },

    updateAccount: async (id: string, data: UpdateAccountDTO): Promise<Account> => {
        const response = await api.put(`${BASE_URL}/accounts/${id}`, data);
        return transformAccount(extractData(response));
    },

    deleteAccount: async (id: string): Promise<void> => {
        await api.delete(`${BASE_URL}/accounts/${id}`);
    },

    // ============ TRANSACTIONS ============

    getTransactions: async (filters: TransactionFilters = {}): Promise<PaginatedResponse<Transaction>> => {
        const params = new URLSearchParams();

        if (filters.transactionType) params.append('transactionType', filters.transactionType);
        if (filters.accountId) params.append('accountId', filters.accountId);
        if (filters.eventId) params.append('eventId', filters.eventId);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
        if (filters.expenseCategoryId) params.append('expenseCategoryId', filters.expenseCategoryId);
        if (filters.search) params.append('search', filters.search);
        if (filters.page) params.append('page', String(filters.page));
        if (filters.limit) params.append('limit', String(filters.limit));

        const response = await api.get(`${BASE_URL}/transactions?${params.toString()}`);
        const rawData = extractData(response);

        let transactions: any[] = [];
        let pagination = {
            page: filters.page || 1,
            limit: filters.limit || 20,
            total: 0,
            totalPages: 0
        };

        if (Array.isArray(rawData)) {
            transactions = rawData;
            pagination.total = rawData.length;
            pagination.totalPages = 1;
        } else if (rawData?.data && Array.isArray(rawData.data)) {
            transactions = rawData.data;
            pagination = rawData.pagination || pagination;
        } else if (rawData?.transactions) {
            transactions = rawData.transactions;
            pagination = rawData.pagination || pagination;
        }

        return {
            data: transactions.map(transformTransaction),
            pagination
        };
    },

    getTransactionById: async (id: string): Promise<Transaction> => {
        const response = await api.get(`${BASE_URL}/transactions/${id}`);
        return transformTransaction(extractData(response));
    },

    createTransaction: async (data: CreateTransactionDTO): Promise<Transaction> => {
        const response = await api.post(`${BASE_URL}/transactions`, data);
        return transformTransaction(extractData(response));
    },

    deleteTransaction: async (id: string): Promise<void> => {
        await api.delete(`${BASE_URL}/transactions/${id}`);
    },

    approveExpense: async (id: string, data: any): Promise<Transaction> => {
        const response = await api.post(`${BASE_URL}/expenses/${id}/approve`, data);
        return transformTransaction(extractData(response));
    },

    getExpenseApprovalSummary: async (): Promise<any> => {
        const response = await api.get(`${BASE_URL}/expenses/approval-summary`);
        const data = extractData(response);
        return {
            pendingCount: data.pendingCount || 0,
            pendingAmount: parseFloat(data.pendingAmount || 0),
            approvedCount: data.approvedCount || 0,
            approvedAmount: parseFloat(data.approvedAmount || 0),
            rejectedCount: data.rejectedCount || 0,
            rejectedAmount: parseFloat(data.rejectedAmount || 0),
        };
    },

    // ============ OFFERINGS ============

    recordOffering: async (data: any): Promise<Transaction> => {
        const response = await api.post(`${BASE_URL}/transactions/offering`, data);
        return transformTransaction(extractData(response));
    },

    recordTithe: async (data: any): Promise<Transaction> => {
        const response = await api.post(`${BASE_URL}/transactions/tithe`, data);
        return transformTransaction(extractData(response));
    },

    recordDonation: async (data: any): Promise<Transaction> => {
        const response = await api.post(`${BASE_URL}/transactions/donation`, data);
        return transformTransaction(extractData(response));
    },

    recordBatchOffering: async (data: BatchOfferingDTO): Promise<Transaction[]> => {
        const response = await api.post(`${BASE_URL}/transactions/batch-offering`, data);
        const result = extractData(response);

        if (result?.transactions && Array.isArray(result.transactions)) {
            return result.transactions.map(transformTransaction);
        }
        if (Array.isArray(result)) {
            return result.map(transformTransaction);
        }
        if (result?.id) {
            return [transformTransaction(result)];
        }
        return [];
    },

    getOfferingsForEvent: async (eventId: string): Promise<Transaction[]> => {
        const response = await api.get(`${BASE_URL}/transactions/offerings/event?eventId=${eventId}`);
        const data = extractData(response);
        const offerings = Array.isArray(data) ? data : (data?.offerings || []);
        return offerings.map(transformTransaction);
    },

    // ============ EXPENSES ============

    recordExpense: async (data: CreateExpenseDTO): Promise<Transaction> => {
        const response = await api.post(`${BASE_URL}/transactions/expense`, data);
        return transformTransaction(extractData(response));
    },

    getExpensesForEvent: async (eventId: string): Promise<Transaction[]> => {
        const response = await api.get(`${BASE_URL}/transactions/expense/event?eventId=${eventId}`);
        const data = extractData(response);
        const expenses = Array.isArray(data) ? data : (data?.expenses || []);
        return expenses.map(transformTransaction);
    },

    // ============ EVENT FINANCIALS ============

    getEventFinancials: async (eventId: string): Promise<EventFinancials> => {
        const response = await api.get(`${BASE_URL}/events/${eventId}/financials`);
        const data = extractData(response);
        return {
            totalOfferings: parseFloat(data.totalOfferings || 0),
            totalExpenses: parseFloat(data.totalExpenses || 0),
            netAmount: parseFloat(data.netAmount || 0),
            breakdown: data.breakdown,
            offeringCount: parseInt(data.offeringCount || 0),
            expenseCount: parseInt(data.expenseCount || 0)
        };
    },

    // ============ EXPENSE CATEGORIES ============

    getExpenseCategories: async (): Promise<ExpenseCategory[]> => {
        const response = await api.get(`${BASE_URL}/expense-categories`);
        const data = extractData(response);
        const categories = Array.isArray(data) ? data : (data?.categories || []);
        return categories.map(transformCategory);
    },

    createExpenseCategory: async (data: CreateExpenseCategoryDTO): Promise<ExpenseCategory> => {
        const response = await api.post(`${BASE_URL}/expense-categories`, data);
        return transformCategory(extractData(response));
    },

    updateExpenseCategory: async (id: string, data: CreateExpenseCategoryDTO): Promise<ExpenseCategory> => {
        const response = await api.put(`${BASE_URL}/expense-categories/${id}`, data);
        return transformCategory(extractData(response));
    },

    deleteExpenseCategory: async (id: string): Promise<void> => {
        await api.delete(`${BASE_URL}/expense-categories/${id}`);
    },

    // ============ EVENTS FOR OFFERINGS ============

    getEventsForOffering: async (): Promise<EventForOffering[]> => {
        const response = await api.get('/events?limit=100');
        const data = extractData(response);
        const events = data?.events || (Array.isArray(data) ? data : []);

        return events.map((e: any) => ({
            id: e.id,
            name: e.name,
            eventType: e.eventType || e.event_type,
            startDate: formatDateForInput(e.startDate || e.start_date),
            startTime: e.startTime || e.start_time,
            locationName: e.locationName || e.location_name,
            financials: e.financials ? {
                totalOfferings: parseFloat(e.financials.totalOfferings || 0),
                totalExpenses: parseFloat(e.financials.totalExpenses || 0),
                netAmount: parseFloat(e.financials.netAmount || 0),
                breakdown: e.financials.breakdown,
                offeringCount: parseInt(e.financials.offeringCount || 0),
                expenseCount: parseInt(e.financials.expenseCount || 0)
            } : undefined
        }));
    },

    getEventInstances: async (eventId: string): Promise<EventInstanceForOffering[]> => {
        const response = await api.get(`/events/${eventId}/instances?limit=50`);
        const data = extractData(response);
        const instances = data?.instances || (Array.isArray(data) ? data : []);

        return instances.map((i: any) => ({
            id: i.id,
            eventId: i.eventId || i.event_id,
            instanceDate: formatDateForInput(i.instanceDate || i.instance_date),
            startTime: i.startTime || i.start_time,
            status: i.status,
            attendanceCount: i.attendanceCount || i.attendance_count,
            hasServiceReport: i.hasServiceReport || i.has_service_report || false,
            serviceReportId: i.serviceReportId || i.service_report_id,
        }));
    },

    // ============ SUMMARY ============

    /**
     * Get financial summary with optional monthly trend
     * @param startDate - Filter start date
     * @param endDate - Filter end date
     * @param includeTrend - Include monthly trend data (default: true)
     * @param trendMonths - Number of months for trend (default: 6)
     */
    getFinancialSummary: async (
        startDate?: string,
        endDate?: string,
        includeTrend: boolean = true,
        trendMonths: number = 6
    ): Promise<FinancialSummary> => {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        params.append('include_trend', String(includeTrend));
        params.append('trend_months', String(trendMonths));

        const response = await api.get(`${BASE_URL}/summary?${params.toString()}`);
        return transformSummary(extractData(response));
    },

    // ============ MONTHLY TREND (STANDALONE) ============

    /**
     * Get monthly trend data
     * @param filters - Optional filters for months, startDate, endDate
     */
    getMonthlyTrend: async (filters: MonthlyTrendFilters = {}): Promise<MonthlyTrendItem[]> => {
        const params = new URLSearchParams();

        if (filters.months) params.append('months', String(filters.months));
        if (filters.startDate) params.append('start_date', filters.startDate);
        if (filters.endDate) params.append('end_date', filters.endDate);

        const response = await api.get(`${BASE_URL}/monthly-trend?${params.toString()}`);
        const data = extractData(response);

        // Handle different response formats
        const trendData = Array.isArray(data) ? data : (data?.trend || data?.monthlyTrend || []);

        return trendData.map(transformMonthlyTrendItem);
    },
};