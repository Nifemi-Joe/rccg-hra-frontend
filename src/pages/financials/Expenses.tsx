// src/pages/financials/Expenses.tsx

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import {
    CheckCircle,
    XCircle,
    Clock,
    Plus,
    Eye,
    ThumbsUp,
    ThumbsDown,
    MoreHorizontal,
    Trash2,
    Link2,
    Calendar,
    MapPin,
    Loader2,
    TrendingDown,
    Receipt,
    Tag,
    FileText,
    Banknote,
    CreditCard,
    Smartphone,
    Wallet,
} from 'lucide-react';
import {
    useExpenses,
    useExpenseApprovalSummary,
    useAccounts,
    useExpenseCategories,
    useEventsForOffering
} from '@/hooks/useFinancials';
import { useCurrency } from '@/hooks/useCurrency';
import { useAuth } from '@/contexts/AuthContext';
import {
    ApprovalStatus,
    PaymentMethod,
    CreateExpenseCategoryDTO
} from '@/types/financial';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: any }[] = [
    { value: 'cash', label: 'Cash', icon: Banknote },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: CreditCard },
    { value: 'card', label: 'Card', icon: CreditCard },
    { value: 'mobile_money', label: 'Mobile Money', icon: Smartphone },
    { value: 'check', label: 'Check', icon: Receipt },
    { value: 'online', label: 'Online', icon: Wallet },
];

