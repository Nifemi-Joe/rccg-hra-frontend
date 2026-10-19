// src/pages/sms/SmsReplies.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
    Inbox,
    Reply,
    Check,
    Mail,
    Clock,
    User,
    Phone,
    MessageSquare,
    ChevronLeft,
    ChevronRight,
    Loader2,
    CheckCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import { smsApi, SmsReply } from '@/services/smsApi';
import { cn } from '@/lib/utils';

export default function SmsReplies() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [selectedReply, setSelectedReply] = useState<SmsReply | null>(null);
    const [showReplyDialog, setShowReplyDialog] = useState(false);
    const [replyMessage, setReplyMessage] = useState('');
    const limit = 20;

    // getReplies returns { success, data: SmsReply[], total }
    const { data: repliesResponse, isLoading } = useQuery({
        queryKey: ['sms-replies', page, unreadOnly],
        queryFn: () => smsApi.getReplies({ page, limit, unreadOnly }),
    });

    // getApprovedSenderIds returns SmsSenderId[] directly (already filtered)
    const { data: approvedSenderIds } = useQuery({
        queryKey: ['sender-ids-approved'],
        queryFn: () => smsApi.getApprovedSenderIds(),
    });

    // Extract data from responses
    const repliesList = repliesResponse?.data || [];
    const repliesTotal = repliesResponse?.total || 0;

    const markAsReadMutation = useMutation({
        mutationFn: (id: string) => smsApi.markReplyAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sms-replies'] });
            queryClient.invalidateQueries({ queryKey: ['sms-stats'] });
        },
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: () => smsApi.markAllRepliesAsRead(),
        onSuccess: () => {
            toast.success('All replies marked as read');
            queryClient.invalidateQueries({ queryKey: ['sms-replies'] });
            queryClient.invalidateQueries({ queryKey: ['sms-stats'] });
        },
        onError: () => {
            toast.error('Failed to mark all as read');
        },
    });

    const sendReplyMutation = useMutation({
        mutationFn: (data: { replyId: string; message: string; senderId?: string }) =>
            smsApi.replyToMessage(data.replyId, data.message, data.senderId),
        onSuccess: () => {
            toast.success('Reply sent successfully');
            setShowReplyDialog(false);
            setSelectedReply(null);
            setReplyMessage('');
            queryClient.invalidateQueries({ queryKey: ['sms-stats'] });
        },
        onError: (error: unknown) => {
            const errorMessage =
                error instanceof Error ? error.message : 'Failed to send reply';
            toast.error(errorMessage);
        },
    });

    const handleViewReply = (reply: SmsReply) => {
        setSelectedReply(reply);
        if (!reply.is_read) {
            markAsReadMutation.mutate(reply.id);
        }
    };

    const handleReply = () => {
        if (!selectedReply || !replyMessage.trim()) return;

        // approvedSenderIds is SmsSenderId[] directly
        const defaultSender = approvedSenderIds?.find((s) => s.is_default);

        sendReplyMutation.mutate({
            replyId: selectedReply.id,
            message: replyMessage,
            senderId: defaultSender?.id,
        });
    };

    const totalPages = repliesTotal > 0 ? Math.ceil(repliesTotal / limit) : 1;
    const unreadCount = repliesList.filter((r) => !r.is_read).length;

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                </CardHeader>
                <CardContent className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Inbox className="h-5 w-5" />
                                SMS Replies
                                {unreadCount > 0 && (
                                    <Badge variant="destructive" className="ml-2">
                                        {unreadCount} new
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription>
                                Incoming SMS replies from your contacts ({repliesTotal} total)
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={unreadOnly}
                                    onCheckedChange={setUnreadOnly}
                                    id="unread-only"
                                />
                                <Label htmlFor="unread-only" className="cursor-pointer">
                                    Unread only
                                </Label>
                            </div>
                            {unreadCount > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => markAllAsReadMutation.mutate()}
                                    disabled={markAllAsReadMutation.isPending}
                                >
                                    {markAllAsReadMutation.isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Marking...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCheck className="h-4 w-4 mr-2" />
                                            Mark all as read
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {repliesList.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="flex justify-center mb-4">
                                <div className="rounded-full bg-muted p-6">
                                    <Mail className="h-12 w-12 text-muted-foreground" />
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">
                                {unreadOnly ? 'No unread replies' : 'No replies yet'}
                            </h3>
                            <p className="text-muted-foreground max-w-sm mx-auto">
                                {unreadOnly
                                    ? 'All your SMS replies have been read'
                                    : 'When people reply to your SMS messages, they will appear here'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3">
                                {repliesList.map((reply) => (
                                    <div
                                        key={reply.id}
                                        className={cn(
                                            'group relative flex items-start gap-4 p-4 rounded-lg border transition-all cursor-pointer',
                                            reply.is_read
                                                ? 'bg-background hover:bg-muted/50'
                                                : 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                                        )}
                                        onClick={() => handleViewReply(reply)}
                                    >
                                        {/* Unread Indicator */}
                                        {!reply.is_read && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-primary rounded-r" />
                                        )}

                                        {/* Avatar */}
                                        <div
                                            className={cn(
                                                'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center',
                                                reply.is_read
                                                    ? 'bg-muted'
                                                    : 'bg-primary/20'
                                            )}
                                        >
                                            <User
                                                className={cn(
                                                    'h-6 w-6',
                                                    reply.is_read
                                                        ? 'text-muted-foreground'
                                                        : 'text-primary'
                                                )}
                                            />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={cn(
                                                            'font-medium',
                                                            !reply.is_read && 'font-semibold'
                                                        )}
                                                    >
                                                        {reply.sender_name || 'Unknown'}
                                                    </span>
                                                    {!reply.is_read && (
                                                        <Badge
                                                            variant="default"
                                                            className="h-5 px-1.5 text-xs"
                                                        >
                                                            New
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    {format(
                                                        new Date(reply.received_at),
                                                        'MMM dd, hh:mm a'
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                                <Phone className="h-3 w-3" />
                                                {reply.phone_number}
                                            </div>

                                            <p
                                                className={cn(
                                                    'text-sm line-clamp-2',
                                                    !reply.is_read && 'font-medium'
                                                )}
                                            >
                                                {reply.message}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex-shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedReply(reply);
                                                    setShowReplyDialog(true);
                                                }}
                                            >
                                                <Reply className="h-4 w-4 mr-1" />
                                                Reply
                                            </Button>
                                            {!reply.is_read && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        markAsReadMutation.mutate(reply.id);
                                                    }}
                                                >
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between mt-6">
                                <p className="text-sm text-muted-foreground">
                                    Page {page} of {totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setPage((p) => Math.min(totalPages, p + 1))
                                        }
                                        disabled={page === totalPages}
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* View/Reply Dialog */}
            <Dialog
                open={!!selectedReply && !showReplyDialog}
                onOpenChange={(open) => !open && setSelectedReply(null)}
            >
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            SMS Reply
                        </DialogTitle>
                    </DialogHeader>

                    {selectedReply && (
                        <div className="space-y-4">
                            {/* Sender Info */}
                            <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                    <User className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-lg">
                                        {selectedReply.sender_name || 'Unknown Sender'}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Phone className="h-3 w-3" />
                                        {selectedReply.phone_number}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                        <Clock className="h-3 w-3" />
                                        {format(
                                            new Date(selectedReply.received_at),
                                            'PPpp'
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Message */}
                            <div className="p-4 bg-background border rounded-lg">
                                <Label className="text-xs text-muted-foreground">
                                    Message
                                </Label>
                                <p className="mt-2 whitespace-pre-wrap">
                                    {selectedReply.message}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedReply(null)}
                                >
                                    Close
                                </Button>
                                <Button
                                    onClick={() => {
                                        setShowReplyDialog(true);
                                    }}
                                >
                                    <Reply className="h-4 w-4 mr-2" />
                                    Reply
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Send Reply Dialog */}
            <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Send Reply</DialogTitle>
                        <DialogDescription>
                            Reply to{' '}
                            {selectedReply?.sender_name || selectedReply?.phone_number}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Your Reply</Label>
                            <Textarea
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                placeholder="Type your reply message..."
                                rows={5}
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>
                                    {replyMessage.length} characters •{' '}
                                    {Math.ceil(replyMessage.length / 160)} SMS
                                </span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowReplyDialog(false);
                                setReplyMessage('');
                            }}
                            disabled={sendReplyMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleReply}
                            disabled={
                                !replyMessage.trim() || sendReplyMutation.isPending
                            }
                        >
                            {sendReplyMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Reply className="h-4 w-4 mr-2" />
                                    Send Reply
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}