// src/components/financials/BankStatementImport.tsx

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Upload,
    FileText,
    CheckCircle,
    XCircle,
    AlertCircle,
    Loader2,
    Download,
    DollarSign,
    HandHeart,
    Heart,
    Gift,
    TrendingUp,
} from 'lucide-react';
import { useAccounts, useEventsForOffering } from '@/hooks/useFinancials';
import { useCurrency } from '@/hooks/useCurrency';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface ParsedTransaction {
    date: string;
    reference: string;
    details: string;
    amount: number;
    category: 'tithe' | 'offering' | 'donation' | 'thanksgiving' | 'first_fruit' | 'unknown';
    donorName?: string;
    description?: string;
}

interface ImportSummary {
    total: number;
    valid: number;
    invalid: number;
    byCategory: Record<string, { count: number; amount: number }>;
    totalAmount: number;
}

interface BankStatementImportProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

const CATEGORY_CONFIG = {
    tithe: { icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Tithe' },
    offering: { icon: HandHeart, color: 'text-green-600', bg: 'bg-green-100', label: 'Offering' },
    donation: { icon: Heart, color: 'text-pink-600', bg: 'bg-pink-100', label: 'Donation' },
    thanksgiving: { icon: Gift, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Thanksgiving' },
    first_fruit: { icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-100', label: 'First Fruit' },
    unknown: { icon: AlertCircle, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Unknown' },
};

export function BankStatementImport({ open, onOpenChange, onSuccess }: BankStatementImportProps) {
    const { formatCurrency } = useCurrency();
    const { accounts } = useAccounts();
    const { events } = useEventsForOffering();

    const [file, setFile] = useState<File | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
    const [invalidTransactions, setInvalidTransactions] = useState<any[]>([]);
    const [summary, setSummary] = useState<ImportSummary | null>(null);
    const [accountId, setAccountId] = useState('');
    const [eventId, setEventId] = useState('none');
    const [activeTab, setActiveTab] = useState('all');

    const activeAccounts = accounts.filter(a => a.isActive);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setTransactions([]);
            setInvalidTransactions([]);
            setSummary(null);
        }
    };

    const handleParse = async () => {
        if (!file) {
            toast.error('Please select a file');
            return;
        }

        setIsParsing(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post('/financials/bank-statement/parse', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const { transactions: parsedTrans, invalidTransactions: invalid, summary: parsedSummary } =
                response.data.data;

            setTransactions(parsedTrans);
            setInvalidTransactions(invalid);
            setSummary(parsedSummary);

            if (parsedTrans.length === 0) {
                toast.error('No valid transactions found in the file');
            } else {
                toast.success(`Parsed ${parsedTrans.length} valid transactions`);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to parse file');
            console.error('Parse error:', error);
        } finally {
            setIsParsing(false);
        }
    };

    const handleImport = async () => {
        if (!accountId) {
            toast.error('Please select an account');
            return;
        }

        if (transactions.length === 0) {
            toast.error('No transactions to import');
            return;
        }

        setIsImporting(true);
        try {
            const response = await api.post('/financials/bank-statement/import', {
                transactions,
                accountId,
                eventId: eventId !== 'none' ? eventId : undefined,
            });

            const result = response.data.data;

            toast.success(
                `Successfully imported ${result.success} out of ${result.total} transactions`
            );

            if (result.errors.length > 0) {
                console.error('Import errors:', result.errors);
            }

            onSuccess?.();
            handleClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to import transactions');
            console.error('Import error:', error);
        } finally {
            setIsImporting(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setTransactions([]);
        setInvalidTransactions([]);
        setSummary(null);
        setAccountId('');
        setEventId('none');
        onOpenChange(false);
    };

    const filteredTransactions = activeTab === 'all'
        ? transactions
        : transactions.filter(t => t.category === activeTab);

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Import Bank Statement</DialogTitle>
                    <DialogDescription>
                        Upload a CSV or Excel file containing bank transfers for tithes, offerings, donations, etc.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* File Upload Section */}
                    <div className="space-y-4">
                        <div className="border-2 border-dashed rounded-lg p-8 text-center">
                            <input
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileChange}
                                className="hidden"
                                id="bank-statement-upload"
                            />
                            <label
                                htmlFor="bank-statement-upload"
                                className="cursor-pointer flex flex-col items-center gap-2"
                            >
                                <Upload className="h-12 w-12 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">
                                        {file ? file.name : 'Click to upload or drag and drop'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        CSV or Excel file (max 5MB)
                                    </p>
                                </div>
                            </label>
                        </div>

                        {file && !transactions.length && (
                            <Button
                                onClick={handleParse}
                                disabled={isParsing}
                                className="w-full"
                            >
                                {isParsing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Parsing...
                                    </>
                                ) : (
                                    <>
                                        <FileText className="h-4 w-4 mr-2" />
                                        Parse File
                                    </>
                                )}
                            </Button>
                        )}
                    </div>

                    {/* Summary Cards */}
                    {summary && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="border rounded-lg p-4">
                                <p className="text-sm text-muted-foreground">Total Transactions</p>
                                <p className="text-2xl font-bold">{summary.total}</p>
                            </div>
                            <div className="border rounded-lg p-4">
                                <p className="text-sm text-muted-foreground">Valid</p>
                                <p className="text-2xl font-bold text-green-600">{summary.valid}</p>
                            </div>
                            {summary.invalid > 0 && (
                                <div className="border rounded-lg p-4">
                                    <p className="text-sm text-muted-foreground">Invalid</p>
                                    <p className="text-2xl font-bold text-red-600">{summary.invalid}</p>
                                </div>
                            )}
                            <div className="border rounded-lg p-4">
                                <p className="text-sm text-muted-foreground">Total Amount</p>
                                <p className="text-2xl font-bold text-primary">
                                    {formatCurrency(summary.totalAmount)}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Category Breakdown */}
                    {summary && summary.byCategory && (
                        <div className="border rounded-lg p-4">
                            <h3 className="font-medium mb-3">Category Breakdown</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {Object.entries(summary.byCategory).map(([category, data]) => {
                                    const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
                                    const Icon = config.icon;
                                    return (
                                        <div key={category} className="flex items-center gap-2 p-2 border rounded">
                                            <div className={cn('p-2 rounded', config.bg)}>
                                                <Icon className={cn('h-4 w-4', config.color)} />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">{config.label}</p>
                                                <p className="font-medium">{data.count}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatCurrency(data.amount)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Import Settings */}
                    {transactions.length > 0 && (
                        <div className="border rounded-lg p-4 space-y-4">
                            <h3 className="font-medium">Import Settings</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Destination Account <span className="text-destructive">*</span></Label>
                                    <Select value={accountId} onValueChange={setAccountId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select account" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {activeAccounts.map(account => (
                                                <SelectItem key={account.id} value={account.id}>
                                                    {account.name} ({formatCurrency(account.balance)})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Link to Event (Optional)</Label>
                                    <Select value={eventId} onValueChange={setEventId}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No event</SelectItem>
                                            {events.map(event => (
                                                <SelectItem key={event.id} value={event.id}>
                                                    {event.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    All transactions will be imported as <strong>Bank Transfer</strong> payment method.
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}

                    {/* Transactions Table */}
                    {transactions.length > 0 && (
                        <div className="border rounded-lg">
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <div className="p-4 border-b">
                                    <TabsList>
                                        <TabsTrigger value="all">
                                            All ({transactions.length})
                                        </TabsTrigger>
                                        {Object.entries(summary?.byCategory || {}).map(([category, data]) => (
                                            <TabsTrigger key={category} value={category}>
                                                {CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG].label} ({data.count})
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                </div>

                                <div className="max-h-[400px] overflow-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Category</TableHead>
                                                <TableHead>Donor</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredTransactions.map((trans, index) => {
                                                const config = CATEGORY_CONFIG[trans.category];
                                                const Icon = config.icon;
                                                return (
                                                    <TableRow key={index}>
                                                        <TableCell>{trans.date}</TableCell>
                                                        <TableCell>
                                                            <Badge className={cn(config.bg, 'text-xs')}>
                                                                <Icon className={cn('h-3 w-3 mr-1', config.color)} />
                                                                {config.label}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            {trans.donorName || '-'}
                                                        </TableCell>
                                                        <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">
                                                            {trans.description || trans.details}
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium text-green-600">
                                                            {formatCurrency(trans.amount)}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </Tabs>
                        </div>
                    )}

                    {/* Invalid Transactions */}
                    {invalidTransactions.length > 0 && (
                        <Alert variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertDescription>
                                <p className="font-medium">
                                    {invalidTransactions.length} invalid transaction(s) found:
                                </p>
                                <ul className="list-disc list-inside mt-2 text-sm">
                                    {invalidTransactions.slice(0, 5).map((inv, i) => (
                                        <li key={i}>
                                            Row {i + 1}: {inv.errors.join(', ')}
                                        </li>
                                    ))}
                                    {invalidTransactions.length > 5 && (
                                        <li>...and {invalidTransactions.length - 5} more</li>
                                    )}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    {transactions.length > 0 && (
                        <Button
                            onClick={handleImport}
                            disabled={isImporting || !accountId}
                        >
                            {isImporting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <Download className="h-4 w-4 mr-2" />
                                    Import {transactions.length} Transactions
                                </>
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}