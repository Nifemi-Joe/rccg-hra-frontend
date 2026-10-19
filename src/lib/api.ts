// src/lib/api.ts

import { AuditLog } from "@/types/auditLog.ts";
import {
    Member,
    CreateMemberDTO,
    UpdateMemberDTO,
    UpdateMemberProfileDTO,
    MemberFilters,
    PaginatedMembers,
    MemberStatistics,
    ProfileUpdateLink,
    Celebration,
    CelebrationFilters,
    CelebrationsResponse,
    MemberSearchResult,
    BulkMemberOperationResult,
    ImportMemberDTO,
    ExportMemberDTO,
    ProfileLinkSendOptions,
    DuplicateMemberCheck,
    MemberActivitySummary,
} from '@/types/member.ts';
import { sessionExpiredEvent } from '@/components/modals/SessionExpiredModal';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: unknown;
    headers?: Record<string, string>;
    params?: Record<string, any>;
}

interface ApiResponse<T = unknown> {
    success?: boolean;
    status?: string;
    message?: string;
    data?: T;
    [key: string]: unknown;
}

interface ErrorResponse {
    success?: boolean;
    status?: string;
    message: string;
    errors?: unknown;
    stack?: string;
}

// User interface
export interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
    country?: string;
    membership_size?: string;
    role: string;
    role_display?: string;
    status: string;
    profile_completed: boolean;
    must_reset_password: boolean;
    is_temporary_password: boolean;
    email_verified: boolean;
    church_id: string;
    created_at: string;
    updated_at: string;
}

// Church interface
export interface Church {
    id: string;
    name: string;
    slug: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    phone?: string;
    website?: string;
    logo_url?: string;
    timezone: string;
    currency: string;
    subscription_plan: string;
    subscription_status: string;
    setup_status: 'pending_admin' | 'active';
    admin_setup_skipped: boolean;
    trial_ends_at?: string;
    created_at: string;
    updated_at: string;
}

// Login response
export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
    church: Church;
    mustResetPassword: boolean;
}

// Setup admin response
export interface SetupAdminResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
    church: Church;
    skipped?: boolean;
    message?: string;
}

// First login reset password response
export interface FirstLoginResetPasswordResponse {
    message: string;
    user: User;
    accessToken: string;
    refreshToken: string;
}

