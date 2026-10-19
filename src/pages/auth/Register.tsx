import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { authApi } from '@/lib/api';
import { Eye, EyeOff, Loader2, CheckCircle2, Mail, ArrowLeft } from 'lucide-react';
import logo from '@/assets/hralogo.png';

const registerSchema = z.object({
  churchName: z.string().min(2, 'Church name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').max(255),
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

type RegisterFormData = z.infer<typeof registerSchema>;

type Step = 'form' | 'otp' | 'success';

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<Step>('form');
  const [otpValue, setOtpValue] = useState('');
  const [churchId, setChurchId] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      churchName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await authApi.register({
        email: data.email,
        password: data.password,
        churchName: data.churchName,
      });
      setRegisteredEmail(data.email);
      setStep('otp');
      toast({
        title: 'Verification code sent',
        description: 'Please check your email for the verification code.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: error.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

    // In the onVerifyOTP handler, after successful verification:

    const onVerifyOTP = async () => {
        if (otpValue.length !== 6) {
            toast({
                variant: 'destructive',
                title: 'Invalid code',
                description: 'Please enter the 6-digit verification code.',
            });
            return;
        }

        setIsLoading(true);
        try {
            const response = await authApi.verifyOTP(registeredEmail, otpValue);

            // Store churchId and userId for setup admin step
            setChurchId(response.churchId);
            // Optionally store userId if needed

            toast({
                title: 'Email verified!',
                description: 'Your church and account have been created. Please complete your profile.',
            });

            // Navigate to setup admin with both churchId and email
            navigate(`/setup-admin?churchId=${response.churchId}&email=${response.email}`);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Verification failed',
                description: error.message || 'Invalid verification code.',
            });
        } finally {
            setIsLoading(false);
        }
    };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      await authApi.resendVerification(registeredEmail);
      toast({
        title: 'Code resent',
        description: 'A new verification code has been sent to your email.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to resend',
        description: error.message || 'Could not resend code. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

    if (step === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
                <Card className="w-full max-w-md text-center">
                    <CardContent className="pt-10 pb-10">
                        <div className="flex justify-center mb-6">
                            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                                <CheckCircle2 className="h-8 w-8 text-primary" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-display mb-2">Email Verified!</CardTitle>
                        <CardDescription className="mb-6">
                            Your email has been verified successfully. Let's complete your profile.
                        </CardDescription>
                        <Button
                            onClick={() => navigate(`/setup-admin?churchId=${churchId}&email=${registeredEmail}`)}
                            className="w-full"
                        >
                            Continue to Setup
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

  if (step === 'otp') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-display">Verify your email</CardTitle>
              <CardDescription>
                We sent a verification code to<br />
                <span className="font-medium text-foreground">{registeredEmail}</span>
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otpValue}
                onChange={setOtpValue}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              onClick={onVerifyOTP}
              className="w-full"
              disabled={isLoading || otpValue.length !== 6}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Didn't receive the code? </span>
              <button
                type="button"
                onClick={handleResendOTP}
                className="text-primary hover:underline font-medium"
                disabled={isLoading}
              >
                Resend
              </button>
            </div>

            <Button
              variant="ghost"
              className="w-full gap-2"
              onClick={() => setStep('form')}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to registration
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={logo} alt="ChurchPlus" className="h-12 w-12" />
          </div>
          <div>
            <CardTitle className="text-2xl font-display">Register your church</CardTitle>
            <CardDescription>Create an account to get started</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="churchName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Church Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Grace Community Church" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="admin@church.org" {...field} />
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
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                          placeholder="••••••••"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
