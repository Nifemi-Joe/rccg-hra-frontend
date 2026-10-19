// src/pages/registrations/ManualRegistrationPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
    Calendar,
    Users,
    Check,
    Loader2,
    ArrowLeft,
    ClipboardCheck,
    X,
    MapPin,
    Clock,
    QrCode,
    UserCheck,
    UserPlus,
    Search,
    RefreshCw,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ChevronRight,
    Download,
    Filter,
    MoreHorizontal,
    Mail,
    Phone,
    ExternalLink,
    Eye,
    Undo2,
    Copy,
    Share2,
    Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

import { RegistrantSearch } from '@/components/registration/RegistrantSearch';
import { NewRegistrantForm } from '@/components/registration/NewRegistrantForm';
import { NotificationOptions } from '@/components/registration/NotificationOptions';

import { registrationApi } from '@/services/registrationApi';
import {
    RegistrantSearchResult,
    RegistrantType,
    ManualRegistrationForm,
    EventOption,
    EventInstance,
    RegistrationResponse,
    NotificationChannel,
    EventAttendee,
    RecentCheckIn,
} from '@/types/registration';
import { cn } from '@/lib/utils';

export default function ManualRegistrationPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const eventIdParam = searchParams.get('eventId');

    // View mode state
    const [viewMode, setViewMode] = useState<'attendees' | 'quick-checkin' | 'registration'>('attendees');

    // Event state
    const [events, setEvents] = useState<EventOption[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string>('');
    const [selectedEvent, setSelectedEvent] = useState<EventOption | null>(null);
    const [instances, setInstances] = useState<EventInstance[]>([]);
    const [selectedInstance, setSelectedInstance] = useState<string>('');

    // Attendees state
    const [attendees, setAttendees] = useState<EventAttendee[]>([]);
    const [attendeeFilter, setAttendeeFilter] = useState<'all' | 'checked-in' | 'not-checked-in'>('all');
    const [attendeeSearch, setAttendeeSearch] = useState('');
    const [isLoadingAttendees, setIsLoadingAttendees] = useState(false);

    // Quick check-in state
    const [allMembers, setAllMembers] = useState<any[]>([]);
    const [quickSearchQuery, setQuickSearchQuery] = useState('');
    const [recentCheckIns, setRecentCheckIns] = useState<RecentCheckIn[]>([]);
    const [isLoadingRecentCheckIns, setIsLoadingRecentCheckIns] = useState(false);
    const [showGuestDialog, setShowGuestDialog] = useState(false);
    const [guestForm, setGuestForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        gender: '',
        isFirstTimer: false,
    });

    // Registration form state
    const [registrantType, setRegistrantType] = useState<RegistrantType>('existing_member');
    const [selectedRegistrant, setSelectedRegistrant] = useState<RegistrantSearchResult | null>(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
    });
    const [sendNotification, setSendNotification] = useState(false);
    const [notificationChannels, setNotificationChannels] = useState<NotificationChannel[]>([]);
    const [notes, setNotes] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Loading states
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [checkingInId, setCheckingInId] = useState<string | null>(null);
    const [result, setResult] = useState<RegistrationResponse | null>(null);

    // QR Code state
    const [showQrDialog, setShowQrDialog] = useState(false);

    // Stats calculations
    const stats = {
        total: attendees.length,
        checkedIn: attendees.filter(a => a.isCheckedIn).length,
        members: attendees.filter(a => a.type === 'member').length,
        guests: attendees.filter(a => a.type === 'guest').length,
    };
    const checkInPercentage = stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0;

    // Load events on mount
    useEffect(() => {
        loadEvents();
    }, []);

    // Handle event param
    useEffect(() => {
        if (eventIdParam) {
            setSelectedEventId(eventIdParam);
            loadEventOptions(eventIdParam);
        }
    }, [eventIdParam]);

    useEffect(() => {
        if (selectedEventId && selectedEventId !== eventIdParam) {
            loadEventOptions(selectedEventId);
        }
    }, [selectedEventId]);

    // Load attendees and recent check-ins when event changes
    useEffect(() => {
        if (selectedEvent) {
            loadAttendees();
            loadRecentCheckIns();
            if (viewMode === 'quick-checkin') {
                loadAllMembers();
            }
        }
    }, [selectedEvent, selectedInstance]);

    // Load members when switching to quick check-in tab
    useEffect(() => {
        if (selectedEvent && viewMode === 'quick-checkin') {
            loadAllMembers();
        }
    }, [viewMode]);

    // ==================== DATA LOADING FUNCTIONS ====================

    const loadEvents = async () => {
        try {
            const data = await registrationApi.getEvents();
            setEvents(data);
        } catch (error) {
            console.error('Error loading events:', error);
            toast.error('Failed to load events');
        }
    };

    const loadEventOptions = async (eventId: string) => {
        setIsLoading(true);
        try {
            const data = await registrationApi.getEventOptions(eventId);
            setSelectedEvent(data.event);
            setInstances(data.instances);
            if (data.instances.length > 0) {
                setSelectedInstance(data.instances[0].id);
            }
        } catch (error) {
            console.error('Error loading event options:', error);
            toast.error('Failed to load event details');
        } finally {
            setIsLoading(false);
        }
    };

    const loadAttendees = async () => {
        if (!selectedEvent) return;

        setIsLoadingAttendees(true);
        try {
            const data = await registrationApi.getEventAttendees(selectedEvent.id, {
                instanceId: selectedInstance || undefined,
            });
            setAttendees(data);
        } catch (error) {
            console.error('Error loading attendees:', error);
            toast.error('Failed to load attendees');
        } finally {
            setIsLoadingAttendees(false);
        }
    };

    const loadRecentCheckIns = async () => {
        if (!selectedEvent) return;

        setIsLoadingRecentCheckIns(true);
        try {
            const data = await registrationApi.getRecentCheckIns(selectedEvent.id, {
                instanceId: selectedInstance || undefined,
                limit: 15,
            });
            setRecentCheckIns(data);
        } catch (error) {
            console.error('Error loading recent check-ins:', error);
            // Don't show error toast for this, just log it
        } finally {
            setIsLoadingRecentCheckIns(false);
        }
    };

    const loadAllMembers = async () => {
        setIsLoadingMembers(true);
        try {
            const data = await registrationApi.getAllMembers(quickSearchQuery, 100);
            setAllMembers(data);
        } catch (error) {
            console.error('Error loading members:', error);
            toast.error('Failed to load members');
        } finally {
            setIsLoadingMembers(false);
        }
    };

    // Refresh all data
    const refreshData = useCallback(async () => {
        if (!selectedEvent) return;

        await Promise.all([
            loadAttendees(),
            loadRecentCheckIns(),
        ]);

        toast.success('Data refreshed');
    }, [selectedEvent, selectedInstance]);

    // ==================== EVENT HANDLERS ====================

    const handleEventChange = (eventId: string) => {
        setSelectedEventId(eventId);
        setResult(null);
        setRecentCheckIns([]); // Clear recent check-ins when changing events
        if (eventId) {
            navigate(`/events/manual-registration?eventId=${eventId}`, { replace: true });
        } else {
            navigate('/events/manual-registration', { replace: true });
            setSelectedEvent(null);
            setInstances([]);
            setSelectedInstance('');
            setAttendees([]);
        }
    };

    const handleInstanceChange = (instanceId: string) => {
        setSelectedInstance(instanceId);
        setRecentCheckIns([]); // Clear and reload for new instance
    };

    // Check-in handlers
    const handleCheckIn = async (attendee: EventAttendee) => {
        setCheckingInId(attendee.registrationId);
        try {
            if (attendee.isCheckedIn) {
                await registrationApi.undoCheckIn(attendee.registrationId);
                toast.success(`Check-in removed for ${attendee.firstName} ${attendee.lastName}`);

                // Remove from recent check-ins
                setRecentCheckIns(prev => prev.filter(c => c.id !== attendee.registrationId));
            } else {
                const result = await registrationApi.quickCheckIn({
                    eventId: selectedEvent!.id,
                    eventInstanceId: selectedInstance || undefined,
                    registrationId: attendee.registrationId,
                });

                toast.success(`${attendee.firstName} ${attendee.lastName} checked in!`);

                // Add to recent check-ins at the top
                const newCheckIn: RecentCheckIn = {
                    id: attendee.registrationId,
                    name: `${attendee.firstName} ${attendee.lastName}`,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    type: attendee.type,
                    avatar: attendee.avatar,
                };
                setRecentCheckIns(prev => [newCheckIn, ...prev.slice(0, 14)]);
            }

            // Update local attendee state
            setAttendees(prev => prev.map(a =>
                a.registrationId === attendee.registrationId
                    ? {
                        ...a,
                        isCheckedIn: !a.isCheckedIn,
                        checkInTime: !a.isCheckedIn
                            ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : undefined
                    }
                    : a
            ));
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Check-in failed');
        } finally {
            setCheckingInId(null);
        }
    };

    const handleQuickMemberCheckIn = async (member: any) => {
        setCheckingInId(member.id);
        try {
            const result = await registrationApi.quickCheckIn({
                eventId: selectedEvent!.id,
                eventInstanceId: selectedInstance || undefined,
                memberId: member.id,
            });

            toast.success(`${member.firstName} ${member.lastName} checked in!`);

            // Add to recent check-ins
            const newCheckIn: RecentCheckIn = {
                id: result.registrationId,
                name: `${member.firstName} ${member.lastName}`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                type: 'member',
                avatar: member.avatar,
            };
            setRecentCheckIns(prev => [newCheckIn, ...prev.slice(0, 14)]);

            // Refresh attendees list
            loadAttendees();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Check-in failed');
        } finally {
            setCheckingInId(null);
        }
    };

    const handleGuestCheckIn = async () => {
        if (!guestForm.firstName || !guestForm.lastName) {
            toast.error('Please enter guest name');
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await registrationApi.quickCheckIn({
                eventId: selectedEvent!.id,
                eventInstanceId: selectedInstance || undefined,
                walkIn: {
                    type: guestForm.isFirstTimer ? 'first_timer' : 'guest',
                    firstName: guestForm.firstName,
                    lastName: guestForm.lastName,
                    email: guestForm.email || undefined,
                    phone: guestForm.phone || undefined,
                    gender: guestForm.gender || undefined,
                    isFirstTimer: guestForm.isFirstTimer,
                },
            });

            const guestName = `${guestForm.firstName} ${guestForm.lastName}`;
            toast.success(`${guestName} checked in!`);

            // Add to recent check-ins
            const newCheckIn: RecentCheckIn = {
                id: result.registrationId,
                name: guestName,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                type: guestForm.isFirstTimer ? 'first_timer' : 'guest',
            };
            setRecentCheckIns(prev => [newCheckIn, ...prev.slice(0, 14)]);

            // Reset form and close dialog
            setGuestForm({ firstName: '', lastName: '', email: '', phone: '', gender: '', isFirstTimer: false });
            setShowGuestDialog(false);

            // Refresh attendees
            loadAttendees();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to check in guest');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Undo check-in from recent list
    const handleUndoRecentCheckIn = async (checkIn: RecentCheckIn) => {
        try {
            await registrationApi.undoCheckIn(checkIn.id);

            // Remove from recent check-ins
            setRecentCheckIns(prev => prev.filter(c => c.id !== checkIn.id));

            // Update attendee list
            setAttendees(prev => prev.map(a =>
                a.registrationId === checkIn.id
                    ? { ...a, isCheckedIn: false, checkInTime: undefined }
                    : a
            ));

            toast.success(`Check-in removed for ${checkIn.name}`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to undo check-in');
        }
    };

    // Registration handlers
    const handleRegistrantSelect = (
        registrant: RegistrantSearchResult | null,
        type: RegistrantType
    ) => {
        setSelectedRegistrant(registrant);
        if (registrant) {
            setFormData({
                firstName: registrant.firstName,
                lastName: registrant.lastName,
                email: registrant.email || '',
                phone: registrant.phone || ''
            });
        }
    };

    const handleTypeChange = (type: RegistrantType) => {
        setRegistrantType(type);
        if (type !== 'existing_member') {
            setSelectedRegistrant(null);
            setFormData({ firstName: '', lastName: '', email: '', phone: '' });
        }
    };

    const handleFormChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!selectedEvent) {
            toast.error('Please select an event');
            return false;
        }

        if (registrantType === 'existing_member' && !selectedRegistrant) {
            toast.error('Please select a member or first-timer');
            return false;
        }

        if (registrantType !== 'existing_member') {
            if (!formData.firstName.trim()) {
                newErrors.firstName = 'First name is required';
            }
            if (!formData.lastName.trim()) {
                newErrors.lastName = 'Last name is required';
            }
        }

        if (sendNotification && notificationChannels.length === 0) {
            toast.error('Please select at least one notification channel');
            return false;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const registrationData: ManualRegistrationForm = {
                eventId: selectedEvent!.id,
                eventInstanceId: selectedInstance || undefined,
                registrantType,
                memberId: registrantType === 'existing_member' ? selectedRegistrant?.id : undefined,
                firstName: registrantType !== 'existing_member' ? formData.firstName : undefined,
                lastName: registrantType !== 'existing_member' ? formData.lastName : undefined,
                email: formData.email || undefined,
                phone: formData.phone || undefined,
                sendNotification,
                notificationChannels: sendNotification ? notificationChannels : [],
                notes: notes || undefined
            };

            const response = await registrationApi.registerForEvent(registrationData);
            setResult(response);
            toast.success('Registration successful!');

            // Refresh data
            loadAttendees();
            loadRecentCheckIns();
        } catch (error: any) {
            console.error('Registration error:', error);
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setResult(null);
        setSelectedRegistrant(null);
        setFormData({ firstName: '', lastName: '', email: '', phone: '' });
        setSendNotification(false);
        setNotificationChannels([]);
        setNotes('');
        setRegistrantType('existing_member');
    };

    // Copy QR link
    const copyQrLink = () => {
        const link = `${window.location.origin}/register/${selectedEvent?.id}`;
        navigator.clipboard.writeText(link);
        toast.success('Registration link copied!');
    };

    // Filter attendees
    const filteredAttendees = attendees.filter(a => {
        const matchesSearch =
            `${a.firstName} ${a.lastName}`.toLowerCase().includes(attendeeSearch.toLowerCase()) ||
            a.email?.toLowerCase().includes(attendeeSearch.toLowerCase()) ||
            a.phone?.includes(attendeeSearch);

        const matchesFilter =
            attendeeFilter === 'all' ||
            (attendeeFilter === 'checked-in' && a.isCheckedIn) ||
            (attendeeFilter === 'not-checked-in' && !a.isCheckedIn);

        return matchesSearch && matchesFilter;
    });

    // Filter members for quick check-in (exclude already registered)
    const filteredMembers = allMembers.filter(member => {
        const matchesSearch =
            `${member.firstName} ${member.lastName}`.toLowerCase().includes(quickSearchQuery.toLowerCase()) ||
            member.email?.toLowerCase().includes(quickSearchQuery.toLowerCase()) ||
            member.phone?.includes(quickSearchQuery);

        // Check if already registered for this event
        const isRegistered = attendees.some(a => a.memberId === member.id);

        return matchesSearch && !isRegistered;
    });

    // Get type badge color
    const getTypeBadgeColor = (type: string) => {
        switch (type) {
            case 'member':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
            case 'first_timer':
                return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
            case 'guest':
                return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'member':
                return 'Member';
            case 'first_timer':
                return 'First Timer';
            case 'guest':
                return 'Guest';
            default:
                return type;
        }
    };

    // ==================== RENDER ====================

    // Success result view
    if (result) {
        return (
            <DashboardLayout
                title="Registration Complete"
                actions={
                    <Button variant="outline" onClick={() => navigate('/events')} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Events
                    </Button>
                }
            >
                <div className="p-4 md:p-6 max-w-2xl mx-auto">
                    <Card>
                        <CardContent className="pt-8 text-center">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Registration Successful!</h2>
                            <p className="text-muted-foreground mb-6">
                                {result.registration.registrantName} has been registered for {result.registration.eventName}
                            </p>

                            <div className="bg-muted rounded-lg p-4 mb-6">
                                <p className="text-sm text-muted-foreground mb-1">Confirmation Code</p>
                                <p className="text-2xl font-mono font-bold text-primary">
                                    {result.registration.confirmationCode}
                                </p>
                            </div>

                            {result.newRecordCreated && (
                                <Alert className="mb-6 text-left">
                                    <Sparkles className="h-4 w-4" />
                                    <AlertTitle>
                                        New {result.newRecordCreated.type === 'member' ? 'Member' : 'First Timer'} Created
                                    </AlertTitle>
                                    <AlertDescription>
                                        A profile completion link has been sent to help them complete their profile.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {result.notificationsSent && result.notificationsSent.length > 0 && (
                                <div className="text-left mb-6">
                                    <p className="text-sm font-medium mb-2">Notifications:</p>
                                    <ul className="space-y-1">
                                        {result.notificationsSent.map((n, i) => (
                                            <li key={i} className={`text-sm flex items-center gap-2 ${
                                                n.success ? 'text-green-600' : 'text-destructive'
                                            }`}>
                                                {n.success ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                                {n.channel}: {n.success ? 'Sent' : n.error}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="flex gap-4">
                                <Button onClick={handleReset} className="flex-1">
                                    Register Another
                                </Button>
                                <Button variant="outline" onClick={() => setViewMode('attendees')} className="flex-1">
                                    View Attendees
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="Event Registration"
            actions={
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate('/events')} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Back</span>
                    </Button>
                    {selectedEvent && (
                        <>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" onClick={copyQrLink} className="gap-2">
                                            <Share2 className="h-4 w-4" />
                                            <span className="hidden sm:inline">Share Link</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Copy public registration link</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            {/*<Button variant="outline" onClick={() => setShowQrDialog(true)} className="gap-2">*/}
                            {/*    <QrCode className="h-4 w-4" />*/}
                            {/*    <span className="hidden sm:inline">QR Code</span>*/}
                            {/*</Button>*/}
                        </>
                    )}
                </div>
            }
        >
            <div className="p-4 md:p-6 space-y-6">
                {/* Event Selection Card */}
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-primary" />
                                    Select Event
                                </CardTitle>
                                <CardDescription>
                                    Choose an event to manage registrations
                                </CardDescription>
                            </div>
                            {selectedEvent && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={refreshData}
                                    className="gap-2"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Refresh
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Event <span className="text-destructive">*</span></Label>
                                <Select value={selectedEventId} onValueChange={handleEventChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an event..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {events.map((event) => (
                                            <SelectItem key={event.id} value={event.id}>
                                                <div className="flex items-center gap-2">
                                                    <span>{event.name}</span>
                                                    <span className="text-muted-foreground text-xs">
                            • {format(new Date(event.startDate), 'MMM d, yyyy')}
                          </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {instances.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Session/Instance</Label>
                                    <Select value={selectedInstance} onValueChange={handleInstanceChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select session..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {instances.map((instance) => (
                                                <SelectItem key={instance.id} value={instance.id}>
                                                    {format(new Date(instance.date), 'MMM d, yyyy')} - {instance.startTime}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        {/* Event Info & Stats */}
                        {isLoading ? (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="w-6 h-6 animate-spin" />
                            </div>
                        ) : selectedEvent && (
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg">{selectedEvent.name}</h3>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                          {format(new Date(selectedEvent.startDate), 'EEEE, MMMM d, yyyy')}
                      </span>
                                            {selectedEvent.locationName && (
                                                <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                                                    {selectedEvent.locationName}
                        </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="flex items-center gap-6">
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-primary">{stats.total}</p>
                                            <p className="text-xs text-muted-foreground">Registered</p>
                                        </div>
                                        <Separator orientation="vertical" className="h-10" />
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-green-600">{stats.checkedIn}</p>
                                            <p className="text-xs text-muted-foreground">Checked In</p>
                                        </div>
                                        <Separator orientation="vertical" className="h-10" />
                                        <div className="w-24">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-muted-foreground">Progress</span>
                                                <span className="font-medium">{checkInPercentage}%</span>
                                            </div>
                                            <Progress value={checkInPercentage} className="h-2" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Main Content - Only show when event is selected */}
                {selectedEvent && (
                    <>
                        {/* View Mode Tabs */}
                        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full">
                            <TabsList className="grid w-full grid-cols-3 max-w-lg">
                                <TabsTrigger value="attendees" className="gap-2">
                                    <Users className="h-4 w-4" />
                                    <span className="hidden sm:inline">Attendees</span>
                                    <Badge variant="secondary" className="ml-1 text-xs">
                                        {stats.total}
                                    </Badge>
                                </TabsTrigger>
                                <TabsTrigger value="quick-checkin" className="gap-2">
                                    <UserCheck className="h-4 w-4" />
                                    <span className="hidden sm:inline">Quick Check-in</span>
                                </TabsTrigger>
                                <TabsTrigger value="registration" className="gap-2">
                                    <ClipboardCheck className="h-4 w-4" />
                                    <span className="hidden sm:inline">New Registration</span>
                                </TabsTrigger>
                            </TabsList>

                            {/* Attendees Tab */}
                            <TabsContent value="attendees" className="mt-6">
                                <Card>
                                    <CardHeader>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <CardTitle className="flex items-center gap-2">
                                                <Users className="h-5 w-5" />
                                                Registered Attendees
                                            </CardTitle>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={loadAttendees}
                                                    disabled={isLoadingAttendees}
                                                >
                                                    <RefreshCw className={cn("h-4 w-4 mr-1", isLoadingAttendees && "animate-spin")} />
                                                    Refresh
                                                </Button>
                                                <Button variant="outline" size="sm" className="gap-2">
                                                    <Download className="h-4 w-4" />
                                                    Export
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {/* Search and Filter */}
                                        <div className="flex flex-col sm:flex-row gap-3 mb-4">
                                            <div className="relative flex-1">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Search attendees..."
                                                    value={attendeeSearch}
                                                    onChange={(e) => setAttendeeSearch(e.target.value)}
                                                    className="pl-9"
                                                />
                                            </div>
                                            <Select value={attendeeFilter} onValueChange={(v) => setAttendeeFilter(v as any)}>
                                                <SelectTrigger className="w-[180px]">
                                                    <Filter className="h-4 w-4 mr-2" />
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Attendees</SelectItem>
                                                    <SelectItem value="checked-in">Checked In ({stats.checkedIn})</SelectItem>
                                                    <SelectItem value="not-checked-in">Not Checked In ({stats.total - stats.checkedIn})</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Attendees List */}
                                        {isLoadingAttendees ? (
                                            <div className="space-y-3">
                                                {[...Array(5)].map((_, i) => (
                                                    <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                                                        <Skeleton className="h-10 w-10 rounded-full" />
                                                        <div className="flex-1 space-y-2">
                                                            <Skeleton className="h-4 w-32" />
                                                            <Skeleton className="h-3 w-48" />
                                                        </div>
                                                        <Skeleton className="h-9 w-24" />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <ScrollArea className="h-[500px] pr-4">
                                                <div className="space-y-2">
                                                    {filteredAttendees.map((attendee) => (
                                                        <div
                                                            key={attendee.registrationId}
                                                            className={cn(
                                                                "flex items-center justify-between p-3 rounded-lg border transition-all",
                                                                attendee.isCheckedIn
                                                                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                                                    : "hover:bg-muted/50"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-10 w-10">
                                                                    <AvatarImage src={attendee.avatar} />
                                                                    <AvatarFallback className="bg-primary/10 text-primary">
                                                                        {attendee.firstName[0]}{attendee.lastName[0]}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="font-medium">
                                                                            {attendee.firstName} {attendee.lastName}
                                                                        </p>
                                                                        <Badge
                                                                            variant="outline"
                                                                            className={cn("text-xs", getTypeBadgeColor(attendee.type))}
                                                                        >
                                                                            {getTypeLabel(attendee.type)}
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                        {attendee.email && (
                                                                            <span className="flex items-center gap-1">
                                        <Mail className="h-3 w-3" />
                                                                                {attendee.email}
                                      </span>
                                                                        )}
                                                                        {attendee.phone && (
                                                                            <span className="flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                                                                {attendee.phone}
                                      </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {attendee.isCheckedIn && (
                                                                    <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                                                        <CheckCircle2 className="h-3 w-3" />
                                                                        {attendee.checkInTime}
                                                                    </Badge>
                                                                )}
                                                                <Button
                                                                    variant={attendee.isCheckedIn ? "outline" : "default"}
                                                                    size="sm"
                                                                    onClick={() => handleCheckIn(attendee)}
                                                                    disabled={checkingInId === attendee.registrationId}
                                                                    className={cn(
                                                                        !attendee.isCheckedIn && "bg-green-600 hover:bg-green-700"
                                                                    )}
                                                                >
                                                                    {checkingInId === attendee.registrationId ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                    ) : attendee.isCheckedIn ? (
                                                                        <>
                                                                            <Undo2 className="h-4 w-4 mr-1" />
                                                                            Undo
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <UserCheck className="h-4 w-4 mr-1" />
                                                                            Check In
                                                                        </>
                                                                    )}
                                                                </Button>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon">
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem>
                                                                            <Eye className="h-4 w-4 mr-2" />
                                                                            View Details
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem>
                                                                            <Mail className="h-4 w-4 mr-2" />
                                                                            Send Reminder
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem className="text-destructive">
                                                                            <X className="h-4 w-4 mr-2" />
                                                                            Cancel Registration
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {filteredAttendees.length === 0 && (
                                                        <div className="text-center py-12 text-muted-foreground">
                                                            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                                            <p className="font-medium">No attendees found</p>
                                                            <p className="text-sm">
                                                                {attendeeSearch
                                                                    ? 'Try adjusting your search'
                                                                    : 'No one has registered for this event yet'}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </ScrollArea>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Quick Check-in Tab */}
                            <TabsContent value="quick-checkin" className="mt-6">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Members Search & List */}
                                    <div className="lg:col-span-2 space-y-4">
                                        <Card>
                                            <CardHeader>
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <CardTitle className="flex items-center gap-2">
                                                        <Search className="h-5 w-5" />
                                                        Find & Check In
                                                    </CardTitle>
                                                    <Button onClick={() => setShowGuestDialog(true)} size="sm" className="gap-2">
                                                        <UserPlus className="h-4 w-4" />
                                                        Add Guest / First Timer
                                                    </Button>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                {/* Search */}
                                                <div className="relative mb-4">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder="Search members by name, email or phone..."
                                                        value={quickSearchQuery}
                                                        onChange={(e) => setQuickSearchQuery(e.target.value)}
                                                        className="pl-9"
                                                    />
                                                </div>

                                                {/* Members List */}
                                                {isLoadingMembers ? (
                                                    <div className="space-y-3">
                                                        {[...Array(5)].map((_, i) => (
                                                            <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                                                                <Skeleton className="h-10 w-10 rounded-full" />
                                                                <div className="flex-1 space-y-2">
                                                                    <Skeleton className="h-4 w-32" />
                                                                    <Skeleton className="h-3 w-48" />
                                                                </div>
                                                                <Skeleton className="h-9 w-24" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <ScrollArea className="h-[400px] pr-4">
                                                        <div className="space-y-2">
                                                            {filteredMembers.map((member) => (
                                                                <div
                                                                    key={member.id}
                                                                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-all"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <Avatar className="h-10 w-10">
                                                                            <AvatarImage src={member.avatar} />
                                                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                                                {member.firstName[0]}{member.lastName[0]}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <div>
                                                                            <p className="font-medium">
                                                                                {member.firstName} {member.lastName}
                                                                            </p>
                                                                            <p className="text-sm text-muted-foreground">
                                                                                {member.email || member.phone || 'No contact info'}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => handleQuickMemberCheckIn(member)}
                                                                        disabled={checkingInId === member.id}
                                                                        className="bg-green-600 hover:bg-green-700"
                                                                    >
                                                                        {checkingInId === member.id ? (
                                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                                        ) : (
                                                                            <>
                                                                                <UserCheck className="h-4 w-4 mr-1" />
                                                                                Check In
                                                                            </>
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                            ))}

                                                            {filteredMembers.length === 0 && quickSearchQuery && (
                                                                <div className="text-center py-8">
                                                                    <p className="text-muted-foreground mb-4">No members found</p>
                                                                    <Button onClick={() => setShowGuestDialog(true)} variant="outline">
                                                                        <UserPlus className="h-4 w-4 mr-2" />
                                                                        Add as Guest/First Timer
                                                                    </Button>
                                                                </div>
                                                            )}

                                                            {filteredMembers.length === 0 && !quickSearchQuery && (
                                                                <div className="text-center py-8 text-muted-foreground">
                                                                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                                    <p>Search for members to check them in</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </ScrollArea>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Sidebar Stats & Recent */}
                                    <div className="space-y-6">
                                        {/* Quick Stats */}
                                        <Card>
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-sm font-medium">Check-in Progress</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span>Checked In</span>
                                                        <span className="font-medium">{stats.checkedIn} / {stats.total}</span>
                                                    </div>
                                                    <Progress value={checkInPercentage} className="h-3" />
                                                </div>
                                                <Separator />
                                                <div className="grid grid-cols-2 gap-4 text-center">
                                                    <div>
                                                        <p className="text-2xl font-bold text-primary">{stats.members}</p>
                                                        <p className="text-xs text-muted-foreground">Members</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-2xl font-bold text-orange-500">{stats.guests}</p>
                                                        <p className="text-xs text-muted-foreground">Guests</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Recent Check-ins */}
                                        <Card>
                                            <CardHeader className="pb-3">
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                                        <Clock className="h-4 w-4" />
                                                        Recent Check-ins
                                                    </CardTitle>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={loadRecentCheckIns}
                                                        disabled={isLoadingRecentCheckIns}
                                                    >
                                                        <RefreshCw className={cn(
                                                            "h-3 w-3",
                                                            isLoadingRecentCheckIns && "animate-spin"
                                                        )} />
                                                    </Button>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                {isLoadingRecentCheckIns ? (
                                                    <div className="space-y-3">
                                                        {[...Array(5)].map((_, i) => (
                                                            <div key={i} className="flex items-center gap-2">
                                                                <Skeleton className="h-4 w-4 rounded-full" />
                                                                <Skeleton className="h-4 flex-1" />
                                                                <Skeleton className="h-4 w-12" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <ScrollArea className="h-[280px]">
                                                        <div className="space-y-2">
                                                            {recentCheckIns.map((checkIn) => (
                                                                <div
                                                                    key={checkIn.id}
                                                                    className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-muted/50 group"
                                                                >
                                                                    <div className="flex items-center gap-2 min-w-0">
                                                                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                                                                        {checkIn.avatar ? (
                                                                            <Avatar className="h-6 w-6">
                                                                                <AvatarImage src={checkIn.avatar} />
                                                                                <AvatarFallback className="text-xs">
                                                                                    {checkIn.name.split(' ').map(n => n[0]).join('')}
                                                                                </AvatarFallback>
                                                                            </Avatar>
                                                                        ) : null}
                                                                        <span className="truncate font-medium">{checkIn.name}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                                        {checkIn.type !== 'member' && (
                                                                            <Badge
                                                                                variant="outline"
                                                                                className={cn("text-[10px] px-1", getTypeBadgeColor(checkIn.type))}
                                                                            >
                                                                                {checkIn.type === 'first_timer' ? 'New' : 'Guest'}
                                                                            </Badge>
                                                                        )}
                                                                        <span className="text-muted-foreground text-xs">{checkIn.time}</span>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                            onClick={() => handleUndoRecentCheckIn(checkIn)}
                                                                        >
                                                                            <Undo2 className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ))}

                                                            {recentCheckIns.length === 0 && (
                                                                <div className="text-center py-8 text-muted-foreground">
                                                                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                                                    <p className="text-sm">No recent check-ins</p>
                                                                    <p className="text-xs">Check-ins will appear here</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </ScrollArea>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Full Registration Tab */}
                            <TabsContent value="registration" className="mt-6">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Registrant Selection */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Users className="h-5 w-5 text-primary" />
                                                Registrant Information
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <RegistrantSearch
                                                onSelect={handleRegistrantSelect}
                                                selectedRegistrant={selectedRegistrant}
                                                registrantType={registrantType}
                                                onTypeChange={handleTypeChange}
                                            />

                                            <NewRegistrantForm
                                                registrantType={registrantType}
                                                formData={formData}
                                                onChange={handleFormChange}
                                                errors={errors}
                                            />

                                            <div className="space-y-2">
                                                <Label htmlFor="notes">Notes (Optional)</Label>
                                                <Textarea
                                                    id="notes"
                                                    value={notes}
                                                    onChange={(e) => setNotes(e.target.value)}
                                                    rows={2}
                                                    placeholder="Any additional notes..."
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Notification Options */}
                                    {(registrantType !== 'existing_member' || selectedRegistrant) && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Notifications</CardTitle>
                                                <CardDescription>
                                                    Send registration confirmation to the registrant
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <NotificationOptions
                                                    sendNotification={sendNotification}
                                                    onSendNotificationChange={setSendNotification}
                                                    channels={notificationChannels}
                                                    onChannelsChange={setNotificationChannels}
                                                    hasEmail={!!(formData.email || selectedRegistrant?.email)}
                                                    hasPhone={!!(formData.phone || selectedRegistrant?.phone)}
                                                />
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Submit Button */}
                                    <div className="flex justify-end gap-4">
                                        <Button type="button" variant="outline" onClick={handleReset}>
                                            Reset
                                        </Button>
                                        <Button type="submit" disabled={isSubmitting} className="gap-2">
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Registering...
                                                </>
                                            ) : (
                                                <>
                                                    <Check className="w-4 h-4" />
                                                    Register
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </TabsContent>
                        </Tabs>
                    </>
                )}

                {/* Empty State - No Event Selected */}
                {!selectedEvent && !isLoading && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <Calendar className="h-16 w-16 text-muted-foreground/30 mb-4" />
                            <p className="text-lg font-medium text-muted-foreground mb-2">
                                No Event Selected
                            </p>
                            <p className="text-sm text-muted-foreground text-center max-w-md">
                                Please select an event above to manage registrations and check-ins
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Guest Registration Dialog */}
                <Dialog open={showGuestDialog} onOpenChange={setShowGuestDialog}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Add Guest / First Timer</DialogTitle>
                            <DialogDescription>
                                Register a walk-in attendee for this event
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="isFirstTimer"
                                        checked={guestForm.isFirstTimer}
                                        onCheckedChange={(checked) => setGuestForm({ ...guestForm, isFirstTimer: checked })}
                                    />
                                    <Label htmlFor="isFirstTimer" className="cursor-pointer">
                                        This is a first-time visitor
                                    </Label>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>First Name <span className="text-destructive">*</span></Label>
                                    <Input
                                        value={guestForm.firstName}
                                        onChange={(e) => setGuestForm({ ...guestForm, firstName: e.target.value })}
                                        placeholder="John"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Last Name <span className="text-destructive">*</span></Label>
                                    <Input
                                        value={guestForm.lastName}
                                        onChange={(e) => setGuestForm({ ...guestForm, lastName: e.target.value })}
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={guestForm.email}
                                    onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
                                    placeholder="john@example.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input
                                    value={guestForm.phone}
                                    onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                                    placeholder="+1234567890"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Gender</Label>
                                <Select
                                    value={guestForm.gender}
                                    onValueChange={(v) => setGuestForm({ ...guestForm, gender: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowGuestDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleGuestCheckIn} disabled={isSubmitting} className="gap-2">
                                {isSubmitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <UserCheck className="h-4 w-4" />
                                )}
                                Check In
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* QR Code Dialog */}
                <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Event QR Code</DialogTitle>
                            <DialogDescription>
                                Share this QR code for attendees to self check-in
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col items-center py-6">
                            <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center mb-4">
                                {/* Replace with actual QR code component */}
                                <QrCode className="h-32 w-32 text-muted-foreground" />
                            </div>
                            <p className="text-sm text-muted-foreground text-center mb-4">
                                {selectedEvent?.name}
                            </p>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={copyQrLink} className="gap-2">
                                    <Copy className="h-4 w-4" />
                                    Copy Link
                                </Button>
                                <Button className="gap-2">
                                    <Download className="h-4 w-4" />
                                    Download
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}