export interface FirstTimer {
    id: string;
    church_id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    gender?: 'male' | 'female' | 'other';
    date_of_birth?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    first_visit_date: string;
    how_did_you_hear?: string;
    invited_by?: string;
    interests?: string[];
    prayer_request?: string;
    wants_follow_up: boolean;
    follow_up_status: 'pending' | 'contacted' | 'scheduled' | 'completed' | 'no_response';
    follow_up_assigned_to?: string;
    follow_up_date?: string;
    follow_up_notes?: string;
    last_contacted_at?: string;
    contact_attempts: number;
    status: 'new' | 'following_up' | 'regular_visitor' | 'converted' | 'inactive';
    conversion_eligible_date?: string;
    converted_to_member_id?: string;
    converted_at?: string;
    visit_count: number;
    last_visit_date?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface FirstTimerStatistics {
    total: number;
    newThisWeek: number;
    newThisMonth: number;
    pendingFollowUp: number;
    conversionEligible: number;
    converted: number;
    conversionRate: number;
    byStatus: {
        new: number;
        following_up: number;
        regular_visitor: number;
        converted: number;
        inactive: number;
    };
    bySource: Array<{ source: string; count: number }>;
    weeklyTrend: Array<{ week: string; count: number }>;
}

export interface CreateFirstTimerDTO {
    church_id?: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    gender?: 'male' | 'female' | 'other';
    date_of_birth?: Date | string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    first_visit_date?: Date | string;
    how_did_you_hear?: string;
    invited_by?: string;
    interests?: string[];
    prayer_request?: string;
    wants_follow_up?: boolean;
    interested_in_membership?: boolean;
    notes?: string;
    created_by?: string;
}

export interface UpdateFirstTimerDTO {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    gender?: 'male' | 'female' | 'other';
    date_of_birth?: Date | string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    how_did_you_hear?: string;
    invited_by?: string;
    interests?: string[];
    prayer_request?: string;
    wants_follow_up?: boolean;
    follow_up_status?: 'pending' | 'contacted' | 'scheduled' | 'completed' | 'no_response';
    follow_up_assigned_to?: string;
    follow_up_date?: Date | string;
    follow_up_notes?: string;
    status?: 'new' | 'following_up' | 'regular_visitor' | 'converted' | 'inactive';
    notes?: string;
    updated_by?: string;
}

export interface FirstTimerFilters {
    search?: string;
    status?: string;
    followUpStatus?: string;
    wantsFollowUp?: boolean;
    startDate?: string;
    endDate?: string;
    conversionEligible?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedFirstTimers {
    firstTimers: FirstTimer[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface ConversionSettings {
    conversionPeriodDays: number;
}

export interface GroupType {
    id: string;
    church_id: string;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    is_active: boolean;
    created_at: string;
}

export type ApprovalStatus = 'pending' | 'approved' | 'declined' | 'rejected';

export interface Group {
    id: string;
    church_id: string;
    name: string;
    description?: string;
    group_type_id?: string;
    group_type?: GroupType;
    leader_id?: string;
    leader?: {
        id: string;
        first_name: string;
        last_name: string;
        email?: string;
        phone?: string;
    };
    co_leader_id?: string;
    co_leader?: {
        id: string;
        first_name: string;
        last_name: string;
    };
// Approval fields
    approval_status: ApprovalStatus;
    approved_by?: string;
    approved_at?: Date;
    rejected_by?: string;
    rejected_at?: Date;
    rejection_reason?: string;

    // Meeting defaults
    default_meeting_day?: string;
    default_meeting_time?: string;
    default_meeting_type: 'physical' | 'online' | 'hybrid';

    // Physical location
    default_location_type: 'church' | 'custom';
    default_location_address?: string;
    default_location_city?: string;
    default_location_notes?: string;

    // Online meeting
    default_online_platform?: 'zoom' | 'google_meet' | 'microsoft_teams' | 'other';
    default_meeting_link?: string;
    default_meeting_id?: string;
    default_meeting_password?: string;

    cover_image_url?: string;
    is_active: boolean;
    is_public: boolean;
    max_members?: number;
    member_count: number;

    // Add members array for populated groups
    members?: Array<{
        id: string;
        first_name: string;
        last_name: string;
        email?: string;
        phone?: string;
        profile_image_url?: string;
        role?: 'leader' | 'co_leader' | 'secretary' | 'treasurer' | 'member';
        status?: 'active' | 'inactive' | 'pending';
        joined_at?: Date;
    }>;

    created_by?: string;
    created_at: Date;
    updated_at: Date;
    deleted_at?: Date;
}

export interface GroupMember {
    id: string;
    group_id: string;
    member_id: string;
    member?: {
        id: string;
        first_name: string;
        last_name: string;
        email?: string;
        phone?: string;
        profile_image_url?: string;
    };
    role: 'leader' | 'co_leader' | 'secretary' | 'treasurer' | 'member';
    status: 'active' | 'inactive' | 'pending';
    joined_at: Date;
    invited_by?: string;
    notes?: string;
    // Approval fields
    approval_status: ApprovalStatus;
    approved_by?: string;
    approved_at?: Date;
    rejected_by?: string;
    rejected_at?: Date;
    rejection_reason?: string;
}

export interface GroupMeeting {
    id: string;
    group_id: string;
    church_id: string;
    group?: {
        id: string;
        name: string;
    };
    title: string;
    description?: string;
    meeting_date: string;
    start_time: string;
    end_time?: string;
    timezone: string;
    meeting_type: 'physical' | 'online' | 'hybrid';
    location_type?: 'church' | 'custom';
    location_address?: string;
    location_city?: string;
    location_notes?: string;
    location_map_url?: string;
    online_platform?: 'zoom' | 'google_meet' | 'microsoft_teams' | 'other';
    meeting_link?: string;
    meeting_id?: string;
    meeting_passcode?: string;
    host_name?: string;
    dial_in_number?: string;
    additional_instructions?: string;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    is_recurring: boolean;
    recurrence_pattern?: string;
    shared_via_email: boolean;
    shared_via_sms: boolean;
    shared_via_whatsapp: boolean;
    created_at: string;
}

export interface CreateGroupDTO {
    name: string;
    description?: string;
    groupTypeId?: string;
    leaderId?: string;
    coLeaderId?: string;
    defaultMeetingDay?: string;
    defaultMeetingTime?: string;
    defaultMeetingType?: 'physical' | 'online' | 'hybrid';
    defaultLocationType?: 'church' | 'custom';
    defaultLocationAddress?: string;
    defaultLocationCity?: string;
    defaultLocationNotes?: string;
    defaultOnlinePlatform?: 'zoom' | 'google_meet' | 'microsoft_teams' | 'other';
    defaultMeetingLink?: string;
    defaultMeetingId?: string;
    defaultMeetingPassword?: string;
    isPublic?: boolean;
    maxMembers?: number;
}

export interface UpdateGroupDTO extends Partial<CreateGroupDTO> {
    isActive?: boolean;
}

export interface PendingApprovals {
    pendingGroups?: Array<Group>;
    pendingMembers?: Array<GroupMember & { group_name: string }>;
    totalPendingGroups?: number;
    totalPendingMembers?: number;

}

export interface CreateMeetingDTO {
    groupId: string;
    title: string;
    description?: string;
    meetingDate: string;
    startTime: string;
    endTime?: string;
    timezone?: string;
    meetingType: 'physical' | 'online' | 'hybrid';
    locationType?: 'church' | 'custom';
    locationAddress?: string;
    locationCity?: string;
    locationNotes?: string;
    locationMapUrl?: string;
    onlinePlatform?: 'zoom' | 'google_meet' | 'microsoft_teams' | 'other';
    meetingLink?: string;
    meetingId?: string;
    meetingPasscode?: string;
    hostName?: string;
    dialInNumber?: string;
    additionalInstructions?: string;
    isRecurring?: boolean;
    recurrencePattern?: string;
}

export interface GroupStatistics {
    totalGroups: number;
    activeGroups: number;
    totalMembers: number;
    upcomingMeetings: number;
    meetingsThisWeek: number;
    byType: Array<{ type: string; count: number }>;
    pendingGroupApprovals: number;
    pendingMemberApprovals: number;
}

export interface PaginatedGroups {
    groups: Group[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface GroupFilters {
    search?: string;
    typeId?: string;
    isActive?: boolean;
    leaderId?: string;
    approvalStatus?: ApprovalStatus | 'all';
    page?: number;
    limit?: number;
}

export interface Family {
    id: string;
    churchId: string;
    name: string;
    headId?: string;
    headName?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    homePhone?: string;
    email?: string;
    weddingAnniversary?: string;
    notes?: string;
    profileImageUrl?: string;
    isActive: boolean;
    memberCount?: number;
    createdAt: string;
    updatedAt: string;
}

export type FamilyRole =
    | 'father' | 'mother' | 'son' | 'daughter'
    | 'grandfather' | 'grandmother' | 'grandson' | 'granddaughter'
    | 'uncle' | 'aunt' | 'nephew' | 'niece' | 'cousin'
    | 'brother' | 'sister' | 'brother_in_law' | 'sister_in_law'
    | 'father_in_law' | 'mother_in_law'
    | 'stepfather' | 'stepmother' | 'stepson' | 'stepdaughter'
    | 'guardian' | 'ward' | 'other';

export interface FamilyMember {
    id: string;
    memberId: string;
    familyId: string;
    firstName: string;
    lastName: string;
    familyRole: FamilyRole;
    familyRoleOther?: string;
    email?: string;
    phone?: string;
    gender?: string;
    dateOfBirth?: string;
    profileImageUrl?: string;
    isHead: boolean;
}

export interface CreateFamilyDTO {
    name: string;
    headId?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    homePhone?: string;
    email?: string;
    weddingAnniversary?: string;
    notes?: string;
    members?: {
        memberId: string;
        familyRole: FamilyRole;
        familyRoleOther?: string;
        isHead?: boolean;
    }[];
}

export interface UpdateFamilyDTO {
    name?: string;
    headId?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    homePhone?: string;
    email?: string;
    weddingAnniversary?: string;
    notes?: string;
    isActive?: boolean;
}

export interface AddFamilyMemberDTO {
    memberId: string;
    familyRole: FamilyRole;
    familyRoleOther?: string;
    isHead?: boolean;
}

export interface FamilyStatistics {
    totalFamilies: number;
    activeFamilies: number;
    totalFamilyMembers: number;
    averageFamilySize: number;
    familiesWithBothParents: number;
    singleParentFamilies: number;
    recentlyAdded: number;
}

export interface FamilyFilters {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
}

export interface PaginatedFamilies {
    families: Family[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export type EventType = 'service' | 'meeting' | 'conference' | 'outreach' | 'fellowship' | 'workshop' | 'retreat' | 'concert' | 'other';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
export type LocationType = 'physical' | 'online' | 'hybrid';
export type OnlinePlatform = 'zoom' | 'google_meet' | 'microsoft_teams' | 'youtube' | 'facebook' | 'other';
export type InstanceStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
export type RegistrationStatus = 'pending' | 'confirmed' | 'cancelled' | 'attended' | 'no_show';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'free';

export interface Event {
    id: string;
    churchId: string;
    name: string;
    description?: string;
    eventType: EventType;
    recurrence: RecurrenceType;
    startDate: string;
    endDate?: string;
    startTime: string;
    endTime?: string;
    timezone: string;
    locationType: LocationType;
    locationName?: string;
    locationAddress?: string;
    locationCity?: string;
    locationMapUrl?: string;
    onlinePlatform?: OnlinePlatform;
    meetingLink?: string;
    meetingId?: string;
    meetingPassword?: string;
    streamUrl?: string;
    capacity?: number;
    isRegistrationRequired: boolean;
    registrationDeadline?: string;
    maxRegistrations?: number;
    currentRegistrations: number;
    isPaid: boolean;
    price?: number;
    currency: string;
    earlyBirdPrice?: number;
    earlyBirdDeadline?: string;
    bannerUrl?: string;
    thumbnailUrl?: string;
    qrCode: string;
    isActive: boolean;
    isPublic: boolean;
    isFeatured: boolean;
    allowSelfCheckin: boolean;
    allowGuestCheckin: boolean;
    requireApproval: boolean;
    sendReminders: boolean;
    reminderHours: number;
    groupId?: string;
    groupName?: string;
    tags?: string[];
    totalAttendance?: number;
    totalRegistrations?: number;
    totalRevenue?: number;
    createdAt: string;
    updatedAt: string;
}

export interface EventInstance {
    id: string;
    eventId: string;
    churchId: string;
    instanceDate: string;
    startTime: string;
    endTime?: string;
    locationName?: string;
    meetingLink?: string;
    notes?: string;
    qrCode: string;
    status: InstanceStatus;
    expectedAttendance?: number;
    totalAttendance: number;
    memberAttendance: number;
    guestAttendance: number;
    cancelledAt?: string;
    cancelledReason?: string;
    createdAt: string;
}

export interface EventRegistration {
    id: string;
    eventId: string;
    eventInstanceId?: string;
    churchId: string;
    memberId?: string;
    memberName?: string;
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
    ticketType: string;
    quantity: number;
    paymentStatus: PaymentStatus;
    paymentMethod?: string;
    paymentReference?: string;
    amountPaid?: number;
    status: RegistrationStatus;
    confirmationCode: string;
    qrCode: string;
    checkedIn: boolean;
    checkedInAt?: string;
    notes?: string;
    registeredAt: string;
}

export interface EventTicketType {
    id: string;
    eventId: string;
    name: string;
    description?: string;
    price: number;
    currency: string;
    quantityAvailable?: number;
    quantitySold: number;
    maxPerOrder: number;
    isActive: boolean;
}

export interface EventStatistics {
    totalEvents: number;
    activeEvents: number;
    upcomingEvents: number;
    paidEvents: number;
    onlineEvents: number;
    totalRegistrations: number;
    totalAttendance: number;
    totalRevenue: number;
    averageAttendance: number;
    topEvents: Array<{ id: string; name: string; attendance: number }>;
    byType: Array<{ type: string; count: number }>;
}

export interface CreateEventDTO {
    name: string;
    description?: string;
    eventType: EventType;
    recurrence?: RecurrenceType;
    startDate: string;
    endDate?: string;
    startTime: string;
    endTime?: string;
    timezone?: string;
    locationType?: LocationType;
    locationName?: string;
    locationAddress?: string;
    locationCity?: string;
    locationMapUrl?: string;
    onlinePlatform?: OnlinePlatform;
    meetingLink?: string;
    meetingId?: string;
    meetingPassword?: string;
    streamUrl?: string;
    capacity?: number;
    isRegistrationRequired?: boolean;
    registrationDeadline?: string;
    maxRegistrations?: number;
    isPaid?: boolean;
    price?: number;
    currency?: string;
    earlyBirdPrice?: number;
    earlyBirdDeadline?: string;
    bannerUrl?: string;
    thumbnailUrl?: string;
    isActive?: boolean;
    isPublic?: boolean;
    isFeatured?: boolean;
    allowSelfCheckin?: boolean;
    allowGuestCheckin?: boolean;
    requireApproval?: boolean;
    sendReminders?: boolean;
    reminderHours?: number;
    groupId?: string;
    tags?: string[];
    ticketTypes?: CreateTicketTypeDTO[];
}

export interface UpdateEventDTO extends Partial<CreateEventDTO> {}

export interface CreateEventInstanceDTO {
    eventId: string;
    instanceDate: string;
    startTime?: string;
    endTime?: string;
    locationName?: string;
    meetingLink?: string;
    notes?: string;
}

export interface CreateRegistrationDTO {
    eventId: string;
    eventInstanceId?: string;
    memberId?: string;
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
    ticketType?: string;
    quantity?: number;
    notes?: string;
    specialRequirements?: string;
}

export interface CreateTicketTypeDTO {
    name: string;
    description?: string;
    price: number;
    currency?: string;
    quantityAvailable?: number;
    maxPerOrder?: number;
    saleStartDate?: string;
    saleEndDate?: string;
}

export interface ShareEventDTO {
    shareType: 'email' | 'sms' | 'whatsapp';
    recipientIds?: string[];
    recipientEmails?: string[];
    recipientPhones?: string[];
    includeAllMembers?: boolean;
    includeGroupMembers?: boolean;
    groupId?: string;
    customMessage?: string;
    includeRegistrationLink?: boolean;
}

export interface CheckInDTO {
    qrCode?: string;
    registrationId?: string;
    eventInstanceId?: string;
    memberId?: string;
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
}

export interface EventFilters {
    search?: string;
    eventType?: EventType;
    locationType?: LocationType;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
    isPaid?: boolean;
    isFeatured?: boolean;
    groupId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedEvents {
    events: Event[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface ShareResult {
    success: boolean;
    message: string;
    shareMessage?: string;
    recipientCount: number;
}

export interface CheckInResult {
    success: boolean;
    message: string;
    registration?: EventRegistration;
    attendee?: {
        name: string;
        type: 'member' | 'guest';
    };
}

// Send Profile Link Response
export interface SendProfileLinkResponse {
    sent: string[];
    failed: string[];
}

// ============================================================================
// NO TOKEN ERROR - Custom error class to identify token errors
// ============================================================================

export class NoTokenError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NoTokenError';
    }
}

// ============================================================================
// API CLIENT CLASS
// ============================================================================

// Flag to prevent multiple modals from showing simultaneously
let isSessionExpiredModalShown = false;

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private getToken(): string | null {
        return localStorage.getItem('auth_token');
    }

    private buildUrl(endpoint: string, params?: Record<string, any>): string {
        const url = `${this.baseUrl}${endpoint}`;
        if (!params) return url;

        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, String(value));
            }
        });

        const queryString = searchParams.toString();
        return queryString ? `${url}?${queryString}` : url;
    }

    private handleNoTokenError(message: string): void {
        // Only show session expired modal if user is actually logged in
        // Don't show it on public pages like login, register, forgot-password etc.
        const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-otp', '/setup-admin', '/'];
        const currentPath = window.location.pathname;
        const isPublicPage = publicPaths.some(path => currentPath === path || currentPath.startsWith(path));

        if (isPublicPage) {
            // On public pages, just throw the error — don't show session modal
            return;
        }

        if (!isSessionExpiredModalShown) {
            isSessionExpiredModalShown = true;
            sessionExpiredEvent.emit();

            setTimeout(() => {
                isSessionExpiredModalShown = false;
            }, 5000);
        }
    }

    async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const { method = 'GET', body, headers = {}, params } = options;

        const token = this.getToken();
        const defaultHeaders: Record<string, string> = {};

        // Only set Content-Type if not FormData
        if (!(body instanceof FormData)) {
            defaultHeaders['Content-Type'] = 'application/json';
        }

        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
        }

        const url = this.buildUrl(endpoint, params);

        try {
            const fetchOptions: RequestInit = {
                method,
                headers: { ...defaultHeaders, ...headers },
            };

            // Handle body - don't stringify FormData
            if (body) {
                if (body instanceof FormData) {
                    fetchOptions.body = body;
                } else {
                    fetchOptions.body = JSON.stringify(body);
                }
            }

            const response = await fetch(url, fetchOptions);

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Server returned non-JSON response. Please check your API server.');
            }

            const data = await response.json();

            // ✅ CHECK FOR "No token provided" or similar auth errors
            if (
                data.status === 'error' &&
                (
                    data.message === 'No token provided' ||
                    data.message === 'Token expired' ||
                    data.message === 'Invalid token' ||
                    data.message === 'jwt expired' ||
                    data.message === 'jwt malformed' ||
                    data.message === 'Unauthorized'
                )
            ) {
                this.handleNoTokenError(data.message);
                throw new NoTokenError(data.message);
            }

            if (!response.ok) {
                const errorData = data as ErrorResponse;

                // Also check for 401 status codes
                if (response.status === 401) {
                    this.handleNoTokenError(errorData.message || 'Unauthorized');
                    throw new NoTokenError(errorData.message || 'Unauthorized');
                }

                throw new Error(errorData.message || 'An error occurred');
            }

            if (data.data !== undefined) {
                return data.data as T;
            }

            return data as T;
        } catch (error) {
            if (error instanceof NoTokenError) {
                throw error;
            }
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('An unexpected error occurred');
        }
    }

