// src/pages/email/ComposeEmail.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormDescription,
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
    Send,
    Save,
    Clock,
    CalendarIcon,
    Users,
    User,
    Mail as MailIcon,
    Eye,
    Code,
    Loader2,
    AlertCircle,
    Info,
    Paperclip,
    X,
} from 'lucide-react';
import { emailApi } from '@/services/emailApi';
import type { ComposeEmailDTO } from '@/types/email.types';
import { membersApi, groupsApi } from '@/lib/api';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useAuth } from '@/contexts/AuthContext.tsx';

const formSchema = z.object({
    destinationType: z.enum(['all_contacts', 'groups', 'members', 'other_emails']),
    groupIds: z.array(z.string()).optional(),
    memberIds: z.array(z.string()).optional(),
    otherEmails: z.string().optional(),
    subject: z.string().min(1, 'Subject is required'),
    htmlContent: z.string().min(1, 'Email content is required'),
    textContent: z.string().optional(),
    templateId: z.string().optional(),
    fromConfigId: z.string().optional(),
    sendOption: z.enum(['now', 'schedule', 'draft']),
    scheduledAt: z.date().optional(),
    scheduledTime: z.string().optional(),
    name: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const quillModules = {
    toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ align: [] }],
        ['link', 'image'],
        ['clean'],
    ],
};

