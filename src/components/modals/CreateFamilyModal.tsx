// src/components/modals/FamilyModal.tsx
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
    FormDescription,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { membersApi, Family, FamilyRole, familiesApi, CreateFamilyDTO } from '@/lib/api';
import { Member } from '@/types/member.ts';
import {
    Loader2,
    Home,
    Users,
    MapPin,
    UserPlus,
    X,
    Crown,
    Pencil,
    Heart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext.tsx';

const familyRoles: { value: FamilyRole; label: string; category: string }[] = [
    // Parents
    { value: 'father', label: 'Father', category: 'Parents' },
    { value: 'mother', label: 'Mother', category: 'Parents' },
    { value: 'stepfather', label: 'Stepfather', category: 'Parents' },
    { value: 'stepmother', label: 'Stepmother', category: 'Parents' },
    // Children
    { value: 'son', label: 'Son', category: 'Children' },
    { value: 'daughter', label: 'Daughter', category: 'Children' },
    { value: 'stepson', label: 'Stepson', category: 'Children' },
    { value: 'stepdaughter', label: 'Stepdaughter', category: 'Children' },
    // Grandparents
    { value: 'grandfather', label: 'Grandfather', category: 'Grandparents' },
    { value: 'grandmother', label: 'Grandmother', category: 'Grandparents' },
    // Grandchildren
    { value: 'grandson', label: 'Grandson', category: 'Grandchildren' },
    { value: 'granddaughter', label: 'Granddaughter', category: 'Grandchildren' },
    // Siblings
    { value: 'brother', label: 'Brother', category: 'Siblings' },
    { value: 'sister', label: 'Sister', category: 'Siblings' },
    // In-laws
    { value: 'father_in_law', label: 'Father-in-law', category: 'In-laws' },
    { value: 'mother_in_law', label: 'Mother-in-law', category: 'In-laws' },
    { value: 'brother_in_law', label: 'Brother-in-law', category: 'In-laws' },
    { value: 'sister_in_law', label: 'Sister-in-law', category: 'In-laws' },
    // Extended Family
    { value: 'uncle', label: 'Uncle', category: 'Extended Family' },
    { value: 'aunt', label: 'Aunt', category: 'Extended Family' },
    { value: 'nephew', label: 'Nephew', category: 'Extended Family' },
    { value: 'niece', label: 'Niece', category: 'Extended Family' },
    { value: 'cousin', label: 'Cousin', category: 'Extended Family' },
    // Other
    { value: 'guardian', label: 'Guardian', category: 'Other' },
    { value: 'ward', label: 'Ward', category: 'Other' },
    { value: 'other', label: 'Other (Specify)', category: 'Other' },
];

const familySchema = z.object({
    name: z.string().min(2, 'Family name must be at least 2 characters').max(100),
    address: z.string().max(500).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    postalCode: z.string().max(20).optional(),
    country: z.string().max(100).optional(),
    homePhone: z.string().max(20).optional(),
    email: z.string().email().optional().or(z.literal('')),
    weddingAnniversary: z.string().optional(),
    notes: z.string().max(2000).optional(),
    isActive: z.boolean().default(true),
});

type FamilyFormData = z.infer<typeof familySchema>;

interface SelectedMember {
    memberId: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
    familyRole: FamilyRole;
    familyRoleOther?: string;
    isHead: boolean;
}

interface FamilyModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    family?: Family | null;
}

