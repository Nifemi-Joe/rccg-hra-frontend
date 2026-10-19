// src/components/modals/MemberModal.tsx
import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
    FormDescription,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { membersApi, Member, CreateMemberDTO } from '@/lib/api';
import {
    Loader2,
    UserPlus,
    User,
    MapPin,
    Phone,
    Pencil,
    Heart,
    CalendarIcon
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const memberSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
    lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().optional(),
    gender: z.enum(['male', 'female', 'other']).optional().nullable(),
    maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']).optional().nullable(),
    dateOfBirth: z.date().optional().nullable(),
    weddingAnniversary: z.date().optional().nullable(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(['active', 'inactive', 'suspended']).optional(),
}).refine((data) => {
    // Wedding anniversary should only be set if marital status is married
    if (data.weddingAnniversary && data.maritalStatus !== 'married') {
        return false;
    }
    return true;
}, {
    message: "Wedding anniversary can only be set for married members",
    path: ["weddingAnniversary"],
});

type MemberFormData = z.infer<typeof memberSchema>;

interface MemberModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    member?: Member | null;
}

export function MemberModal({ open, onClose, onSuccess, member }: MemberModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('basic');
    const { toast } = useToast();

    const isEditing = !!member;

    const form = useForm<MemberFormData>({
        resolver: zodResolver(memberSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            gender: null,
            maritalStatus: null,
            dateOfBirth: null,
            weddingAnniversary: null,
            address: '',
            city: '',
            state: '',
            country: '',
            postalCode: '',
            notes: '',
            status: 'active',
        },
    });

    // Watch marital status to show/hide wedding anniversary field
    const maritalStatus = useWatch({
        control: form.control,
        name: 'maritalStatus',
    });

    const isMarried = maritalStatus === 'married';

    // Clear wedding anniversary when marital status changes from married
    useEffect(() => {
        if (!isMarried) {
            form.setValue('weddingAnniversary', null);
        }
    }, [isMarried, form]);

    // Populate form when editing
    useEffect(() => {
        if (member) {
            form.reset({
                firstName: member.first_name,
                lastName: member.last_name,
                email: member.email || '',
                phone: member.phone || '',
                gender: member.gender || null,
                maritalStatus: member.marital_status || null,
                dateOfBirth: member.date_of_birth ? parseISO(member.date_of_birth) : null,
                weddingAnniversary: member.wedding_anniversary ? parseISO(member.wedding_anniversary) : null,
                address: member.address || '',
                city: member.city || '',
                state: member.state || '',
                country: member.country || '',
                postalCode: member.postal_code || '',
                notes: member.notes || '',
                status: member.status || 'active',
            });
        } else {
            form.reset({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                gender: null,
                maritalStatus: null,
                dateOfBirth: null,
                weddingAnniversary: null,
                address: '',
                city: '',
                state: '',
                country: '',
                postalCode: '',
                notes: '',
                status: 'active',
            });
        }
        setActiveTab('basic');
    }, [member, form]);

    const onSubmit = async (data: MemberFormData) => {
        setIsLoading(true);
        try {
            const payload: CreateMemberDTO & { status?: string } = {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email || undefined,
                phone: data.phone || undefined,
                gender: data.gender || undefined,
                maritalStatus: data.maritalStatus || undefined,
                dateOfBirth: data.dateOfBirth ? format(data.dateOfBirth, 'yyyy-MM-dd') : undefined,
                weddingAnniversary: data.maritalStatus === 'married' && data.weddingAnniversary
                    ? format(data.weddingAnniversary, 'yyyy-MM-dd')
                    : undefined,
                address: data.address || undefined,
                city: data.city || undefined,
                state: data.state || undefined,
                country: data.country || undefined,
                postalCode: data.postalCode || undefined,
                notes: data.notes || undefined,
            };

            if (isEditing && member) {
                await membersApi.update(member.id, { ...payload, status: data.status } as any);
                toast({
                    title: 'Member updated',
                    description: `${data.firstName} ${data.lastName} has been updated successfully.`,
                });
            } else {
                await membersApi.create(payload);
                toast({
                    title: 'Member created',
                    description: `${data.firstName} ${data.lastName} has been added successfully.`,
                });
            }

            form.reset();
            setActiveTab('basic');
            onSuccess?.();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: isEditing ? 'Failed to update member' : 'Failed to create member',
                description: error.message || 'Something went wrong. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        form.reset();
        setActiveTab('basic');
        onClose();
    };

    // Calculate years married
    const getYearsMarried = (anniversaryDate: Date | null) => {
        if (!anniversaryDate) return null;
        const today = new Date();
        const years = today.getFullYear() - anniversaryDate.getFullYear();
        const monthDiff = today.getMonth() - anniversaryDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < anniversaryDate.getDate())) {
            return years - 1;
        }
        return years;
    };

    const weddingAnniversary = form.watch('weddingAnniversary');
    const yearsMarried = getYearsMarried(weddingAnniversary);

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center",
                            isEditing ? "bg-blue-500/10" : "bg-primary/10"
                        )}>
                            {isEditing ? (
                                <Pencil className="h-5 w-5 text-blue-600" />
                            ) : (
                                <UserPlus className="h-5 w-5 text-primary" />
                            )}
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-display">
                                {isEditing ? 'Edit Member' : 'Add New Member'}
                            </DialogTitle>
                            <DialogDescription>
                                {isEditing
                                    ? `Update information for ${member?.first_name} ${member?.last_name}`
                                    : 'Add a new member to your church directory'}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="basic" className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <span className="hidden sm:inline">Basic Info</span>
                                </TabsTrigger>
                                <TabsTrigger value="contact" className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    <span className="hidden sm:inline">Contact</span>
                                </TabsTrigger>
                                <TabsTrigger value="address" className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    <span className="hidden sm:inline">Address</span>
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="basic" className="space-y-4 mt-4">
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
                                        name="gender"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Gender</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value || undefined}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select gender" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="male">Male</SelectItem>
                                                        <SelectItem value="female">Female</SelectItem>
                                                        <SelectItem value="other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="maritalStatus"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Marital Status</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value || undefined}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select status" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="single">Single</SelectItem>
                                                        <SelectItem value="married">Married</SelectItem>
                                                        <SelectItem value="divorced">Divorced</SelectItem>
                                                        <SelectItem value="widowed">Widowed</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="dateOfBirth"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Date of Birth</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                'w-full pl-3 text-left font-normal',
                                                                !field.value && 'text-muted-foreground'
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, 'PPP')
                                                            ) : (
                                                                <span>Pick a date</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value || undefined}
                                                        onSelect={field.onChange}
                                                        disabled={(date) =>
                                                            date > new Date() || date < new Date('1900-01-01')
                                                        }
                                                        initialFocus
                                                        captionLayout="dropdown-buttons"
                                                        fromYear={1920}
                                                        toYear={new Date().getFullYear()}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Wedding Anniversary - Only shown when married */}
                                {isMarried && (
                                    <FormField
                                        control={form.control}
                                        name="weddingAnniversary"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel className="flex items-center gap-2">
                                                    <Heart className="h-4 w-4 text-pink-500" />
                                                    Wedding Anniversary
                                                </FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant="outline"
                                                                className={cn(
                                                                    'w-full pl-3 text-left font-normal',
                                                                    !field.value && 'text-muted-foreground'
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    <span className="flex items-center gap-2">
                                    {format(field.value, 'PPP')}
                                                                        {yearsMarried !== null && yearsMarried >= 0 && (
                                                                            <span className="text-xs text-muted-foreground">
                                        ({yearsMarried} {yearsMarried === 1 ? 'year' : 'years'})
                                      </span>
                                                                        )}
                                  </span>
                                                                ) : (
                                                                    <span>Pick wedding date</span>
                                                                )}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value || undefined}
                                                            onSelect={field.onChange}
                                                            disabled={(date) =>
                                                                date > new Date() || date < new Date('1900-01-01')
                                                            }
                                                            initialFocus
                                                            captionLayout="dropdown-buttons"
                                                            fromYear={1920}
                                                            toYear={new Date().getFullYear()}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormDescription>
                                                    The date of their wedding ceremony
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {isEditing && (
                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Status</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select status" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="active">Active</SelectItem>
                                                        <SelectItem value="inactive">Inactive</SelectItem>
                                                        <SelectItem value="suspended">Suspended</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </TabsContent>

                            <TabsContent value="contact" className="space-y-4 mt-4">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email Address</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="john.doe@example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone Number</FormLabel>
                                            <FormControl>
                                                <Input type="tel" placeholder="+1 (555) 123-4567" {...field} />
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
                                                    placeholder="Any additional notes about this member..."
                                                    className="resize-none"
                                                    rows={3}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </TabsContent>

                            <TabsContent value="address" className="space-y-4 mt-4">
                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Street Address</FormLabel>
                                            <FormControl>
                                                <Input placeholder="123 Main Street" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="city"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>City</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="New York" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="state"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>State/Province</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="NY" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="country"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Country</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="United States" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="postalCode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Postal Code</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="10001" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>

                        <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {isEditing ? 'Updating...' : 'Creating...'}
                                    </>
                                ) : isEditing ? (
                                    <>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Update Member
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Add Member
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