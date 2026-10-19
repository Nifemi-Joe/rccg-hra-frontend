import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
    Users,
    Plus,
    Search,
    MoreHorizontal,
    Pencil,
    Trash2,
    Eye,
    UserPlus,
    Calendar,
    MapPin,
    Video,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Clock,
    CalendarPlus,
    Download,
    CheckCircle2,
    XCircle,
    ShieldCheck,
    Filter,
    Bell,
} from 'lucide-react';
import { GroupModal } from '@/components/modals/CreateGroupModal';
import { GroupDetailModal } from '@/components/modals/GroupDetailModal';
import { MeetingModal } from '@/components/modals/MeetingModal';
import { ImportModal } from '@/components/modals/ImportModal';
import {
    ApproveDialog,
    RejectDialog,
    ApprovalStatusBadge,
    RejectionReason,
} from '@/components/modals/ApprovalDialog';
import { useGroups } from '@/hooks/useGroups';
import { useImport } from '@/hooks/useImport';
import { Group, GroupMeeting } from '@/lib/api';
import { format, parseISO, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Groups() {
    // ========================================================================
    // STATE
    // ========================================================================
    const [activeTab, setActiveTab] = useState('groups');
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [selectedMeeting, setSelectedMeeting] = useState<GroupMeeting | null>(null);
    const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [approvalFilter, setApprovalFilter] = useState<string>('all');

    // Approval dialog states
    const [groupToApprove, setGroupToApprove] = useState<Group | null>(null);
    const [groupToReject, setGroupToReject] = useState<Group | null>(null);

    // ========================================================================
    // HOOKS
    // ========================================================================
    const {
        groups,
        groupTypes,
        statistics,
        pagination,
        allMeetings,
        pendingApprovals,
        isLoading,
        isLoadingStats,
        isLoadingMeetings,
        filters,
        setFilters,
        deleteGroup,
        approveGroup,
        rejectGroup,
        fetchAllMeetings,
        refetch,
    } = useGroups();

    const { importData: importGroups } = useImport('groups');

    // ========================================================================
    // EFFECTS
    // ========================================================================
    const fetchMeetings = useCallback(() => {
        fetchAllMeetings({ upcoming: true });
    }, [fetchAllMeetings]);

    useEffect(() => {
        if (activeTab === 'meetings') {
            fetchMeetings();
        }
    }, [activeTab, fetchMeetings]);

    // Search debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setFilters((prev) => ({ ...prev, search: searchQuery, page: 1 }));
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, setFilters]);

    // Type filter
    useEffect(() => {
        setFilters((prev) => ({
            ...prev,
            typeId: typeFilter === 'all' ? undefined : typeFilter,
            page: 1,
        }));
    }, [typeFilter, setFilters]);

    // Approval filter
    useEffect(() => {
        setFilters((prev) => ({
            ...prev,
            approvalStatus: approvalFilter === 'all' ? 'all' : (approvalFilter as any),
            page: 1,
        }));
    }, [approvalFilter, setFilters]);

    // ========================================================================
    // HANDLERS
    // ========================================================================
    const handleEditGroup = (group: Group) => {
        setSelectedGroup(group);
        setShowGroupModal(true);
    };

    const handleViewGroup = (group: Group) => {
        setSelectedGroup(group);
        setShowDetailModal(true);
    };

    const handleDeleteGroup = async () => {
        if (groupToDelete) {
            await deleteGroup(groupToDelete.id);
            setGroupToDelete(null);
        }
    };

    const handleApproveGroup = async () => {
        if (groupToApprove) {
            await approveGroup(groupToApprove.id);
        }
    };

    const handleRejectGroup = async (reason: string) => {
        if (groupToReject) {
            await rejectGroup(groupToReject.id, reason);
        }
    };

    const handleCreateMeeting = (group?: Group) => {
        setSelectedGroup(group || null);
        setSelectedMeeting(null);
        setShowMeetingModal(true);
    };

    const handleModalClose = () => {
        setShowGroupModal(false);
        setSelectedGroup(null);
    };

    const handleModalSuccess = () => {
        handleModalClose();
        refetch();
    };

    // ========================================================================
    // HELPERS
    // ========================================================================
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getMeetingTypeIcon = (type: string) => {
        switch (type) {
            case 'online':
                return <Video className="h-4 w-4 text-blue-500" />;
            case 'physical':
                return <MapPin className="h-4 w-4 text-green-500" />;
            case 'hybrid':
                return (
                    <div className="flex">
                        <MapPin className="h-4 w-4 text-green-500" />
                        <Video className="h-4 w-4 text-blue-500 -ml-1" />
                    </div>
                );
            default:
                return null;
        }
    };

    const getMeetingDateLabel = (date: string) => {
        const meetingDate = parseISO(date);
        if (isToday(meetingDate)) return 'Today';
        if (isTomorrow(meetingDate)) return 'Tomorrow';
        if (isThisWeek(meetingDate)) return format(meetingDate, 'EEEE');
        return format(meetingDate, 'MMM d, yyyy');
    };

    const getPlatformLabel = (platform?: string) => {
        const labels: Record<string, string> = {
            zoom: 'Zoom',
            google_meet: 'Google Meet',
            microsoft_teams: 'Microsoft Teams',
            other: 'Video Call',
        };
        return platform ? labels[platform] || platform : '';
    };

    const getGroupCardBorderClass = (status: string) => {
        switch (status) {
            case 'pending':
                return 'border-l-4 border-l-amber-400';
            case 'rejected':
                return 'border-l-4 border-l-red-400';
            default:
                return '';
        }
    };
    console.log(pendingApprovals);
    // Pending counts
    const pendingGroupCount = pendingApprovals?.pendingGroups.length || 0;
    const pendingMemberCount = pendingApprovals?.pendingMembers.length || 0;
    const totalPending = pendingApprovals?.totalPendingGroups || 0;

    // ========================================================================
    // RENDER
    // ========================================================================
    return (
        <DashboardLayout
            title="Groups & Departments"
            actions={
                <>
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => setShowImportModal(true)}
                    >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Import</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowMeetingModal(true)}
                    >
                        <CalendarPlus className="h-4 w-4" />
                    </Button>
                    <Button
                        className="bg-gradient-primary text-white hover:opacity-90 gap-2"
                        onClick={() => {
                            setSelectedGroup(null);
                            setShowGroupModal(true);
                        }}
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Create Group</span>
                    </Button>
                </>
            }
        >
            <div className="p-6 space-y-6">
                {/* ============================================================ */}
                {/* STATISTICS CARDS */}
                {/* ============================================================ */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Groups
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {isLoadingStats ? (
                                <Skeleton className="h-8 w-16" />
                            ) : (
                                <div className="text-2xl font-bold">
                                    {statistics?.totalGroups || 0}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Active Groups
                            </CardTitle>
                            <Users className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            {isLoadingStats ? (
                                <Skeleton className="h-8 w-16" />
                            ) : (
                                <div className="text-2xl font-bold text-green-600">
                                    {statistics?.activeGroups || 0}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Members
                            </CardTitle>
                            <UserPlus className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {isLoadingStats ? (
                                <Skeleton className="h-8 w-16" />
                            ) : (
                                <div className="text-2xl font-bold">
                                    {statistics?.totalMembers || 0}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Pending Approvals - Highlighted */}
                    <Card
                        className={cn(
                            'transition-all',
                            totalPending > 0 &&
                            'ring-2 ring-amber-400/50 bg-amber-50/30 dark:bg-amber-950/10'
                        )}
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Pending
                            </CardTitle>
                            <div className="relative">
                                <ShieldCheck className="h-4 w-4 text-amber-500" />
                                {totalPending > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 items-center justify-center text-[8px] text-white font-bold">
                                            {totalPending > 9 ? '9+' : totalPending}
                                        </span>
                                    </span>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoadingStats ? (
                                <Skeleton className="h-8 w-16" />
                            ) : (
                                <div className="space-y-1">
                                    <div className="text-2xl font-bold text-amber-600">
                                        {totalPending}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                        <span>{pendingGroupCount} groups</span>
                                        <span>•</span>
                                        <span>{pendingMemberCount} members</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                This Week
                            </CardTitle>
                            <Calendar className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            {isLoadingStats ? (
                                <Skeleton className="h-8 w-16" />
                            ) : (
                                <>
                                    <div className="text-2xl font-bold text-blue-600">
                                        {statistics?.meetingsThisWeek || 0}
                                    </div>
                                    <p className="text-xs text-muted-foreground">meetings</p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Upcoming
                            </CardTitle>
                            <Clock className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            {isLoadingStats ? (
                                <Skeleton className="h-8 w-16" />
                            ) : (
                                <>
                                    <div className="text-2xl font-bold text-orange-600">
                                        {statistics?.upcomingMeetings || 0}
                                    </div>
                                    <p className="text-xs text-muted-foreground">meetings</p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ============================================================ */}
                {/* PENDING APPROVALS BANNER */}
                {/* ============================================================ */}
                {totalPending > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-900/50 p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                                    <Bell className="h-5 w-5 text-amber-600" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                                        Pending Approvals
                                    </h4>
                                    <p className="text-xs text-amber-600 dark:text-amber-400">
                                        {pendingGroupCount > 0 &&
                                            `${pendingGroupCount} group${pendingGroupCount > 1 ? 's' : ''}`}
                                        {pendingGroupCount > 0 && pendingMemberCount > 0 && ' and '}
                                        {pendingMemberCount > 0 &&
                                            `${pendingMemberCount} member addition${pendingMemberCount > 1 ? 's' : ''}`}{' '}
                                        awaiting your review
                                    </p>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-400"
                                onClick={() => {
                                    setApprovalFilter('pending');
                                    setActiveTab('groups');
                                }}
                            >
                                <Filter className="mr-2 h-3.5 w-3.5" />
                                View Pending
                            </Button>
                        </div>
                    </div>
                )}

                {/* ============================================================ */}
                {/* TABS */}
                {/* ============================================================ */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="groups" className="gap-2">
                            <Users className="h-4 w-4" />
                            Groups
                        </TabsTrigger>
                        <TabsTrigger value="meetings" className="gap-2">
                            <Calendar className="h-4 w-4" />
                            Upcoming Meetings
                        </TabsTrigger>
                    </TabsList>

                    {/* ======================================================== */}
                    {/* GROUPS TAB */}
                    {/* ======================================================== */}
                    <TabsContent value="groups" className="space-y-4">
                        {/* Filters Bar */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-2 flex-wrap">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button size="icon" variant="outline" onClick={refetch}>
                                                <RefreshCw
                                                    className={cn(
                                                        'h-4 w-4',
                                                        isLoading && 'animate-spin'
                                                    )}
                                                />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Refresh</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue placeholder="All Types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        {groupTypes.map((type) => (
                                            <SelectItem key={type.id} value={type.id}>
                                                {type.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Approval Status Filter */}
                                <Select value={approvalFilter} onValueChange={setApprovalFilter}>
                                    <SelectTrigger className="w-[170px]">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="h-3.5 w-3.5" />
                                            <SelectValue placeholder="All Status" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="pending">
                                            <span className="flex items-center gap-2">
                                                <Clock className="h-3.5 w-3.5 text-amber-500" />
                                                Pending
                                                {pendingGroupCount > 0 && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="h-5 px-1.5 text-[10px] bg-amber-100 text-amber-700"
                                                    >
                                                        {pendingGroupCount}
                                                    </Badge>
                                                )}
                                            </span>
                                        </SelectItem>
                                        <SelectItem value="approved">
                                            <span className="flex items-center gap-2">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                                Approved
                                            </span>
                                        </SelectItem>
                                        <SelectItem value="rejected">
                                            <span className="flex items-center gap-2">
                                                <XCircle className="h-3.5 w-3.5 text-red-500" />
                                                Rejected
                                            </span>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search groups..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        {/* Active Filter Indicators */}
                        {(approvalFilter !== 'all' || typeFilter !== 'all' || searchQuery) && (
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-muted-foreground">
                                    Active filters:
                                </span>
                                {approvalFilter !== 'all' && (
                                    <Badge variant="secondary" className="gap-1 text-xs">
                                        Status: {approvalFilter}
                                        <button
                                            onClick={() => setApprovalFilter('all')}
                                            className="ml-1 hover:text-foreground"
                                        >
                                            ×
                                        </button>
                                    </Badge>
                                )}
                                {typeFilter !== 'all' && (
                                    <Badge variant="secondary" className="gap-1 text-xs">
                                        Type:{' '}
                                        {groupTypes.find((t) => t.id === typeFilter)?.name ||
                                            typeFilter}
                                        <button
                                            onClick={() => setTypeFilter('all')}
                                            className="ml-1 hover:text-foreground"
                                        >
                                            ×
                                        </button>
                                    </Badge>
                                )}
                                {searchQuery && (
                                    <Badge variant="secondary" className="gap-1 text-xs">
                                        Search: &quot;{searchQuery}&quot;
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="ml-1 hover:text-foreground"
                                        >
                                            ×
                                        </button>
                                    </Badge>
                                )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs px-2"
                                    onClick={() => {
                                        setApprovalFilter('all');
                                        setTypeFilter('all');
                                        setSearchQuery('');
                                    }}
                                >
                                    Clear all
                                </Button>
                            </div>
                        )}

                        {/* Groups Grid */}
                        {isLoading ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {[...Array(6)].map((_, i) => (
                                    <Card key={i}>
                                        <CardContent className="p-6">
                                            <div className="flex items-start gap-4">
                                                <Skeleton className="h-12 w-12 rounded-full" />
                                                <div className="flex-1 space-y-2">
                                                    <Skeleton className="h-5 w-32" />
                                                    <Skeleton className="h-4 w-24" />
                                                    <Skeleton className="h-4 w-48" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : groups.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-16">
                                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                        <Users className="h-8 w-8 text-muted-foreground/50" />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">
                                        {approvalFilter !== 'all'
                                            ? `No ${approvalFilter} groups`
                                            : 'No Groups Yet'}
                                    </h3>
                                    <p className="text-muted-foreground text-center mb-6 max-w-sm">
                                        {approvalFilter !== 'all'
                                            ? `There are no groups with "${approvalFilter}" status.`
                                            : 'Create your first group to start organizing your church community.'}
                                    </p>
                                    {approvalFilter !== 'all' ? (
                                        <Button
                                            variant="outline"
                                            onClick={() => setApprovalFilter('all')}
                                        >
                                            Show All Groups
                                        </Button>
                                    ) : (
                                        <Button onClick={() => setShowGroupModal(true)}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create Group
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {groups.map((group) => (
                                        <Card
                                            key={group.id}
                                            className={cn(
                                                'hover:shadow-md transition-all relative overflow-hidden',
                                                getGroupCardBorderClass(group.approval_status),
                                                group.approval_status === 'pending' &&
                                                'bg-amber-50/30 dark:bg-amber-950/5',
                                                group.approval_status === 'rejected' &&
                                                'bg-red-50/20 dark:bg-red-950/5 opacity-80'
                                            )}
                                        >
                                            <CardContent className="p-6">
                                                {/* Approval Status - Top Right */}
                                                <div className="absolute top-0 right-3">
                                                    <ApprovalStatusBadge
                                                        status={group.approval_status}
                                                        size="sm"
                                                    />
                                                </div>

                                                <div className="flex items-start justify-between pr-28">
                                                    <div className="flex items-start gap-3">
                                                        <Avatar className="h-12 w-12 ring-2 ring-background">
                                                            <AvatarImage
                                                                src={
                                                                    group.cover_image_url ||
                                                                    undefined
                                                                }
                                                            />
                                                            <AvatarFallback
                                                                className={cn(
                                                                    'font-semibold text-sm',
                                                                    group.approval_status ===
                                                                    'pending'
                                                                        ? 'bg-amber-100 text-amber-700'
                                                                        : group.approval_status ===
                                                                        'rejected'
                                                                            ? 'bg-red-100 text-red-700'
                                                                            : 'bg-primary/10 text-primary'
                                                                )}
                                                            >
                                                                {getInitials(group.name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="min-w-0">
                                                            <h3 className="font-semibold truncate">
                                                                {group.name}
                                                            </h3>
                                                            {group.group_type && (
                                                                <Badge
                                                                    variant="secondary"
                                                                    className="mt-1 text-[10px]"
                                                                >
                                                                    {group.group_type.name}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Dropdown */}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 shrink-0 absolute top-14 right-3"
                                                            >
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent
                                                            align="end"
                                                            className="w-48"
                                                        >
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handleViewGroup(group)
                                                                }
                                                            >
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View Details
                                                            </DropdownMenuItem>

                                                            {group.approval_status ===
                                                                'pending' && (
                                                                    <>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem
                                                                            onClick={() =>
                                                                                setGroupToApprove(group)
                                                                            }
                                                                            className="text-emerald-600 focus:text-emerald-600"
                                                                        >
                                                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                                                            Approve
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            onClick={() =>
                                                                                setGroupToReject(group)
                                                                            }
                                                                            className="text-red-600 focus:text-red-600"
                                                                        >
                                                                            <XCircle className="mr-2 h-4 w-4" />
                                                                            Reject
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                    </>
                                                                )}

                                                            {group.approval_status ===
                                                                'approved' && (
                                                                    <>
                                                                        <DropdownMenuItem
                                                                            onClick={() =>
                                                                                handleEditGroup(group)
                                                                            }
                                                                        >
                                                                            <Pencil className="mr-2 h-4 w-4" />
                                                                            Edit
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            onClick={() =>
                                                                                handleCreateMeeting(
                                                                                    group
                                                                                )
                                                                            }
                                                                        >
                                                                            <CalendarPlus className="mr-2 h-4 w-4" />
                                                                            Schedule Meeting
                                                                        </DropdownMenuItem>
                                                                    </>
                                                                )}

                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive"
                                                                onClick={() =>
                                                                    setGroupToDelete(group)
                                                                }
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>

                                                {/* Description */}
                                                {group.description && (
                                                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                                                        {group.description}
                                                    </p>
                                                )}

                                                {/* Rejection Reason */}
                                                {group.approval_status === 'rejected' &&
                                                    group.rejection_reason && (
                                                        <RejectionReason
                                                            reason={group.rejection_reason}
                                                            rejectedAt={group.rejected_at}
                                                            className="mt-3"
                                                        />
                                                    )}

                                                {/* Stats Row */}
                                                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Users className="h-4 w-4" />
                                                        <span>
                                                            {group.member_count || 0} members
                                                        </span>
                                                    </div>
                                                    {group.default_meeting_type && (
                                                        <div className="flex items-center gap-1">
                                                            {getMeetingTypeIcon(
                                                                group.default_meeting_type
                                                            )}
                                                            <span className="capitalize">
                                                                {group.default_meeting_type}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Leader */}
                                                {group.leader && (
                                                    <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                                                        <Avatar className="h-6 w-6">
                                                            <AvatarFallback className="text-[10px]">
                                                                {group.leader.first_name?.[0]}
                                                                {group.leader.last_name?.[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm">
                                                            <span className="text-muted-foreground">
                                                                Led by{' '}
                                                            </span>
                                                            <span className="font-medium">
                                                                {group.leader.first_name}{' '}
                                                                {group.leader.last_name}
                                                            </span>
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Action Buttons */}
                                                <div className="flex gap-2 mt-4">
                                                    {group.approval_status === 'pending' ? (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                                                onClick={() =>
                                                                    setGroupToApprove(group)
                                                                }
                                                            >
                                                                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                                onClick={() =>
                                                                    setGroupToReject(group)
                                                                }
                                                            >
                                                                <XCircle className="mr-1.5 h-3.5 w-3.5" />
                                                                Reject
                                                            </Button>
                                                        </>
                                                    ) : group.approval_status === 'approved' ? (
                                                        <>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="flex-1"
                                                                onClick={() =>
                                                                    handleViewGroup(group)
                                                                }
                                                            >
                                                                <Eye className="mr-1.5 h-3.5 w-3.5" />
                                                                View
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                className="flex-1"
                                                                onClick={() =>
                                                                    handleCreateMeeting(group)
                                                                }
                                                            >
                                                                <CalendarPlus className="mr-1.5 h-3.5 w-3.5" />
                                                                Meet
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex-1"
                                                            onClick={() => handleViewGroup(group)}
                                                        >
                                                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                                                            View Details
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {pagination && pagination.totalPages > 1 && (
                                    <div className="flex items-center justify-between mt-4">
                                        <p className="text-sm text-muted-foreground">
                                            Showing{' '}
                                            {(pagination.page - 1) * pagination.limit + 1} to{' '}
                                            {Math.min(
                                                pagination.page * pagination.limit,
                                                pagination.total
                                            )}{' '}
                                            of {pagination.total} groups
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setFilters((prev) => ({
                                                        ...prev,
                                                        page: (prev.page || 1) - 1,
                                                    }))
                                                }
                                                disabled={pagination.page <= 1}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <span className="text-sm font-medium">
                                                {pagination.page} / {pagination.totalPages}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setFilters((prev) => ({
                                                        ...prev,
                                                        page: (prev.page || 1) + 1,
                                                    }))
                                                }
                                                disabled={
                                                    pagination.page >= pagination.totalPages
                                                }
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </TabsContent>

                    {/* ======================================================== */}
                    {/* MEETINGS TAB */}
                    {/* ======================================================== */}
                    <TabsContent value="meetings" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Upcoming Meetings</h3>
                            <Button onClick={() => setShowMeetingModal(true)}>
                                <CalendarPlus className="mr-2 h-4 w-4" />
                                Schedule Meeting
                            </Button>
                        </div>

                        {isLoadingMeetings ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <Card key={i}>
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-4">
                                                <Skeleton className="h-14 w-14 rounded-lg" />
                                                <div className="flex-1 space-y-2">
                                                    <Skeleton className="h-5 w-48" />
                                                    <Skeleton className="h-4 w-32" />
                                                </div>
                                                <Skeleton className="h-8 w-24" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : allMeetings.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-16">
                                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                        <Calendar className="h-8 w-8 text-muted-foreground/50" />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">
                                        No Upcoming Meetings
                                    </h3>
                                    <p className="text-muted-foreground text-center mb-6 max-w-sm">
                                        Schedule a meeting for one of your groups to get started.
                                    </p>
                                    <Button onClick={() => setShowMeetingModal(true)}>
                                        <CalendarPlus className="mr-2 h-4 w-4" />
                                        Schedule Meeting
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {allMeetings.map((meeting) => (
                                    <Card
                                        key={meeting.id}
                                        className="hover:shadow-sm transition-shadow"
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-primary/10">
                                                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                                                            {format(
                                                                parseISO(meeting.meeting_date),
                                                                'MMM'
                                                            )}
                                                        </span>
                                                        <span className="text-xl font-bold text-primary leading-none">
                                                            {format(
                                                                parseISO(meeting.meeting_date),
                                                                'd'
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium">
                                                            {meeting.title}
                                                        </h4>
                                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                            <span>{meeting.group?.name}</span>
                                                            <span>•</span>
                                                            <span>
                                                                {meeting.start_time}
                                                                {meeting.end_time
                                                                    ? ` - ${meeting.end_time}`
                                                                    : ''}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {getMeetingTypeIcon(
                                                                meeting.meeting_type
                                                            )}
                                                            <span className="text-xs text-muted-foreground capitalize">
                                                                {meeting.meeting_type}
                                                                {meeting.online_platform &&
                                                                    ` • ${getPlatformLabel(meeting.online_platform)}`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        variant={
                                                            meeting.status === 'scheduled'
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        {getMeetingDateLabel(
                                                            meeting.meeting_date
                                                        )}
                                                    </Badge>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                            >
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem>
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View Details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem>
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-destructive">
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Cancel
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            {/* ================================================================ */}
            {/* MODALS */}
            {/* ================================================================ */}

            <GroupModal
                open={showGroupModal}
                onClose={handleModalClose}
                onSuccess={handleModalSuccess}
                group={selectedGroup}
                groupTypes={groupTypes}
            />

            <GroupDetailModal
                open={showDetailModal}
                onClose={() => {
                    setShowDetailModal(false);
                    setSelectedGroup(null);
                }}
                group={selectedGroup}
                onScheduleMeeting={() => {
                    setShowDetailModal(false);
                    setShowMeetingModal(true);
                }}
            />

            <MeetingModal
                open={showMeetingModal}
                onClose={() => {
                    setShowMeetingModal(false);
                    setSelectedGroup(null);
                    setSelectedMeeting(null);
                }}
                onSuccess={() => {
                    setShowMeetingModal(false);
                    setSelectedGroup(null);
                    setSelectedMeeting(null);
                    refetch();
                    if (activeTab === 'meetings') fetchMeetings();
                }}
                group={selectedGroup}
                meeting={selectedMeeting}
                groups={groups}
            />

            <ImportModal
                open={showImportModal}
                onClose={() => setShowImportModal(false)}
                onSuccess={() => {
                    setShowImportModal(false);
                    refetch();
                }}
                importType="groups"
                onImport={importGroups}
            />

            {/* Approve Group */}
            <ApproveDialog
                open={!!groupToApprove}
                onClose={() => setGroupToApprove(null)}
                onConfirm={handleApproveGroup}
                title="Approve Group"
                itemName={groupToApprove?.name || ''}
                itemType="group"
            />

            {/* Reject Group */}
            <RejectDialog
                open={!!groupToReject}
                onClose={() => setGroupToReject(null)}
                onConfirm={handleRejectGroup}
                title="Reject Group"
                itemName={groupToReject?.name || ''}
                itemType="group"
            />

            {/* Delete Group */}
            <AlertDialog
                open={!!groupToDelete}
                onOpenChange={() => setGroupToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Group</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete{' '}
                            <span className="font-medium">{groupToDelete?.name}</span>? This
                            will also remove all members and scheduled meetings. This action
                            cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteGroup}
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