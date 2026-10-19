// src/pages/public/ProfileCompletionPage.tsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
    User,
    Calendar,
    MapPin,
    Upload,
    Download,
    Check,
    Loader2,
    AlertCircle,
    Heart,
    Church
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

import { publicApi } from '@/services/registrationApi';
import { ProfileFormData } from '@/types/registration';

const interestOptions = [
    'Worship', 'Bible Study', 'Youth Group', 'Children Ministry',
    'Mens Fellowship', 'Womens Fellowship', 'Choir', 'Outreach',
    'Prayer Group', 'Marriage Counseling'
];

const howDidYouHearOptions = [
    { value: 'friend', label: 'Friend/Family Invitation' },
    { value: 'social_media', label: 'Social Media' },
    { value: 'website', label: 'Church Website' },
    { value: 'search', label: 'Google Search' },
    { value: 'flyer', label: 'Flyer/Poster' },
    { value: 'radio', label: 'Radio' },
    { value: 'tv', label: 'Television' },
    { value: 'walk_in', label: 'Walk-in' },
    { value: 'other', label: 'Other' },
];

export default function ProfileCompletionPage() {
    const { token } = useParams<{ token: string }>();

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formDataInfo, setFormDataInfo] = useState<ProfileFormData | null>(null);
    const [profileData, setProfileData] = useState<Record<string, any>>({});
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (token) {
            loadFormData();
        }
    }, [token]);

    const loadFormData = async () => {
        try {
            const data = await publicApi.getProfileForm(token!);
            setFormDataInfo(data);
            setProfileData(data.currentData || {});
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid or expired link');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (field: string, value: any) => {
        setProfileData(prev => ({ ...prev, [field]: value }));
    };

    const handleInterestToggle = (interest: string) => {
        const current = profileData.interests || [];
        if (current.includes(interest)) {
            handleChange('interests', current.filter((i: string) => i !== interest));
        } else {
            handleChange('interests', [...current, interest]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await publicApi.submitProfile(token!, profileData);
            setIsSuccess(true);
            toast.success('Profile updated successfully!');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsSubmitting(true);
        try {
            await publicApi.uploadProfileFile(token!, file);
            setIsSuccess(true);
            toast.success('Profile updated from file!');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to process file');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading your profile...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-destructive/5 to-destructive/10 flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center">
                    <CardContent className="pt-8">
                        <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                        <h1 className="text-2xl font-bold mb-2">Link Expired or Invalid</h1>
                        <p className="text-muted-foreground">{error}</p>
                        <p className="text-sm text-muted-foreground mt-4">
                            Please contact the church if you need a new profile completion link.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center">
                    <CardContent className="pt-8">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Profile Updated!</h1>
                        <p className="text-muted-foreground">
                            Thank you for completing your profile. We look forward to seeing you!
                        </p>
                        <p className="text-primary font-medium mt-4">
                            {formDataInfo?.churchName}
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const isFirstTimer = formDataInfo?.recordType === 'first_timer';

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Church className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold">
                        Welcome, {profileData.firstName}!
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Complete your profile for {formDataInfo?.churchName}
                    </p>
                </div>

                {/* Main Form */}
                <Card>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Personal Information */}
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <User className="w-5 h-5 text-primary" />
                                    <h2 className="text-lg font-semibold">Personal Information</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Date of Birth */}
                                    <div className="space-y-2">
                                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                                        <Input
                                            id="dateOfBirth"
                                            type="date"
                                            value={profileData.dateOfBirth || ''}
                                            onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                                        />
                                    </div>

                                    {/* Gender */}
                                    <div className="space-y-2">
                                        <Label>Gender</Label>
                                        <Select
                                            value={profileData.gender || ''}
                                            onValueChange={(value) => handleChange('gender', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="male">Male</SelectItem>
                                                <SelectItem value="female">Female</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Marital Status (Members only) */}
                                    {!isFirstTimer && (
                                        <div className="space-y-2">
                                            <Label>Marital Status</Label>
                                            <Select
                                                value={profileData.maritalStatus || ''}
                                                onValueChange={(value) => handleChange('maritalStatus', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="single">Single</SelectItem>
                                                    <SelectItem value="married">Married</SelectItem>
                                                    <SelectItem value="divorced">Divorced</SelectItem>
                                                    <SelectItem value="widowed">Widowed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {/* Wedding Anniversary */}
                                    {!isFirstTimer && profileData.maritalStatus === 'married' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="weddingAnniversary">Wedding Anniversary</Label>
                                            <Input
                                                id="weddingAnniversary"
                                                type="date"
                                                value={profileData.weddingAnniversary || ''}
                                                onChange={(e) => handleChange('weddingAnniversary', e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            {/* Address */}
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <MapPin className="w-5 h-5 text-primary" />
                                    <h2 className="text-lg font-semibold">Address</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2 space-y-2">
                                        <Label htmlFor="address">Street Address</Label>
                                        <Input
                                            id="address"
                                            type="text"
                                            value={profileData.address || ''}
                                            onChange={(e) => handleChange('address', e.target.value)}
                                            placeholder="123 Main Street"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="city">City</Label>
                                        <Input
                                            id="city"
                                            type="text"
                                            value={profileData.city || ''}
                                            onChange={(e) => handleChange('city', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="state">State/Province</Label>
                                        <Input
                                            id="state"
                                            type="text"
                                            value={profileData.state || ''}
                                            onChange={(e) => handleChange('state', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="country">Country</Label>
                                        <Input
                                            id="country"
                                            type="text"
                                            value={profileData.country || ''}
                                            onChange={(e) => handleChange('country', e.target.value)}
                                        />
                                    </div>

                                    {!isFirstTimer && (
                                        <div className="space-y-2">
                                            <Label htmlFor="postalCode">Postal Code</Label>
                                            <Input
                                                id="postalCode"
                                                type="text"
                                                value={profileData.postalCode || ''}
                                                onChange={(e) => handleChange('postalCode', e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* First Timer Specific Fields */}
                            {isFirstTimer && (
                                <>
                                    <Separator />

                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <Heart className="w-5 h-5 text-primary" />
                                            <h2 className="text-lg font-semibold">Help Us Know You Better</h2>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>How did you hear about us?</Label>
                                                <Select
                                                    value={profileData.howDidYouHear || ''}
                                                    onValueChange={(value) => handleChange('howDidYouHear', value)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {howDidYouHearOptions.map((option) => (
                                                            <SelectItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>What are you interested in?</Label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {interestOptions.map((interest) => (
                                                        <label
                                                            key={interest}
                                                            className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-accent"
                                                        >
                                                            <Checkbox
                                                                checked={(profileData.interests || []).includes(interest)}
                                                                onCheckedChange={() => handleInterestToggle(interest)}
                                                            />
                                                            <span className="text-sm">{interest}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="prayerRequest">Prayer Request (Optional)</Label>
                                                <Textarea
                                                    id="prayerRequest"
                                                    value={profileData.prayerRequest || ''}
                                                    onChange={(e) => handleChange('prayerRequest', e.target.value)}
                                                    rows={3}
                                                    placeholder="Share any prayer requests you'd like us to pray about..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            <Separator />

                            {/* File Upload Option */}
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Or you can download and fill out the template file:
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        asChild
                                    >
                                        <a
                                            href={publicApi.getTemplateUrl('csv', formDataInfo?.recordType || 'member')}
                                            download
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download CSV Template
                                        </a>
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="relative"
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Upload Completed File
                                        <input
                                            type="file"
                                            accept=".csv,.xlsx"
                                            onChange={handleFileUpload}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                    </Button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full"
                                size="lg"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4 mr-2" />
                                        Save Profile
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Footer */}
                <p className="text-center text-sm text-muted-foreground mt-8">
                    Your information is secure and will only be used by {formDataInfo?.churchName}
                </p>
            </div>
        </div>
    );
}