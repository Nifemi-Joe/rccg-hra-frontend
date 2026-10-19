// src/components/modals/EventModal.tsx
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
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Event, CreateEventDTO, eventsApi } from '@/lib/api';
import {
    Loader2,
    Calendar,
    MapPin,
    Video,
    DollarSign,
    Settings,
    Pencil,
    Image,
    Users,
    Globe,
    Ticket,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const eventTypes = [
    { value: 'service', label: 'Service', icon: '⛪' },
    { value: 'meeting', label: 'Meeting', icon: '👥' },
    { value: 'conference', label: 'Conference', icon: '🎤' },
    { value: 'outreach', label: 'Outreach', icon: '🤝' },
    { value: 'fellowship', label: 'Fellowship', icon: '🎉' },
    { value: 'workshop', label: 'Workshop', icon: '📚' },
    { value: 'retreat', label: 'Retreat', icon: '🏕️' },
    { value: 'concert', label: 'Concert', icon: '🎵' },
    { value: 'other', label: 'Other', icon: '📅' },
];

const recurrenceOptions = [
    { value: 'none', label: 'One-time Event' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Bi-weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
];

const locationTypes = [
    { value: 'physical', label: 'In-Person', icon: MapPin },
    { value: 'online', label: 'Online', icon: Video },
    { value: 'hybrid', label: 'Hybrid', icon: Globe },
];

const onlinePlatforms = [
    { value: 'zoom', label: 'Zoom', icon: '📹' },
    { value: 'google_meet', label: 'Google Meet', icon: '🎥' },
    { value: 'microsoft_teams', label: 'Microsoft Teams', icon: '💼' },
    { value: 'youtube', label: 'YouTube Live', icon: '▶️' },
    { value: 'facebook', label: 'Facebook Live', icon: '📘' },
    { value: 'other', label: 'Other', icon: '🔗' },
];

// Updated schema with all fields
const eventSchema = z.object({
    // Required fields
    name: z.string().min(2, 'Name must be at least 2 characters').max(200),
    eventType: z.enum(['service', 'meeting', 'conference', 'outreach', 'fellowship', 'workshop', 'retreat', 'concert', 'other']),
    startDate: z.string().min(1, 'Start date is required'),
    startTime: z.string().min(1, 'Start time is required'),

    // Optional fields
    description: z.string().max(5000).optional().or(z.literal('')),
    recurrence: z.enum(['none', 'daily', 'weekly', 'biweekly', 'monthly', 'yearly']).default('none'),
    endDate: z.string().optional().or(z.literal('')),
    endTime: z.string().optional().or(z.literal('')),
    timezone: z.string().optional().or(z.literal('')),

    // Location
    locationType: z.enum(['physical', 'online', 'hybrid']).default('physical'),
    locationName: z.string().max(255).optional().or(z.literal('')),
    locationAddress: z.string().max(500).optional().or(z.literal('')),
    locationCity: z.string().max(100).optional().or(z.literal('')),
    locationMapUrl: z.string().url().optional().or(z.literal('')),

    // Online
    onlinePlatform: z.enum(['zoom', 'google_meet', 'microsoft_teams', 'youtube', 'facebook', 'other']).optional(),
    meetingLink: z.string().optional().or(z.literal('')),
    meetingId: z.string().optional().or(z.literal('')),
    meetingPassword: z.string().optional().or(z.literal('')),
    streamUrl: z.string().optional().or(z.literal('')),

    // Capacity & Registration
    capacity: z.number().min(1).max(100000).optional().nullable(),
    isRegistrationRequired: z.boolean().default(false),
    registrationDeadline: z.string().optional().or(z.literal('')),
    maxRegistrations: z.number().min(1).optional().nullable(),

    // Payment
    isPaid: z.boolean().default(false),
    price: z.number().min(0).optional().nullable(),
    currency: z.string().default('GHS'),
    earlyBirdPrice: z.number().min(0).optional().nullable(),
    earlyBirdDeadline: z.string().optional().or(z.literal('')),

    // Visuals
    bannerUrl: z.string().optional().or(z.literal('')),
    thumbnailUrl: z.string().optional().or(z.literal('')),

    // Settings
    isActive: z.boolean().default(true),
    isPublic: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
    allowSelfCheckin: z.boolean().default(true),
    allowGuestCheckin: z.boolean().default(true),
    requireApproval: z.boolean().default(false),
    sendReminders: z.boolean().default(true),
    reminderHours: z.number().min(1).max(168).default(24),

    // Relations
    groupId: z.string().optional().or(z.literal('')),
    tags: z.array(z.string()).optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    event?: Event | null;
}

export function EventModal({ open, onClose, onSuccess, event }: EventModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('basic');
    const { toast } = useToast();

    const isEditing = !!event;

    const form = useForm<EventFormData>({
        resolver: zodResolver(eventSchema),
        defaultValues: {
            name: '',
            description: '',
            eventType: 'service',
            recurrence: 'none',
            startDate: '',
            endDate: '',
            startTime: '',
            endTime: '',
            timezone: '',
            locationType: 'physical',
            locationName: '',
            locationAddress: '',
            locationCity: '',
            locationMapUrl: '',
            onlinePlatform: undefined,
            meetingLink: '',
            meetingId: '',
            meetingPassword: '',
            streamUrl: '',
            capacity: null,
            isRegistrationRequired: false,
            registrationDeadline: '',
            maxRegistrations: null,
            isPaid: false,
            price: null,
            currency: 'GHS',
            earlyBirdPrice: null,
            earlyBirdDeadline: '',
            bannerUrl: '',
            thumbnailUrl: '',
            isActive: true,
            isPublic: true,
            isFeatured: false,
            allowSelfCheckin: true,
            allowGuestCheckin: true,
            requireApproval: false,
            sendReminders: true,
            reminderHours: 24,
            groupId: '',
            tags: [],
        },
    });

    const locationType = useWatch({ control: form.control, name: 'locationType' });
    const isPaid = useWatch({ control: form.control, name: 'isPaid' });
    const isRegistrationRequired = useWatch({ control: form.control, name: 'isRegistrationRequired' });
    const onlinePlatform = useWatch({ control: form.control, name: 'onlinePlatform' });

    const showPhysicalFields = locationType === 'physical' || locationType === 'hybrid';
    const showOnlineFields = locationType === 'online' || locationType === 'hybrid';

    // Populate form when editing
    useEffect(() => {
        if (event) {
            form.reset({
                name: event.name,
                description: event.description || '',
                eventType: event.eventType,
                recurrence: event.recurrence,
                startDate: event.startDate ? new Date(event.startDate).toISOString().split('T')[0] : '',
                endDate: event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '',
                startTime: event.startTime || '',
                endTime: event.endTime || '',
                timezone: event.timezone || '',
                locationType: event.locationType,
                locationName: event.locationName || '',
                locationAddress: event.locationAddress || '',
                locationCity: event.locationCity || '',
                locationMapUrl: event.locationMapUrl || '',
                onlinePlatform: event.onlinePlatform,
                meetingLink: event.meetingLink || '',
                meetingId: event.meetingId || '',
                meetingPassword: event.meetingPassword || '',
                streamUrl: event.streamUrl || '',
                capacity: event.capacity || null,
                isRegistrationRequired: event.isRegistrationRequired,
                registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline).toISOString().split('T')[0] : '',
                maxRegistrations: event.maxRegistrations || null,
                isPaid: event.isPaid,
                price: event.price || null,
                currency: event.currency || 'GHS',
                earlyBirdPrice: event.earlyBirdPrice || null,
                earlyBirdDeadline: event.earlyBirdDeadline ? new Date(event.earlyBirdDeadline).toISOString().split('T')[0] : '',
                bannerUrl: event.bannerUrl || '',
                thumbnailUrl: event.thumbnailUrl || '',
                isActive: event.isActive,
                isPublic: event.isPublic,
                isFeatured: event.isFeatured,
                allowSelfCheckin: event.allowSelfCheckin,
                allowGuestCheckin: event.allowGuestCheckin,
                requireApproval: event.requireApproval,
                sendReminders: event.sendReminders,
                reminderHours: event.reminderHours || 24,
                groupId: event.groupId || '',
                tags: event.tags || [],
            });
        } else {
            form.reset({
                name: '',
                description: '',
                eventType: 'service',
                recurrence: 'none',
                startDate: '',
                endDate: '',
                startTime: '',
                endTime: '',
                timezone: '',
                locationType: 'physical',
                locationName: '',
                locationAddress: '',
                locationCity: '',
                locationMapUrl: '',
                onlinePlatform: undefined,
                meetingLink: '',
                meetingId: '',
                meetingPassword: '',
                streamUrl: '',
                capacity: null,
                isRegistrationRequired: false,
                registrationDeadline: '',
                maxRegistrations: null,
                isPaid: false,
                price: null,
                currency: 'GHS',
                earlyBirdPrice: null,
                earlyBirdDeadline: '',
                bannerUrl: '',
                thumbnailUrl: '',
                isActive: true,
                isPublic: true,
                isFeatured: false,
                allowSelfCheckin: true,
                allowGuestCheckin: true,
                requireApproval: false,
                sendReminders: true,
                reminderHours: 24,
                groupId: '',
                tags: [],
            });
        }
        setActiveTab('basic');
    }, [event, form, open]);

    const onSubmit = async (data: EventFormData) => {
        setIsLoading(true);
        try {
            // Helper function to convert empty strings to undefined
            const emptyToUndefined = (value: string | undefined | null): string | undefined => {
                if (value === '' || value === null || value === undefined) {
                    return undefined;
                }
                return value;
            };

            // Build the DTO with required fields explicitly set
            const cleanedData: CreateEventDTO = {
                // Required fields
                name: data.name,
                eventType: data.eventType,
                startDate: data.startDate,
                startTime: data.startTime,

                // Optional string fields - convert empty strings to undefined
                description: emptyToUndefined(data.description),
                recurrence: data.recurrence,
                endDate: emptyToUndefined(data.endDate),
                endTime: emptyToUndefined(data.endTime),
                timezone: emptyToUndefined(data.timezone),

                // Location
                locationType: data.locationType,
                locationName: emptyToUndefined(data.locationName),
                locationAddress: emptyToUndefined(data.locationAddress),
                locationCity: emptyToUndefined(data.locationCity),
                locationMapUrl: emptyToUndefined(data.locationMapUrl),

                // Online meeting
                onlinePlatform: data.onlinePlatform,
                meetingLink: emptyToUndefined(data.meetingLink),
                meetingId: emptyToUndefined(data.meetingId),
                meetingPassword: emptyToUndefined(data.meetingPassword),
                streamUrl: emptyToUndefined(data.streamUrl),

                // Capacity & Registration
                capacity: data.capacity || undefined,
                isRegistrationRequired: data.isRegistrationRequired,
                registrationDeadline: emptyToUndefined(data.registrationDeadline),
                maxRegistrations: data.maxRegistrations || undefined,

                // Payment
                isPaid: data.isPaid,
                price: data.isPaid ? (data.price || undefined) : undefined,
                currency: data.currency,
                earlyBirdPrice: data.isPaid ? (data.earlyBirdPrice || undefined) : undefined,
                earlyBirdDeadline: data.isPaid ? emptyToUndefined(data.earlyBirdDeadline) : undefined,

                // Visuals
                bannerUrl: emptyToUndefined(data.bannerUrl),
                thumbnailUrl: emptyToUndefined(data.thumbnailUrl),

                // Settings
                isActive: data.isActive,
                isPublic: data.isPublic,
                isFeatured: data.isFeatured,
                allowSelfCheckin: data.allowSelfCheckin,
                allowGuestCheckin: data.allowGuestCheckin,
                requireApproval: data.requireApproval,
                sendReminders: data.sendReminders,
                reminderHours: data.reminderHours,

                // Relations
                groupId: emptyToUndefined(data.groupId),
                tags: data.tags && data.tags.length > 0 ? data.tags : undefined,
            };

            if (isEditing && event) {
                await eventsApi.update(event.id, cleanedData);
                toast({
                    title: 'Event updated',
                    description: `${data.name} has been updated successfully.`,
                });
            } else {
                await eventsApi.create(cleanedData);
                toast({
                    title: 'Event created',
                    description: `${data.name} has been created successfully.`,
                });
            }

            form.reset();
            setActiveTab('basic');
            onSuccess?.();
            onClose();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: isEditing ? 'Failed to update event' : 'Failed to create event',
                description: error.message || 'Something went wrong.',
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

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center",
                            isEditing ? "bg-blue-500/10" : "bg-primary/10"
                        )}>
                            {isEditing ? (
                                <Pencil className="h-5 w-5 text-blue-600" />
                            ) : (
                                <Calendar className="h-5 w-5 text-primary" />
                            )}
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-display">
                                {isEditing ? 'Edit Event' : 'Create New Event'}
                            </DialogTitle>
                            <DialogDescription>
                                {isEditing
                                    ? `Update settings for ${event?.name}`
                                    : 'Set up a new event for your church community'}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-5">
                                <TabsTrigger value="basic" className="gap-1 text-xs sm:text-sm">
                                    <Calendar className="h-4 w-4" />
                                    <span className="hidden sm:inline">Basic</span>
                                </TabsTrigger>
                                <TabsTrigger value="location" className="gap-1 text-xs sm:text-sm">
                                    <MapPin className="h-4 w-4" />
                                    <span className="hidden sm:inline">Location</span>
                                </TabsTrigger>
                                <TabsTrigger value="registration" className="gap-1 text-xs sm:text-sm">
                                    <Users className="h-4 w-4" />
                                    <span className="hidden sm:inline">Registration</span>
                                </TabsTrigger>
                                <TabsTrigger value="payment" className="gap-1 text-xs sm:text-sm">
                                    <DollarSign className="h-4 w-4" />
                                    <span className="hidden sm:inline">Payment</span>
                                </TabsTrigger>
                                <TabsTrigger value="settings" className="gap-1 text-xs sm:text-sm">
                                    <Settings className="h-4 w-4" />
                                    <span className="hidden sm:inline">Settings</span>
                                </TabsTrigger>
                            </TabsList>

                            {/* Basic Info Tab */}
                            <TabsContent value="basic" className="space-y-4 mt-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Event Name *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Sunday Worship Service" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Describe your event..."
                                                    className="resize-none"
                                                    rows={3}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="eventType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Event Type *</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select type" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {eventTypes.map((type) => (
                                                            <SelectItem key={type.value} value={type.value}>
                                                                <span className="flex items-center gap-2">
                                                                    <span>{type.icon}</span>
                                                                    {type.label}
                                                                </span>
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
                                        name="recurrence"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Recurrence</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {recurrenceOptions.map((option) => (
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
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="startDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Start Date *</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="endDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>End Date</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="startTime"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Start Time *</FormLabel>
                                                <FormControl>
                                                    <Input type="time" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="endTime"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>End Time</FormLabel>
                                                <FormControl>
                                                    <Input type="time" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="bannerUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Event Banner URL</FormLabel>
                                            <div className="flex gap-2">
                                                <FormControl>
                                                    <Input placeholder="https://example.com/banner.jpg" {...field} />
                                                </FormControl>
                                                <Button type="button" variant="outline" size="icon">
                                                    <Image className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </TabsContent>

                            {/* Location Tab */}
                            <TabsContent value="location" className="space-y-4 mt-4">
                                <FormField
                                    control={form.control}
                                    name="locationType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Location Type</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {locationTypes.map((type) => (
                                                        <SelectItem key={type.value} value={type.value}>
                                                            <span className="flex items-center gap-2">
                                                                <type.icon className="h-4 w-4" />
                                                                {type.label}
                                                            </span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Physical Location Fields */}
                                {showPhysicalFields && (
                                    <>
                                        <Separator />
                                        <h4 className="text-sm font-medium flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            Physical Location
                                        </h4>

                                        <FormField
                                            control={form.control}
                                            name="locationName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Venue Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Main Sanctuary" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="locationAddress"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Address</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="123 Church Street" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="locationCity"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>City</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Accra" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="locationMapUrl"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Google Maps URL</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="https://maps.google.com/..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </>
                                )}

                                {/* Online Meeting Fields */}
                                {showOnlineFields && (
                                    <>
                                        <Separator />
                                        <h4 className="text-sm font-medium flex items-center gap-2">
                                            <Video className="h-4 w-4" />
                                            Online Meeting
                                        </h4>

                                        <FormField
                                            control={form.control}
                                            name="onlinePlatform"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Platform</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select platform" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {onlinePlatforms.map((platform) => (
                                                                <SelectItem key={platform.value} value={platform.value}>
                                                                    <span className="flex items-center gap-2">
                                                                        <span>{platform.icon}</span>
                                                                        {platform.label}
                                                                    </span>
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
                                            name="meetingLink"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Meeting Link</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="https://zoom.us/j/..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {(onlinePlatform === 'zoom' || onlinePlatform === 'microsoft_teams') && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="meetingId"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Meeting ID</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="123 456 7890" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="meetingPassword"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Password</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Optional passcode" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        )}

                                        {(onlinePlatform === 'youtube' || onlinePlatform === 'facebook') && (
                                            <FormField
                                                control={form.control}
                                                name="streamUrl"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Stream URL</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="https://youtube.com/live/..." {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                    </>
                                )}
                            </TabsContent>

                            {/* Registration Tab */}
                            <TabsContent value="registration" className="space-y-4 mt-4">
                                <FormField
                                    control={form.control}
                                    name="capacity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Capacity</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="Unlimited"
                                                    value={field.value ?? ''}
                                                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Maximum number of attendees. Leave empty for unlimited.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="isRegistrationRequired"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Require Registration</FormLabel>
                                                <FormDescription>
                                                    Attendees must register before the event
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                {isRegistrationRequired && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="registrationDeadline"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Registration Deadline</FormLabel>
                                                        <FormControl>
                                                            <Input type="date" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="maxRegistrations"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Max Registrations</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                placeholder="Unlimited"
                                                                value={field.value ?? ''}
                                                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="requireApproval"
                                            render={({ field }) => (
                                                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-base">Require Approval</FormLabel>
                                                        <FormDescription>
                                                            Registrations must be manually approved
                                                        </FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </>
                                )}
                            </TabsContent>

                            {/* Payment Tab */}
                            <TabsContent value="payment" className="space-y-4 mt-4">
                                <FormField
                                    control={form.control}
                                    name="isPaid"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base flex items-center gap-2">
                                                    <Ticket className="h-4 w-4" />
                                                    Paid Event
                                                </FormLabel>
                                                <FormDescription>
                                                    Require payment for registration
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                {isPaid && (
                                    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="price"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Price *</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                placeholder="0.00"
                                                                value={field.value ?? ''}
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="currency"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Currency</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="GHS">GHS (Ghana Cedis)</SelectItem>
                                                                <SelectItem value="USD">USD (US Dollars)</SelectItem>
                                                                <SelectItem value="EUR">EUR (Euros)</SelectItem>
                                                                <SelectItem value="GBP">GBP (British Pounds)</SelectItem>
                                                                <SelectItem value="NGN">NGN (Nigerian Naira)</SelectItem>
                                                                <SelectItem value="KES">KES (Kenyan Shilling)</SelectItem>
                                                                <SelectItem value="ZAR">ZAR (South African Rand)</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <Separator />

                                        <h5 className="text-sm font-medium">Early Bird Pricing (Optional)</h5>

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="earlyBirdPrice"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Early Bird Price</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                placeholder="Discounted price"
                                                                value={field.value ?? ''}
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="earlyBirdDeadline"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Early Bird Deadline</FormLabel>
                                                        <FormControl>
                                                            <Input type="date" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            {/* Settings Tab */}
                            <TabsContent value="settings" className="space-y-4 mt-4">
                                <div className="grid grid-cols-1 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="isPublic"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Public Event</FormLabel>
                                                    <FormDescription>
                                                        Event is visible to everyone
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="isFeatured"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Featured Event</FormLabel>
                                                    <FormDescription>
                                                        Highlight this event on the homepage
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="allowSelfCheckin"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Allow Self Check-in</FormLabel>
                                                    <FormDescription>
                                                        Attendees can scan QR code to check themselves in
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="allowGuestCheckin"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Allow Guest Check-in</FormLabel>
                                                    <FormDescription>
                                                        First-time visitors can check in without registration
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="sendReminders"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Send Reminders</FormLabel>
                                                    <FormDescription>
                                                        Send reminder notifications before the event
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    {isEditing && (
                                        <FormField
                                            control={form.control}
                                            name="isActive"
                                            render={({ field }) => (
                                                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-base">Active Event</FormLabel>
                                                        <FormDescription>
                                                            Inactive events are hidden from public view
                                                        </FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    )}
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
                                        Update Event
                                    </>
                                ) : (
                                    <>
                                        <Calendar className="mr-2 h-4 w-4" />
                                        Create Event
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