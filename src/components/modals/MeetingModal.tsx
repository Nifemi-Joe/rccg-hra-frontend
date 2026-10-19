// src/components/modals/MeetingModal.tsx
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
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { groupsApi, Group, GroupMeeting } from '@/lib/api';
import {
    Loader2,
    Calendar as CalendarIcon,
    MapPin,
    Video,
    Clock,
    Pencil,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const meetingSchema = z.object({
    groupId: z.string().min(1, 'Please select a group'),
    title: z.string().min(2, 'Title must be at least 2 characters').max(200),
    description: z.string().max(2000).optional(),
    meetingDate: z.date({ required_error: 'Please select a date' }),
    startTime: z.string().min(1, 'Please enter start time'),
    endTime: z.string().optional(),
    meetingType: z.enum(['physical', 'online', 'hybrid']),

    // Physical
    locationType: z.enum(['church', 'custom']).optional(),
    locationAddress: z.string().optional(),
    locationCity: z.string().optional(),
    locationNotes: z.string().optional(),

    // Online
    onlinePlatform: z.enum(['zoom', 'google_meet', 'microsoft_teams', 'other']).optional(),
    meetingLink: z.string().url().optional().or(z.literal('')),
    meetingId: z.string().optional(),
    meetingPasscode: z.string().optional(),
    hostName: z.string().optional(),
    dialInNumber: z.string().optional(),
    additionalInstructions: z.string().optional(),
});

type MeetingFormData = z.infer<typeof meetingSchema>;

interface MeetingModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    group?: Group | null;
    meeting?: GroupMeeting | null;
    groups: Group[];
}

const platforms = [
    { value: 'zoom', label: 'Zoom', icon: '📹' },
    { value: 'google_meet', label: 'Google Meet', icon: '🎥' },
    { value: 'microsoft_teams', label: 'Microsoft Teams', icon: '💼' },
    { value: 'other', label: 'Other', icon: '🔗' },
];

