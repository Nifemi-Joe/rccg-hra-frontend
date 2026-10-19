// src/hooks/useImport.ts
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { membersApi, firstTimersApi, familiesApi, groupsApi } from '@/lib/api';
import {
    ParsedRow,
    ImportType,
    transformForApi,
} from '@/lib/importUtils';

interface ImportResult {
    success: number;
    failed: number;
    errors: string[];
}

export function useImport(importType: ImportType) {
    const [isImporting, setIsImporting] = useState(false);
    const { toast } = useToast();

    const getApi = useCallback((type: ImportType) => {
        switch (type) {
            case 'members':
                return membersApi;
            case 'first_timers':
                return firstTimersApi;
            case 'families':
                return familiesApi;
            case 'groups':
                return groupsApi;
            default:
                throw new Error(`Unknown import type: ${type}`);
        }
    }, []);

    const importData = useCallback(async (rows: ParsedRow[]): Promise<ImportResult> => {
        setIsImporting(true);
        const result: ImportResult = {
            success: 0,
            failed: 0,
            errors: [],
        };

        try {
            const transformedData = transformForApi(rows, importType);
            const api = getApi(importType);

            // Process in batches of 10
            const batchSize = 10;
            for (let i = 0; i < transformedData.length; i += batchSize) {
                const batch = transformedData.slice(i, i + batchSize);

                const batchPromises = batch.map(async (item, batchIndex) => {
                    const originalRow = rows[i + batchIndex];
                    const rowNumber = originalRow.rowNumber;
                    try {
                        await api.create(item as any);
                        return { success: true, rowNumber };
                    } catch (error: any) {
                        return {
                            success: false,
                            rowNumber,
                            error: error.message || 'Unknown error',
                        };
                    }
                });

                const batchResults = await Promise.all(batchPromises);

                batchResults.forEach(res => {
                    if (res.success) {
                        result.success++;
                    } else {
                        result.failed++;
                        result.errors.push(`Row ${res.rowNumber}: ${res.error}`);
                    }
                });
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Import Error',
                description: error.message || 'An error occurred during import',
            });
        } finally {
            setIsImporting(false);
        }

        return result;
    }, [importType, toast, getApi]);

    return {
        importData,
        isImporting,
    };
}