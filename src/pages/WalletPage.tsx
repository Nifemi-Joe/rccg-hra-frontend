// src/pages/WalletPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Wallet as WalletIcon,
    Gift,
    CreditCard,
    RefreshCw,
    Download,
    Search,
    ChevronLeft,
    ChevronRight,
    MessageSquare,
    Mail,
    MessageCircle,
    Phone,
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    RotateCcw,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { walletApi, WalletTransaction } from '@/services/walletApi';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { DashboardLayout } from '@/components/DashboardLayout';

const channelIcons: Record<string, React.ReactNode> = {
    sms: <MessageSquare className="h-4 w-4" />,
    email: <Mail className="h-4 w-4" />,
    whatsapp: <MessageCircle className="h-4 w-4" />,
    voice: <Phone className="h-4 w-4" />,
    all: <WalletIcon className="h-4 w-4" />,
};

const channelColors: Record<string, string> = {
    sms: 'bg-blue-500',
    email: 'bg-green-500',
    whatsapp: 'bg-emerald-500',
    voice: 'bg-purple-500',
    all: 'bg-gray-500',
};

const statusConfig = {
    completed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-500/10', label: 'Completed' },
    pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-500/10', label: 'Pending' },
    failed: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-500/10', label: 'Failed' },
    refunded: { icon: RotateCcw, color: 'text-blue-600', bg: 'bg-blue-500/10', label: 'Refunded' },
    processing: { icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-500/10', label: 'Processing' },
};

const transactionTypeConfig = {
    credit: { icon: ArrowUpRight, color: 'text-green-600', label: 'Credit' },
    debit: { icon: ArrowDownRight, color: 'text-red-600', label: 'Debit' },
    refund: { icon: RotateCcw, color: 'text-blue-600', label: 'Refund' },
    bonus: { icon: Gift, color: 'text-purple-600', label: 'Bonus' },
};

export default function WalletPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

    // State
    const [page, setPage] = useState(1);
    const [filterChannel, setFilterChannel] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showRefundDialog, setShowRefundDialog] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<WalletTransaction | null>(null);
    const [refundReason, setRefundReason] = useState('');
    const [refundAmount, setRefundAmount] = useState<number>(0);

    // Queries
    const { data: walletData, isLoading: walletLoading } = useQuery({
        queryKey: ['wallet'],
        queryFn: () => walletApi.getWallet(),
    });

    const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
        queryKey: ['wallet-transactions', page, filterChannel, filterType, filterStatus, searchTerm, dateFrom, dateTo],
        queryFn: () =>
            walletApi.getTransactions({
                page,
                limit: 20,
                channel: filterChannel !== 'all' ? filterChannel : undefined,
                type: filterType !== 'all' ? filterType : undefined,
                status: filterStatus !== 'all' ? filterStatus : undefined,
                search: searchTerm || undefined,
                startDate: dateFrom || undefined,
                endDate: dateTo || undefined,
            }),
    });

    const { data: analyticsData } = useQuery({
        queryKey: ['wallet-analytics'],
        queryFn: () =>
            walletApi.getAnalytics(
                dateFrom || format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
                dateTo || format(new Date(), 'yyyy-MM-dd')
            ),
        enabled: isAdmin,
    });

    // Mutations
    const refundMutation = useMutation({
        mutationFn: (data: { transactionId: string; amount: number; reason: string }) =>
            walletApi.refundTransaction(data.transactionId, data.amount, data.reason),
        onSuccess: () => {
            toast.success('Refund processed successfully');
            queryClient.invalidateQueries({ queryKey: ['wallet'] });
            queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
            setShowRefundDialog(false);
            setSelectedTransaction(null);
            setRefundReason('');
            setRefundAmount(0);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to process refund');
        },
    });

    const exportMutation = useMutation({
        mutationFn: () =>
            walletApi.exportTransactions({
                channel: filterChannel !== 'all' ? filterChannel : undefined,
                type: filterType !== 'all' ? filterType : undefined,
                status: filterStatus !== 'all' ? filterStatus : undefined,
                startDate: dateFrom || undefined,
                endDate: dateTo || undefined,
            }),
        onSuccess: (blob: Blob) => {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `wallet-transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Export downloaded successfully');
        },
        onError: () => {
            toast.error('Failed to export transactions');
        },
    });

    // Derived data
    const wallet = walletData?.data;
    const transactions = transactionsData?.data ?? [];
    const pagination = transactionsData?.pagination;
    const analytics = analyticsData?.data;

    const getBalanceByChannel = (channel: string): number => {
        if (!wallet) return 0;
        switch (channel) {
            case 'sms':
                return wallet.sms_balance;
            case 'email':
                return wallet.email_balance;
            case 'whatsapp':
                return wallet.whatsapp_balance;
            case 'voice':
                return wallet.voice_balance;
            default:
                return 0;
        }
    };

    const handleRefund = () => {
        if (!selectedTransaction) return;
        if (!refundAmount || refundAmount <= 0) {
            toast.error('Please enter a valid refund amount');
            return;
        }
        if (!refundReason.trim()) {
            toast.error('Please provide a reason for the refund');
            return;
        }

        refundMutation.mutate({
            transactionId: selectedTransaction.id,
            amount: refundAmount,
            reason: refundReason,
        });
    };

    const handleExport = () => {
        exportMutation.mutate();
    };

    const resetFilters = () => {
        setFilterChannel('all');
        setFilterType('all');
        setFilterStatus('all');
        setSearchTerm('');
        setDateFrom('');
        setDateTo('');
        setPage(1);
    };

    const totalBalance = wallet
        ? wallet.sms_balance + wallet.email_balance + wallet.whatsapp_balance + wallet.voice_balance
        : 0;

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <WalletIcon className="h-8 w-8" />
                            Wallet
                        </h1>
                        <p className="text-muted-foreground">
                            Manage your messaging credits and payment transactions
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleExport} disabled={exportMutation.isPending}>
                            <Download className="h-4 w-4 mr-2" />
                            {exportMutation.isPending ? 'Exporting...' : 'Export'}
                        </Button>
                        <Button onClick={() => (window.location.href = '/sms/units')}>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Buy Units
                        </Button>
                    </div>
                </div>

                {/* Balance Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Total Balance */}
                    <Card className="relative overflow-hidden border-2 border-primary/20">
                        <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full bg-primary/10" />
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <WalletIcon className="h-5 w-5" />
                                Total Balance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-primary">
                                {walletLoading ? '...' : totalBalance.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground">units available</p>
                        </CardContent>
                    </Card>

                    {/* Individual Channel Balances */}
                    {(['sms', 'email', 'whatsapp', 'voice'] as const).map((channel) => (
                        <Card key={channel} className="relative overflow-hidden">
                            <div
                                className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 ${channelColors[channel]}`}
                            />
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    {channelIcons[channel]}
                                    {channel.toUpperCase()}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">
                                    {walletLoading ? '...' : getBalanceByChannel(channel).toLocaleString()}
                                </div>
                                <p className="text-xs text-muted-foreground">units</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Analytics Cards (Admin Only) */}
                {isAdmin && analytics && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    ₦{(analytics.totalRevenue ?? 0).toLocaleString()}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Purchases</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {(analytics.totalPurchases ?? 0).toLocaleString()}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Refunds</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">
                                    ₦{(analytics.totalRefunds ?? 0).toLocaleString()}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Units Distributed</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600">
                                    {(analytics.totalUnitsDistributed ?? 0).toLocaleString()}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Transactions Section */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle>Payment Transactions</CardTitle>
                                <CardDescription>View all wallet transactions, purchases, and refunds</CardDescription>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 pt-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search reference..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setPage(1);
                                    }}
                                    className="pl-10"
                                />
                            </div>

                            <Select
                                value={filterChannel}
                                onValueChange={(v) => {
                                    setFilterChannel(v);
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Channel" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Channels</SelectItem>
                                    <SelectItem value="sms">SMS</SelectItem>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                    <SelectItem value="voice">Voice</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={filterType}
                                onValueChange={(v) => {
                                    setFilterType(v);
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="credit">Credit</SelectItem>
                                    <SelectItem value="debit">Debit</SelectItem>
                                    <SelectItem value="refund">Refund</SelectItem>
                                    <SelectItem value="bonus">Bonus</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={filterStatus}
                                onValueChange={(v) => {
                                    setFilterStatus(v);
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                    <SelectItem value="refunded">Refunded</SelectItem>
                                </SelectContent>
                            </Select>

                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => {
                                    setDateFrom(e.target.value);
                                    setPage(1);
                                }}
                                placeholder="From date"
                            />

                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => {
                                    setDateTo(e.target.value);
                                    setPage(1);
                                }}
                                placeholder="To date"
                            />
                        </div>

                        {(filterChannel !== 'all' ||
                            filterType !== 'all' ||
                            filterStatus !== 'all' ||
                            searchTerm ||
                            dateFrom ||
                            dateTo) && (
                            <Button variant="outline" size="sm" onClick={resetFilters} className="mt-2">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Reset Filters
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        {transactionsLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <>
                                <div className="rounded-lg border overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/50">
                                                <TableHead>Date & Time</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Channel</TableHead>
                                                <TableHead>Reference</TableHead>
                                                <TableHead>Units</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Balance After</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Description</TableHead>
                                                {isAdmin && <TableHead>Actions</TableHead>}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {transactions.length === 0 ? (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={isAdmin ? 10 : 9}
                                                        className="text-center py-12 text-muted-foreground"
                                                    >
                                                        <WalletIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                                        <p>No transactions found</p>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                transactions.map((tx: WalletTransaction) => {
                                                    const typeConfig =
                                                        transactionTypeConfig[tx.type as keyof typeof transactionTypeConfig];
                                                    const statusInfo =
                                                        statusConfig[tx.status as keyof typeof statusConfig] || statusConfig.completed;
                                                    const StatusIcon = statusInfo.icon;
                                                    const TypeIcon = typeConfig?.icon ?? ArrowUpRight;

                                                    return (
                                                        <TableRow key={tx.id} className="hover:bg-muted/50">
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                                    <div>
                                                                        <div className="font-medium">
                                                                            {format(new Date(tx.created_at), 'MMM dd, yyyy')}
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground">
                                                                            {format(new Date(tx.created_at), 'hh:mm a')}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <TypeIcon className={cn('h-4 w-4', typeConfig?.color)} />
                                                                    <span className="capitalize font-medium">
                                    {typeConfig?.label ?? tx.type}
                                  </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline" className="uppercase">
                                                                    <div className="flex items-center gap-1">
                                                                        {channelIcons[tx.channel]}
                                                                        {tx.channel}
                                                                    </div>
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                                                    {tx.reference || 'N/A'}
                                                                </code>
                                                            </TableCell>
                                                            <TableCell>
                                <span
                                    className={cn(
                                        'font-semibold',
                                        tx.type === 'debit' ? 'text-red-600' : 'text-green-600'
                                    )}
                                >
                                  {tx.type === 'debit' ? '-' : '+'}
                                    {tx.units.toLocaleString()}
                                </span>
                                                            </TableCell>
                                                            <TableCell>
                                                                {tx.amount ? (
                                                                    <span className="font-medium">₦{tx.amount.toLocaleString()}</span>
                                                                ) : (
                                                                    <span className="text-muted-foreground">-</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                <span className="font-medium">{tx.balance_after.toLocaleString()}</span>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline" className={cn(statusInfo.bg, statusInfo.color)}>
                                                                    <StatusIcon className="h-3 w-3 mr-1" />
                                                                    {statusInfo.label}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="max-w-[200px]">
                                                                <p className="text-sm truncate" title={tx.description || ''}>
                                                                    {tx.description || '-'}
                                                                </p>
                                                            </TableCell>
                                                            {isAdmin && (
                                                                <TableCell>
                                                                    {tx.type === 'credit' && tx.status === 'completed' && tx.amount ? (
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                setSelectedTransaction(tx);
                                                                                setRefundAmount(tx.amount);
                                                                                setShowRefundDialog(true);
                                                                            }}
                                                                        >
                                                                            <RotateCcw className="h-3 w-3 mr-1" />
                                                                            Refund
                                                                        </Button>
                                                                    ) : null}
                                                                </TableCell>
                                                            )}
                                                        </TableRow>
                                                    );
                                                })
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">
                    Page {page}
                      {pagination?.totalPages ? ` of ${pagination.totalPages}` : ''}
                      {pagination?.total ? ` • ${pagination.total} total` : ''}
                  </span>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage((p) => p + 1)}
                                            disabled={transactions.length < 20}
                                        >
                                            Next
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Refund Dialog */}
                <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Process Refund</DialogTitle>
                            <DialogDescription>Refund payment and restore units to the wallet</DialogDescription>
                        </DialogHeader>

                        {selectedTransaction && (
                            <div className="space-y-4">
                                <div className="rounded-lg border p-4 space-y-2 bg-muted/50">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Transaction:</span>
                                        <code className="text-xs">{selectedTransaction.reference}</code>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Original Amount:</span>
                                        <span className="font-medium">
                      ₦{selectedTransaction.amount?.toLocaleString()}
                    </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Units:</span>
                                        <span className="font-medium">{selectedTransaction.units.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Channel:</span>
                                        <Badge variant="outline" className="uppercase">
                                            {selectedTransaction.channel}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Refund Amount (₦)</Label>
                                    <Input
                                        type="number"
                                        value={refundAmount}
                                        onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                                        max={selectedTransaction.amount}
                                        step="0.01"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Maximum: ₦{selectedTransaction.amount?.toLocaleString()}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Reason for Refund</Label>
                                    <Textarea
                                        value={refundReason}
                                        onChange={(e) => setRefundReason(e.target.value)}
                                        placeholder="Explain why this refund is being processed..."
                                        rows={3}
                                    />
                                </div>

                                <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 p-3">
                                    <div className="flex gap-2">
                                        <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-yellow-800 dark:text-yellow-200">
                                            <p className="font-medium">Refund Notice</p>
                                            <p className="text-xs mt-1">
                                                This will refund the payment and deduct the units from the wallet balance.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleRefund}
                                disabled={refundMutation.isPending}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                {refundMutation.isPending ? 'Processing...' : 'Process Refund'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}