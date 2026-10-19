// src/pages/Events.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Plus,
    Search,
    Calendar,
    Users,
    MapPin,
    Clock,
    QrCode,
    Edit,
    Trash2,
    Eye,
    DollarSign,
    MoreHorizontal,
    Video,
    Globe,
    Play,
    Share2,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Ticket,
    TrendingUp,
    UserCheck,
    FileBarChart,
} from 'lucide-react';
import { EventModal } from '@/components/modals/EventModal';
import { ShareEventModal } from '@/components/modals/ShareEventModal';
import { EventReportModal } from '@/components/modals/EventReportModal';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';
import { useEvents } from '@/hooks/useEvents';
import { useCurrency } from '@/hooks/useCurrency';
import { Event, eventsApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const eventTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'service', label: 'Service' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'conference', label: 'Conference' },
    { value: 'outreach', label: 'Outreach' },
    { value: 'fellowship', label: 'Fellowship' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'retreat', label: 'Retreat' },
    { value: 'concert', label: 'Concert' },
    { value: 'other', label: 'Other' },
];

export default function Events() {
    const navigate = useNavigate();

    // Currency hook
    const { formatCurrency, currencySymbol } = useCurrency();

    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
    const [showQRDialog, setShowQRDialog] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [qrCodeData, setQrCodeData] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [activeTab, setActiveTab] = useState('all');

    const {
        events,
        statistics,
        pagination,
        isLoading,
        isLoadingStats,
        filters,
        setFilters,
        deleteEvent,
        startEvent,
        refetch,
    } = useEvents();

    // Handle search with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setFilters({ ...filters, search: searchQuery, page: 1 });
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Handle filter changes
    useEffect(() => {
        const newFilters: any = { ...filters, page: 1 };

        if (typeFilter !== 'all') {
            newFilters.eventType = typeFilter;
        } else {
            delete newFilters.eventType;
        }

        if (activeTab === 'active') {
            newFilters.isActive = true;
        } else if (activeTab === 'paid') {
            newFilters.isPaid = true;
        } else if (activeTab === 'online') {
            newFilters.locationType = 'online';
        } else {
            delete newFilters.isActive;
            delete newFilters.isPaid;
            delete newFilters.locationType;
        }

        setFilters(newFilters);
    }, [typeFilter, activeTab]);

    const handleEditEvent = (event: Event) => {
        setSelectedEvent(event);
        setShowEventModal(true);
    };

    const handleDeleteEvent = async () => {
        if (eventToDelete) {
            await deleteEvent(eventToDelete.id);
            setEventToDelete(null);
        }
    };

    const handleShowQRCode = async (event: Event) => {
        try {
            const result = await eventsApi.getQRCode(event.id);
            setQrCodeData(result.qrCode);
            setSelectedEvent(event);
            setShowQRDialog(true);
        } catch (error) {
            console.error('Failed to get QR code:', error);
        }
    };

    const handleShareEvent = (event: Event) => {
        setSelectedEvent(event);
        setShowShareModal(true);
    };

    const handleGenerateReport = (event: Event) => {
        setSelectedEvent(event);
        setShowReportModal(true);
    };

    const handleManualRegistration = (event: Event) => {
        navigate(`/events/manual-registration?eventId=${event.id}`);
    };

    const handleStartEvent = async (event: Event) => {
        await startEvent(event.id);
    };

    const handleModalClose = () => {
        setShowEventModal(false);
        setSelectedEvent(null);
    };

    const handleModalSuccess = () => {
        handleModalClose();
        refetch();
    };

    const getEventTypeBadge = (type: string) => {
        const colors: Record<string, string> = {
            service: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            meeting: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            conference: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
            outreach: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
            fellowship: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
            workshop: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            retreat: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
            concert: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
        };
        return colors[type] || colors.other;
    };

    const getLocationIcon = (locationType: string) => {
        switch (locationType) {
            case 'online':
                return <Video className="h-4 w-4" />;
            case 'hybrid':
                return <Globe className="h-4 w-4" />;
            default:
                return <MapPin className="h-4 w-4" />;
        }
    };

    const formatEventDate = (dateStr: string) => {
        try {
            return format(new Date(dateStr), 'MMM d, yyyy');
        } catch {
            return dateStr;
        }
    };

    return (
        <DashboardLayout
            title="Events"
            actions={
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/events/manual-registration')}
                        className="gap-2"
                    >
                        <UserCheck className="h-4 w-4" />
                        <span className="hidden sm:inline">Manual Check-In</span>
                    </Button>
                    <Button
                        className="bg-gradient-primary text-white hover:opacity-90 gap-2"
                        onClick={() => {
                            setSelectedEvent(null);
                            setShowEventModal(true);
                        }}
                    >
                        <Plus className="h-4 w-4" />
                        Create Event
                    </Button>
                </div>
            }
        >
            <div className="p-4 md:p-6 space-y-6">
                {/* Statistics Cards */}
                <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-5">
                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4 md:p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 md:p-3 rounded-xl bg-primary/10">
                                    <Calendar className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs md:text-sm text-muted-foreground">Total Events</p>
                                    {isLoadingStats ? (
                                        <Skeleton className="h-7 w-12" />
                                    ) : (
                                        <p className="text-xl md:text-2xl font-bold">{statistics?.totalEvents || 0}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4 md:p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 md:p-3 rounded-xl bg-green-500/10">
                                    <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs md:text-sm text-muted-foreground">Upcoming</p>
                                    {isLoadingStats ? (
                                        <Skeleton className="h-7 w-12" />
                                    ) : (
                                        <p className="text-xl md:text-2xl font-bold">{statistics?.upcomingEvents || 0}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4 md:p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 md:p-3 rounded-xl bg-blue-500/10">
                                    <Users className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs md:text-sm text-muted-foreground">Registrations</p>
                                    {isLoadingStats ? (
                                        <Skeleton className="h-7 w-12" />
                                    ) : (
                                        <p className="text-xl md:text-2xl font-bold">{statistics?.totalRegistrations || 0}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4 md:p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 md:p-3 rounded-xl bg-purple-500/10">
                                    <Video className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-xs md:text-sm text-muted-foreground">Online Events</p>
                                    {isLoadingStats ? (
                                        <Skeleton className="h-7 w-12" />
                                    ) : (
                                        <p className="text-xl md:text-2xl font-bold">{statistics?.onlineEvents || 0}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4 md:p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 md:p-3 rounded-xl bg-yellow-500/10">
                                    <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-xs md:text-sm text-muted-foreground">Paid Events</p>
                                    {isLoadingStats ? (
                                        <Skeleton className="h-7 w-12" />
                                    ) : (
                                        <p className="text-xl md:text-2xl font-bold">{statistics?.paidEvents || 0}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Events List */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <CardTitle>All Events</CardTitle>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex items-center gap-2">
                                    <Button size="icon" variant="outline" onClick={refetch}>
                                        <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                                    </Button>
                                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                                        <SelectTrigger className="w-[140px]">
                                            <SelectValue placeholder="Event Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {eventTypes.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search events..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 w-full sm:w-64"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="mb-4">
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="active">Active</TabsTrigger>
                                <TabsTrigger value="paid">Paid</TabsTrigger>
                                <TabsTrigger value="online">Online</TabsTrigger>
                            </TabsList>

                            <TabsContent value={activeTab}>
                                {isLoading ? (
                                    <div className="space-y-4">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className="flex items-center gap-4">
                                                <Skeleton className="h-12 w-12 rounded" />
                                                <div className="space-y-2 flex-1">
                                                    <Skeleton className="h-4 w-48" />
                                                    <Skeleton className="h-3 w-32" />
                                                </div>
                                                <Skeleton className="h-6 w-16" />
                                                <Skeleton className="h-8 w-8" />
                                            </div>
                                        ))}
                                    </div>
                                ) : events.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                                        <p className="text-lg font-medium text-muted-foreground">
                                            {searchQuery || typeFilter !== 'all'
                                                ? 'No events match your search criteria.'
                                                : 'No events created yet.'}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {!searchQuery && typeFilter === 'all' && 'Click "Create Event" to get started.'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Event</TableHead>
                                                    <TableHead className="hidden md:table-cell">Type</TableHead>
                                                    <TableHead className="hidden sm:table-cell">Date & Time</TableHead>
                                                    <TableHead className="hidden lg:table-cell">Location</TableHead>
                                                    <TableHead className="text-right hidden md:table-cell">Registrations</TableHead>
                                                    <TableHead className="text-right hidden xl:table-cell">Financials</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {events.map((event) => {
                                                    const totalOfferings = event.financials?.totalOfferings || 0;
                                                    const totalExpenses = event.financials?.totalExpenses || 0;
                                                    const netAmount = event.financials?.netAmount || 0;

                                                    return (
                                                        <TableRow key={event.id} className="hover:bg-muted/50">
                                                            <TableCell>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="font-medium">{event.name}</p>
                                                                        {event.isFeatured && (
                                                                            <Badge variant="secondary" className="text-xs">Featured</Badge>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-sm text-muted-foreground md:hidden">
                                                                        {event.eventType} • {formatEventDate(event.startDate)}
                                                                    </p>
                                                                    <div className="flex gap-2 mt-1">
                                                                        {event.isPaid && event.price && (
                                                                            <Badge variant="outline" className="text-xs gap-1">
                                                                                <Ticket className="h-3 w-3" />
                                                                                {formatCurrency(event.price)}
                                                                            </Badge>
                                                                        )}
                                                                        {event.recurrence !== 'none' && (
                                                                            <Badge variant="secondary" className="text-xs">
                                                                                {event.recurrence}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="hidden md:table-cell">
                                                                <Badge className={cn('capitalize', getEventTypeBadge(event.eventType))}>
                                                                    {event.eventType}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="hidden sm:table-cell">
                                                                <div className="flex items-start gap-2">
                                                                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                                    <div>
                                                                        <p>{formatEventDate(event.startDate)}</p>
                                                                        <p className="text-sm text-muted-foreground">
                                                                            {event.startTime}
                                                                            {event.endTime && ` - ${event.endTime}`}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="hidden lg:table-cell">
                                                                <div className="flex items-center gap-2">
                                                                    {getLocationIcon(event.locationType)}
                                                                    <span className="capitalize">
                                                                        {event.locationName || event.locationType}
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right hidden md:table-cell">
                                                                <Badge variant="secondary">
                                                                    {event.currentRegistrations || 0}
                                                                    {event.maxRegistrations && ` / ${event.maxRegistrations}`}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right hidden xl:table-cell">
                                                                <div className="space-y-1">
                                                                    <div className="text-sm">
                                                                        <span className="text-green-600 font-medium">
                                                                            {formatCurrency(totalOfferings)}
                                                                        </span>
                                                                    </div>
                                                                    {totalExpenses > 0 && (
                                                                        <div className="text-xs text-muted-foreground">
                                                                            Net: {formatCurrency(netAmount)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon">
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="w-56">
                                                                        <DropdownMenuLabel>Event Actions</DropdownMenuLabel>
                                                                        <DropdownMenuSeparator />

                                                                        {/* View & Edit */}
                                                                        <DropdownMenuItem onClick={() => handleEditEvent(event)}>
                                                                            <Eye className="mr-2 h-4 w-4" />
                                                                            View Details
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleEditEvent(event)}>
                                                                            <Edit className="mr-2 h-4 w-4" />
                                                                            Edit Event
                                                                        </DropdownMenuItem>

                                                                        <DropdownMenuSeparator />

                                                                        {/* Registration Actions */}
                                                                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                                                                            Registration
                                                                        </DropdownMenuLabel>
                                                                        <DropdownMenuItem onClick={() => handleManualRegistration(event)}>
                                                                            <UserCheck className="mr-2 h-4 w-4" />
                                                                            Manual Registration
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleShowQRCode(event)}>
                                                                            <QrCode className="mr-2 h-4 w-4" />
                                                                            Check-in QR Code
                                                                        </DropdownMenuItem>

                                                                        <DropdownMenuSeparator />

                                                                        {/* Reports & Share */}
                                                                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                                                                            Reports & Share
                                                                        </DropdownMenuLabel>
                                                                        <DropdownMenuItem onClick={() => handleGenerateReport(event)}>
                                                                            <FileBarChart className="mr-2 h-4 w-4" />
                                                                            Generate Report
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleShareEvent(event)}>
                                                                            <Share2 className="mr-2 h-4 w-4" />
                                                                            Share Event
                                                                        </DropdownMenuItem>

                                                                        <DropdownMenuSeparator />

                                                                        {/* Event Control */}
                                                                        <DropdownMenuItem onClick={() => handleStartEvent(event)}>
                                                                            <Play className="mr-2 h-4 w-4" />
                                                                            Start Event
                                                                        </DropdownMenuItem>

                                                                        <DropdownMenuSeparator />

                                                                        <DropdownMenuItem
                                                                            className="text-destructive focus:text-destructive"
                                                                            onClick={() => setEventToDelete(event)}
                                                                        >
                                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                                            Delete Event
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}

                                {/* Pagination */}
                                {pagination && pagination.totalPages > 1 && (
                                    <div className="flex items-center justify-between mt-4">
                                        <p className="text-sm text-muted-foreground">
                                            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                                            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                                            {pagination.total} events
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                                                disabled={pagination.page <= 1}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                                Previous
                                            </Button>
                                            <span className="text-sm text-muted-foreground px-2">
                                                Page {pagination.page} of {pagination.totalPages}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                                                disabled={pagination.page >= pagination.totalPages}
                                            >
                                                Next
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>

            {/* Event Modal (Create/Edit) */}
            <EventModal
                open={showEventModal}
                onClose={handleModalClose}
                onSuccess={handleModalSuccess}
                event={selectedEvent}
            />

            {/* Share Event Modal */}
            <ShareEventModal
                open={showShareModal}
                onClose={() => {
                    setShowShareModal(false);
                    setSelectedEvent(null);
                }}
                event={selectedEvent}
            />

            {/* Event Report Modal */}
            <EventReportModal
                open={showReportModal}
                onClose={() => {
                    setShowReportModal(false);
                    setSelectedEvent(null);
                }}
                event={selectedEvent}
            />

            {/* QR Code Dialog */}
            <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Event QR Code</DialogTitle>
                        <DialogDescription>
                            Share this QR code for attendees to check in
                        </DialogDescription>
                    </DialogHeader>
                    {selectedEvent && qrCodeData && (
                        <QRCodeGenerator
                            value={qrCodeData}
                            title={selectedEvent.name}
                            subtitle={`${formatEventDate(selectedEvent.startDate)} at ${selectedEvent.startTime}`}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!eventToDelete} onOpenChange={() => setEventToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Event</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete{' '}
                            <span className="font-medium">{eventToDelete?.name}</span>?
                            This will also delete all registrations and instances.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteEvent}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
}