// src/pages/whatsapp/ComposeWhatsApp.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    Phone,
    Upload,
    MessageCircle,
    AlertCircle,
    Image,
    Video,
    File,
} from 'lucide-react';
import { whatsappApi, ComposeWhatsAppData, WhatsAppTemplate } from '@/services/whatsappApi';
import { walletApi } from '@/services/walletApi';
import { membersApi, groupsApi } from '@/lib/api.ts';
import Papa from 'papaparse';
import { useAuth } from '@/contexts/AuthContext.tsx';

const formSchema = z.object({
    destinationType: z.enum(['all_contacts', 'groups', 'members', 'phone_numbers', 'uploaded']),
    groupIds: z.array(z.string()).optional(),
    memberIds: z.array(z.string()).optional(),
    phoneNumbers: z.string().optional(),
    templateId: z.string().min(1, 'Please select a template'),
    sendOption: z.enum(['now', 'schedule', 'draft']),
    scheduledAt: z.date().optional(),
    scheduledTime: z.string().optional(),
    name: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function ComposeWhatsApp() {
    const navigate = useNavigate();
    const [uploadedContacts, setUploadedContacts] = useState<Array<{ phone: string; name?: string }>>([]);
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
    const { user } = useAuth();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            destinationType: 'all_contacts',
            groupIds: [],
            memberIds: [],
            phoneNumbers: '',
            templateId: '',
            sendOption: 'now',
            name: '',
        },
    });

    const destinationType = form.watch('destinationType');
    const templateId = form.watch('templateId');
    const sendOption = form.watch('sendOption');

    // Queries — all return { success, data: T }
    const { data: templatesResponse } = useQuery({
        queryKey: ['whatsapp-templates-approved'],
        queryFn: () => whatsappApi.getApprovedTemplates(),
    });

    const { data: walletResponse } = useQuery({
        queryKey: ['wallet'],
        queryFn: () => walletApi.getWallet(),
    });

    const { data: groupsData } = useQuery({
        queryKey: ['groups'],
        queryFn: () => groupsApi.getAll({ limit: 100 }),
    });

    const { data: membersData } = useQuery({
        queryKey: ['members'],
        queryFn: () => membersApi.getAll({ churchId: user?.church_id, limit: 1000 }),
    });

    // Extract arrays from responses
    const templatesList = templatesResponse?.data || [];
    const groupsList = groupsData?.groups || [];
    const membersList = membersData?.members || [];
    const whatsappBalance = walletResponse?.data?.whatsapp_balance || 0;

    const selectedTemplate = templatesList.find((t) => t.id === templateId);

    // Mutation
    const composeMutation = useMutation({
        mutationFn: (data: ComposeWhatsAppData) => whatsappApi.compose(data),
        onSuccess: (response) => {
            const status = response.data.status;
            if (status === 'sent' || status === 'sending') {
                toast.success('WhatsApp messages sent successfully!');
                navigate('/whatsapp/sent');
            } else if (status === 'scheduled') {
                toast.success('WhatsApp campaign scheduled successfully!');
                navigate('/whatsapp/scheduled');
            } else {
                toast.success('Draft saved successfully!');
                navigate('/whatsapp/drafts');
            }
        },
        onError: (error: unknown) => {
            const errorMessage =
                error instanceof Error ? error.message : 'Failed to send messages';
            toast.error(errorMessage);
        },
    });

    // Calculate recipient count
    const getRecipientCount = (): number => {
        switch (destinationType) {
            case 'all_contacts':
                return membersList.filter((m) => m.phone).length;
            case 'groups':
                return selectedGroups.reduce((count, groupId) => {
                    const group = groupsList.find((g) => g.id === groupId);
                    return count + (group?.member_count || 0);
                }, 0);
            case 'members':
                return selectedMembers.length;
            case 'phone_numbers': {
                const phones = form.getValues('phoneNumbers');
                return phones?.split(',').filter((p) => p.trim()).length || 0;
            }
            case 'uploaded':
                return uploadedContacts.length;
            default:
                return 0;
        }
    };

    const recipientCount = getRecipientCount();

    // Handle file upload
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            complete: (results) => {
                const contacts: Array<{ phone: string; name?: string }> = [];
                results.data.forEach((row: any) => {
                    const phone =
                        row.phone || row.Phone || row.phone_number || row['Phone Number'];
                    const name =
                        row.name || row.Name || row.full_name || row['Full Name'];
                    if (phone) {
                        contacts.push({ phone: phone.toString().trim(), name });
                    }
                });
                setUploadedContacts(contacts);
                toast.success(`Imported ${contacts.length} contacts`);
            },
            error: () => {
                toast.error('Failed to parse file');
            },
        });
    };

    // Handle form submit
    const onSubmit = (data: FormData) => {
        if (!data.templateId) {
            toast.error('Please select a template');
            return;
        }

        // Build scheduled datetime
        let scheduledAt: string | undefined;
        if (data.sendOption === 'schedule' && data.scheduledAt && data.scheduledTime) {
            const [hours, minutes] = data.scheduledTime.split(':');
            const scheduled = new Date(data.scheduledAt);
            scheduled.setHours(parseInt(hours), parseInt(minutes));
            scheduledAt = scheduled.toISOString();
        }

        // Parse phone numbers
        let phoneNumbers: string[] | undefined;
        if (data.destinationType === 'phone_numbers' && data.phoneNumbers) {
            phoneNumbers = data.phoneNumbers
                .split(',')
                .map((p) => p.trim())
                .filter(Boolean);
        }

        const submitData: ComposeWhatsAppData = {
            destinationType: data.destinationType,
            templateId: data.templateId,
            sendOption: data.sendOption,
            ...(data.destinationType === 'groups' && selectedGroups.length > 0
                ? { groupIds: selectedGroups }
                : {}),
            ...(data.destinationType === 'members' && selectedMembers.length > 0
                ? { memberIds: selectedMembers }
                : {}),
            ...(phoneNumbers ? { phoneNumbers } : {}),
            ...(data.destinationType === 'uploaded' && uploadedContacts.length > 0
                ? { uploadedContacts }
                : {}),
            ...(Object.keys(templateVariables).length > 0
                ? { templateVariables }
                : {}),
            ...(scheduledAt ? { scheduledAt } : {}),
            ...(data.name ? { name: data.name } : {}),
        };

        composeMutation.mutate(submitData);
    };

    // Extract variables from template
    const getTemplateVariables = (template?: WhatsAppTemplate): string[] => {
        if (!template) return [];
        const regex = /{{(\d+)}}/g;
        const matches = template.body_text.match(regex) || [];
        return [...new Set(matches)].map((m) => m.replace(/[{}]/g, ''));
    };

    const templateVars = getTemplateVariables(selectedTemplate);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5 text-green-500" />
                            Compose WhatsApp Message
                        </CardTitle>
                        <CardDescription>
                            Send WhatsApp messages using approved templates
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="space-y-6"
                            >
                                {/* Campaign Name */}
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Campaign Name (Optional)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g., Sunday Reminder"
                                                    {...field}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                {/* Template Selection */}
                                <FormField
                                    control={form.control}
                                    name="templateId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Select Template *</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Choose a template" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {templatesList.map((template) => (
                                                        <SelectItem
                                                            key={template.id}
                                                            value={template.id}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span>{template.name}</span>
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-xs"
                                                                >
                                                                    {template.category}
                                                                </Badge>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>
                                                Only Meta-approved templates can be used
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Template Variables */}
                                {templateVars.length > 0 && (
                                    <div className="space-y-3">
                                        <Label>Template Variables</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {templateVars.map((varNum) => (
                                                <div key={varNum} className="space-y-1">
                                                    <Label className="text-sm text-muted-foreground">
                                                        Variable {`{{${varNum}}}`}
                                                    </Label>
                                                    <Input
                                                        placeholder={
                                                            varNum === '1'
                                                                ? 'e.g., Member name'
                                                                : `Value for {{${varNum}}}`
                                                        }
                                                        value={templateVariables[varNum] || ''}
                                                        onChange={(e) =>
                                                            setTemplateVariables({
                                                                ...templateVariables,
                                                                [varNum]: e.target.value,
                                                            })
                                                        }
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Variable {`{{1}}`} will be auto-filled with
                                            recipient name if left empty
                                        </p>
                                    </div>
                                )}

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
                                                    className="grid grid-cols-2 md:grid-cols-5 gap-4"
                                                >
                                                    {[
                                                        { value: 'all_contacts', label: 'All Contacts', icon: Users },
                                                        { value: 'groups', label: 'Groups', icon: Users },
                                                        { value: 'members', label: 'Members', icon: User },
                                                        { value: 'phone_numbers', label: 'Numbers', icon: Phone },
                                                        { value: 'uploaded', label: 'Upload', icon: Upload },
                                                    ].map((option) => (
                                                        <div key={option.value}>
                                                            <RadioGroupItem
                                                                value={option.value}
                                                                id={option.value}
                                                                className="peer sr-only"
                                                            />
                                                            <Label
                                                                htmlFor={option.value}
                                                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-green-500 cursor-pointer"
                                                            >
                                                                <option.icon className="mb-2 h-6 w-6" />
                                                                <span className="text-sm">
                                                                    {option.label}
                                                                </span>
                                                            </Label>
                                                        </div>
                                                    ))}
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
                                                        id={`grp-${group.id}`}
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
                                                        htmlFor={`grp-${group.id}`}
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
                                                .filter((m) => m.phone)
                                                .map((member) => (
                                                    <div
                                                        key={member.id}
                                                        className="flex items-center space-x-2 py-1"
                                                    >
                                                        <Checkbox
                                                            id={`mem-${member.id}`}
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
                                                                            (id) =>
                                                                                id !== member.id
                                                                        )
                                                                    );
                                                                }
                                                            }}
                                                        />
                                                        <Label
                                                            htmlFor={`mem-${member.id}`}
                                                            className="text-sm cursor-pointer"
                                                        >
                                                            {member.first_name}{' '}
                                                            {member.last_name} - {member.phone}
                                                        </Label>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}

                                {/* Phone Numbers */}
                                {destinationType === 'phone_numbers' && (
                                    <FormField
                                        control={form.control}
                                        name="phoneNumbers"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone Numbers</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder={
                                                            'Enter phone numbers separated by commas\ne.g., 08012345678, 08087654321'
                                                        }
                                                        className="min-h-[100px]"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {/* Upload */}
                                {destinationType === 'uploaded' && (
                                    <div className="space-y-4">
                                        <div className="border-2 border-dashed rounded-lg p-6 text-center">
                                            <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                                            <Label
                                                htmlFor="wa-file-upload"
                                                className="cursor-pointer"
                                            >
                                                <span className="text-green-600 font-medium">
                                                    Upload CSV file
                                                </span>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    CSV should have &apos;phone&apos; and
                                                    optionally &apos;name&apos; columns
                                                </p>
                                            </Label>
                                            <Input
                                                id="wa-file-upload"
                                                type="file"
                                                accept=".csv"
                                                className="hidden"
                                                onChange={handleFileUpload}
                                            />
                                        </div>
                                        {uploadedContacts.length > 0 && (
                                            <Badge variant="secondary">
                                                {uploadedContacts.length} contacts uploaded
                                            </Badge>
                                        )}
                                    </div>
                                )}

                                <Separator />

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
                                                        <RadioGroupItem
                                                            value="now"
                                                            id="wa-now"
                                                        />
                                                        <Label
                                                            htmlFor="wa-now"
                                                            className="flex items-center gap-2 cursor-pointer"
                                                        >
                                                            <Send className="h-4 w-4" />
                                                            Send Now
                                                        </Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem
                                                            value="schedule"
                                                            id="wa-schedule"
                                                        />
                                                        <Label
                                                            htmlFor="wa-schedule"
                                                            className="flex items-center gap-2 cursor-pointer"
                                                        >
                                                            <Clock className="h-4 w-4" />
                                                            Schedule
                                                        </Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem
                                                            value="draft"
                                                            id="wa-draft"
                                                        />
                                                        <Label
                                                            htmlFor="wa-draft"
                                                            className="flex items-center gap-2 cursor-pointer"
                                                        >
                                                            <Save className="h-4 w-4" />
                                                            Save Draft
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
                                                                        format(
                                                                            field.value,
                                                                            'PPP'
                                                                        )
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

                                {/* Submit */}
                                <div className="flex justify-end gap-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => navigate('/whatsapp')}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={composeMutation.isPending}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        {composeMutation.isPending ? (
                                            'Processing...'
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

            {/* Summary & Preview */}
            <div className="space-y-4">
                {/* Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle>Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Recipients</span>
                            <span className="font-medium">{recipientCount}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Cost per message</span>
                            <span className="font-medium">₦4.50</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Cost</span>
                            <span className="font-bold">
                                ₦{(recipientCount * 4.5).toLocaleString()}
                            </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Available Units</span>
                            <span className="font-medium">{whatsappBalance}</span>
                        </div>
                        {recipientCount > whatsappBalance && (
                            <div className="flex items-center gap-2 text-destructive text-sm">
                                <AlertCircle className="h-4 w-4" />
                                <span>Insufficient units</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Template Preview */}
                {selectedTemplate && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Template Preview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-[#e5ddd5] rounded-lg p-4">
                                <div className="bg-white rounded-lg p-3 shadow max-w-[280px]">
                                    {/* Header */}
                                    {selectedTemplate.header_type === 'text' &&
                                        selectedTemplate.header_content && (
                                            <p className="font-bold mb-2">
                                                {selectedTemplate.header_content}
                                            </p>
                                        )}
                                    {selectedTemplate.header_type === 'image' && (
                                        <div className="bg-gray-200 h-32 rounded mb-2 flex items-center justify-center">
                                            <Image className="h-8 w-8 text-gray-400" />
                                        </div>
                                    )}
                                    {selectedTemplate.header_type === 'video' && (
                                        <div className="bg-gray-200 h-32 rounded mb-2 flex items-center justify-center">
                                            <Video className="h-8 w-8 text-gray-400" />
                                        </div>
                                    )}
                                    {selectedTemplate.header_type === 'document' && (
                                        <div className="bg-gray-100 p-3 rounded mb-2 flex items-center gap-2">
                                            <File className="h-6 w-6 text-gray-500" />
                                            <span className="text-sm">Document</span>
                                        </div>
                                    )}

                                    {/* Body */}
                                    <p className="text-sm whitespace-pre-wrap">
                                        {selectedTemplate.body_text.replace(
                                            /{{(\d+)}}/g,
                                            (_match, num) =>
                                                templateVariables[num] ||
                                                `[Variable ${num}]`
                                        )}
                                    </p>

                                    {/* Footer */}
                                    {selectedTemplate.footer_text && (
                                        <p className="text-xs text-gray-500 mt-2">
                                            {selectedTemplate.footer_text}
                                        </p>
                                    )}

                                    {/* Buttons */}
                                    {selectedTemplate.buttons &&
                                        selectedTemplate.buttons.length > 0 && (
                                            <div className="mt-3 space-y-1">
                                                {selectedTemplate.buttons.map(
                                                    (btn: any, idx: number) => (
                                                        <div
                                                            key={idx}
                                                            className="text-center text-sm text-blue-500 py-2 border-t"
                                                        >
                                                            {btn.text || btn.label}
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}