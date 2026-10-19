// src/pages/HelpSupport.tsx

import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {
    HelpCircle,
    MessageSquare,
    FileText,
    Send,
    Ticket,
    Clock,
    CheckCircle,
    AlertCircle,
    ExternalLink,
    Search,
    Plus,
    RefreshCw,
    Mail,
    Phone,
    Loader2,
    BookOpen,
    Video,
    Users,
    Settings,
    DollarSign,
    Calendar,
    ChevronRight,
    MessagesSquare,
} from 'lucide-react';
import { useSupport, useTickets, useTicket } from '@/hooks/useSupport';
import { useAuth } from '@/contexts/AuthContext';
import {
    SupportTicket,
    CreateTicketDTO,
    TicketCategory,
    TicketPriority,
    TICKET_CATEGORIES,
    TICKET_PRIORITIES,
    TICKET_STATUSES,
    FAQ,
} from '@/types/support';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Quick help topics
const QUICK_HELP_TOPICS = [
    {
        icon: <Users className="h-5 w-5" />,
        title: 'Managing Members',
        description: 'Add, edit, and organize your church members',
        link: '/members',
    },
    {
        icon: <Calendar className="h-5 w-5" />,
        title: 'Events & Attendance',
        description: 'Create events and track attendance',
        link: '/events',
    },
    {
        icon: <DollarSign className="h-5 w-5" />,
        title: 'Financial Management',
        description: 'Record offerings, tithes, and expenses',
        link: '/finances',
    },
    {
        icon: <Settings className="h-5 w-5" />,
        title: 'Settings & Profile',
        description: 'Manage your account and church settings',
        link: '/profile',
    },
];

// Resource links
const RESOURCES = [
    {
        icon: <BookOpen className="h-5 w-5" />,
        title: 'Documentation',
        description: 'Comprehensive guides and tutorials',
        link: '#',
        external: true,
    },
    {
        icon: <Video className="h-5 w-5" />,
        title: 'Video Tutorials',
        description: 'Step-by-step video guides',
        link: '#',
        external: true,
    },
    {
        icon: <MessagesSquare className="h-5 w-5" />,
        title: 'Community Forum',
        description: 'Connect with other churches',
        link: '#',
        external: true,
    },
];

