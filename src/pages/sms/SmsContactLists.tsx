// src/pages/sms/SmsContactLists.tsx
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Plus,
    Upload,
    Trash2,
    Eye,
    Users,
    FileSpreadsheet,
    Loader2,
    ListPlus,
    Phone,
    X,
    AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { smsApi, SmsContactList, SmsContactListItem } from '@/services/smsApi';
import Papa from 'papaparse';

export default function SmsContactLists() {
    const queryClient = useQueryClient();
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [showViewDialog, setShowViewDialog] = useState(false);
    const [selectedListId, setSelectedListId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [newListName, setNewListName] = useState('');
    const [newListDescription, setNewListDescription] = useState('');
    const [uploadedContacts, setUploadedContacts] = useState<Array<{ phoneNumber: string; name?: string }>>([]);

    // ========================================================================
    // QUERIES
    // ========================================================================

    const { data: lists, isLoading, isError, error } = useQuery({
        queryKey: ['sms-contact-lists'],
        queryFn: smsApi.getContactLists,
    });

    const { data: listItems, isLoading: isLoadingItems } = useQuery({
        queryKey: ['sms-contact-list-items', selectedListId],
        queryFn: () => smsApi.getContactListItems(selectedListId!, 1, 100),
        enabled: !!selectedListId && showViewDialog,
    });
    console.log(lists);
    console.log(listItems)
    // ========================================================================
    // MUTATIONS
    // ========================================================================

    const createMutation = useMutation({
        mutationFn: (data: { name: string; description?: string }) =>
            smsApi.createContactList(data),
        onSuccess: () => {
            toast.success('Contact list created successfully');
            queryClient.invalidateQueries({ queryKey: ['sms-contact-lists'] });
            handleCloseCreateDialog();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create contact list');
        },
    });

    const addContactsMutation = useMutation({
        mutationFn: ({ id, contacts }: { id: string; contacts: Array<{ phoneNumber: string; name?: string }> }) =>
            smsApi.addContactsToList(id, contacts),
        onSuccess: (count) => {
            toast.success(`${count} contacts added to list`);
            queryClient.invalidateQueries({ queryKey: ['sms-contact-lists'] });
            queryClient.invalidateQueries({ queryKey: ['sms-contact-list-items'] });
            handleCloseUploadDialog();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to add contacts');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => smsApi.deleteContactList(id),
        onSuccess: () => {
            toast.success('Contact list deleted');
            queryClient.invalidateQueries({ queryKey: ['sms-contact-lists'] });
            setDeleteId(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete contact list');
        },
    });

    const removeContactMutation = useMutation({
        mutationFn: ({ listId, contactId }: { listId: string; contactId: string }) =>
            smsApi.removeContactFromList(listId, contactId),
        onSuccess: () => {
            toast.success('Contact removed from list');
            queryClient.invalidateQueries({ queryKey: ['sms-contact-list-items'] });
            queryClient.invalidateQueries({ queryKey: ['sms-contact-lists'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to remove contact');
        },
    });

    // ========================================================================
    // HANDLERS
    // ========================================================================

    const handleCloseCreateDialog = () => {
        setShowCreateDialog(false);
        setNewListName('');
        setNewListDescription('');
    };

    const handleCloseUploadDialog = () => {
        setShowUploadDialog(false);
        setUploadedContacts([]);
        setSelectedListId(null);
    };

    const handleCloseViewDialog = () => {
        setShowViewDialog(false);
        setSelectedListId(null);
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const contacts: Array<{ phoneNumber: string; name?: string }> = [];
                results.data.forEach((row: any) => {
                    const phone = row.phone || row.Phone || row.phone_number || row['Phone Number'] || row.phoneNumber;
                    const name = row.name || row.Name || row.full_name || row['Full Name'] || row.fullName;
                    if (phone && phone.toString().trim()) {
                        contacts.push({
                            phoneNumber: phone.toString().trim(),
                            name: name?.toString().trim() || undefined,
                        });
                    }
                });
                setUploadedContacts(contacts);
                if (contacts.length > 0) {
                    toast.success(`Found ${contacts.length} contacts in file`);
                } else {
                    toast.error('No valid contacts found in file. Make sure your CSV has a "phone" column.');
                }
            },
            error: (error) => {
                console.error('CSV parse error:', error);
                toast.error('Failed to parse CSV file');
            },
        });

        // Reset the input
        event.target.value = '';
    };

    const handleCreateList = () => {
        if (!newListName.trim()) {
            toast.error('List name is required');
            return;
        }
        createMutation.mutate({
            name: newListName.trim(),
            description: newListDescription.trim() || undefined,
        });
    };

    const handleAddContacts = () => {
        if (!selectedListId || uploadedContacts.length === 0) return;
        addContactsMutation.mutate({
            id: selectedListId,
            contacts: uploadedContacts,
        });
    };

    const handleOpenUploadDialog = (listId: string) => {
        setSelectedListId(listId);
        setShowUploadDialog(true);
    };

    const handleOpenViewDialog = (listId: string) => {
        setSelectedListId(listId);
        setShowViewDialog(true);
    };

    // ========================================================================
    // RENDER LOADING STATE
    // ========================================================================

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <Skeleton className="h-7 w-40 mb-2" />
                        <Skeleton className="h-4 w-60" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i}>
                            <CardHeader className="pb-2">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-4 w-48" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-10 w-full mb-4" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-8 flex-1" />
                                    <Skeleton className="h-8 flex-1" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    // ========================================================================
    // RENDER ERROR STATE
    // ========================================================================

    if (isError) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold">Contact Lists</h2>
                        <p className="text-muted-foreground">Manage your SMS contact lists</p>
                    </div>
                </div>
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center">
                            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
                            <h3 className="text-lg font-medium text-destructive">Error Loading Contact Lists</h3>
                            <p className="text-muted-foreground mt-2 mb-4">
                                {(error as any)?.response?.data?.message || 'Unable to load contact lists. Please try again.'}
                            </p>
                            <Button
                                onClick={() => queryClient.invalidateQueries({ queryKey: ['sms-contact-lists'] })}
                            >
                                Try Again
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const contactLists = lists || [];

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold">Contact Lists</h2>
                    <p className="text-muted-foreground">Manage your SMS contact lists</p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create List
                </Button>
            </div>

            {/* Empty State */}
            {contactLists.length === 0 ? (
                <Card>
                    <CardContent className="py-16">
                        <div className="text-center">
                            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <ListPlus className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No Contact Lists Yet</h3>
                            <p className="text-muted-foreground max-w-md mx-auto mb-6">
                                Create contact lists to organize your SMS recipients. You can upload contacts from a CSV file or add them manually.
                            </p>
                            <Button onClick={() => setShowCreateDialog(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Your First List
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                /* Lists Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {contactLists.map((list: SmsContactList) => (
                        <Card key={list.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-lg truncate">{list.name}</CardTitle>
                                        {list.description && (
                                            <CardDescription className="line-clamp-2">
                                                {list.description}
                                            </CardDescription>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="shrink-0 -mr-2 -mt-1"
                                        onClick={() => setDeleteId(list.id)}
                                    >
                                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-muted/50">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Users className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{list.contact_count || 0}</p>
                                        <p className="text-xs text-muted-foreground">contacts</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => handleOpenViewDialog(list.id)}
                                    >
                                        <Eye className="h-4 w-4 mr-1" />
                                        View
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => handleOpenUploadDialog(list.id)}
                                    >
                                        <Upload className="h-4 w-4 mr-1" />
                                        Add
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground mt-3 text-center">
                                    Created {format(new Date(list.created_at), 'PP')}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create List Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Contact List</DialogTitle>
                        <DialogDescription>
                            Create a new list to organize your SMS contacts
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="list-name">
                                List Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="list-name"
                                value={newListName}
                                onChange={(e) => setNewListName(e.target.value)}
                                placeholder="e.g., Youth Group, Prayer Partners"
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="list-description">Description (Optional)</Label>
                            <Textarea
                                id="list-description"
                                value={newListDescription}
                                onChange={(e) => setNewListDescription(e.target.value)}
                                placeholder="Brief description of this contact list"
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseCreateDialog}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateList}
                            disabled={!newListName.trim() || createMutation.isPending}
                        >
                            {createMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create List'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View List Dialog */}
            <Dialog open={showViewDialog} onOpenChange={handleCloseViewDialog}>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>Contact List</DialogTitle>
                        <DialogDescription>
                            View and manage contacts in this list
                        </DialogDescription>
                    </DialogHeader>
                    <div className="overflow-y-auto max-h-[50vh]">
                        {isLoadingItems ? (
                            <div className="py-8 text-center">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                                <p className="text-sm text-muted-foreground mt-2">Loading contacts...</p>
                            </div>
                        ) : !listItems?.data || listItems.data.length === 0 ? (
                            <div className="py-12 text-center">
                                <Phone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h4 className="font-medium">No Contacts Yet</h4>
                                <p className="text-sm text-muted-foreground mt-1 mb-4">
                                    Upload a CSV file to add contacts to this list
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        handleCloseViewDialog();
                                        if (selectedListId) {
                                            handleOpenUploadDialog(selectedListId);
                                        }
                                    }}
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Add Contacts
                                </Button>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Phone Number</TableHead>
                                        <TableHead className="w-[60px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {listItems.data.map((item: SmsContactListItem) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                {item.name || <span className="text-muted-foreground">—</span>}
                                            </TableCell>
                                            <TableCell>{item.phone_number}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => {
                                                        if (selectedListId) {
                                                            removeContactMutation.mutate({
                                                                listId: selectedListId,
                                                                contactId: item.id,
                                                            });
                                                        }
                                                    }}
                                                    disabled={removeContactMutation.isPending}
                                                >
                                                    <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                    {listItems?.total && listItems.total > 0 && (
                        <div className="text-sm text-muted-foreground text-center pt-2 border-t">
                            Showing {listItems.data.length} of {listItems.total} contacts
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Upload Contacts Dialog */}
            <Dialog open={showUploadDialog} onOpenChange={handleCloseUploadDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Contacts</DialogTitle>
                        <DialogDescription>
                            Upload a CSV file with contacts to add to this list
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                            <FileSpreadsheet className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                            <Label htmlFor="contact-file-upload" className="cursor-pointer">
                                <span className="text-primary font-medium hover:underline">
                                    Click to upload CSV file
                                </span>
                                <p className="text-sm text-muted-foreground mt-1">
                                    CSV should have a "phone" column and optionally a "name" column
                                </p>
                            </Label>
                            <Input
                                id="contact-file-upload"
                                type="file"
                                accept=".csv, .xls, .xlsx"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                        </div>

                        {uploadedContacts.length > 0 && (
                            <div className="bg-muted/50 border rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Users className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{uploadedContacts.length} contacts ready</p>
                                            <p className="text-xs text-muted-foreground">
                                                Ready to be added to the list
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setUploadedContacts([])}
                                    >
                                        Clear
                                    </Button>
                                </div>

                                {/* Preview first few contacts */}
                                {uploadedContacts.length > 0 && (
                                    <div className="mt-3 pt-3 border-t">
                                        <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                                        <div className="space-y-1">
                                            {uploadedContacts.slice(0, 3).map((contact, index) => (
                                                <div key={index} className="text-sm flex justify-between">
                                                    <span className="text-muted-foreground">
                                                        {contact.name || 'No name'}
                                                    </span>
                                                    <span className="font-mono">{contact.phoneNumber}</span>
                                                </div>
                                            ))}
                                            {uploadedContacts.length > 3 && (
                                                <p className="text-xs text-muted-foreground">
                                                    ...and {uploadedContacts.length - 3} more
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseUploadDialog}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddContacts}
                            disabled={uploadedContacts.length === 0 || addContactsMutation.isPending}
                        >
                            {addContactsMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Add {uploadedContacts.length} Contacts
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Contact List</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this contact list? All contacts in this list will be permanently removed. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete List'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}