    get<T>(endpoint: string, options?: { params?: Record<string, any> }): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET', ...options });
    }

    post<T>(endpoint: string, body?: unknown, options?: { headers?: Record<string, string> }): Promise<T> {
        return this.request<T>(endpoint, { method: 'POST', body, ...options });
    }

    put<T>(endpoint: string, body?: unknown, options?: { headers?: Record<string, string> }): Promise<T> {
        return this.request<T>(endpoint, { method: 'PUT', body, ...options });
    }

    patch<T>(endpoint: string, body?: unknown, options?: { headers?: Record<string, string> }): Promise<T> {
        return this.request<T>(endpoint, { method: 'PATCH', body, ...options });
    }

    delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }
}

export const api = new ApiClient(API_BASE_URL);

// ============================================================================
// AUTH API
// ============================================================================

export const authApi = {
    login: (email: string, password: string) =>
        api.post<LoginResponse>('/auth/login', { email, password }),

    register: (data: { email: string; password: string; churchName: string }) =>
        api.post<{ message: string; email: string }>('/church/register', data),

    verifyOTP: (email: string, otp: string) =>
        api.post<{
            churchId: string;
            churchName: string;
            userId: string;
            email: string;
            verified: boolean;
            message: string;
        }>('/church/verify-otp', { email, otp }),

    resendOTP: (email: string) =>
        api.post<{ message: string }>('/church/resend-otp', { email }),

    setupAdmin: (data: {
        churchId: string;
        firstName: string;
        lastName: string;
        phoneNumber?: string;
        country?: string;
        membershipSize?: string;
        skipSetup?: boolean;
    }) => api.post<SetupAdminResponse>('/church/setup-admin', data),

    skipAdminSetup: (churchId: string) =>
        api.post<{ message: string; church: Church; skipped: boolean }>('/church/skip-admin-setup', { churchId }),

    firstLoginResetPassword: (userId: string, oldPassword: string, newPassword: string) =>
        api.post<FirstLoginResetPasswordResponse>('/auth/first-login-reset-password', {
            userId,
            oldPassword,
            newPassword,
        }),

    changePassword: (currentPassword: string, newPassword: string) =>
        api.post<{ message: string }>('/auth/change-password', {
            currentPassword,
            newPassword,
        }),

    verifyEmail: (token: string) =>
        api.post<{ message: string }>('/auth/verify-email', { token }),

    resendVerification: (email: string) =>
        api.post<{ message: string }>('/auth/resend-verification', { email }),

    forgotPassword: (email: string) =>
        api.post<{ message: string; email: string }>('/auth/forgot-password', { email }),

    verifyResetOTP: (email: string, otp: string) =>
        api.post<{ message: string; resetToken: string; email: string }>('/auth/verify-reset-otp', { email, otp }),

    resetPasswordWithToken: (resetToken: string, newPassword: string) =>
        api.post<{ message: string }>('/auth/reset-password', { resetToken, newPassword }),

    resendResetOTP: (email: string) =>
        api.post<{ message: string }>('/auth/resend-reset-otp', { email }),

    getCurrentUser: () =>
        api.get<{ user: User; church: Church }>('/auth/me'),

    logout: () =>
        api.post<{ message: string }>('/auth/logout', {}),

    refreshToken: (refreshToken: string) =>
        api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken }),
};

