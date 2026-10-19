// src/pages/email/EmailScheduled.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, XCircle, Calendar } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { emailApi, EmailCampaign } from '@/services/emailApi';

export default function EmailScheduled() {
    const queryClient = useQueryClient();
    const [cancelId, setCancelId] = useState<string | null>(null);

    const { data: scheduled, isLoading } = useQuery({
        queryKey: ['email-scheduled'],
        queryFn: () => emailApi.getScheduled(),
    });

    const cancelMutation = useMutation({
        mutationFn: (id: string) => emailApi.cancelScheduled(id),
        onSuccess: () => {
            toast.success('Scheduled email cancelled');
            queryClient.invalidateQueries({ queryKey: ['email-scheduled'] });
            setCancelId(null);
        },
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Scheduled Emails</CardTitle>
                <CardDescription>Emails scheduled for future delivery</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="text-center py-8">Loading...</div>
                ) : scheduled?.data?.data?.length === 0 ? (
                    <div className="text-center py-12">
                        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No scheduled emails</h3>
                        <p className="text-muted-foreground">You don't have any emails scheduled</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Recipients</TableHead>
                                <TableHead>Scheduled For</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {scheduled?.data?.data?.map((campaign: EmailCampaign) => (
                                <TableRow key={campaign.id}>
                                    <TableCell className="font-medium">{campaign.name || 'Untitled'}</TableCell>
                                    <TableCell className="max-w-[300px] truncate">{campaign.subject}</TableCell>
                                    <TableCell>{campaign.total_recipients}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                {campaign.scheduled_at && format(new Date(campaign.scheduled_at), 'PPp')}
                                            </div>
                                            <Badge variant="outline" className="w-fit mt-1">
                                                {campaign.scheduled_at && formatDistanceToNow(new Date(campaign.scheduled_at), { addSuffix: true })}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm" onClick={() => setCancelId(campaign.id)}>
                                            <XCircle className="h-4 w-4 text-destructive mr-1" />
                                            Cancel
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}

                <AlertDialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Scheduled Email</AlertDialogTitle>
                            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Keep Scheduled</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => cancelId && cancelMutation.mutate(cancelId)}
                                className="bg-destructive text-destructive-foreground"
                            >
                                Cancel Email
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
}