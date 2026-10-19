// src/components/modals/ShareEventModal.tsx
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Event, eventsApi, ShareEventDTO } from '@/lib/api';
import {
    Loader2,
    Share2,
    Mail,
    MessageSquare,
    Phone,
    Copy,
    Check,
    Users,
    ExternalLink,
} from 'lucide-react';

interface ShareEventModalProps {
    open: boolean;
    onClose: () => void;
    event: Event | null;
}

export function ShareEventModal({ open, onClose, event }: ShareEventModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'whatsapp' | 'email' | 'sms'>('whatsapp');
    const [customMessage, setCustomMessage] = useState('');
    const [includeAllMembers, setIncludeAllMembers] = useState(false);
    const [includeRegistrationLink, setIncludeRegistrationLink] = useState(true);
    const [shareMessage, setShareMessage] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    if (!event) return null;

    const handleShare = async () => {
        setIsLoading(true);
        try {
            const data: ShareEventDTO = {
                shareType: activeTab,
                customMessage: customMessage || undefined,
                includeAllMembers,
                includeRegistrationLink,
            };

            const result = await eventsApi.share(event.id, data);

            if (result.shareMessage) {
                setShareMessage(result.shareMessage);
            }

            toast({
                title: 'Event shared',
                description: result.message,
            });

            if (activeTab !== 'whatsapp') {
                onClose();
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to share event',
                description: error.message || 'Something went wrong',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyMessage = async () => {
        if (shareMessage) {
            await navigator.clipboard.writeText(shareMessage);
            setCopied(true);
            toast({
                title: 'Copied!',
                description: 'Share message copied to clipboard.',
            });
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleOpenWhatsApp = () => {
        if (shareMessage) {
            const encodedMessage = encodeURIComponent(shareMessage);
            window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
        }
    };

    const handleClose = () => {
        setCustomMessage('');
        setShareMessage(null);
        setIncludeAllMembers(false);
        setActiveTab('whatsapp');
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Share2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle>Share Event</DialogTitle>
                            <DialogDescription>
                                Share "{event.name}" with your members
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="whatsapp" className="gap-2">
                                <MessageSquare className="h-4 w-4" />
                                WhatsApp
                            </TabsTrigger>
                            <TabsTrigger value="email" className="gap-2">
                                <Mail className="h-4 w-4" />
                                Email
                            </TabsTrigger>
                            <TabsTrigger value="sms" className="gap-2">
                                <Phone className="h-4 w-4" />
                                SMS
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="whatsapp" className="mt-4 space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Generate a share message and send it via WhatsApp.
                            </p>
                        </TabsContent>

                        <TabsContent value="email" className="mt-4 space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Send event details via email to members.
                            </p>
                        </TabsContent>

                        <TabsContent value="sms" className="mt-4 space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Send event details via SMS to members.
                            </p>
                        </TabsContent>
                    </Tabs>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Include All Members</Label>
                                <p className="text-xs text-muted-foreground">
                                    Send to all church members
                                </p>
                            </div>
                            <Switch
                                checked={includeAllMembers}
                                onCheckedChange={setIncludeAllMembers}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Include Registration Link</Label>
                                <p className="text-xs text-muted-foreground">
                                    Add a link to register for the event
                                </p>
                            </div>
                            <Switch
                                checked={includeRegistrationLink}
                                onCheckedChange={setIncludeRegistrationLink}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Custom Message (Optional)</Label>
                            <Textarea
                                placeholder="Add a personal message..."
                                value={customMessage}
                                onChange={(e) => setCustomMessage(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>

                    {shareMessage && (
                        <div className="space-y-2">
                            <Label>Generated Message</Label>
                            <div className="relative">
                <pre className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {shareMessage}
                </pre>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="absolute top-2 right-2"
                                    onClick={handleCopyMessage}
                                >
                                    {copied ? (
                                        <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>

                            {activeTab === 'whatsapp' && (
                                <Button
                                    variant="outline"
                                    className="w-full gap-2"
                                    onClick={handleOpenWhatsApp}
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Open in WhatsApp
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleShare} disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Share2 className="mr-2 h-4 w-4" />
                                {shareMessage ? 'Regenerate' : 'Generate Message'}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}