// src/components/modals/OfferingModal.tsx

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/useCurrency';
import { Loader2, HandCoins, Wallet } from 'lucide-react';

const offeringTypes = [
    { value: 'tithe', label: 'Tithe' },
    { value: 'offering', label: 'General Offering' },
    { value: 'thanksgiving', label: 'Thanksgiving' },
    { value: 'special_offering', label: 'Special Offering' },
    { value: 'building_fund', label: 'Building Fund' },
    { value: 'missions', label: 'Missions' },
    { value: 'welfare', label: 'Welfare' },
    { value: 'pledge', label: 'Pledge Payment' },
    { value: 'first_fruit', label: 'First Fruit' },
    { value: 'other', label: 'Other' },
];

const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'mobile_money', label: 'Mobile Money' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'card', label: 'Card Payment' },
    { value: 'online', label: 'Online Payment' },
];

const offeringSchema = z.object({
    amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: 'Amount must be a positive number',
    }),
    type: z.string().min(1, 'Please select offering type'),
    date: z.string().min(1, 'Please select a date'),
    paymentMethod: z.string().min(1, 'Please select payment method'),
    giverName: z.string().max(100).optional(),
    giverPhone: z.string().max(20).optional(),
    giverEmail: z.string().email().optional().or(z.literal('')),
    isAnonymous: z.boolean().default(false),
    reference: z.string().max(50).optional(),
    notes: z.string().max(500).optional(),
});

type OfferingFormData = z.infer<typeof offeringSchema>;

interface OfferingModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    offering?: any;
}

export function OfferingModal({ open, onClose, onSuccess, offering }: OfferingModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { currencySymbol } = useCurrency();
    const isEditing = !!offering;

    const form = useForm<OfferingFormData>({
        resolver: zodResolver(offeringSchema),
        defaultValues: {
            amount: '',
            type: '',
            date: new Date().toISOString().split('T')[0],
            paymentMethod: 'cash',
            giverName: '',
            giverPhone: '',
            giverEmail: '',
            isAnonymous: false,
            reference: '',
            notes: '',
        },
    });

    const isAnonymous = form.watch('isAnonymous');

    useEffect(() => {
        if (offering) {
            form.reset({
                amount: offering.amount?.toString() || '',
                type: offering.type || '',
                date: offering.date ? new Date(offering.date).toISOString().split('T')[0] : '',
                paymentMethod: offering.paymentMethod || 'cash',
                giverName: offering.giverName || '',
                giverPhone: offering.giverPhone || '',
                giverEmail: offering.giverEmail || '',
                isAnonymous: offering.isAnonymous || false,
                reference: offering.reference || '',
                notes: offering.notes || '',
            });
        } else {
            form.reset({
                amount: '',
                type: '',
                date: new Date().toISOString().split('T')[0],
                paymentMethod: 'cash',
                giverName: '',
                giverPhone: '',
                giverEmail: '',
                isAnonymous: false,
                reference: '',
                notes: '',
            });
        }
    }, [offering, form, open]);

    const onSubmit = async (data: OfferingFormData) => {
        setIsLoading(true);
        try {
            const payload = {
                ...data,
                amount: parseFloat(data.amount),
            };

            const response = await fetch(
                isEditing ? `/api/v1/offerings/${offering.id}` : '/api/v1/offerings',
                {
                    method: isEditing ? 'PUT' : 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    },
                    body: JSON.stringify(payload),
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save offering');
            }

            toast({
                title: isEditing ? 'Offering updated' : 'Offering recorded',
                description: `${currencySymbol}${data.amount} ${data.type} has been recorded.`,
            });

            form.reset();
            onSuccess?.();
            onClose();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Something went wrong',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        form.reset();
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <HandCoins className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-display">
                                {isEditing ? 'Edit Offering' : 'Record New Offering'}
                            </DialogTitle>
                            <DialogDescription>
                                {isEditing ? 'Update offering details' : 'Record tithes, offerings, and donations'}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Amount ({currencySymbol}) *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Offering Type *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {offeringTypes.map((type) => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Date *</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="paymentMethod"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Payment Method *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select method" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {paymentMethods.map((method) => (
                                                    <SelectItem key={method.value} value={method.value}>
                                                        {method.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="isAnonymous"
                            render={({ field }) => (
                                <FormItem className="flex items-center space-x-3 space-y-0 rounded-lg border p-3">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                        Anonymous donation
                                    </FormLabel>
                                </FormItem>
                            )}
                        />

                        {!isAnonymous && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="giverName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Giver Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="John Doe" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="giverPhone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="+233 XX XXX XXXX" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="giverEmail"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input type="email" placeholder="john@example.com" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </>
                        )}

                        <FormField
                            control={form.control}
                            name="reference"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reference/Receipt Number</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., REF-001" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Additional notes..."
                                            className="resize-none"
                                            rows={2}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Wallet className="mr-2 h-4 w-4" />
                                        {isEditing ? 'Update Offering' : 'Record Offering'}
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}