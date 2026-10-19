// src/pages/sms/SmsScheduled.tsx
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Clock,
    Calendar,
    XCircle,
    Users,
    MessageSquare,
    Edit,
    Loader2,
    Timer,
} from 'lucide-react';
import { format, formatDistanceToNow, isPast, isFuture } from 'date-fns';
import { smsApi, SmsCampaign } from '@/services/smsApi';

export default function SmsScheduled() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [cancelId, setCancelId] = useState<string | null>(null);

    // getScheduled returns { success, data: SmsCampaign[] }
    const { data: scheduledResponse, isLoading } = useQuery({
        queryKey: ['sms-scheduled'],
        queryFn: () => smsApi.getScheduled(),
    });

    // Extract the campaigns array from the response
    const scheduledList = scheduledResponse?.data || [];

    const cancelMutation = useMutation({
        mutationFn: (id: string) => smsApi.cancelScheduled(id),
        onSuccess: () => {
            toast.success('Scheduled SMS cancelled');
            queryClient.invalidateQueries({ queryKey: ['sms-scheduled'] });
            queryClient.invalidateQueries({ queryKey: ['sms-stats'] });
            setCancelId(null);
        },
        onError: (error: unknown) => {
            const errorMessage =
                error instanceof Error ? error.message : 'Failed to cancel scheduled SMS';
            toast.error(errorMessage);
        },
    });

    const getTimeUntilSend = (scheduledAt: string): string => {
        const scheduledDate = new Date(scheduledAt);
        if (isPast(scheduledDate)) {
            return 'Processing...';
        }
        return formatDistanceToNow(scheduledDate, { addSuffix: true });
    };

    const getDestinationLabel = (campaign: SmsCampaign): string => {
        const type = campaign.destination_type;
        switch (type) {
            case 'all_contacts':
                return 'All Contacts';
            case 'groups':
                return `${campaign.group_ids?.length || 0} Groups`;
            case 'members':
                return `${campaign.member_ids?.length || 0} Members`;
            case 'phone_numbers':
                return `${campaign.phone_numbers?.length || 0} Numbers`;
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

    const upcomingSchedules = scheduledList.filter(
        (s) => s.scheduled_at && isFuture(new Date(s.scheduled_at))
    );

    const processingSchedules = scheduledList.filter(
        (s) => s.scheduled_at && isPast(new Date(s.scheduled_at))
    );

    return (
        <>
            <div className="space-y-6">
                {/* Upcoming Schedules */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Scheduled Messages
                                </CardTitle>
                                <CardDescription>
                                    Messages scheduled to be sent later (
                                    {upcomingSchedules.length})
                                </CardDescription>
                            </div>
                            {upcomingSchedules.length > 0 && (
                                <Button onClick={() => navigate('/sms/compose')}>
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Schedule New
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {upcomingSchedules.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="flex justify-center mb-4">
                                    <div className="rounded-full bg-muted p-6">
                                        <Timer className="h-12 w-12 text-muted-foreground" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-semibold mb-2">
                                    No scheduled messages
                                </h3>
                                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                    Schedule SMS campaigns to be sent at a specific date and
                                    time
                                </p>
                                <Button
                                    onClick={() => navigate('/sms/compose')}
                                    size="lg"
                                >
                                    <Clock className="h-4 w-4 mr-2" />
                                    Schedule Message
                                </Button>
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Campaign Details</TableHead>
                                            <TableHead>Message</TableHead>
                                            <TableHead>Recipients</TableHead>
                                            <TableHead>Scheduled For</TableHead>
                                            <TableHead>Time Until Send</TableHead>
                                            <TableHead className="text-right">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {upcomingSchedules.map((campaign) => (
                                            <TableRow
                                                key={campaign.id}
                                                className="hover:bg-muted/50"
                                            >
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <div className="font-medium">
                                                            {campaign.name || (
                                                                <span className="text-muted-foreground italic">
                                                                    Untitled Campaign
                                                                </span>
                                                            )}
                                                        </div>
                                                        {campaign.sender_id && (
                                                            <Badge
                                                                variant="outline"
                                                                className="text-xs"
                                                            >
                                                                From: {campaign.sender_id}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="max-w-[250px]">
                                                        <p
                                                            className="text-sm line-clamp-2"
                                                            title={campaign.message}
                                                        >
                                                            {campaign.message}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {campaign.message.length} chars •{' '}
                                                            {Math.ceil(
                                                                campaign.message.length / 160
                                                            )}{' '}
                                                            SMS
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Users className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <div className="text-sm font-medium">
                                                                {getDestinationLabel(campaign)}
                                                            </div>
                                                            {campaign.total_recipients > 0 && (
                                                                <div className="text-xs text-muted-foreground">
                                                                    {campaign.total_recipients}{' '}
                                                                    contacts
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {campaign.scheduled_at && (
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                                            <div>
                                                                <div className="text-sm font-medium">
                                                                    {format(
                                                                        new Date(
                                                                            campaign.scheduled_at
                                                                        ),
                                                                        'MMM dd, yyyy'
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {format(
                                                                        new Date(
                                                                            campaign.scheduled_at
                                                                        ),
                                                                        'hh:mm a'
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {campaign.scheduled_at && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="font-mono"
                                                        >
                                                            <Clock className="h-3 w-3 mr-1" />
                                                            {getTimeUntilSend(
                                                                campaign.scheduled_at
                                                            )}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                navigate(
                                                                    `/sms/compose?draft=${campaign.id}`
                                                                )
                                                            }
                                                        >
                                                            <Edit className="h-4 w-4 mr-1" />
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                setCancelId(campaign.id)
                                                            }
                                                            className="text-destructive hover:text-destructive"
                                                        >
                                                            <XCircle className="h-4 w-4 mr-1" />
                                                            Cancel
                                                        </Button>
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

                {/* Processing Schedules */}
                {processingSchedules.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Currently Processing
                            </CardTitle>
                            <CardDescription>Messages being sent now</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {processingSchedules.map((campaign) => (
                                    <div
                                        key={campaign.id}
                                        className="flex items-center justify-between p-4 rounded-lg border bg-muted/50"
                                    >
                                        <div className="flex-1">
                                            <div className="font-medium">
                                                {campaign.name || 'Untitled Campaign'}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {campaign.total_recipients} recipients
                                            </div>
                                        </div>
                                        <Badge variant="secondary">Processing</Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Cancel Confirmation Dialog */}
            <AlertDialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Scheduled Message</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel this scheduled message? This
                            action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={cancelMutation.isPending}>
                            Keep Schedule
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => cancelId && cancelMutation.mutate(cancelId)}
                            disabled={cancelMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {cancelMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Cancelling...
                                </>
                            ) : (
                                'Cancel Schedule'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}