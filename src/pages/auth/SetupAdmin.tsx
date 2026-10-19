import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { churchApi } from '@/lib/api';
import { Loader2, UserPlus, ArrowLeft } from 'lucide-react';
import logo from '@/assets/hralogo.png';

const setupAdminSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
    country: z.string().min(2, 'Please select a country'),
    membershipSize: z.string().min(1, 'Please select membership size'),
});

type SetupAdminFormData = z.infer<typeof setupAdminSchema>;

export default function SetupAdmin() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSkipping, setIsSkipping] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();
    const { login } = useAuth();
    const [searchParams] = useSearchParams();

    const churchId = searchParams.get('churchId');
    const email = searchParams.get('email');

    const form = useForm<SetupAdminFormData>({
        resolver: zodResolver(setupAdminSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            phoneNumber: '',
            country: '',
            membershipSize: '',
        },
    });

    const onSubmit = async (data: SetupAdminFormData) => {
        if (!churchId) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Church ID not found. Please start registration again.',
            });
            navigate('/register');
            return;
        }

        setIsLoading(true);
        try {
            const response = await churchApi.setupAdmin({
                ...data,
                churchId,
            });

            // Login with the tokens received
            login(response.accessToken, response.user, response.church);

            toast({
                title: 'Setup complete!',
                description: 'Your profile has been updated successfully.',
            });

            navigate('/dashboard');
        } catch (error: any) {
            console.error('Setup admin error:', error);

            if (error.message?.includes('Setup already completed')) {
                toast({
                    title: 'Setup already complete',
                    description: 'Please login with your credentials.',
                });
                navigate('/login');
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Setup failed',
                    description: error.message || 'Could not complete setup. Please try again.',
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkip = async () => {
        if (!churchId) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Church ID not found. Please start registration again.',
            });
            navigate('/register');
            return;
        }

        setIsSkipping(true);
        try {
            await churchApi.skipAdminSetup(churchId);

            toast({
                title: 'Setup skipped',
                description: 'You can complete your profile later from settings. Please login to continue.',
            });

            navigate('/login');
        } catch (error: any) {
            console.error('Skip setup error:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Could not skip setup. Please try again.',
            });
        } finally {
            setIsSkipping(false);
        }
    };

    // Redirect if no churchId
    if (!churchId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
                <Card className="w-full max-w-md text-center">
                    <CardContent className="pt-10 pb-10">
                        <CardTitle className="text-xl mb-4">Invalid Setup Link</CardTitle>
                        <CardDescription className="mb-6">
                            Please complete the registration process first.
                        </CardDescription>
                        <Button onClick={() => navigate('/register')}>
                            Go to Registration
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4 py-12">
            <Card className="w-full max-w-2xl">
                <CardHeader className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/register')}
                            className="gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                        <div className="flex justify-center flex-1">
                            <img src={logo} alt="ChurchPlus" className="h-12 w-12" />
                        </div>
                        <div className="w-20" />
                    </div>
                    <div className="text-center">
                        <CardTitle className="text-2xl font-display">Complete Your Profile</CardTitle>
                        <CardDescription>
                            Tell us a bit more about yourself to personalize your experience
                            {email && (
                                <div className="mt-2 text-sm">
                                    <span className="font-medium text-foreground">{email}</span>
                                </div>
                            )}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="firstName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>First Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="John" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="lastName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Last Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Doe" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="phoneNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone Number</FormLabel>
                                        <FormControl>
                                            <Input type="tel" placeholder="+1 (555) 000-0000" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="country"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Country</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select country" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="US">United States</SelectItem>
                                                <SelectItem value="CA">Canada</SelectItem>
                                                <SelectItem value="GB">United Kingdom</SelectItem>
                                                <SelectItem value="NG">Nigeria</SelectItem>
                                                <SelectItem value="GH">Ghana</SelectItem>
                                                <SelectItem value="KE">Kenya</SelectItem>
                                                <SelectItem value="ZA">South Africa</SelectItem>
                                                <SelectItem value="AU">Australia</SelectItem>
                                                <SelectItem value="IN">India</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="membershipSize"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Church Membership Size</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select size" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="1-50">1-50 members</SelectItem>
                                                <SelectItem value="51-100">51-100 members</SelectItem>
                                                <SelectItem value="101-250">101-250 members</SelectItem>
                                                <SelectItem value="251-500">251-500 members</SelectItem>
                                                <SelectItem value="501-1000">501-1000 members</SelectItem>
                                                <SelectItem value="1000+">1000+ members</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={handleSkip}
                                    disabled={isLoading || isSkipping}
                                >
                                    {isSkipping ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Skipping...
                                        </>
                                    ) : (
                                        'Skip for now'
                                    )}
                                </Button>

                                <Button type="submit" className="flex-1" disabled={isLoading || isSkipping}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Complete Setup
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}