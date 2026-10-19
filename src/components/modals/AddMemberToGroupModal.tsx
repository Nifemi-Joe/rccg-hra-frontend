import { useState, useEffect } from 'react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    UserPlus,
    Search,
    Loader2,
    Check,
    Users,
    Clock,
} from 'lucide-react';
import { membersApi, groupsApi, Member } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AddMemberToGroupModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    groupId: string;
    groupName: string;
    existingMemberIds: string[];
}

export function AddMemberToGroupModal({
                                          open,
                                          onClose,
                                          onSuccess,
                                          groupId,
                                          groupName,
                                          existingMemberIds,
                                      }: AddMemberToGroupModalProps) {
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState('member');
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            fetchMembers();
            setSelectedMemberId(null);
            setSelectedRole('member');
            setSearch('');
        }
    }, [open]);

    const fetchMembers = async () => {
        setIsLoading(true);
        try {
            const result = await membersApi.getAll({ limit: 500 });
            setMembers(result.members || []);
        } catch (error) {
            console.error('Failed to fetch members:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const availableMembers = members.filter((m) => {
        if (existingMemberIds.includes(m.id)) return false;
        if (!search) return true;
        const name = `${m.first_name} ${m.last_name}`.toLowerCase();
        return (
            name.includes(search.toLowerCase()) ||
            m.email?.toLowerCase().includes(search.toLowerCase())
        );
    });

    const handleAdd = async () => {
        if (!selectedMemberId) return;
        setIsAdding(true);
        try {
            await groupsApi.addMember(groupId, {
                memberId: selectedMemberId,
                role: selectedRole,
            });
            toast({
                title: 'Member added',
                description: 'The member has been added and is pending approval.',
            });
            onSuccess();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to add member',
                description: error.message,
            });
        } finally {
            setIsAdding(false);
        }
    };

    const selectedMember = members.find((m) => m.id === selectedMemberId);

    return (
        <Dialog open={open} onOpenChange={onClose} >
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <UserPlus className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle>Add Member</DialogTitle>
                            <DialogDescription>
                                Add a member to{' '}
                                <span className="font-medium">{groupName}</span>
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Pending notice */}
                <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20 p-3">
                    <div className="flex items-start gap-2.5">
                        <Clock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                            New member additions require approval from an authorized checker
                            before they become active.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search members by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    {/* Members List */}
                    <ScrollArea className="h-[280px] rounded-lg border">
                        {isLoading ? (
                            <div className="p-3 space-y-2">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 p-2">
                                        <Skeleton className="h-9 w-9 rounded-full" />
                                        <div className="flex-1 space-y-1">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : availableMembers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Users className="h-8 w-8 text-muted-foreground/50 mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    {search
                                        ? 'No matching members found'
                                        : 'All members are already in this group'}
                                </p>
                            </div>
                        ) : (
                            <div className="p-1">
                                {availableMembers.map((member) => (
                                    <button
                                        key={member.id}
                                        type="button"
                                        onClick={() =>
                                            setSelectedMemberId(
                                                selectedMemberId === member.id
                                                    ? null
                                                    : member.id
                                            )
                                        }
                                        className={cn(
                                            'w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors',
                                            selectedMemberId === member.id
                                                ? 'bg-primary/10 ring-1 ring-primary/30'
                                                : 'hover:bg-muted/50'
                                        )}
                                    >
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage
                                                src={member.profile_photo_url || undefined}
                                            />
                                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                                {member.first_name?.[0]}
                                                {member.last_name?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {member.first_name} {member.last_name}
                                            </p>
                                            {member.email && (
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {member.email}
                                                </p>
                                            )}
                                        </div>
                                        {selectedMemberId === member.id && (
                                            <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                                                <Check className="h-3 w-3 text-primary-foreground" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </ScrollArea>

                    {/* Role Selection */}
                    {selectedMemberId && (
                        <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                        {selectedMember?.first_name?.[0]}
                                        {selectedMember?.last_name?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">
                                        {selectedMember?.first_name}{' '}
                                        {selectedMember?.last_name}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-muted-foreground shrink-0">
                                    Role:
                                </label>
                                <Select
                                    value={selectedRole}
                                    onValueChange={setSelectedRole}
                                >
                                    <SelectTrigger className="h-8 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="member">Member</SelectItem>
                                        <SelectItem value="leader">Leader</SelectItem>
                                        <SelectItem value="co-leader">Co-Leader</SelectItem>
                                        <SelectItem value="secretary">Secretary</SelectItem>
                                        <SelectItem value="treasurer">Treasurer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose} disabled={isAdding}>
                        Cancel
                    </Button>
                    <Button onClick={handleAdd} disabled={!selectedMemberId || isAdding}>
                        {isAdding ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Adding...
                            </>
                        ) : (
                            <>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Add Member
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}