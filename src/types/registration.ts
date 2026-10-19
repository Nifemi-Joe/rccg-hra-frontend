// src/types/registration.ts

export type RegistrantType = 'existing_member' | 'new_member' | 'first_timer' | 'guest';
export type NotificationChannel = 'email' | 'sms' | 'whatsapp';

export interface RegistrantSearchResult {
    id: string;
    type: 'member' | 'first_timer';
    firstName: string;
    lastName: string;
    fullName: string;
    email?: string;
    phone?: string;
    profileImageUrl?: string;
    status: string;
    membershipDate?: string;
}

export interface EventOption {
    id: string;
    name: string;
    startDate: string;
    endDate?: string;
    locationType: string;
    locationName?: string;
    allowGuestCheckin: boolean;
    isRegistrationRequired: boolean;
    maxRegistrations?: number;
    currentRegistrations: number;
    isPaid: boolean;
    price?: number;
    currency?: string;
}

export interface EventInstance {
    id: string;
    date: string;
    startTime: string;
    endTime?: string;
    status?: string;
    locationName?: string;
    currentRegistrations: number;
    maxRegistrations?: number;
}

export interface TicketType {
    id: string;
    name: string;
    description?: string;
    price: number;
    currency: string;
    available?: number;
}

export interface ManualRegistrationForm {
    eventId: string;
    eventInstanceId?: string;
    registrantType: RegistrantType;
    memberId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    sendNotification: boolean;
    notificationChannels: NotificationChannel[];
    notes?: string;
}

export interface RegistrationResponse {
    success: boolean;
    registration: {
        id: string;
        confirmationCode: string;
        eventName: string;
        eventDate: string;
        registrantName: string;
        registrantType: RegistrantType;
    };
    newRecordCreated?: {
        type: 'member' | 'first_timer';
        id: string;
    };
    notificationsSent?: {
        channel: NotificationChannel;
        success: boolean;
        error?: string;
    }[];
}

export interface RegistrationStats {
    total: number;
    members: number;
    guests: number;
    checkedIn: number;
    cancelled: number;
    pending: number;
    confirmed: number;
    byDate: { date: string; count: number }[];
}

export interface EventAttendee {
    registrationId: string;
    memberId?: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    avatar?: string;
    isCheckedIn: boolean;
    checkInTime?: string;
    registeredAt: string;
    type: 'member' | 'guest';
    status: 'confirmed' | 'pending' | 'cancelled';
}

export interface QuickCheckInMember {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    avatar?: string;
    membershipDate?: string;
}

export interface WalkInForm {
    type: 'first_timer' | 'guest';
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    gender?: 'male' | 'female';
    isFirstTimer: boolean;
}

export interface CheckInResult {
    registrationId: string;
    registrantName: string;
    checkInTime: string;
    newRecord?: {
        type: 'first_timer' | 'guest';
        id: string;
    };
}

export interface ProfileFormData {
    recordType: 'member' | 'first_timer';
    recordId: string;
    churchId: string;
    churchName: string;
    currentData: {
        firstName: string;
        lastName: string;
        email?: string;
        phone?: string;
        dateOfBirth?: string;
        gender?: string;
        maritalStatus?: string;
        weddingAnniversary?: string;
        address?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        howDidYouHear?: string;
        interests?: string[];
        prayerRequest?: string;
    };
    requiredFields: string[];
    optionalFields: string[];
}