export default function ComposeEmail() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const draftId = searchParams.get('draft');

    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [emailMode, setEmailMode] = useState<'visual' | 'html'>('visual');
    const [attachments, setAttachments] = useState<File[]>([]);
    const { user } = useAuth();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            destinationType: 'all_contacts',
            groupIds: [],
            memberIds: [],
            otherEmails: '',
            subject: '',
            htmlContent: '',
            textContent: '',
            sendOption: 'now',
            name: '',
        },
    });

    const destinationType = form.watch('destinationType');
    const htmlContent = form.watch('htmlContent');
    const subject = form.watch('subject');
    const sendOption = form.watch('sendOption');

    // Queries — all return data directly (no .data nesting)
    const { data: templates } = useQuery({
        queryKey: ['email-templates'],
        queryFn: () => emailApi.getTemplates(true),
    });

    const { data: configurations } = useQuery({
        queryKey: ['email-configurations'],
        queryFn: () => emailApi.getConfigurations(),
    });

    const { data: groupsData } = useQuery({
        queryKey: ['groups'],
        queryFn: () => groupsApi.getAll({ limit: 100 }),
    });

    const { data: membersData } = useQuery({
        queryKey: ['members'],
        queryFn: () => membersApi.getAll({ churchId: user?.church_id, limit: 1000 }),
    });

    // Extract arrays from paginated responses
    const membersList = membersData?.members || [];
    const groupsList = groupsData?.groups || [];

    // Load draft if editing
    useEffect(() => {
        if (draftId) {
            emailApi.getCampaignById(draftId).then((draft) => {
                form.reset({
                    destinationType: draft.destination_type,
                    subject: draft.subject,
                    htmlContent: draft.html_content,
                    textContent: draft.text_content || '',
                    name: draft.name || '',
                    sendOption: 'draft',
                    fromConfigId: draft.from_config_id || undefined,
                    templateId: draft.template_id || undefined,
                });

                if (draft.group_ids) setSelectedGroups(draft.group_ids);
                if (draft.member_ids) setSelectedMembers(draft.member_ids);
            });
        }
    }, [draftId]);

    // Mutations
    const composeMutation = useMutation({
        mutationFn: (data: ComposeEmailDTO) => emailApi.composeEmail(data),
        onSuccess: (campaign) => {
            const status = campaign.status;
            if (status === 'sent' || status === 'sending') {
                toast.success('Email sent successfully!');
                navigate('/email/sent');
            } else if (status === 'scheduled') {
                toast.success('Email scheduled successfully!');
                navigate('/email/scheduled');
            } else {
                toast.success('Draft saved successfully!');
                navigate('/email/drafts');
            }
        },
        onError: (error: unknown) => {
            const errorMessage =
                error instanceof Error ? error.message : 'Failed to send email';
            toast.error(errorMessage);
        },
    });

    // Calculate recipient count
    const getRecipientCount = (): number => {
        switch (destinationType) {
            case 'all_contacts':
                return membersList.filter((m) => m.email).length;
            case 'groups':
                return selectedGroups.reduce((count, groupId) => {
                    const group = groupsList.find((g) => g.id === groupId);
                    return count + (group?.member_count || 0);
                }, 0);
            case 'members':
                return selectedMembers.length;
            case 'other_emails': {
                const emails = form.getValues('otherEmails');
                return emails?.split(',').filter((e) => e.trim()).length || 0;
            }
            default:
                return 0;
        }
    };

    const recipientCount = getRecipientCount();

    // Handle template selection
    const handleTemplateSelect = (templateId: string) => {
        const template = templates?.find((t) => t.id === templateId);
        if (template) {
            form.setValue('subject', template.subject);
            form.setValue('htmlContent', template.html_content);
            form.setValue('textContent', template.text_content || '');
            form.setValue('templateId', template.id);
        }
    };

    // Handle file upload
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        const maxSize = 5 * 1024 * 1024; // 5MB
        const validFiles = files.filter((file) => {
            if (file.size > maxSize) {
                toast.error(`${file.name} is too large. Max size is 5MB`);
                return false;
            }
            return true;
        });

        setAttachments([...attachments, ...validFiles]);
    };

    const removeAttachment = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    // Handle form submit
    const onSubmit = (data: FormData) => {
        // Build scheduled datetime
        let scheduledAt: string | undefined;
        if (data.sendOption === 'schedule' && data.scheduledAt && data.scheduledTime) {
            const [hours, minutes] = data.scheduledTime.split(':');
            const scheduled = new Date(data.scheduledAt);
            scheduled.setHours(parseInt(hours), parseInt(minutes));
            scheduledAt = scheduled.toISOString();
        }

        // Parse other emails
        let otherEmails: string[] | undefined;
        if (data.destinationType === 'other_emails' && data.otherEmails) {
            otherEmails = data.otherEmails
                .split(',')
                .map((e) => e.trim())
                .filter(Boolean);
        }

        // Build ComposeEmailDTO
        const submitData: ComposeEmailDTO = {
            destinationType: data.destinationType,
            subject: data.subject,
            htmlContent: data.htmlContent,
            sendOption: data.sendOption,
            ...(data.destinationType === 'groups' && selectedGroups.length > 0
                ? { groupIds: selectedGroups }
                : {}),
            ...(data.destinationType === 'members' && selectedMembers.length > 0
                ? { memberIds: selectedMembers }
                : {}),
            ...(otherEmails ? { otherEmails } : {}),
            ...(data.textContent ? { textContent: data.textContent } : {}),
            ...(data.templateId ? { templateId: data.templateId } : {}),
            ...(data.fromConfigId ? { fromConfigId: data.fromConfigId } : {}),
            ...(scheduledAt ? { scheduledAt } : {}),
            ...(data.name ? { name: data.name } : {}),
        };

        composeMutation.mutate(submitData);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Compose Email</CardTitle>
                        <CardDescription>
                            Create and send professional email campaigns
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                {/* Campaign Name */}
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Campaign Name (Optional)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g., Monthly Newsletter"
                                                    {...field}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                {/* Template Selection */}
                                <div className="space-y-2">
                                    <Label>Use Template (Optional)</Label>
                                    <Select onValueChange={handleTemplateSelect}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a template" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {templates?.map((template) => (
                                                <SelectItem key={template.id} value={template.id}>
                                                    {template.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Separator />

                                {/* Destination Type */}
                                <FormField
                                    control={form.control}
                                    name="destinationType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Send To</FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                                                >
                                                    <div>
                                                        <RadioGroupItem
                                                            value="all_contacts"
                                                            id="email_all_contacts"
                                                            className="peer sr-only"
                                                        />
                                                        <Label
                                                            htmlFor="email_all_contacts"
                                                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                                        >
                                                            <Users className="mb-2 h-6 w-6" />
                                                            <span className="text-sm">All Contacts</span>
                                                        </Label>
                                                    </div>
                                                    <div>
                                                        <RadioGroupItem
                                                            value="groups"
                                                            id="email_groups"
                                                            className="peer sr-only"
                                                        />
                                                        <Label
                                                            htmlFor="email_groups"
                                                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                                        >
                                                            <Users className="mb-2 h-6 w-6" />
                                                            <span className="text-sm">Groups</span>
                                                        </Label>
                                                    </div>
                                                    <div>
                                                        <RadioGroupItem
                                                            value="members"
                                                            id="email_members"
                                                            className="peer sr-only"
                                                        />
                                                        <Label
                                                            htmlFor="email_members"
                                                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                                        >
                                                            <User className="mb-2 h-6 w-6" />
                                                            <span className="text-sm">Members</span>
                                                        </Label>
                                                    </div>
                                                    <div>
                                                        <RadioGroupItem
                                                            value="other_emails"
                                                            id="email_other"
                                                            className="peer sr-only"
                                                        />
                                                        <Label
                                                            htmlFor="email_other"
                                                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                                        >
                                                            <MailIcon className="mb-2 h-6 w-6" />
                                                            <span className="text-sm">Email List</span>
                                                        </Label>
                                                    </div>
                                                </RadioGroup>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                {/* Group Selection */}
                                {destinationType === 'groups' && (
                                    <div className="space-y-2">
                                        <Label>Select Groups</Label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                                            {groupsList.map((group) => (
                                                <div
                                                    key={group.id}
                                                    className="flex items-center space-x-2"
                                                >
                                                    <Checkbox
                                                        id={`group-${group.id}`}
                                                        checked={selectedGroups.includes(group.id)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                setSelectedGroups([
                                                                    ...selectedGroups,
                                                                    group.id,
                                                                ]);
                                                            } else {
                                                                setSelectedGroups(
                                                                    selectedGroups.filter(
                                                                        (id) => id !== group.id
                                                                    )
                                                                );
                                                            }
                                                        }}
                                                    />
                                                    <Label
                                                        htmlFor={`group-${group.id}`}
                                                        className="text-sm cursor-pointer"
                                                    >
                                                        {group.name} ({group.member_count})
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Member Selection */}
                                {destinationType === 'members' && (
                                    <div className="space-y-2">
                                        <Label>Select Members</Label>
                                        <div className="max-h-48 overflow-y-auto border rounded-md p-3">
                                            {membersList
                                                .filter((m) => m.email)
                                                .map((member) => (
                                                    <div
                                                        key={member.id}
                                                        className="flex items-center space-x-2 py-1"
                                                    >
                                                        <Checkbox
                                                            id={`member-${member.id}`}
                                                            checked={selectedMembers.includes(
                                                                member.id
                                                            )}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    setSelectedMembers([
                                                                        ...selectedMembers,
                                                                        member.id,
                                                                    ]);
                                                                } else {
                                                                    setSelectedMembers(
                                                                        selectedMembers.filter(
                                                                            (id) => id !== member.id
                                                                        )
                                                                    );
                                                                }
                                                            }}
                                                        />
                                                        <Label
                                                            htmlFor={`member-${member.id}`}
                                                            className="text-sm cursor-pointer"
                                                        >
                                                            {member.first_name} {member.last_name} -{' '}
                                                            {member.email}
                                                        </Label>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}

                                {/* Other Emails */}
                                {destinationType === 'other_emails' && (
                                    <FormField
                                        control={form.control}
                                        name="otherEmails"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email Addresses</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder={
                                                            'Enter email addresses separated by commas\ne.g., john@example.com, jane@example.com'
                                                        }
                                                        className="min-h-[100px]"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Enter multiple email addresses separated by commas
                                                </FormDescription>
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {/* From Configuration */}
                                <FormField
                                    control={form.control}
                                    name="fromConfigId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>From</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select sender configuration" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {configurations?.map((config) => (
                                                        <SelectItem
                                                            key={config.id}
                                                            value={config.id}
                                                        >
                                                            {config.from_name} &lt;
                                                            {config.from_email}&gt;
                                                            {config.is_default && (
                                                                <Badge
                                                                    className="ml-2"
                                                                    variant="secondary"
                                                                >
                                                                    Default
                                                                </Badge>
                                                            )}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />

                                {/* Subject */}
                                <FormField
                                    control={form.control}
                                    name="subject"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Subject</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter email subject"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Email Content */}
                                <FormField
                                    control={form.control}
                                    name="htmlContent"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email Content</FormLabel>
                                            <Tabs
                                                value={emailMode}
                                                onValueChange={(v) =>
                                                    setEmailMode(v as 'visual' | 'html')
                                                }
                                            >
                                                <TabsList className="grid w-full grid-cols-2">
                                                    <TabsTrigger value="visual">
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        Visual Editor
                                                    </TabsTrigger>
                                                    <TabsTrigger value="html">
                                                        <Code className="h-4 w-4 mr-2" />
                                                        HTML
                                                    </TabsTrigger>
                                                </TabsList>
                                                <TabsContent value="visual">
                                                    <FormControl>
                                                        <ReactQuill
                                                            theme="snow"
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            modules={quillModules}
                                                            className="bg-background"
                                                        />
                                                    </FormControl>
                                                </TabsContent>
                                                <TabsContent value="html">
                                                    <FormControl>
                                                        <Textarea
                                                            {...field}
                                                            placeholder="Enter HTML content"
                                                            className="min-h-[300px] font-mono text-sm"
                                                        />
                                                    </FormControl>
                                                </TabsContent>
                                            </Tabs>
                                            <FormDescription>
                                                Use {'{'}name{'}'} to personalize with
                                                recipient&apos;s name
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Attachments */}
                                <div className="space-y-2">
                                    <Label>Attachments (Optional)</Label>
                                    <div className="border-2 border-dashed rounded-lg p-4">
                                        <Label
                                            htmlFor="email-attachments"
                                            className="cursor-pointer flex flex-col items-center gap-2"
                                        >
                                            <Paperclip className="h-8 w-8 text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground">
                                                Click to attach files (Max 5MB each)
                                            </span>
                                        </Label>
                                        <Input
                                            id="email-attachments"
                                            type="file"
                                            multiple
                                            className="hidden"
                                            onChange={handleFileUpload}
                                        />
                                    </div>
                                    {attachments.length > 0 && (
                                        <div className="space-y-2">
                                            {attachments.map((file, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between p-2 bg-muted rounded"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Paperclip className="h-4 w-4" />
                                                        <span className="text-sm">{file.name}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            ({(file.size / 1024).toFixed(2)} KB)
                                                        </span>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeAttachment(index)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Send Options */}
                                <FormField
                                    control={form.control}
                                    name="sendOption"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Send Option</FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                    className="flex gap-4"
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="now" id="email_now" />
                                                        <Label
                                                            htmlFor="email_now"
                                                            className="flex items-center gap-2 cursor-pointer"
                                                        >
                                                            <Send className="h-4 w-4" />
                                                            Send Now
                                                        </Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem
                                                            value="schedule"
                                                            id="email_schedule"
                                                        />
                                                        <Label
                                                            htmlFor="email_schedule"
                                                            className="flex items-center gap-2 cursor-pointer"
                                                        >
                                                            <Clock className="h-4 w-4" />
                                                            Schedule
                                                        </Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem
                                                            value="draft"
                                                            id="email_draft"
                                                        />
                                                        <Label
                                                            htmlFor="email_draft"
                                                            className="flex items-center gap-2 cursor-pointer"
                                                        >
                                                            <Save className="h-4 w-4" />
                                                            Save as Draft
                                                        </Label>
                                                    </div>
                                                </RadioGroup>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                {/* Schedule Date/Time */}
                                {sendOption === 'schedule' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="scheduledAt"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>Date</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant="outline"
                                                                    className={cn(
                                                                        'pl-3 text-left font-normal',
                                                                        !field.value &&
                                                                        'text-muted-foreground'
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
                                                        <PopoverContent
                                                            className="w-auto p-0"
                                                            align="start"
                                                        >
                                                            <Calendar
                                                                mode="single"
                                                                selected={field.value}
                                                                onSelect={field.onChange}
                                                                disabled={(date) =>
                                                                    date < new Date()
                                                                }
                                                                initialFocus
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="scheduledTime"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Time</FormLabel>
                                                    <FormControl>
                                                        <Input type="time" {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}

                                {/* Submit Buttons */}
                                <div className="flex justify-end gap-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => navigate('/email')}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={composeMutation.isPending}
                                    >
                                        {composeMutation.isPending ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Processing...
                                            </>
                                        ) : sendOption === 'now' ? (
                                            <>
                                                <Send className="h-4 w-4 mr-2" />
                                                Send Now
                                            </>
                                        ) : sendOption === 'schedule' ? (
                                            <>
                                                <Clock className="h-4 w-4 mr-2" />
                                                Schedule
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4 mr-2" />
                                                Save Draft
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>

            {/* Summary Sidebar */}
            <div className="space-y-4">
                {/* Recipient Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle>Campaign Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Recipients</span>
                            <span className="font-medium">{recipientCount}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Attachments</span>
                            <span className="font-medium">{attachments.length}</span>
                        </div>
                        {recipientCount === 0 && (
                            <div className="flex items-center gap-2 text-destructive text-sm">
                                <AlertCircle className="h-4 w-4" />
                                <span>No recipients selected</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Preview */}
                <Card>
                    <CardHeader>
                        <CardTitle>Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 text-sm">
                            <div>
                                <div className="text-muted-foreground mb-1">Subject:</div>
                                <div className="font-medium">{subject || 'No subject'}</div>
                            </div>
                            <Separator />
                            <div>
                                <div className="text-muted-foreground mb-2">
                                    Content Preview:
                                </div>
                                <div
                                    className="prose prose-sm max-w-none border rounded-lg p-3 max-h-[300px] overflow-y-auto"
                                    dangerouslySetInnerHTML={{
                                        __html:
                                            htmlContent ||
                                            '<p class="text-muted-foreground">No content yet...</p>',
                                    }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tips */}
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                        <div className="flex gap-3">
                            <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
                            <div className="space-y-2 text-sm text-blue-900">
                                <p className="font-medium">Email Tips:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Keep subject lines under 50 characters</li>
                                    <li>
                                        Use personalization with {'{'}name{'}'}
                                    </li>
                                    <li>Test emails before sending to large lists</li>
                                    <li>Optimize images for faster loading</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}