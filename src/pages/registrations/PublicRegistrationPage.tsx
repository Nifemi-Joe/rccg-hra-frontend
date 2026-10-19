// src/pages/registrations/PublicRegistrationPage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
    Calendar,
    Users,
    Check,
    Loader2,
    MapPin,
    Clock,
    UserCheck,
    UserPlus,
    Search,
    CheckCircle2,
    ChevronRight,
    Zap,
    FileText,
    User,
    ArrowRight,
    Sparkles,
    Shield,
    Phone,
    Mail,
} from 'lucide-react';
import { toast } from 'sonner';

import { PublicLayout } from '@/components/PublicLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
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
    Alert,
    AlertDescription,
    AlertTitle,
} from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { cn } from '@/lib/utils';

// Types
interface EventDetails {
    id: string;
    name: string;
    description?: string;
    startDate: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    locationName?: string;
    locationType: 'physical' | 'online' | 'hybrid';
    churchName: string;
    churchLogo?: string;
    bannerImage?: string;
    allowGuestCheckin: boolean;
    isRegistrationRequired: boolean;
    currentRegistrations: number;
    maxRegistrations?: number;
}

interface SearchResult {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    avatar?: string;
    type: 'member' | 'first_timer';
    isAlreadyRegistered?: boolean;
    registrationId?: string;
    isCheckedIn?: boolean;
}

interface RegistrationResult {
    success: boolean;
    confirmationCode: string;
    registrantName: string;
    eventName: string;
    eventDate: string;
    checkInTime?: string;
}

type RegistrationMode = 'search' | 'quick' | 'full';
type GuestType = 'first_timer' | 'guest';