export default function HelpSupport() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('help');
    const [searchQuery, setSearchQuery] = useState('');
    const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

    // Form state
    const [ticketForm, setTicketForm] = useState<CreateTicketDTO>({
        subject: '',
        description: '',
        category: 'general',
        priority: 'medium',
        contactEmail: user?.email || '',
        contactName: `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
        contactPhone: user?.phone_number || '',
    });

    const { faqs, isLoadingFaqs, createTicket, isCreating } = useSupport();
    const { tickets, isLoading: isLoadingTickets, refetch: refetchTickets } = useTickets();

    // Filter FAQs by search
    const filteredFaqs = faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group FAQs by category
    const groupedFaqs = filteredFaqs.reduce((acc, faq) => {
        if (!acc[faq.category]) {
            acc[faq.category] = [];
        }
        acc[faq.category].push(faq);
        return acc;
    }, {} as Record<string, FAQ[]>);

    const handleCreateTicket = async () => {
        if (!ticketForm.subject || !ticketForm.description) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            await createTicket(ticketForm);
            setIsNewTicketOpen(false);
            setTicketForm({
                subject: '',
                description: '',
                category: 'general',
                priority: 'medium',
                contactEmail: user?.email || '',
                contactName: `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
                contactPhone: user?.phone_number || '',
            });
            refetchTickets();
        } catch (error) {
            // Error handled by hook
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = TICKET_STATUSES.find(s => s.value === status);
        return (
            <Badge className={cn("capitalize", statusConfig?.color || 'bg-gray-100')}>
                {statusConfig?.label || status}
            </Badge>
        );
    };

    const getPriorityBadge = (priority: string) => {
        const priorityConfig = TICKET_PRIORITIES.find(p => p.value === priority);
        return (
            <Badge variant="outline" className={cn("capitalize", priorityConfig?.color)}>
                {priorityConfig?.label || priority}
            </Badge>
        );
    };

    return (
        <DashboardLayout title="Help & Support">
            <div className="p-4 md:p-6 space-y-6">
                {/* Header */}
                <div className="text-center max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold mb-2">How can we help you?</h1>
                    <p className="text-muted-foreground">
                        Find answers to common questions or get in touch with our support team
                    </p>

                    {/* Search */}
                    <div className="relative mt-6 max-w-md mx-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Search for help..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-12 text-lg"
                        />
                    </div>
                </div>

                {/* Quick Help Topics */}
                <div className="grid gap-4 md:grid-cols-4">
                    {QUICK_HELP_TOPICS.map((topic, index) => (
                        <Card
                            key={index}
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => window.location.href = topic.link}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        {topic.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium">{topic.title}</h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {topic.description}
                                        </p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
                        <TabsTrigger value="help" className="gap-2">
                            <HelpCircle className="h-4 w-4" />
                            FAQs
                        </TabsTrigger>
                        <TabsTrigger value="tickets" className="gap-2">
                            <Ticket className="h-4 w-4" />
                            My Tickets
                        </TabsTrigger>
                        <TabsTrigger value="contact" className="gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Contact
                        </TabsTrigger>
                    </TabsList>

                    {/* FAQs Tab */}
                    <TabsContent value="help" className="mt-6">
                        <div className="grid gap-6 lg:grid-cols-3">
                            {/* FAQs */}
                            <div className="lg:col-span-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Frequently Asked Questions</CardTitle>
                                        <CardDescription>
                                            Find quick answers to common questions
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {isLoadingFaqs ? (
                                            <div className="space-y-4">
                                                {[...Array(5)].map((_, i) => (
                                                    <Skeleton key={i} className="h-16 w-full" />
                                                ))}
                                            </div>
                                        ) : filteredFaqs.length > 0 ? (
                                            <Accordion type="single" collapsible className="w-full">
                                                {Object.entries(groupedFaqs).map(([category, categoryFaqs]) => (
                                                    <div key={category} className="mb-4">
                                                        <h4 className="text-sm font-medium text-muted-foreground mb-2 capitalize">
                                                            {category.replace('_', ' ')}
                                                        </h4>
                                                        {categoryFaqs.map((faq) => (
                                                            <AccordionItem key={faq.id} value={faq.id}>
                                                                <AccordionTrigger className="text-left">
                                                                    {faq.question}
                                                                </AccordionTrigger>
                                                                <AccordionContent className="text-muted-foreground">
                                                                    {faq.answer}
                                                                </AccordionContent>
                                                            </AccordionItem>
                                                        ))}
                                                    </div>
                                                ))}
                                            </Accordion>
                                        ) : (
                                            <div className="text-center py-8">
                                                <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                                <p className="text-muted-foreground">
                                                    {searchQuery
                                                        ? 'No FAQs match your search'
                                                        : 'No FAQs available'}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Resources Sidebar */}
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Resources</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {RESOURCES.map((resource, index) => (
                                            <a
                                                key={index}
                                                href={resource.link}
                                                target={resource.external ? '_blank' : undefined}
                                                rel={resource.external ? 'noopener noreferrer' : undefined}
                                                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                                            >
                                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                                    {resource.icon}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-medium flex items-center gap-1">
                                                        {resource.title}
                                                        {resource.external && (
                                                            <ExternalLink className="h-3 w-3" />
                                                        )}
                                                    </h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        {resource.description}
                                                    </p>
                                                </div>
                                            </a>
                                        ))}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Need More Help?</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Can't find what you're looking for? Our support team is here to help.
                                        </p>
                                        <Button
                                            className="w-full"
                                            onClick={() => {
                                                setActiveTab('tickets');
                                                setIsNewTicketOpen(true);
                                            }}
                                        >
                                            <MessageSquare className="h-4 w-4 mr-2" />
                                            Contact Support
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Tickets Tab */}
                    <TabsContent value="tickets" className="mt-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Support Tickets</CardTitle>
                                    <CardDescription>
                                        View and manage your support requests
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => refetchTickets()}>
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                    <Button onClick={() => setIsNewTicketOpen(true)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        New Ticket
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoadingTickets ? (
                                    <div className="space-y-4">
                                        {[...Array(3)].map((_, i) => (
                                            <Skeleton key={i} className="h-20 w-full" />
                                        ))}
                                    </div>
                                ) : tickets.length > 0 ? (
                                    <div className="space-y-4">
                                        {tickets.map((ticket) => (
                                            <div
                                                key={ticket.id}
                                                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                                                onClick={() => setSelectedTicketId(ticket.id)}
                                            >
                                                <div className="flex-shrink-0">
                                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <Ticket className="h-5 w-5 text-primary" />
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <p className="font-medium">{ticket.subject}</p>
                                                            <p className="text-sm text-muted-foreground line-clamp-1">
                                                                {ticket.description}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {getStatusBadge(ticket.status)}
                                                            {getPriorityBadge(ticket.priority)}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                        <span>#{ticket.ticketNumber}</span>
                                                        <span className="capitalize">{ticket.category.replace('_', ' ')}</span>
                                                        <span>
                                                            {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Ticket className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                        <h3 className="text-lg font-medium">No support tickets</h3>
                                        <p className="text-sm text-muted-foreground mt-1 mb-4">
                                            You haven't created any support tickets yet
                                        </p>
                                        <Button onClick={() => setIsNewTicketOpen(true)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create Ticket
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Contact Tab */}
                    <TabsContent value="contact" className="mt-6">
                        <div className="grid gap-6 lg:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Get in Touch</CardTitle>
                                    <CardDescription>
                                        Reach out to our support team directly
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                                        <div className="p-3 bg-primary rounded-lg text-primary-foreground">
                                            <Mail className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium">Email Support</h4>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Send us an email and we'll respond within 24 hours
                                            </p>
                                            <a
                                                href="mailto:support@churchplus.com"
                                                className="text-sm text-primary hover:underline mt-2 inline-block"
                                            >
                                                support@churchplus.com
                                            </a>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                                        <div className="p-3 bg-green-600 rounded-lg text-white">
                                            <Phone className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium">Phone Support</h4>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Available Monday to Friday, 9am - 5pm WAT
                                            </p>
                                            <a
                                                href="tel:+2341234567890"
                                                className="text-sm text-primary hover:underline mt-2 inline-block"
                                            >
                                                +234 123 456 7890
                                            </a>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                                        <div className="p-3 bg-purple-600 rounded-lg text-white">
                                            <MessageSquare className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium">Live Chat</h4>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Chat with our support team in real-time
                                            </p>
                                            <Button variant="link" className="p-0 h-auto text-sm mt-2">
                                                Start Chat
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Quick Contact Form</CardTitle>
                                    <CardDescription>
                                        Send us a message and we'll get back to you
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            setIsNewTicketOpen(true);
                                        }}
                                        className="space-y-4"
                                    >
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="contact-name">Name</Label>
                                                <Input
                                                    id="contact-name"
                                                    value={ticketForm.contactName}
                                                    onChange={(e) => setTicketForm(f => ({
                                                        ...f,
                                                        contactName: e.target.value
                                                    }))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="contact-email">Email</Label>
                                                <Input
                                                    id="contact-email"
                                                    type="email"
                                                    value={ticketForm.contactEmail}
                                                    onChange={(e) => setTicketForm(f => ({
                                                        ...f,
                                                        contactEmail: e.target.value
                                                    }))}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="contact-subject">Subject</Label>
                                            <Input
                                                id="contact-subject"
                                                placeholder="What do you need help with?"
                                                value={ticketForm.subject}
                                                onChange={(e) => setTicketForm(f => ({
                                                    ...f,
                                                    subject: e.target.value
                                                }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="contact-message">Message</Label>
                                            <Textarea
                                                id="contact-message"
                                                placeholder="Describe your issue or question..."
                                                rows={4}
                                                value={ticketForm.description}
                                                onChange={(e) => setTicketForm(f => ({
                                                    ...f,
                                                    description: e.target.value
                                                }))}
                                            />
                                        </div>
                                        <Button type="submit" className="w-full">
                                            <Send className="h-4 w-4 mr-2" />
                                            Send Message
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* New Ticket Dialog */}
                <Dialog open={isNewTicketOpen} onOpenChange={setIsNewTicketOpen}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Create Support Ticket</DialogTitle>
                            <DialogDescription>
                                Describe your issue and our team will get back to you as soon as possible.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="ticket-name">Your Name *</Label>
                                    <Input
                                        id="ticket-name"
                                        value={ticketForm.contactName}
                                        onChange={(e) => setTicketForm(f => ({
                                            ...f,
                                            contactName: e.target.value
                                        }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ticket-email">Email *</Label>
                                    <Input
                                        id="ticket-email"
                                        type="email"
                                        value={ticketForm.contactEmail}
                                        onChange={(e) => setTicketForm(f => ({
                                            ...f,
                                            contactEmail: e.target.value
                                        }))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="ticket-phone">Phone (optional)</Label>
                                <Input
                                    id="ticket-phone"
                                    value={ticketForm.contactPhone}
                                    onChange={(e) => setTicketForm(f => ({
                                        ...f,
                                        contactPhone: e.target.value
                                    }))}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="ticket-category">Category *</Label>
                                    <Select
                                        value={ticketForm.category}
                                        onValueChange={(value: TicketCategory) => setTicketForm(f => ({
                                            ...f,
                                            category: value
                                        }))}
                                    >
                                        <SelectTrigger id="ticket-category">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TICKET_CATEGORIES.map((cat) => (
                                                <SelectItem key={cat.value} value={cat.value}>
                                                    {cat.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ticket-priority">Priority</Label>
                                    <Select
                                        value={ticketForm.priority}
                                        onValueChange={(value: TicketPriority) => setTicketForm(f => ({
                                            ...f,
                                            priority: value
                                        }))}
                                    >
                                        <SelectTrigger id="ticket-priority">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TICKET_PRIORITIES.map((pri) => (
                                                <SelectItem key={pri.value} value={pri.value}>
                                                    {pri.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="ticket-subject">Subject *</Label>
                                <Input
                                    id="ticket-subject"
                                    placeholder="Brief description of your issue"
                                    value={ticketForm.subject}
                                    onChange={(e) => setTicketForm(f => ({
                                        ...f,
                                        subject: e.target.value
                                    }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="ticket-description">Description *</Label>
                                <Textarea
                                    id="ticket-description"
                                    placeholder="Please provide as much detail as possible about your issue..."
                                    rows={5}
                                    value={ticketForm.description}
                                    onChange={(e) => setTicketForm(f => ({
                                        ...f,
                                        description: e.target.value
                                    }))}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsNewTicketOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateTicket}
                                disabled={isCreating || !ticketForm.subject || !ticketForm.description}
                            >
                                {isCreating ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4 mr-2" />
                                )}
                                Submit Ticket
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Ticket Detail Dialog */}
                <TicketDetailDialog
                    ticketId={selectedTicketId}
                    onClose={() => setSelectedTicketId(null)}
                />
            </div>
        </DashboardLayout>
    );
}

// Ticket Detail Dialog Component
function TicketDetailDialog({
                                ticketId,
                                onClose,
                            }: {
    ticketId: string | null;
    onClose: () => void;
}) {
    const [newMessage, setNewMessage] = useState('');
    const { ticket, messages, isLoadingTicket, isLoadingMessages, addMessage, isSending } = useTicket(ticketId || '');

    if (!ticketId) return null;

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        try {
            await addMessage(newMessage);
            setNewMessage('');
        } catch (error) {
            // Error handled by hook
        }
    };

    return (
        <Dialog open={!!ticketId} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle>{ticket?.subject}</DialogTitle>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-muted-foreground">
                                    #{ticket?.ticketNumber}
                                </span>
                                {ticket && (
                                    <>
                                        <Badge className={cn(
                                            TICKET_STATUSES.find(s => s.value === ticket.status)?.color
                                        )}>
                                            {TICKET_STATUSES.find(s => s.value === ticket.status)?.label}
                                        </Badge>
                                        <Badge variant="outline" className={cn(
                                            TICKET_PRIORITIES.find(p => p.value === ticket.priority)?.color
                                        )}>
                                            {TICKET_PRIORITIES.find(p => p.value === ticket.priority)?.label}
                                        </Badge>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                {isLoadingTicket ? (
                    <div className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-40 w-full" />
                    </div>
                ) : ticket ? (
                    <>
                        {/* Original Message */}
                        <div className="p-4 bg-muted rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium">{ticket.contactName}</span>
                                <span className="text-xs text-muted-foreground">
                                    {format(new Date(ticket.createdAt), 'PPp')}
                                </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
                        </div>

                        {/* Messages */}
                        <ScrollArea className="flex-1 max-h-60">
                            <div className="space-y-4 py-4">
                                {isLoadingMessages ? (
                                    <Skeleton className="h-20 w-full" />
                                ) : messages.length > 0 ? (
                                    messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={cn(
                                                "p-4 rounded-lg",
                                                msg.isStaffReply
                                                    ? "bg-blue-50 dark:bg-blue-900/20 ml-4"
                                                    : "bg-muted mr-4"
                                            )}
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-sm font-medium">
                                                    {msg.isStaffReply
                                                        ? 'Support Team'
                                                        : `${msg.firstName || ''} ${msg.lastName || ''}`.trim() || msg.userEmail || 'You'
                                                    }
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {format(new Date(msg.createdAt), 'PPp')}
                                                </span>
                                            </div>
                                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-sm text-muted-foreground">
                                        No replies yet
                                    </p>
                                )}
                            </div>
                        </ScrollArea>

                        {/* Reply Input */}
                        {ticket.status !== 'closed' && (
                            <div className="flex gap-2 pt-4 border-t">
                                <Textarea
                                    placeholder="Type your reply..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    rows={2}
                                    className="flex-1"
                                />
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={isSending || !newMessage.trim()}
                                    className="self-end"
                                >
                                    {isSending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <p className="text-center text-muted-foreground">Ticket not found</p>
                )}
            </DialogContent>
        </Dialog>
    );
}