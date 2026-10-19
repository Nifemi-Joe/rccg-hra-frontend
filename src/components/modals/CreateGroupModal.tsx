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
import { groupsApi, Group, GroupType, membersApi, Member } from '@/lib/api';
import {
    Loader2,
    Users,
    Pencil,
    MapPin,
    Video,
    Settings,
    User,
    Check,
    ChevronsUpDown,
    ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

const groupSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    description: z.string().max(1000).optional(),
    groupTypeId: z.string().optional(),
    leaderId: z.string().optional(),
    coLeaderId: z.string().optional(),
    defaultMeetingDay: z.string().optional(),
    defaultMeetingTime: z.string().optional(),
    defaultMeetingType: z.enum(['physical', 'online', 'hybrid']).default('physical'),
    defaultLocationType: z.enum(['church', 'custom']).default('church'),
    defaultLocationAddress: z.string().optional(),
    defaultLocationCity: z.string().optional(),
    defaultLocationNotes: z.string().optional(),
    defaultOnlinePlatform: z
        .enum(['zoom', 'google_meet', 'microsoft_teams', 'other'])
        .optional()
        .nullable(),
    defaultMeetingLink: z.string().url().optional().or(z.literal('')),
    defaultMeetingId: z.string().optional(),
    defaultMeetingPassword: z.string().optional(),
    isPublic: z.boolean().default(true),
    maxMembers: z.number().min(1).max(1000).optional().nullable(),
    isActive: z.boolean().default(true),
});

type GroupFormData = z.infer<typeof groupSchema>;

interface GroupModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    group?: Group | null;
    groupTypes: GroupType[];
}

const daysOfWeek = [
    { value: 'sunday', label: 'Sunday' },
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
];

const platforms = [
    { value: 'zoom', label: 'Zoom', icon: '📹' },
    { value: 'google_meet', label: 'Google Meet', icon: '🎥' },
    { value: 'microsoft_teams', label: 'Microsoft Teams', icon: '💼' },
    { value: 'other', label: 'Other', icon: '🔗' },
];