export function MeetingModal({ open, onClose, onSuccess, group, meeting, groups }: MeetingModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const isEditing = !!meeting;

    const form = useForm<MeetingFormData>({
        resolver: zodResolver(meetingSchema),
        defaultValues: {
            groupId: group?.id || '',
            title: '',
            description: '',
            meetingDate: new Date(),
            startTime: '',
            endTime: '',
            meetingType: group?.default_meeting_type || 'physical',
            locationType: group?.default_location_type || 'church',
            locationAddress: group?.default_location_address || '',
            locationCity: group?.default_location_city || '',
            locationNotes: group?.default_location_notes || '',
            onlinePlatform: group?.default_online_platform || undefined,
            meetingLink: group?.default_meeting_link || '',
            meetingId: group?.default_meeting_id || '',
            meetingPasscode: group?.default_meeting_password || '',
            hostName: '',
            dialInNumber: '',
            additionalInstructions: '',
        },
    });

    const meetingType = useWatch({ control: form.control, name: 'meetingType' });
    const locationType = useWatch({ control: form.control, name: 'locationType' });
    const onlinePlatform = useWatch({ control: form.control, name: 'onlinePlatform' });
    const selectedGroupId = useWatch({ control: form.control, name: 'groupId' });

    const showPhysicalFields = meetingType === 'physical' || meetingType === 'hybrid';
    const showOnlineFields = meetingType === 'online' || meetingType === 'hybrid';

    // Update defaults when group changes
    useEffect(() => {
        if (selectedGroupId && !isEditing) {
            const selectedGroup = groups.find(g => g.id === selectedGroupId);
            if (selectedGroup) {
                form.setValue('meetingType', selectedGroup.default_meeting_type || 'physical');
                form.setValue('locationType', selectedGroup.default_location_type || 'church');
                form.setValue('locationAddress', selectedGroup.default_location_address || '');
                form.setValue('locationCity', selectedGroup.default_location_city || '');
                form.setValue('locationNotes', selectedGroup.default_location_notes || '');
                form.setValue('onlinePlatform', selectedGroup.default_online_platform || undefined);
                form.setValue('meetingLink', selectedGroup.default_meeting_link || '');
                form.setValue('meetingId', selectedGroup.default_meeting_id || '');
                form.setValue('meetingPasscode', selectedGroup.default_meeting_password || '');

                // Set default time if available
                if (selectedGroup.default_meeting_time) {
                    form.setValue('startTime', selectedGroup.default_meeting_time);
                }
            }
        }
    }, [selectedGroupId, groups, form, isEditing]);

    // Populate form when editing
    useEffect(() => {
        if (meeting) {
            form.reset({
                groupId: meeting.group_id,
                title: meeting.title,
                description: meeting.description || '',
                meetingDate: parseISO(meeting.meeting_date),
                startTime: meeting.start_time,
                endTime: meeting.end_time || '',
                meetingType: meeting.meeting_type,
                locationType: meeting.location_type || 'church',
                locationAddress: meeting.location_address || '',
                locationCity: meeting.location_city || '',
                locationNotes: meeting.location_notes || '',
                onlinePlatform: meeting.online_platform || undefined,
                meetingLink: meeting.meeting_link || '',
                meetingId: meeting.meeting_id || '',
                meetingPasscode: meeting.meeting_passcode || '',
                hostName: meeting.host_name || '',
                dialInNumber: meeting.dial_in_number || '',
                additionalInstructions: meeting.additional_instructions || '',
            });
        } else if (group) {
            form.reset({
                groupId: group.id,
                title: '',
                description: '',
                meetingDate: new Date(),
                startTime: group.default_meeting_time || '',
                endTime: '',
                meetingType: group.default_meeting_type || 'physical',
                locationType: group.default_location_type || 'church',
                locationAddress: group.default_location_address || '',
                locationCity: group.default_location_city || '',
                locationNotes: group.default_location_notes || '',
                onlinePlatform: group.default_online_platform || undefined,
                meetingLink: group.default_meeting_link || '',
                meetingId: group.default_meeting_id || '',
                meetingPasscode: group.default_meeting_password || '',
                hostName: '',
                dialInNumber: '',
                additionalInstructions: '',
            });
        } else {
            form.reset({
                groupId: '',
                title: '',
                description: '',
                meetingDate: new Date(),
                startTime: '',
                endTime: '',
                meetingType: 'physical',
                locationType: 'church',
                locationAddress: '',
                locationCity: '',
                locationNotes: '',
                onlinePlatform: undefined,
                meetingLink: '',
                meetingId: '',
                meetingPasscode: '',
                hostName: '',
                dialInNumber: '',
                additionalInstructions: '',
            });
        }
    }, [meeting, group, form, open]);

    const onSubmit = async (data: MeetingFormData) => {
        setIsLoading(true);
        try {
            const payload = {
                ...data,
                meetingDate: format(data.meetingDate, 'yyyy-MM-dd'),
            };

            if (isEditing && meeting) {
                await groupsApi.updateMeeting(meeting.group_id, meeting.id, payload);
                toast({
                    title: 'Meeting updated',
                    description: 'Meeting has been updated successfully.',
                });
            } else {
                await groupsApi.createMeeting(payload);
                toast({
                    title: 'Meeting scheduled',
                    description: `${data.title} has been scheduled.`,
                });
            }
            form.reset();
            onSuccess?.();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: isEditing ? 'Failed to update meeting' : 'Failed to schedule meeting',
                description: error.message || 'Something went wrong.',
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
            <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center",
                            isEditing ? "bg-blue-500/10" : "bg-primary/10"
                        )}>
                            {isEditing ? (
                                <Pencil className="h-5 w-5 text-blue-600" />
                            ) : (
                                <CalendarIcon className="h-5 w-5 text-primary" />
                            )}
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-display">
                                {isEditing ? 'Edit Meeting' : 'Schedule Meeting'}
                            </DialogTitle>
                            <DialogDescription>
                                {isEditing
                                    ? 'Update meeting details'
                                    : 'Schedule a new group meeting'}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Group Selection */}
                        <FormField
                            control={form.control}
                            name="groupId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Group *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} disabled={!!group || isEditing}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a group" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {groups.map((g) => (
                                                <SelectItem key={g.id} value={g.id}>
                                                    {g.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Title */}
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Meeting Title *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Weekly Bible Study" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Description */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="What will be discussed in this meeting?"
                                            className="resize-none"
                                            rows={2}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Date and Time */}
                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="meetingDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Date *</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            'pl-3 text-left font-normal',
                                                            !field.value && 'text-muted-foreground'
                                                        )}
                                                    >
                                                        {field.value ? format(field.value, 'MMM d, yyyy') : 'Pick date'}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
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

                        {/* Meeting Type */}
                        <FormField
                            control={form.control}
                            name="meetingType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Meeting Type *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="physical">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-green-500" />
                                                    Physical (In-Person)
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="online">
                                                <div className="flex items-center gap-2">
                                                    <Video className="h-4 w-4 text-blue-500" />
                                                    Online (Virtual)
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="hybrid">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-green-500" />
                                                    <Video className="h-4 w-4 text-blue-500 -ml-2" />
                                                    Hybrid (Both)
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Physical Location */}
                        {showPhysicalFields && (
                            <>
                                <Separator />
                                <h4 className="text-sm font-medium flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-green-500" />
                                    Physical Location
                                </h4>

                                <FormField
                                    control={form.control}
                                    name="locationType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Location</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="church">Church Premises</SelectItem>
                                                    <SelectItem value="custom">Custom Location</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {locationType === 'custom' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="locationAddress"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Address</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Street address" {...field} />
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
                                                        <Input placeholder="City" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}

                                <FormField
                                    control={form.control}
                                    name="locationNotes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Location Notes</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., Room 201, Second Floor" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        {/* Online Meeting */}
                        {showOnlineFields && (
                            <>
                                <Separator />
                                <h4 className="text-sm font-medium flex items-center gap-2">
                                    <Video className="h-4 w-4 text-blue-500" />
                                    Online Meeting Details
                                </h4>

                                <FormField
                                    control={form.control}
                                    name="onlinePlatform"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Platform *</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select platform" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {platforms.map((platform) => (
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

                                {onlinePlatform === 'zoom' && (
                                    <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
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
                                                name="meetingPasscode"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Passcode</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="abc123" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

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

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="hostName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Host Name</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Meeting host" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="dialInNumber"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Dial-in Number</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="+1 234 567 8900" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                )}

                                {(onlinePlatform === 'google_meet' || onlinePlatform === 'microsoft_teams') && (
                                    <div className="p-4 bg-muted/30 rounded-lg">
                                        <FormField
                                            control={form.control}
                                            name="meetingLink"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {onlinePlatform === 'google_meet' ? 'Google Meet Link' : 'Teams Link'}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder={onlinePlatform === 'google_meet'
                                                                ? 'https://meet.google.com/xxx-xxxx-xxx'
                                                                : 'https://teams.microsoft.com/...'}
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}

                                {onlinePlatform === 'other' && (
                                    <FormField
                                        control={form.control}
                                        name="meetingLink"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Meeting Link</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter meeting URL" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <FormField
                                    control={form.control}
                                    name="additionalInstructions"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Additional Instructions</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Any special instructions for joining..."
                                                    className="resize-none"
                                                    rows={2}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {isEditing ? 'Updating...' : 'Scheduling...'}
                                    </>
                                ) : isEditing ? (
                                    <>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Update Meeting
                                    </>
                                ) : (
                                    <>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        Schedule Meeting
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