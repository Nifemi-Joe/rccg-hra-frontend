// src/hooks/useCurrency.ts

import { useAuth } from '@/contexts/AuthContext';
import { Currency, getCurrencyByCode, formatCurrency as formatCurrencyUtil, DEFAULT_CURRENCY } from '@/types/currency';
import { useCallback, useMemo } from 'react';

export interface UseCurrencyReturn {
    currency: Currency;
    currencyCode: string;
    currencySymbol: string;
    formatCurrency: (amount: number, options?: {
        showSymbol?: boolean;
        showCode?: boolean;
        compact?: boolean;
    }) => string;
    formatCompact: (amount: number) => string;
}

export const useCurrency = (): UseCurrencyReturn => {
    const { church } = useAuth();

    const currency = useMemo(() => {
        if (church?.currency) {
            return getCurrencyByCode(church.currency);
        }
        return DEFAULT_CURRENCY;
    }, [church?.currency]);

    const formatCurrency = useCallback(
        (amount: number, options?: {
            showSymbol?: boolean;
            showCode?: boolean;
            compact?: boolean;
        }) => {
            return formatCurrencyUtil(amount, currency, options);
        },
        [currency]
    );

    const formatCompact = useCallback(
        (amount: number) => {
            return formatCurrencyUtil(amount, currency, { compact: true });
        },
        [currency]
    );

    return {
        currency,
        currencyCode: currency.code,
        currencySymbol: currency.symbol,
        formatCurrency,
        formatCompact,
    };
};

export default useCurrency;