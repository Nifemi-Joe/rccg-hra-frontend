// src/pages/payment/PaymentVerificationPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    CheckCircle2,
    XCircle,
    Loader2,
    Receipt,
    Calendar,
    CreditCard,
    Package,
    ArrowRight,
    Download,
    Home,
} from 'lucide-react';
import { format } from 'date-fns';
import { paymentApi } from '@/services/paymentApi';
import { DashboardLayout } from '@/components/DashboardLayout';

export default function PaymentVerificationPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const reference = searchParams.get('reference');
    const [verificationAttempted, setVerificationAttempted] = useState(false);

    const {
        data: verification,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['payment-verification', reference],
        queryFn: () => paymentApi.verifyPayment(reference!),
        enabled: !!reference && !verificationAttempted,
        retry: 3,
        retryDelay: 2000,
    });

    useEffect(() => {
        if (verification || error) {
            setVerificationAttempted(true);
        }
    }, [verification, error]);

    useEffect(() => {
        if (!reference) {
            navigate('/wallet');
        }
    }, [reference, navigate]);

    // Backend returns: { success: boolean, message: string, data: { success, churchId, channel, units, amount } }
    // After API interceptor unwraps axios response, verification = { success, message, data }
    const isSuccess = verification?.success;
    const paymentData = verification?.data;

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="min-h-screen flex items-center justify-center p-6">
                    <Card className="max-w-lg w-full">
                        <CardContent className="pt-12 pb-12">
                            <div className="flex flex-col items-center text-center space-y-6">
                                <div className="relative">
                                    <Loader2 className="h-20 w-20 animate-spin text-primary" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <CreditCard className="h-8 w-8 text-primary/40" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold">Verifying Payment</h2>
                                    <p className="text-muted-foreground">
                                        Please wait while we confirm your payment...
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Receipt className="h-4 w-4" />
                                    Reference:{' '}
                                    <code className="px-2 py-1 bg-muted rounded">
                                        {reference}
                                    </code>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !isSuccess) {
        return (
            <DashboardLayout>
                <div className="min-h-screen flex items-center justify-center p-6">
                    <Card className="max-w-lg w-full border-destructive">
                        <CardContent className="pt-12 pb-12">
                            <div className="flex flex-col items-center text-center space-y-6">
                                <div className="rounded-full bg-destructive/10 p-6">
                                    <XCircle className="h-20 w-20 text-destructive" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold text-destructive">
                                        Payment Failed
                                    </h2>
                                    <p className="text-muted-foreground">
                                        We couldn&apos;t verify your payment. This could be due
                                        to:
                                    </p>
                                    <ul className="text-sm text-muted-foreground text-left space-y-1 mt-4">
                                        <li>• Payment was cancelled</li>
                                        <li>• Insufficient funds</li>
                                        <li>• Network error during processing</li>
                                        <li>• Invalid payment reference</li>
                                    </ul>
                                </div>
                                {reference && (
                                    <div className="w-full p-4 bg-muted rounded-lg">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Receipt className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">
                                                Reference:
                                            </span>
                                            <code className="text-xs">{reference}</code>
                                        </div>
                                    </div>
                                )}
                                <div className="flex gap-3 w-full">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => navigate('/wallet')}
                                    >
                                        <Home className="h-4 w-4 mr-2" />
                                        Go to Wallet
                                    </Button>
                                    <Button
                                        className="flex-1"
                                        onClick={() => navigate('/sms/units')}
                                    >
                                        Try Again
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="min-h-screen flex items-center justify-center p-6">
                <Card className="max-w-2xl w-full border-green-200">
                    <CardHeader className="text-center pb-6">
                        <div className="flex justify-center mb-4">
                            <div className="rounded-full bg-green-100 p-6">
                                <CheckCircle2 className="h-20 w-20 text-green-600" />
                            </div>
                        </div>
                        <CardTitle className="text-3xl text-green-600">
                            Payment Successful!
                        </CardTitle>
                        <CardDescription className="text-base">
                            Your payment has been processed and units have been added to your
                            wallet
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Transaction Summary */}
                        <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Receipt className="h-5 w-5" />
                                Transaction Details
                            </h3>
                            <Separator />

                            <div className="grid gap-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">
                                        Reference Number
                                    </span>
                                    <code className="text-sm bg-background px-3 py-1 rounded">
                                        {reference}
                                    </code>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Channel</span>
                                    <Badge variant="secondary" className="capitalize">
                                        {paymentData?.channel || 'N/A'}
                                    </Badge>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">
                                        Units Purchased
                                    </span>
                                    <span className="font-bold text-lg text-green-600">
                                        {paymentData?.units?.toLocaleString() || 0} units
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Amount Paid</span>
                                    <span className="font-bold text-lg">
                                        ₦{paymentData?.amount?.toLocaleString() || 0}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Date & Time
                                    </span>
                                    <span className="text-sm">
                                        {format(new Date(), 'PPpp')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Success Message */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex gap-3">
                                <Package className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="font-medium text-green-900">
                                        Units Added Successfully
                                    </p>
                                    <p className="text-sm text-green-700">
                                        {paymentData?.units?.toLocaleString() || 0} units have
                                        been credited to your {paymentData?.channel} balance.
                                        You can now start sending messages!
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                    window.print();
                                }}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Download Receipt
                            </Button>

                            <Button
                                className="flex-1"
                                onClick={() => {
                                    const channel = paymentData?.channel?.toLowerCase();
                                    if (channel === 'sms') {
                                        navigate('/sms/compose');
                                    } else if (channel === 'email') {
                                        navigate('/email/compose');
                                    } else if (channel === 'whatsapp') {
                                        navigate('/whatsapp/compose');
                                    } else {
                                        navigate('/wallet');
                                    }
                                }}
                            >
                                Start Messaging
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>

                        <div className="text-center pt-4">
                            <Button
                                variant="link"
                                onClick={() => navigate('/wallet')}
                                className="text-muted-foreground"
                            >
                                View Transaction History
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}