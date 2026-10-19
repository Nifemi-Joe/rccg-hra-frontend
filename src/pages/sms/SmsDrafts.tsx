// src/pages/sms/SmsDrafts.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Edit,
    Trash2,
    Send,
    FileText,
    MoreVertical,
    Clock,
    Users,
    MessageSquare,
    Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { smsApi, SmsCampaign } from '@/services/smsApi';

export default function SmsDrafts() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [sendingId, setSendingId] = useState<string | null>(null);

    // getDrafts returns { success: boolean, data: SmsCampaign[] }
    const { data: draftsResponse, isLoading } = useQuery({
        queryKey: ['sms-drafts'],
        queryFn: () => smsApi.getDrafts(),
    });

    // Extract the drafts array from the response
    const draftsList = draftsResponse?.data || [];

    const deleteMutation = useMutation({
        mutationFn: (id: string) => smsApi.deleteDraft(id),
        onSuccess: () => {
            toast.success('Draft deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['sms-drafts'] });
            queryClient.invalidateQueries({ queryKey: ['sms-stats'] });
            setDeleteId(null);
        },
        onError: (error: unknown) => {
            const errorMessage =
                error instanceof Error ? error.message : 'Failed to delete draft';
            toast.error(errorMessage);
        },
    });

    const sendMutation = useMutation({
        mutationFn: async (draft: SmsCampaign) => {
            return smsApi.updateDraft(draft.id, {
                destinationType: draft.destination_type,
                groupIds: draft.group_ids || undefined,
                memberIds: draft.member_ids || undefined,
                phoneNumbers: draft.phone_numbers || undefined,
                message: draft.message,
                senderId: draft.sender_id || undefined,
                sendOption: 'now',
                name: draft.name || undefined,
            });
        },
        onSuccess: () => {
            toast.success('SMS sent successfully!');
            queryClient.invalidateQueries({ queryKey: ['sms-drafts'] });
            queryClient.invalidateQueries({ queryKey: ['sms-stats'] });
            queryClient.invalidateQueries({ queryKey: ['sms-campaigns'] });
            setSendingId(null);
            navigate('/sms/sent');
        },
        onError: (error: unknown) => {
            const errorMessage =
                error instanceof Error ? error.message : 'Failed to send SMS';
            toast.error(errorMessage);
            setSendingId(null);
        },
    });

    const handleEdit = (draft: SmsCampaign) => {
        navigate(`/sms/compose?draft=${draft.id}`);
    };

    const handleSendNow = (draft: SmsCampaign) => {
        setSendingId(draft.id);
        sendMutation.mutate(draft);
    };

    const handleDelete = (id: string) => {
        setDeleteId(id);
    };

    const getDestinationLabel = (draft: SmsCampaign): string => {
        const type = draft.destination_type;
        switch (type) {
            case 'all_contacts':
                return 'All Contacts';
            case 'groups':
                return `${draft.group_ids?.length || 0} Groups`;
            case 'members':
                return `${draft.member_ids?.length || 0} Members`;
            case 'phone_numbers':
                return `${draft.phone_numbers?.length || 0} Numbers`;
            case 'uploaded':
                return 'Uploaded Contacts';
            default:
                return type;
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                </CardHeader>
                <CardContent className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
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
                                <FileText className="h-5 w-5" />
                                Drafts
                            </CardTitle>
                            <CardDescription>
                                Your saved SMS drafts ({draftsList.length})
                            </CardDescription>
                        </div>
                        {draftsList.length > 0 && (
                            <Button onClick={() => navigate('/sms/compose')}>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                New Draft
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {draftsList.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="flex justify-center mb-4">
                                <div className="rounded-full bg-muted p-6">
                                    <FileText className="h-12 w-12 text-muted-foreground" />
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No drafts saved</h3>
                            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                Save your SMS campaigns as drafts to continue working on them
                                later
                            </p>
                            <Button
                                onClick={() => navigate('/sms/compose')}
                                size="lg"
                            >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Compose New SMS
                            </Button>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Campaign Details</TableHead>
                                        <TableHead>Message Preview</TableHead>
                                        <TableHead>Recipients</TableHead>
                                        <TableHead>Last Modified</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {draftsList.map((draft) => (
                                        <TableRow
                                            key={draft.id}
                                            className="hover:bg-muted/50"
                                        >
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="font-medium">
                                                        {draft.name || (
                                                            <span className="text-muted-foreground italic">
                                                                Untitled Draft
                                                            </span>
                                                        )}
                                                    </div>
                                                    {draft.sender_id && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            From: {draft.sender_id}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-[300px]">
                                                    <p
                                                        className="text-sm line-clamp-2"
                                                        title={draft.message}
                                                    >
                                                        {draft.message}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {draft.message.length} characters •{' '}
                                                        {Math.ceil(draft.message.length / 160)}{' '}
                                                        SMS
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <div className="text-sm font-medium">
                                                            {getDestinationLabel(draft)}
                                                        </div>
                                                        {draft.total_recipients > 0 && (
                                                            <div className="text-xs text-muted-foreground">
                                                                {draft.total_recipients} contacts
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <div>
                                                            {format(
                                                                new Date(draft.updated_at),
                                                                'MMM dd, yyyy'
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {format(
                                                                new Date(draft.updated_at),
                                                                'hh:mm a'
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(draft)}
                                                        className="h-8"
                                                    >
                                                        <Edit className="h-4 w-4 mr-1" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        onClick={() => handleSendNow(draft)}
                                                        disabled={sendingId === draft.id}
                                                        className="h-8"
                                                    >
                                                        {sendingId === draft.id ? (
                                                            <>
                                                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                                Sending...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Send className="h-4 w-4 mr-1" />
                                                                Send Now
                                                            </>
                                                        )}
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0"
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handleDelete(draft.id)
                                                                }
                                                                className="text-destructive focus:text-destructive"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Delete Draft
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Draft</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this draft? This action cannot be
                            undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                            disabled={deleteMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}