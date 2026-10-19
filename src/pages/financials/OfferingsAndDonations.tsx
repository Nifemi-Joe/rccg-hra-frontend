// src/pages/financials/OfferingsAndDonations.tsx

import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ExportDropdown } from '@/components/ExportDropdown';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Plus,
    DollarSign,
    PlayCircle,
    MoreHorizontal,
    Trash2,
    Search,
    TrendingUp,
    Banknote,
    CreditCard,
    Smartphone,
    Receipt,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Eye,
    Loader2,
    X,
    Heart,
    HandHeart,
    Wallet,
    Calendar,
    Clock,
    MapPin,
    Users,
    FileText,
    AlertCircle, Upload,
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts';
import {
    useTransactions,
    useAccounts,
    useOfferings,
    useFinancialSummary,
    useEventsForOffering,
    useEventInstances,
} from '@/hooks/useFinancials';
import {
    Transaction,
    PaymentMethod,
    TransactionType,
} from '@/types/financial';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BankStatementImport } from '@/pages/financials/BankStatementImport';


const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
    { value: 'cash', label: 'Cash', icon: Banknote },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: CreditCard },
    { value: 'card', label: 'Card', icon: CreditCard },
    { value: 'mobile_money', label: 'Mobile Money', icon: Smartphone },
    { value: 'check', label: 'Check', icon: Receipt },
    { value: 'online', label: 'Online', icon: Wallet },
];

const OFFERING_TYPES: { value: string; label: string; icon: React.ElementType; color: string }[] = [
    { value: 'tithe', label: 'Tithe', icon: DollarSign, color: 'text-blue-600' },
    { value: 'offering', label: 'Offering', icon: HandHeart, color: 'text-green-600' },
    { value: 'donation', label: 'Donation', icon: Heart, color: 'text-pink-600' },
    { value: 'pledge', label: 'Pledge', icon: Wallet, color: 'text-purple-600' },
];

const CHART_COLORS = ['#3b82f6', '#10b981', '#ec4899', '#f59e0b', '#8b5cf6', '#06b6d4'];

// Helper to format date for input
const formatDateForInput = (date: string | Date | undefined): string => {
    if (!date) return format(new Date(), 'yyyy-MM-dd');
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return format(new Date(), 'yyyy-MM-dd');
        return format(d, 'yyyy-MM-dd');
    } catch {
        return format(new Date(), 'yyyy-MM-dd');
    }
};

interface OfferingFormItem {
    id: string;
    type: 'tithe' | 'offering' | 'donation' | 'pledge';
    account_id: string;
    payment_method: PaymentMethod;
    amount: string;
    member_id?: string;
    donor_name?: string;
    description?: string;
}

