// src/pages/sms/ComposeSms.tsx
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card.tsx';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form.tsx';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select.tsx';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command.tsx';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { Button } from '@/components/ui/button.tsx';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Calendar } from '@/components/ui/calendar.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog.tsx';
import { cn } from '@/lib/utils.ts';
import { format } from 'date-fns';
import {
    Send,
    Save,
    Clock,
    CalendarIcon,
    Upload,
    Plus,
    Users,
    User,
    Phone,
    FileSpreadsheet,
    AlertCircle,
    Info,
    ChevronsUpDown,
    Check,
    X,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    BookUser,
    ListPlus,
    Hash,
    MessageSquare,
    Zap,
} from 'lucide-react';
import { smsApi, ComposeSmsData } from '@/services/smsApi';
import { membersApi } from '@/lib/api';
import { groupsApi } from '@/lib/api';
import Papa from 'papaparse';
import { useAuth } from '@/contexts/AuthContext.tsx';

// ============================================================================
// FORM SCHEMA
// ============================================================================

const formSchema = z.object({
    destinationType: z.enum(['contacts', 'groups', 'members', 'phone_numbers', 'uploaded']),
    contactListIds: z.array(z.string()).optional(),
    selectAllContacts: z.boolean().optional(),
    groupIds: z.array(z.string()).optional(),
    memberIds: z.array(z.string()).optional(),
    phoneNumbers: z.string().optional(),
    senderId: z.string().optional(),
    message: z.string().min(1, 'Message is required').max(1600, 'Message too long'),
    sendOption: z.enum(['now', 'schedule', 'draft']),
    scheduledAt: z.date().optional(),
    scheduledTime: z.string().optional(),
    name: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

// ============================================================================
// MULTI-SELECT DROPDOWN COMPONENT
// ============================================================================

interface MultiSelectOption {
    value: string;
    label: string;
    sublabel?: string;
    icon?: React.ReactNode;
}

interface MultiSelectDropdownProps {
    options: MultiSelectOption[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    className?: string;
    disabled?: boolean;
}

function MultiSelectDropdown({
                                 options,
                                 selected,
                                 onChange,
                                 placeholder = 'Select items...',
                                 searchPlaceholder = 'Search...',
                                 emptyMessage = 'No items found.',
                                 className,
                                 disabled = false,
                             }: MultiSelectDropdownProps) {
    const [open, setOpen] = useState(false);

    const toggleItem = (value: string) => {
        if (selected.includes(value)) {
            onChange(selected.filter((v) => v !== value));
        } else {
            onChange([...selected, value]);
        }
    };

    const removeItem = (value: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(selected.filter((v) => v !== value));
    };

    const clearAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange([]);
    };

    const selectAll = () => {
        onChange(options.map((o) => o.value));
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        'w-full justify-between font-normal min-h-[40px] h-auto',
                        !selected.length && 'text-muted-foreground',
                        className
                    )}
                >
                    <div className="flex flex-wrap gap-1 flex-1 items-center">
                        {selected.length === 0 ? (
                            <span>{placeholder}</span>
                        ) : selected.length <= 3 ? (
                            selected.map((val) => {
                                const option = options.find((o) => o.value === val);
                                return (
                                    <Badge
                                        key={val}
                                        variant="secondary"
                                        className="text-xs px-2 py-0.5 flex items-center gap-1"
                                    >
                                        {option?.label || val}
                                        <X
                                            className="h-3 w-3 cursor-pointer hover:text-destructive"
                                            onClick={(e) => removeItem(val, e)}
                                        />
                                    </Badge>
                                );
                            })
                        ) : (
                            <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                {selected.length} selected
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-1 ml-2 shrink-0">
                        {selected.length > 0 && (
                            <X
                                className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer"
                                onClick={clearAll}
                            />
                        )}
                        <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyMessage}</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-y-auto">
                            {options.map((option) => {
                                const isSelected = selected.includes(option.value);
                                return (
                                    <CommandItem
                                        key={option.value}
                                        value={option.label}
                                        onSelect={() => toggleItem(option.value)}
                                        className="cursor-pointer"
                                    >
                                        <div
                                            className={cn(
                                                'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                                isSelected
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'opacity-50 [&_svg]:invisible'
                                            )}
                                        >
                                            <Check className="h-3 w-3" />
                                        </div>
                                        <div className="flex flex-col flex-1">
                                            <span className="text-sm">{option.label}</span>
                                            {option.sublabel && (
                                                <span className="text-xs text-muted-foreground">
                                                    {option.sublabel}
                                                </span>
                                            )}
                                        </div>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
                {options.length > 0 && (
                    <div className="border-t p-2 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                            {selected.length} of {options.length} selected
                        </span>
                        <div className="flex gap-1">
                            {selected.length < options.length && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={selectAll}
                                >
                                    Select all
                                </Button>
                            )}
                            {selected.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => onChange([])}
                                >
                                    Clear all
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}

// ============================================================================
// CREATE SENDER ID MODAL COMPONENT
// ============================================================================

interface CreateSenderIdModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

function CreateSenderIdModal({ open, onOpenChange, onSuccess }: CreateSenderIdModalProps) {
    const [senderId, setSenderId] = useState('');
    const [useCase, setUseCase] = useState('');
    const [senderIdError, setSenderIdError] = useState('');
    const queryClient = useQueryClient();

    const isValid = senderId.length >= 3 && senderId.length <= 11 && !senderIdError && useCase.trim().length > 0;

    const requestMutation = useMutation({
        mutationFn: async () => {
            const result = await smsApi.requestSenderId(senderId, useCase);
            return result;
        },
        onSuccess: (data) => {
            toast.success(
                <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-medium">Sender ID Requested!</p>
                        <p className="text-sm text-muted-foreground">
                            "{senderId}" has been submitted for approval.
                        </p>
                    </div>
                </div>
            );
            setSenderId('');
            setUseCase('');
            setSenderIdError('');
            onOpenChange(false);
            queryClient.invalidateQueries({ queryKey: ['sender-ids-approved'] });
            queryClient.invalidateQueries({ queryKey: ['sender-ids'] });
            onSuccess?.();
        },
        onError: (error: any) => {
            const errorMessage = error.response?.data?.message
                || error.message
                || 'Failed to request sender ID';
            toast.error(errorMessage);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;
        requestMutation.mutate();
    };

    const validateSenderId = (value: string): string => {
        if (!value) return '';
        if (value.length < 3) return 'Minimum 3 characters';
        if (value.length > 11) return 'Maximum 11 characters';
        if (!/^[A-Za-z0-9]+$/.test(value)) return 'Only letters and numbers allowed';
        return '';
    };

    const handleSenderIdChange = (value: string) => {
        const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
        setSenderId(cleaned);
        setSenderIdError(validateSenderId(cleaned));
    };

    const handleClose = () => {
        if (!requestMutation.isPending) {
            setSenderId('');
            setUseCase('');
            setSenderIdError('');
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        Request New Sender ID
                    </DialogTitle>
                    <DialogDescription>
                        A Sender ID is the name that appears as the sender when your recipients receive
                        your SMS. It requires carrier approval which typically takes 24-48 hours.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                    <div className="space-y-2">
                        <Label htmlFor="sender-id-input">
                            Sender ID <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                            <Input
                                id="sender-id-input"
                                value={senderId}
                                onChange={(e) => handleSenderIdChange(e.target.value)}
                                placeholder="e.g., MYCHURCH"
                                maxLength={11}
                                className={cn(
                                    'pr-16 font-mono text-lg tracking-wider',
                                    senderIdError && senderId && 'border-destructive focus-visible:ring-destructive'
                                )}
                                autoFocus
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                {senderId.length}/11
                            </span>
                        </div>
                        {senderIdError && senderId ? (
                            <p className="text-xs text-destructive flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {senderIdError}
                            </p>
                        ) : (
                            <p className="text-xs text-muted-foreground">
                                3-11 alphanumeric characters only. No spaces or special characters.
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="use-case-input">
                            Purpose / Use Case <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={useCase}
                            onValueChange={setUseCase}
                            disabled={requestMutation.isPending}
                        >
                            <SelectTrigger id="use-case-input">
                                <SelectValue placeholder="Select the purpose of this Sender ID" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Church communication and member engagement">
                                    Church Communication & Member Engagement
                                </SelectItem>
                                <SelectItem value="Event notifications and reminders">
                                    Event Notifications & Reminders
                                </SelectItem>
                                <SelectItem value="Service and program announcements">
                                    Service & Program Announcements
                                </SelectItem>
                                <SelectItem value="Transactional messages and confirmations">
                                    Transactional Messages & Confirmations
                                </SelectItem>
                                <SelectItem value="Donation and giving receipts">
                                    Donation & Giving Receipts
                                </SelectItem>
                                <SelectItem value="Prayer group and small group coordination">
                                    Prayer & Small Group Coordination
                                </SelectItem>
                                <SelectItem value="General organizational updates">
                                    General Organizational Updates
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            This helps carriers understand how the Sender ID will be used.
                        </p>
                    </div>

                    {senderId.length >= 3 && (
                        <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Preview
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <Phone className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">{senderId}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Your SMS will appear from this name
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3">
                        <div className="flex gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                            <div className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
                                <p className="font-medium">Important Notes:</p>
                                <ul className="list-disc pl-4 space-y-0.5">
                                    <li>Approval typically takes 24-48 hours</li>
                                    <li>Some carriers may reject generic or misleading names</li>
                                    <li>Use your church or organization name for best results</li>
                                    <li>You can have multiple Sender IDs for different purposes</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={requestMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!isValid || requestMutation.isPending}
                        >
                            {requestMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Request Sender ID
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ComposeSms() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [uploadedContacts, setUploadedContacts] = useState<Array<{ phone: string; name?: string }>>([]);
    const [showSenderIdDialog, setShowSenderIdDialog] = useState(false);
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [selectedContactLists, setSelectedContactLists] = useState<string[]>([]);
    const [selectAllContacts, setSelectAllContacts] = useState(false);
    const { user } = useAuth();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            destinationType: 'contacts',
            contactListIds: [],
            selectAllContacts: false,
            groupIds: [],
            memberIds: [],
            phoneNumbers: '',
            message: '',
            sendOption: 'now',
            name: '',
        },
    });

    const destinationType = form.watch('destinationType');
    const message = form.watch('message');
    const sendOption = form.watch('sendOption');

    // ========================================================================
    // QUERIES
    // ========================================================================

    const { data: senderIds, refetch: refetchSenderIds } = useQuery({
        queryKey: ['sender-ids-approved'],
        queryFn: () => smsApi.getApprovedSenderIds(),
    });

    const { data: balance } = useQuery({
        queryKey: ['sms-balance'],
        queryFn: () => smsApi.getBalance(),
    });

    const { data: groups } = useQuery({
        queryKey: ['groups'],
        queryFn: () => groupsApi.getAll({ limit: 100 }),
    });

    const { data: members } = useQuery({
        queryKey: ['members'],
        queryFn: () => membersApi.getAll({ limit: 1000 }),
    });

    const { data: contactLists } = useQuery({
        queryKey: ['sms-contact-lists'],
        queryFn: () => smsApi.getContactLists(),
    });

    // ========================================================================
    // BUILD DROPDOWN OPTIONS
    // ========================================================================

    const groupOptions: MultiSelectOption[] = useMemo(() => {
        const groupList = groups?.groups || groups?.data?.groups || groups?.data || [];
        if (!Array.isArray(groupList)) return [];
        return groupList.map((group: any) => ({
            value: group.id,
            label: group.name,
            sublabel: `${group.member_count || 0} members`,
        }));
    }, [groups]);

    const memberOptions: MultiSelectOption[] = useMemo(() => {
        const memberList = members?.members || members?.data?.members || members?.data || [];
        if (!Array.isArray(memberList)) return [];
        return memberList
            .filter((m: any) => m.phone)
            .map((member: any) => ({
                value: member.id,
                label: `${member.first_name} ${member.last_name}`,
                sublabel: member.phone,
            }));
    }, [members]);

    const contactListOptions: MultiSelectOption[] = useMemo(() => {
        if (!contactLists || !Array.isArray(contactLists)) return [];
        return contactLists.map((list: any) => ({
            value: list.id,
            label: list.name,
            sublabel: `${list.contact_count || 0} contacts`,
        }));
    }, [contactLists]);

    // ========================================================================
    // MUTATIONS
    // ========================================================================

    const composeMutation = useMutation({
        mutationFn: (data: ComposeSmsData) => smsApi.compose(data),
        onSuccess: (response) => {
            const status = response.data?.data?.status || response.data?.status;
            if (status === 'sent' || status === 'sending') {
                toast.success('SMS sent successfully!');
                navigate('/sms/sent');
            } else if (status === 'scheduled') {
                toast.success('SMS scheduled successfully!');
                navigate('/sms/scheduled');
            } else {
                toast.success('Draft saved successfully!');
                navigate('/sms/drafts');
            }
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to send SMS');
        },
    });

    // ========================================================================
    // CALCULATIONS
    // ========================================================================

    const messageLength = message?.length || 0;
    const smsCount = Math.ceil(messageLength / 160) || 1;
    const remainingChars = messageLength === 0 ? 160 : 160 - (messageLength % 160 || 160);

    const getRecipientCount = (): number => {
        switch (destinationType) {
            case 'contacts': {
                if (selectAllContacts) {
                    // Sum all contact lists
                    if (!contactLists || !Array.isArray(contactLists)) return 0;
                    return contactLists.reduce((sum: number, list: any) => sum + (list.contact_count || 0), 0);
                }
                // Sum selected contact lists
                return selectedContactLists.reduce((count, listId) => {
                    const list = contactListOptions.find((l) => l.value === listId);
                    const contactCount = list?.sublabel ? parseInt(list.sublabel) || 0 : 0;
                    return count + contactCount;
                }, 0);
            }
            case 'groups':
                return selectedGroups.reduce((count, groupId) => {
                    const group = groupOptions.find((g) => g.value === groupId);
                    const memberCount = group?.sublabel ? parseInt(group.sublabel) || 0 : 0;
                    return count + memberCount;
                }, 0);
            case 'members':
                return selectedMembers.length;
            case 'phone_numbers': {
                const phones = form.getValues('phoneNumbers');
                return phones?.split(/[,\n]/).filter((p) => p.trim()).length || 0;
            }
            case 'uploaded':
                return uploadedContacts.length;
            default:
                return 0;
        }
    };

    const recipientCount = getRecipientCount();
    const totalUnits = recipientCount * smsCount;
    const availableUnits = balance?.termii?.balance || balance?.local || 0;

    // ========================================================================
    // HANDLERS
    // ========================================================================

    const handleSelectAllContacts = (checked: boolean) => {
        setSelectAllContacts(checked);
        if (checked) {
            setSelectedContactLists(contactListOptions.map((o) => o.value));
        } else {
            setSelectedContactLists([]);
        }
    };

    const handleContactListChange = (selected: string[]) => {
        setSelectedContactLists(selected);
        // Update selectAllContacts checkbox state
        if (selected.length === contactListOptions.length && contactListOptions.length > 0) {
            setSelectAllContacts(true);
        } else {
            setSelectAllContacts(false);
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            complete: (results) => {
                const contacts: Array<{ phone: string; name?: string }> = [];
                results.data.forEach((row: any) => {
                    const phone = row.phone || row.Phone || row.phone_number || row['Phone Number'];
                    const name = row.name || row.Name || row.full_name || row['Full Name'];
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

        event.target.value = '';
    };

    // ========================================================================
    // FORM SUBMIT
    // ========================================================================

    const onSubmit = (data: FormData) => {
        // Validate recipients
        if (data.destinationType === 'contacts' && !selectAllContacts && selectedContactLists.length === 0) {
            toast.error('Please select at least one contact list or check "Select all contacts"');
            return;
        }
        if (data.destinationType === 'groups' && selectedGroups.length === 0) {
            toast.error('Please select at least one group');
            return;
        }
        if (data.destinationType === 'members' && selectedMembers.length === 0) {
            toast.error('Please select at least one member');
            return;
        }
        if (data.destinationType === 'phone_numbers') {
            const phones = data.phoneNumbers?.split(/[,\n]/).filter((p) => p.trim());
            if (!phones || phones.length === 0) {
                toast.error('Please enter at least one phone number');
                return;
            }
        }
        if (data.destinationType === 'uploaded' && uploadedContacts.length === 0) {
            toast.error('Please upload a CSV file with contacts');
            return;
        }

        let scheduledAt: string | undefined;
        if (data.sendOption === 'schedule' && data.scheduledAt && data.scheduledTime) {
            const [hours, minutes] = data.scheduledTime.split(':');
            const scheduled = new Date(data.scheduledAt);
            scheduled.setHours(parseInt(hours), parseInt(minutes));
            scheduledAt = scheduled.toISOString();
        }

        let phoneNumbers: string[] | undefined;
        if (data.destinationType === 'phone_numbers' && data.phoneNumbers) {
            phoneNumbers = data.phoneNumbers
                .split(/[,\n]/)
                .map((p) => p.trim())
                .filter(Boolean);
        }

        const submitData: ComposeSmsData = {
            destinationType: data.destinationType, // Keep as-is, don't convert
            contactListIds: data.destinationType === 'contacts'
                ? (selectAllContacts ? contactListOptions.map((o) => o.value) : selectedContactLists)
                : undefined,
            selectAllContacts: data.destinationType === 'contacts' ? selectAllContacts : undefined,
            groupIds: data.destinationType === 'groups' ? selectedGroups : undefined,
            memberIds: data.destinationType === 'members' ? selectedMembers : undefined,
            phoneNumbers,
            uploadedContacts: data.destinationType === 'uploaded' ? uploadedContacts : undefined,
            senderId: data.senderId,
            message: data.message,
            sendOption: data.sendOption,
            scheduledAt,
            name: data.name,
        };

        composeMutation.mutate(submitData);
    };

    // ========================================================================
    // DESTINATION TYPE CONFIG
    // ========================================================================

    const destinationTypes = [
        {
            value: 'contacts',
            label: 'Contacts',
            icon: BookUser,
            description: 'Send to contact lists',
        },
        {
            value: 'groups',
            label: 'Groups',
            icon: Users,
            description: 'Send to church groups',
        },
        {
            value: 'members',
            label: 'Members',
            icon: User,
            description: 'Select individual members',
        },
        {
            value: 'phone_numbers',
            label: 'Numbers',
            icon: Hash,
            description: 'Enter phone numbers',
        },
        {
            value: 'uploaded',
            label: 'Upload',
            icon: Upload,
            description: 'Upload CSV file',
        },
    ];

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <MessageSquare className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Compose SMS</CardTitle>
                                <CardDescription>Create and send SMS messages to your contacts</CardDescription>
                            </div>
                        </div>
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
                                            <FormLabel>Campaign Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g., Sunday Service Reminder"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Optional. Helps you identify this message later.
                                            </FormDescription>
                                        </FormItem>
                                    )}
                                />

                                <Separator />

                                {/* Destination Type */}
                                <FormField
                                    control={form.control}
                                    name="destinationType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-base font-semibold">Recipients</FormLabel>
                                            <FormDescription className="mb-3">
                                                Choose how you want to select your recipients
                                            </FormDescription>
                                            <FormControl>
                                                <RadioGroup
                                                    onValueChange={(val) => {
                                                        field.onChange(val);
                                                        // Reset other selections when switching
                                                        if (val !== 'contacts') {
                                                            setSelectedContactLists([]);
                                                            setSelectAllContacts(false);
                                                        }
                                                        if (val !== 'groups') setSelectedGroups([]);
                                                        if (val !== 'members') setSelectedMembers([]);
                                                        if (val !== 'uploaded') setUploadedContacts([]);
                                                    }}
                                                    defaultValue={field.value}
                                                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3"
                                                >
                                                    {destinationTypes.map((type) => {
                                                        const Icon = type.icon;
                                                        return (
                                                            <div key={type.value}>
                                                                <RadioGroupItem
                                                                    value={type.value}
                                                                    id={type.value}
                                                                    className="peer sr-only"
                                                                />
                                                                <Label
                                                                    htmlFor={type.value}
                                                                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                                                                >
                                                                    <Icon className="mb-2 h-5 w-5" />
                                                                    <span className="text-xs font-medium text-center">
                                                                        {type.label}
                                                                    </span>
                                                                </Label>
                                                            </div>
                                                        );
                                                    })}
                                                </RadioGroup>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                {/* ============================================================ */}
                                {/* CONTACTS - Contact Lists with Select All + Create New */}
                                {/* ============================================================ */}
                                {destinationType === 'contacts' && (
                                    <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-semibold">Contact Lists</h4>
                                                <p className="text-xs text-muted-foreground">
                                                    Select which contact lists to send to
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => navigate('/sms/contacts')}
                                                className="shrink-0"
                                            >
                                                <Plus className="h-3.5 w-3.5 mr-1.5" />
                                                New List
                                            </Button>
                                        </div>

                                        {contactListOptions.length === 0 ? (
                                            <div className="text-center py-6 rounded-lg border border-dashed bg-background">
                                                <BookUser className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                                                <p className="text-sm font-medium mb-1">No Contact Lists</p>
                                                <p className="text-xs text-muted-foreground mb-4">
                                                    Create a contact list first to send messages
                                                </p>
                                                <Button
                                                    type="button"
                                                    variant="default"
                                                    size="sm"
                                                    onClick={() => navigate('/sms/contacts')}
                                                >
                                                    <ListPlus className="h-4 w-4 mr-2" />
                                                    Create Contact List
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Select All Checkbox */}
                                                <div className="flex items-center space-x-3 rounded-md border bg-background px-4 py-3">
                                                    <Checkbox
                                                        id="select-all-contacts"
                                                        checked={selectAllContacts}
                                                        onCheckedChange={(checked) =>
                                                            handleSelectAllContacts(checked as boolean)
                                                        }
                                                    />
                                                    <div className="flex-1">
                                                        <Label
                                                            htmlFor="select-all-contacts"
                                                            className="text-sm font-medium cursor-pointer"
                                                        >
                                                            Select all contact lists
                                                        </Label>
                                                        <p className="text-xs text-muted-foreground">
                                                            Send to all {contactListOptions.length} list{contactListOptions.length !== 1 ? 's' : ''} (
                                                            {contactLists && Array.isArray(contactLists)
                                                                ? contactLists.reduce((sum: number, l: any) => sum + (l.contact_count || 0), 0)
                                                                : 0}{' '}
                                                            total contacts)
                                                        </p>
                                                    </div>
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                </div>

                                                {/* Or select specific lists */}
                                                {!selectAllContacts && (
                                                    <>
                                                        <div className="flex items-center gap-3">
                                                            <Separator className="flex-1" />
                                                            <span className="text-xs text-muted-foreground font-medium">
                                                                OR select specific lists
                                                            </span>
                                                            <Separator className="flex-1" />
                                                        </div>

                                                        <MultiSelectDropdown
                                                            options={contactListOptions}
                                                            selected={selectedContactLists}
                                                            onChange={handleContactListChange}
                                                            placeholder="Choose contact lists..."
                                                            searchPlaceholder="Search contact lists..."
                                                            emptyMessage="No contact lists found."
                                                        />
                                                    </>
                                                )}

                                                {/* Selected summary */}
                                                {(selectAllContacts || selectedContactLists.length > 0) && (
                                                    <div className="flex items-center gap-2 text-sm text-primary bg-primary/5 rounded-md px-3 py-2">
                                                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                                                        <span>
                                                            {selectAllContacts
                                                                ? `All ${contactListOptions.length} list${contactListOptions.length !== 1 ? 's' : ''} selected`
                                                                : `${selectedContactLists.length} list${selectedContactLists.length !== 1 ? 's' : ''} selected`}
                                                            {' — '}
                                                            {recipientCount} recipient{recipientCount !== 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* ============================================================ */}
                                {/* GROUPS - Multi-Select */}
                                {/* ============================================================ */}
                                {destinationType === 'groups' && (
                                    <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                                        <div>
                                            <h4 className="text-sm font-semibold">Select Groups</h4>
                                            <p className="text-xs text-muted-foreground">
                                                Choose one or more groups to send to
                                            </p>
                                        </div>
                                        <MultiSelectDropdown
                                            options={groupOptions}
                                            selected={selectedGroups}
                                            onChange={setSelectedGroups}
                                            placeholder="Choose groups..."
                                            searchPlaceholder="Search groups..."
                                            emptyMessage="No groups found."
                                        />
                                        {selectedGroups.length > 0 && (
                                            <div className="flex items-center gap-2 text-sm text-primary bg-primary/5 rounded-md px-3 py-2">
                                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                                <span>
                                                    {selectedGroups.length} group{selectedGroups.length !== 1 ? 's' : ''} selected
                                                    {' — '}~{recipientCount} recipient{recipientCount !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ============================================================ */}
                                {/* MEMBERS - Multi-Select */}
                                {/* ============================================================ */}
                                {destinationType === 'members' && (
                                    <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                                        <div>
                                            <h4 className="text-sm font-semibold">Select Members</h4>
                                            <p className="text-xs text-muted-foreground">
                                                Choose individual members to send to (only members with phone numbers are shown)
                                            </p>
                                        </div>
                                        <MultiSelectDropdown
                                            options={memberOptions}
                                            selected={selectedMembers}
                                            onChange={setSelectedMembers}
                                            placeholder="Choose members..."
                                            searchPlaceholder="Search by name or phone..."
                                            emptyMessage="No members with phone numbers found."
                                        />
                                        {selectedMembers.length > 0 && (
                                            <div className="flex items-center gap-2 text-sm text-primary bg-primary/5 rounded-md px-3 py-2">
                                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                                <span>
                                                    {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ============================================================ */}
                                {/* PHONE NUMBERS - Textarea */}
                                {/* ============================================================ */}
                                {destinationType === 'phone_numbers' && (
                                    <FormField
                                        control={form.control}
                                        name="phoneNumbers"
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                                                    <div>
                                                        <h4 className="text-sm font-semibold">Phone Numbers</h4>
                                                        <p className="text-xs text-muted-foreground">
                                                            Enter phone numbers separated by commas or new lines
                                                        </p>
                                                    </div>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder={'Enter phone numbers, one per line or comma-separated\n\ne.g.,\n+2348012345678\n+2349087654321\n\nor: +2348012345678, +2349087654321'}
                                                            className="min-h-[120px] bg-background font-mono text-sm"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    {field.value && (
                                                        <div className="flex items-center gap-2 text-sm text-primary bg-primary/5 rounded-md px-3 py-2">
                                                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                                                            <span>
                                                                {field.value.split(/[,\n]/).filter((p) => p.trim()).length} number{field.value.split(/[,\n]/).filter((p) => p.trim()).length !== 1 ? 's' : ''} entered
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {/* ============================================================ */}
                                {/* FILE UPLOAD */}
                                {/* ============================================================ */}
                                {destinationType === 'uploaded' && (
                                    <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                                        <div>
                                            <h4 className="text-sm font-semibold">Upload Contacts</h4>
                                            <p className="text-xs text-muted-foreground">
                                                Upload a CSV file with phone numbers
                                            </p>
                                        </div>
                                        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors bg-background">
                                            <FileSpreadsheet className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                                            <Label htmlFor="file-upload" className="cursor-pointer">
                                                <span className="text-primary font-medium hover:underline">
                                                    Click to upload CSV file
                                                </span>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    CSV should have a "phone" column and optionally a "name" column
                                                </p>
                                            </Label>
                                            <Input
                                                id="file-upload"
                                                type="file"
                                                accept=".csv"
                                                className="hidden"
                                                onChange={handleFileUpload}
                                            />
                                        </div>
                                        {uploadedContacts.length > 0 && (
                                            <div className="flex items-center justify-between bg-primary/5 rounded-md px-3 py-2">
                                                <div className="flex items-center gap-2 text-sm text-primary">
                                                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                                                    <span>{uploadedContacts.length} contacts uploaded</span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-xs"
                                                    onClick={() => setUploadedContacts([])}
                                                >
                                                    <X className="h-3 w-3 mr-1" />
                                                    Clear
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <Separator />

                                {/* Sender ID */}
                                <FormField
                                    control={form.control}
                                    name="senderId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Sender ID</FormLabel>
                                            <div className="flex gap-2">
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="flex-1">
                                                            <SelectValue placeholder="Select sender ID" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {(!senderIds || senderIds.length === 0) ? (
                                                            <div className="px-3 py-6 text-center">
                                                                <Phone className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                                                <p className="text-sm font-medium">No Sender IDs</p>
                                                                <p className="text-xs text-muted-foreground mt-1">
                                                                    Click the + button to request one
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            senderIds.map((sender: any) => (
                                                                <SelectItem key={sender.id} value={sender.sender_id || sender.id}>
                                                                    <span className="flex items-center gap-2">
                                                                        {sender.sender_id}
                                                                        {sender.is_default && (
                                                                            <Badge className="ml-1 text-[10px] px-1.5 py-0" variant="secondary">
                                                                                Default
                                                                            </Badge>
                                                                        )}
                                                                    </span>
                                                                </SelectItem>
                                                            ))
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => setShowSenderIdDialog(true)}
                                                    title="Request new Sender ID"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            {(!senderIds || senderIds.length === 0) && (
                                                <FormDescription className="flex items-center gap-1 text-amber-600">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    No approved sender IDs yet. Request one to send SMS.
                                                </FormDescription>
                                            )}
                                            <FormDescription>
                                                The name recipients will see as the message sender
                                            </FormDescription>
                                        </FormItem>
                                    )}
                                />

                                <CreateSenderIdModal
                                    open={showSenderIdDialog}
                                    onOpenChange={setShowSenderIdDialog}
                                    onSuccess={() => refetchSenderIds()}
                                />

                                {/* Message */}
                                <FormField
                                    control={form.control}
                                    name="message"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Message</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder={"Type your message here...\n\nUse #name to insert recipient's name"}
                                                    className="min-h-[150px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Info className="h-4 w-4" />
                                                    <span>
                                                        Use <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">#name</code> to personalize
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        messageLength > 1600 && 'text-destructive font-medium'
                                                    )}>
                                                        {messageLength}
                                                    </span>
                                                    <span>/160</span>
                                                    <span className="text-muted-foreground">•</span>
                                                    <span>{smsCount} SMS</span>
                                                    {messageLength > 0 && (
                                                        <>
                                                            <span className="text-muted-foreground">•</span>
                                                            <span>{remainingChars} left</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Separator />

                                {/* Send Options */}
                                <FormField
                                    control={form.control}
                                    name="sendOption"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-base font-semibold">Delivery</FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                    className="grid grid-cols-3 gap-3"
                                                >
                                                    <div>
                                                        <RadioGroupItem value="now" id="now" className="peer sr-only" />
                                                        <Label
                                                            htmlFor="now"
                                                            className="flex items-center gap-2 rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                                                        >
                                                            <Zap className="h-4 w-4 text-primary" />
                                                            <span className="text-sm font-medium">Send Now</span>
                                                        </Label>
                                                    </div>
                                                    <div>
                                                        <RadioGroupItem value="schedule" id="schedule" className="peer sr-only" />
                                                        <Label
                                                            htmlFor="schedule"
                                                            className="flex items-center gap-2 rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                                                        >
                                                            <Clock className="h-4 w-4 text-amber-500" />
                                                            <span className="text-sm font-medium">Schedule</span>
                                                        </Label>
                                                    </div>
                                                    <div>
                                                        <RadioGroupItem value="draft" id="draft" className="peer sr-only" />
                                                        <Label
                                                            htmlFor="draft"
                                                            className="flex items-center gap-2 rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                                                        >
                                                            <Save className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-sm font-medium">Draft</span>
                                                        </Label>
                                                    </div>
                                                </RadioGroup>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                {/* Schedule Date/Time */}
                                {sendOption === 'schedule' && (
                                    <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/20 p-4">
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
                                                                        'pl-3 text-left font-normal bg-background',
                                                                        !field.value && 'text-muted-foreground'
                                                                    )}
                                                                >
                                                                    {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="start">
                                                            <Calendar
                                                                mode="single"
                                                                selected={field.value}
                                                                onSelect={field.onChange}
                                                                disabled={(date) => date < new Date()}
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
                                                        <Input type="time" className="bg-background" {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}

                                {/* Submit Buttons */}
                                <div className="flex items-center justify-between pt-4 border-t">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => navigate('/sms')}
                                    >
                                        Cancel
                                    </Button>
                                    <div className="flex gap-3">
                                        {sendOption !== 'draft' && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    form.setValue('sendOption', 'draft');
                                                    form.handleSubmit(onSubmit)();
                                                }}
                                                disabled={composeMutation.isPending}
                                            >
                                                <Save className="h-4 w-4 mr-2" />
                                                Save Draft
                                            </Button>
                                        )}
                                        <Button
                                            type="submit"
                                            disabled={composeMutation.isPending || (sendOption === 'now' && totalUnits > availableUnits && recipientCount > 0)}
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
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>

            {/* ================================================================ */}
            {/* SIDEBAR */}
            {/* ================================================================ */}
            <div className="space-y-4">
                {/* SMS Balance Card */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">SMS Balance</CardTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/sms/units')}
                            >
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                Buy Units
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-2">
                            <p className="text-3xl font-bold text-primary">
                                {typeof availableUnits === 'number' ? availableUnits.toLocaleString() : availableUnits}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">available units</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Message Summary Card */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Message Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Recipients</span>
                            <span className="font-medium">{recipientCount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">SMS per message</span>
                            <span className="font-medium">{smsCount}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground font-medium">Total Units</span>
                            <span className="font-bold text-lg">{totalUnits.toLocaleString()}</span>
                        </div>

                        {totalUnits > 0 && totalUnits > availableUnits && (
                            <div className="flex items-start gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
                                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium">Insufficient units</p>
                                    <p className="text-xs mt-0.5">
                                        You need {(totalUnits - availableUnits).toLocaleString()} more units.{' '}
                                        <button
                                            type="button"
                                            className="underline hover:no-underline"
                                            onClick={() => navigate('/sms/units')}
                                        >
                                            Buy units
                                        </button>
                                    </p>
                                </div>
                            </div>
                        )}

                        {totalUnits > 0 && totalUnits <= availableUnits && (
                            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 p-3 rounded-lg">
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                <span>Sufficient balance</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Message Preview Card */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-muted/50 rounded-xl p-4 min-h-[100px]">
                            {/* Phone mockup */}
                            <div className="max-w-[85%]">
                                <div className="bg-primary text-primary-foreground rounded-2xl rounded-tl-md p-3 text-sm whitespace-pre-wrap break-words">
                                    {message || (
                                        <span className="opacity-60 italic">
                                            Your message will appear here...
                                        </span>
                                    )}
                                </div>
                                {message && (
                                    <p className="text-[10px] text-muted-foreground mt-1 ml-1">
                                        {format(new Date(), 'h:mm a')}
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Selected Recipients Summary */}
                {((destinationType === 'contacts' && (selectAllContacts || selectedContactLists.length > 0)) ||
                    (destinationType === 'groups' && selectedGroups.length > 0) ||
                    (destinationType === 'members' && selectedMembers.length > 0)) && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Selected Recipients</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-1.5">
                                {destinationType === 'contacts' && selectAllContacts && (
                                    <Badge variant="default" className="text-xs">
                                        <Users className="h-3 w-3 mr-1" />
                                        All Contact Lists
                                    </Badge>
                                )}
                                {destinationType === 'contacts' && !selectAllContacts &&
                                    selectedContactLists.map((id) => {
                                        const list = contactListOptions.find((l) => l.value === id);
                                        return (
                                            <Badge key={id} variant="outline" className="text-xs">
                                                <BookUser className="h-3 w-3 mr-1" />
                                                {list?.label || id}
                                            </Badge>
                                        );
                                    })}
                                {destinationType === 'groups' &&
                                    selectedGroups.map((id) => {
                                        const group = groupOptions.find((g) => g.value === id);
                                        return (
                                            <Badge key={id} variant="outline" className="text-xs">
                                                <Users className="h-3 w-3 mr-1" />
                                                {group?.label || id}
                                            </Badge>
                                        );
                                    })}
                                {destinationType === 'members' &&
                                    selectedMembers.slice(0, 8).map((id) => {
                                        const member = memberOptions.find((m) => m.value === id);
                                        return (
                                            <Badge key={id} variant="outline" className="text-xs">
                                                <User className="h-3 w-3 mr-1" />
                                                {member?.label || id}
                                            </Badge>
                                        );
                                    })}
                                {destinationType === 'members' && selectedMembers.length > 8 && (
                                    <Badge variant="secondary" className="text-xs">
                                        +{selectedMembers.length - 8} more
                                    </Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}