// src/components/modals/FirstTimerModal.tsx

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
import { firstTimersApi } from '@/lib/api';
import { Loader2, UserCheck, Star } from 'lucide-react';

const howDidYouHearOptions = [
    { value: 'friend', label: 'Friend/Family Member' },
    { value: 'social_media', label: 'Social Media' },
    { value: 'website', label: 'Church Website' },
    { value: 'drive_by', label: 'Drove/Walked By' },
    { value: 'event', label: 'Church Event' },
    { value: 'flyer', label: 'Flyer/Poster' },
    { value: 'online_search', label: 'Online Search' },
    { value: 'other', label: 'Other' },
];

const firstTimerSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
    lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().min(10, 'Please enter a valid phone number').max(20),
    gender: z.enum(['male', 'female', '']).optional(),
    address: z.string().max(200).optional(),
    visitDate: z.string().min(1, 'Please select visit date'),
    howDidYouHear: z.string().optional(),
    prayerRequest: z.string().max(500).optional(),
    wantsFollowUp: z.boolean().default(true),
    interestedInMembership: z.boolean().default(false),
    notes: z.string().max(500).optional(),
});

type FirstTimerFormData = z.infer<typeof firstTimerSchema>;

interface FirstTimerModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    firstTimer?: any;
}

export function FirstTimerModal({ open, onClose, onSuccess, firstTimer }: FirstTimerModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const isEditing = !!firstTimer;

    const form = useForm<FirstTimerFormData>({
        resolver: zodResolver(firstTimerSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            gender: '',
            address: '',
            visitDate: new Date().toISOString().split('T')[0],
            howDidYouHear: '',
            prayerRequest: '',
            wantsFollowUp: true,
            interestedInMembership: false,
            notes: '',
        },
    });

    useEffect(() => {
        if (firstTimer) {
            form.reset({
                firstName: firstTimer.first_name || '',
                lastName: firstTimer.last_name || '',
                email: firstTimer.email || '',
                phone: firstTimer.phone || '',
                gender: firstTimer.gender || '',
                address: firstTimer.address || '',
                visitDate: firstTimer.first_visit_date ? new Date(firstTimer.first_visit_date).toISOString().split('T')[0] : '',
                howDidYouHear: firstTimer.how_did_you_hear || '',
                prayerRequest: firstTimer.prayer_request || '',
                wantsFollowUp: firstTimer.wants_follow_up ?? true,
                interestedInMembership: firstTimer.interested_in_membership ?? false,
                notes: firstTimer.notes || '',
            });
        } else {
            form.reset({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                gender: '',
                address: '',
                visitDate: new Date().toISOString().split('T')[0],
                howDidYouHear: '',
                prayerRequest: '',
                wantsFollowUp: true,
                interestedInMembership: false,
                notes: '',
            });
        }
    }, [firstTimer, form, open]);

    const onSubmit = async (data: FirstTimerFormData) => {
        setIsLoading(true);
        try {
            const payload = {
                first_name: data.firstName,
                last_name: data.lastName,
                email: data.email || null,
                phone: data.phone,
                gender: data.gender || null,
                address: data.address || null,
                first_visit_date: data.visitDate,
                how_did_you_hear: data.howDidYouHear || null,
                prayer_request: data.prayerRequest || null,
                wants_follow_up: data.wantsFollowUp,
                interested_in_membership: data.interestedInMembership,
                notes: data.notes || null,
            };

            if (isEditing) {
                await firstTimersApi.update(firstTimer.id, payload);
            } else {
                await firstTimersApi.create(payload);
            }

            toast({
                title: isEditing ? 'First timer updated' : 'First timer registered',
                description: `${data.firstName} ${data.lastName} has been ${isEditing ? 'updated' : 'registered'} successfully.`,
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
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                            <UserCheck className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-display">
                                {isEditing ? 'Edit First Timer' : 'Register First Timer'}
                            </DialogTitle>
                            <DialogDescription>
                                {isEditing ? 'Update visitor information' : 'Register a first-time visitor'}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>First Name *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Last Name *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Doe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone Number *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+233 XX XXX XXXX" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="email"
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

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="gender"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Gender</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select gender" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="male">Male</SelectItem>
                                                <SelectItem value="female">Female</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="visitDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Visit Date *</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <Input placeholder="123 Main Street, Accra" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="howDidYouHear"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>How did you hear about us?</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select an option" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {howDidYouHearOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
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
                            name="prayerRequest"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <Star className="h-4 w-4 text-yellow-500" />
                                        Prayer Request
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Any prayer requests..."
                                            className="resize-none"
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-3">
                            <FormField
                                control={form.control}
                                name="wantsFollowUp"
                                render={({ field }) => (
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                            Would like a follow-up contact
                                        </FormLabel>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="interestedInMembership"
                                render={({ field }) => (
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                            Interested in becoming a member
                                        </FormLabel>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Additional Notes</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Any other notes..."
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
                                        <UserCheck className="mr-2 h-4 w-4" />
                                        {isEditing ? 'Update' : 'Register'}
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