export function FamilyModal({ open, onClose, onSuccess, family }: FamilyModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('basic');
    const [members, setMembers] = useState<Member[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([]);
    const [openMemberSelect, setOpenMemberSelect] = useState(false);
    const [editingMember, setEditingMember] = useState<string | null>(null);
    const { toast } = useToast();
    const { user } = useAuth();
    const isEditing = !!family;

    const form = useForm<FamilyFormData>({
        resolver: zodResolver(familySchema),
        defaultValues: {
            name: '',
            address: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'Ghana',
            homePhone: '',
            email: '',
            weddingAnniversary: '',
            notes: '',
            isActive: true,
        },
    });

    // Fetch available members
    useEffect(() => {
        if (open) {
            fetchMembers();
        }
    }, [open]);

    // Populate form when editing
    useEffect(() => {
        if (family) {
            form.reset({
                name: family.name,
                address: family.address || '',
                city: family.city || '',
                state: family.state || '',
                postalCode: family.postalCode || '',
                country: family.country || 'Ghana',
                homePhone: family.homePhone || '',
                email: family.email || '',
                weddingAnniversary: family.weddingAnniversary
                    ? new Date(family.weddingAnniversary).toISOString().split('T')[0]
                    : '',
                notes: family.notes || '',
                isActive: family.isActive,
            });
            // TODO: Fetch and set existing family members
        } else {
            form.reset({
                name: '',
                address: '',
                city: '',
                state: '',
                postalCode: '',
                country: 'Ghana',
                homePhone: '',
                email: '',
                weddingAnniversary: '',
                notes: '',
                isActive: true,
            });
            setSelectedMembers([]);
        }
        setActiveTab('basic');
    }, [family, form, open]);

    // FIX #1: Invalid object syntax — added proper key: value pair
    const fetchMembers = async () => {
        setLoadingMembers(true);
        try {
            const result = await membersApi.getAll({
                churchId: user?.church_id,
                limit: 500,
            });
            setMembers(result.members || []);
        } catch (error) {
            console.error('Failed to fetch members:', error);
        } finally {
            setLoadingMembers(false);
        }
    };

    const addMember = (member: Member) => {
        if (selectedMembers.find((m) => m.memberId === member.id)) {
            toast({
                variant: 'destructive',
                title: 'Member already added',
                description: `${member.first_name} ${member.last_name} is already in the family.`,
            });
            return;
        }

        // Determine default role based on gender and existing members
        let defaultRole: FamilyRole = 'other';
        const hasFather = selectedMembers.some((m) => m.familyRole === 'father');
        const hasMother = selectedMembers.some((m) => m.familyRole === 'mother');

        if (member.gender === 'male' && !hasFather) {
            defaultRole = 'father';
        } else if (member.gender === 'female' && !hasMother) {
            defaultRole = 'mother';
        } else if (member.gender === 'male') {
            defaultRole = 'son';
        } else if (member.gender === 'female') {
            defaultRole = 'daughter';
        }

        const isHead = selectedMembers.length === 0;

        setSelectedMembers([
            ...selectedMembers,
            {
                memberId: member.id,
                firstName: member.first_name,
                lastName: member.last_name,
                profileImageUrl: member.profile_image_url,
                familyRole: defaultRole,
                isHead,
            },
        ]);
        setOpenMemberSelect(false);
    };

    const removeMember = (memberId: string) => {
        const memberToRemove = selectedMembers.find((m) => m.memberId === memberId);
        const updatedMembers = selectedMembers.filter((m) => m.memberId !== memberId);

        // If removing the head, assign first remaining member as head
        if (memberToRemove?.isHead && updatedMembers.length > 0) {
            updatedMembers[0].isHead = true;
        }

        setSelectedMembers(updatedMembers);
    };

    const updateMemberRole = (memberId: string, role: FamilyRole, roleOther?: string) => {
        setSelectedMembers(
            selectedMembers.map((m) =>
                m.memberId === memberId
                    ? { ...m, familyRole: role, familyRoleOther: roleOther }
                    : m
            )
        );
        setEditingMember(null);
    };

    const setMemberAsHead = (memberId: string) => {
        setSelectedMembers(
            selectedMembers.map((m) => ({
                ...m,
                isHead: m.memberId === memberId,
            }))
        );
    };

    // FIX #2: Properly construct payload to satisfy CreateFamilyDTO (name is required)
    // FIX #3: Fixed error.message on empty string and improved error handling
    const onSubmit = async (data: FamilyFormData) => {
        setIsLoading(true);
        try {
            // Find the head member to set headId
            const headMember = selectedMembers.find((m) => m.isHead);

            // Construct payload explicitly so that `name` is required (not optional)
            const payload: CreateFamilyDTO = {
                name: data.name,
                ...(headMember ? { headId: headMember.memberId } : {}),
                ...(data.address ? { address: data.address } : {}),
                ...(data.city ? { city: data.city } : {}),
                ...(data.state ? { state: data.state } : {}),
                ...(data.postalCode ? { postalCode: data.postalCode } : {}),
                ...(data.country ? { country: data.country } : {}),
                ...(data.homePhone ? { homePhone: data.homePhone } : {}),
                ...(data.email ? { email: data.email } : {}),
                ...(data.weddingAnniversary ? { weddingAnniversary: data.weddingAnniversary } : {}),
                ...(data.notes ? { notes: data.notes } : {}),
                members: selectedMembers.map((m) => ({
                    memberId: m.memberId,
                    familyRole: m.familyRole,
                    isHead: m.isHead,
                    ...(m.familyRoleOther ? { familyRoleOther: m.familyRoleOther } : {}),
                })),
            };

            const response = await familiesApi.create(payload);
            console.log(response);

            if (!response.id) {
                throw new Error('Failed to save family');
            }

            toast({
                title: isEditing ? 'Family updated' : 'Family created',
                description: `The ${data.name} family has been ${
                    isEditing ? 'updated' : 'created'
                } successfully.`,
            });

            form.reset();
            setSelectedMembers([]);
            setActiveTab('basic');
            onSuccess?.();
            onClose();
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : 'Something went wrong.';
            toast({
                variant: 'destructive',
                title: isEditing ? 'Failed to update family' : 'Failed to create family',
                description: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        form.reset();
        setSelectedMembers([]);
        setActiveTab('basic');
        onClose();
    };

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    const getRoleLabel = (role: FamilyRole, roleOther?: string) => {
        if (role === 'other' && roleOther) return roleOther;
        return familyRoles.find((r) => r.value === role)?.label || role;
    };

    const getRoleBadgeColor = (role: FamilyRole) => {
        if (role === 'father' || role === 'mother') return 'bg-blue-100 text-blue-800';
        if (role === 'son' || role === 'daughter') return 'bg-green-100 text-green-800';
        if (role.includes('grandfather') || role.includes('grandmother'))
            return 'bg-purple-100 text-purple-800';
        if (role.includes('_in_law')) return 'bg-orange-100 text-orange-800';
        return 'bg-gray-100 text-gray-800';
    };

    // Group roles by category
    const groupedRoles = familyRoles.reduce(
        (acc, role) => {
            if (!acc[role.category]) acc[role.category] = [];
            acc[role.category].push(role);
            return acc;
        },
        {} as Record<string, typeof familyRoles>
    );

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div
                            className={cn(
                                'h-10 w-10 rounded-full flex items-center justify-center',
                                isEditing ? 'bg-blue-500/10' : 'bg-green-500/10'
                            )}
                        >
                            {isEditing ? (
                                <Pencil className="h-5 w-5 text-blue-600" />
                            ) : (
                                <Home className="h-5 w-5 text-green-600" />
                            )}
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-display">
                                {isEditing ? 'Edit Family' : 'Create New Family'}
                            </DialogTitle>
                            <DialogDescription>
                                {isEditing
                                    ? `Update information for the ${family?.name}`
                                    : 'Create a family unit and add members'}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="basic" className="gap-2">
                                    <Home className="h-4 w-4" />
                                    <span className="hidden sm:inline">Basic</span>
                                </TabsTrigger>
                                <TabsTrigger value="members" className="gap-2">
                                    <Users className="h-4 w-4" />
                                    <span className="hidden sm:inline">Members</span>
                                    {selectedMembers.length > 0 && (
                                        <Badge
                                            variant="secondary"
                                            className="ml-1 h-5 w-5 p-0 justify-center"
                                        >
                                            {selectedMembers.length}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="address" className="gap-2">
                                    <MapPin className="h-4 w-4" />
                                    <span className="hidden sm:inline">Address</span>
                                </TabsTrigger>
                            </TabsList>

                            {/* Basic Info Tab */}
                            <TabsContent value="basic" className="space-y-4 mt-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Family Name *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="The Johnson Family" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Enter the family surname or a descriptive name
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Family Email</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="email"
                                                        placeholder="family@example.com"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="homePhone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Home Phone</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="+233 XX XXX XXXX" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="weddingAnniversary"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Heart className="h-4 w-4 text-pink-500" />
                                                Wedding Anniversary
                                            </FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
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
                                                    placeholder="Any additional notes about the family..."
                                                    className="resize-none"
                                                    rows={3}
                                                    {...field}
                                                />
                                            </FormControl>
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
                                                    <FormLabel className="text-base">Active Family</FormLabel>
                                                    <FormDescription>
                                                        Inactive families are hidden from views
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
                            </TabsContent>

                            {/* Members Tab */}
                            <TabsContent value="members" className="space-y-4 mt-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-medium">Family Members</h4>
                                        <p className="text-xs text-muted-foreground">
                                            Add members and assign their family roles
                                        </p>
                                    </div>
                                    <Popover open={openMemberSelect} onOpenChange={setOpenMemberSelect}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="gap-2"
                                            >
                                                <UserPlus className="h-4 w-4" />
                                                Add Member
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[320px] p-0" align="end">
                                            <Command>
                                                <CommandInput placeholder="Search members..." />
                                                <CommandList>
                                                    <CommandEmpty>
                                                        {loadingMembers ? 'Loading...' : 'No members found.'}
                                                    </CommandEmpty>
                                                    <CommandGroup>
                                                        {members
                                                            .filter(
                                                                (m) =>
                                                                    !selectedMembers.find(
                                                                        (sm) => sm.memberId === m.id
                                                                    )
                                                            )
                                                            .map((member) => (
                                                                <CommandItem
                                                                    key={member.id}
                                                                    value={`${member.first_name} ${member.last_name}`}
                                                                    onSelect={() => addMember(member)}
                                                                    className="cursor-pointer"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <Avatar className="h-8 w-8">
                                                                            <AvatarImage
                                                                                src={member.profile_image_url}
                                                                            />
                                                                            <AvatarFallback className="text-xs">
                                                                                {getInitials(
                                                                                    member.first_name,
                                                                                    member.last_name
                                                                                )}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <div>
                                                                            <p className="text-sm font-medium">
                                                                                {member.first_name} {member.last_name}
                                                                            </p>
                                                                            <p className="text-xs text-muted-foreground capitalize">
                                                                                {member.gender || 'Unknown gender'}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </CommandItem>
                                                            ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {selectedMembers.length > 0 ? (
                                    <ScrollArea className="max-h-[300px]">
                                        <div className="space-y-3">
                                            {selectedMembers.map((member) => (
                                                <div
                                                    key={member.memberId}
                                                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative">
                                                            <Avatar className="h-10 w-10">
                                                                <AvatarImage src={member.profileImageUrl} />
                                                                <AvatarFallback>
                                                                    {getInitials(member.firstName, member.lastName)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            {member.isHead && (
                                                                <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5">
                                                                    <Crown className="h-3 w-3 text-white" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-medium">
                                                                    {member.firstName} {member.lastName}
                                                                </p>
                                                                {member.isHead && (
                                                                    <Badge variant="outline" className="text-xs">
                                                                        Head
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <Badge
                                                                variant="secondary"
                                                                className={cn(
                                                                    'mt-1 text-xs',
                                                                    getRoleBadgeColor(member.familyRole)
                                                                )}
                                                            >
                                                                {getRoleLabel(
                                                                    member.familyRole,
                                                                    member.familyRoleOther
                                                                )}
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {/* Role Selector */}
                                                        <Select
                                                            value={member.familyRole}
                                                            onValueChange={(value) =>
                                                                updateMemberRole(
                                                                    member.memberId,
                                                                    value as FamilyRole
                                                                )
                                                            }
                                                        >
                                                            <SelectTrigger className="w-[140px] h-8">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {Object.entries(groupedRoles).map(
                                                                    ([category, roles]) => (
                                                                        <div key={category}>
                                                                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                                                                {category}
                                                                            </div>
                                                                            {roles.map((role) => (
                                                                                <SelectItem
                                                                                    key={role.value}
                                                                                    value={role.value}
                                                                                >
                                                                                    {role.label}
                                                                                </SelectItem>
                                                                            ))}
                                                                            <Separator className="my-1" />
                                                                        </div>
                                                                    )
                                                                )}
                                                            </SelectContent>
                                                        </Select>

                                                        {/* Set as Head Button */}
                                                        {!member.isHead && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() =>
                                                                    setMemberAsHead(member.memberId)
                                                                }
                                                                title="Set as family head"
                                                            >
                                                                <Crown className="h-4 w-4 text-muted-foreground" />
                                                            </Button>
                                                        )}

                                                        {/* Remove Button */}
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                            onClick={() => removeMember(member.memberId)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed rounded-lg text-center">
                                        <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
                                        <p className="text-sm font-medium text-muted-foreground">
                                            No members added yet
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Click &quot;Add Member&quot; to add family members
                                        </p>
                                    </div>
                                )}

                                {/* Other Role Specification */}
                                {selectedMembers.some((m) => m.familyRole === 'other') && (
                                    <div className="space-y-3 pt-4 border-t">
                                        <h5 className="text-sm font-medium">
                                            Specify &quot;Other&quot; Relationships
                                        </h5>
                                        {selectedMembers
                                            .filter((m) => m.familyRole === 'other')
                                            .map((member) => (
                                                <div
                                                    key={member.memberId}
                                                    className="flex items-center gap-3"
                                                >
                                                    <span className="text-sm text-muted-foreground min-w-[120px]">
                                                        {member.firstName} {member.lastName}:
                                                    </span>
                                                    <Input
                                                        placeholder="e.g., Adopted child, Foster parent"
                                                        value={member.familyRoleOther || ''}
                                                        onChange={(e) =>
                                                            updateMemberRole(
                                                                member.memberId,
                                                                'other',
                                                                e.target.value
                                                            )
                                                        }
                                                        className="flex-1"
                                                    />
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </TabsContent>

                            {/* Address Tab */}
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
                                                    <Input placeholder="Accra" {...field} />
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
                                                <FormLabel>Region/State</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Greater Accra" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="postalCode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Postal Code</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="00233" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="country"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Country</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ghana" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
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
                                        {isEditing ? 'Updating...' : 'Creating...'}
                                    </>
                                ) : isEditing ? (
                                    <>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Update Family
                                    </>
                                ) : (
                                    <>
                                        <Home className="mr-2 h-4 w-4" />
                                        Create Family
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