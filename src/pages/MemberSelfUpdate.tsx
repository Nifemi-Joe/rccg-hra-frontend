// src/pages/MemberSelfUpdate.tsx
import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Loader2,
    Mail,
    Phone,
    User,
    CheckCircle,
    AlertCircle,
    ArrowLeft,
    Church
} from "lucide-react";
import { memberSelfUpdateApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { MemberUpdateForm } from "@/components/forms/MemberUpdateForm";

type Step = 'identify' | 'otp' | 'select-member' | 'provide-contact' | 'update' | 'success';

interface MatchedMember {
    id: string;
    displayName: string;
    hasEmail: boolean;
    hasPhone: boolean;
    maskedEmail: string | null;
    maskedPhone: string | null;
}

export default function MemberSelfUpdate() {
    const { memberId } = useParams();
    const [searchParams] = useSearchParams();
    const { toast } = useToast();

    const churchId = searchParams.get('church');
    const preferredChannel = searchParams.get('channel') as 'email' | 'phone' | null;

    const [step, setStep] = useState<Step>('identify');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Identification state
    const [identifyMethod, setIdentifyMethod] = useState<'email' | 'name'>('email');
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');

    // OTP state
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [otp, setOtp] = useState('');
    const [maskedDestination, setMaskedDestination] = useState('');
    const [otpChannel, setOtpChannel] = useState<'email' | 'phone'>('email');

    // Member selection state
    const [matchedMembers, setMatchedMembers] = useState<MatchedMember[]>([]);
    const [selectedMember, setSelectedMember] = useState<MatchedMember | null>(null);

    // Provide contact state
    const [newContactChannel, setNewContactChannel] = useState<'email' | 'phone'>('email');
    const [newContactValue, setNewContactValue] = useState('');

    // Update state
    const [updateToken, setUpdateToken] = useState<string | null>(null);
    const [memberData, setMemberData] = useState<any>(null);

    // If memberId and channel are provided in URL, initiate directly
    useEffect(() => {
        if (memberId && preferredChannel && churchId) {
            handleDirectInitiate();
        }
    }, [memberId, preferredChannel, churchId]);

    const handleDirectInitiate = async () => {
        if (!memberId || !preferredChannel) return;

        setLoading(true);
        setError(null);

        try {
            const result = await memberSelfUpdateApi.initiateUpdate(memberId, preferredChannel);
            setSessionId(result.sessionId);
            setMaskedDestination(result.maskedDestination);
            setOtpChannel(preferredChannel);
            setStep('otp');
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to initiate verification';
            setError(errorMessage);
            // If member doesn't have the contact method, show identification step
            if (errorMessage.includes('does not have')) {
                setStep('identify');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEmailLookup = async () => {
        if (!email || !churchId) {
            setError('Email and church information are required');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await memberSelfUpdateApi.lookupByEmail(churchId, email);

            if (result.found && result.members.length === 1) {
                const member = result.members[0];
                if (member.hasEmail) {
                    // Initiate OTP via email
                    const otpResult = await memberSelfUpdateApi.initiateUpdate(member.id, 'email');
                    setSessionId(otpResult.sessionId);
                    setMaskedDestination(otpResult.maskedDestination);
                    setOtpChannel('email');
                    setSelectedMember(member);
                    setStep('otp');
                } else {
                    setSelectedMember(member);
                    setStep('provide-contact');
                }
            } else {
                setError('No member found with this email. Try searching by name instead.');
                setIdentifyMethod('name');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to lookup member');
        } finally {
            setLoading(false);
        }
    };

    const handleNameLookup = async () => {
        if (!fullName || !churchId) {
            setError('Full name and church information are required');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await memberSelfUpdateApi.lookupByName(churchId, fullName);

            if (result.found && result.members.length === 1) {
                handleMemberSelect(result.members[0]);
            } else if (result.found && result.members.length > 1) {
                setMatchedMembers(result.members);
                setStep('select-member');
            } else {
                setError(result.message || 'No matching members found. Please contact your church administrator.');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to lookup member');
        } finally {
            setLoading(false);
        }
    };

    const handleMemberSelect = (member: MatchedMember) => {
        setSelectedMember(member);
        setStep('provide-contact');
    };

    const handleNotMe = () => {
        setError('If none of these profiles are yours, please contact your church administrator to verify your membership.');
    };

    const handleSendOtpToExisting = async (channel: 'email' | 'phone') => {
        if (!selectedMember) return;

        setLoading(true);
        setError(null);

        try {
            const result = await memberSelfUpdateApi.initiateUpdate(selectedMember.id, channel);
            setSessionId(result.sessionId);
            setMaskedDestination(result.maskedDestination);
            setOtpChannel(channel);
            setStep('otp');
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to send verification code');
        } finally {
            setLoading(false);
        }
    };

    const handleSendOtpToNew = async () => {
        if (!selectedMember || !newContactValue) return;

        setLoading(true);
        setError(null);

        try {
            const result = await memberSelfUpdateApi.confirmIdentity(
                selectedMember.id,
                newContactChannel,
                newContactValue
            );
            setSessionId(result.sessionId);
            setMaskedDestination(result.maskedDestination);
            setOtpChannel(newContactChannel);
            setStep('otp');
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to send verification code');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!sessionId || otp.length !== 6) return;

        setLoading(true);
        setError(null);

        try {
            const result = await memberSelfUpdateApi.verifyOtp(sessionId, otp);
            setUpdateToken(result.updateToken);

            // Fetch member data
            const member = await memberSelfUpdateApi.getMemberByToken(result.updateToken);
            setMemberData(member);
            setStep('update');
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Invalid verification code');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSubmit = async (data: any) => {
        if (!updateToken) return;

        setLoading(true);
        setError(null);

        try {
            await memberSelfUpdateApi.updateMember(updateToken, data);
            setStep('success');
            toast({
                title: "Profile Updated",
                description: "Your information has been saved successfully.",
            });
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!sessionId) return;

        setLoading(true);
        setError(null);
        setOtp('');

        try {
            const result = await memberSelfUpdateApi.resendOtp(sessionId);
            setSessionId(result.sessionId || sessionId);
            toast({
                title: "Code Resent",
                description: "A new verification code has been sent.",
            });
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to resend code');
        } finally {
            setLoading(false);
        }
    };

    const goBack = () => {
        setError(null);
        if (step === 'otp') {
            if (selectedMember) {
                setStep('provide-contact');
            } else {
                setStep('identify');
            }
            setOtp('');
            setSessionId(null);
        } else if (step === 'provide-contact') {
            if (matchedMembers.length > 1) {
                setStep('select-member');
            } else {
                setStep('identify');
            }
            setSelectedMember(null);
        } else if (step === 'select-member') {
            setStep('identify');
            setMatchedMembers([]);
        }
    };

    // ============================================================================
    // RENDER STEPS
    // ============================================================================

    const renderIdentifyStep = () => (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Church className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Update Your Profile</CardTitle>
                <CardDescription>
                    Enter your email or name to find and update your member profile
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="flex gap-2 mb-4">
                    <Button
                        type="button"
                        variant={identifyMethod === 'email' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                            setIdentifyMethod('email');
                            setError(null);
                        }}
                        className="flex-1"
                    >
                        <Mail className="h-4 w-4 mr-2" />
                        Email
                    </Button>
                    <Button
                        type="button"
                        variant={identifyMethod === 'name' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                            setIdentifyMethod('name');
                            setError(null);
                        }}
                        className="flex-1"
                    >
                        <User className="h-4 w-4 mr-2" />
                        Name
                    </Button>
                </div>

                {identifyMethod === 'email' ? (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Your Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleEmailLookup()}
                            />
                        </div>
                        <Button
                            className="w-full"
                            onClick={handleEmailLookup}
                            disabled={loading || !email}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Continue
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Your Full Name</Label>
                            <Input
                                id="fullName"
                                placeholder="Enter your first and last name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleNameLookup()}
                            />
                        </div>
                        <Button
                            className="w-full"
                            onClick={handleNameLookup}
                            disabled={loading || !fullName}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Find My Profile
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    const renderSelectMemberStep = () => (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
                <CardTitle>Is This You?</CardTitle>
                <CardDescription>
                    We found similar names. Please select your profile.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-2">
                    {matchedMembers.map((member) => (
                        <Button
                            key={member.id}
                            variant="outline"
                            className="w-full justify-start h-auto py-3"
                            onClick={() => handleMemberSelect(member)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-5 w-5 text-primary" />
                                </div>
                                <div className="text-left">
                                    <p className="font-medium">{member.displayName}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {member.hasEmail && member.maskedEmail}
                                        {member.hasEmail && member.hasPhone && ' • '}
                                        {member.hasPhone && member.maskedPhone}
                                        {!member.hasEmail && !member.hasPhone && 'No contact info on file'}
                                    </p>
                                </div>
                            </div>
                        </Button>
                    ))}
                </div>

                <div className="pt-4 border-t space-y-2">
                    <Button
                        variant="ghost"
                        className="w-full text-muted-foreground"
                        onClick={handleNotMe}
                    >
                        None of these are me
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full"
                        onClick={goBack}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Try a different name
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

    const renderProvideContactStep = () => (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
                <CardTitle>Verify Your Identity</CardTitle>
                <CardDescription>
                    {selectedMember?.hasEmail || selectedMember?.hasPhone
                        ? "Choose how to receive your verification code"
                        : "Enter your contact information to verify your identity"}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {selectedMember && (
                    <div className="p-3 bg-muted rounded-lg flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                        </div>
                        <p className="font-medium">{selectedMember.displayName}</p>
                    </div>
                )}

                {/* Existing contact options */}
                {(selectedMember?.hasEmail || selectedMember?.hasPhone) && (
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Send verification code to:</Label>
                        {selectedMember?.hasEmail && (
                            <Button
                                variant="outline"
                                className="w-full justify-start h-auto py-3"
                                onClick={() => handleSendOtpToExisting('email')}
                                disabled={loading}
                            >
                                <Mail className="mr-3 h-5 w-5 text-muted-foreground" />
                                <div className="text-left">
                                    <p className="font-medium">Email</p>
                                    <p className="text-sm text-muted-foreground">{selectedMember.maskedEmail}</p>
                                </div>
                                {loading && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
                            </Button>
                        )}
                        {selectedMember?.hasPhone && (
                            <Button
                                variant="outline"
                                className="w-full justify-start h-auto py-3"
                                onClick={() => handleSendOtpToExisting('phone')}
                                disabled={loading}
                            >
                                <Phone className="mr-3 h-5 w-5 text-muted-foreground" />
                                <div className="text-left">
                                    <p className="font-medium">Phone (SMS)</p>
                                    <p className="text-sm text-muted-foreground">{selectedMember.maskedPhone}</p>
                                </div>
                                {loading && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
                            </Button>
                        )}

                        <div className="relative py-3">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Or use a different contact
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* New contact input */}
                <div className="space-y-4">
                    {!selectedMember?.hasEmail && !selectedMember?.hasPhone && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                We don't have any contact information on file for you. Please provide an email or phone number to verify your identity.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant={newContactChannel === 'email' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setNewContactChannel('email')}
                            className="flex-1"
                        >
                            <Mail className="h-4 w-4 mr-2" />
                            Email
                        </Button>
                        <Button
                            type="button"
                            variant={newContactChannel === 'phone' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setNewContactChannel('phone')}
                            className="flex-1"
                        >
                            <Phone className="h-4 w-4 mr-2" />
                            Phone
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <Label>
                            {newContactChannel === 'email' ? 'Email Address' : 'Phone Number'}
                        </Label>
                        <Input
                            type={newContactChannel === 'email' ? 'email' : 'tel'}
                            placeholder={newContactChannel === 'email' ? 'your@email.com' : '+1 (555) 123-4567'}
                            value={newContactValue}
                            onChange={(e) => setNewContactValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendOtpToNew()}
                        />
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleSendOtpToNew}
                        disabled={loading || !newContactValue}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Verification Code
                    </Button>
                </div>

                <Button
                    variant="ghost"
                    className="w-full"
                    onClick={goBack}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
            </CardContent>
        </Card>
    );

    const renderOtpStep = () => (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    {otpChannel === 'email' ? (
                        <Mail className="h-6 w-6 text-primary" />
                    ) : (
                        <Phone className="h-6 w-6 text-primary" />
                    )}
                </div>
                <CardTitle>Enter Verification Code</CardTitle>
                <CardDescription>
                    We sent a 6-digit code to <span className="font-medium">{maskedDestination}</span>
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="flex justify-center">
                    <InputOTP
                        value={otp}
                        onChange={setOtp}
                        maxLength={6}
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
                    className="w-full"
                    onClick={handleVerifyOtp}
                    disabled={loading || otp.length !== 6}
                >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verify Code
                </Button>

                <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                        Didn't receive the code?{' '}
                        <Button
                            variant="link"
                            className="p-0 h-auto font-medium"
                            onClick={handleResendOtp}
                            disabled={loading}
                        >
                            Resend
                        </Button>
                    </p>
                </div>

                <Button
                    variant="ghost"
                    className="w-full"
                    onClick={goBack}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Use different contact method
                </Button>
            </CardContent>
        </Card>
    );

    const renderUpdateStep = () => (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Update Your Profile</CardTitle>
                <CardDescription>
                    Review and update your information below
                </CardDescription>
            </CardHeader>
            <CardContent>
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <MemberUpdateForm
                    initialData={memberData}
                    onSubmit={handleUpdateSubmit}
                    loading={loading}
                />
            </CardContent>
        </Card>
    );

    const renderSuccessStep = () => (
        <Card className="w-full max-w-md mx-auto text-center">
            <CardContent className="pt-8 pb-6">
                <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Profile Updated!</h2>
                <p className="text-muted-foreground mb-6">
                    Your information has been saved successfully. Thank you for keeping your profile up to date.
                </p>
                <Button
                    onClick={() => window.close()}
                    variant="outline"
                >
                    Close this page
                </Button>
            </CardContent>
        </Card>
    );

    // No church ID provided
    if (!churchId && !memberId) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md mx-auto text-center">
                    <CardContent className="pt-8 pb-6">
                        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="h-8 w-8 text-destructive" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Invalid Link</h2>
                        <p className="text-muted-foreground">
                            This link appears to be invalid or incomplete. Please contact your church administrator for a valid profile update link.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
            <div className="w-full">
                {step === 'identify' && renderIdentifyStep()}
                {step === 'select-member' && renderSelectMemberStep()}
                {step === 'provide-contact' && renderProvideContactStep()}
                {step === 'otp' && renderOtpStep()}
                {step === 'update' && renderUpdateStep()}
                {step === 'success' && renderSuccessStep()}
            </div>
        </div>
    );
}