const getApprovalStatusBadge = (status: ApprovalStatus) => {
    const config = {
        pending: { icon: Clock, className: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
        approved: { icon: CheckCircle, className: 'bg-green-100 text-green-700', label: 'Approved' },
        rejected: { icon: XCircle, className: 'bg-red-100 text-red-700', label: 'Rejected' },
    };
    const { icon: Icon, className, label } = config[status];
    return (
        <Badge className={className}>
            <Icon className="h-3 w-3 mr-1" />
            {label}
        </Badge>
    );
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

export default function Expenses() {
    const { formatCurrency, currencySymbol } = useCurrency();
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

    // State
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [selectedExpense, setSelectedExpense] = useState<any>(null);
    const [showApprovalDialog, setShowApprovalDialog] = useState(false);
    const [showViewDialog, setShowViewDialog] = useState(false);
    const [isRecordOpen, setIsRecordOpen] = useState(false);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState<any>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Event attachment state
    const [attachToEvent, setAttachToEvent] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState<string>('');

    // Form state
    const [formData, setFormData] = useState({
        accountId: '',
        categoryId: '',
        amount: '',
        description: '',
        paymentMethod: 'cash' as PaymentMethod,
        transactionDate: format(new Date(), 'yyyy-MM-dd'),
        referenceNumber: '',
    });

    // Category form
    const [categoryForm, setCategoryForm] = useState<CreateExpenseCategoryDTO>({
        name: '',
        description: '',
    });

    // Hooks
    const { summary, isLoading: isLoadingSummary } = useExpenseApprovalSummary();
    const {
        expenses,
        pagination,
        isLoading,
        filters,
        setFilters,
        approveExpense,
        recordExpense,
        deleteTransaction,
        isRecording,
        refetch
    } = useExpenses({ approvalStatus: activeTab === 'all' ? undefined : activeTab });

    const { accounts, isLoading: isLoadingAccounts } = useAccounts();
    const {
        categories,
        isLoading: isLoadingCategories,
        createCategory,
        isCreating: isCreatingCategory,
    } = useExpenseCategories();
    const { events, isLoading: isLoadingEvents } = useEventsForOffering();

    // Get active accounts and selected event
    const activeAccounts = accounts.filter(a => a.isActive);
    const selectedEvent = events.find(e => e.id === selectedEventId);

    // Reset form
    const resetForm = () => {
        setFormData({
            accountId: '',
            categoryId: '',
            amount: '',
            description: '',
            paymentMethod: 'cash',
            transactionDate: format(new Date(), 'yyyy-MM-dd'),
            referenceNumber: '',
        });
        setAttachToEvent(false);
        setSelectedEventId('');
    };

    // Handle expense submission
    const handleSubmit = async () => {
        // Validation
        if (!formData.accountId || !formData.amount || !formData.categoryId) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (parseFloat(formData.amount) <= 0) {
            toast.error('Amount must be greater than zero');
            return;
        }

        try {
            const expenseData = {
                account_id: formData.accountId,
                amount: parseFloat(formData.amount),
                description: formData.description || undefined,
                payment_method: formData.paymentMethod,
                transaction_date: formData.transactionDate,
                reference_number: formData.referenceNumber || undefined,
                expense_category_id: formData.categoryId,
                event_id: attachToEvent && selectedEventId ? selectedEventId : undefined,
            };

            await recordExpense(expenseData);
            setIsRecordOpen(false);
            resetForm();
            refetch();
        } catch (error: any) {
            console.error('Error recording expense:', error);
            toast.error(error.message || 'Failed to record expense');
        }
    };

    // Handle category creation
    const handleCreateCategory = async () => {
        if (!categoryForm.name.trim()) {
            toast.error('Category name is required');
            return;
        }

        try {
            await createCategory(categoryForm);
            setIsCategoryOpen(false);
            setCategoryForm({ name: '', description: '' });
        } catch (error: any) {
            console.error('Error creating category:', error);
            toast.error(error.message || 'Failed to create category');
        }
    };

    // Handle approval
    const handleApproval = async (action: 'approved' | 'rejected') => {
        if (!selectedExpense) return;

        if (action === 'rejected' && !rejectionReason.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }

        setIsProcessing(true);
        try {
            await approveExpense(selectedExpense.id, {
                approval_status: action,
                rejection_reason: action === 'rejected' ? rejectionReason : undefined
            });

            toast.success(`Expense ${action} successfully`);
            setShowApprovalDialog(false);
            setSelectedExpense(null);
            setRejectionReason('');
            refetch();
        } catch (error: any) {
            toast.error(error.message || `Failed to ${action} expense`);
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle delete
    const handleDelete = async () => {
        if (!expenseToDelete) return;

        try {
            await deleteTransaction(expenseToDelete.id);
            setExpenseToDelete(null);
            refetch();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete expense');
        }
    };

    // Calculate average expense
    const averageExpense = expenses.length > 0
        ? Math.round(expenses.reduce((sum, e) => sum + Math.abs(e.amount), 0) / expenses.length)
        : 0;

    return (
        <DashboardLayout
            title="Expenses"
            actions={
                <Button onClick={() => { resetForm(); setIsRecordOpen(true); }} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Record Expense
                </Button>
            }
        >
            <div className="p-4 md:p-6 space-y-6">
                {/* Approval Summary Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-yellow-500/10">
                                    <Clock className="h-6 w-6 text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Pending Approval</p>
                                    {isLoadingSummary ? (
                                        <div className="h-7 w-20 bg-muted animate-pulse rounded" />
                                    ) : (
                                        <>
                                            <p className="text-2xl font-bold text-yellow-600">
                                                {summary?.pendingCount || 0}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatCurrency(summary?.pendingAmount || 0)}
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-green-500/10">
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Approved</p>
                                    {isLoadingSummary ? (
                                        <div className="h-7 w-20 bg-muted animate-pulse rounded" />
                                    ) : (
                                        <>
                                            <p className="text-2xl font-bold text-green-600">
                                                {summary?.approvedCount || 0}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatCurrency(summary?.approvedAmount || 0)}
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-red-500/10">
                                    <XCircle className="h-6 w-6 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Rejected</p>
                                    {isLoadingSummary ? (
                                        <div className="h-7 w-20 bg-muted animate-pulse rounded" />
                                    ) : (
                                        <>
                                            <p className="text-2xl font-bold text-red-600">
                                                {summary?.rejectedCount || 0}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatCurrency(summary?.rejectedAmount || 0)}
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-orange-500/10">
                                    <FileText className="h-6 w-6 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Avg per Transaction</p>
                                    {isLoading ? (
                                        <div className="h-7 w-16 bg-muted animate-pulse rounded" />
                                    ) : (
                                        <p className="text-2xl font-bold">
                                            {formatCurrency(averageExpense)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Expenses Table with Tabs */}
                <Card>
                    <CardHeader>
                        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
                            <TabsList>
                                <TabsTrigger value="all">All Expenses</TabsTrigger>
                                <TabsTrigger value="pending">
                                    Pending {summary?.pendingCount ? `(${summary.pendingCount})` : ''}
                                </TabsTrigger>
                                <TabsTrigger value="approved">Approved</TabsTrigger>
                                <TabsTrigger value="rejected">Rejected</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead className="hidden md:table-cell">Description</TableHead>
                                        <TableHead className="hidden lg:table-cell">Submitted By</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8">
                                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                            </TableCell>
                                        </TableRow>
                                    ) : expenses.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-12">
                                                <Receipt className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                                                <p className="text-lg font-medium text-muted-foreground">
                                                    No expenses found
                                                </p>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Record your first expense to start tracking
                                                </p>
                                                <Button
                                                    onClick={() => { resetForm(); setIsRecordOpen(true); }}
                                                    className="mt-4 gap-2"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                    Record Expense
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        expenses.map((expense) => (
                                            <TableRow key={expense.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground hidden sm:block" />
                                                        <span>{expense.transactionDate}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {expense.expenseCategoryName || 'Uncategorized'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                                                    {expense.description || '-'}
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell">
                                                    {expense.submittedByName || '-'}
                                                </TableCell>
                                                <TableCell className="text-right font-medium text-red-600">
                                                    {formatCurrency(Math.abs(expense.amount))}
                                                </TableCell>
                                                <TableCell>
                                                    {getApprovalStatusBadge(expense.approvalStatus || 'pending')}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setSelectedExpense(expense);
                                                                    setShowViewDialog(true);
                                                                }}
                                                            >
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View Details
                                                            </DropdownMenuItem>
                                                            {isAdmin && expense.approvalStatus === 'pending' && (
                                                                <>
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setSelectedExpense(expense);
                                                                            handleApproval('approved');
                                                                        }}
                                                                        className="text-green-600"
                                                                    >
                                                                        <ThumbsUp className="mr-2 h-4 w-4" />
                                                                        Approve
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setSelectedExpense(expense);
                                                                            setShowApprovalDialog(true);
                                                                        }}
                                                                        className="text-red-600"
                                                                    >
                                                                        <ThumbsDown className="mr-2 h-4 w-4" />
                                                                        Reject
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                            <DropdownMenuItem
                                                                className="text-destructive"
                                                                onClick={() => setExpenseToDelete(expense)}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Record Expense Dialog */}
            <Dialog open={isRecordOpen} onOpenChange={setIsRecordOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Record Expense</DialogTitle>
                        <DialogDescription>
                            Add a new expense transaction (requires admin approval)
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Attach to Event Toggle */}
                        <Card className="border-dashed">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <Link2 className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Attach to Event</p>
                                            <p className="text-sm text-muted-foreground">
                                                Link this expense to a specific event
                                            </p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={attachToEvent}
                                        onCheckedChange={setAttachToEvent}
                                    />
                                </div>

                                {attachToEvent && (
                                    <div className="mt-4 space-y-3">
                                        <div className="space-y-2">
                                            <Label>Select Event</Label>
                                            <Select
                                                value={selectedEventId}
                                                onValueChange={setSelectedEventId}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Choose an event" />
                                                </SelectTrigger>
                                                <SelectContent>
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
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={cn("text-xs", getEventTypeBadge(event.eventType))}
                                                                    >
                                                                        {event.eventType}
                                                                    </Badge>
                                                                </div>
                                                            </SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Selected Event Info */}
                                        {selectedEvent && (
                                            <div className="p-3 bg-muted rounded-lg">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h4 className="font-medium text-sm">{selectedEvent.name}</h4>
                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
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
                                                    <Badge
                                                        className={cn("text-xs capitalize", getEventTypeBadge(selectedEvent.eventType))}
                                                    >
                                                        {selectedEvent.eventType}
                                                    </Badge>
                                                </div>
                                                {selectedEvent.financials && (
                                                    <div className="mt-2 pt-2 border-t border-border/50 flex gap-4 text-xs">
                                                        <span>
                                                            Offerings: <span className="text-green-600 font-medium">
                                                                {formatCurrency(selectedEvent.financials.totalOfferings)}
                                                            </span>
                                                        </span>
                                                        <span>
                                                            Expenses: <span className="text-red-600 font-medium">
                                                                {formatCurrency(selectedEvent.financials.totalExpenses)}
                                                            </span>
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Date <span className="text-destructive">*</span></Label>
                                <Input
                                    type="date"
                                    value={formData.transactionDate}
                                    onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Amount <span className="text-destructive">*</span></Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                        {currencySymbol}
                                    </span>
                                    <Input
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Category <span className="text-destructive">*</span></Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsCategoryOpen(true)}
                                    className="text-xs"
                                >
                                    <Plus className="h-3 w-3 mr-1" />
                                    New Category
                                </Button>
                            </div>
                            <Select
                                value={formData.categoryId}
                                onValueChange={(v) => setFormData({ ...formData, categoryId: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {isLoadingCategories ? (
                                        <div className="p-2 text-center text-sm text-muted-foreground">
                                            Loading categories...
                                        </div>
                                    ) : categories.length === 0 ? (
                                        <div className="p-2 text-center text-sm text-muted-foreground">
                                            No categories available
                                        </div>
                                    ) : (
                                        categories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                {cat.name}
                                                {cat.isPredefined && (
                                                    <span className="ml-2 text-xs text-muted-foreground">(Default)</span>
                                                )}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Account <span className="text-destructive">*</span></Label>
                            <Select
                                value={formData.accountId}
                                onValueChange={(v) => setFormData({ ...formData, accountId: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {isLoadingAccounts ? (
                                        <div className="p-2 text-center text-sm text-muted-foreground">
                                            Loading accounts...
                                        </div>
                                    ) : activeAccounts.length === 0 ? (
                                        <div className="p-2 text-center text-sm text-muted-foreground">
                                            No active accounts available
                                        </div>
                                    ) : (
                                        activeAccounts.map(account => (
                                            <SelectItem key={account.id} value={account.id}>
                                                <div className="flex items-center justify-between w-full">
                                                    <span>{account.name}</span>
                                                    <span className="text-xs text-muted-foreground ml-2">
                                                        ({formatCurrency(account.balance)})
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Payment Method <span className="text-destructive">*</span></Label>
                            <Select
                                value={formData.paymentMethod}
                                onValueChange={(v) => setFormData({ ...formData, paymentMethod: v as PaymentMethod })}
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
                            <Label>Reference Number</Label>
                            <Input
                                value={formData.referenceNumber}
                                onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                                placeholder="Invoice/Receipt number"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="What is this expense for?"
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRecordOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={isRecording}>
                            {isRecording ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                'Submit for Approval'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Category Dialog */}
            <Dialog open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create Expense Category</DialogTitle>
                        <DialogDescription>
                            Add a new category for organizing expenses
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Category Name <span className="text-destructive">*</span></Label>
                            <Input
                                value={categoryForm.name}
                                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                placeholder="e.g., Utilities, Transport, Supplies"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={categoryForm.description || ''}
                                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                placeholder="Category description..."
                                rows={2}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCategoryOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateCategory} disabled={isCreatingCategory}>
                            {isCreatingCategory ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Category'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View/Approval Dialog */}
            <Dialog open={showViewDialog || showApprovalDialog} onOpenChange={(open) => {
                setShowViewDialog(open);
                setShowApprovalDialog(open);
                if (!open) {
                    setSelectedExpense(null);
                    setRejectionReason('');
                }
            }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Expense Details</DialogTitle>
                    </DialogHeader>
                    {selectedExpense && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">Amount</Label>
                                    <p className="font-medium text-lg text-red-600">
                                        {formatCurrency(Math.abs(selectedExpense.amount))}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Status</Label>
                                    <div className="mt-1">
                                        {getApprovalStatusBadge(selectedExpense.approvalStatus || 'pending')}
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Category</Label>
                                    <p className="font-medium">
                                        {selectedExpense.expenseCategoryName || 'Uncategorized'}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Date</Label>
                                    <p className="font-medium">{selectedExpense.transactionDate}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Submitted By</Label>
                                    <p className="font-medium">{selectedExpense.submittedByName || '-'}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Payment Method</Label>
                                    <p className="font-medium capitalize">
                                        {selectedExpense.paymentMethod.replace('_', ' ')}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Account</Label>
                                    <p className="font-medium">{selectedExpense.accountName || '-'}</p>
                                </div>
                                {selectedExpense.referenceNumber && (
                                    <div>
                                        <Label className="text-muted-foreground">Reference</Label>
                                        <p className="font-medium font-mono">{selectedExpense.referenceNumber}</p>
                                    </div>
                                )}
                            </div>

                            {selectedExpense.eventName && (
                                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                                    <Label className="text-muted-foreground text-xs">Linked Event</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Link2 className="h-4 w-4 text-primary" />
                                        <p className="font-medium">{selectedExpense.eventName}</p>
                                        {selectedExpense.eventDate && (
                                            <span className="text-sm text-muted-foreground">
                                                ({selectedExpense.eventDate})
                                            </span>
                                        )}
                                    </div>
                                    {selectedExpense.eventType && (
                                        <Badge className={cn("mt-2 text-xs capitalize", getEventTypeBadge(selectedExpense.eventType))}>
                                            {selectedExpense.eventType}
                                        </Badge>
                                    )}
                                </div>
                            )}

                            {selectedExpense.description && (
                                <div>
                                    <Label className="text-muted-foreground">Description</Label>
                                    <p className="font-medium">{selectedExpense.description}</p>
                                </div>
                            )}

                            {selectedExpense.approvalStatus === 'rejected' && selectedExpense.rejectionReason && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <Label className="text-red-700">Rejection Reason</Label>
                                    <p className="text-sm text-red-600 mt-1">
                                        {selectedExpense.rejectionReason}
                                    </p>
                                </div>
                            )}

                            {selectedExpense.approvalStatus === 'approved' && selectedExpense.approvedByName && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <Label className="text-green-700">Approved By</Label>
                                    <p className="text-sm text-green-600 mt-1">
                                        {selectedExpense.approvedByName}
                                        {selectedExpense.approvedAt && ` on ${format(new Date(selectedExpense.approvedAt), 'PPP')}`}
                                    </p>
                                </div>
                            )}

                            {isAdmin && selectedExpense.approvalStatus === 'pending' && showApprovalDialog && (
                                <div className="space-y-3">
                                    <Label>Rejection Reason (if rejecting)</Label>
                                    <Textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Provide a reason for rejection..."
                                        rows={3}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setShowViewDialog(false);
                            setShowApprovalDialog(false);
                            setSelectedExpense(null);
                            setRejectionReason('');
                        }}>
                            Close
                        </Button>
                        {isAdmin && selectedExpense?.approvalStatus === 'pending' && showApprovalDialog && (
                            <>
                                <Button
                                    variant="destructive"
                                    onClick={() => handleApproval('rejected')}
                                    disabled={isProcessing}
                                >
                                    <ThumbsDown className="h-4 w-4 mr-2" />
                                    Reject
                                </Button>
                                <Button
                                    onClick={() => handleApproval('approved')}
                                    disabled={isProcessing}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    <ThumbsUp className="h-4 w-4 mr-2" />
                                    Approve
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!expenseToDelete} onOpenChange={() => setExpenseToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this expense?
                            {expenseToDelete?.approvalStatus === 'approved' && (
                                <span className="block mt-2 text-amber-600">
                                    Warning: This expense has been approved and will affect your account balance.
                                </span>
                            )}
                            {expenseToDelete?.eventName && (
                                <span className="block mt-2 text-amber-600">
                                    Note: This expense is linked to "{expenseToDelete.eventName}" and will be removed from its financials.
                                </span>
                            )}
                            <span className="block mt-2">
                                This action cannot be undone.
                            </span>
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
        </DashboardLayout>
    );
}