export default function PublicRegistrationPage() {
    const { eventId } = useParams<{ eventId: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Event state
    const [event, setEvent] = useState<EventDetails | null>(null);
    const [isLoadingEvent, setIsLoadingEvent] = useState(true);
    const [eventError, setEventError] = useState<string | null>(null);

    // Registration mode
    const [mode, setMode] = useState<RegistrationMode>('search');
    const [step, setStep] = useState<'select' | 'search' | 'form' | 'confirm' | 'success'>('select');

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState<SearchResult | null>(null);

    // Form state
    const [guestType, setGuestType] = useState<GuestType>('first_timer');
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        gender: '',
        prayerRequest: '',
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Submission state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<RegistrationResult | null>(null);

    // Load event details
    useEffect(() => {
        if (eventId) {
            loadEventDetails(eventId);
        }
    }, [eventId]);

    const loadEventDetails = async (id: string) => {
        setIsLoadingEvent(true);
        setEventError(null);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 800));

            // Mock event data
            setEvent({
                id,
                name: 'Sunday Service',
                description: 'Join us for our weekly Sunday worship service',
                startDate: new Date().toISOString(),
                startTime: '09:00 AM',
                endTime: '11:00 AM',
                locationName: 'Main Sanctuary',
                locationType: 'physical',
                churchName: 'Grace Community Church',
                allowGuestCheckin: true,
                isRegistrationRequired: false,
                currentRegistrations: 156,
                maxRegistrations: 500,
            });
        } catch (error) {
            console.error('Error loading event:', error);
            setEventError('Unable to load event details. Please try again.');
        } finally {
            setIsLoadingEvent(false);
        }
    };

    // Search for existing registrations
    const handleSearch = async () => {
        if (!searchQuery.trim() || searchQuery.length < 2) {
            toast.error('Please enter at least 2 characters to search');
            return;
        }

        setIsSearching(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));

            // Mock search results
            const mockResults: SearchResult[] = [
                {
                    id: '1',
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com',
                    phone: '+1234567890',
                    type: 'member',
                    isAlreadyRegistered: false,
                },
                {
                    id: '2',
                    firstName: 'Jane',
                    lastName: 'Smith',
                    email: 'jane@example.com',
                    type: 'member',
                    isAlreadyRegistered: true,
                    registrationId: 'reg-123',
                    isCheckedIn: false,
                },
                {
                    id: '3',
                    firstName: 'Michael',
                    lastName: 'Johnson',
                    email: 'michael@example.com',
                    type: 'first_timer',
                    isAlreadyRegistered: true,
                    registrationId: 'reg-456',
                    isCheckedIn: true,
                },
            ].filter(r =>
                `${r.firstName} ${r.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.phone?.includes(searchQuery)
            );

            setSearchResults(mockResults);

            if (mockResults.length === 0) {
                toast.info('No results found. You can register as a new attendee.');
            }
        } catch (error) {
            toast.error('Search failed. Please try again.');
        } finally {
            setIsSearching(false);
        }
    };

    // Handle person selection
    const handleSelectPerson = (person: SearchResult) => {
        setSelectedPerson(person);
        if (person.isAlreadyRegistered) {
            // Already registered, go to confirm/check-in
            setStep('confirm');
        } else {
            // Quick check-in - go directly to confirmation
            setStep('confirm');
        }
    };

    // Handle quick check-in
    const handleQuickCheckIn = async () => {
        if (!selectedPerson) return;

        setIsSubmitting(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 800));

            setResult({
                success: true,
                confirmationCode: `CHK-${Date.now().toString(36).toUpperCase()}`,
                registrantName: `${selectedPerson.firstName} ${selectedPerson.lastName}`,
                eventName: event?.name || '',
                eventDate: event?.startDate || '',
                checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            });

            setStep('success');
            toast.success('Check-in successful!');
        } catch (error) {
            toast.error('Check-in failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle full registration form submission
    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form
        const errors: Record<string, string> = {};
        if (!formData.firstName.trim()) errors.firstName = 'First name is required';
        if (!formData.lastName.trim()) errors.lastName = 'Last name is required';

        if (guestType === 'first_timer') {
            if (!formData.email.trim() && !formData.phone.trim()) {
                errors.email = 'Email or phone is required';
                errors.phone = 'Email or phone is required';
            }
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setIsSubmitting(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 800));

            setResult({
                success: true,
                confirmationCode: `REG-${Date.now().toString(36).toUpperCase()}`,
                registrantName: `${formData.firstName} ${formData.lastName}`,
                eventName: event?.name || '',
                eventDate: event?.startDate || '',
                checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            });

            setStep('success');
            toast.success('Registration successful!');
        } catch (error) {
            toast.error('Registration failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle form field change
    const handleFieldChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    // Reset form
    const handleReset = () => {
        setStep('select');
        setMode('search');
        setSearchQuery('');
        setSearchResults([]);
        setSelectedPerson(null);
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            gender: '',
            prayerRequest: '',
        });
        setFormErrors({});
        setResult(null);
    };

    // Loading state
    if (isLoadingEvent) {
        return (
            <PublicLayout>
                <div className="container mx-auto px-4 py-12">
                    <div className="max-w-2xl mx-auto space-y-6">
                        <Skeleton className="h-48 w-full rounded-xl" />
                        <Skeleton className="h-64 w-full rounded-xl" />
                    </div>
                </div>
            </PublicLayout>
        );
    }

    // Error state
    if (eventError || !event) {
        return (
            <PublicLayout>
                <div className="container mx-auto px-4 py-12">
                    <Card className="max-w-md mx-auto">
                        <CardContent className="pt-6 text-center">
                            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Calendar className="h-8 w-8 text-destructive" />
                            </div>
                            <h2 className="text-xl font-semibold mb-2">Event Not Found</h2>
                            <p className="text-muted-foreground mb-6">
                                {eventError || 'The event you\'re looking for doesn\'t exist or has ended.'}
                            </p>
                            <Button onClick={() => navigate('/')}>Go Home</Button>
                        </CardContent>
                    </Card>
                </div>
            </PublicLayout>
        );
    }

    // Success state
    if (step === 'success' && result) {
        return (
            <PublicLayout eventName={event.name} churchName={event.churchName}>
                <div className="container mx-auto px-4 py-8 md:py-12">
                    <div className="max-w-lg mx-auto">
                        <Card className="border-0 shadow-lg">
                            <CardContent className="pt-8 pb-8 text-center">
                                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-300">
                                    <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                                </div>

                                <h2 className="text-2xl font-bold mb-2">You're Checked In!</h2>
                                <p className="text-muted-foreground mb-6">
                                    Welcome, {result.registrantName}
                                </p>

                                <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-6 mb-6">
                                    <p className="text-sm text-muted-foreground mb-2">Confirmation Code</p>
                                    <p className="text-3xl font-mono font-bold text-primary tracking-wider">
                                        {result.confirmationCode}
                                    </p>
                                    {result.checkInTime && (
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Checked in at {result.checkInTime}
                                        </p>
                                    )}
                                </div>

                                <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
                                    <div className="flex items-start gap-3">
                                        <Calendar className="h-5 w-5 text-primary mt-0.5" />
                                        <div>
                                            <p className="font-medium">{result.eventName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(new Date(result.eventDate), 'EEEE, MMMM d, yyyy')}
                                            </p>
                                            {event.startTime && (
                                                <p className="text-sm text-muted-foreground">
                                                    {event.startTime} - {event.endTime}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {event.locationName && (
                                        <div className="flex items-start gap-3 mt-3">
                                            <MapPin className="h-5 w-5 text-primary mt-0.5" />
                                            <p className="text-sm">{event.locationName}</p>
                                        </div>
                                    )}
                                </div>

                                <Button onClick={handleReset} className="w-full" size="lg">
                                    Register Another Person
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout eventName={event.name} churchName={event.churchName}>
            <div className="container mx-auto px-4 py-6 md:py-10">
                <div className="max-w-2xl mx-auto space-y-6">
                    {/* Event Header */}
                    <Card className="border-0 shadow-lg overflow-hidden">
                        {event.bannerImage && (
                            <div className="h-32 md:h-48 bg-gradient-to-r from-primary/20 to-primary/5 relative">
                                <img
                                    src={event.bannerImage}
                                    alt={event.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                        <CardContent className={cn("p-6", !event.bannerImage && "pt-8")}>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <Badge variant="secondary" className="mb-2">
                                        {format(new Date(event.startDate), 'EEEE, MMMM d, yyyy')}
                                    </Badge>
                                    <h1 className="text-2xl md:text-3xl font-bold">{event.name}</h1>
                                    {event.description && (
                                        <p className="text-muted-foreground mt-1">{event.description}</p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
                                        {event.startTime && (
                                            <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                                                {event.startTime} - {event.endTime}
                      </span>
                                        )}
                                        {event.locationName && (
                                            <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                                                {event.locationName}
                      </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col items-center md:items-end">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-5 w-5 text-primary" />
                                        <span className="text-2xl font-bold">{event.currentRegistrations}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Registered</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Registration Options - Initial Selection */}
                    {step === 'select' && (
                        <div id="register" className="space-y-4">
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-semibold mb-2">Register Your Attendance</h2>
                                <p className="text-muted-foreground">
                                    Choose how you'd like to check in
                                </p>
                            </div>

                            <div className="grid gap-4">
                                {/* Quick Check-in Option */}
                                <Card
                                    className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
                                    onClick={() => {
                                        setMode('search');
                                        setStep('search');
                                    }}
                                >
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                                <Zap className="h-6 w-6 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-semibold text-lg">Quick Check-in</h3>
                                                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                                </div>
                                                <p className="text-muted-foreground text-sm mt-1">
                                                    Already a member or registered before? Find yourself quickly and check in.
                                                </p>
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    <Badge variant="outline" className="text-xs">
                                                        <Search className="h-3 w-3 mr-1" />
                                                        Search by name
                                                    </Badge>
                                                    <Badge variant="outline" className="text-xs">
                                                        <Mail className="h-3 w-3 mr-1" />
                                                        Or email
                                                    </Badge>
                                                    <Badge variant="outline" className="text-xs">
                                                        <Phone className="h-3 w-3 mr-1" />
                                                        Or phone
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Full Registration Option */}
                                <Card
                                    className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
                                    onClick={() => {
                                        setMode('full');
                                        setStep('form');
                                    }}
                                >
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0 w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                                                <UserPlus className="h-6 w-6 text-green-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold text-lg">New Here? Register</h3>
                                                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs">
                                                            First Timer
                                                        </Badge>
                                                    </div>
                                                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                                </div>
                                                <p className="text-muted-foreground text-sm mt-1">
                                                    First time visiting? We'd love to know you better. Takes about 1 minute.
                                                </p>
                                                <div className="mt-3 text-sm">
                                                    <p className="text-muted-foreground">You'll be asked for:</p>
                                                    <ul className="text-muted-foreground mt-1 space-y-0.5">
                                                        <li className="flex items-center gap-2">
                                                            <Check className="h-3 w-3 text-green-500" />
                                                            Name (required)
                                                        </li>
                                                        <li className="flex items-center gap-2">
                                                            <Check className="h-3 w-3 text-green-500" />
                                                            Email or phone (for follow-up)
                                                        </li>
                                                        <li className="flex items-center gap-2">
                                                            <Check className="h-3 w-3 text-green-500" />
                                                            Optional: Prayer requests
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Guest Option (if allowed) */}
                                {event.allowGuestCheckin && (
                                    <Card
                                        className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
                                        onClick={() => {
                                            setMode('quick');
                                            setGuestType('guest');
                                            setStep('form');
                                        }}
                                    >
                                        <CardContent className="p-6">
                                            <div className="flex items-start gap-4">
                                                <div className="flex-shrink-0 w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                                                    <User className="h-6 w-6 text-blue-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="font-semibold text-lg">Check In as Guest</h3>
                                                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                                    </div>
                                                    <p className="text-muted-foreground text-sm mt-1">
                                                        Quick check-in with just your name. No contact info required.
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                            {/* Security Note */}
                            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4">
                                <Shield className="h-4 w-4" />
                                <span>Your information is secure and private</span>
                            </div>
                        </div>
                    )}

                    {/* Search Step */}
                    {step === 'search' && (
                        <Card className="border-0 shadow-lg">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setStep('select')}
                                    >
                                        <ChevronRight className="h-5 w-5 rotate-180" />
                                    </Button>
                                    <div>
                                        <CardTitle>Find Yourself</CardTitle>
                                        <CardDescription>
                                            Search by name, email, or phone number
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Enter your name, email or phone..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                            className="pl-10"
                                            autoFocus
                                        />
                                    </div>
                                    <Button onClick={handleSearch} disabled={isSearching}>
                                        {isSearching ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            'Search'
                                        )}
                                    </Button>
                                </div>

                                {/* Search Results */}
                                {searchResults.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">
                                            {searchResults.length} result(s) found
                                        </p>
                                        <ScrollArea className="max-h-[300px]">
                                            <div className="space-y-2">
                                                {searchResults.map((person) => (
                                                    <div
                                                        key={person.id}
                                                        onClick={() => handleSelectPerson(person)}
                                                        className={cn(
                                                            "flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all hover:border-primary/50 hover:bg-muted/50",
                                                            person.isCheckedIn && "bg-green-50 dark:bg-green-900/20 border-green-200"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-10 w-10">
                                                                <AvatarImage src={person.avatar} />
                                                                <AvatarFallback className="bg-primary/10 text-primary">
                                                                    {person.firstName[0]}{person.lastName[0]}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="font-medium">
                                                                    {person.firstName} {person.lastName}
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {person.email || person.phone}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {person.isCheckedIn ? (
                                                                <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                                                    Checked In
                                                                </Badge>
                                                            ) : person.isAlreadyRegistered ? (
                                                                <Badge variant="secondary">Registered</Badge>
                                                            ) : (
                                                                <Badge variant="outline">
                                                                    {person.type === 'member' ? 'Member' : 'First Timer'}
                                                                </Badge>
                                                            )}
                                                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                )}

                                {/* Not Found Option */}
                                {searchResults.length === 0 && searchQuery && !isSearching && (
                                    <Alert>
                                        <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            <span>Can't find yourself? Register as a new attendee.</span>
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    setMode('full');
                                                    setStep('form');
                                                }}
                                            >
                                                Register New
                                            </Button>
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                            <CardFooter className="bg-muted/30 flex justify-center py-4">
                                <Button
                                    variant="link"
                                    onClick={() => {
                                        setMode('full');
                                        setStep('form');
                                    }}
                                >
                                    Not in the list? Register as new attendee
                                    <ArrowRight className="h-4 w-4 ml-1" />
                                </Button>
                            </CardFooter>
                        </Card>
                    )}

                    {/* Confirm Check-in Step */}
                    {step === 'confirm' && selectedPerson && (
                        <Card className="border-0 shadow-lg">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setStep('search')}
                                    >
                                        <ChevronRight className="h-5 w-5 rotate-180" />
                                    </Button>
                                    <div>
                                        <CardTitle>Confirm Check-in</CardTitle>
                                        <CardDescription>
                                            Is this you?
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex flex-col items-center text-center py-4">
                                    <Avatar className="h-20 w-20 mb-4">
                                        <AvatarImage src={selectedPerson.avatar} />
                                        <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                                            {selectedPerson.firstName[0]}{selectedPerson.lastName[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <h3 className="text-xl font-semibold">
                                        {selectedPerson.firstName} {selectedPerson.lastName}
                                    </h3>
                                    {selectedPerson.email && (
                                        <p className="text-muted-foreground">{selectedPerson.email}</p>
                                    )}
                                    <Badge variant="outline" className="mt-2">
                                        {selectedPerson.type === 'member' ? 'Member' : 'First Timer'}
                                    </Badge>
                                </div>

                                {selectedPerson.isCheckedIn ? (
                                    <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <AlertTitle className="text-green-700">Already Checked In</AlertTitle>
                                        <AlertDescription className="text-green-600">
                                            You've already checked in for this event. No further action needed!
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <Button
                                        onClick={handleQuickCheckIn}
                                        disabled={isSubmitting}
                                        size="lg"
                                        className="w-full gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                Checking In...
                                            </>
                                        ) : (
                                            <>
                                                <UserCheck className="h-5 w-5" />
                                                Confirm & Check In
                                            </>
                                        )}
                                    </Button>
                                )}

                                <p className="text-center text-sm text-muted-foreground">
                                    Not you?{' '}
                                    <Button
                                        variant="link"
                                        className="p-0 h-auto"
                                        onClick={() => {
                                            setSelectedPerson(null);
                                            setStep('search');
                                        }}
                                    >
                                        Search again
                                    </Button>
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Full Registration Form */}
                    {step === 'form' && (
                        <Card className="border-0 shadow-lg">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setStep('select')}
                                    >
                                        <ChevronRight className="h-5 w-5 rotate-180" />
                                    </Button>
                                    <div>
                                        <CardTitle>
                                            {mode === 'full' ? 'New Attendee Registration' : 'Guest Check-in'}
                                        </CardTitle>
                                        <CardDescription>
                                            {mode === 'full'
                                                ? 'Welcome! Please fill in your details'
                                                : 'Quick check-in with just your name'}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <form onSubmit={handleFormSubmit}>
                                <CardContent className="space-y-6">
                                    {mode === 'full' && (
                                        <div className="space-y-3">
                                            <Label>I am a...</Label>
                                            <RadioGroup
                                                value={guestType}
                                                onValueChange={(v) => setGuestType(v as GuestType)}
                                                className="grid grid-cols-2 gap-3"
                                            >
                                                <Label
                                                    htmlFor="first_timer"
                                                    className={cn(
                                                        "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all",
                                                        guestType === 'first_timer'
                                                            ? "border-primary bg-primary/5"
                                                            : "hover:border-muted-foreground/50"
                                                    )}
                                                >
                                                    <RadioGroupItem value="first_timer" id="first_timer" />
                                                    <div>
                                                        <p className="font-medium">First Timer</p>
                                                        <p className="text-xs text-muted-foreground">New visitor</p>
                                                    </div>
                                                </Label>
                                                <Label
                                                    htmlFor="guest"
                                                    className={cn(
                                                        "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all",
                                                        guestType === 'guest'
                                                            ? "border-primary bg-primary/5"
                                                            : "hover:border-muted-foreground/50"
                                                    )}
                                                >
                                                    <RadioGroupItem value="guest" id="guest" />
                                                    <div>
                                                        <p className="font-medium">Guest</p>
                                                        <p className="text-xs text-muted-foreground">Visiting friend</p>
                                                    </div>
                                                </Label>
                                            </RadioGroup>
                                        </div>
                                    )}

                                    <Separator />

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">
                                                First Name <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="firstName"
                                                value={formData.firstName}
                                                onChange={(e) => handleFieldChange('firstName', e.target.value)}
                                                placeholder="John"
                                                className={formErrors.firstName ? 'border-destructive' : ''}
                                            />
                                            {formErrors.firstName && (
                                                <p className="text-xs text-destructive">{formErrors.firstName}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">
                                                Last Name <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="lastName"
                                                value={formData.lastName}
                                                onChange={(e) => handleFieldChange('lastName', e.target.value)}
                                                placeholder="Doe"
                                                className={formErrors.lastName ? 'border-destructive' : ''}
                                            />
                                            {formErrors.lastName && (
                                                <p className="text-xs text-destructive">{formErrors.lastName}</p>
                                            )}
                                        </div>
                                    </div>

                                    {(mode === 'full' || guestType === 'first_timer') && (
                                        <>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">
                                                    Email {guestType === 'first_timer' && <span className="text-muted-foreground">(or phone below)</span>}
                                                </Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => handleFieldChange('email', e.target.value)}
                                                    placeholder="john@example.com"
                                                    className={formErrors.email ? 'border-destructive' : ''}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="phone">Phone</Label>
                                                <Input
                                                    id="phone"
                                                    value={formData.phone}
                                                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                                                    placeholder="+1 (555) 000-0000"
                                                    className={formErrors.phone ? 'border-destructive' : ''}
                                                />
                                                {(formErrors.email || formErrors.phone) && (
                                                    <p className="text-xs text-destructive">
                                                        Email or phone is required for first-time visitors
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="gender">Gender (Optional)</Label>
                                                <Select
                                                    value={formData.gender}
                                                    onValueChange={(v) => handleFieldChange('gender', v)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select gender" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="male">Male</SelectItem>
                                                        <SelectItem value="female">Female</SelectItem>
                                                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="prayerRequest">Prayer Request (Optional)</Label>
                                                <Textarea
                                                    id="prayerRequest"
                                                    value={formData.prayerRequest}
                                                    onChange={(e) => handleFieldChange('prayerRequest', e.target.value)}
                                                    placeholder="Share any prayer requests..."
                                                    rows={3}
                                                />
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                                <CardFooter className="flex-col gap-4">
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        size="lg"
                                        className="w-full gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                Registering...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="h-5 w-5" />
                                                Complete Registration
                                            </>
                                        )}
                                    </Button>

                                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                        <Shield className="h-4 w-4" />
                                        <span>Your information is secure and private</span>
                                    </div>
                                </CardFooter>
                            </form>
                        </Card>
                    )}
                </div>
            </div>
        </PublicLayout>
    );
}