// src/pages/Profile.tsx

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    User,
    Mail,
    Phone,
    Shield,
    Key,
    Camera,
    Building2,
    Users,
    UserPlus,
    MoreHorizontal,
    Edit,
    Trash2,
    Send,
    CheckCircle,
    Eye,
    EyeOff,
    Save,
    Loader2,
    RefreshCw,
    Search,
    Lock,
    AlertTriangle,
    Heart,
    Cake,
    Calendar,
    MapPin,
    Briefcase,
    AlertCircle,
    UserCircle,
} from 'lucide-react';
import {
    useProfile,
    useUpdateProfile,
    useChangePassword,
    useStaffMembers,
    useCreateStaffMember,
    useUpdateStaffMember,
    useDeleteStaffMember,
    useResendInvitation,
    useMemberProfile,
    useUpdateMemberProfile,
} from '@/hooks/useProfile';
import {
    StaffMember,
    CreateStaffDTO,
    STAFF_ROLES,
    StaffRole,
    MaritalStatus,
    Gender,
    UpdateMemberProfileDTO,
} from '@/types/profile';
import { useAuth } from '@/contexts/AuthContext';
import { format, differenceInYears } from 'date-fns';
import { cn } from '@/lib/utils';

// Marital Status Options
const MARITAL_STATUS_OPTIONS: { value: MaritalStatus; label: string }[] = [
    { value: 'single', label: 'Single' },
    { value: 'married', label: 'Married' },
    { value: 'divorced', label: 'Divorced' },
    { value: 'widowed', label: 'Widowed' },
];

// Gender Options
const GENDER_OPTIONS: { value: Gender; label: string }[] = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
];

