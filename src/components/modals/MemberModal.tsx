// src/components/modals/CreateMemberModal.tsx (Updated)
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { membersApi } from "@/lib/api";
import {
    Member,
    Gender,
    MaritalStatus,
    MemberStatus,
    UpdateMemberDTO,
    CreateMemberDTO,
} from '@/types/member.ts';
import { format } from "date-fns";
import { CalendarIcon, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

interface MemberModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    member?: Member | null;
}

export function MemberModal({ open, onClose, onSuccess, member }: MemberModalProps) {
    const [loading, setLoading] = useState(false);
    const [sendingLink, setSendingLink] = useState(false);
    const { toast } = useToast();

    // Form state — use union types for gender, maritalStatus, status
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        gender: "" as Gender | "",
        maritalStatus: "" as MaritalStatus | "",
        dateOfBirth: null as Date | null,
        weddingAnniversary: null as Date | null,
        address: "",
        city: "",
        state: "",
        country: "",
        postalCode: "",
        status: "active" as MemberStatus,
        notes: "",
        sendProfileLink: false,
    });

    const [profileLink, setProfileLink] = useState<string | null>(null);
    const [linkChannels, setLinkChannels] = useState<Array<'email' | 'sms' | 'whatsapp'>>([]);

    useEffect(() => {
        if (member) {
            setFormData({
                firstName: member.first_name || "",
                lastName: member.last_name || "",
                email: member.email || "",
                phone: member.phone || "",
                gender: member.gender || "",
                maritalStatus: member.marital_status || "",
                dateOfBirth: member.date_of_birth ? new Date(member.date_of_birth) : null,
                weddingAnniversary: member.wedding_anniversary ? new Date(member.wedding_anniversary) : null,
                address: member.address || "",
                city: member.city || "",
                state: member.state || "",
                country: member.country || "",
                postalCode: member.postal_code || "",
                status: member.status || "active",
                notes: member.notes || "",
                sendProfileLink: false,
            });

            // If member has a valid profile update token, show the link
            if (member.profile_update_token && member.profile_update_token_expires_at) {
                const expiresAt = new Date(member.profile_update_token_expires_at);
                if (expiresAt > new Date()) {
                    const baseUrl = window.location.origin;
                    setProfileLink(`${baseUrl}/profile/update/${member.profile_update_token}`);
                }
            }
        } else {
            setFormData({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                gender: "",
                maritalStatus: "",
                dateOfBirth: null,
                weddingAnniversary: null,
                address: "",
                city: "",
                state: "",
                country: "",
                postalCode: "",
                status: "active",
                notes: "",
                sendProfileLink: false,
            });
            setProfileLink(null);
        }
    }, [member, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (member) {
                // UPDATE — build UpdateMemberDTO with proper types
                const updateData: UpdateMemberDTO = {
                    firstName: formData.firstName || undefined,
                    lastName: formData.lastName || undefined,
                    email: formData.email || undefined,
                    phone: formData.phone || undefined,
                    gender: formData.gender || undefined,
                    maritalStatus: formData.maritalStatus || undefined,
                    dateOfBirth: formData.dateOfBirth?.toISOString() || undefined,
                    weddingAnniversary:
                        formData.maritalStatus === 'married'
                            ? formData.weddingAnniversary?.toISOString() || undefined
                            : null,
                    address: formData.address || undefined,
                    city: formData.city || undefined,
                    state: formData.state || undefined,
                    country: formData.country || undefined,
                    postalCode: formData.postalCode || undefined,
                    status: formData.status || undefined,
                    notes: formData.notes || undefined,
                };

                await membersApi.update(member.id, updateData);
            } else {
                // CREATE — build CreateMemberDTO with proper types
                const createData: CreateMemberDTO = {
                    churchId: '', // This should come from your auth context
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email || undefined,
                    phone: formData.phone || undefined,
                    gender: formData.gender || undefined,
                    maritalStatus: formData.maritalStatus || undefined,
                    dateOfBirth: formData.dateOfBirth?.toISOString() || undefined,
                    weddingAnniversary:
                        formData.maritalStatus === 'married'
                            ? formData.weddingAnniversary?.toISOString() || undefined
                            : undefined,
                    address: formData.address || undefined,
                    city: formData.city || undefined,
                    state: formData.state || undefined,
                    country: formData.country || undefined,
                    postalCode: formData.postalCode || undefined,
                    status: formData.status || undefined,
                    notes: formData.notes || undefined,
                    sendProfileLink: formData.sendProfileLink,
                };

                const result = await membersApi.create(createData);

                // If sendProfileLink is true and we have a profile link in the response
                if (formData.sendProfileLink && result.profileLink) {
                    setProfileLink(result.profileLink.link);
                }
            }

            toast({
                title: member ? "Member updated" : "Member created",
                description: `${formData.firstName} ${formData.lastName} has been ${member ? "updated" : "added"} successfully.`,
            });

            onSuccess();

            // Only close if not sending profile link
            if (!formData.sendProfileLink || member) {
                onClose();
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Something went wrong";
            toast({
                variant: "destructive",
                title: "Error",
                description: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateLink = async () => {
        if (!member) return;

        setLoading(true);
        try {
            const result = await membersApi.generateProfileLink(member.id);
            setProfileLink(result.link);
            toast({
                title: "Link generated",
                description: "Profile update link has been generated successfully.",
            });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Failed to generate link";
            toast({
                variant: "destructive",
                title: "Error",
                description: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    };

    // FIX: Pass ProfileLinkSendOptions object instead of string[]
    const handleSendLink = async () => {
        if (!member || linkChannels.length === 0) return;

        setSendingLink(true);
        try {
            const result = await membersApi.sendProfileLink(member.id, {
                channels: linkChannels,
            });

            if (result.sent.length > 0) {
                toast({
                    title: "Link sent",
                    description: `Profile update link sent via ${result.sent.join(', ')}`,
                });
            }

            if (result.failed.length > 0) {
                toast({
                    variant: "destructive",
                    title: "Partial failure",
                    description: `Failed to send via ${result.failed.join(', ')}`,
                });
            }

            setLinkChannels([]);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Failed to send link";
            toast({
                variant: "destructive",
                title: "Error",
                description: errorMessage,
            });
        } finally {
            setSendingLink(false);
        }
    };

    const handleCopyLink = () => {
        if (profileLink) {
            navigator.clipboard.writeText(profileLink);
            toast({
                title: "Link copied",
                description: "Profile update link copied to clipboard",
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{member ? "Edit Member" : "Add New Member"}</DialogTitle>
                    <DialogDescription>
                        {member
                            ? "Update member information and manage profile update link"
                            : "Add a new member to your church. Optionally generate a profile update link for them to complete their information."}
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="info" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="info">Member Info</TabsTrigger>
                        {member && <TabsTrigger value="link">Profile Link</TabsTrigger>}
                    </TabsList>

                    <TabsContent value="info">
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            {/* Basic Information */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name *</Label>
                                    <Input
                                        id="firstName"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name *</Label>
                                    <Input
                                        id="lastName"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Personal Information */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="gender">Gender</Label>
                                    <Select
                                        value={formData.gender}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, gender: value as Gender })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="maritalStatus">Marital Status</Label>
                                    <Select
                                        value={formData.maritalStatus}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, maritalStatus: value as MaritalStatus })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="single">Single</SelectItem>
                                            <SelectItem value="married">Married</SelectItem>
                                            <SelectItem value="divorced">Divorced</SelectItem>
                                            <SelectItem value="widowed">Widowed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Date of Birth</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !formData.dateOfBirth && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {formData.dateOfBirth ? format(formData.dateOfBirth, "PPP") : "Pick a date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={formData.dateOfBirth || undefined}
                                                onSelect={(date) => setFormData({ ...formData, dateOfBirth: date || null })}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {formData.maritalStatus === 'married' && (
                                    <div className="space-y-2">
                                        <Label>Wedding Anniversary</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !formData.weddingAnniversary && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {formData.weddingAnniversary ? format(formData.weddingAnniversary, "PPP") : "Pick a date"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={formData.weddingAnniversary || undefined}
                                                    onSelect={(date) => setFormData({ ...formData, weddingAnniversary: date || null })}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                )}
                            </div>

                            {/* Address */}
                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="state">State</Label>
                                    <Input
                                        id="state"
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="postalCode">Postal Code</Label>
                                    <Input
                                        id="postalCode"
                                        value={formData.postalCode}
                                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Status */}
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, status: value as MemberStatus })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                        <SelectItem value="suspended">Suspended</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            {/* Send Profile Link Option (only for new members) */}
                            {!member && (
                                <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
                                    <Switch
                                        id="sendProfileLink"
                                        checked={formData.sendProfileLink}
                                        onCheckedChange={(checked) => setFormData({ ...formData, sendProfileLink: checked })}
                                    />
                                    <div className="flex-1">
                                        <Label htmlFor="sendProfileLink" className="cursor-pointer">
                                            Generate profile update link
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Create a unique link that allows the member to complete their profile information
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Display generated link (for new members) */}
                            {!member && profileLink && (
                                <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg space-y-2">
                                    <Label className="text-green-800 dark:text-green-200">Profile Update Link Generated</Label>
                                    <div className="flex gap-2">
                                        <Input value={profileLink} readOnly className="font-mono text-sm" />
                                        <Button type="button" variant="outline" onClick={handleCopyLink}>
                                            Copy
                                        </Button>
                                    </div>
                                    <p className="text-sm text-green-700 dark:text-green-300">
                                        Share this link with the member to complete their profile. It expires in 30 days.
                                    </p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {member ? "Update Member" : "Create Member"}
                                </Button>
                            </div>
                        </form>
                    </TabsContent>

                    {/* Profile Link Tab (only for existing members) */}
                    {member && (
                        <TabsContent value="link" className="space-y-4">
                            <div className="space-y-4 mt-4">
                                {profileLink ? (
                                    <>
                                        <div className="p-4 bg-muted rounded-lg space-y-2">
                                            <Label>Current Profile Update Link</Label>
                                            <div className="flex gap-2">
                                                <Input value={profileLink} readOnly className="font-mono text-sm" />
                                                <Button type="button" variant="outline" onClick={handleCopyLink}>
                                                    Copy
                                                </Button>
                                            </div>
                                            {member.profile_update_token_expires_at && (
                                                <p className="text-sm text-muted-foreground">
                                                    Expires: {format(new Date(member.profile_update_token_expires_at), "PPP p")}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <Label>Send Link To Member</Label>
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id="email-channel"
                                                        checked={linkChannels.includes('email')}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                setLinkChannels([...linkChannels, 'email']);
                                                            } else {
                                                                setLinkChannels(linkChannels.filter(c => c !== 'email'));
                                                            }
                                                        }}
                                                        disabled={!member.email}
                                                    />
                                                    <Label htmlFor="email-channel" className="cursor-pointer">
                                                        Email {member.email ? `(${member.email})` : '(not available)'}
                                                    </Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id="sms-channel"
                                                        checked={linkChannels.includes('sms')}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                setLinkChannels([...linkChannels, 'sms']);
                                                            } else {
                                                                setLinkChannels(linkChannels.filter(c => c !== 'sms'));
                                                            }
                                                        }}
                                                        disabled={!member.phone}
                                                    />
                                                    <Label htmlFor="sms-channel" className="cursor-pointer">
                                                        SMS {member.phone ? `(${member.phone})` : '(not available)'}
                                                    </Label>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={handleSendLink}
                                                disabled={linkChannels.length === 0 || sendingLink}
                                                className="w-full"
                                            >
                                                {sendingLink && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                <Send className="mr-2 h-4 w-4" />
                                                Send Profile Link
                                            </Button>
                                        </div>

                                        <Button
                                            variant="outline"
                                            onClick={handleGenerateLink}
                                            disabled={loading}
                                            className="w-full"
                                        >
                                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Regenerate Link
                                        </Button>
                                    </>
                                ) : (
                                    <div className="text-center py-8 space-y-4">
                                        <p className="text-muted-foreground">No active profile update link</p>
                                        <Button onClick={handleGenerateLink} disabled={loading}>
                                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Generate Profile Link
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    )}
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}