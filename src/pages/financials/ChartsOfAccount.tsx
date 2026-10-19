// src/pages/financials/ChartsOfAccount.tsx

import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
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
import {
    Plus,
    PlayCircle,
    PieChart,
    Building2,
    CreditCard,
    Wallet,
    MoreHorizontal,
    Edit,
    Trash2,
    Search,
    RefreshCw,
    Loader2,
    CheckCircle,
    DollarSign,
    TrendingUp,
    X,
} from 'lucide-react';
import { useAccounts } from '@/hooks/useFinancials';
import { useCurrency } from '@/hooks/useCurrency';
import { Account, CreateAccountDTO, UpdateAccountDTO, AccountType } from '@/types/financial';
import { cn } from '@/lib/utils';

const ACCOUNT_TYPES: { value: AccountType; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
    { value: 'bank', label: 'Bank Account', icon: Building2, description: 'Traditional bank accounts' },
    { value: 'digital', label: 'Digital Wallet', icon: CreditCard, description: 'Online payment platforms' },
    { value: 'cash', label: 'Cash', icon: Wallet, description: 'Physical cash on hand' },
    { value: 'custom', label: 'Custom', icon: PieChart, description: 'Other account types' },
];

export default function ChartsOfAccount() {
    // Currency hook
    const { formatCurrency, formatCompact, currencySymbol } = useCurrency();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    // Form state
    const [formData, setFormData] = useState<CreateAccountDTO>({
        name: '',
        account_type: 'bank',
        description: '',
        bank_name: '',
        account_number: '',
        initial_balance: 0,
    });

    const {
        accounts,
        isLoading,
        refetch,
        createAccount,
        updateAccount,
        deleteAccount,
        isCreating,
        isUpdating,
        isDeleting,
    } = useAccounts();

    // Filter accounts
    const filteredAccounts = accounts.filter(account => {
        const matchesSearch = account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            account.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            account.bank_name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === 'all' || account.account_type === typeFilter;
        return matchesSearch && matchesType;
    });

    // Calculate totals
    const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
    const activeAccounts = accounts.filter(acc => acc.is_active).length;

    const resetForm = () => {
        setFormData({
            name: '',
            account_type: 'bank',
            description: '',
            bank_name: '',
            account_number: '',
            initial_balance: 0,
        });
        setSelectedAccount(null);
    };

    const handleEdit = (account: Account) => {
        setSelectedAccount(account);
        setFormData({
            name: account.name,
            account_type: account.account_type,
            description: account.description || '',
            bank_name: account.bank_name || '',
            account_number: account.account_number || '',
            initial_balance: account.balance,
        });
        setIsCreateOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            return;
        }

        try {
            if (selectedAccount) {
                await updateAccount({
                    id: selectedAccount.id,
                    data: formData as UpdateAccountDTO,
                });
            } else {
                await createAccount(formData);
            }
            setIsCreateOpen(false);
            resetForm();
        } catch (error) {
            console.error('Error saving account:', error);
        }
    };

    const handleDelete = async () => {
        if (accountToDelete) {
            await deleteAccount(accountToDelete.id);
            setAccountToDelete(null);
        }
    };

    const handleToggleActive = async (account: Account) => {
        await updateAccount({
            id: account.id,
            data: { is_active: !account.is_active },
        });
    };

    const getAccountIcon = (type: AccountType) => {
        const accountType = ACCOUNT_TYPES.find(t => t.value === type);
        const Icon = accountType?.icon || PieChart;
        return <Icon className="h-5 w-5" />;
    };

    const getTypeBadgeColor = (type: AccountType) => {
        switch (type) {
            case 'bank': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'digital': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            case 'cash': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    return (
        <DashboardLayout
            title="Chart of Accounts"
            actions={
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
                        <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                        Refresh
                    </Button>
                    <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create Account
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
                                <div className="p-2 md:p-3 rounded-xl bg-primary/10">
                                    <PieChart className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs md:text-sm text-muted-foreground">Total Accounts</p>
                                    {isLoading ? (
                                        <Skeleton className="h-7 w-12" />
                                    ) : (
                                        <p className="text-xl md:text-2xl font-bold">{accounts.length}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 md:p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 md:p-3 rounded-xl bg-green-500/10">
                                    <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs md:text-sm text-muted-foreground">Active Accounts</p>
                                    {isLoading ? (
                                        <Skeleton className="h-7 w-12" />
                                    ) : (
                                        <p className="text-xl md:text-2xl font-bold">{activeAccounts}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 md:p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 md:p-3 rounded-xl bg-blue-500/10">
                                    <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs md:text-sm text-muted-foreground">Total Balance</p>
                                    {isLoading ? (
                                        <Skeleton className="h-7 w-20" />
                                    ) : (
                                        <p className="text-xl md:text-2xl font-bold text-blue-600">
                                            {formatCompact(totalBalance)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 md:p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 md:p-3 rounded-xl bg-purple-500/10">
                                    <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-xs md:text-sm text-muted-foreground">Account Types</p>
                                    {isLoading ? (
                                        <Skeleton className="h-7 w-12" />
                                    ) : (
                                        <p className="text-xl md:text-2xl font-bold">
                                            {new Set(accounts.map(a => a.account_type)).size}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Accounts List */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <CardTitle>All Accounts</CardTitle>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue placeholder="Filter by type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        {ACCOUNT_TYPES.map(type => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search accounts..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 w-full sm:w-64"
                                    />
                                </div>
                                <ExportDropdown
                                    data={filteredAccounts.map(a => ({
                                        Name: a.name,
                                        Type: a.account_type,
                                        'Bank Name': a.bank_name || '',
                                        'Account Number': a.account_number || '',
                                        Balance: a.balance,
                                        Status: a.is_active ? 'Active' : 'Inactive',
                                        Description: a.description || '',
                                    }))}
                                    filename="chart-of-accounts"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <Skeleton className="h-12 w-12 rounded-lg" />
                                        <div className="space-y-2 flex-1">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-48" />
                                        </div>
                                        <Skeleton className="h-6 w-20" />
                                    </div>
                                ))}
                            </div>
                        ) : filteredAccounts.length === 0 ? (
                            <div className="text-center py-12">
                                <PieChart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                                <p className="text-lg font-medium text-muted-foreground">
                                    {searchQuery || typeFilter !== 'all' ? 'No accounts match your search' : 'No accounts created yet'}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Create an account to start tracking finances
                                </p>
                                <Button onClick={() => setIsCreateOpen(true)} className="mt-4 gap-2">
                                    <Plus className="h-4 w-4" />
                                    Create Account
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Account</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead className="hidden md:table-cell">Description</TableHead>
                                            <TableHead className="text-right">Balance</TableHead>
                                            <TableHead className="text-center">Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredAccounts.map((account) => (
                                            <TableRow key={account.id} className={cn(!account.is_active && "opacity-60")}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "p-2 rounded-lg",
                                                            account.is_active ? "bg-muted" : "bg-muted/50"
                                                        )}>
                                                            {getAccountIcon(account.account_type)}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{account.name}</p>
                                                            {account.bank_name && (
                                                                <p className="text-sm text-muted-foreground">
                                                                    {account.bank_name} {account.account_number && `****${account.account_number.slice(-4)}`}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={cn('capitalize', getTypeBadgeColor(account.account_type))}>
                                                        {account.account_type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell text-muted-foreground max-w-[200px] truncate">
                                                    {account.description || '-'}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    <span className={account.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                        {formatCurrency(Math.abs(account.balance))}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Switch
                                                        checked={account.is_active}
                                                        onCheckedChange={() => handleToggleActive(account)}
                                                        disabled={isUpdating}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleEdit(account)}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-destructive"
                                                                onClick={() => setAccountToDelete(account)}
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
                    </CardContent>
                </Card>
            </div>

            {/* CUSTOM SCROLLABLE MODAL - NO DIALOG COMPONENT */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/80"
                        onClick={() => { setIsCreateOpen(false); resetForm(); }}
                    />

                    {/* Modal */}
                    <div className="relative bg-background rounded-lg shadow-lg w-full max-w-[500px] max-h-[90vh] flex flex-col mx-4">
                        {/* Header - Fixed */}
                        <div className="p-6 border-b flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold">
                                        {selectedAccount ? 'Edit Account' : 'Create Account'}
                                    </h2>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {selectedAccount ? 'Update account details' : 'Add a new account to track finances'}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => { setIsCreateOpen(false); resetForm(); }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="overflow-y-auto flex-1 p-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Account Name <span className="text-destructive">*</span></Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Main Church Account"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Account Type <span className="text-destructive">*</span></Label>
                                    <Select
                                        value={formData.account_type}
                                        onValueChange={(v) => setFormData({ ...formData, account_type: v as AccountType })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ACCOUNT_TYPES.map(type => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    <div className="flex items-center gap-2">
                                                        <type.icon className="h-4 w-4" />
                                                        <span>{type.label}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {formData.account_type === 'bank' && (
                                    <>
                                        <div className="space-y-2">
                                            <Label>Bank Name</Label>
                                            <Input
                                                value={formData.bank_name || ''}
                                                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                                placeholder="e.g., First National Bank"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Account Number</Label>
                                            <Input
                                                value={formData.account_number || ''}
                                                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                                                placeholder="Enter account number"
                                            />
                                        </div>
                                    </>
                                )}

                                {!selectedAccount && (
                                    <div className="space-y-2">
                                        <Label>Initial Balance</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                                {currencySymbol}
                                            </span>
                                            <Input
                                                type="number"
                                                value={formData.initial_balance || ''}
                                                onChange={(e) => setFormData({ ...formData, initial_balance: parseFloat(e.target.value) || 0 })}
                                                placeholder="0.00"
                                                min="0"
                                                step="0.01"
                                                className="pl-8"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea
                                        value={formData.description || ''}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Account description..."
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer - Fixed */}
                        <div className="p-6 border-t flex-shrink-0 flex justify-end gap-2">
                            <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>
                                Cancel
                            </Button>
                            <Button onClick={handleSubmit} disabled={isCreating || isUpdating}>
                                {(isCreating || isUpdating) ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : selectedAccount ? (
                                    'Update Account'
                                ) : (
                                    'Create Account'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            <AlertDialog open={!!accountToDelete} onOpenChange={() => setAccountToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Account</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{accountToDelete?.name}</strong>?
                            This will affect all transactions linked to this account.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
}