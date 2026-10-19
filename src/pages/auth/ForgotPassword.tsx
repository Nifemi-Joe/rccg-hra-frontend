import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { authApi } from '@/lib/api';
import {
    Loader2,
    ArrowLeft,
    CheckCircle2,
    Mail,
    KeyRound,
    Eye,
    EyeOff,
    RefreshCw,
    ShieldCheck
} from 'lucide-react';
import logo from '@/assets/hralogo.png';

// ============================================================================
// SCHEMAS
// ============================================================================

const emailSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

const otpSchema = z.object({
    otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must contain only numbers'),
});

const passwordSchema = z.object({
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type EmailFormData = z.infer<typeof emailSchema>;
type OTPFormData = z.infer<typeof otpSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

// ============================================================================
// STEP COMPONENTS
// ============================================================================

// Step 1: Email Input
interface EmailStepProps {
    onSubmit: (email: string) => Promise<void>;
    isLoading: boolean;
}

function EmailStep({ onSubmit, isLoading }: EmailStepProps) {
    const form = useForm<EmailFormData>({
        resolver: zodResolver(emailSchema),
        defaultValues: { email: '' },
    });

    const handleSubmit = async (data: EmailFormData) => {
        await onSubmit(data.email);
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center space-y-4">
                <div className="flex justify-center">
                    <img src={logo} alt="ChurchFlow" className="h-12 w-12" />
                </div>
                <div>
                    <CardTitle className="text-2xl font-display">Forgot password?</CardTitle>
                    <CardDescription>
                        Enter your email and we'll send you a verification code
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                                            autoComplete="email"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending code...
                                </>
                            ) : (
                                <>
                                    <Mail className="mr-2 h-4 w-4" />
                                    Send verification code
                                </>
                            )}
                        </Button>
                    </form>
                </Form>

                <div className="mt-6 text-center">
                    <Link
                        to="/login"
                        className="text-sm text-muted-foreground hover:text-primary inline-flex items-center"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to login
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

// Step 2: OTP Verification
interface OTPStepProps {
    email: string;
    onSubmit: (otp: string) => Promise<void>;
    onResend: () => Promise<void>;
    onBack: () => void;
    isLoading: boolean;
    isResending: boolean;
}

function OTPStep({ email, onSubmit, onResend, onBack, isLoading, isResending }: OTPStepProps) {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const { toast } = useToast();

    // Countdown timer
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [countdown]);

    const handleChange = (index: number, value: string) => {
        if (value.length > 1) {
            // Handle paste
            const digits = value.replace(/\D/g, '').slice(0, 6).split('');
            const newOtp = [...otp];
            digits.forEach((digit, i) => {
                if (index + i < 6) {
                    newOtp[index + i] = digit;
                }
            });
            setOtp(newOtp);

            // Focus on next empty or last field
            const nextIndex = Math.min(index + digits.length, 5);
            inputRefs.current[nextIndex]?.focus();
        } else {
            // Handle single digit
            if (!/^\d*$/.test(value)) return;

            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);

            // Auto-focus next input
            if (value && index < 5) {
                inputRefs.current[index + 1]?.focus();
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            toast({
                variant: 'destructive',
                title: 'Invalid OTP',
                description: 'Please enter all 6 digits',
            });
            return;
        }
        await onSubmit(otpString);
    };

    const handleResend = async () => {
        setCanResend(false);
        setCountdown(60);
        await onResend();
    };

    const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center space-y-4">
                <div className="flex justify-center">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <KeyRound className="h-8 w-8 text-primary" />
                    </div>
                </div>
                <div>
                    <CardTitle className="text-2xl font-display">Enter verification code</CardTitle>
                    <CardDescription>
                        We've sent a 6-digit code to<br />
                        <span className="font-medium text-foreground">{maskedEmail}</span>
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* OTP Input Fields */}
                    <div className="flex justify-center gap-2">
                        {otp.map((digit, index) => (
                            <Input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="w-12 h-12 text-center text-xl font-bold"
                                autoFocus={index === 0}
                            />
                        ))}
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Verifying...
                            </>
                        ) : (
                            'Verify code'
                        )}
                    </Button>

                    {/* Resend Code */}
                    <div className="text-center">
                        {canResend ? (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleResend}
                                disabled={isResending}
                                className="text-sm"
                            >
                                {isResending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Resend code
                                    </>
                                )}
                            </Button>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Resend code in <span className="font-medium">{countdown}s</span>
                            </p>
                        )}
                    </div>

                    <div className="text-center">
                        <Button
                            type="button"
                            variant="link"
                            onClick={onBack}
                            className="text-sm text-muted-foreground"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Use a different email
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

