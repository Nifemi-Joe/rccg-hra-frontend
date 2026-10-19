// src/pages/email/EmailDrafts.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { emailApi, EmailCampaign } from '@/services/emailApi';

export default function EmailDrafts() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const { data: drafts, isLoading } = useQuery({
        queryKey: ['email-drafts'],
        queryFn: () => emailApi.getDrafts(),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => emailApi.deleteDraft(id),
        onSuccess: () => {
            toast.success('Draft deleted');
            queryClient.invalidateQueries({ queryKey: ['email-drafts'] });
            setDeleteId(null);
        },
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Drafts</CardTitle>
                <CardDescription>Your saved email drafts</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="text-center py-8">Loading...</div>
                ) : drafts?.data?.data?.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No drafts</h3>
                        <p className="text-muted-foreground mb-4">You haven't saved any email drafts yet</p>
                        <Button onClick={() => navigate('/email/compose')}>Compose New Email</Button>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Recipients</TableHead>
                                <TableHead>Last Updated</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {drafts?.data?.data?.map((draft: EmailCampaign) => (
                                <TableRow key={draft.id}>
                                    <TableCell className="font-medium">{draft.name || 'Untitled'}</TableCell>
                                    <TableCell className="max-w-[300px] truncate">{draft.subject}</TableCell>
                                    <TableCell>{draft.total_recipients || '-'}</TableCell>
                                    <TableCell>{format(new Date(draft.updated_at), 'PPp')}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => navigate(`/email/compose?draft=${draft.id}`)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => setDeleteId(draft.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}

                <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Draft</AlertDialogTitle>
                            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                                className="bg-destructive text-destructive-foreground"
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
}