// ============================================================================
// CHURCH API
// ============================================================================

export const churchApi = {
    get: () => api.get<Church>('/church/me'),

    verifyOTP: (email: string, otp: string) =>
        api.post<{
            churchId: string;
            churchName: string;
            userId: string;
            email: string;
            verified: boolean;
            message: string;
        }>('/church/verify-otp', { email, otp }),

    update: (data: Partial<Church>) => api.put<Church>('/church/me', data),

    updateAddress: (data: {
        address?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
        latitude?: number;
        longitude?: number;
    }) => api.put<Church>('/church/me/address', data),

    updateCurrency: (currency: string) => api.put<Church>('/church/me/currency', { currency }),

    updateSettings: (settings: Record<string, any>) => api.put<Church>('/church/me/settings', { settings }),

    getBySlug: (slug: string) => api.get<Church>(`/church/slug/${slug}`),

    getById: (id: string) => api.get<Church>(`/church/${id}`),

    setupAdmin: (data: {
        churchId: string;
        firstName: string;
        lastName: string;
        phoneNumber?: string;
        country?: string;
        membershipSize?: string;
        skipSetup?: boolean;
    }) => api.post<SetupAdminResponse>('/church/setup-admin', data),

    skipAdminSetup: (churchId: string) =>
        api.post<{ message: string; church: Church; skipped: boolean }>('/church/skip-admin-setup', { churchId }),

    createAdditionalAdmin: (data: {
        email: string;
        firstName: string;
        lastName: string;
        phoneNumber?: string;
        role: 'admin' | 'pastor';
    }) => api.post<{ user: User; message: string; temporaryPassword?: string }>('/church/admins', data),
};

