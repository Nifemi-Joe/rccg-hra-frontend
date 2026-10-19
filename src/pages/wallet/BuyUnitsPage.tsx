// src/pages/wallet/BuyUnitsPage.tsx
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    CreditCard,
    Package,
    Zap,
    Check,
    Loader2,
    MessageSquare,
    Mail,
    MessageCircle,
    Phone,
    Gift,
} from 'lucide-react';
import { walletApi } from '@/services/walletApi.ts';
import { paymentApi } from '@/services/paymentApi.ts';

import { DashboardLayout } from '@/components/DashboardLayout';
import { PaystackButton } from 'react-paystack';

const channelIcons = {
    sms: MessageSquare,
    email: Mail,
    whatsapp: MessageCircle,
    voice: Phone,
    combo: Gift,
};

const channelColors = {
    sms: 'text-blue-600',
    email: 'text-green-600',
    whatsapp: 'text-emerald-600',
    voice: 'text-purple-600',
    combo: 'text-orange-600',
};

export default function BuyUnitsPage() {
    const [selectedChannel, setSelectedChannel] = useState<'sms' | 'email' | 'whatsapp' | 'voice' | 'combo'>('sms');
    const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
    const [customUnits, setCustomUnits] = useState<number>(0);
    const [buyMode, setBuyMode] = useState<'package' | 'custom'>('package');
    const [email, setEmail] = useState('');

    // Queries
    const { data: packages, isLoading: loadingPackages } = useQuery({
        queryKey: ['packages', selectedChannel],
        queryFn: () => walletApi.getAllPackages(selectedChannel),
    });

    const { data: pricing } = useQuery({
        queryKey: ['pricing', selectedChannel],
        queryFn: () => walletApi.getPricingByChannel(selectedChannel),
    });

    const { data: publicKey } = useQuery({
        queryKey: ['paystack-key'],
        queryFn: () => paymentApi.getPublicKey(),
    });

    const { data: balances } = useQuery({
        queryKey: ['wallet-balances'],
        queryFn: () => walletApi.getAllBalances(),
    });

    // Calculate price for custom units
    const customPrice = customUnits * (pricing?.data?.data?.sell_price || 0);

    // Get selected package details
    const selectedPkg = packages?.data?.data?.find(p => p.id === selectedPackage);

    // Initialize payment mutation
    const initPaymentMutation = useMutation({
        mutationFn: (data: any) => paymentApi.initializePurchase(data),
        onSuccess: (response) => {
            const { authorizationUrl } = response.data.data;
            window.location.href = authorizationUrl;
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to initialize payment');
        },
    });

    const handlePurchase = () => {
        if (!email) {
            toast.error('Please enter your email address');
            return;
        }

        const data = {
            channel: selectedChannel,
            email,
            callbackUrl: `${window.location.origin}/wallet/verify`,
            ...(buyMode === 'package' ? { packageId: selectedPackage } : { units: customUnits }),
        };

        initPaymentMutation.mutate(data);
    };

    const channelPackages = packages?.data?.data?.filter(p => p.channel === selectedChannel) || [];

    return (
        <DashboardLayout>
            <div className="container mx-auto p-6 space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold">Buy Units</h1>
                    <p className="text-muted-foreground">Purchase units for SMS, Email, WhatsApp, and Voice</p>
                </div>

                {/* Current Balances */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium">SMS</CardTitle>
                                <MessageSquare className="h-4 w-4 text-blue-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {balances?.data?.data?.sms_balance?.toLocaleString() || 0}
                            </div>
                            <p className="text-xs text-muted-foreground">units</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium">Email</CardTitle>
                                <Mail className="h-4 w-4 text-green-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {balances?.data?.data?.email_balance?.toLocaleString() || 0}
                            </div>
                            <p className="text-xs text-muted-foreground">units</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium">WhatsApp</CardTitle>
                                <MessageCircle className="h-4 w-4 text-emerald-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {balances?.data?.data?.whatsapp_balance?.toLocaleString() || 0}
                            </div>
                            <p className="text-xs text-muted-foreground">units</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium">Voice</CardTitle>
                                <Phone className="h-4 w-4 text-purple-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {balances?.data?.data?.voice_balance?.toLocaleString() || 0}
                            </div>
                            <p className="text-xs text-muted-foreground">units</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Packages */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Select Channel</CardTitle>
                                <CardDescription>Choose the messaging channel you want to purchase units for</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Channel Selection */}
                                <RadioGroup
                                    value={selectedChannel}
                                    onValueChange={(value: any) => {
                                        setSelectedChannel(value);
                                        setSelectedPackage(null);
                                    }}
                                    className="grid grid-cols-2 md:grid-cols-5 gap-4"
                                >
                                    {(['sms', 'email', 'whatsapp', 'voice', 'combo'] as const).map((channel) => {
                                        const Icon = channelIcons[channel];
                                        return (
                                            <div key={channel}>
                                                <RadioGroupItem
                                                    value={channel}
                                                    id={channel}
                                                    className="peer sr-only"
                                                />
                                                <Label
                                                    htmlFor={channel}
                                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                                >
                                                    <Icon className={`mb-2 h-6 w-6 ${channelColors[channel]}`} />
                                                    <span className="text-sm capitalize">{channel}</span>
                                                </Label>
                                            </div>
                                        );
                                    })}
                                </RadioGroup>

                                {/* Buy Mode Tabs */}
                                <Tabs value={buyMode} onValueChange={(v: any) => setBuyMode(v)}>
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="package">
                                            <Package className="h-4 w-4 mr-2" />
                                            Packages
                                        </TabsTrigger>
                                        <TabsTrigger value="custom">
                                            <Zap className="h-4 w-4 mr-2" />
                                            Custom
                                        </TabsTrigger>
                                    </TabsList>

                                    {/* Packages Tab */}
                                    <TabsContent value="package" className="space-y-4">
                                        {loadingPackages ? (
                                            <div className="flex items-center justify-center py-12">
                                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {channelPackages.map((pkg) => (
                                                    <Card
                                                        key={pkg.id}
                                                        className={`cursor-pointer transition-all ${
                                                            selectedPackage === pkg.id
                                                                ? 'border-primary ring-2 ring-primary'
                                                                : 'hover:border-primary/50'
                                                        } ${pkg.is_popular ? 'border-primary/50' : ''}`}
                                                        onClick={() => setSelectedPackage(pkg.id)}
                                                    >
                                                        <CardHeader className="pb-3">
                                                            <div className="flex items-center justify-between">
                                                                <CardTitle className="text-lg">{pkg.name}</CardTitle>
                                                                {pkg.is_popular && (
                                                                    <Badge variant="default">Popular</Badge>
                                                                )}
                                                            </div>
                                                            {pkg.description && (
                                                                <CardDescription className="text-xs">
                                                                    {pkg.description}
                                                                </CardDescription>
                                                            )}
                                                        </CardHeader>
                                                        <CardContent className="space-y-3">
                                                            <div>
                                                                <div className="text-3xl font-bold">
                                                                    {pkg.currency} {pkg.price.toLocaleString()}
                                                                </div>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {pkg.units.toLocaleString()} units
                                                                </p>
                                                            </div>
                                                            {pkg.bonus_units > 0 && (
                                                                <div className="flex items-center gap-2 text-sm text-green-600">
                                                                    <Gift className="h-4 w-4" />
                                                                    <span>+{pkg.bonus_units} bonus units</span>
                                                                </div>
                                                            )}
                                                            {pkg.discount_percent > 0 && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    Save {pkg.discount_percent}%
                                                                </Badge>
                                                            )}
                                                            <div className="flex items-center justify-between pt-2">
                                                                <span className="text-sm text-muted-foreground">
                                                                    Total: {(pkg.units + pkg.bonus_units).toLocaleString()} units
                                                                </span>
                                                                {selectedPackage === pkg.id && (
                                                                    <Check className="h-5 w-5 text-primary" />
                                                                )}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        )}
                                    </TabsContent>

                                    {/* Custom Tab */}
                                    <TabsContent value="custom" className="space-y-4">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Custom Units</CardTitle>
                                                <CardDescription>
                                                    Enter the number of units you want to purchase
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label>Number of Units</Label>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={customUnits || ''}
                                                        onChange={(e) => setCustomUnits(parseInt(e.target.value) || 0)}
                                                        placeholder="Enter units"
                                                    />
                                                    <p className="text-sm text-muted-foreground">
                                                        Price per unit: {pricing?.data?.data?.currency} {pricing?.data?.data?.sell_price}
                                                    </p>
                                                </div>
                                                {customUnits > 0 && (
                                                    <div className="p-4 bg-muted rounded-lg">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-lg font-medium">Total Cost:</span>
                                                            <span className="text-2xl font-bold">
                                                                {pricing?.data?.data?.currency} {customPrice.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Checkout */}
                    <div>
                        <Card className="sticky top-6">
                            <CardHeader>
                                <CardTitle>Checkout</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Summary */}
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Channel:</span>
                                        <span className="font-medium capitalize">{selectedChannel}</span>
                                    </div>
                                    {buyMode === 'package' && selectedPkg && (
                                        <>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Package:</span>
                                                <span className="font-medium">{selectedPkg.name}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Base Units:</span>
                                                <span className="font-medium">{selectedPkg.units.toLocaleString()}</span>
                                            </div>
                                            {selectedPkg.bonus_units > 0 && (
                                                <div className="flex justify-between text-sm text-green-600">
                                                    <span>Bonus Units:</span>
                                                    <span className="font-medium">+{selectedPkg.bonus_units.toLocaleString()}</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                    {buyMode === 'custom' && customUnits > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Units:</span>
                                            <span className="font-medium">{customUnits.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <hr />
                                    <div className="flex justify-between">
                                        <span className="font-semibold">Total Amount:</span>
                                        <span className="text-xl font-bold">
                                            {buyMode === 'package' && selectedPkg
                                                ? `${selectedPkg.currency} ${selectedPkg.price.toLocaleString()}`
                                                : `${pricing?.data?.data?.currency} ${customPrice.toLocaleString()}`}
                                        </span>
                                    </div>
                                </div>

                                {/* Email Input */}
                                <div className="space-y-2">
                                    <Label>Email Address</Label>
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Required for payment receipt
                                    </p>
                                </div>

                                {/* Purchase Button */}
                                <Button
                                    className="w-full"
                                    size="lg"
                                    onClick={handlePurchase}
                                    disabled={
                                        initPaymentMutation.isPending ||
                                        !email ||
                                        (buyMode === 'package' && !selectedPackage) ||
                                        (buyMode === 'custom' && customUnits <= 0)
                                    }
                                >
                                    {initPaymentMutation.isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard className="h-4 w-4 mr-2" />
                                            Pay with Paystack
                                        </>
                                    )}
                                </Button>

                                <p className="text-xs text-center text-muted-foreground">
                                    Secure payment powered by Paystack
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
