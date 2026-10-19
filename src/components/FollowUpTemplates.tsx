// src/pages/FollowUp/FollowUpTemplates.tsx

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
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
    Plus,
    MoreHorizontal,
    Pencil,
    Trash2,
    MessageSquare,
    Mail,
    Phone,
    MessagesSquare,
    Star,
    RefreshCw,
} from 'lucide-react';
import { useFollowUpTemplates } from '@/hooks/useFollowUp';
import { MessageTemplate, FollowUpChannel } from '@/types/followUp';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { CreateTemplateModal } from '@/components/modals/CreateTemplateModal';

const channelConfig: Record<FollowUpChannel, { icon: any; label: string; color: string }> = {
    sms: { icon: MessageSquare, label: 'SMS', color: 'text-green-600' },
    whatsapp: { icon: MessagesSquare, label: 'WhatsApp', color: 'text-emerald-600' },
    email: { icon: Mail, label: 'Email', color: 'text-blue-600' },
    phone_call: { icon: Phone, label: 'Phone', color: 'text-purple-600' },
    in_person: { icon: Phone, label: 'In Person', color: 'text-orange-600' },
    other: { icon: MessageSquare, label: 'Other', color: 'text-gray-600' },
};

export function FollowUpTemplates() {
    const [activeChannel, setActiveChannel] = useState<string>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
    const [templateToDelete, setTemplateToDelete] = useState<MessageTemplate | null>(null);

    const { templates, isLoading, deleteTemplate, refetch } = useFollowUpTemplates(
        activeChannel === 'all' ? undefined : activeChannel
    );

    const handleEdit = (template: MessageTemplate) => {
        setEditingTemplate(template);
        setShowCreateModal(true);
    };

    const handleDelete = async () => {
        if (templateToDelete) {
            await deleteTemplate(templateToDelete.id);
            setTemplateToDelete(null);
        }
    };

    const handleModalClose = () => {
        setShowCreateModal(false);
        setEditingTemplate(null);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Message Templates</CardTitle>
                            <CardDescription>
                                Create and manage templates for follow-up messages
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={refetch}>
                                <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                            </Button>
                            <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Create Template
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Channel Tabs */}
                    <Tabs value={activeChannel} onValueChange={setActiveChannel} className="mb-6">
                        <TabsList>
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="sms" className="gap-2">
                                <MessageSquare className="h-4 w-4" />
                                SMS
                            </TabsTrigger>
                            <TabsTrigger value="whatsapp" className="gap-2">
                                <MessagesSquare className="h-4 w-4" />
                                WhatsApp
                            </TabsTrigger>
                            <TabsTrigger value="email" className="gap-2">
                                <Mail className="h-4 w-4" />
                                Email
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {/* Templates Grid */}
                    {isLoading ? (
                        <TemplatesSkeleton />
                    ) : templates.length === 0 ? (
                        <div className="text-center py-12">
                            <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                            <p className="text-muted-foreground mb-4">
                                No templates found. Create one to get started.
                            </p>
                            <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Create First Template
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {templates.map((template) => (
                                <TemplateCard
                                    key={template.id}
                                    template={template}
                                    onEdit={() => handleEdit(template)}
                                    onDelete={() => setTemplateToDelete(template)}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Modal */}
            <CreateTemplateModal
                open={showCreateModal}
                onClose={handleModalClose}
                onSuccess={() => {
                    handleModalClose();
                    refetch();
                }}
                template={editingTemplate}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={!!templateToDelete} onOpenChange={() => setTemplateToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Template</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the template "{templateToDelete?.name}"?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function TemplateCard({
                          template,
                          onEdit,
                          onDelete,
                      }: {
    template: MessageTemplate;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const config = channelConfig[template.channel];
    const Icon = config.icon;

    return (
        <Card className="relative">
            <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className={cn('p-2 rounded-lg bg-muted', config.color)}>
                            <Icon className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="font-medium">{template.name}</h3>
                            <Badge variant="outline" className="text-xs">
                                {config.label}
                            </Badge>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onEdit}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onDelete} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {template.subject && (
                    <p className="text-sm font-medium mb-2">Subject: {template.subject}</p>
                )}

                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {template.content}
                </p>

                <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                        {template.variables.slice(0, 3).map((variable) => (
                            <Badge key={variable} variant="secondary" className="text-xs">
                                {`{{${variable}}}`}
                            </Badge>
                        ))}
                        {template.variables.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                                +{template.variables.length - 3}
                            </Badge>
                        )}
                    </div>
                    {template.isDefault && (
                        <Badge className="bg-yellow-100 text-yellow-700 gap-1">
                            <Star className="h-3 w-3" />
                            Default
                        </Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function TemplatesSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
                <Card key={i}>
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3 mb-4">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </div>
                        <Skeleton className="h-16 w-full mb-4" />
                        <div className="flex gap-2">
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-5 w-16" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}