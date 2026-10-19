// src/components/modals/CreateAssignmentModal.tsx

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar, Loader2, Search, UserPlus, AlertCircle } from 'lucide-react';
import { useFollowUpMembers, useUnassignedFirstTimers } from '@/hooks/useFollowUp';
import followUpApi from '@/services/followUpApi';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CreateAssignmentModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateAssignmentModal({
                                          open,
                                          onClose,
                                          onSuccess,
                                      }: CreateAssignmentModalProps) {
    const { members, isLoading: membersLoading } = useFollowUpMembers();
    const { firstTimers, isLoading: firstTimersLoading } = useUnassignedFirstTimers();
    const { toast } = useToast();

    const [selectedFirstTimer, setSelectedFirstTimer] = useState<string>('');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [primaryMember, setPrimaryMember] = useState<string>('');
    const [priority, setPriority] = useState<string>('medium');
    const [dueDate, setDueDate] = useState<string>('');
    const [notes, setNotes] = useState('');
    const [searchFirstTimer, setSearchFirstTimer] = useState('');
    const [searchMember, setSearchMember] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form when modal opens
    useEffect(() => {
        if (open) {
            setSelectedFirstTimer('');
            setSelectedMembers([]);
            setPrimaryMember('');
            setPriority('medium');
            setDueDate('');
            setNotes('');
            setSearchFirstTimer('');
            setSearchMember('');
        }
    }, [open]);

    // Auto-set primary member when first member is selected
    useEffect(() => {
        if (selectedMembers.length === 1) {
            setPrimaryMember(selectedMembers[0]);
        } else if (selectedMembers.length === 0) {
            setPrimaryMember('');
        }
    }, [selectedMembers]);

    const filteredFirstTimers = firstTimers.filter((ft) =>
        `${ft.firstName} ${ft.lastName}`.toLowerCase().includes(searchFirstTimer.toLowerCase())
    );

    const activeMembers = members.filter((m) => m.status === 'active');
    const filteredMembers = activeMembers.filter((m) =>
        `${m.member?.firstName} ${m.member?.lastName}`.toLowerCase().includes(searchMember.toLowerCase())
    );

    const toggleMember = (memberId: string) => {
        setSelectedMembers((prev) =>
            prev.includes(memberId)
                ? prev.filter((id) => id !== memberId)
                : [...prev, memberId]
        );
    };

    const handleSubmit = async () => {
        if (!selectedFirstTimer) {
            toast({
                variant: 'destructive',
                title: