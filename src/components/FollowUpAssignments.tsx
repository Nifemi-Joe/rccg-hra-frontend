// src/pages/FollowUp/FollowUpAssignments.tsx

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
    Search,
    MoreHorizontal,
    Eye,
    MessageSquare,
    UserCheck,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Filter,
    Calendar,
    AlertCircle,
} from 'lucide-react';
import { useFollowUpAssignments, useFollowUpMembers } from '@/hooks/useFollowUp';
import { FollowUpAssignment, AssignmentStatus, FollowUpPriority } from '@/types/followUp';
import { cn } from '@/lib/utils';
import { format, parseISO, differenceInDays } from 'date-fns';
import { AssignmentDetailModal } from '@/components/modals/AssignmentDetailModal';
import { SendFollowUpMessageModal } from '@/components/modals/SendFollowUpMessageModal';
import { CompleteAssignmentModal } from '@/components/modals/CompleteAssignmentModal';

export function FollowUpAssignments() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [selectedAssignment, setSelectedAssignment] = useState<FollowUpAssignment | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false);

    const {
        assignments,
        pagination,
        filters,
        setFilters,
        isLoading,
        completeAssignment,
        refetch,
    } = useFollowUpAssignments();

    const { members } = useFollowUpMembers();

    const handleSearch = (value: string) => {
        setSearch(value);
        setFilters({ ...filters, search: value, page: 1 });
    };

    const handleStatusFilter = (value: string) => {
        setStatusFilter(value);
        setFilters({
            ...filters,
            status: value === 'all' ? undefined : value as AssignmentStatus,
            page: 1,
        });
    };

    const handlePriorityFilter = (value: string) => {
        setPriorityFilter(value);
        setFilters({
            ...filters,
            priority: value === 'all' ? undefined : value as FollowUpPriority,
            page: 1,
        });
    };

    const handleViewDetails = (assignment: FollowUpAssignment) => {
        setSelectedAssignment(assignment);
        setShowDetailModal(true);
    };

    const handleSendMessage = (assignment: FollowUpAssignment) => {
        setSelectedAssignment(assignment);
        setShowMessageModal(true);
    };

    const handleComplete = (assignment: FollowUpAssignment) => {
        setSelectedAssignment(assignment);
        setShowCompleteModal(true);
    };

    const getStatusBadge = (status: AssignmentStatus) => {
        const variants: Record<AssignmentStatus, { variant: any; label: string }> = {
            active: { variant: 'default', label: 'Active' },
            completed: { variant: 'secondary', label: 'Completed' },
            cancelled: { variant: 'destructive', label: 'Cancelled' },
        };
        const config = variants[status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const getPriorityBadge = (priority: FollowUpPriority) => {
        const variants: Record<FollowUpPriority, { className: string; label: string }> = {
            low: { className: 'bg-gray-100 text-gray-700', label: 'Low' },
            medium: { className: 'bg-blue-100 text-blue-700', label: 'Medium' },
            high: { className: 'bg-orange-100 text-orange-700', label: 'High' },
            urgent: { className: 'bg-red-100 text-red-700', label: 'Urgent' },
        };
        const config = variants[priority];
        return <Badge className={config.className}>{config.label}</Badge>;
    };

    const getDueDateInfo = (dueDate?: string) => {
        if (!dueDate) return null;
        const days = differenceInDays(parseISO(dueDate), new Date());

        if (days < 0) {
            return { isOverdue: true, text: 'Overdue', className: 'text-red-600' };
        } else if (days === 0) {
            return { isOverdue: false, text: 'Due today', className: 'text-yellow-600' };
        } else if (days <= 3) {
            return { isOverdue: false, text: `${days}d left`, className: 'text-yellow-600' };
        }
        return { isOverdue: false, text: format(parseISO(dueDate), 'MMM d'), className: 'text-muted-foreground' };
    };

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <CardTitle>Follow-Up Assignments</CardTitle>
                    <Button variant="outline" size="icon" onClick={refetch}>
                        <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                    <div className="relative flex-1 w-full sm:max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name..."
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={statusFilter} onValueChange={handleStatusFilter}>
                            <SelectTrigger className="w-[130px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={priorityFilter} onValueChange={handlePriorityFilter}>
                            <SelectTrigger className="w-[130px]">
                                <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Priority</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Table */}
                {isLoading ? (
                    <TableSkeleton />
                ) : assignments.length === 0 ? (
                    <div className="text-center py-12">
                        <AlertCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                        <p className="text-muted-foreground">
                            {search || statusFilter !== 'all' || priorityFilter !== 'all'
                                ? 'No assignments match your filters'
                                : 'No assignments yet'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>First Timer</TableHead>
                                        <TableHead className="hidden md:table-cell">Assigned To</TableHead>
                                        <TableHead>Priority</TableHead>
                                        <TableHead className="hidden lg:table-cell">Due Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {assignments.map((assignment) => {
                                        const dueDateInfo = getDueDateInfo(assignment.dueDate);
                                        const primaryMember = assignment.assignedMembers?.find(m => m.isPrimary);

                                        return (
                                            <TableRow key={assignment.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                                {assignment.firstTimer
                                                                    ? getInitials(
                                                                        assignment.firstTimer.firstName,
                                                                        assignment.firstTimer.lastName
                                                                    )
                                                                    : '??'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium">
                                                                {assignment.firstTimer?.firstName}{' '}
                                                                {assignment.firstTimer?.lastName}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {assignment.firstTimer?.phone || assignment.firstTimer?.email || 'No contact'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    <div className="flex items-center gap-2">
                                                        {assignment.assignedMembers && assignment.assignedMembers.length > 0 ? (
                                                            <>
                                                                <div className="flex -space-x-2">
                                                                    {assignment.assignedMembers.slice(0, 3).map((am) => (
                                                                        <Avatar
                                                                            key={am.id}
                                                                            className={cn(
                                                                                'h-8 w-8 border-2 border-background',
                                                                                am.isPrimary && 'ring-2 ring-primary'
                                                                            )}
                                                                        >
                                                                            <AvatarImage src={am.member?.profileImageUrl} />
                                                                            <AvatarFallback className="text-xs">
                                                                                {am.member
                                                                                    ? getInitials(
                                                                                        am.member.firstName,
                                                                                        am.member.lastName
                                                                                    )
                                                                                    : '??'}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                    ))}
                                                                </div>
                                                                {assignment.assignedMembers.length > 3 && (
                                                                    <span className="text-sm text-muted-foreground">
                                                                        +{assignment.assignedMembers.length - 3}
                                                                    </span>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground">
                                                                Not assigned
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getPriorityBadge(assignment.priority)}</TableCell>
                                                <TableCell className="hidden lg:table-cell">
                                                    {dueDateInfo ? (
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                                            <span className={dueDateInfo.className}>
                                                                {dueDateInfo.text}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">No due date</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleViewDetails(assignment)}>
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View Details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleSendMessage(assignment)}>
                                                                <MessageSquare className="mr-2 h-4 w-4" />
                                                                Send Message
                                                            </DropdownMenuItem>
                                                            {assignment.status === 'active' && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem onClick={() => handleComplete(assignment)}>
                                                                        <UserCheck className="mr-2 h-4 w-4" />
                                                                        Mark Complete
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-sm text-muted-foreground">
                                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                                    {pagination.total} assignments
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

            {/* Modals */}
            {selectedAssignment && (
                <>
                    <AssignmentDetailModal
                        open={showDetailModal}
                        onClose={() => setShowDetailModal(false)}
                        assignment={selectedAssignment}
                        onUpdate={refetch}
                    />
                    <SendFollowUpMessageModal
                        open={showMessageModal}
                        onClose={() => setShowMessageModal(false)}
                        assignment={selectedAssignment}
                        onSuccess={() => {
                            setShowMessageModal(false);
                            refetch();
                        }}
                    />
                    <CompleteAssignmentModal
                        open={showCompleteModal}
                        onClose={() => setShowCompleteModal(false)}
                        assignment={selectedAssignment}
                        onComplete={async (notes) => {
                            await completeAssignment(selectedAssignment.id, notes);
                            setShowCompleteModal(false);
                        }}
                    />
                </>
            )}
        </Card>
    );
}

function TableSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                </div>
            ))}
        </div>
    );
}