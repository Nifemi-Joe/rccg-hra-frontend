// src/pages/sms/BuyUnits.tsx
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    CreditCard,
    Wallet,
    TrendingUp,
    TrendingDown,
    Gift,
    RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { smsApi, SmsTransaction } from '@/services/smsApi';

// Define SMS unit packages
const packages = [
    { units: 100, price: 5, popular: false },
    { units: 500, price: 20, popular: false },
    { units: 1000, price: 35, popular: true },
    { units: 5000, price: 150, popular: false },
    { units: 10000, price: 280, popular: false },
];

export default function BuyUnits() {
    const queryClient = useQueryClient();
    const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
    const [customUnits, setCustomUnits] = useState('');
    const [useCustom, setUseCustom] = useState(false);
    const [page, setPage] = useState(1);

    const { data: balance } = useQuery({
        queryKey: ['sms-balance'],
        queryFn: () => smsApi.getBalance(),
    });

    const { data: transactions } = useQuery({
        queryKey: ['sms-transactions', page],
        queryFn: () => smsApi.getTransactions(page, 10),
    });

    const purchaseMutation = useMutation({
        mutationFn: (data: { units: number; paymentMethod: string; paymentReference: string; amount: number }) =>
            smsApi.purchaseUnits(data),
        onSuccess: () => {
            toast.success('SMS units purchased successfully!');
            queryClient.invalidateQueries({ queryKey: ['sms-balance'] });
            queryClient.invalidateQueries({ queryKey: ['sms-transactions'] });
            setSelectedPackage(null);
            setCustomUnits('');
        },
        onError: () => {
            toast.error('Failed to purchase units');
        },
    });

    const handlePurchase = () => {
        const units = useCustom ? parseInt(customUnits) : packages[selectedPackage!]?.units;
        const amount = useCustom ? parseInt(customUnits) * 0.04 : packages[selectedPackage!]?.price;

        if (!units || units <= 0) {
            toast.error('Please select a valid package or enter a custom amount');
            return;
        }

        // In a real app, integrate with payment gateway here
        // For demo, we'll simulate a successful purchase
        purchaseMutation.mutate({
            units,
            paymentMethod: 'card',
            paymentReference: `PAY-${Date.now()}`,
            amount,
        });
    };

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'purchase':
                return <TrendingUp className="h-4 w-4 text-green-600" />;
            case 'usage':
                return <TrendingDown className="h-4 w-4 text-red-600" />;
            case 'bonus':
                return <Gift className="h-4 w-4 text-purple-600" />;
            case 'refund':
                return <RefreshCw className="h-4 w-4 text-blue-600" />;
            default:
                return null;
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Purchase Section */}
            <div className="lg:col-span-2 space-y-6">
                {/* Current Balance */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Current Balance</p>
                                <p className="text-4xl font-bold">
                                    {balance?.data?.data?.units?.toLocaleString() || 0}
                                </p>
                                <p className="text-sm text-muted-foreground">SMS Units</p>
                            </div>
                            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                                <Wallet className="h-8 w-8 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Packages */}
                <Card>
                    <CardHeader>
                        <CardTitle>Select Package</CardTitle>
                        <CardDescription>Choose a package or enter a custom amount</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <RadioGroup
                            value={useCustom ? 'custom' : selectedPackage?.toString()}
                            onValueChange={(value) => {
                                if (value === 'custom') {
                                    setUseCustom(true);
                                    setSelectedPackage(null);
                                } else {
                                    setUseCustom(false);
                                    setSelectedPackage(parseInt(value));
                                }
                            }}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {packages.map((pkg, index) => (
                                    <div key={index} className="relative">
                                        {pkg.popular && (
                                            <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
                                                Most Popular
                                            </Badge>
                                        )}
                                        <RadioGroupItem
                                            value={index.toString()}
                                            id={`package-${index}`}
                                            className="peer sr-only"
                                        />
                                        <Label
                                            htmlFor={`package-${index}`}
                                            className={`flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer ${
                                                pkg.popular ? 'border-primary/50' : ''
                                            }`}
                                        >
                                            <span className="text-2xl font-bold">{pkg.units.toLocaleString()}</span>
                                            <span className="text-sm text-muted-foreground">units</span>
                                            <span className="text-lg font-semibold mt-2">${pkg.price}</span>
                                            <span className="text-xs text-muted-foreground">
                                                ${(pkg.price / pkg.units * 100).toFixed(1)}¢ per SMS
                                            </span>
                                        </Label>
                                    </div>
                                ))}
                            </div>

                            {/* Custom Amount */}
                            <div className="mt-4">
                                <RadioGroupItem
                                    value="custom"
                                    id="custom"
                                    className="peer sr-only"
                                />
                                <Label
                                    htmlFor="custom"
                                    className="flex items-center gap-4 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent peer-data-[state=checked]:border-primary cursor-pointer"
                                >
                                    <div className="flex-1">
                                        <span className="font-medium">Custom Amount</span>
                                        <p className="text-sm text-muted-foreground">
                                            Enter the number of units you want to purchase
                                        </p>
                                    </div>
                                    {useCustom && (
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                placeholder="Units"
                                                value={customUnits}
                                                onChange={(e) => setCustomUnits(e.target.value)}
                                                className="w-32"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                = ${(parseInt(customUnits || '0') * 0.04).toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                </Label>
                            </div>
                        </RadioGroup>

                        {/* Purchase Button */}
                        <Button
                            className="w-full"
                            size="lg"
                            onClick={handlePurchase}
                            disabled={
                                purchaseMutation.isPending ||
                                (!useCustom && selectedPackage === null) ||
                                (useCustom && (!customUnits || parseInt(customUnits) <= 0))
                            }
                        >
                            <CreditCard className="h-4 w-4 mr-2" />
                            {purchaseMutation.isPending ? 'Processing...' : 'Purchase Now'}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Transaction History */}
            <div>
                <Card>
                    <CardHeader>
                        <CardTitle>Transaction History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {transactions?.data?.data?.length === 0 ? (
                                <p className="text-center text-muted-foreground py-4">
                                    No transactions yet
                                </p>
                            ) : (
                                transactions?.data?.data?.map((tx: SmsTransaction) => (
                                    <div
                                        key={tx.id}
                                        className="flex items-center justify-between py-2 border-b last:border-0"
                                    >
                                        <div className="flex items-center gap-3">
                                            {getTransactionIcon(tx.type)}
                                            <div>
                                                <p className="font-medium text-sm capitalize">
                                                    {tx.type}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {format(new Date(tx.created_at), 'PP')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-medium ${
                                                tx.units > 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {tx.units > 0 ? '+' : ''}{tx.units}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Bal: {tx.balance_after}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}