// Step 3: New Password
interface PasswordStepProps {
    onSubmit: (password: string) => Promise<void>;
    isLoading: boolean;
}

function PasswordStep({ onSubmit, isLoading }: PasswordStepProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const form = useForm<PasswordFormData>({
        resolver: zodResolver(passwordSchema),
        defaultValues: { password: '', confirmPassword: '' },
    });

    const handleSubmit = async (data: PasswordFormData) => {
        await onSubmit(data.password);
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center space-y-4">
                <div className="flex justify-center">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <ShieldCheck className="h-8 w-8 text-primary" />
                    </div>
                </div>
                <div>
                    <CardTitle className="text-2xl font-display">Create new password</CardTitle>
                    <CardDescription>
                        Your new password must be different from previous passwords
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="Enter new password"
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

                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                placeholder="Confirm new password"
                                                {...field}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-0 top-0 h-full px-3"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? (
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

                        {/* Password Requirements */}
                        <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                            <p className="font-medium mb-1">Password requirements:</p>
                            <ul className="space-y-1 text-xs">
                                <li>• At least 8 characters long</li>
                                <li>• One uppercase letter (A-Z)</li>
                                <li>• One lowercase letter (a-z)</li>
                                <li>• One number (0-9)</li>
                                <li>• One special character (!@#$%^&*)</li>
                            </ul>
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Resetting password...
                                </>
                            ) : (
                                'Reset password'
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

// Step 4: Success
function SuccessStep() {
    const navigate = useNavigate();

    return (
        <Card className="w-full max-w-md text-center">
            <CardContent className="pt-10 pb-10">
                <div className="flex justify-center mb-6">
                    <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                    </div>
                </div>
                <CardTitle className="text-2xl font-display mb-2">Password reset successful!</CardTitle>
                <CardDescription className="mb-6">
                    Your password has been successfully reset. You can now sign in with your new password.
                </CardDescription>
                <Button onClick={() => navigate('/login')} className="w-full">
                    Sign in to your account
                </Button>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

type Step = 'email' | 'otp' | 'password' | 'success';

export default function ForgotPassword() {
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const { toast } = useToast();

    // Step 1: Send OTP to email
    const handleEmailSubmit = async (emailValue: string) => {
        setIsLoading(true);
        try {
            await authApi.forgotPassword(emailValue);
            setEmail(emailValue);
            setStep('otp');
            toast({
                title: 'Code sent!',
                description: 'Please check your email for the verification code.',
            });
        } catch (error: unknown) {
            // For security, always show success message even if email doesn't exist
            // The backend should do the same
            setEmail(emailValue);
            setStep('otp');
            toast({
                title: 'Code sent!',
                description: 'If an account exists with that email, you will receive a verification code.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleOTPSubmit = async (otp: string) => {
        setIsLoading(true);
        try {
            const response = await authApi.verifyResetOTP(email, otp);
            setResetToken(response.resetToken);
            setStep('password');
            toast({
                title: 'Code verified!',
                description: 'Please enter your new password.',
            });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Invalid or expired code. Please try again.';
            toast({
                variant: 'destructive',
                title: 'Verification failed',
                description: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Resend OTP
    const handleResendOTP = async () => {
        setIsResending(true);
        try {
            await authApi.forgotPassword(email);
            toast({
                title: 'Code resent!',
                description: 'A new verification code has been sent to your email.',
            });
        } catch (error: unknown) {
            toast({
                title: 'Code resent!',
                description: 'If the email is valid, you will receive a new code.',
            });
        } finally {
            setIsResending(false);
        }
    };

    // Step 3: Reset Password
    const handlePasswordSubmit = async (password: string) => {
        setIsLoading(true);
        try {
            await authApi.resetPasswordWithToken(resetToken, password);
            setStep('success');
            toast({
                title: 'Password reset!',
                description: 'Your password has been successfully changed.',
            });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to reset password. Please try again.';
            toast({
                variant: 'destructive',
                title: 'Reset failed',
                description: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Go back to email step
    const handleBackToEmail = () => {
        setStep('email');
        setEmail('');
        setResetToken('');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
            {step === 'email' && (
                <EmailStep onSubmit={handleEmailSubmit} isLoading={isLoading} />
            )}
            {step === 'otp' && (
                <OTPStep
                    email={email}
                    onSubmit={handleOTPSubmit}
                    onResend={handleResendOTP}
                    onBack={handleBackToEmail}
                    isLoading={isLoading}
                    isResending={isResending}
                />
            )}
            {step === 'password' && (
                <PasswordStep onSubmit={handlePasswordSubmit} isLoading={isLoading} />
            )}
            {step === 'success' && <SuccessStep />}
        </div>
    );
}