// ============================================================================
// MEMBERS API - COMPLETE WITH ALL NEW METHODS
// ============================================================================

export const membersApi = {
    getAll: (filters?: MemberFilters): Promise<PaginatedMembers> => {
        const params: Record<string, any> = {};

        if (filters?.search) params.search = filters.search;
        if (filters?.status) params.status = filters.status;
        if (filters?.gender) params.gender = filters.gender;
        if (filters?.maritalStatus) params.maritalStatus = filters.maritalStatus;
        if (filters?.familyId) params.familyId = filters.familyId;
        if (filters?.hasFamily !== undefined) params.hasFamily = filters.hasFamily;
        if (filters?.hasUserAccount !== undefined) params.hasUserAccount = filters.hasUserAccount;
        if (filters?.profileCompleted !== undefined) params.profileCompleted = filters.profileCompleted;
        if (filters?.page) params.page = filters.page;
        if (filters?.limit) params.limit = filters.limit;
        if (filters?.sortBy) params.sortBy = filters.sortBy;
        if (filters?.sortOrder) params.sortOrder = filters.sortOrder;

        return api.get<PaginatedMembers>('/members', { params });
    },

    getById: (id: string): Promise<Member> => {
        return api.get<Member>(`/members/${id}`);
    },

    create: (data: CreateMemberDTO, options?: { generateToken?: boolean }): Promise<{
        member: Member;
        profileLink?: ProfileUpdateLink;
    }> => {
        const body: any = { ...data };
        if (options?.generateToken) {
            body.sendProfileLink = true;
        }
        return api.post('/members', body);
    },

    update: (id: string, data: UpdateMemberDTO): Promise<Member> => {
        return api.put<Member>(`/members/${id}`, data);
    },

    delete: (id: string): Promise<{ message: string }> => {
        return api.delete<{ message: string }>(`/members/${id}`);
    },

    search: (query: string, limit: number = 10): Promise<MemberSearchResult[]> => {
        return api.get<MemberSearchResult[]>('/members/search', {
            params: { q: query, limit }
        });
    },

    searchByName: (firstName: string, lastName: string, limit: number = 5): Promise<Member[]> => {
        return api.get<Member[]>('/members/search-by-name', {
            params: { firstName, lastName, limit }
        });
    },

    getStatistics: (): Promise<MemberStatistics> => {
        return api.get<MemberStatistics>('/members/statistics');
    },

    getCelebrations: (filters?: CelebrationFilters): Promise<CelebrationsResponse> => {
        const params: Record<string, any> = {};

        if (filters?.type) params.type = filters.type;
        if (filters?.period) params.period = filters.period;
        if (filters?.days) params.days = filters.days;
        if (filters?.page) params.page = filters.page;
        if (filters?.limit) params.limit = filters.limit;

        return api.get<CelebrationsResponse>('/members/celebrations', { params });
    },

    generateProfileLink: (id: string): Promise<ProfileUpdateLink> => {
        return api.post<ProfileUpdateLink>(`/members/${id}/profile-link`, {});
    },

    sendProfileLink: (id: string, options: ProfileLinkSendOptions): Promise<SendProfileLinkResponse> => {
        return api.post<SendProfileLinkResponse>(`/members/${id}/send-profile-link`, options);
    },

    getMemberByToken: (token: string): Promise<Member> => {
        return api.get<Member>(`/members/profile-token/${token}`);
    },

    updateMemberViaToken: (token: string, data: UpdateMemberProfileDTO): Promise<Member> => {
        return api.put<Member>(`/members/profile-token/${token}`, data);
    },

    getAuditLogs: (id: string, page: number = 1, limit: number = 20): Promise<{
        logs: AuditLog[];
        pagination: { total: number; page: number; limit: number; totalPages: number };
    }> => {
        return api.get(`/members/${id}/audit-logs`, {
            params: { page, limit }
        });
    },

    getMyMemberProfile: (): Promise<Member> => {
        return api.get<Member>('/members/me');
    },

    updateMyProfile: (data: UpdateMemberProfileDTO): Promise<Member> => {
        return api.put<Member>('/members/me', data);
    },

    checkDuplicates: (data: {
        firstName: string;
        lastName: string;
        email?: string;
        phone?: string;
    }): Promise<DuplicateMemberCheck> => {
        return api.post<DuplicateMemberCheck>('/members/check-duplicates', data);
    },

    importMembers: (file: File, options?: {
        generateProfileLinks?: boolean;
        sendNotifications?: boolean;
    }): Promise<BulkMemberOperationResult> => {
        const formData = new FormData();
        formData.append('file', file);
        if (options?.generateProfileLinks) {
            formData.append('generateProfileLinks', 'true');
        }
        if (options?.sendNotifications) {
            formData.append('sendNotifications', 'true');
        }
        return api.post<BulkMemberOperationResult>('/members/import', formData);
    },

    exportMembers: (filters?: MemberFilters): Promise<Blob> => {
        const params: Record<string, any> = {};

        if (filters?.search) params.search = filters.search;
        if (filters?.status) params.status = filters.status;
        if (filters?.gender) params.gender = filters.gender;
        if (filters?.maritalStatus) params.maritalStatus = filters.maritalStatus;
        if (filters?.familyId) params.familyId = filters.familyId;
        if (filters?.hasFamily !== undefined) params.hasFamily = filters.hasFamily;
        if (filters?.profileCompleted !== undefined) params.profileCompleted = filters.profileCompleted;

        return api.get<Blob>('/members/export', { params });
    },

    getMemberActivity: (id: string): Promise<MemberActivitySummary> => {
        return api.get<MemberActivitySummary>(`/members/${id}/activity`);
    },

    linkUserAccount: (memberId: string, userId: string): Promise<Member> => {
        return api.post<Member>(`/members/${memberId}/link-user`, { userId });
    },

    unlinkUserAccount: (memberId: string): Promise<Member> => {
        return api.post<Member>(`/members/${memberId}/unlink-user`, {});
    },
};

