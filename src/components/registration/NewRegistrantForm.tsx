// src/components/registration/NewRegistrantForm.tsx
import { User, Mail, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RegistrantType } from '@/types/registration';

interface Props {
    registrantType: RegistrantType;
    formData: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
    };
    onChange: (field: string, value: string) => void;
    errors?: Record<string, string>;
}

export function NewRegistrantForm({ registrantType, formData, onChange, errors }: Props) {
    if (registrantType === 'existing_member') {
        return null;
    }

    const isFirstTimer = registrantType === 'first_timer';
    const isGuest = registrantType === 'guest';

    return (
        <div className="space-y-4">
            <Alert variant={isFirstTimer ? 'default' : isGuest ? 'default' : 'default'}
                   className={
                       isFirstTimer ? 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800' :
                           isGuest ? 'bg-muted' :
                               'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
                   }
            >
                <AlertDescription className={
                    isFirstTimer ? 'text-orange-700 dark:text-orange-300' :
                        isGuest ? 'text-muted-foreground' :
                            'text-blue-700 dark:text-blue-300'
                }>
                    {isFirstTimer && '👋 This person will be added as a first-time visitor and can be followed up.'}
                    {isGuest && '📝 Guest information will only be used for this registration.'}
                    {registrantType === 'new_member' && '✨ This person will be added as a new church member.'}
                </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div className="space-y-2">
                    <Label htmlFor="firstName">
                        First Name <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            id="firstName"
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => onChange('firstName', e.target.value)}
                            className={`pl-10 ${errors?.firstName ? 'border-destructive' : ''}`}
                            placeholder="Enter first name"
                        />
                    </div>
                    {errors?.firstName && (
                        <p className="text-sm text-destructive">{errors.firstName}</p>
                    )}
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                    <Label htmlFor="lastName">
                        Last Name <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            id="lastName"
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => onChange('lastName', e.target.value)}
                            className={`pl-10 ${errors?.lastName ? 'border-destructive' : ''}`}
                            placeholder="Enter last name"
                        />
                    </div>
                    {errors?.lastName && (
                        <p className="text-sm text-destructive">{errors.lastName}</p>
                    )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => onChange('email', e.target.value)}
                            className={`pl-10 ${errors?.email ? 'border-destructive' : ''}`}
                            placeholder="email@example.com"
                        />
                    </div>
                    {errors?.email && (
                        <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => onChange('phone', e.target.value)}
                            className="pl-10"
                            placeholder="+234 xxx xxx xxxx"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}