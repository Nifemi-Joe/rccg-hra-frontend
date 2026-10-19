import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { authApi, LoginResponse } from '@/lib/api';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import logo from '@/assets/hralogo.png';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Get return URL from query params
    const returnUrl = searchParams.get('returnUrl') || '/dashboard';

    const form = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        try {
            const response: LoginResponse = await authApi.login(data.email, data.password);

            // Check if user must reset password
            const mustResetPassword = response.mustResetPassword || response.user?.must_reset_password;
            console.log(response)
            if (mustResetPassword) {
                toast({
                    title: 'Password Reset Required',
                    description: 'You must change your temporary password before continuing.',
                });
                navigate(`/reset-password-first-login?userId=${response.userId}&email=${response.email}`);
                return;
            }

            // Login successful
            login(response.accessToken, response.user, response.church);

            // Get display name and role
            const firstName = response.user.first_name || 'User';
            const roleDisplay = response.user.role_display || response.user.role || 'Member';

            // Show welcome message
            toast({
                title: `Welcome back, ${firstName}!`,
                description: `Logged in as ${roleDisplay}`,
            });

            // Check if church setup is complete
            const adminSetupSkipped = response.church?.admin_setup_skipped || response.church?.adminSetupSkipped;
            const profileCompleted = response.user?.profile_completed;

            // Navigate based on profile completion or return URL
            if (adminSetupSkipped && !profileCompleted) {
                navigate('/setup-admin?churchId=' + response.church.id + '&email=' + response.user.email);
            } else {
                navigate(returnUrl);
            }
        } catch (error: unknown) {
            console.error('Login error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Invalid email or password';
            toast({
                variant: 'destructive',
                title: 'Login failed',
                description: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center space-y-4">
                    <div className="flex justify-center">
                        <img src={logo} alt="ChurchFlow" className="h-12 w-12" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-display">Welcome back</CardTitle>
                        <CardDescription>Sign in to your church account</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="pastor@church.org"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type={showPassword ? 'text' : 'password'}
                                                    placeholder="••••••••"
                                                    {...field}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-0 top-0 h-full px-3"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end">
                                <Link
                                    to="/forgot-password"
                                    className="text-sm text-primary hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign in'
                                )}
                            </Button>
                        </form>
                    </Form>

                    <div className="mt-6 text-center text-sm">
                        <span className="text-muted-foreground">Don't have an account? </span>
                        <Link to="/register" className="text-primary hover:underline font-medium">
                            Register your church
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}