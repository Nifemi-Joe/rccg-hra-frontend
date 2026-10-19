// src/pages/FollowUp/FollowUpTeam.tsx

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
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
    UserPlus,
    MoreHorizontal,
    Shield,
    ShieldCheck,
    User,
    Trash2,
    RefreshCw,
    Crown,
    Users,
} from 'lucide-react';
import { useFollowUpMembers } from '@/hooks/useFollowUp';
import { FollowUpMember, FollowUpMemberRole } from '@/types/followUp';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { AddTeamMemberModal } from '@/components/modals/AddTeamMemberModal';

export function FollowUpTeam() {
    const {
        members,
        isLoading,
        updateMember,
        removeMember,
        refetch,
    } = useFollowUpMembers();

    const [showAddModal, setShowAddModal] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState<FollowUpMember | null>(null);

    const getRoleBadge = (role: FollowUpMemberRole) => {
        const config: Record<FollowUpMemberRole, { icon: any; label: string; className: string }> = {
            leader: { icon: Crown, label: 'Leader', className: 'bg-yellow-100 text-yellow-700' },
            coordinator: { icon: ShieldCheck, label: 'Coordinator', className: 'bg-blue-100 text-blue-700' },
            member: { icon: User, label: 'Member', className: 'bg-gray-100 text-gray-700' },
        };
        const { icon: Icon, label, className } = config[role];
        return (
            <Badge className={cn('gap-1', className)}>
                <Icon className="h-3 w-3" />
                {label}
            </Badge>
        );
    };

    const getStatusBadge = (status: string) => {
        return status === 'active' ? (
            <Badge variant="default" className="bg-green-500">Active</Badge>
        ) : (
            <Badge variant="secondary">Inactive</Badge>
        );
    };

    const getInitials = (firstName?: string, lastName?: string) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || 'U';
    };

    const handleChangeRole = async (memberId: string, newRole: FollowUpMemberRole) => {
        await updateMember(memberId, { role: newRole });
    };

    const handleToggleStatus = async (member: FollowUpMember) => {
        const newStatus = member.status === 'active' ? 'inactive' : 'active';
        await updateMember(member.id, { status: newStatus });
    };

    const handleRemoveMember = async () => {
        if (memberToRemove) {
            await removeMember(memberToRemove.id);
            setMemberToRemove(null);
        }
    };

    // Statistics
    const activeMembers = members.filter(m => m.status === 'active').length;
    const totalAssignments = members.reduce((sum, m) => sum + (m.totalAssignmentsCount || 0), 0);
    const completedAssignments = members.reduce((sum, m) => sum + (m.completedAssignmentsCount || 0), 0);

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-primary/10">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Team Members</p>
                                <p className="text-2xl font-bold">{members.length}</p>
                                <p className="text-xs text-muted-foreground">{activeMembers} active</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-blue-500/10">
                                <Shield className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Assignments</p>
                                <p className="text-2xl font-bold">{totalAssignments}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-green-500/10">
                                <ShieldCheck className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Completed</p>
                                <p className="text-2xl font-bold">{completedAssignments}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Team Table */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Follow-Up Team</CardTitle>
                            <CardDescription>Manage your follow-up team members</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={refetch}>
                                <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                            </Button>
                            <Button onClick={() => setShowAddModal(true)} className="gap-2">
                                <UserPlus className="h-4 w-4" />
                                Add Member
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <TeamTableSkeleton />
                    ) : members.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                            <p className="text-muted-foreground mb-4">
                                No team members yet. Add members to start assigning follow-ups.
                            </p>
                            <Button onClick={() => setShowAddModal(true)} className="gap-2">
                                <UserPlus className="h-4 w-4" />
                                Add First Member
                            </Button>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Member</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead className="hidden md:table-cell">Status</TableHead>
                                        <TableHead className="hidden lg:table-cell">Performance</TableHead>
                                        <TableHead className="hidden xl:table-cell">Joined</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {members.map((member) => (
                                        <TableRow key={member.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={member.member?.profileImageUrl} />
                                                        <AvatarFallback className="bg-primary/10 text-primary">
                                                            {getInitials(member.member?.firstName, member.member?.lastName)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">
                                                            {member.member?.firstName} {member.member?.lastName}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {member.member?.email || member.member?.phone}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getRoleBadge(member.role)}</TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                {getStatusBadge(member.status)}
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell">
                                                <div className="space-y-1 w-32">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span>{member.completedAssignmentsCount || 0}/{member.totalAssignmentsCount || 0}</span>
                                                        <span>{(member.successRate || 0).toFixed(0)}%</span>
                                                    </div>
                                                    <Progress value={member.successRate || 0} className="h-1.5" />
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden xl:table-cell">
                                                <span className="text-sm text-muted-foreground">
                                                    {format(parseISO(member.joinedAt), 'MMM d, yyyy')}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() => handleChangeRole(member.id, 'leader')}
                                                            disabled={member.role === 'leader'}
                                                        >
                                                            <Crown className="mr-2 h-4 w-4" />
                                                            Make Leader
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleChangeRole(member.id, 'coordinator')}
                                                            disabled={member.role === 'coordinator'}
                                                        >
                                                            <ShieldCheck className="mr-2 h-4 w-4" />
                                                            Make Coordinator
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleChangeRole(member.id, 'member')}
                                                            disabled={member.role === 'member'}
                                                        >
                                                            <User className="mr-2 h-4 w-4" />
                                                            Make Member
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleToggleStatus(member)}>
                                                            {member.status === 'active' ? 'Deactivate' : 'Activate'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => setMemberToRemove(member)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Remove from Team
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Member Modal */}
            <AddTeamMemberModal
                open={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={() => {
                    setShowAddModal(false);
                    refetch();
                }}
                existingMemberIds={members.map(m => m.memberId)}
            />

            {/* Remove Confirmation Dialog */}
            <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove{' '}
                            <span className="font-medium">
                                {memberToRemove?.member?.firstName} {memberToRemove?.member?.lastName}
                            </span>{' '}
                            from the follow-up team? Their existing assignments will remain but they won't receive new ones.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRemoveMember}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function TeamTableSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-16" />
                </div>
            ))}
        </div>
    );
}