// Member Self-Update API (for public profile updates)
export const memberSelfUpdateApi = {
    initiateUpdate: (memberId: string, channel: 'email' | 'phone'): Promise<any> => {
        return api.post('/member-self-update/initiate', { memberId, channel });
    },

    verifyOtp: (sessionId: string, otp: string): Promise<any> => {
        return api.post('/member-self-update/verify-otp', { sessionId, otp });
    },

    resendOtp: (sessionId: string): Promise<any> => {
        return api.post('/member-self-update/resend-otp', { sessionId });
    },

    lookupByName: (churchId: string, fullName: string): Promise<any> => {
        return api.post('/member-self-update/lookup-by-name', { churchId, fullName });
    },

    lookupByEmail: (churchId: string, email: string): Promise<any> => {
        return api.post('/member-self-update/lookup-by-email', { churchId, email });
    },

    confirmIdentity: (memberId: string, channel: 'email' | 'phone', value: string): Promise<any> => {
        return api.post('/member-self-update/confirm-identity', { memberId, channel, value });
    },

    getMemberByToken: (token: string): Promise<Member> => {
        return api.get(`/member-self-update/member/${token}`);
    },

    updateMember: (token: string, data: UpdateMemberProfileDTO): Promise<Member> => {
        return api.put(`/member-self-update/member/${token}`, data);
    },

    sendShareLink: (memberId: string, channel: 'email' | 'phone'): Promise<any> => {
        return api.post(`/member-self-update/share/${memberId}`, { channel });
    },

    getShareLink: (memberId: string): Promise<any> => {
        return api.get(`/member-self-update/share/${memberId}`);
    },
};

// ============================================================================
// FIRST TIMERS API
// ============================================================================

export const firstTimersApi = {
    getAll: (filters?: FirstTimerFilters) => {
        const searchParams = new URLSearchParams();
        if (filters?.search) searchParams.set('search', filters.search);
        if (filters?.status) searchParams.set('status', filters.status);
        if (filters?.followUpStatus) searchParams.set('followUpStatus', filters.followUpStatus);
        if (filters?.wantsFollowUp !== undefined) searchParams.set('wantsFollowUp', String(filters.wantsFollowUp));
        if (filters?.startDate) searchParams.set('startDate', filters.startDate);
        if (filters?.endDate) searchParams.set('endDate', filters.endDate);
        if (filters?.conversionEligible) searchParams.set('conversionEligible', 'true');
        if (filters?.page) searchParams.set('page', filters.page.toString());
        if (filters?.limit) searchParams.set('limit', filters.limit.toString());
        if (filters?.sortBy) searchParams.set('sortBy', filters.sortBy);
        if (filters?.sortOrder) searchParams.set('sortOrder', filters.sortOrder);
        const queryString = searchParams.toString();
        return api.get<PaginatedFirstTimers>(`/first-timers${queryString ? `?${queryString}` : ''}`);
    },

    getById: (id: string) => api.get<FirstTimer>(`/first-timers/${id}`),

    create: (data: CreateFirstTimerDTO) => api.post<FirstTimer>('/first-timers', data),

    update: (id: string, data: UpdateFirstTimerDTO) => api.put<FirstTimer>(`/first-timers/${id}`, data),

    delete: (id: string) => api.delete<{ message: string }>(`/first-timers/${id}`),

    getStatistics: () => api.get<FirstTimerStatistics>('/first-timers/statistics'),

    getConversionEligible: () => api.get<FirstTimer[]>('/first-timers/conversion-eligible'),

    getPendingFollowUps: () => api.get<FirstTimer[]>('/first-timers/pending-follow-ups'),

    recordVisit: (id: string, visitDate?: string) =>
        api.post<FirstTimer>(`/first-timers/${id}/visit`, { visitDate }),

    recordContact: (id: string, notes?: string) =>
        api.post<FirstTimer>(`/first-timers/${id}/contact`, { notes }),

    convertToMember: (id: string, additionalData?: {
        maritalStatus?: string;
        weddingAnniversary?: string;
        postalCode?: string;
        notes?: string;
    }) => api.post<{ member: Member; firstTimer: FirstTimer }>(`/first-timers/${id}/convert`, { additionalData }),

    getConversionSettings: () => api.get<ConversionSettings>('/first-timers/settings/conversion'),

    updateConversionSettings: (conversionPeriodDays: number) =>
        api.put<ConversionSettings>('/first-timers/settings/conversion', { conversionPeriodDays }),
};

// ============================================================================
// GROUPS API
// ============================================================================