export function GroupModal({
                               open,
                               onClose,
                               onSuccess,
                               group,
                               groupTypes,
                           }: GroupModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('basic');
    const [members, setMembers] = useState<Member[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [openLeaderSelect, setOpenLeaderSelect] = useState(false);
    const [openCoLeaderSelect, setOpenCoLeaderSelect] = useState(false);
    const { toast } = useToast();

    const isEditing = !!group;

    const form = useForm<GroupFormData>({
        resolver: zodResolver(groupSchema),
        defaultValues: {
            name: '',
            description: '',
            groupTypeId: undefined,
            leaderId: undefined,
            coLeaderId: undefined,
            defaultMeetingDay: undefined,
            defaultMeetingTime: '',
            defaultMeetingType: 'physical',
            defaultLocationType: 'church',
            defaultLocationAddress: '',
            defaultLocationCity: '',
            defaultLocationNotes: '',
            defaultOnlinePlatform: null,
            defaultMeetingLink: '',
            defaultMeetingId: '',
            defaultMeetingPassword: '',
            isPublic: true,
            maxMembers: null,
            isActive: true,
        },
    });

    const meetingType = useWatch({
        control: form.control,
        name: 'defaultMeetingType',
    });
    const locationType = useWatch({
        control: form.control,
        name: 'defaultLocationType',
    });
    const onlinePlatform = useWatch({
        control: form.control,
        name: 'defaultOnlinePlatform',
    });

    const showPhysicalFields =
        meetingType === 'physical' || meetingType === 'hybrid';
    const showOnlineFields =
        meetingType === 'online' || meetingType === 'hybrid';

    // Fetch members for leader selection
    useEffect(() => {
        if (open) {
            fetchMembers();
        }
    }, [open]);

    // Populate form when editing
    useEffect(() => {
        if (group && open) {
            form.reset({
                name: group.name || '',
                description: group.description || '',
                groupTypeId: group.group_type_id || undefined,
                leaderId: group.leader_id || undefined,
                coLeaderId: group.co_leader_id || undefined,
                defaultMeetingDay: group.default_meeting_day || undefined,
                defaultMeetingTime: group.default_meeting_time || '',
                defaultMeetingType:
                    (group.default_meeting_type as
                        | 'physical'
                        | 'online'
                        | 'hybrid') || 'physical',
                defaultLocationType:
                    (group.default_location_type as 'church' | 'custom') ||
                    'church',
                defaultLocationAddress:
                    group.default_location_address || '',
                defaultLocationCity: group.default_location_city || '',
                defaultLocationNotes:
                    group.default_location_notes || '',
                defaultOnlinePlatform:
                    (group.default_online_platform as
                        | 'zoom'
                        | 'google_meet'
                        | 'microsoft_teams'
                        | 'other') || null,
                defaultMeetingLink: group.default_meeting_link || '',
                defaultMeetingId: group.default_meeting_id || '',
                defaultMeetingPassword:
                    group.default_meeting_password || '',
                isPublic: group.is_public ?? true,
                maxMembers: group.max_members || null,
                isActive: group.is_active ?? true,
            });
        } else if (!group && open) {
            form.reset({
                name: '',
                description: '',
                groupTypeId: undefined,
                leaderId: undefined,
                coLeaderId: undefined,
                defaultMeetingDay: undefined,
                defaultMeetingTime: '',
                defaultMeetingType: 'physical',
                defaultLocationType: 'church',
                defaultLocationAddress: '',
                defaultLocationCity: '',
                defaultLocationNotes: '',
                defaultOnlinePlatform: null,
                defaultMeetingLink: '',
                defaultMeetingId: '',
                defaultMeetingPassword: '',
                isPublic: true,
                maxMembers: null,
                isActive: true,
            });
        }
        setActiveTab('basic');
    }, [group, form, open]);

    const fetchMembers = async () => {
        setLoadingMembers(true);
        try {
            const result = await membersApi.getAll({ limit: 200 });
            setMembers(result.members || []);
        } catch (error) {
            console.error('Failed to fetch members:', error);
        } finally {
            setLoadingMembers(false);
        }
    };

    const onSubmit = async (data: GroupFormData) => {
        setIsLoading(true);
        try {
            const payload = {
                ...data,
                defaultOnlinePlatform:
                    data.defaultOnlinePlatform || undefined,
                maxMembers: data.maxMembers || undefined,
            };

            if (isEditing && group) {
                await groupsApi.update(group.id, payload);
                toast({
                    title: 'Group updated',
                    description: `${data.name} has been updated successfully.`,
                });
            } else {
                await groupsApi.create(payload);
                toast({
                    title: 'Group submitted for approval',
                    description: `${data.name} has been created and is pending approval.`,
                });
            }
            form.reset();
            setActiveTab('basic');
            onSuccess?.();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: isEditing
                    ? 'Failed to update group'
                    : 'Failed to create group',
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

    const getSelectedMember = (memberId?: string) => {
        return members.find((m) => m.id === memberId);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div
                            className={cn(
                                'h-10 w-10 rounded-full flex items-center justify-center',
                                isEditing
                                    ? 'bg-blue-500/10'
                                    : 'bg-primary/10'
                            )}
                        >
                            {isEditing ? (
                                <Pencil className="h-5 w-5 text-blue-600" />
                            ) : (
                                <Users className="h-5 w-5 text-primary" />
                            )}
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-display">
                                {isEditing
                                    ? 'Edit Group'
                                    : 'Create New Group'}
                            </DialogTitle>
                            <DialogDescription>
                                {isEditing
                                    ? `Update settings for ${group?.name}`
                                    : 'Create a ministry group, small group, or department'}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <Tabs
                            value={activeTab}
                            onValueChange={setActiveTab}
                            className="w-full"
                        >
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger
                                    value="basic"
                                    className="gap-2"
                                >
                                    <Users className="h-4 w-4" />
                                    <span className="hidden sm:inline">
                                        Basic
                                    </span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="meeting"
                                    className="gap-2"
                                >
                                    <Video className="h-4 w-4" />
                                    <span className="hidden sm:inline">
                                        Meeting
                                    </span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="settings"
                                    className="gap-2"
                                >
                                    <Settings className="h-4 w-4" />
                                    <span className="hidden sm:inline">
                                        Settings
                                    </span>
                                </TabsTrigger>
                            </TabsList>

                            {/* ================================================ */}
                            {/* Basic Info Tab */}
                            {/* ================================================ */}
                            <TabsContent
                                value="basic"
                                className="space-y-4 mt-4"
                            >
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Group Name *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g., Young Adults Fellowship"
                                                    {...field}
                                                />
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
                                                    placeholder="Describe the purpose of this group..."
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
                                        name="groupTypeId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Group Type
                                                </FormLabel>
                                                <Select
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    value={field.value || ''}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select type" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {groupTypes.map(
                                                            (type) => (
                                                                <SelectItem
                                                                    key={
                                                                        type.id
                                                                    }
                                                                    value={
                                                                        type.id
                                                                    }
                                                                >
                                                                    {
                                                                        type.name
                                                                    }
                                                                </SelectItem>
                                                            )
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="leaderId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Group Leader
                                                </FormLabel>
                                                <Popover
                                                    open={openLeaderSelect}
                                                    onOpenChange={
                                                        setOpenLeaderSelect
                                                    }
                                                >
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                className={cn(
                                                                    'w-full justify-between',
                                                                    !field.value &&
                                                                    'text-muted-foreground'
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    <span className="flex items-center gap-2 truncate">
                                                                        <User className="h-4 w-4 shrink-0" />
                                                                        {
                                                                            getSelectedMember(
                                                                                field.value
                                                                            )
                                                                                ?.first_name
                                                                        }{' '}
                                                                        {
                                                                            getSelectedMember(
                                                                                field.value
                                                                            )
                                                                                ?.last_name
                                                                        }
                                                                    </span>
                                                                ) : (
                                                                    'Select leader'
                                                                )}
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[300px] p-0">
                                                        <Command>
                                                            <CommandInput placeholder="Search members..." />
                                                            <CommandList>
                                                                <CommandEmpty>
                                                                    {loadingMembers
                                                                        ? 'Loading...'
                                                                        : 'No members found.'}
                                                                </CommandEmpty>
                                                                <CommandGroup>
                                                                    <CommandItem
                                                                        value="none"
                                                                        onSelect={() => {
                                                                            field.onChange(
                                                                                undefined
                                                                            );
                                                                            setOpenLeaderSelect(
                                                                                false
                                                                            );
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                'mr-2 h-4 w-4',
                                                                                !field.value
                                                                                    ? 'opacity-100'
                                                                                    : 'opacity-0'
                                                                            )}
                                                                        />
                                                                        No
                                                                        leader
                                                                    </CommandItem>
                                                                    {members.map(
                                                                        (
                                                                            member
                                                                        ) => (
                                                                            <CommandItem
                                                                                key={
                                                                                    member.id
                                                                                }
                                                                                value={`${member.first_name} ${member.last_name}`}
                                                                                onSelect={() => {
                                                                                    field.onChange(
                                                                                        member.id
                                                                                    );
                                                                                    setOpenLeaderSelect(
                                                                                        false
                                                                                    );
                                                                                }}
                                                                            >
                                                                                <Check
                                                                                    className={cn(
                                                                                        'mr-2 h-4 w-4',
                                                                                        field.value ===
                                                                                        member.id
                                                                                            ? 'opacity-100'
                                                                                            : 'opacity-0'
                                                                                    )}
                                                                                />
                                                                                {
                                                                                    member.first_name
                                                                                }{' '}
                                                                                {
                                                                                    member.last_name
                                                                                }
                                                                            </CommandItem>
                                                                        )
                                                                    )}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="coLeaderId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Co-Leader (Optional)
                                            </FormLabel>
                                            <Popover
                                                open={openCoLeaderSelect}
                                                onOpenChange={
                                                    setOpenCoLeaderSelect
                                                }
                                            >
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className={cn(
                                                                'w-full justify-between',
                                                                !field.value &&
                                                                'text-muted-foreground'
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                <span className="flex items-center gap-2 truncate">
                                                                    <User className="h-4 w-4 shrink-0" />
                                                                    {
                                                                        getSelectedMember(
                                                                            field.value
                                                                        )
                                                                            ?.first_name
                                                                    }{' '}
                                                                    {
                                                                        getSelectedMember(
                                                                            field.value
                                                                        )
                                                                            ?.last_name
                                                                    }
                                                                </span>
                                                            ) : (
                                                                'Select co-leader'
                                                            )}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[300px] p-0">
                                                    <Command>
                                                        <CommandInput placeholder="Search members..." />
                                                        <CommandList>
                                                            <CommandEmpty>
                                                                No members
                                                                found.
                                                            </CommandEmpty>
                                                            <CommandGroup>
                                                                <CommandItem
                                                                    value="none"
                                                                    onSelect={() => {
                                                                        field.onChange(
                                                                            undefined
                                                                        );
                                                                        setOpenCoLeaderSelect(
                                                                            false
                                                                        );
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            'mr-2 h-4 w-4',
                                                                            !field.value
                                                                                ? 'opacity-100'
                                                                                : 'opacity-0'
                                                                        )}
                                                                    />
                                                                    No
                                                                    co-leader
                                                                </CommandItem>
                                                                {members.map(
                                                                    (
                                                                        member
                                                                    ) => (
                                                                        <CommandItem
                                                                            key={
                                                                                member.id
                                                                            }
                                                                            value={`${member.first_name} ${member.last_name}`}
                                                                            onSelect={() => {
                                                                                field.onChange(
                                                                                    member.id
                                                                                );
                                                                                setOpenCoLeaderSelect(
                                                                                    false
                                                                                );
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    'mr-2 h-4 w-4',
                                                                                    field.value ===
                                                                                    member.id
                                                                                        ? 'opacity-100'
                                                                                        : 'opacity-0'
                                                                                )}
                                                                            />
                                                                            {
                                                                                member.first_name
                                                                            }{' '}
                                                                            {
                                                                                member.last_name
                                                                            }
                                                                        </CommandItem>
                                                                    )
                                                                )}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Approval Notice - only when creating */}
                                {!isEditing && (
                                    <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20 p-4 mt-2">
                                        <div className="flex items-start gap-3">
                                            <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                                                <ShieldCheck className="h-4 w-4 text-amber-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                                                    Approval Required
                                                </p>
                                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 leading-relaxed">
                                                    New groups require
                                                    approval from an
                                                    authorized administrator
                                                    before they become active
                                                    and visible to members.
                                                    You'll be notified once
                                                    your group is reviewed.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            {/* ================================================ */}
                            {/* Meeting Settings Tab */}
                            {/* ================================================ */}
                            <TabsContent
                                value="meeting"
                                className="space-y-4 mt-4"
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="defaultMeetingDay"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Default Meeting Day
                                                </FormLabel>
                                                <Select
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    value={field.value || ''}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select day" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {daysOfWeek.map(
                                                            (day) => (
                                                                <SelectItem
                                                                    key={
                                                                        day.value
                                                                    }
                                                                    value={
                                                                        day.value
                                                                    }
                                                                >
                                                                    {
                                                                        day.label
                                                                    }
                                                                </SelectItem>
                                                            )
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="defaultMeetingTime"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Default Time
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="time"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="defaultMeetingType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Meeting Type
                                            </FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="physical">
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="h-4 w-4" />
                                                            Physical
                                                            (In-Person)
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="online">
                                                        <div className="flex items-center gap-2">
                                                            <Video className="h-4 w-4" />
                                                            Online (Virtual)
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="hybrid">
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="h-4 w-4" />
                                                            <Video className="h-4 w-4 -ml-2" />
                                                            Hybrid (Both)
                                                        </div>
                                                    </SelectItem>
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
                                            name="defaultLocationType"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Location
                                                    </FormLabel>
                                                    <Select
                                                        onValueChange={
                                                            field.onChange
                                                        }
                                                        value={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="church">
                                                                Church
                                                                Premises
                                                            </SelectItem>
                                                            <SelectItem value="custom">
                                                                Custom
                                                                Location
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {locationType === 'custom' && (
                                            <div className="space-y-4">
                                                <FormField
                                                    control={form.control}
                                                    name="defaultLocationAddress"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Address
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Enter address"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="defaultLocationCity"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                City
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Enter city"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        )}

                                        <FormField
                                            control={form.control}
                                            name="defaultLocationNotes"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Location Notes
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="e.g., Room 201, Second Floor"
                                                            {...field}
                                                        />
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
                                            name="defaultOnlinePlatform"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Platform
                                                    </FormLabel>
                                                    <Select
                                                        onValueChange={
                                                            field.onChange
                                                        }
                                                        value={
                                                            field.value || ''
                                                        }
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select platform" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {platforms.map(
                                                                (
                                                                    platform
                                                                ) => (
                                                                    <SelectItem
                                                                        key={
                                                                            platform.value
                                                                        }
                                                                        value={
                                                                            platform.value
                                                                        }
                                                                    >
                                                                        <span className="flex items-center gap-2">
                                                                            <span>
                                                                                {
                                                                                    platform.icon
                                                                                }
                                                                            </span>
                                                                            {
                                                                                platform.label
                                                                            }
                                                                        </span>
                                                                    </SelectItem>
                                                                )
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {onlinePlatform === 'zoom' && (
                                            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                                                <FormField
                                                    control={form.control}
                                                    name="defaultMeetingId"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Zoom Meeting
                                                                ID
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="e.g., 123 456 7890"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="defaultMeetingPassword"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Passcode
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Meeting passcode"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="defaultMeetingLink"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Meeting Link
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="https://zoom.us/j/..."
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        )}

                                        {onlinePlatform ===
                                            'google_meet' && (
                                                <div className="p-4 bg-muted/30 rounded-lg">
                                                    <FormField
                                                        control={form.control}
                                                        name="defaultMeetingLink"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    Google Meet
                                                                    Link
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder="https://meet.google.com/xxx-xxxx-xxx"
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                                <FormDescription>
                                                                    Paste your
                                                                    Google Meet
                                                                    link here
                                                                </FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            )}

                                        {onlinePlatform ===
                                            'microsoft_teams' && (
                                                <div className="p-4 bg-muted/30 rounded-lg">
                                                    <FormField
                                                        control={form.control}
                                                        name="defaultMeetingLink"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    Teams Meeting
                                                                    Link
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder="https://teams.microsoft.com/..."
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                                <FormDescription>
                                                                    Paste your
                                                                    Microsoft
                                                                    Teams meeting
                                                                    link here
                                                                </FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            )}

                                        {onlinePlatform === 'other' && (
                                            <div className="p-4 bg-muted/30 rounded-lg">
                                                <FormField
                                                    control={form.control}
                                                    name="defaultMeetingLink"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Meeting Link
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Enter meeting URL"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                            </TabsContent>

                            {/* ================================================ */}
                            {/* Settings Tab */}
                            {/* ================================================ */}
                            <TabsContent
                                value="settings"
                                className="space-y-4 mt-4"
                            >
                                <FormField
                                    control={form.control}
                                    name="isPublic"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">
                                                    Public Group
                                                </FormLabel>
                                                <FormDescription>
                                                    Allow members to see this
                                                    group and request to join
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={
                                                        field.onChange
                                                    }
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="maxMembers"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Maximum Members (Optional)
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={1000}
                                                    placeholder="No limit"
                                                    value={field.value ?? ''}
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            e.target.value
                                                                ? parseInt(
                                                                    e.target
                                                                        .value
                                                                )
                                                                : null
                                                        )
                                                    }
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Leave empty for unlimited
                                                members
                                            </FormDescription>
                                            <FormMessage />
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
                                                    <FormLabel className="text-base">
                                                        Active Group
                                                    </FormLabel>
                                                    <FormDescription>
                                                        Inactive groups are
                                                        hidden from members
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={
                                                            field.onChange
                                                        }
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </TabsContent>
                        </Tabs>

                        <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {isEditing
                                            ? 'Updating...'
                                            : 'Creating...'}
                                    </>
                                ) : isEditing ? (
                                    <>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Update Group
                                    </>
                                ) : (
                                    <>
                                        <Users className="mr-2 h-4 w-4" />
                                        Create Group
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