export default function OfferingsAndDonations() {
    // Currency hook
    const { formatCurrency, formatCompact, currencySymbol } = useCurrency();

    // State
    const [isRecordOpen, setIsRecordOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
    const [showViewDialog, setShowViewDialog] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [isImportOpen, setIsImportOpen] = useState(false);

    // Form state
    const [selectedEventId, setSelectedEventId] = useState<string>('none');
    const [selectedInstanceId, setSelectedInstanceId] = useState<string>('none');
    const [transactionDate, setTransactionDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [offeringItems, setOfferingItems] = useState<OfferingFormItem[]>([
        {
            id: '1',
            type: 'offering',
            account_id: '',
            payment_method: 'cash',
            amount: '',
            description: ''
        }
    ]);
    const [notes, setNotes] = useState('');

    // Hooks
    const {
        transactions,
        pagination,
        isLoading,
        filters,
        setFilters,
        deleteTransaction,
        refetch
    } = useTransactions();

    const { accounts, isLoading: isLoadingAccounts } = useAccounts();
    const { events, isLoading: isLoadingEvents } = useEventsForOffering();
    const { instances, isLoading: isLoadingInstances } = useEventInstances(
        selectedEventId !== 'none' ? selectedEventId : null
    );
    const { recordBatchOffering, isRecording } = useOfferings();
    const { summary, isLoading: isLoadingSummary } = useFinancialSummary();

    // Get selected event details
    const selectedEvent = useMemo(() => {
        if (selectedEventId === 'none') return null;
        return events.find(e => e.id === selectedEventId) || null;
    }, [selectedEventId, events]);

    // Get selected instance details
    const selectedInstance = useMemo(() => {
        if (selectedInstanceId === 'none') return null;
        return instances.find(i => i.id === selectedInstanceId) || null;
    }, [selectedInstanceId, instances]);

    // Update date when event instance is selected
    useEffect(() => {
        if (selectedInstance?.instanceDate) {
            setTransactionDate(formatDateForInput(selectedInstance.instanceDate));
        } else if (selectedEvent?.startDate) {
            setTransactionDate(formatDateForInput(selectedEvent.startDate));
        }
    }, [selectedInstance, selectedEvent]);

    // Reset instance when event changes
    useEffect(() => {
        setSelectedInstanceId('none');
    }, [selectedEventId]);

    // Filter by tab
    useEffect(() => {
        const newFilters: any = { ...filters, page: 1 };
        if (activeTab === 'all') {
            delete newFilters.transactionType;
        } else {
            newFilters.transactionType = activeTab as TransactionType;
        }
        setFilters(newFilters);
    }, [activeTab]);

    // Search handler
    useEffect(() => {
        const timer = setTimeout(() => {
            setFilters({ ...filters, search: searchQuery, page: 1 });
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Form handlers
    const addOfferingItem = () => {
        setOfferingItems([
            ...offeringItems,
            {
                id: Date.now().toString(),
                type: 'offering',
                account_id: '',
                payment_method: 'cash',
                amount: '',
                description: ''
            }
        ]);
    };

    const removeOfferingItem = (id: string) => {
        if (offeringItems.length > 1) {
            setOfferingItems(offeringItems.filter(item => item.id !== id));
        }
    };

    const updateOfferingItem = (id: string, field: keyof OfferingFormItem, value: string) => {
        setOfferingItems(offeringItems.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const calculateTotal = () => {
        return offeringItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    };

    const resetForm = () => {
        setSelectedEventId('none');
        setSelectedInstanceId('none');
        setTransactionDate(format(new Date(), 'yyyy-MM-dd'));
        setOfferingItems([
            {
                id: '1',
                type: 'offering',
                account_id: '',
                payment_method: 'cash',
                amount: '',
                description: ''
            }
        ]);
        setNotes('');
    };

    const handleSubmit = async () => {
        // Validate
        const validItems = offeringItems.filter(item =>
            item.account_id && item.amount && parseFloat(item.amount) > 0
        );

        if (validItems.length === 0) {
            toast.error('Please add at least one valid offering item with an account and amount');
            return;
        }

        try {
            await recordBatchOffering({
                eventId: selectedEventId !== 'none' ? selectedEventId : undefined,
                eventInstanceId: selectedInstanceId !== 'none' ? selectedInstanceId : undefined,
                serviceReportId: selectedInstance?.serviceReportId,
                date: transactionDate,
                items: validItems.map(item => ({
                    offeringType: item.type,
                    account_id: item.account_id,
                    payment_method: item.payment_method,
                    amount: parseFloat(item.amount),
                    member_id: item.member_id || undefined,
                    donor_name: item.donor_name || undefined,
                    description: item.description || undefined,
                })),
                notes: notes || undefined,
            });

            toast.success('Offerings recorded successfully');
            setIsRecordOpen(false);
            resetForm();
            refetch();
        } catch (error: any) {
            console.error('Error recording offering:', error);
            toast.error(error?.message || 'Failed to record offerings');
        }
    };

    const handleDelete = async () => {
        if (transactionToDelete) {
            await deleteTransaction(transactionToDelete.id);
            setTransactionToDelete(null);
        }
    };

    const handleOpenRecordDialog = () => {
        resetForm();
        setIsRecordOpen(true);
    };

    const getPaymentMethodIcon = (method: PaymentMethod) => {
        const pm = PAYMENT_METHODS.find(p => p.value === method);
        const Icon = pm?.icon || Wallet;
        return <Icon className="h-4 w-4" />;
    };

    const getTransactionTypeColor = (type: string) => {
        switch (type) {
            case 'tithe': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'offering': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'donation': return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400';
            case 'pledge': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    const getEventTypeBadge = (type: string) => {
        const colors: Record<string, string> = {
            service: 'bg-blue-100 text-blue-700',
            meeting: 'bg-green-100 text-green-700',
            conference: 'bg-purple-100 text-purple-700',
            outreach: 'bg-orange-100 text-orange-700',
            fellowship: 'bg-pink-100 text-pink-700',
        };
        return colors[type] || 'bg-gray-100 text-gray-700';
    };

    // Chart data
    const incomeBreakdownData = summary ? [
        { name: 'Tithes', value: summary.incomeBreakdown?.tithes || 0, color: CHART_COLORS[0] },
        { name: 'Offerings', value: summary.incomeBreakdown?.offerings || 0, color: CHART_COLORS[1] },
        { name: 'Donations', value: summary.incomeBreakdown?.donations || 0, color: CHART_COLORS[2] },
        { name: 'Pledges', value: summary.incomeBreakdown?.pledges || 0, color: CHART_COLORS[4] },
        { name: 'Other', value: summary.incomeBreakdown?.other || 0, color: CHART_COLORS[3] },
    ].filter(d => d.value > 0) : [];

    const paymentChannelData = summary ? [
        { name: 'Cash', value: summary.paymentChannels?.cash || 0 },
        { name: 'Transfer', value: summary.paymentChannels?.bankTransfer || 0 },
        { name: 'Card', value: summary.paymentChannels?.card || 0 },
        { name: 'Mobile', value: summary.paymentChannels?.mobileMoney || 0 },
        { name: 'Online', value: summary.paymentChannels?.online || 0 },
    ].filter(d => d.value > 0) : [];

    // Filter transactions to only show income types
    const incomeTransactions = transactions.filter(t =>
        ['tithe', 'offering', 'donation', 'pledge'].includes(t.transactionType)
    );

    // Get active accounts for selection
    const activeAccounts = accounts.filter(acc => acc.isActive);

    // Custom tooltip formatter for charts
    const chartTooltipFormatter = (value: number) => [formatCurrency(value), 'Amount'];

    return (
        <DashboardLayout
            title="Offerings & Donations"
            actions={
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
                        <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                        Refresh
                    </Button>
                    <Button variant="outline" onClick={() => setIsImportOpen(true)} className="gap-2">
                        <Upload className="h-4 w-4" />
                        Import Statement
                    </Button>
                    <Button onClick={handleOpenRecordDialog} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Record Offering
                    </Button>
                </div>
            }
        >
            <div className="p-4 md:p-6 space-y-6">
                {/* Tutorial Link */}
                <div className="flex items-center gap-2 text-primary cursor-pointer hover:underline">
                    <PlayCircle className="h-5 w-5" />
                    <span className="font-medium">Watch Video Tutorial</span>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardContent className="p-4 md:p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 md:p-3 rounded-xl bg-blue-500/10">
                                    <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs md:text-sm text-muted-foreground">Total Tithes</p>
                                    {isLoadingSummary ? (
                                        <Skeleton className="h-7 w-20" />
                                    ) : (
                                        <p className="text-xl md:text-2xl font-bold">
                                            {formatCompact(summary?.incomeBreakdown?.tithes || 0)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 md:p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 md:p-3 rounded-xl bg-green-500/10">
                                    <HandHeart className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs md:text-sm text-muted-foreground">Total Offerings</p>
                                    {isLoadingSummary ? (
                                        <Skeleton className="h-7 w-20" />
                                    ) : (
                                        <p className="text-xl md:text-2xl font-bold">
                                            {formatCompact(summary?.incomeBreakdown?.offerings || 0)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 md:p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 md:p-3 rounded-xl bg-pink-500/10">
                                    <Heart className="h-5 w-5 md:h-6 md:w-6 text-pink-600" />
                                </div>
                                <div>
                                    <p className="text-xs md:text-sm text-muted-foreground">Total Donations</p>
                                    {isLoadingSummary ? (
                                        <Skeleton className="h-7 w-20" />
                                    ) : (
                                        <p className="text-xl md:text-2xl font-bold">
                                            {formatCompact(summary?.incomeBreakdown?.donations || 0)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 md:p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 md:p-3 rounded-xl bg-primary/10">
                                    <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs md:text-sm text-muted-foreground">Total Income</p>
                                    {isLoadingSummary ? (
                                        <Skeleton className="h-7 w-20" />
                                    ) : (
                                        <p className="text-xl md:text-2xl font-bold text-primary">
                                            {formatCompact(summary?.totalIncome || 0)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Income Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoadingSummary ? (
                                <Skeleton className="h-[250px] w-full" />
                            ) : incomeBreakdownData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={incomeBreakdownData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={5}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {incomeBreakdownData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={chartTooltipFormatter}
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: 'var(--radius)',
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                                    No data available
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Payment Channels</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoadingSummary ? (
                                <Skeleton className="h-[250px] w-full" />
                            ) : paymentChannelData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={paymentChannelData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                                        <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={80} />
                                        <Tooltip
                                            formatter={chartTooltipFormatter}
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: 'var(--radius)',
                                            }}
                                        />
                                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                                    No data available
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Transactions List */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <CardTitle>Transaction History</CardTitle>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search transactions..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 w-full sm:w-64"
                                    />
                                </div>
                                <Input
                                    type="date"
                                    value={dateFilter}
                                    onChange={(e) => {
                                        setDateFilter(e.target.value);
                                        setFilters({ ...filters, startDate: e.target.value, page: 1 });
                                    }}
                                    className="w-full sm:w-auto"
                                />
                                <ExportDropdown
                                    data={incomeTransactions.map(t => ({
                                        Date: t.transactionDate,
                                        Type: t.transactionType,
                                        Event: t.eventName || '',
                                        Amount: t.amount,
                                        'Payment Method': t.paymentMethod,
                                        Account: t.accountName || '',
                                        Description: t.description || '',
                                        'Donor': t.donorName || `${t.memberFirstName || ''} ${t.memberLastName || ''}`.trim(),
                                    }))}
                                    filename="offerings-donations"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="mb-4">
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="tithe">Tithes</TabsTrigger>
                                <TabsTrigger value="offering">Offerings</TabsTrigger>
                                <TabsTrigger value="donation">Donations</TabsTrigger>
                            </TabsList>

                            <TabsContent value={activeTab}>
                                {isLoading ? (
                                    <div className="space-y-4">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className="flex items-center gap-4">
                                                <Skeleton className="h-10 w-10 rounded" />
                                                <div className="space-y-2 flex-1">
                                                    <Skeleton className="h-4 w-32" />
                                                    <Skeleton className="h-3 w-24" />
                                                </div>
                                                <Skeleton className="h-6 w-20" />
                                            </div>
                                        ))}
                                    </div>
                                ) : incomeTransactions.length === 0 ? (
                                    <div className="text-center py-12">
                                        <DollarSign className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                                        <p className="text-lg font-medium text-muted-foreground">
                                            No transactions found
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Record your first offering to get started
                                        </p>
                                        <Button onClick={handleOpenRecordDialog} className="mt-4 gap-2">
                                            <Plus className="h-4 w-4" />
                                            Record Offering
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead className="hidden md:table-cell">Event</TableHead>
                                                    <TableHead className="hidden lg:table-cell">Payment</TableHead>
                                                    <TableHead className="hidden md:table-cell">Donor/Member</TableHead>
                                                    <TableHead className="text-right">Amount</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {incomeTransactions.map((transaction) => (
                                                    <TableRow key={transaction.id}>
                                                        <TableCell>
                                                            <div>
                                                                <p className="font-medium">
                                                                    {transaction.transactionDate}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground md:hidden">
                                                                    {transaction.paymentMethod.replace('_', ' ')}
                                                                </p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={cn('capitalize', getTransactionTypeColor(transaction.transactionType))}>
                                                                {transaction.transactionType}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="hidden md:table-cell">
                                                            {transaction.eventName ? (
                                                                <div className="flex items-center gap-2">
                                                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                                                    <span className="text-sm">{transaction.eventName}</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="hidden lg:table-cell">
                                                            <div className="flex items-center gap-2">
                                                                {getPaymentMethodIcon(transaction.paymentMethod)}
                                                                <span className="capitalize text-sm">
                                                                    {transaction.paymentMethod.replace('_', ' ')}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="hidden md:table-cell">
                                                            {transaction.donorName ||
                                                                (transaction.memberFirstName ? `${transaction.memberFirstName} ${transaction.memberLastName}` : '-')}
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium text-green-600">
                                                            {formatCurrency(transaction.amount)}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={() => {
                                                                        setSelectedTransaction(transaction);
                                                                        setShowViewDialog(true);
                                                                    }}>
                                                                        <Eye className="mr-2 h-4 w-4" />
                                                                        View Details
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        className="text-destructive"
                                                                        onClick={() => setTransactionToDelete(transaction)}
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}

                                {/* Pagination */}
                                {pagination && pagination.totalPages > 1 && (
                                    <div className="flex items-center justify-between mt-4">
                                        <p className="text-sm text-muted-foreground">
                                            Page {pagination.page} of {pagination.totalPages}
                                        </p>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                                                disabled={pagination.page <= 1}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                                                disabled={pagination.page >= pagination.totalPages}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>

            {/* Record Offering Dialog */}
            <Dialog open={isRecordOpen} onOpenChange={setIsRecordOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Record Offering</DialogTitle>
                        <DialogDescription>
                            Record tithes, offerings, and donations for an event
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Event Selection */}
                        <Card className="border-primary/20 bg-primary/5">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    Link to Event
                                </CardTitle>
                                <CardDescription>
                                    Link this offering to a specific event for service report tracking
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Event</Label>
                                        <Select
                                            value={selectedEventId}
                                            onValueChange={setSelectedEventId}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select an event" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">
                                                    <span className="text-muted-foreground">No event (standalone offering)</span>
                                                </SelectItem>
                                                {isLoadingEvents ? (
                                                    <div className="p-2 text-center text-sm text-muted-foreground">
                                                        Loading events...
                                                    </div>
                                                ) : events.length === 0 ? (
                                                    <div className="p-2 text-center text-sm text-muted-foreground">
                                                        No events available
                                                    </div>
                                                ) : (
                                                    events.map(event => (
                                                        <SelectItem key={event.id} value={event.id}>
                                                            <div className="flex items-center gap-2">
                                                                <span>{event.name}</span>
                                                                <Badge variant="outline" className={cn("text-xs", getEventTypeBadge(event.eventType))}>
                                                                    {event.eventType}
                                                                </Badge>
                                                            </div>
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {selectedEventId !== 'none' && (
                                        <div className="space-y-2">
                                            <Label>Service/Instance</Label>
                                            <Select
                                                value={selectedInstanceId}
                                                onValueChange={setSelectedInstanceId}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select instance (optional)" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">
                                                        <span className="text-muted-foreground">No specific instance</span>
                                                    </SelectItem>
                                                    {isLoadingInstances ? (
                                                        <div className="p-2 text-center text-sm text-muted-foreground">
                                                            Loading instances...
                                                        </div>
                                                    ) : instances.length === 0 ? (
                                                        <div className="p-2 text-center text-sm text-muted-foreground">
                                                            No instances available
                                                        </div>
                                                    ) : (
                                                        instances.map(instance => (
                                                            <SelectItem key={instance.id} value={instance.id}>
                                                                <div className="flex items-center gap-2">
                                                                    <span>{instance.instanceDate}</span>
                                                                    <span className="text-muted-foreground">at {instance.startTime}</span>
                                                                    {instance.hasServiceReport && (
                                                                        <Badge variant="secondary" className="text-xs">
                                                                            <FileText className="h-3 w-3 mr-1" />
                                                                            Has Report
                                                                        </Badge>
                                                                    )}
                                                                    <Badge variant="outline" className="text-xs capitalize">
                                                                        {instance.status}
                                                                    </Badge>
                                                                </div>
                                                            </SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>

                                {/* Selected Event Info */}
                                {selectedEvent && (
                                    <div className="p-3 bg-background rounded-lg border">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="font-medium">{selectedEvent.name}</h4>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {selectedEvent.startDate}
                                                    </span>
                                                    {selectedEvent.startTime && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {selectedEvent.startTime}
                                                        </span>
                                                    )}
                                                    {selectedEvent.locationName && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="h-3 w-3" />
                                                            {selectedEvent.locationName}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <Badge className={cn("capitalize", getEventTypeBadge(selectedEvent.eventType))}>
                                                {selectedEvent.eventType}
                                            </Badge>
                                        </div>
                                        {selectedInstance && (
                                            <div className="mt-2 pt-2 border-t">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Users className="h-3 w-3 text-muted-foreground" />
                                                    <span>
                                                        Instance: {selectedInstance.instanceDate}
                                                        {selectedInstance.attendanceCount !== undefined && (
                                                            <span className="text-muted-foreground">
                                                                {' '}• {selectedInstance.attendanceCount} attendees
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Date */}
                        <div className="space-y-2">
                            <Label>Offering Date <span className="text-destructive">*</span></Label>
                            <Input
                                type="date"
                                value={transactionDate}
                                onChange={(e) => setTransactionDate(e.target.value)}
                            />
                            {selectedEvent && transactionDate !== selectedEvent.startDate && (
                                <p className="text-xs text-muted-foreground">
                                    Note: Date differs from event date ({selectedEvent.startDate})
                                </p>
                            )}
                        </div>

                        {/* Offering Items */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">Offering Items</Label>
                                <Button type="button" variant="outline" size="sm" onClick={addOfferingItem}>
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Item
                                </Button>
                            </div>

                            {activeAccounts.length === 0 && (
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        No active accounts found. Please create an account in Chart of Accounts first.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {offeringItems.map((item, index) => (
                                <Card key={item.id} className="p-4">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Item {index + 1}</span>
                                            {offeringItems.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeOfferingItem(item.id)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="space-y-2">
                                                <Label>Type <span className="text-destructive">*</span></Label>
                                                <Select
                                                    value={item.type}
                                                    onValueChange={(v) => updateOfferingItem(item.id, 'type', v)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {OFFERING_TYPES.map(type => (
                                                            <SelectItem key={type.value} value={type.value}>
                                                                <div className="flex items-center gap-2">
                                                                    <type.icon className={cn("h-4 w-4", type.color)} />
                                                                    {type.label}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Account <span className="text-destructive">*</span></Label>
                                                <Select
                                                    value={item.account_id || ""}
                                                    onValueChange={(v) => updateOfferingItem(item.id, 'account_id', v)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select account" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {activeAccounts.length === 0 ? (
                                                            <div className="p-2 text-sm text-muted-foreground text-center">
                                                                No accounts available
                                                            </div>
                                                        ) : (
                                                            activeAccounts.map(account => (
                                                                <SelectItem key={account.id} value={account.id}>
                                                                    <div className="flex items-center gap-2">
                                                                        <span>{account.name}</span>
                                                                        {/*<span className="text-xs text-muted-foreground">*/}
                                                                        {/*    ({formatCurrency(account.balance)})*/}
                                                                        {/*</span>*/}
                                                                    </div>
                                                                </SelectItem>
                                                            ))
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Payment Method</Label>
                                                <Select
                                                    value={item.payment_method}
                                                    onValueChange={(v) => updateOfferingItem(item.id, 'payment_method', v)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {PAYMENT_METHODS.map(pm => (
                                                            <SelectItem key={pm.value} value={pm.value}>
                                                                <div className="flex items-center gap-2">
                                                                    <pm.icon className="h-4 w-4" />
                                                                    {pm.label}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Amount <span className="text-destructive">*</span></Label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                                        {currencySymbol}
                                                    </span>
                                                    <Input
                                                        type="number"
                                                        value={item.amount}
                                                        onChange={(e) => updateOfferingItem(item.id, 'amount', e.target.value)}
                                                        placeholder="0.00"
                                                        min="0"
                                                        step="0.01"
                                                        className="pl-8"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Donor Name (Optional)</Label>
                                                <Input
                                                    value={item.donor_name || ''}
                                                    onChange={(e) => updateOfferingItem(item.id, 'donor_name', e.target.value)}
                                                    placeholder="Enter donor name"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Description (Optional)</Label>
                                                <Input
                                                    value={item.description || ''}
                                                    onChange={(e) => updateOfferingItem(item.id, 'description', e.target.value)}
                                                    placeholder="Enter description"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}

                            {/* Total */}
                            <div className="flex justify-end">
                                <div className="bg-muted rounded-lg p-4 min-w-[200px]">
                                    <p className="text-sm text-muted-foreground">Total Amount</p>
                                    <p className="text-2xl font-bold text-primary">
                                        {formatCurrency(calculateTotal())}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label>Notes (Optional)</Label>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Any additional notes..."
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter className="border-t pt-4">
                        <Button variant="outline" onClick={() => setIsRecordOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isRecording || activeAccounts.length === 0}
                        >
                            {isRecording ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Recording...
                                </>
                            ) : (
                                'Save Offering'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Transaction Dialog */}
            <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Transaction Details</DialogTitle>
                    </DialogHeader>
                    {selectedTransaction && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">Type</Label>
                                    <p className="font-medium capitalize">{selectedTransaction.transactionType}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Amount</Label>
                                    <p className="font-medium text-green-600">
                                        {formatCurrency(selectedTransaction.amount)}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Date</Label>
                                    <p className="font-medium">{selectedTransaction.transactionDate}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Payment Method</Label>
                                    <p className="font-medium capitalize">{selectedTransaction.paymentMethod.replace('_', ' ')}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Account</Label>
                                    <p className="font-medium">{selectedTransaction.accountName || '-'}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Donor/Member</Label>
                                    <p className="font-medium">
                                        {selectedTransaction.donorName ||
                                            (selectedTransaction.memberFirstName ? `${selectedTransaction.memberFirstName} ${selectedTransaction.memberLastName}` : '-')}
                                    </p>
                                </div>
                            </div>

                            {selectedTransaction.eventName && (
                                <div>
                                    <Label className="text-muted-foreground">Linked Event</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Calendar className="h-4 w-4 text-primary" />
                                        <p className="font-medium">{selectedTransaction.eventName}</p>
                                        {selectedTransaction.eventDate && (
                                            <span className="text-sm text-muted-foreground">
                                                ({selectedTransaction.eventDate})
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {selectedTransaction.description && (
                                <div>
                                    <Label className="text-muted-foreground">Description</Label>
                                    <p className="font-medium">{selectedTransaction.description}</p>
                                </div>
                            )}

                            {selectedTransaction.referenceNumber && (
                                <div>
                                    <Label className="text-muted-foreground">Reference Number</Label>
                                    <p className="font-medium font-mono">{selectedTransaction.referenceNumber}</p>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!transactionToDelete} onOpenChange={() => setTransactionToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this transaction? This action cannot be undone
                            and will affect your account balance.
                            {transactionToDelete?.eventName && (
                                <span className="block mt-2 text-amber-600">
                                    Note: This transaction is linked to "{transactionToDelete.eventName}" and will be removed from its service report.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <BankStatementImport
                open={isImportOpen}
                onOpenChange={setIsImportOpen}
                onSuccess={() => {
                    refetch();
                    toast.success('Bank statement imported successfully');
                }}
            />
        </DashboardLayout>
    );
}