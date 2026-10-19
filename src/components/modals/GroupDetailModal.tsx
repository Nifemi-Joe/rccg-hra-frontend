// GroupDetailModal.tsx
import { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
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
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
    groupsApi,
    Group,
    GroupMember,
    GroupMeeting,
} from '@/lib/api';
import {
    Users,
    Calendar,
    MapPin,
    Video,
    UserPlus,
    MoreHorizontal,
    Trash2,
    Share2,
    Mail,
    MessageSquare,
    Phone,
    Clock,
    CalendarPlus,
    Copy,
    ExternalLink,
    Search,
    CheckCircle2,
    XCircle,
    Info,
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { cn } from '@/lib/utils';
import {
    ApproveDialog,
    RejectDialog,
    ApprovalStatusBadge,
    RejectionReason,
} from '@/components/modals/ApprovalDialog';
import { AddMemberToGroupModal } from '@/components/modals/AddMemberToGroupModal';

interface GroupDetailModalProps {
    open: boolean;
    onClose: () => void;
    group: Group | null;
    onScheduleMeeting?: () => void;
}

export function GroupDetailModal({
                                     open,
                                     onClose,
                                     group,
                                     onScheduleMeeting,
                                 }: GroupDetailModalProps) {
    const [activeTab, setActiveTab] = useState('overview');
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [meetings, setMeetings] = useState<GroupMeeting[]>([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [isLoadingMeetings, setIsLoadingMeetings] = useState(false);
    const [memberSearch, setMemberSearch] = useState('');
    const [memberApprovalFilter, setMemberApprovalFilter] = useState<string>('all');
    const [showAddMember, setShowAddMember] = useState(false);
    const [memberToApprove, setMemberToApprove] = useState<GroupMember | null>(null);
    const [memberToReject, setMemberToReject] = useState<GroupMember | null>(null);

    const { toast } = useToast();

    // ── DATA FETCHING ──────────────────────────────────────────────────────────

    const fetchGroupMembers = useCallback(async () => {
        if (!group) return;
        setIsLoadingMembers(true);
        try {
            const data = await groupsApi.getMembers(group.id, {
                approvalStatus:
                    memberApprovalFilter !== 'all'
                        ? memberApprovalFilter
                        : undefined,
            });
            setMembers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching members:', error);
            setMembers([]);
        } finally {
            setIsLoadingMembers(false);
        }
    }, [group?.id, memberApprovalFilter]);

    const fetchGroupMeetings = useCallback(async () => {
        if (!group) return;
        setIsLoadingMeetings(true);
        try {
            const data = await groupsApi.getGroupMeetings(group.id, {
                upcoming: true,
                limit: 5,
            });
            setMeetings(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching meetings:', error);
            setMeetings([]);
        } finally {
            setIsLoadingMeetings(false);
        }
    }, [group?.id]);

    // Fetch data when modal opens
    useEffect(() => {
        if (open && group) {
            fetchGroupMembers();
            fetchGroupMeetings();
        }
    }, [open, group?.id]);

    // Re-fetch members when filter changes
    useEffect(() => {
        if (open && group) {
            fetchGroupMembers();
        }
    }, [memberApprovalFilter]);

    // Reset state when modal closes/opens
    useEffect(() => {
        if (open) {
            setActiveTab('overview');
            setMemberSearch('');
            setMemberApprovalFilter('all');
        } else {
            // Clean up when closed
            setMembers([]);
            setMeetings([]);
        }
    }, [open]);

    // ── MEMBER APPROVAL HANDLERS ───────────────────────────────────────────────

    const handleApproveMember = async () => {
        if (!group?.id || !memberToApprove?.member_id) return;
        try {
            await groupsApi.approveGroupMember(group.id, memberToApprove.member_id);
            toast({
                title: 'Member approved',
                description: 'The member has been approved and added to the group.',
            });
            await fetchGroupMembers();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to approve member',
                description: error.message,
            });
            throw error;
        }
    };

    const handleRejectMember = async (reason: string) => {
        if (!group?.id || !memberToReject?.member_id) return;
        try {
            await groupsApi.rejectGroupMember(group.id, memberToReject.member_id, reason);
            toast({
                title: 'Member rejected',
                description: 'The member addition has been rejected.',
            });
            await fetchGroupMembers();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to reject member',
                description: error.message,
            });
            throw error;
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!group) return;
        try {
            await groupsApi.removeMember(group.id, memberId);
            toast({
                title: 'Member removed',
                description: 'Member has been removed from the group.',
            });
            await fetchGroupMembers();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to remove member',
                description: error.message,
            });
        }
    };

    // ── MEETING HANDLERS ───────────────────────────────────────────────────────

    const handleShareMeeting = async (
        meeting: GroupMeeting,
        via: 'whatsapp' | 'email' | 'sms'
    ) => {
        if (!group) return;
        try {
            const result = await groupsApi.shareMeeting(group.id, meeting.id, {
                shareVia: via,
                includeAllMembers: true,
            });
            if (via === 'whatsapp') {
                window.open(
                    `https://wa.me/?text=${encodeURIComponent(result.message)}`,
                    '_blank'
                );
            }
            toast({ title: 'Meeting shared', description: result.message });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to share meeting',
                description: error.message,
            });
        }
    };

    const copyMeetingLink = async (meeting: GroupMeeting) => {
        if (meeting.meeting_link) {
            await navigator.clipboard.writeText(meeting.meeting_link);
            toast({ title: 'Link copied', description: 'Meeting link copied to clipboard.' });
        }
    };

    // ── HELPERS ────────────────────────────────────────────────────────────────

    const getInitials = (firstName: string, lastName: string) =>
        `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();

    const getRoleBadge = (role: string) => {
        const variants: Record<string, { variant: 'default' | 'secondary' | 'outline'; label: string }> = {
            leader:     { variant: 'default',   label: 'Leader'    },
            co_leader:  { variant: 'secondary', label: 'Co-Leader' },
            'co-leader':{ variant: 'secondary', label: 'Co-Leader' },
            secretary:  { variant: 'outline',   label: 'Secretary' },
            treasurer:  { variant: 'outline',   label: 'Treasurer' },
            member:     { variant: 'outline',   label: 'Member'    },
        };
        const config = variants[role] || variants.member;
        return <Badge variant={config.variant} className="text-[10px]">{config.label}</Badge>;
    };

    const getMeetingTypeIcon = (type: string) => {
        switch (type) {
            case 'online':   return <Video className="h-4 w-4 text-blue-500" />;
            case 'physical': return <MapPin className="h-4 w-4 text-green-500" />;
            case 'hybrid':
                return (
                    <div className="flex">
                        <MapPin className="h-4 w-4 text-green-500" />
                        <Video className="h-4 w-4 text-blue-500 -ml-1" />
                    </div>
                );
            default: return null;
        }
    };

    const getMeetingDateLabel = (date: string) => {
        const d = parseISO(date);
        if (isToday(d))    return 'Today';
        if (isTomorrow(d)) return 'Tomorrow';
        return format(d, 'EEE, MMM d');
    };

    // ── COMPUTED ───────────────────────────────────────────────────────────────

    const filteredMembers = members.filter((m) => {
        if (!memberSearch) return true;
        const name = `${m.member?.first_name || ''} ${m.member?.last_name || ''}`.toLowerCase();
        return (
            name.includes(memberSearch.toLowerCase()) ||
            m.member?.email?.toLowerCase().includes(memberSearch.toLowerCase())
        );
    });

    const pendingMembers = members.filter((m) => m.approval_status === 'pending');

    if (!group) return null;

    // ── RENDER ─────────────────────────────────────────────────────────────────

    return (
        <>
            <Dialog open={open} onOpenChange={onClose}>
                {/*
                    KEY FIXES:
                    1. sm:max-w-[750px] for wider dialog
                    2. max-h-[90vh] to constrain height
                    3. flex flex-col so children can grow/shrink
                    4. overflow-hidden on the container (NOT overflow-scroll)
                    5. p-0 so we control padding internally
                */}
                <DialogContent
                    className="sm:max-w-[750px] max-h-[90vh] overflow-hidden flex flex-col p-0"
                >
                    {/* ── HEADER (fixed, never scrolls) ── */}
                    <div className="flex-shrink-0 p-6 pb-4">
                        <DialogHeader>
                            <div className="flex items-start gap-4">
                                <Avatar className="h-14 w-14 ring-2 ring-border flex-shrink-0">
                                    <AvatarImage src={group.cover_image_url || undefined} />
                                    <AvatarFallback
                                        className={cn(
                                            'text-lg font-bold',
                                            group.approval_status === 'pending'
                                                ? 'bg-amber-100 text-amber-700'
                                                : group.approval_status === 'rejected'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-primary/10 text-primary'
                                        )}
                                    >
                                        {group.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <DialogTitle className="text-xl font-bold">
                                            {group.name}
                                        </DialogTitle>
                                        <ApprovalStatusBadge status={group.approval_status} />
                                        {group.group_type && (
                                            <Badge variant="secondary">{group.group_type.name}</Badge>
                                        )}
                                    </div>
                                    {group.description && (
                                        <DialogDescription className="mt-1 line-clamp-2">
                                            {group.description}
                                        </DialogDescription>
                                    )}
                                </div>
                            </div>
                        </DialogHeader>

                        {group.approval_status === 'rejected' && group.rejection_reason && (
                            <RejectionReason
                                reason={group.rejection_reason}
                                rejectedAt={group.rejected_at}
                                className="mt-4"
                            />
                        )}
                    </div>

                    <Separator className="flex-shrink-0" />

                    {/* ── TABS (fills remaining height) ── */}
                    <Tabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="flex-1 flex flex-col overflow-hidden"
                    >
                        {/* Tab bar – fixed */}
                        <div className="flex-shrink-0 px-6 pt-4">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="overview" className="gap-2">
                                    <Info className="h-4 w-4" />
                                    Overview
                                </TabsTrigger>

                                <TabsTrigger value="members" className="gap-2 relative">
                                    <Users className="h-4 w-4" />
                                    {/*
                                        FIX: show members.length which is fetched data.
                                        Also fall back to group.member_count while loading.
                                    */}
                                    Members ({isLoadingMembers ? (group.member_count ?? 0) : members.length})
                                    {pendingMembers.length > 0 && (
                                        <Badge
                                            variant="secondary"
                                            className="ml-1 h-5 px-1.5 text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400"
                                        >
                                            {pendingMembers.length}
                                        </Badge>
                                    )}
                                </TabsTrigger>

                                <TabsTrigger value="meetings" className="gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Meetings
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/*
                            Scrollable area – this is the ONLY thing that scrolls.
                            flex-1 + overflow-hidden on parent, overflow-y-auto here.
                        */}
                        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">

                            {/* ── OVERVIEW TAB ── */}
                            <TabsContent value="overview" className="mt-0 space-y-4 data-[state=inactive]:hidden">
                                {/* Quick Stats */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="rounded-lg border p-4 text-center">
                                        <Users className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                                        <p className="text-2xl font-bold">{group.member_count ?? 0}</p>
                                        <p className="text-xs text-muted-foreground">Members</p>
                                    </div>
                                    <div className="rounded-lg border p-4 text-center">
                                        <Calendar className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                                        <p className="text-sm font-medium capitalize">
                                            {group.default_meeting_day || 'N/A'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Meeting Day</p>
                                    </div>
                                    <div className="rounded-lg border p-4 text-center">
                                        {group.default_meeting_type === 'online' ? (
                                            <Video className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                                        ) : group.default_meeting_type === 'hybrid' ? (
                                            <div className="flex justify-center mb-1">
                                                <MapPin className="h-5 w-5 text-green-500" />
                                                <Video className="h-5 w-5 text-blue-500 -ml-1" />
                                            </div>
                                        ) : (
                                            <MapPin className="h-5 w-5 mx-auto text-green-500 mb-1" />
                                        )}
                                        <p className="text-sm font-medium capitalize">
                                            {group.default_meeting_type || 'Physical'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Meeting Type</p>
                                    </div>
                                </div>

                                {/* Leadership */}
                                {group.leader && (
                                    <div>
                                        <h4 className="text-sm font-semibold mb-3">Leadership</h4>
                                        <div className="flex items-center gap-3 p-3 rounded-lg border">
                                            <Avatar className="h-10 w-10">
                                                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                                    {getInitials(group.leader.first_name, group.leader.last_name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm">
                                                    {group.leader.first_name} {group.leader.last_name}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {group.leader.email}
                                                </p>
                                            </div>
                                            <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                                                Leader
                                            </Badge>
                                        </div>
                                    </div>
                                )}

                                {/* Meeting Defaults */}
                                <div>
                                    <h4 className="text-sm font-semibold mb-3">Meeting Defaults</h4>
                                    <div className="rounded-lg border p-4 space-y-2">
                                        <div className="flex items-center gap-2">
                                            {getMeetingTypeIcon(group.default_meeting_type || 'physical')}
                                            <span className="capitalize text-sm">
                                                {group.default_meeting_type || 'Physical'} meetings
                                            </span>
                                        </div>
                                        {group.default_meeting_day && (
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <span className="capitalize text-sm">
                                                    {group.default_meeting_day}s
                                                    {group.default_meeting_time && ` at ${group.default_meeting_time}`}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Approval Info */}
                                <div>
                                    <h4 className="text-sm font-semibold mb-3">Approval Information</h4>
                                    <div className="rounded-lg border p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Status</span>
                                            <ApprovalStatusBadge status={group.approval_status} />
                                        </div>
                                        {group.approved_at && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Approved</span>
                                                <span className="text-sm">
                                                    {new Date(group.approved_at).toLocaleDateString('en-US', {
                                                        year: 'numeric', month: 'short', day: 'numeric',
                                                    })}
                                                </span>
                                            </div>
                                        )}
                                        {group.rejected_at && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Rejected</span>
                                                <span className="text-sm">
                                                    {new Date(group.rejected_at).toLocaleDateString('en-US', {
                                                        year: 'numeric', month: 'short', day: 'numeric',
                                                    })}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Created</span>
                                            <span className="text-sm">
                                                {new Date(group.created_at).toLocaleDateString('en-US', {
                                                    year: 'numeric', month: 'short', day: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Schedule Meeting */}
                                {group.approval_status === 'approved' && onScheduleMeeting && (
                                    <Button className="w-full" onClick={onScheduleMeeting}>
                                        <CalendarPlus className="mr-2 h-4 w-4" />
                                        Schedule Meeting
                                    </Button>
                                )}
                            </TabsContent>

                            {/* ── MEMBERS TAB ── */}
                            <TabsContent value="members" className="mt-0 space-y-4 data-[state=inactive]:hidden">
                                {/* Filters & Add Button */}
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div className="relative flex-1 max-w-xs">
                                            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                placeholder="Search members..."
                                                value={memberSearch}
                                                onChange={(e) => setMemberSearch(e.target.value)}
                                                className="pl-9 h-9 text-sm"
                                            />
                                        </div>
                                        <Select value={memberApprovalFilter} onValueChange={setMemberApprovalFilter}>
                                            <SelectTrigger className="w-[140px] h-9 text-sm flex-shrink-0">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Status</SelectItem>
                                                <SelectItem value="pending">
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="h-3 w-3 text-amber-500" />
                                                        Pending
                                                    </span>
                                                </SelectItem>
                                                <SelectItem value="approved">
                                                    <span className="flex items-center gap-1.5">
                                                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                                        Approved
                                                    </span>
                                                </SelectItem>
                                                <SelectItem value="rejected">
                                                    <span className="flex items-center gap-1.5">
                                                        <XCircle className="h-3 w-3 text-red-500" />
                                                        Rejected
                                                    </span>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {group.approval_status === 'approved' && (
                                        <Button size="sm" onClick={() => setShowAddMember(true)} className="flex-shrink-0">
                                            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                                            Add
                                        </Button>
                                    )}
                                </div>

                                {/* Pending Alert */}
                                {pendingMembers.length > 0 && memberApprovalFilter === 'all' && (
                                    <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20 p-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-amber-600" />
                                                <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                                                    {pendingMembers.length} member{pendingMembers.length > 1 ? 's' : ''} pending approval
                                                </span>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 text-xs text-amber-700"
                                                onClick={() => setMemberApprovalFilter('pending')}
                                            >
                                                View
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Members List */}
                                {isLoadingMembers ? (
                                    <div className="space-y-3">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                                                <Skeleton className="h-10 w-10 rounded-full" />
                                                <div className="flex-1 space-y-2">
                                                    <Skeleton className="h-4 w-32" />
                                                    <Skeleton className="h-3 w-24" />
                                                </div>
                                                <Skeleton className="h-6 w-20" />
                                            </div>
                                        ))}
                                    </div>
                                ) : filteredMembers.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                            <Users className="h-6 w-6 text-muted-foreground/50" />
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-1">
                                            {memberSearch
                                                ? 'No members match your search'
                                                : memberApprovalFilter !== 'all'
                                                    ? `No ${memberApprovalFilter} members`
                                                    : 'No members yet'}
                                        </p>
                                        {group.approval_status === 'approved' && !memberSearch && memberApprovalFilter === 'all' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="mt-3"
                                                onClick={() => setShowAddMember(true)}
                                            >
                                                <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                                                Add First Member
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {filteredMembers.map((gm) => (
                                            <div
                                                key={gm.id}
                                                className={cn(
                                                    'flex items-center justify-between p-3 rounded-lg border transition-colors',
                                                    gm.approval_status === 'pending' &&
                                                    'border-amber-200 bg-amber-50/30 dark:border-amber-900/30 dark:bg-amber-950/10',
                                                    gm.approval_status === 'rejected' &&
                                                    'border-red-200 bg-red-50/20 dark:border-red-900/30 dark:bg-red-950/10 opacity-70'
                                                )}
                                            >
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <Avatar className="h-10 w-10 flex-shrink-0">
                                                        <AvatarImage src={gm.member?.profile_photo_url || undefined} />
                                                        <AvatarFallback
                                                            className={cn(
                                                                'text-sm',
                                                                gm.approval_status === 'pending'
                                                                    ? 'bg-amber-100 text-amber-700'
                                                                    : gm.approval_status === 'rejected'
                                                                        ? 'bg-red-100 text-red-700'
                                                                        : 'bg-primary/10 text-primary'
                                                            )}
                                                        >
                                                            {gm.member && getInitials(gm.member.first_name, gm.member.last_name)}
                                                        </AvatarFallback>
                                                    </Avatar>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="font-medium text-sm truncate">
                                                                {gm.member?.first_name} {gm.member?.last_name}
                                                            </p>
                                                            {gm.role && gm.role !== 'member' && getRoleBadge(gm.role)}
                                                        </div>
                                                        {gm.member?.email && (
                                                            <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                                                                <Mail className="h-3 w-3 shrink-0" />
                                                                {gm.member.email}
                                                            </span>
                                                        )}
                                                        {gm.approval_status === 'rejected' && gm.rejection_reason && (
                                                            <p className="text-[11px] text-red-500 mt-1 italic line-clamp-1">
                                                                Reason: {gm.rejection_reason}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                                    <ApprovalStatusBadge
                                                        status={gm.approval_status}
                                                        size="sm"
                                                        showIcon={false}
                                                    />

                                                    {gm.approval_status === 'pending' ? (
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                                onClick={() => setMemberToApprove(gm)}
                                                                title="Approve member"
                                                            >
                                                                <CheckCircle2 className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() => setMemberToReject(gm)}
                                                                title="Reject member"
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem
                                                                    className="text-destructive focus:text-destructive"
                                                                    onClick={() => handleRemoveMember(gm.member_id)}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Remove
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            {/* ── MEETINGS TAB ── */}
                            <TabsContent value="meetings" className="mt-0 space-y-4 data-[state=inactive]:hidden">
                                <div className="flex justify-end">
                                    {group.approval_status === 'approved' && onScheduleMeeting && (
                                        <Button size="sm" onClick={onScheduleMeeting}>
                                            <CalendarPlus className="mr-2 h-4 w-4" />
                                            Schedule Meeting
                                        </Button>
                                    )}
                                </div>

                                {isLoadingMeetings ? (
                                    <div className="space-y-3">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="p-4 rounded-lg border">
                                                <div className="flex items-center gap-4">
                                                    <Skeleton className="h-12 w-12 rounded-lg" />
                                                    <div className="flex-1 space-y-2">
                                                        <Skeleton className="h-4 w-48" />
                                                        <Skeleton className="h-3 w-32" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : meetings.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                            <Calendar className="h-6 w-6 text-muted-foreground/50" />
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-1">
                                            No upcoming meetings scheduled.
                                        </p>
                                        {group.approval_status === 'approved' && onScheduleMeeting && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="mt-3"
                                                onClick={onScheduleMeeting}
                                            >
                                                <CalendarPlus className="mr-1.5 h-3.5 w-3.5" />
                                                Schedule First Meeting
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {meetings.map((meeting) => (
                                            <div
                                                key={meeting.id}
                                                className="p-4 rounded-lg border hover:shadow-sm transition-shadow"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-start gap-4 flex-1 min-w-0">
                                                        <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-primary/10 flex-shrink-0">
                                                            <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                                                                {format(parseISO(meeting.meeting_date), 'MMM')}
                                                            </span>
                                                            <span className="text-lg font-bold text-primary leading-none">
                                                                {format(parseISO(meeting.meeting_date), 'd')}
                                                            </span>
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <h4 className="font-medium truncate">{meeting.title}</h4>
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 flex-wrap">
                                                                <Clock className="h-3 w-3 flex-shrink-0" />
                                                                <span>
                                                                    {meeting.start_time}
                                                                    {meeting.end_time && ` - ${meeting.end_time}`}
                                                                </span>
                                                                <span>•</span>
                                                                {getMeetingTypeIcon(meeting.meeting_type)}
                                                                <span className="capitalize">{meeting.meeting_type}</span>
                                                            </div>
                                                            {meeting.meeting_link && (
                                                                <div className="flex items-center gap-2 mt-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="h-7 text-xs"
                                                                        onClick={() => window.open(meeting.meeting_link!, '_blank')}
                                                                    >
                                                                        <ExternalLink className="mr-1 h-3 w-3" />
                                                                        Join
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-7 text-xs"
                                                                        onClick={() => copyMeetingLink(meeting)}
                                                                    >
                                                                        <Copy className="mr-1 h-3 w-3" />
                                                                        Copy
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <Badge variant="secondary" className="text-xs whitespace-nowrap">
                                                            {getMeetingDateLabel(meeting.meeting_date)}
                                                        </Badge>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                    <Share2 className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem
                                                                    onClick={() => handleShareMeeting(meeting, 'whatsapp')}
                                                                >
                                                                    <MessageSquare className="mr-2 h-4 w-4" />
                                                                    Share via WhatsApp
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => handleShareMeeting(meeting, 'email')}
                                                                >
                                                                    <Mail className="mr-2 h-4 w-4" />
                                                                    Share via Email
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => handleShareMeeting(meeting, 'sms')}
                                                                >
                                                                    <Phone className="mr-2 h-4 w-4" />
                                                                    Share via SMS
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                        </div>{/* end scrollable area */}
                    </Tabs>
                </DialogContent>
            </Dialog>

            {/* ── ADD MEMBER MODAL ── */}
            {showAddMember && group && (
                <AddMemberToGroupModal
                    open={showAddMember}
                    onClose={() => setShowAddMember(false)}
                    onSuccess={() => {
                        setShowAddMember(false);
                        fetchGroupMembers();
                    }}
                    groupId={group.id}
                    groupName={group.name}
                    existingMemberIds={members.map((m) => m.member_id)}
                />
            )}

            {/* ── APPROVE MEMBER DIALOG ── */}
            <ApproveDialog
                open={!!memberToApprove}
                onClose={() => setMemberToApprove(null)}
                onConfirm={handleApproveMember}
                title="Approve Member"
                itemName={
                    memberToApprove
                        ? `${memberToApprove.member?.first_name} ${memberToApprove.member?.last_name}`
                        : ''
                }
                itemType="member"
                description={
                    memberToApprove
                        ? `Approve ${memberToApprove.member?.first_name} ${memberToApprove.member?.last_name} to join ${group?.name}?`
                        : undefined
                }
            />

            {/* ── REJECT MEMBER DIALOG ── */}
            <RejectDialog
                open={!!memberToReject}
                onClose={() => setMemberToReject(null)}
                onConfirm={handleRejectMember}
                title="Reject Member"
                itemName={
                    memberToReject
                        ? `${memberToReject.member?.first_name} ${memberToReject.member?.last_name}`
                        : ''
                }
                itemType="member"
                description={
                    memberToReject
                        ? `Reject ${memberToReject.member?.first_name} ${memberToReject.member?.last_name}'s addition to ${group?.name}`
                        : undefined
                }
            />
        </>
    );
}