export const groupsApi = {
    // ========================================================================
    // GROUPS CRUD
    // ========================================================================
    getAll: (filters?: GroupFilters) => {
        const searchParams = new URLSearchParams();
        if (filters?.search) searchParams.set('search', filters.search);
        if (filters?.typeId) searchParams.set('typeId', filters.typeId);
        if (filters?.isActive !== undefined) searchParams.set('isActive', String(filters.isActive));
        if (filters?.leaderId) searchParams.set('leaderId', filters.leaderId);
        if (filters?.approvalStatus && filters.approvalStatus !== 'all') {
            searchParams.set('approvalStatus', filters.approvalStatus);
        }
        if (filters?.page) searchParams.set('page', filters.page.toString());
        if (filters?.limit) searchParams.set('limit', filters.limit.toString());
        const queryString = searchParams.toString();
        return api.get<PaginatedGroups>(`/groups${queryString ? `?${queryString}` : ''}`);
    },

    getById: (id: string) => api.get<Group>(`/groups/${id}`),

    create: (data: CreateGroupDTO) => api.post<Group>('/groups', data),

    update: (id: string, data: UpdateGroupDTO) => api.put<Group>(`/groups/${id}`, data),

    delete: (id: string) => api.delete<{ message: string }>(`/groups/${id}`),

    // ========================================================================
    // STATISTICS
    // ========================================================================
    getStatistics: () => api.get<GroupStatistics>('/groups/statistics'),

    // ========================================================================
    // GROUP TYPES
    // ========================================================================
    getTypes: () => api.get<GroupType[]>('/groups/types'),

    createType: (data: { name: string; description?: string; icon?: string; color?: string }) =>
        api.post<GroupType>('/groups/types', data),

    updateType: (typeId: string, data: { name?: string; description?: string; icon?: string; color?: string }) =>
        api.put<GroupType>(`/groups/types/${typeId}`, data),

    deleteType: (typeId: string) => api.delete<{ message: string }>(`/groups/types/${typeId}`),

    // ========================================================================
    // GROUP MEMBERS
    // ========================================================================
    getMembers: (groupId: string, filters?: { approvalStatus?: string }) => {
        const searchParams = new URLSearchParams();
        if (filters?.approvalStatus && filters.approvalStatus !== 'all') {
            searchParams.set('approvalStatus', filters.approvalStatus);
        }
        const queryString = searchParams.toString();
        return api.get<GroupMember[]>(`/groups/${groupId}/members${queryString ? `?${queryString}` : ''}`);
    },

    addMember: (groupId: string, data: { memberId: string; role?: string }) =>
        api.post<GroupMember>(`/groups/${groupId}/members`, data),

    updateMemberRole: (groupId: string, memberId: string, role: string) =>
        api.patch<GroupMember>(`/groups/${groupId}/members/${memberId}`, { role }),

    removeMember: (groupId: string, memberId: string) =>
        api.delete<{ message: string }>(`/groups/${groupId}/members/${memberId}`),

    getMemberGroups: (memberId: string) => api.get<Group[]>(`/groups/member/${memberId}`),

    // ========================================================================
    // MEETINGS - Global
    // ========================================================================
    getAllMeetings: (options?: { upcoming?: boolean; startDate?: string; endDate?: string }) => {
        const searchParams = new URLSearchParams();
        if (options?.upcoming) searchParams.set('upcoming', 'true');
        if (options?.startDate) searchParams.set('startDate', options.startDate);
        if (options?.endDate) searchParams.set('endDate', options.endDate);
        const queryString = searchParams.toString();
        return api.get<GroupMeeting[]>(`/groups/meetings${queryString ? `?${queryString}` : ''}`);
    },

    createMeeting: (data: CreateMeetingDTO) => api.post<GroupMeeting>('/groups/meetings', data),

    // ========================================================================
    // MEETINGS - Per group
    // ========================================================================
    getGroupMeetings: (groupId: string, options?: { upcoming?: boolean; limit?: number }) => {
        const searchParams = new URLSearchParams();
        if (options?.upcoming) searchParams.set('upcoming', 'true');
        if (options?.limit) searchParams.set('limit', options.limit.toString());
        const queryString = searchParams.toString();
        return api.get<GroupMeeting[]>(`/groups/${groupId}/meetings${queryString ? `?${queryString}` : ''}`);
    },

    getMeeting: (groupId: string, meetingId: string) =>
        api.get<GroupMeeting>(`/groups/${groupId}/meetings/${meetingId}`),

    updateMeeting: (groupId: string, meetingId: string, data: Partial<CreateMeetingDTO>) =>
        api.put<GroupMeeting>(`/groups/${groupId}/meetings/${meetingId}`, data),

    cancelMeeting: (groupId: string, meetingId: string, reason?: string) =>
        api.post<GroupMeeting>(`/groups/${groupId}/meetings/${meetingId}/cancel`, { reason }),

    deleteMeeting: (groupId: string, meetingId: string) =>
        api.delete<{ message: string }>(`/groups/${groupId}/meetings/${meetingId}`),

    shareMeeting: (groupId: string, meetingId: string, data: {
        shareVia: 'email' | 'sms' | 'whatsapp';
        recipientIds?: string[];
        customMessage?: string;
        includeAllMembers?: boolean;
    }) => api.post<{ success: boolean; message: string }>(
        `/groups/${groupId}/meetings/${meetingId}/share`, data
    ),

    // ========================================================================
    // APPROVALS - Maker/Checker
    // ========================================================================
    getPendingApprovals: () =>
        api.get<PendingApprovals>('/groups/approvals/pending'),

    approveGroup: (groupId: string) =>
        api.post<Group>(`/groups/approvals/groups/${groupId}/approve`),

    rejectGroup: (groupId: string, reason: string) =>
        api.post<Group>(`/groups/approvals/groups/${groupId}/reject`, { reason }),

    approveGroupMember: (groupId: string, memberId: string) =>
        api.post<GroupMember>(`/groups/approvals/groups/${groupId}/members/${memberId}/approve`),

    rejectGroupMember: (groupId: string, memberId: string, reason: string) =>
        api.post<GroupMember>(
            `/groups/approvals/groups/${groupId}/members/${memberId}/reject`,
            { reason }
        ),
};
// ============================================================================
// FAMILIES API
// ============================================================================

export const familiesApi = {
    getAll: (filters: FamilyFilters = {}): Promise<PaginatedFamilies> => {
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.isActive !== undefined) params.append('isActive', String(filters.isActive));
        if (filters.page) params.append('page', String(filters.page));
        if (filters.limit) params.append('limit', String(filters.limit));
        return api.get<PaginatedFamilies>(`/families?${params.toString()}`);
    },

    getById: (id: string): Promise<Family> => {
        return api.get<Family>(`/families/${id}`);
    },

    create: (data: CreateFamilyDTO): Promise<Family> => {
        return api.post<Family>('/families', data);
    },

    update: (id: string, data: UpdateFamilyDTO): Promise<Family> => {
        return api.put<Family>(`/families/${id}`, data);
    },

    delete: (id: string): Promise<void> => {
        return api.delete<void>(`/families/${id}`);
    },

    getMembers: (familyId: string): Promise<FamilyMember[]> => {
        return api.get<FamilyMember[]>(`/families/${familyId}/members`);
    },

    addMember: (familyId: string, data: AddFamilyMemberDTO): Promise<FamilyMember[]> => {
        return api.post<FamilyMember[]>(`/families/${familyId}/members`, data);
    },

    updateMember: (
        familyId: string,
        memberId: string,
        data: { familyRole?: FamilyRole; familyRoleOther?: string; isHead?: boolean }
    ): Promise<FamilyMember[]> => {
        return api.put<FamilyMember[]>(`/families/${familyId}/members/${memberId}`, data);
    },

    removeMember: (familyId: string, memberId: string): Promise<FamilyMember[]> => {
        return api.delete<FamilyMember[]>(`/families/${familyId}/members/${memberId}`);
    },

    getStatistics: (): Promise<FamilyStatistics> => {
        return api.get<FamilyStatistics>('/families/statistics');
    },
};

// ============================================================================
// EVENTS API
// ============================================================================

