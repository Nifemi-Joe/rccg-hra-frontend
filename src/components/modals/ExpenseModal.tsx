// src/components/modals/ExpenseModal.tsx

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
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/useCurrency';
import { Loader2, DollarSign, Receipt } from 'lucide-react';

const expenseCategories = [
    { value: 'utilities', label: 'Utilities' },
    { value: 'maintenance', label: 'Maintenance & Repairs' },
    { value: 'salaries', label: 'Salaries & Wages' },
    { value: 'supplies', label: 'Office Supplies' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'events', label: 'Events & Programs' },
    { value: 'outreach', label: 'Outreach & Missions' },
    { value: 'transport', label: 'Transportation' },
    { value: 'communication', label: 'Communication' },
    { value: 'other', label: 'Other' },
];

const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'mobile_money', label: 'Mobile Money' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'card', label: 'Card Payment' },
];

const expenseSchema = z.object({
    description: z.string().min(3, 'Description must be at least 3 characters').max(200),
    amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: 'Amount must be a positive number',
    }),
    category: z.string().min(1, 'Please select a category'),
    date: z.string().min(1, 'Please select a date'),
    paymentMethod: z.string().min(1, 'Please select a payment method'),
    vendor: z.string().max(100).optional(),
    receiptNumber: z.string().max(50).optional(),
    notes: z.string().max(500).optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    expense?: any;
}

export function ExpenseModal({ open, onClose, onSuccess, expense }: ExpenseModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { currencySymbol } = useCurrency();
    const isEditing = !!expense;

    const form = useForm<ExpenseFormData>({
        resolver: zodResolver(expenseSchema),
        defaultValues: {
            description: '',
            amount: '',
            category: '',
            date: new Date().toISOString().split('T')[0],
            paymentMethod: '',
            vendor: '',
            receiptNumber: '',
            notes: '',
        },
    });

    useEffect(() => {
        if (expense) {
            form.reset({
                description: expense.description || '',
                amount: expense.amount?.toString() || '',
                category: expense.category || '',
                date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : '',
                paymentMethod: expense.paymentMethod || '',
                vendor: expense.vendor || '',
                receiptNumber: expense.receiptNumber || '',
                notes: expense.notes || '',
            });
        } else {
            form.reset({
                description: '',
                amount: '',
                category: '',
                date: new Date().toISOString().split('T')[0],
                paymentMethod: '',
                vendor: '',
                receiptNumber: '',
                notes: '',
            });
        }
    }, [expense, form, open]);

    const onSubmit = async (data: ExpenseFormData) => {
        setIsLoading(true);
        try {
            const payload = {
                ...data,
                amount: parseFloat(data.amount),
            };

            const response = await fetch(
                isEditing ? `/api/v1/expenses/${expense.id}` : '/api/v1/expenses',
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
                throw new Error(error.message || 'Failed to save expense');
            }

            toast({
                title: isEditing ? 'Expense updated' : 'Expense recorded',
                description: `${data.description} - ${currencySymbol}${data.amount}`,
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
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-display">
                                {isEditing ? 'Edit Expense' : 'Record New Expense'}
                            </DialogTitle>
                            <DialogDescription>
                                {isEditing ? 'Update expense details' : 'Add a new expense record'}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Electricity bill payment" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {expenseCategories.map((cat) => (
                                                    <SelectItem key={cat.value} value={cat.value}>
                                                        {cat.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="vendor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vendor/Payee</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., ECG" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="receiptNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Receipt Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., REC-001" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

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
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="gap-2 sm:gap-0 pt-4">
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
                                        <Receipt className="mr-2 h-4 w-4" />
                                        {isEditing ? 'Update Expense' : 'Record Expense'}
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