export default function Profile() {
    const { user: authUser } = useAuth();
    const { user, church, isLoading, refetch } = useProfile();
    const { staff, isLoading: isLoadingStaff, refetch: refetchStaff } = useStaffMembers();
    const { member, isLoading: isLoadingMember, hasMemberProfile, refetch: refetchMember } = useMemberProfile();

    const [activeTab, setActiveTab] = useState('profile');
    const [searchQuery, setSearchQuery] = useState('');

    // Profile form state
    const [profileForm, setProfileForm] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        country: '',
    });
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    // Member profile form state
    const [memberProfileForm, setMemberProfileForm] = useState<UpdateMemberProfileDTO>({
        firstName: '',
        lastName: '',
        phone: '',
        gender: undefined,
        maritalStatus: undefined,
        dateOfBirth: '',
        weddingAnniversary: '',
        address: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        occupation: '',
        employer: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelationship: '',
    });
    const [isEditingMemberProfile, setIsEditingMemberProfile] = useState(false);

    // Password form state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });

    // Staff management state
    const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
    const [isEditStaffOpen, setIsEditStaffOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
    const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);
    const [staffForm, setStaffForm] = useState<CreateStaffDTO>({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        role: 'staff',
        sendInvite: true,
        createAsMember: true,
    });

    // Mutations
    const updateProfileMutation = useUpdateProfile();
    const changePasswordMutation = useChangePassword();
    const createStaffMutation = useCreateStaffMember();
    const updateStaffMutation = useUpdateStaffMember();
    const deleteStaffMutation = useDeleteStaffMember();
    const resendInviteMutation = useResendInvitation();
    const updateMemberProfileMutation = useUpdateMemberProfile();

    // Helper function to get user property
    const getUserProp = (prop: string): any => {
        if (!user) return undefined;
        const propMap: Record<string, string> = {
            firstName: 'first_name',
            lastName: 'last_name',
            phoneNumber: 'phone_number',
            profileImageUrl: 'profile_image_url',
            emailVerified: 'email_verified',
            lastLoginAt: 'last_login_at',
            createdAt: 'created_at',
            roleDisplay: 'role_display',
        };
        const snakeCaseProp = propMap[prop] || prop;
        return (user as any)[snakeCaseProp] ?? (user as any)[prop];
    };

    // Helper function to get member property
    const getMemberProp = (prop: string): any => {
        if (!member) return undefined;
        const propMap: Record<string, string> = {
            firstName: 'first_name',
            lastName: 'last_name',
            dateOfBirth: 'date_of_birth',
            maritalStatus: 'marital_status',
            weddingAnniversary: 'wedding_anniversary',
            postalCode: 'postal_code',
            profileImageUrl: 'profile_image_url',
            emergencyContactName: 'emergency_contact_name',
            emergencyContactPhone: 'emergency_contact_phone',
            emergencyContactRelationship: 'emergency_contact_relationship',
        };
        const snakeCaseProp = propMap[prop] || prop;
        return (member as any)[snakeCaseProp] ?? (member as any)[prop];
    };

    // Initialize profile form when data loads
    useEffect(() => {
        if (user) {
            setProfileForm({
                firstName: getUserProp('firstName') || '',
                lastName: getUserProp('lastName') || '',
                phoneNumber: getUserProp('phoneNumber') || '',
                country: (user as any).country || '',
            });
        }
    }, [user]);

    // Initialize member profile form when data loads
    useEffect(() => {
        if (member) {
            setMemberProfileForm({
                firstName: getMemberProp('firstName') || '',
                lastName: getMemberProp('lastName') || '',
                phone: (member as any).phone || '',
                gender: (member as any).gender || undefined,
                maritalStatus: getMemberProp('maritalStatus') || undefined,
                dateOfBirth: getMemberProp('dateOfBirth') || '',
                weddingAnniversary: getMemberProp('weddingAnniversary') || '',
                address: (member as any).address || '',
                city: (member as any).city || '',
                state: (member as any).state || '',
                country: (member as any).country || '',
                postalCode: getMemberProp('postalCode') || '',
                occupation: (member as any).occupation || '',
                employer: (member as any).employer || '',
                emergencyContactName: getMemberProp('emergencyContactName') || '',
                emergencyContactPhone: getMemberProp('emergencyContactPhone') || '',
                emergencyContactRelationship: getMemberProp('emergencyContactRelationship') || '',
            });
        }
    }, [member]);

    // Filter staff by search
    const filteredStaff = staff.filter(s =>
        (s.firstName || s.first_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.lastName || s.last_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Check if user is admin
    const isAdmin = authUser?.role === 'admin' || authUser?.role === 'super_admin';

    // Get staff member name helper
    const getStaffName = (s: any) => {
        const firstName = s.firstName || s.first_name || '';
        const lastName = s.lastName || s.last_name || '';
        return { firstName, lastName };
    };

    // Calculate age from date of birth
    const calculateAge = (dateOfBirth: string | undefined): number | null => {
        if (!dateOfBirth) return null;
        try {
            return differenceInYears(new Date(), new Date(dateOfBirth));
        } catch {
            return null;
        }
    };

    // Handlers
    const handleUpdateProfile = async () => {
        try {
            await updateProfileMutation.mutateAsync(profileForm);
            setIsEditingProfile(false);
            refetch();
        } catch (error) {
            // Error handled by mutation
        }
    };

    const handleUpdateMemberProfile = async () => {
        try {
            const dataToSend: UpdateMemberProfileDTO = {};

            // Only send non-empty values
            Object.entries(memberProfileForm).forEach(([key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
                    (dataToSend as any)[key] = value;
                }
            });

            // If not married, don't send wedding anniversary
            if (dataToSend.maritalStatus !== 'married') {
                delete dataToSend.weddingAnniversary;
            }

            await updateMemberProfileMutation.mutateAsync(dataToSend);
            setIsEditingMemberProfile(false);
            refetchMember();
        } catch (error) {
            // Error handled by mutation
        }
    };

    const handleChangePassword = async () => {
        try {
            await changePasswordMutation.mutateAsync(passwordForm);
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            // Error handled by mutation
        }
    };

    const handleCreateStaff = async () => {
        try {
            await createStaffMutation.mutateAsync(staffForm);
            setIsAddStaffOpen(false);
            resetStaffForm();
            refetchStaff();
        } catch (error) {
            // Error handled by mutation
        }
    };

    const handleUpdateStaff = async () => {
        if (!selectedStaff) return;
        try {
            await updateStaffMutation.mutateAsync({
                id: selectedStaff.id,
                data: {
                    firstName: staffForm.firstName,
                    lastName: staffForm.lastName,
                    phoneNumber: staffForm.phoneNumber,
                    role: staffForm.role,
                },
            });
            setIsEditStaffOpen(false);
            setSelectedStaff(null);
            refetchStaff();
        } catch (error) {
            // Error handled by mutation
        }
    };

    const handleDeleteStaff = async () => {
        if (!staffToDelete) return;
        try {
            await deleteStaffMutation.mutateAsync(staffToDelete.id);
            setStaffToDelete(null);
            refetchStaff();
        } catch (error) {
            // Error handled by mutation
        }
    };

    const handleResendInvite = async (staffId: string) => {
        try {
            await resendInviteMutation.mutateAsync(staffId);
        } catch (error) {
            // Error handled by mutation
        }
    };

    const openEditStaffDialog = (staffMember: StaffMember) => {
        const { firstName, lastName } = getStaffName(staffMember);
        setSelectedStaff(staffMember);
        setStaffForm({
            firstName,
            lastName,
            email: staffMember.email,
            phoneNumber: staffMember.phoneNumber || staffMember.phone_number || '',
            role: staffMember.role,
            sendInvite: false,
        });
        setIsEditStaffOpen(true);
    };

    const resetStaffForm = () => {
        setStaffForm({
            firstName: '',
            lastName: '',
            email: '',
            phoneNumber: '',
            role: 'staff',
            sendInvite: true,
            createAsMember: true,
        });
    };

    const resetMemberProfileForm = () => {
        if (member) {
            setMemberProfileForm({
                firstName: getMemberProp('firstName') || '',
                lastName: getMemberProp('lastName') || '',
                phone: (member as any).phone || '',
                gender: (member as any).gender || undefined,
                maritalStatus: getMemberProp('maritalStatus') || undefined,
                dateOfBirth: getMemberProp('dateOfBirth') || '',
                weddingAnniversary: getMemberProp('weddingAnniversary') || '',
                address: (member as any).address || '',
                city: (member as any).city || '',
                state: (member as any).state || '',
                country: (member as any).country || '',
                postalCode: getMemberProp('postalCode') || '',
                occupation: (member as any).occupation || '',
                employer: (member as any).employer || '',
                emergencyContactName: getMemberProp('emergencyContactName') || '',
                emergencyContactPhone: getMemberProp('emergencyContactPhone') || '',
                emergencyContactRelationship: getMemberProp('emergencyContactRelationship') || '',
            });
        }
    };

    const getRoleLabel = (role: StaffRole) => {
        return STAFF_ROLES.find(r => r.value === role)?.label || role;
    };

    const getStatusBadge = (staffMember: any) => {
        const mustResetPassword = staffMember.mustResetPassword || staffMember.must_reset_password;
        const status = staffMember.status;

        if (mustResetPassword) {
            return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending Setup</Badge>;
        }
        if (status === 'active') {
            return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>;
        }
        if (status === 'inactive') {
            return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Inactive</Badge>;
        }
        return <Badge variant="outline">{status}</Badge>;
    };

    if (isLoading) {
        return (
            <DashboardLayout title="Profile">
                <div className="p-6 space-y-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </DashboardLayout>
        );
    }

    // Get user display values
    const userFirstName = getUserProp('firstName') || '';
    const userLastName = getUserProp('lastName') || '';
    const userPhoneNumber = getUserProp('phoneNumber') || '';
    const userProfileImageUrl = getUserProp('profileImageUrl') || '';
    const userRoleDisplay = getUserProp('roleDisplay') || (user as any)?.role || '';
    const userEmailVerified = getUserProp('emailVerified') || false;
    const userLastLoginAt = getUserProp('lastLoginAt');
    const userCreatedAt = getUserProp('createdAt');
    const userStatus = (user as any)?.status || '';
    const userEmail = (user as any)?.email || '';
    const userCountry = (user as any)?.country || '';
    const userRole = (user as any)?.role || '';

    // Get member display values
    const memberDateOfBirth = getMemberProp('dateOfBirth');
    const memberMaritalStatus = getMemberProp('maritalStatus');
    const memberWeddingAnniversary = getMemberProp('weddingAnniversary');
    const memberAge = calculateAge(memberDateOfBirth);

    return (
        <DashboardLayout title="Profile & Settings">
            <div className="p-4 md:p-6 space-y-6">
                {/* Profile Header */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                            <div className="relative">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={userProfileImageUrl || getMemberProp('profileImageUrl')} />
                                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                                        {userFirstName?.[0]}{userLastName?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                                >
                                    <Camera className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <h1 className="text-2xl font-bold">
                                        {userFirstName} {userLastName}
                                    </h1>
                                    <Badge className="capitalize">{userRoleDisplay || userRole}</Badge>
                                    {hasMemberProfile && (
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                            <UserCircle className="h-3 w-3 mr-1" />
                                            Member
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Mail className="h-4 w-4" />
                                        {userEmail}
                                    </span>
                                    {userPhoneNumber && (
                                        <span className="flex items-center gap-1">
                                            <Phone className="h-4 w-4" />
                                            {userPhoneNumber}
                                        </span>
                                    )}
                                    {church && (
                                        <span className="flex items-center gap-1">
                                            <Building2 className="h-4 w-4" />
                                            {church.name}
                                        </span>
                                    )}
                                </div>
                                {/* Quick Info for Members */}
                                {hasMemberProfile && (
                                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                                        {memberDateOfBirth && (
                                            <span className="flex items-center gap-1">
                                                <Cake className="h-4 w-4" />
                                                {format(new Date(memberDateOfBirth), 'MMM d')}
                                                {memberAge !== null && ` (${memberAge} yrs)`}
                                            </span>
                                        )}
                                        {memberMaritalStatus && (
                                            <span className="flex items-center gap-1">
                                                <Heart className="h-4 w-4" />
                                                {memberMaritalStatus.charAt(0).toUpperCase() + memberMaritalStatus.slice(1)}
                                            </span>
                                        )}
                                        {memberMaritalStatus === 'married' && memberWeddingAnniversary && (
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                Anniversary: {format(new Date(memberWeddingAnniversary), 'MMM d')}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => {
                                    refetch();
                                    if (hasMemberProfile) refetchMember();
                                }}>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Refresh
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="flex-wrap h-auto gap-1">
                        <TabsTrigger value="profile" className="gap-2">
                            <User className="h-4 w-4" />
                            Account
                        </TabsTrigger>
                        {hasMemberProfile && (
                            <TabsTrigger value="member" className="gap-2">
                                <UserCircle className="h-4 w-4" />
                                Personal Info
                            </TabsTrigger>
                        )}
                        <TabsTrigger value="security" className="gap-2">
                            <Lock className="h-4 w-4" />
                            Security
                        </TabsTrigger>
                        {isAdmin && (
                            <TabsTrigger value="staff" className="gap-2">
                                <Users className="h-4 w-4" />
                                Staff
                            </TabsTrigger>
                        )}
                        <TabsTrigger value="church" className="gap-2">
                            <Building2 className="h-4 w-4" />
                            Church
                        </TabsTrigger>
                    </TabsList>

                    {/* Account Profile Tab */}
                    <TabsContent value="profile" className="mt-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Account Information</CardTitle>
                                    <CardDescription>Your login and account details</CardDescription>
                                </div>
                                {!isEditingProfile ? (
                                    <Button variant="outline" onClick={() => {
                                        setProfileForm({
                                            firstName: userFirstName,
                                            lastName: userLastName,
                                            phoneNumber: userPhoneNumber,
                                            country: userCountry,
                                        });
                                        setIsEditingProfile(true);
                                    }}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                    </Button>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={() => setIsEditingProfile(false)}>
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleUpdateProfile}
                                            disabled={updateProfileMutation.isPending}
                                        >
                                            {updateProfileMutation.isPending ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <Save className="h-4 w-4 mr-2" />
                                            )}
                                            Save
                                        </Button>
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name</Label>
                                        {isEditingProfile ? (
                                            <Input
                                                id="firstName"
                                                value={profileForm.firstName}
                                                onChange={(e) => setProfileForm(p => ({ ...p, firstName: e.target.value }))}
                                            />
                                        ) : (
                                            <p className="text-lg">{userFirstName || '-'}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        {isEditingProfile ? (
                                            <Input
                                                id="lastName"
                                                value={profileForm.lastName}
                                                onChange={(e) => setProfileForm(p => ({ ...p, lastName: e.target.value }))}
                                            />
                                        ) : (
                                            <p className="text-lg">{userLastName || '-'}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <div className="flex items-center gap-2">
                                            <p className="text-lg">{userEmail}</p>
                                            {userEmailVerified ? (
                                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    Verified
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                                    Not Verified
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phoneNumber">Phone Number</Label>
                                        {isEditingProfile ? (
                                            <Input
                                                id="phoneNumber"
                                                value={profileForm.phoneNumber}
                                                onChange={(e) => setProfileForm(p => ({ ...p, phoneNumber: e.target.value }))}
                                                placeholder="+1 234 567 8900"
                                            />
                                        ) : (
                                            <p className="text-lg">{userPhoneNumber || '-'}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="country">Country</Label>
                                        {isEditingProfile ? (
                                            <Input
                                                id="country"
                                                value={profileForm.country}
                                                onChange={(e) => setProfileForm(p => ({ ...p, country: e.target.value }))}
                                            />
                                        ) : (
                                            <p className="text-lg">{userCountry || '-'}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Role</Label>
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-muted-foreground" />
                                            <p className="text-lg capitalize">{userRoleDisplay || userRole}</p>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <Label>Account Activity</Label>
                                    <div className="grid gap-4 md:grid-cols-3 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Last Login</p>
                                            <p>{userLastLoginAt ? format(new Date(userLastLoginAt), 'PPp') : 'Never'}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Account Created</p>
                                            <p>{userCreatedAt ? format(new Date(userCreatedAt), 'PPp') : '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Status</p>
                                            <Badge variant={userStatus === 'active' ? 'default' : 'secondary'}>
                                                {userStatus}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Member Personal Info Tab */}
                    {hasMemberProfile && (
                        <TabsContent value="member" className="mt-6 space-y-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Personal Information</CardTitle>
                                        <CardDescription>Your personal and contact details</CardDescription>
                                    </div>
                                    {!isEditingMemberProfile ? (
                                        <Button variant="outline" onClick={() => setIsEditingMemberProfile(true)}>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit
                                        </Button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Button variant="outline" onClick={() => {
                                                setIsEditingMemberProfile(false);
                                                resetMemberProfileForm();
                                            }}>
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleUpdateMemberProfile}
                                                disabled={updateMemberProfileMutation.isPending}
                                            >
                                                {updateMemberProfileMutation.isPending ? (
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Save className="h-4 w-4 mr-2" />
                                                )}
                                                Save Changes
                                            </Button>
                                        </div>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Basic Info */}
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            Basic Information
                                        </h3>
                                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                            <div className="space-y-2">
                                                <Label>First Name</Label>
                                                {isEditingMemberProfile ? (
                                                    <Input
                                                        value={memberProfileForm.firstName || ''}
                                                        onChange={(e) => setMemberProfileForm(p => ({ ...p, firstName: e.target.value }))}
                                                    />
                                                ) : (
                                                    <p className="text-lg">{getMemberProp('firstName') || '-'}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Last Name</Label>
                                                {isEditingMemberProfile ? (
                                                    <Input
                                                        value={memberProfileForm.lastName || ''}
                                                        onChange={(e) => setMemberProfileForm(p => ({ ...p, lastName: e.target.value }))}
                                                    />
                                                ) : (
                                                    <p className="text-lg">{getMemberProp('lastName') || '-'}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Phone</Label>
                                                {isEditingMemberProfile ? (
                                                    <Input
                                                        value={memberProfileForm.phone || ''}
                                                        onChange={(e) => setMemberProfileForm(p => ({ ...p, phone: e.target.value }))}
                                                        placeholder="+1 234 567 8900"
                                                    />
                                                ) : (
                                                    <p className="text-lg">{(member as any)?.phone || '-'}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Gender</Label>
                                                {isEditingMemberProfile ? (
                                                    <Select
                                                        value={memberProfileForm.gender || ''}
                                                        onValueChange={(value: Gender) => setMemberProfileForm(p => ({ ...p, gender: value }))}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select gender" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {GENDER_OPTIONS.map(option => (
                                                                <SelectItem key={option.value} value={option.value}>
                                                                    {option.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <p className="text-lg capitalize">{(member as any)?.gender || '-'}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2">
                                                    <Cake className="h-4 w-4" />
                                                    Date of Birth
                                                </Label>
                                                {isEditingMemberProfile ? (
                                                    <Input
                                                        type="date"
                                                        value={memberProfileForm.dateOfBirth || ''}
                                                        onChange={(e) => setMemberProfileForm(p => ({ ...p, dateOfBirth: e.target.value }))}
                                                    />
                                                ) : (
                                                    <p className="text-lg">
                                                        {memberDateOfBirth
                                                            ? `${format(new Date(memberDateOfBirth), 'PPP')}${memberAge !== null ? ` (${memberAge} years old)` : ''}`
                                                            : '-'
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Marital Status & Anniversary */}
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                                            <Heart className="h-4 w-4" />
                                            Marital Status
                                        </h3>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label>Status</Label>
                                                {isEditingMemberProfile ? (
                                                    <Select
                                                        value={memberProfileForm.maritalStatus || ''}
                                                        onValueChange={(value: MaritalStatus) => {
                                                            setMemberProfileForm(p => ({
                                                                ...p,
                                                                maritalStatus: value,
                                                                weddingAnniversary: value !== 'married' ? '' : p.weddingAnniversary
                                                            }));
                                                        }}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select marital status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {MARITAL_STATUS_OPTIONS.map(option => (
                                                                <SelectItem key={option.value} value={option.value}>
                                                                    {option.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <p className="text-lg capitalize">{memberMaritalStatus || '-'}</p>
                                                )}
                                            </div>

                                            {(memberProfileForm.maritalStatus === 'married' || memberMaritalStatus === 'married') && (
                                                <div className="space-y-2">
                                                    <Label className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4" />
                                                        Wedding Anniversary
                                                    </Label>
                                                    {isEditingMemberProfile ? (
                                                        <Input
                                                            type="date"
                                                            value={memberProfileForm.weddingAnniversary || ''}
                                                            onChange={(e) => setMemberProfileForm(p => ({ ...p, weddingAnniversary: e.target.value }))}
                                                        />
                                                    ) : (
                                                        <p className="text-lg">
                                                            {memberWeddingAnniversary
                                                                ? format(new Date(memberWeddingAnniversary), 'PPP')
                                                                : '-'
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Address */}
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            Address
                                        </h3>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2 md:col-span-2">
                                                <Label>Street Address</Label>
                                                {isEditingMemberProfile ? (
                                                    <Input
                                                        value={memberProfileForm.address || ''}
                                                        onChange={(e) => setMemberProfileForm(p => ({ ...p, address: e.target.value }))}
                                                        placeholder="123 Main Street"
                                                    />
                                                ) : (
                                                    <p className="text-lg">{(member as any)?.address || '-'}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label>City</Label>
                                                {isEditingMemberProfile ? (
                                                    <Input
                                                        value={memberProfileForm.city || ''}
                                                        onChange={(e) => setMemberProfileForm(p => ({ ...p, city: e.target.value }))}
                                                    />
                                                ) : (
                                                    <p className="text-lg">{(member as any)?.city || '-'}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label>State/Province</Label>
                                                {isEditingMemberProfile ? (
                                                    <Input
                                                        value={memberProfileForm.state || ''}
                                                        onChange={(e) => setMemberProfileForm(p => ({ ...p, state: e.target.value }))}
                                                    />
                                                ) : (
                                                    <p className="text-lg">{(member as any)?.state || '-'}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Postal Code</Label>
                                                {isEditingMemberProfile ? (
                                                    <Input
                                                        value={memberProfileForm.postalCode || ''}
                                                        onChange={(e) => setMemberProfileForm(p => ({ ...p, postalCode: e.target.value }))}
                                                    />
                                                ) : (
                                                    <p className="text-lg">{getMemberProp('postalCode') || '-'}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Country</Label>
                                                {isEditingMemberProfile ? (
                                                    <Input
                                                        value={memberProfileForm.country || ''}
                                                        onChange={(e) => setMemberProfileForm(p => ({ ...p, country: e.target.value }))}
                                                    />
                                                ) : (
                                                    <p className="text-lg">{(member as any)?.country || '-'}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Occupation */}
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                                            <Briefcase className="h-4 w-4" />
                                            Occupation
                                        </h3>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label>Occupation</Label>
                                                {isEditingMemberProfile ? (
                                                    <Input
                                                        value={memberProfileForm.occupation || ''}
                                                        onChange={(e) => setMemberProfileForm(p => ({ ...p, occupation: e.target.value }))}
                                                        placeholder="e.g., Software Engineer"
                                                    />
                                                ) : (
                                                    <p className="text-lg">{(member as any)?.occupation || '-'}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Employer</Label>
                                                {isEditingMemberProfile ? (
                                                    <Input
                                                        value={memberProfileForm.employer || ''}
                                                        onChange={(e) => setMemberProfileForm(p => ({ ...p, employer: e.target.value }))}
                                                        placeholder="Company name"
                                                    />
                                                ) : (
                                                    <p className="text-lg">{(member as any)?.employer || '-'}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Emergency Contact */}
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" />
                                            Emergency Contact
                                        </h3>
                                        <div className="grid gap-4 md:grid-cols-3">
                                            <div className="space-y-2">
                                                <Label>Contact Name</Label>
                                                {isEditingMemberProfile ? (
                                                    <Input
                                                        value={memberProfileForm.emergencyContactName || ''}
                                                        onChange={(e) => setMemberProfileForm(p => ({ ...p, emergencyContactName: e.target.value }))}
                                                        placeholder="Full name"
                                                    />
                                                ) : (
                                                    <p className="text-lg">{getMemberProp('emergencyContactName') || '-'}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Contact Phone</Label>
                                                {isEditingMemberProfile ? (
                                                    <Input
                                                        value={memberProfileForm.emergencyContactPhone || ''}
                                                        onChange={(e) => setMemberProfileForm(p => ({ ...p, emergencyContactPhone: e.target.value }))}
                                                        placeholder="+1 234 567 8900"
                                                    />
                                                ) : (
                                                    <p className="text-lg">{getMemberProp('emergencyContactPhone') || '-'}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Relationship</Label>
                                                {isEditingMemberProfile ? (
                                                    <Input
                                                        value={memberProfileForm.emergencyContactRelationship || ''}
                                                        onChange={(e) => setMemberProfileForm(p => ({ ...p, emergencyContactRelationship: e.target.value }))}
                                                        placeholder="e.g., Spouse, Parent"
                                                    />
                                                ) : (
                                                    <p className="text-lg">{getMemberProp('emergencyContactRelationship') || '-'}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}

                    {/* Security Tab */}
                    <TabsContent value="security" className="mt-6 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Change Password</CardTitle>
                                <CardDescription>
                                    Update your password to keep your account secure
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 max-w-md">
                                <div className="space-y-2">
                                    <Label htmlFor="currentPassword">Current Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="currentPassword"
                                            type={showPasswords.current ? 'text' : 'password'}
                                            value={passwordForm.currentPassword}
                                            onChange={(e) => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-full"
                                            onClick={() => setShowPasswords(p => ({ ...p, current: !p.current }))}
                                        >
                                            {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="newPassword"
                                            type={showPasswords.new ? 'text' : 'password'}
                                            value={passwordForm.newPassword}
                                            onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-full"
                                            onClick={() => setShowPasswords(p => ({ ...p, new: !p.new }))}
                                        >
                                            {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Must be at least 8 characters with uppercase, lowercase, number, and special character
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirmPassword"
                                            type={showPasswords.confirm ? 'text' : 'password'}
                                            value={passwordForm.confirmPassword}
                                            onChange={(e) => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-full"
                                            onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))}
                                        >
                                            {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleChangePassword}
                                    disabled={
                                        changePasswordMutation.isPending ||
                                        !passwordForm.currentPassword ||
                                        !passwordForm.newPassword ||
                                        !passwordForm.confirmPassword ||
                                        passwordForm.newPassword !== passwordForm.confirmPassword
                                    }
                                >
                                    {changePasswordMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Key className="h-4 w-4 mr-2" />
                                    )}
                                    Update Password
                                </Button>

                                {passwordForm.newPassword && passwordForm.confirmPassword &&
                                    passwordForm.newPassword !== passwordForm.confirmPassword && (
                                        <p className="text-sm text-destructive">Passwords do not match</p>
                                    )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Session Information</CardTitle>
                                <CardDescription>Your current login session details</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                                <CheckCircle className="h-5 w-5 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium">Current Session</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Logged in {userLastLoginAt ? format(new Date(userLastLoginAt), 'PPp') : 'recently'}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Staff Management Tab */}
                    {isAdmin && (
                        <TabsContent value="staff" className="mt-6 space-y-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Staff Members</CardTitle>
                                        <CardDescription>
                                            Manage staff accounts and permissions
                                        </CardDescription>
                                    </div>
                                    <Button onClick={() => {
                                        resetStaffForm();
                                        setIsAddStaffOpen(true);
                                    }}>
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Add Staff
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="relative flex-1 max-w-sm">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search staff..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                        <Button variant="outline" onClick={() => refetchStaff()}>
                                            <RefreshCw className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {isLoadingStaff ? (
                                        <div className="space-y-3">
                                            {[...Array(3)].map((_, i) => (
                                                <Skeleton key={i} className="h-16 w-full" />
                                            ))}
                                        </div>
                                    ) : filteredStaff.length > 0 ? (
                                        <div className="rounded-lg border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Name</TableHead>
                                                        <TableHead>Email</TableHead>
                                                        <TableHead>Role</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead>Last Login</TableHead>
                                                        <TableHead className="w-[50px]"></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredStaff.map((staffMember) => {
                                                        const { firstName, lastName } = getStaffName(staffMember);
                                                        const profileImageUrl = staffMember.profileImageUrl || staffMember.profile_image_url;
                                                        const lastLoginAt = staffMember.lastLoginAt || staffMember.last_login_at;
                                                        const mustResetPassword = staffMember.mustResetPassword || staffMember.must_reset_password;

                                                        return (
                                                            <TableRow key={staffMember.id}>
                                                                <TableCell>
                                                                    <div className="flex items-center gap-3">
                                                                        <Avatar className="h-8 w-8">
                                                                            <AvatarImage src={profileImageUrl} />
                                                                            <AvatarFallback>
                                                                                {firstName?.[0]}{lastName?.[0]}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <div>
                                                                            <p className="font-medium">
                                                                                {firstName} {lastName}
                                                                            </p>
                                                                            {staffMember.id === authUser?.id && (
                                                                                <span className="text-xs text-muted-foreground">(You)</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>{staffMember.email}</TableCell>
                                                                <TableCell>
                                                                    <Badge variant="outline" className="capitalize">
                                                                        {getRoleLabel(staffMember.role)}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell>{getStatusBadge(staffMember)}</TableCell>
                                                                <TableCell className="text-sm text-muted-foreground">
                                                                    {lastLoginAt
                                                                        ? format(new Date(lastLoginAt), 'PP')
                                                                        : 'Never'
                                                                    }
                                                                </TableCell>
                                                                <TableCell>
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button variant="ghost" size="icon">
                                                                                <MoreHorizontal className="h-4 w-4" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end">
                                                                            <DropdownMenuItem onClick={() => openEditStaffDialog(staffMember)}>
                                                                                <Edit className="h-4 w-4 mr-2" />
                                                                                Edit
                                                                            </DropdownMenuItem>
                                                                            {mustResetPassword && (
                                                                                <DropdownMenuItem
                                                                                    onClick={() => handleResendInvite(staffMember.id)}
                                                                                    disabled={resendInviteMutation.isPending}
                                                                                >
                                                                                    <Send className="h-4 w-4 mr-2" />
                                                                                    Resend Invite
                                                                                </DropdownMenuItem>
                                                                            )}
                                                                            <DropdownMenuSeparator />
                                                                            <DropdownMenuItem
                                                                                className="text-destructive"
                                                                                onClick={() => setStaffToDelete(staffMember)}
                                                                                disabled={staffMember.id === authUser?.id}
                                                                            >
                                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                                Delete
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>No staff members found</p>
                                            <Button
                                                variant="link"
                                                onClick={() => {
                                                    resetStaffForm();
                                                    setIsAddStaffOpen(true);
                                                }}
                                                className="mt-2"
                                            >
                                                Add your first staff member
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}

                    {/* Church Info Tab */}
                    <TabsContent value="church" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Church Information</CardTitle>
                                <CardDescription>Your church profile details</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {church ? (
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Church Name</Label>
                                            <p className="text-lg font-medium">{church.name}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Email</Label>
                                            <p className="text-lg">{church.email || '-'}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Phone</Label>
                                            <p className="text-lg">{church.phone || '-'}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Address</Label>
                                            <p className="text-lg">
                                                {[church.address, church.city, church.state, church.country]
                                                    .filter(Boolean)
                                                    .join(', ') || '-'}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Timezone</Label>
                                            <p className="text-lg">{church.timezone || '-'}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Currency</Label>
                                            <p className="text-lg">{church.currency || '-'}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">No church information available</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Add Staff Dialog */}
                <Dialog open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Add Staff Member</DialogTitle>
                            <DialogDescription>
                                Create a new staff account. They will receive an email invitation to set up their password.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="staff-firstName">First Name *</Label>
                                    <Input
                                        id="staff-firstName"
                                        value={staffForm.firstName}
                                        onChange={(e) => setStaffForm(s => ({ ...s, firstName: e.target.value }))}
                                        placeholder="John"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="staff-lastName">Last Name *</Label>
                                    <Input
                                        id="staff-lastName"
                                        value={staffForm.lastName}
                                        onChange={(e) => setStaffForm(s => ({ ...s, lastName: e.target.value }))}
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="staff-email">Email Address *</Label>
                                <Input
                                    id="staff-email"
                                    type="email"
                                    value={staffForm.email}
                                    onChange={(e) => setStaffForm(s => ({ ...s, email: e.target.value }))}
                                    placeholder="john.doe@example.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="staff-phone">Phone Number</Label>
                                <Input
                                    id="staff-phone"
                                    value={staffForm.phoneNumber}
                                    onChange={(e) => setStaffForm(s => ({ ...s, phoneNumber: e.target.value }))}
                                    placeholder="+1 234 567 8900"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="staff-role">Role *</Label>
                                <Select
                                    value={staffForm.role}
                                    onValueChange={(value: StaffRole) => setStaffForm(s => ({ ...s, role: value }))}
                                >
                                    <SelectTrigger id="staff-role">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STAFF_ROLES.map((role) => (
                                            <SelectItem key={role.value} value={role.value}>
                                                <div className="flex flex-col">
                                                    <span>{role.label}</span>
                                                    <span className="text-xs text-muted-foreground">{role.description}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Separator />

                            <div className="space-y-3 bg-muted/50 p-3 rounded-lg">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="create-as-member"
                                        checked={staffForm.createAsMember}
                                        onCheckedChange={(checked) => setStaffForm(s => ({ ...s, createAsMember: checked as boolean }))}
                                    />
                                    <div className="flex-1">
                                        <Label
                                            htmlFor="create-as-member"
                                            className="text-sm font-medium cursor-pointer"
                                        >
                                            Also create as church member
                                        </Label>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            This will create a member record linked to the staff account
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="send-invite"
                                        checked={staffForm.sendInvite}
                                        onCheckedChange={(checked) => setStaffForm(s => ({ ...s, sendInvite: checked as boolean }))}
                                    />
                                    <div className="flex-1">
                                        <Label htmlFor="send-invite" className="text-sm font-medium cursor-pointer">
                                            Send email invitation
                                        </Label>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Send login credentials to their email address
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddStaffOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateStaff}
                                disabled={
                                    createStaffMutation.isPending ||
                                    !staffForm.firstName ||
                                    !staffForm.lastName ||
                                    !staffForm.email ||
                                    !staffForm.role
                                }
                            >
                                {createStaffMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <UserPlus className="h-4 w-4 mr-2" />
                                )}
                                Add Staff
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Staff Dialog */}
                <Dialog open={isEditStaffOpen} onOpenChange={setIsEditStaffOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Edit Staff Member</DialogTitle>
                            <DialogDescription>
                                Update staff member details and permissions.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-firstName">First Name *</Label>
                                    <Input
                                        id="edit-firstName"
                                        value={staffForm.firstName}
                                        onChange={(e) => setStaffForm(s => ({ ...s, firstName: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-lastName">Last Name *</Label>
                                    <Input
                                        id="edit-lastName"
                                        value={staffForm.lastName}
                                        onChange={(e) => setStaffForm(s => ({ ...s, lastName: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-email">Email Address</Label>
                                <Input
                                    id="edit-email"
                                    type="email"
                                    value={staffForm.email}
                                    disabled
                                    className="bg-muted"
                                />
                                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-phone">Phone Number</Label>
                                <Input
                                    id="edit-phone"
                                    value={staffForm.phoneNumber}
                                    onChange={(e) => setStaffForm(s => ({ ...s, phoneNumber: e.target.value }))}
                                    placeholder="+1 234 567 8900"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-role">Role *</Label>
                                <Select
                                    value={staffForm.role}
                                    onValueChange={(value: StaffRole) => setStaffForm(s => ({ ...s, role: value }))}
                                    disabled={selectedStaff?.id === authUser?.id}
                                >
                                    <SelectTrigger id="edit-role">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STAFF_ROLES.map((role) => (
                                            <SelectItem key={role.value} value={role.value}>
                                                <div className="flex flex-col">
                                                    <span>{role.label}</span>
                                                    <span className="text-xs text-muted-foreground">{role.description}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {selectedStaff?.id === authUser?.id && (
                                    <p className="text-xs text-muted-foreground">You cannot change your own role</p>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditStaffOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpdateStaff}
                                disabled={
                                    updateStaffMutation.isPending ||
                                    !staffForm.firstName ||
                                    !staffForm.lastName ||
                                    !staffForm.role
                                }
                            >
                                {updateStaffMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Staff Alert Dialog */}
                <AlertDialog open={!!staffToDelete} onOpenChange={() => setStaffToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete{' '}
                                <span className="font-semibold">
                                    {staffToDelete && getStaffName(staffToDelete).firstName} {staffToDelete && getStaffName(staffToDelete).lastName}
                                </span>
                                ? This action cannot be undone. They will lose access to the system immediately.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteStaff}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                {deleteStaffMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Trash2 className="h-4 w-4 mr-2" />
                                )}
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
}