export const eventsApi = {
    getAll: (filters: EventFilters = {}): Promise<PaginatedEvents> => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                params.append(key, String(value));
            }
        });
        return api.get<PaginatedEvents>(`/events?${params.toString()}`);
    },

    getById: (id: string): Promise<Event> => {
        return api.get<Event>(`/events/${id}`);
    },

    create: (data: CreateEventDTO): Promise<Event> => {
        return api.post<Event>('/events', data);
    },

    update: (id: string, data: UpdateEventDTO): Promise<Event> => {
        return api.put<Event>(`/events/${id}`, data);
    },

    delete: (id: string): Promise<void> => {
        return api.delete<void>(`/events/${id}`);
    },

    getQRCode: (id: string): Promise<{ qrCode: string }> => {
        return api.get<{ qrCode: string }>(`/events/${id}/qr-code`);
    },

    start: (id: string): Promise<EventInstance> => {
        return api.post<EventInstance>(`/events/${id}/start`, {});
    },

    share: (id: string, data: ShareEventDTO): Promise<ShareResult> => {
        return api.post<ShareResult>(`/events/${id}/share`, data);
    },

    getStatistics: (): Promise<EventStatistics> => {
        return api.get<EventStatistics>('/events/statistics');
    },

    createInstance: (data: CreateEventInstanceDTO): Promise<EventInstance> => {
        return api.post<EventInstance>('/events/instances', data);
    },

    getInstances: (eventId: string, options?: { upcoming?: boolean; limit?: number }): Promise<EventInstance[]> => {
        const params = new URLSearchParams();
        if (options?.upcoming) params.append('upcoming', 'true');
        if (options?.limit) params.append('limit', String(options.limit));
        return api.get<EventInstance[]>(`/events/${eventId}/instances?${params.toString()}`);
    },

    getInstance: (instanceId: string): Promise<EventInstance> => {
        return api.get<EventInstance>(`/events/instances/${instanceId}`);
    },

    updateInstance: (instanceId: string, data: Partial<CreateEventInstanceDTO>): Promise<EventInstance> => {
        return api.put<EventInstance>(`/events/instances/${instanceId}`, data);
    },

    getInstanceQRCode: (instanceId: string): Promise<{ qrCode: string }> => {
        return api.get<{ qrCode: string }>(`/events/instances/${instanceId}/qr-code`);
    },

    register: (data: CreateRegistrationDTO): Promise<EventRegistration> => {
        return api.post<EventRegistration>('/events/registrations', data);
    },

    getRegistrations: (eventId: string, options?: {
        status?: string;
        paymentStatus?: string;
        page?: number;
        limit?: number;
    }): Promise<{ registrations: EventRegistration[]; total: number }> => {
        const params = new URLSearchParams();
        if (options?.status) params.append('status', options.status);
        if (options?.paymentStatus) params.append('paymentStatus', options.paymentStatus);
        if (options?.page) params.append('page', String(options.page));
        if (options?.limit) params.append('limit', String(options.limit));
        return api.get<{ registrations: EventRegistration[]; total: number }>(
            `/events/${eventId}/registrations?${params.toString()}`
        );
    },

    cancelRegistration: (registrationId: string): Promise<void> => {
        return api.delete<void>(`/events/registrations/${registrationId}`);
    },

    processPayment: (registrationId: string, data: {
        paymentStatus: string;
        paymentReference?: string;
        amountPaid?: number;
        transactionId?: string;
        paymentMethod?: string;
    }): Promise<EventRegistration> => {
        return api.post<EventRegistration>(`/events/registrations/${registrationId}/payment`, data);
    },

    getTicketTypes: (eventId: string): Promise<EventTicketType[]> => {
        return api.get<EventTicketType[]>(`/events/${eventId}/ticket-types`);
    },

    checkIn: (data: CheckInDTO): Promise<CheckInResult> => {
        return api.post<CheckInResult>('/events/check-in', data);
    },

    publicCheckIn: (qrCode: string, data?: Partial<CheckInDTO>): Promise<CheckInResult> => {
        return api.post<CheckInResult>(`/events/checkin/${qrCode}`, data || {});
    },
};

// ============================================================================
// ATTENDANCE API
// ============================================================================

export const attendanceApi = {
    checkIn: (data: { eventId: string; memberId?: string; guestName?: string; guestEmail?: string; guestPhone?: string }) =>
        api.post<unknown>('/attendance/check-in', data),

    getByEvent: (eventId: string) => api.get<unknown[]>(`/attendance/event/${eventId}`),

    scanQR: (qrCode: string) => api.post<unknown>('/attendance/scan', { qrCode }),
};

// ============================================================================
// FINANCIALS API
// ============================================================================

export const financialsApi = {
    getTransactions: () => api.get<unknown[]>('/financials/transactions'),

    createTransaction: (data: unknown) => api.post<unknown>('/financials/transactions', data),

    recordOffering: (data: unknown) => api.post<unknown>('/financials/offering', data),

    recordTithe: (data: unknown) => api.post<unknown>('/financials/tithe', data),

    recordDonation: (data: unknown) => api.post<unknown>('/financials/donation', data),

    recordExpense: (data: unknown) => api.post<unknown>('/financials/expense', data),

    getAccounts: () => api.get<unknown[]>('/financials/accounts'),

    createAccount: (data: unknown) => api.post<unknown>('/financials/accounts', data),

    updateAccount: (id: string, data: unknown) => api.put<unknown>(`/financials/accounts/${id}`, data),

    deleteAccount: (id: string) => api.delete<{ message: string }>(`/financials/accounts/${id}`),

    getOfferingItems: () => api.get<unknown[]>('/financials/offering-items'),

    createOfferingItem: (data: unknown) => api.post<unknown>('/financials/offering-items', data),

    getSummary: (startDate: string, endDate: string) =>
        api.get<unknown>(`/financials/summary?startDate=${startDate}&endDate=${endDate}`),
};

// ============================================================================
// REPORTS API
// ============================================================================

export const reportsApi = {
    attendanceTrends: (filters: Record<string, string>) =>
        api.get<unknown[]>(`/reports/attendance-trends?${new URLSearchParams(filters)}`),

    memberGrowth: (filters: Record<string, string>) =>
        api.get<unknown[]>(`/reports/member-growth?${new URLSearchParams(filters)}`),

    financialSummary: (filters: Record<string, string>) =>
        api.get<unknown[]>(`/reports/financial-summary?${new URLSearchParams(filters)}`),

    firstTimerConversion: (filters: Record<string, string>) =>
        api.get<unknown[]>(`/reports/first-timer-conversion?${new URLSearchParams(filters)}`),

    inactiveMembers: (filters: Record<string, string>) =>
        api.get<unknown[]>(`/reports/inactive-members?${new URLSearchParams(filters)}`),

    eventPerformance: (filters: Record<string, string>) =>
        api.get<unknown[]>(`/reports/event-performance?${new URLSearchParams(filters)}`),

    serviceReport: (eventInstanceId: string) =>
        api.get<unknown>(`/reports/service/${eventInstanceId}`),
};

// ============================================================================
// SERVICE REPORTS API
// ============================================================================

export const serviceReportsApi = {
    getAll: () => api.get<unknown[]>('/service-reports'),

    getById: (id: string) => api.get<unknown>(`/service-reports/${id}`),

    create: (data: unknown) => api.post<unknown>('/service-reports', data),

    update: (id: string, data: unknown) => api.put<unknown>(`/service-reports/${id}`, data),

    delete: (id: string) => api.delete<{ message: string }>(`/service-reports/${id}`),

    getStats: () => api.get<unknown>('/service-reports/stats'),
};

// ============================================================================
// NOTIFICATIONS API
// ============================================================================

export const notificationsApi = {
    subscribe: (subscription: unknown, locationEnabled?: boolean) =>
        api.post<{ subscriptionId: string }>('/notifications/subscribe', { subscription, locationEnabled }),

    unsubscribe: (endpoint?: string) =>
        api.post<{ message: string }>('/notifications/unsubscribe', { endpoint }),

    send: (data: { memberId?: string; churchId?: string; payload: unknown }) =>
        api.post<{ sent: number; failed: number }>('/notifications/send', data),

    sendEventReminder: (eventId: string, eventName: string, eventTime: string) =>
        api.post<{ sent: number; failed: number }>('/notifications/event-reminder', { eventId, eventName, eventTime }),

    sendProximityAlert: (message: string) =>
        api.post<{ sent: number; failed: number }>('/notifications/proximity-alert', { message }),

    getVapidKey: () => api.get<{ publicKey: string }>('/notifications/vapid-key'),
};

export default api;