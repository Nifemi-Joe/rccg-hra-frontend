// src/pages/communication/BuyUnitsPage.tsx
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
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    MessageSquare,
    Mail,
    MessageCircle,
    Phone,
    CreditCard,
    Wallet,
    TrendingUp,
    TrendingDown,
    Gift,
    Settings,
    Plus,
    Edit,
    Trash2,
    Check,
    Star,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { walletApi, UnitPackage, MessagingPricing, WalletTransaction } from '@/services/walletApi';
import { useAuth } from '@/contexts/AuthContext';

const channelIcons: Record<string, React.ReactNode> = {
    sms: <MessageSquare className="h-5 w-5" />,
    email: <Mail className="h-5 w-5" />,
    whatsapp: <MessageCircle className="h-5 w-5" />,
    voice: <Phone className="h-5 w-5" />,
};

const channelColors: Record<string, string> = {
    sms: 'bg-blue-500',
    email: 'bg-green-500',
    whatsapp: 'bg-emerald-500',
    voice: 'bg-purple-500',
};

export default function BuyUnitsPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const isAdmin = user?.role === 'super_admin';

    const [activeChannel, setActiveChannel] = useState<string>('sms');
    const [selectedPackage, setSelectedPackage] = useState<UnitPackage | null>(null);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [showPricingDialog, setShowPricingDialog] = useState(false);
    const [showPackageDialog, setShowPackageDialog] = useState(false);
    const [editingPricing, setEditingPricing] = useState<MessagingPricing | null>(null);
    const [editingPackage, setEditingPackage] = useState<UnitPackage | null>(null);
    const [transactionPage, setTransactionPage] = useState(1);

    // Queries
    const { data: wallet } = useQuery({
        queryKey: ['wallet'],
        queryFn: () => walletApi.getWallet(),
    });

    const { data: packages } = useQuery({
        queryKey: ['packages', activeChannel],
        queryFn: () => walletApi.getPackages(activeChannel),
    });

    const { data: allPackages } = useQuery({
        queryKey: ['packages', 'all'],
        queryFn: () => walletApi.getPackages(),
        enabled: isAdmin,
    });

    const { data: pricing } = useQuery({
        queryKey: ['pricing'],
        queryFn: () => walletApi.getPricing(),
    });

    const { data: transactions } = useQuery({
        queryKey: ['wallet-transactions', transactionPage],
        queryFn: () => walletApi.getTransactions({ page: transactionPage, limit: 10 }),
    });

    // Mutations
    const purchaseMutation = useMutation({
        mutationFn: (data: any) => walletApi.purchaseUnits(data),
        onSuccess: () => {
            toast.success('Units purchased successfully!');
            queryClient.invalidateQueries({ queryKey: ['wallet'] });
            queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
            setShowPaymentDialog(false);
            setSelectedPackage(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to purchase units');
        },
    });

    const updatePricingMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => walletApi.updatePricing(id, data),
        onSuccess: () => {
            toast.success('Pricing updated successfully');
            queryClient.invalidateQueries({ queryKey: ['pricing'] });
            setShowPricingDialog(false);
            setEditingPricing(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update pricing');
        },
    });

    const updatePackageMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => walletApi.updatePackage(id, data),
        onSuccess: () => {
            toast.success('Package updated successfully');
            queryClient.invalidateQueries({ queryKey: ['packages'] });
            setShowPackageDialog(false);
            setEditingPackage(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update package');
        },
    });

    const createPackageMutation = useMutation({
        mutationFn: (data: any) => walletApi.createPackage(data),
        onSuccess: () => {
            toast.success('Package created successfully');
            queryClient.invalidateQueries({ queryKey: ['packages'] });
            setShowPackageDialog(false);
            setEditingPackage(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create package');
        },
    });

    const deletePackageMutation = useMutation({
        mutationFn: (id: string) => walletApi.deletePackage(id),
        onSuccess: () => {
            toast.success('Package deleted');
            queryClient.invalidateQueries({ queryKey: ['packages'] });
        },
    });

    const handlePurchase = () => {
        if (!selectedPackage) return;

        // In production, integrate with payment gateway (Paystack, Flutterwave, etc.)
        purchaseMutation.mutate({
            packageId: selectedPackage.id,
            channel: selectedPackage.channel,
            paymentMethod: 'card',
            paymentReference: `PAY-${Date.now()}`,
            amount: selectedPackage.price,
        });
    };

    const getBalanceByChannel = (channel: string): number => {
        if (!wallet?.data?.data) return 0;
        const w = wallet.data.data;
        switch (channel) {
            case 'sms': return w.sms_balance;
            case 'email': return w.email_balance;
            case 'whatsapp': return w.whatsapp_balance;
            case 'voice': return w.voice_balance;
            default: return 0;
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Buy Units</h1>
                    <p className="text-muted-foreground">
                        Purchase messaging units for SMS, Email, WhatsApp, and Voice
                    </p>
                </div>
                {isAdmin && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowPricingDialog(true)}>
                            <Settings className="h-4 w-4 mr-2" />
                            Manage Pricing
                        </Button>
                        <Button variant="outline" onClick={() => {
                            setEditingPackage(null);
                            setShowPackageDialog(true);
                        }}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Package
                        </Button>
                    </div>
                )}
            </div>

            {/* Balance Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {['sms', 'email', 'whatsapp', 'voice'].map((channel) => (
                    <Card key={channel} className="relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 ${channelColors[channel]}`} />
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                {channelIcons[channel]}
                                {channel.toUpperCase()} Balance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {getBalanceByChannel(channel).toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground">units available</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Packages Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Select Package</CardTitle>
                    <CardDescription>Choose a package to purchase messaging units</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeChannel} onValueChange={setActiveChannel}>
                        <TabsList className="grid grid-cols-4 w-full max-w-md">
                            <TabsTrigger value="sms" className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                SMS
                            </TabsTrigger>
                            <TabsTrigger value="email" className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                Email
                            </TabsTrigger>
                            <TabsTrigger value="whatsapp" className="flex items-center gap-2">
                                <MessageCircle className="h-4 w-4" />
                                WhatsApp
                            </TabsTrigger>
                            <TabsTrigger value="voice" className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                Voice
                            </TabsTrigger>
                        </TabsList>

                        <div className="mt-6">
                            <RadioGroup
                                value={selectedPackage?.id || ''}
                                onValueChange={(value) => {
                                    const pkg = packages?.data?.data?.find(p => p.id === value);
                                    setSelectedPackage(pkg || null);
                                }}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {packages?.data?.data?.map((pkg) => (
                                        <div key={pkg.id} className="relative">
                                            {pkg.is_popular && (
                                                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 bg-primary">
                                                    <Star className="h-3 w-3 mr-1" />
                                                    Most Popular
                                                </Badge>
                                            )}
                                            <RadioGroupItem
                                                value={pkg.id}
                                                id={pkg.id}
                                                className="peer sr-only"
                                            />
                                            <Label
                                                htmlFor={pkg.id}
                                                className={`flex flex-col rounded-lg border-2 p-4 cursor-pointer transition-all
                                                    ${pkg.is_popular ? 'border-primary/50' : 'border-muted'}
                                                    peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5
                                                    hover:border-primary/50`}
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="font-semibold">{pkg.name}</span>
                                                    {isAdmin && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setEditingPackage(pkg);
                                                                setShowPackageDialog(true);
                                                            }}
                                                        >
                                                            <Edit className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                                <div className="flex items-baseline gap-2 mb-2">
                                                    <span className="text-3xl font-bold">
                                                        {pkg.units.toLocaleString()}
                                                    </span>
                                                    <span className="text-muted-foreground">units</span>
                                                </div>
                                                {pkg.bonus_units > 0 && (
                                                    <Badge variant="secondary" className="w-fit mb-2">
                                                        <Gift className="h-3 w-3 mr-1" />
                                                        +{pkg.bonus_units} bonus
                                                    </Badge>
                                                )}
                                                <Separator className="my-2" />
                                                <div className="flex items-center justify-between">
                                                    <span className="text-2xl font-bold">
                                                        ₦{pkg.price.toLocaleString()}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        ₦{(pkg.price / (pkg.units + pkg.bonus_units)).toFixed(2)}/unit
                                                    </span>
                                                </div>
                                                {pkg.description && (
                                                    <p className="text-sm text-muted-foreground mt-2">
                                                        {pkg.description}
                                                    </p>
                                                )}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </RadioGroup>

                            {selectedPackage && (
                                <div className="mt-6 flex justify-end">
                                    <Button
                                        size="lg"
                                        onClick={() => setShowPaymentDialog(true)}
                                        className="px-8"
                                    >
                                        <CreditCard className="h-4 w-4 mr-2" />
                                        Purchase for ₦{selectedPackage.price.toLocaleString()}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Transaction History */}
            <Card>
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>Your recent unit purchases and usage</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Channel</TableHead>
                                <TableHead>Units</TableHead>
                                <TableHead>Balance</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions?.data?.data?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No transactions yet
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions?.data?.data?.map((tx: WalletTransaction) => (
                                    <TableRow key={tx.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {tx.type === 'credit' && <TrendingUp className="h-4 w-4 text-green-500" />}
                                                {tx.type === 'debit' && <TrendingDown className="h-4 w-4 text-red-500" />}
                                                {tx.type === 'bonus' && <Gift className="h-4 w-4 text-purple-500" />}
                                                <span className="capitalize">{tx.type}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="uppercase">
                                                {tx.channel}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className={tx.type === 'debit' ? 'text-red-500' : 'text-green-500'}>
                                                {tx.type === 'debit' ? '-' : '+'}{tx.units}
                                            </span>
                                        </TableCell>
                                        <TableCell>{tx.balance_after}</TableCell>
                                        <TableCell className="max-w-[200px] truncate">
                                            {tx.description || '-'}
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(tx.created_at), 'PPp')}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    <div className="flex items-center justify-between mt-4">
                        <span className="text-sm text-muted-foreground">
                            Page {transactionPage}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setTransactionPage(p => Math.max(1, p - 1))}
                                disabled={transactionPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setTransactionPage(p => p + 1)}
                                disabled={(transactions?.data?.data?.length || 0) < 10}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Payment Confirmation Dialog */}
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Purchase</DialogTitle>
                        <DialogDescription>
                            You are about to purchase messaging units
                        </DialogDescription>
                    </DialogHeader>

                    {selectedPackage && (
                        <div className="space-y-4">
                            <div className="rounded-lg border p-4 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Package</span>
                                    <span className="font-medium">{selectedPackage.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Units</span>
                                    <span className="font-medium">{selectedPackage.units.toLocaleString()}</span>
                                </div>
                                {selectedPackage.bonus_units > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Bonus</span>
                                        <span className="font-medium text-green-600">
                                            +{selectedPackage.bonus_units.toLocaleString()}
                                        </span>
                                    </div>
                                )}
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Units</span>
                                    <span className="font-bold">
                                        {(selectedPackage.units + selectedPackage.bonus_units).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between text-lg">
                                    <span className="font-medium">Amount</span>
                                    <span className="font-bold">₦{selectedPackage.price.toLocaleString()}</span>
                                </div>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                Click proceed to complete your payment via Paystack.
                            </p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handlePurchase} disabled={purchaseMutation.isPending}>
                            {purchaseMutation.isPending ? 'Processing...' : 'Proceed to Payment'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Pricing Management Dialog (Admin Only) */}
            <Dialog open={showPricingDialog} onOpenChange={setShowPricingDialog}>
                <DialogContent className="max-w-3xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>Manage Pricing</DialogTitle>
                        <DialogDescription>
                            Update cost and selling prices for each channel and country
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="h-[400px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Channel</TableHead>
                                    <TableHead>Country</TableHead>
                                    <TableHead>Cost (₦)</TableHead>
                                    <TableHead>Sell Price (₦)</TableHead>
                                    <TableHead>Margin</TableHead>
                                    <TableHead>Active</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pricing?.data?.data?.map((price: MessagingPricing) => (
                                    <TableRow key={price.id}>
                                        <TableCell className="uppercase font-medium">
                                            {price.channel}
                                        </TableCell>
                                        <TableCell>{price.country_name}</TableCell>
                                        <TableCell>₦{price.cost_per_unit.toFixed(2)}</TableCell>
                                        <TableCell>₦{price.sell_price.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Badge variant={price.sell_price > price.cost_per_unit ? 'default' : 'destructive'}>
                                                {((price.sell_price - price.cost_per_unit) / price.cost_per_unit * 100).toFixed(0)}%
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={price.is_active}
                                                onCheckedChange={(checked) => {
                                                    updatePricingMutation.mutate({
                                                        id: price.id,
                                                        data: { isActive: checked },
                                                    });
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setEditingPricing(price)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>

                    {/* Edit Pricing Form */}
                    {editingPricing && (
                        <div className="border-t pt-4 mt-4 space-y-4">
                            <h4 className="font-medium">
                                Edit: {editingPricing.channel.toUpperCase()} - {editingPricing.country_name}
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Cost Per Unit (₦)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={editingPricing.cost_per_unit}
                                        onChange={(e) => setEditingPricing({
                                            ...editingPricing,
                                            cost_per_unit: parseFloat(e.target.value),
                                        })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Sell Price (₦)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={editingPricing.sell_price}
                                        onChange={(e) => setEditingPricing({
                                            ...editingPricing,
                                            sell_price: parseFloat(e.target.value),
                                        })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setEditingPricing(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => {
                                        updatePricingMutation.mutate({
                                            id: editingPricing.id,
                                            data: {
                                                costPerUnit: editingPricing.cost_per_unit,
                                                sellPrice: editingPricing.sell_price,
                                            },
                                        });
                                    }}
                                    disabled={updatePricingMutation.isPending}
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Package Management Dialog (Admin Only) */}
            <Dialog open={showPackageDialog} onOpenChange={(open) => {
                setShowPackageDialog(open);
                if (!open) setEditingPackage(null);
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingPackage ? 'Edit Package' : 'Create Package'}
                        </DialogTitle>
                    </DialogHeader>

                    <PackageForm
                        package={editingPackage}
                        onSubmit={(data) => {
                            if (editingPackage) {
                                updatePackageMutation.mutate({ id: editingPackage.id, data });
                            } else {
                                createPackageMutation.mutate(data);
                            }
                        }}
                        onDelete={editingPackage ? () => {
                            deletePackageMutation.mutate(editingPackage.id);
                            setShowPackageDialog(false);
                        } : undefined}
                        isLoading={updatePackageMutation.isPending || createPackageMutation.isPending}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Package Form Component
function PackageForm({
                         package: pkg,
                         onSubmit,
                         onDelete,
                         isLoading,
                     }: {
    package: UnitPackage | null;
    onSubmit: (data: Partial<UnitPackage>) => void;
    onDelete?: () => void;
    isLoading: boolean;
}) {
    const [formData, setFormData] = useState({
        name: pkg?.name || '',
        channel: pkg?.channel || 'sms',
        units: pkg?.units || 0,
        price: pkg?.price || 0,
        bonus_units: pkg?.bonus_units || 0,
        is_popular: pkg?.is_popular || false,
        sort_order: pkg?.sort_order || 0,
        description: pkg?.description || '',
    });

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Starter SMS"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Channel</Label>
                    <select
                        className="w-full h-10 rounded-md border px-3"
                        value={formData.channel}
                        onChange={(e) => setFormData({ ...formData, channel: e.target.value as any })}
                        disabled={!!pkg}
                    >
                        <option value="sms">SMS</option>
                        <option value="email">Email</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="voice">Voice</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Units</Label>
                    <Input
                        type="number"
                        value={formData.units}
                        onChange={(e) => setFormData({ ...formData, units: parseInt(e.target.value) })}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Price (₦)</Label>
                    <Input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Bonus Units</Label>
                    <Input
                        type="number"
                        value={formData.bonus_units}
                        onChange={(e) => setFormData({ ...formData, bonus_units: parseInt(e.target.value) })}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Sort Order</Label>
                    <Input
                        type="number"
                        value={formData.sort_order}
                        onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Description</Label>
                <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description"
                />
            </div>

            <div className="flex items-center gap-2">
                <Switch
                    checked={formData.is_popular}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_popular: checked })}
                />
                <Label>Mark as Popular</Label>
            </div>

            <DialogFooter className="flex justify-between">
                {onDelete && (
                    <Button variant="destructive" onClick={onDelete}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                )}
                <Button onClick={() => onSubmit(formData)} disabled={isLoading}>
                    {isLoading ? 'Saving...' : (pkg ? 'Update' : 'Create')}
                </Button>
            </DialogFooter>
        </div>
    );
}