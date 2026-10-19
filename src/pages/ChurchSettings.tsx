// src/pages/Settings.tsx

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/hooks/useCurrency';
import { churchApi } from '@/lib/api';
import { CURRENCIES, Currency, formatCurrency as formatCurrencyUtil, getCurrencyByCode } from '@/types/currency';
import {
    MapPin,
    Navigation,
    Bell,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    DollarSign,
    Building2,
    Globe,
    Save,
    RefreshCw,
    Coins,
    MapPinned,
    Phone,
    Mail,
    Link as LinkIcon,
} from 'lucide-react';

interface ChurchLocation {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}

interface NotificationSettings {
    enabled: boolean;
    radius: number;
    welcomeMessage: string;
}

export default function Settings() {
    const { toast } = useToast();
    const { church, refreshChurch } = useAuth();
    const { currency: currentCurrency, formatCurrency } = useCurrency();

    // Tab state
    const [activeTab, setActiveTab] = useState('general');

    // Loading states
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingCurrency, setIsSavingCurrency] = useState(false);
    const [isSavingAddress, setIsSavingAddress] = useState(false);
    const [isSavingNotifications, setIsSavingNotifications] = useState(false);

    // Currency state
    const [selectedCurrency, setSelectedCurrency] = useState<string>(church?.currency || 'NGN');

    // Location state
    const [location, setLocation] = useState<ChurchLocation>({
        latitude: church?.latitude || 0,
        longitude: church?.longitude || 0,
        address: church?.address || '',
        city: church?.city || '',
        state: church?.state || '',
        postalCode: church?.postal_code || '',
        country: church?.country || '',
    });

    // Church info state
    const [churchInfo, setChurchInfo] = useState({
        name: church?.name || '',
        phone: church?.phone || '',
        email: church?.email || '',
        website: church?.website || '',
    });

    // Notification settings
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
        enabled: church?.settings?.proximityNotificationsEnabled || false,
        radius: church?.settings?.notificationRadius || 500,
        welcomeMessage: church?.settings?.welcomeMessage || `Welcome to ${church?.name || 'our church'}! We're glad you're here today.`,
    });

    // Update local state when church data changes
    useEffect(() => {
        if (church) {
            setSelectedCurrency(church.currency || 'NGN');
            setLocation({
                latitude: church.latitude || 0,
                longitude: church.longitude || 0,
                address: church.address || '',
                city: church.city || '',
                state: church.state || '',
                postalCode: church.postal_code || '',
                country: church.country || '',
            });
            setChurchInfo({
                name: church.name || '',
                phone: church.phone || '',
                email: church.email || '',
                website: church.website || '',
            });
            setNotificationSettings({
                enabled: church.settings?.proximityNotificationsEnabled || false,
                radius: church.settings?.notificationRadius || 500,
                welcomeMessage: church.settings?.welcomeMessage || `Welcome to ${church.name || 'our church'}! We're glad you're here today.`,
            });
        }
    }, [church]);

    // Get current location
    const getCurrentLocation = () => {
        setIsLoadingLocation(true);

        if (!navigator.geolocation) {
            toast({
                variant: 'destructive',
                title: 'Geolocation not supported',
                description: 'Your browser does not support location services.',
            });
            setIsLoadingLocation(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                // Try to reverse geocode using a free service
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    );
                    const data = await response.json();

                    setLocation({
                        latitude,
                        longitude,
                        address: data.address?.road || data.display_name?.split(',')[0] || '',
                        city: data.address?.city || data.address?.town || data.address?.village || '',
                        state: data.address?.state || '',
                        postalCode: data.address?.postcode || '',
                        country: data.address?.country || '',
                    });

                    toast({
                        title: 'Location captured',
                        description: 'Church location has been set to your current position.',
                    });
                } catch (error) {
                    // Fallback if geocoding fails
                    setLocation((prev) => ({
                        ...prev,
                        latitude,
                        longitude,
                    }));

                    toast({
                        title: 'Location captured',
                        description: 'Coordinates captured. Please fill in the address details manually.',
                    });
                }

                setIsLoadingLocation(false);
            },
            (error) => {
                toast({
                    variant: 'destructive',
                    title: 'Location error',
                    description: error.message || 'Failed to get your location.',
                });
                setIsLoadingLocation(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

    // Save currency
    const saveCurrency = async () => {
        if (selectedCurrency === church?.currency) {
            toast({
                title: 'No changes',
                description: 'Currency is already set to this value.',
            });
            return;
        }

        setIsSavingCurrency(true);
        try {
            await churchApi.update({ currency: selectedCurrency });
            await refreshChurch?.();

            toast({
                title: 'Currency updated',
                description: `Church currency has been changed to ${getCurrencyByCode(selectedCurrency).name}.`,
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to update currency',
                description: error.message || 'An error occurred while updating the currency.',
            });
        } finally {
            setIsSavingCurrency(false);
        }
    };

    // Save address
    const saveAddress = async () => {
        setIsSavingAddress(true);
        try {
            await churchApi.update({
                address: location.address,
                city: location.city,
                state: location.state,
                postalCode: location.postalCode,
                country: location.country,
                latitude: location.latitude || undefined,
                longitude: location.longitude || undefined,
            });
            await refreshChurch?.();

            toast({
                title: 'Address updated',
                description: 'Church address has been saved successfully.',
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to update address',
                description: error.message || 'An error occurred while updating the address.',
            });
        } finally {
            setIsSavingAddress(false);
        }
    };

    // Save church info
    const saveChurchInfo = async () => {
        setIsSaving(true);
        try {
            await churchApi.update({
                name: churchInfo.name,
                phone: churchInfo.phone,
                email: churchInfo.email,
                website: churchInfo.website,
            });
            await refreshChurch?.();

            toast({
                title: 'Settings saved',
                description: 'Church information has been updated successfully.',
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to save settings',
                description: error.message || 'An error occurred while saving settings.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Save notification settings
    const saveNotificationSettings = async () => {
        setIsSavingNotifications(true);
        try {
            await churchApi.update({
                settings: {
                    ...church?.settings,
                    proximityNotificationsEnabled: notificationSettings.enabled,
                    notificationRadius: notificationSettings.radius,
                    welcomeMessage: notificationSettings.welcomeMessage,
                },
            });
            await refreshChurch?.();

            toast({
                title: 'Notification settings saved',
                description: 'Proximity notification settings have been updated.',
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to save notification settings',
                description: error.message || 'An error occurred while saving notification settings.',
            });
        } finally {
            setIsSavingNotifications(false);
        }
    };

    // Request notification permission
    const requestNotificationPermission = async () => {
        if (!('Notification' in window)) {
            toast({
                variant: 'destructive',
                title: 'Not supported',
                description: 'Push notifications are not supported in your browser.',
            });
            return;
        }

        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            setNotificationSettings((prev) => ({ ...prev, enabled: true }));
            toast({
                title: 'Notifications enabled',
                description: "You will receive notifications when you're near the church.",
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Permission denied',
                description: 'Please enable notifications in your browser settings.',
            });
        }
    };

    // Preview currency format
    const previewCurrency = getCurrencyByCode(selectedCurrency);
    const previewAmount = 1234567.89;

    return (
        <DashboardLayout title="Church Settings">
            <div className="p-4 md:p-6 max-w-4xl mx-auto">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                        <TabsTrigger value="general" className="gap-2">
                            <Building2 className="h-4 w-4" />
                            <span className="hidden sm:inline">General</span>
                        </TabsTrigger>
                        <TabsTrigger value="currency" className="gap-2">
                            <Coins className="h-4 w-4" />
                            <span className="hidden sm:inline">Currency</span>
                        </TabsTrigger>
                        <TabsTrigger value="location" className="gap-2">
                            <MapPinned className="h-4 w-4" />
                            <span className="hidden sm:inline">Location</span>
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="gap-2">
                            <Bell className="h-4 w-4" />
                            <span className="hidden sm:inline">Notifications</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* General Settings Tab */}
                    <TabsContent value="general" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5" />
                                    Church Information
                                </CardTitle>
                                <CardDescription>
                                    Basic information about your church
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="churchName">Church Name</Label>
                                        <Input
                                            id="churchName"
                                            value={churchInfo.name}
                                            onChange={(e) => setChurchInfo({ ...churchInfo, name: e.target.value })}
                                            placeholder="Enter church name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="churchPhone">Phone Number</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="churchPhone"
                                                value={churchInfo.phone}
                                                onChange={(e) => setChurchInfo({ ...churchInfo, phone: e.target.value })}
                                                placeholder="+1 234 567 8900"
                                                className="pl-9"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="churchEmail">Email Address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="churchEmail"
                                                type="email"
                                                value={churchInfo.email}
                                                onChange={(e) => setChurchInfo({ ...churchInfo, email: e.target.value })}
                                                placeholder="info@church.com"
                                                className="pl-9"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="churchWebsite">Website</Label>
                                        <div className="relative">
                                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="churchWebsite"
                                                value={churchInfo.website}
                                                onChange={(e) => setChurchInfo({ ...churchInfo, website: e.target.value })}
                                                placeholder="https://www.church.com"
                                                className="pl-9"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button onClick={saveChurchInfo} disabled={isSaving} className="gap-2">
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Currency Settings Tab */}
                    <TabsContent value="currency" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Coins className="h-5 w-5" />
                                    Currency Settings
                                </CardTitle>
                                <CardDescription>
                                    Set the currency used for all financial transactions and displays
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Current Currency Display */}
                                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                        <Label>Current Currency</Label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="text-lg px-3 py-1">
                                            {currentCurrency.symbol}
                                        </Badge>
                                        <div>
                                            <p className="font-medium">{currentCurrency.name}</p>
                                            <p className="text-sm text-muted-foreground">{currentCurrency.code}</p>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Currency Selector */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Select Currency</Label>
                                        <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select a currency" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[300px]">
                                                {CURRENCIES.map((curr) => (
                                                    <SelectItem key={curr.code} value={curr.code}>
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-mono text-lg w-8">{curr.symbol}</span>
                                                            <div>
                                                                <span className="font-medium">{curr.name}</span>
                                                                <span className="text-muted-foreground ml-2">({curr.code})</span>
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Preview */}
                                    {selectedCurrency && (
                                        <div className="p-4 rounded-lg border bg-card">
                                            <Label className="text-sm text-muted-foreground">Preview</Label>
                                            <div className="mt-2 space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm">Full format:</span>
                                                    <span className="font-mono text-lg">
                            {formatCurrencyUtil(previewAmount, previewCurrency)}
                          </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm">Compact format:</span>
                                                    <span className="font-mono text-lg">
                            {formatCurrencyUtil(previewAmount, previewCurrency, { compact: true })}
                          </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm">With code:</span>
                                                    <span className="font-mono text-lg">
                            {formatCurrencyUtil(previewAmount, previewCurrency, { showCode: true })}
                          </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        onClick={saveCurrency}
                                        disabled={isSavingCurrency || selectedCurrency === church?.currency}
                                        className="gap-2"
                                    >
                                        {isSavingCurrency ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4" />
                                                Save Currency
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Location Settings Tab */}
                    <TabsContent value="location" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5" />
                                    Church Location
                                </CardTitle>
                                <CardDescription>
                                    Set your church location to enable proximity notifications for members
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Auto-detect Location */}
                                <div className="flex items-center justify-between p-4 rounded-lg border">
                                    <div>
                                        <Label className="text-base">Auto-detect Location</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Use your current location as the church address
                                        </p>
                                    </div>
                                    <Button
                                        onClick={getCurrentLocation}
                                        disabled={isLoadingLocation}
                                        variant="outline"
                                    >
                                        {isLoadingLocation ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Detecting...
                                            </>
                                        ) : (
                                            <>
                                                <Navigation className="mr-2 h-4 w-4" />
                                                Get Location
                                            </>
                                        )}
                                    </Button>
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-card px-2 text-muted-foreground">Address Details</span>
                                    </div>
                                </div>

                                {/* Address Form */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="street">Street Address</Label>
                                        <Input
                                            id="street"
                                            value={location.address}
                                            onChange={(e) => setLocation({ ...location, address: e.target.value })}
                                            placeholder="123 Church Street"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="city">City</Label>
                                        <Input
                                            id="city"
                                            value={location.city}
                                            onChange={(e) => setLocation({ ...location, city: e.target.value })}
                                            placeholder="City"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="state">State/Province</Label>
                                        <Input
                                            id="state"
                                            value={location.state}
                                            onChange={(e) => setLocation({ ...location, state: e.target.value })}
                                            placeholder="State"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="postalCode">Postal Code</Label>
                                        <Input
                                            id="postalCode"
                                            value={location.postalCode}
                                            onChange={(e) => setLocation({ ...location, postalCode: e.target.value })}
                                            placeholder="12345"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="country">Country</Label>
                                        <Input
                                            id="country"
                                            value={location.country}
                                            onChange={(e) => setLocation({ ...location, country: e.target.value })}
                                            placeholder="Country"
                                        />
                                    </div>
                                </div>

                                {/* Coordinates Display */}
                                {(location.latitude !== 0 || location.longitude !== 0) && (
                                    <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Globe className="h-4 w-4 text-muted-foreground" />
                                            <Label>GPS Coordinates</Label>
                                        </div>
                                        <p className="text-sm font-mono">
                                            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                                        </p>
                                    </div>
                                )}

                                {/* Current Address Display */}
                                {(location.address || location.city) && (
                                    <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-secondary" />
                                            <Label>Full Address</Label>
                                        </div>
                                        <p className="text-sm">
                                            {[location.address, location.city, location.state, location.postalCode, location.country]
                                                .filter(Boolean)
                                                .join(', ')}
                                        </p>
                                    </div>
                                )}

                                <div className="flex justify-end">
                                    <Button onClick={saveAddress} disabled={isSavingAddress} className="gap-2">
                                        {isSavingAddress ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4" />
                                                Save Address
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Notification Settings Tab */}
                    <TabsContent value="notifications" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bell className="h-5 w-5" />
                                    Push Notifications
                                </CardTitle>
                                <CardDescription>
                                    Configure proximity-based notifications for your members
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Enable Proximity Notifications</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Send welcome notifications when members approach the church
                                        </p>
                                    </div>
                                    <Switch
                                        checked={notificationSettings.enabled}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                requestNotificationPermission();
                                            } else {
                                                setNotificationSettings((prev) => ({ ...prev, enabled: false }));
                                            }
                                        }}
                                    />
                                </div>

                                {notificationSettings.enabled && (
                                    <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                                        <div className="flex items-start gap-3">
                                            <CheckCircle2 className="h-5 w-5 text-secondary mt-0.5" />
                                            <div>
                                                <p className="font-medium text-secondary">Notifications are enabled</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Members who opt-in will receive a welcome notification when they arrive at church
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!notificationSettings.enabled &&
                                    'Notification' in window &&
                                    Notification.permission === 'denied' && (
                                        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                                            <div className="flex items-start gap-3">
                                                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                                                <div>
                                                    <p className="font-medium text-destructive">Notifications are blocked</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Please enable notifications in your browser settings to use this feature
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                <Separator />

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Notification Radius (meters)</Label>
                                        <Input
                                            type="number"
                                            value={notificationSettings.radius}
                                            onChange={(e) =>
                                                setNotificationSettings({
                                                    ...notificationSettings,
                                                    radius: parseInt(e.target.value) || 500,
                                                })
                                            }
                                            placeholder="500"
                                            min={100}
                                            max={5000}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Members will receive a notification when they enter this radius around the church
                                            (100m - 5000m)
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Welcome Message</Label>
                                        <Textarea
                                            value={notificationSettings.welcomeMessage}
                                            onChange={(e) =>
                                                setNotificationSettings({
                                                    ...notificationSettings,
                                                    welcomeMessage: e.target.value,
                                                })
                                            }
                                            placeholder="Enter welcome message..."
                                            rows={3}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            This message will be shown to members when they arrive
                                        </p>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button onClick={saveNotificationSettings} disabled={isSavingNotifications} className="gap-2">
                                        {isSavingNotifications ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4" />
                                                Save Notification Settings
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}