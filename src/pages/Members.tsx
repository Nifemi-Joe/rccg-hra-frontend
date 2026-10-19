// src/pages/Members.tsx
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    QrCode,
    TrendingUp,
    TrendingDown,
    Search,
    Download,
    UserPlus,
    MoreHorizontal,
    Pencil,
    Trash2,
    Eye,
    Mail,
    Phone,
    Copy,
    Check,
    ChevronLeft,
    ChevronRight,
    Users,
    RefreshCw,
    Cake,
    Heart,
    Calendar,
    Gift,
    PartyPopper,
    Share2,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { MemberModal } from "@/components/modals/CreateMemberModal.tsx";
import { useMembers } from "@/hooks/useMembers";
import { useAuth } from "@/contexts/AuthContext";
import { membersApi, memberSelfUpdateApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Member, Celebration as CelebrationMember } from "@/types/member.ts"
import { cn } from "@/lib/utils";
import { ImportModal } from "@/components/modals/ImportModal";
import { useImport } from "@/hooks/useImport";
import { format, parseISO } from "date-fns";

export default function Members() {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') || 'members';

    const [activeTab, setActiveTab] = useState(initialTab);
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const { importData: importMembers } = useImport('members');
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [genderFilter, setGenderFilter] = useState<string>("all");
    const [copied, setCopied] = useState(false);
    const { user, church } = useAuth();
    const { toast } = useToast();

    // Celebrations state
    const [celebrations, setCelebrations] = useState<CelebrationMember[]>([]);
    const [celebrationsLoading, setCelebrationsLoading] = useState(false);
    const [celebrationType, setCelebrationType] = useState<string>("all");
    const [celebrationPeriod, setCelebrationPeriod] = useState<string>("all");
    const [celebrationPage, setCelebrationPage] = useState(1);
    const [celebrationPagination, setCelebrationPagination] = useState({
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
    });

    const {
        members,
        statistics,
        pagination,
        isLoading,
        isLoadingStats,
        filters,
        setFilters,
        deleteMember,
        refetch,
    } = useMembers();

    // QR Registration URL
    const qrRegistrationUrl = `${window.location.origin}/register/${church?.id || ''}`;

    // ============================================================================
    // SHARE LINK HANDLERS
    // ============================================================================

    const handleShareLink = async (member: Member, channel: 'email' | 'phone') => {
        try {
            const result = await memberSelfUpdateApi.sendShareLink(member.id, channel);
            toast({
                title: "Link Sent",
                description: result.message || `Update link sent via ${channel === 'email' ? 'email' : 'SMS'} to ${member.first_name}`,
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || error.message || "Failed to send link",
            });
        }
    };

    const handleCopyShareLink = async (member: Member) => {
        try {
            const result = await memberSelfUpdateApi.getShareLink(member.id);
            await navigator.clipboard.writeText(result.link);
            toast({
                title: "Link Copied",
                description: "Update link copied to clipboard. Share it with the member.",
            });
        } catch (error: any) {
            // Fallback: construct the link manually
            const baseUrl = window.location.origin;
            const link = `${baseUrl}/member/update/${member.id}?church=${church?.id}`;
            try {
                await navigator.clipboard.writeText(link);
                toast({
                    title: "Link Copied",
                    description: "Update link copied to clipboard.",
                });
            } catch {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to copy link to clipboard",
                });
            }
        }
    };

    // ============================================================================
    // EXISTING HANDLERS
    // ============================================================================

    const getProfileStatusBadge = (member: Member) => {
        if (member.profile_completed_at) {
            return <Badge variant="default" className="bg-green-500">Completed</Badge>;
        } else if (member.profile_update_token && member.profile_update_token_expires_at) {
            const expiresAt = new Date(member.profile_update_token_expires_at);
            if (expiresAt > new Date()) {
                return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Pending</Badge>;
            }
        }
        return <Badge variant="secondary">Not Started</Badge>;
    };

    // Update URL when tab changes
    useEffect(() => {
        setSearchParams({ tab: activeTab });
    }, [activeTab, setSearchParams]);

    // Fetch celebrations when tab is active
    useEffect(() => {
        if (activeTab === 'celebrations') {
            fetchCelebrations();
        }
    }, [activeTab, celebrationType, celebrationPeriod, celebrationPage]);

    const fetchCelebrations = async () => {
        setCelebrationsLoading(true);
        try {
            const result = await membersApi.getCelebrations({
                type: celebrationType as 'birthday' | 'anniversary' | 'all',
                period: celebrationPeriod as 'upcoming' | 'past' | 'all',
                page: celebrationPage,
                limit: 20,
            });
            setCelebrations(result.celebrations);
            setCelebrationPagination(result.pagination);
        } catch (error) {
            console.error('Error fetching celebrations:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load celebrations",
            });
        } finally {
            setCelebrationsLoading(false);
        }
    };

    // Handle search with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setFilters({ ...filters, search: searchQuery, page: 1 });
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Handle filter changes
    useEffect(() => {
        setFilters({
            ...filters,
            status: statusFilter === 'all' ? undefined : statusFilter,
            gender: genderFilter === 'all' ? undefined : genderFilter,
            page: 1,
        });
    }, [statusFilter, genderFilter]);

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(qrRegistrationUrl);
            setCopied(true);
            toast({ title: "Link copied!", description: "Registration link copied to clipboard." });
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast({ variant: "destructive", title: "Failed to copy", description: "Please copy the link manually." });
        }
    };

    const handleEditMember = (member: Member) => {
        setSelectedMember(member);
        setShowMemberModal(true);
    };

    const handleDeleteMember = async () => {
        if (memberToDelete) {
            await deleteMember(memberToDelete.id);
            setMemberToDelete(null);
        }
    };

    const handleModalClose = () => {
        setShowMemberModal(false);
        setSelectedMember(null);
    };

    const handleModalSuccess = () => {
        handleModalClose();
        refetch();
    };

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
            active: { variant: "default", label: "Active" },
            inactive: { variant: "secondary", label: "Inactive" },
            suspended: { variant: "destructive", label: "Suspended" },
        };
        const config = variants[status] || variants.active;
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const getCelebrationBadge = (daysUntil: number, hasPassed: boolean) => {
        if (hasPassed) {
            return <Badge variant="secondary">Passed</Badge>;
        }
        if (daysUntil === 0) {
            return <Badge className="bg-green-500 hover:bg-green-600">Today! 🎉</Badge>;
        }
        if (daysUntil === 1) {
            return <Badge className="bg-yellow-500 hover:bg-yellow-600">Tomorrow</Badge>;
        }
        if (daysUntil <= 7) {
            return <Badge className="bg-orange-500 hover:bg-orange-600">This Week</Badge>;
        }
        if (daysUntil <= 30) {
            return <Badge variant="outline">This Month</Badge>;
        }
        return <Badge variant="outline">{daysUntil} days</Badge>;
    };

    const formatCelebrationDate = (dateString: string) => {
        try {
            return format(parseISO(dateString), 'MMMM d');
        } catch {
            return dateString;
        }
    };

    // Prepare chart data
    const genderData = statistics ? [
        { name: "Male", value: statistics.byGender.male, color: "hsl(var(--chart-1))" },
        { name: "Female", value: statistics.byGender.female, color: "hsl(var(--chart-2))" },
        { name: "Other", value: statistics.byGender.other + statistics.byGender.unknown, color: "hsl(var(--muted))" },
    ].filter(item => item.value > 0) : [];

    const maritalData = statistics ? [
        { name: "Single", value: statistics.byMaritalStatus.single, color: "hsl(var(--chart-1))" },
        { name: "Married", value: statistics.byMaritalStatus.married, color: "hsl(var(--chart-2))" },
        { name: "Divorced", value: statistics.byMaritalStatus.divorced, color: "hsl(var(--chart-3))" },
        { name: "Widowed", value: statistics.byMaritalStatus.widowed, color: "hsl(var(--chart-4))" },
        { name: "Unknown", value: statistics.byMaritalStatus.unknown, color: "hsl(var(--muted))" },
    ].filter(item => item.value > 0) : [];

    // Celebrations Table Component
    const CelebrationsTable = () => (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <CardTitle className="flex items-center gap-2">
                        <PartyPopper className="h-5 w-5" />
                        Celebrations
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button
                            size="icon"
                            variant="outline"
                            onClick={fetchCelebrations}
                        >
                            <RefreshCw className={cn("h-4 w-4", celebrationsLoading && "animate-spin")} />
                        </Button>
                        <Select value={celebrationType} onValueChange={(value) => {
                            setCelebrationType(value);
                            setCelebrationPage(1);
                        }}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="birthday">Birthdays</SelectItem>
                                <SelectItem value="anniversary">Anniversaries</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={celebrationPeriod} onValueChange={(value) => {
                            setCelebrationPeriod(value);
                            setCelebrationPage(1);
                        }}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Year</SelectItem>
                                <SelectItem value="upcoming">Upcoming</SelectItem>
                                <SelectItem value="past">Passed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {celebrationsLoading ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-48" />
                                </div>
                                <Skeleton className="h-6 w-20" />
                            </div>
                        ))}
                    </div>
                ) : celebrations.length === 0 ? (
                    <div className="text-center py-12">
                        <Gift className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                        <p className="text-muted-foreground">
                            No celebrations found for the selected filters.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Member</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="hidden md:table-cell">Details</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="hidden lg:table-cell">Contact</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {celebrations.map((celebration) => (
                                        <TableRow
                                            key={`${celebration.id}-${celebration.celebration_type}`}
                                            className={cn(
                                                celebration.days_until === 0 && "bg-green-50 dark:bg-green-950/20",
                                                celebration.has_passed_this_year && "opacity-60"
                                            )}
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={celebration.profile_image_url} />
                                                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                                            {getInitials(celebration.first_name, celebration.last_name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">
                                                            {celebration.first_name} {celebration.last_name}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {celebration.celebration_type === 'birthday' ? (
                                                        <>
                                                            <Cake className="h-4 w-4 text-pink-500" />
                                                            <span>Birthday</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Heart className="h-4 w-4 text-red-500" />
                                                            <span>Anniversary</span>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    <span>{formatCelebrationDate(celebration.celebration_date)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                {celebration.celebration_type === 'birthday' ? (
                                                    <span className="text-muted-foreground">
                                                        Turning {celebration.age} years old
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        {celebration.years} years married
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {getCelebrationBadge(celebration.days_until, celebration.has_passed_this_year)}
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell">
                                                <div className="flex items-center gap-2">
                                                    {celebration.phone && (
                                                        <a
                                                            href={`tel:${celebration.phone}`}
                                                            className="text-muted-foreground hover:text-foreground"
                                                        >
                                                            <Phone className="h-4 w-4" />
                                                        </a>
                                                    )}
                                                    {celebration.email && (
                                                        <a
                                                            href={`mailto:${celebration.email}`}
                                                            className="text-muted-foreground hover:text-foreground"
                                                        >
                                                            <Mail className="h-4 w-4" />
                                                        </a>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {celebrationPagination.totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-sm text-muted-foreground">
                                    Showing {((celebrationPagination.page - 1) * celebrationPagination.limit) + 1} to{' '}
                                    {Math.min(celebrationPagination.page * celebrationPagination.limit, celebrationPagination.total)} of{' '}
                                    {celebrationPagination.total} celebrations
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCelebrationPage(p => p - 1)}
                                        disabled={celebrationPagination.page <= 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Previous
                                    </Button>
                                    <span className="text-sm text-muted-foreground px-2">
                                        Page {celebrationPagination.page} of {celebrationPagination.totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCelebrationPage(p => p + 1)}
                                        disabled={celebrationPagination.page >= celebrationPagination.totalPages}
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );

    return (
        <DashboardLayout
            title="Members"
            actions={
                <>
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => setShowImportModal(true)}
                    >
                        <Download className="h-4 w-4" />
                        Import
                    </Button>

                    <Button
                        className="bg-gradient-primary text-white hover:opacity-90 gap-2"
                        onClick={() => {
                            setSelectedMember(null);
                            setShowMemberModal(true);
                        }}
                    >
                        <UserPlus className="h-4 w-4" />
                        Add Member
                    </Button>
                </>
            }
        >
            <div className="p-6 space-y-6">
                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="members" className="gap-2">
                            <Users className="h-4 w-4" />
                            Members
                        </TabsTrigger>
                        <TabsTrigger value="celebrations" className="gap-2">
                            <PartyPopper className="h-4 w-4" />
                            Celebrations
                            {statistics && (statistics.upcomingBirthdays + statistics.upcomingAnniversaries) > 0 && (
                                <Badge variant="secondary" className="ml-1">
                                    {statistics.upcomingBirthdays + statistics.upcomingAnniversaries}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {/* Members Tab Content */}
                    <TabsContent value="members" className="space-y-6 mt-6">
                        {/* QR Code Section */}
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-primary">
                                            <QrCode className="h-8 w-8 text-white" />
                                        </div>
                                        <span className="text-sm font-medium text-foreground">QR Code</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="mb-2 text-sm text-muted-foreground">
                                            Share the link to your members to enable them to add their details to your church.
                                        </p>
                                        <div className="flex gap-2">
                                            <Input
                                                readOnly
                                                value={qrRegistrationUrl}
                                                className="font-mono text-xs"
                                            />
                                            <Button size="icon" variant="outline" onClick={handleCopyLink}>
                                                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Summary Section */}
                        <div>
                            <h2 className="mb-4 text-xl font-semibold text-foreground">Summary</h2>
                            <div className="grid gap-6 md:grid-cols-3">
                                {/* Total Members */}
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">
                                            TOTAL MEMBERS
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {isLoadingStats ? (
                                            <Skeleton className="h-12 w-32" />
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <div className="text-4xl font-bold text-foreground">
                                                    {statistics?.total || 0}
                                                </div>
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    {(statistics?.growthPercentage || 0) >= 0 ? (
                                                        <TrendingUp className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <TrendingDown className="h-4 w-4 text-red-500" />
                                                    )}
                                                    <span className={cn(
                                                        (statistics?.growthPercentage || 0) >= 0 ? "text-green-600" : "text-red-600"
                                                    )}>
                                                        {statistics?.growthPercentage || 0}%
                                                    </span>
                                                    <span>Since last month</span>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* By Gender */}
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">
                                            By Gender
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {isLoadingStats ? (
                                            <div className="flex items-center justify-between">
                                                <Skeleton className="h-[120px] w-[120px] rounded-full" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-20" />
                                                    <Skeleton className="h-4 w-20" />
                                                    <Skeleton className="h-4 w-20" />
                                                </div>
                                            </div>
                                        ) : genderData.length > 0 ? (
                                            <div className="flex items-center justify-between">
                                                <ResponsiveContainer width={120} height={120}>
                                                    <PieChart>
                                                        <Pie
                                                            data={genderData}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={35}
                                                            outerRadius={50}
                                                            paddingAngle={2}
                                                            dataKey="value"
                                                        >
                                                            {genderData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                <div className="flex flex-col gap-2 text-sm">
                                                    {genderData.map((item) => (
                                                        <div key={item.name} className="flex items-center gap-2">
                                                            <div
                                                                className="h-3 w-3 rounded-full"
                                                                style={{ backgroundColor: item.color }}
                                                            />
                                                            <span className="text-muted-foreground">
                                                                {item.name} ({item.value})
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground text-center py-4">No data</p>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* By Marital Status */}
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">
                                            By Marital Status
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {isLoadingStats ? (
                                            <div className="flex items-center justify-between">
                                                <Skeleton className="h-[120px] w-[120px] rounded-full" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-20" />
                                                    <Skeleton className="h-4 w-20" />
                                                    <Skeleton className="h-4 w-20" />
                                                </div>
                                            </div>
                                        ) : maritalData.length > 0 ? (
                                            <div className="flex items-center justify-between">
                                                <ResponsiveContainer width={120} height={120}>
                                                    <PieChart>
                                                        <Pie
                                                            data={maritalData}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={35}
                                                            outerRadius={50}
                                                            paddingAngle={2}
                                                            dataKey="value"
                                                        >
                                                            {maritalData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                <div className="flex flex-col gap-1 text-xs">
                                                    {maritalData.map((item) => (
                                                        <div key={item.name} className="flex items-center gap-2">
                                                            <div
                                                                className="h-2 w-2 rounded-full"
                                                                style={{ backgroundColor: item.color }}
                                                            />
                                                            <span className="text-muted-foreground">
                                                                {item.name} ({item.value})
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground text-center py-4">No data</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Members List */}
                        <Card>
                            <CardContent className="p-6">
                                {/* Filters */}
                                <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <Button size="icon" variant="outline" onClick={refetch}>
                                            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                                        </Button>
                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger className="w-[130px]">
                                                <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Status</SelectItem>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="inactive">Inactive</SelectItem>
                                                <SelectItem value="suspended">Suspended</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={genderFilter} onValueChange={setGenderFilter}>
                                            <SelectTrigger className="w-[130px]">
                                                <SelectValue placeholder="Gender" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Gender</SelectItem>
                                                <SelectItem value="male">Male</SelectItem>
                                                <SelectItem value="female">Female</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="relative w-full sm:w-auto">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            placeholder="Search members..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9 w-full sm:w-64"
                                        />
                                    </div>
                                </div>

                                {/* Members Table */}
                                {isLoading ? (
                                    <div className="space-y-4">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className="flex items-center gap-4">
                                                <Skeleton className="h-10 w-10 rounded-full" />
                                                <div className="space-y-2 flex-1">
                                                    <Skeleton className="h-4 w-32" />
                                                    <Skeleton className="h-3 w-48" />
                                                </div>
                                                <Skeleton className="h-6 w-16" />
                                                <Skeleton className="h-8 w-8" />
                                            </div>
                                        ))}
                                    </div>
                                ) : members.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                                        <p className="text-muted-foreground">
                                            {searchQuery || statusFilter !== 'all' || genderFilter !== 'all'
                                                ? 'No members match your search criteria.'
                                                : 'No members added yet. Click "Add Member" to get started.'}
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Member</TableHead>
                                                        <TableHead className="hidden md:table-cell">Contact</TableHead>
                                                        <TableHead className="hidden lg:table-cell">Gender</TableHead>
                                                        <TableHead className="hidden lg:table-cell">Status</TableHead>
                                                        <TableHead className="hidden xl:table-cell">Profile</TableHead>
                                                        <TableHead className="w-[50px]"></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {members.map((member) => (
                                                        <TableRow key={member.id}>
                                                            <TableCell>
                                                                <div className="flex items-center gap-3">
                                                                    <Avatar className="h-10 w-10">
                                                                        <AvatarImage src={member.profile_image_url} />
                                                                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                                                            {getInitials(member.first_name, member.last_name)}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div>
                                                                        <p className="font-medium">
                                                                            {member.first_name} {member.last_name}
                                                                        </p>
                                                                        <p className="text-sm text-muted-foreground md:hidden">
                                                                            {member.email || member.phone || 'No contact'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="hidden md:table-cell">
                                                                <div className="space-y-1">
                                                                    {member.email && (
                                                                        <div className="flex items-center gap-1 text-sm">
                                                                            <Mail className="h-3 w-3 text-muted-foreground" />
                                                                            <span>{member.email}</span>
                                                                        </div>
                                                                    )}
                                                                    {member.phone && (
                                                                        <div className="flex items-center gap-1 text-sm">
                                                                            <Phone className="h-3 w-3 text-muted-foreground" />
                                                                            <span>{member.phone}</span>
                                                                        </div>
                                                                    )}
                                                                    {!member.email && !member.phone && (
                                                                        <span className="text-sm text-muted-foreground">No contact info</span>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="hidden lg:table-cell capitalize">
                                                                {member.gender || '-'}
                                                            </TableCell>
                                                            <TableCell className="hidden lg:table-cell">
                                                                {getStatusBadge(member.status)}
                                                            </TableCell>
                                                            <TableCell className="hidden xl:table-cell">
                                                                {getProfileStatusBadge(member)}
                                                            </TableCell>
                                                            <TableCell>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon">
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem onClick={() => handleEditMember(member)}>
                                                                            <Eye className="mr-2 h-4 w-4" />
                                                                            View Details
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleEditMember(member)}>
                                                                            <Pencil className="mr-2 h-4 w-4" />
                                                                            Edit
                                                                        </DropdownMenuItem>

                                                                        <DropdownMenuSeparator />

                                                                        {/* Share Update Link Submenu */}
                                                                        <DropdownMenuSub>
                                                                            <DropdownMenuSubTrigger>
                                                                                <Share2 className="mr-2 h-4 w-4" />
                                                                                Share Update Link
                                                                            </DropdownMenuSubTrigger>
                                                                            <DropdownMenuSubContent>
                                                                                <DropdownMenuItem
                                                                                    onClick={() => handleShareLink(member, 'email')}
                                                                                    disabled={!member.email}
                                                                                >
                                                                                    <Mail className="mr-2 h-4 w-4" />
                                                                                    Send via Email
                                                                                    {!member.email && (
                                                                                        <span className="ml-2 text-xs text-muted-foreground">(No email)</span>
                                                                                    )}
                                                                                </DropdownMenuItem>
                                                                                <DropdownMenuItem
                                                                                    onClick={() => handleShareLink(member, 'phone')}
                                                                                    disabled={!member.phone}
                                                                                >
                                                                                    <Phone className="mr-2 h-4 w-4" />
                                                                                    Send via SMS
                                                                                    {!member.phone && (
                                                                                        <span className="ml-2 text-xs text-muted-foreground">(No phone)</span>
                                                                                    )}
                                                                                </DropdownMenuItem>
                                                                                <DropdownMenuSeparator />
                                                                                <DropdownMenuItem onClick={() => handleCopyShareLink(member)}>
                                                                                    <Copy className="mr-2 h-4 w-4" />
                                                                                    Copy Link
                                                                                </DropdownMenuItem>
                                                                            </DropdownMenuSubContent>
                                                                        </DropdownMenuSub>

                                                                        <DropdownMenuSeparator />

                                                                        <DropdownMenuItem
                                                                            className="text-destructive focus:text-destructive"
                                                                            onClick={() => setMemberToDelete(member)}
                                                                        >
                                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                                            Delete
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        {/* Pagination */}
                                        {pagination && pagination.totalPages > 1 && (
                                            <div className="flex items-center justify-between mt-4">
                                                <p className="text-sm text-muted-foreground">
                                                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                                                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                                                    {pagination.total} members
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                                                        disabled={pagination.page <= 1}
                                                    >
                                                        <ChevronLeft className="h-4 w-4" />
                                                        Previous
                                                    </Button>
                                                    <span className="text-sm text-muted-foreground px-2">
                                                        Page {pagination.page} of {pagination.totalPages}
                                                    </span>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                                                        disabled={pagination.page >= pagination.totalPages}
                                                    >
                                                        Next
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Celebrations Tab Content */}
                    <TabsContent value="celebrations" className="mt-6">
                        <CelebrationsTable />
                    </TabsContent>
                </Tabs>
            </div>

            {/* Member Modal (Create/Edit) */}
            <MemberModal
                open={showMemberModal}
                onClose={handleModalClose}
                onSuccess={handleModalSuccess}
                member={selectedMember}
            />

            <ImportModal
                open={showImportModal}
                onClose={() => setShowImportModal(false)}
                onSuccess={() => {
                    setShowImportModal(false);
                    refetch();
                }}
                importType="members"
                onImport={importMembers}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!memberToDelete} onOpenChange={() => setMemberToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Member</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete{' '}
                            <span className="font-medium">
                                {memberToDelete?.first_name} {memberToDelete?.last_name}
                            </span>
                            ? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteMember}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
}