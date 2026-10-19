// src/dtos/member.types.ts

/**
 * Base type definitions
 */
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed';
export type Gender = 'male' | 'female' | 'other';
export type MemberStatus = 'active' | 'inactive' | 'suspended';
export type RegistrationType = 'manual' | 'qr_code' | 'import' | 'self_registration';

export type FamilyRole =
    | 'father'
    | 'mother'
    | 'son'
    | 'daughter'
    | 'grandfather'
    | 'grandmother'
    | 'grandson'
    | 'granddaughter'
    | 'uncle'
    | 'aunt'
    | 'nephew'
    | 'niece'
    | 'cousin'
    | 'brother'
    | 'sister'
    | 'brother_in_law'
    | 'sister_in_law'
    | 'father_in_law'
    | 'mother_in_law'
    | 'stepfather'
    | 'stepmother'
    | 'stepson'
    | 'stepdaughter'
    | 'guardian'
    | 'ward'
    | 'other';

export type EntityType = 'member' | 'event' | 'attendance' | 'user' | 'family';
export type AuditAction =
    | 'create'
    | 'update'
    | 'delete'
    | 'profile_link_generated'
    | 'profile_updated'
    | 'profile_link_sent';
export type ActorType = 'admin' | 'member' | 'system';

/**
 * Main Member interface
 */
export interface Member {
    id: string;
    church_id: string;
    user_id?: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    gender?: Gender;
    marital_status?: MaritalStatus;
    date_of_birth?: Date | string;
    wedding_anniversary?: Date | string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    profile_image_url?: string;
    registration_type: RegistrationType;
    status: MemberStatus;
    notes?: string;

    // Profile update link fields
    profile_update_token?: string;
    profile_update_token_expires_at?: Date | string;
    profile_completed_at?: Date | string;

    // Family relationship fields
    family_id?: string;
    family_role?: FamilyRole;
    family_role_other?: string;

    // Additional fields
    occupation?: string;
    employer?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    emergency_contact_relationship?: string;
    baptism_date?: Date | string;
    salvation_date?: Date | string;
    membership_date?: Date | string;

    // Metadata
    created_by?: string;
    updated_by?: string;
    created_at: Date | string;
    updated_at: Date | string;
    deleted_at?: Date | string;
}

/**
 * Create Member DTO
 */
export interface CreateMemberDTO {
    churchId: string;
    userId?: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    gender?: Gender;
    maritalStatus?: MaritalStatus;
    dateOfBirth?: Date | string;
    weddingAnniversary?: Date | string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    profileImageUrl?: string;
    registrationType?: RegistrationType;
    status?: MemberStatus;
    notes?: string;

    // Family fields
    familyId?: string;
    familyRole?: FamilyRole;
    familyRoleOther?: string;

    // Additional fields
    occupation?: string;
    employer?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelationship?: string;
    baptismDate?: Date | string;
    salvationDate?: Date | string;
    membershipDate?: Date | string;

    // Metadata
    createdBy?: string;
    sendProfileLink?: boolean; // Option to send profile update link
}

/**
 * Update Member DTO (Admin update)
 */
export interface UpdateMemberDTO {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    gender?: Gender;
    maritalStatus?: MaritalStatus;
    dateOfBirth?: Date | string;
    weddingAnniversary?: Date | string | null;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    profileImageUrl?: string;
    status?: MemberStatus;
    notes?: string;

    // Family fields
    familyId?: string | null;
    familyRole?: FamilyRole | null;
    familyRoleOther?: string | null;

    // Additional fields
    occupation?: string;
    employer?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelationship?: string;
    baptismDate?: Date | string;
    salvationDate?: Date | string;
    membershipDate?: Date | string;

    // Metadata
    updatedBy?: string;
}

/**
 * Update Member Profile DTO (Member self-update via profile link)
 */
export interface UpdateMemberProfileDTO {
    firstName?: string;
    lastName?: string;
    phone?: string;
    gender?: Gender;
    maritalStatus?: MaritalStatus;
    dateOfBirth?: Date | string;
    weddingAnniversary?: Date | string | null;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    profileImageUrl?: string;

    // Additional fields members can update
    occupation?: string;
    employer?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelationship?: string;
}

/**
 * Member Filters
 */
export interface MemberFilters {
    churchId: string;
    search?: string;
    status?: MemberStatus;
    gender?: Gender;
    maritalStatus?: MaritalStatus;
    familyId?: string;
    hasFamily?: boolean;
    hasUserAccount?: boolean;
    profileCompleted?: boolean; // Filter by profile completion status
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated Members Response
 */
export interface PaginatedMembers {
    members: Member[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

/**
 * Member Statistics
 */
export interface MemberStatistics {
    total: number;
    active: number;
    inactive: number;
    byGender: {
        male: number;
        female: number;
        other: number;
        unknown: number;
    };
    byMaritalStatus: {
        single: number;
        married: number;
        divorced: number;
        widowed: number;
        unknown: number;
    };
    newThisMonth: number;
    growthPercentage: number;
    upcomingBirthdays: number;
    upcomingAnniversaries: number;
    membersInFamilies: number;
    membersWithoutFamily: number;
    membersWithUserAccounts: number;
    profilesCompleted: number;
    profilesPending: number;
}

/**
 * Profile Update Link
 */
export interface ProfileUpdateLink {
    token: string;
    link: string;
    expiresAt: Date | string;
}

/**
 * Audit Log Entry
 */
export interface AuditLog {
    id: string;
    church_id: string;
    entity_type: EntityType;
    entity_id: string;
    action: AuditAction;
    actor_type: ActorType;
    actor_id?: string;
    changes?: Record<string, any>;
    metadata?: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
    created_at: Date | string;
}

/**
 * Member with Family Info (for joined queries)
 */
export interface MemberWithFamily extends Member {
    family_name?: string;
    family_members_count?: number;
}

/**
 * Celebration Info
 */
export interface Celebration {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    profile_image_url?: string;
    date_of_birth?: Date | string;
    wedding_anniversary?: Date | string;
    celebration_type: 'birthday' | 'anniversary';
    celebration_date: string; // Format: YYYY-MM-DD
    days_until: number;
    has_passed_this_year: boolean;
    age?: number; // Only for birthdays
    years?: number; // Only for anniversaries
}

/**
 * Celebrations Response
 */
export interface CelebrationsResponse {
    celebrations: Celebration[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

/**
 * Celebration Filters
 */
export interface CelebrationFilters {
    type?: 'birthday' | 'anniversary' | 'all';
    period?: 'upcoming' | 'past' | 'all';
    days?: number;
    page?: number;
    limit?: number;
}

/**
 * Search Member Result (lightweight)
 */
export interface MemberSearchResult {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    profile_image_url?: string;
    status: MemberStatus;
}

/**
 * Member Import DTO
 */
export interface ImportMemberDTO extends Omit<CreateMemberDTO, 'churchId' | 'createdBy'> {
    // Additional fields that might come from import
    external_id?: string;
    import_source?: string;
}

/**
 * Bulk Member Operation Result
 */
export interface BulkMemberOperationResult {
    success: number;
    failed: number;
    errors: Array<{
        row: number;
        member?: Partial<ImportMemberDTO>;
        error: string;
    }>;
}

/**
 * Member Export DTO
 */
export interface ExportMemberDTO {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    gender?: string;
    marital_status?: string;
    date_of_birth?: string;
    wedding_anniversary?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    status: string;
    family_name?: string;
    family_role?: string;
    occupation?: string;
    employer?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    baptism_date?: string;
    salvation_date?: string;
    membership_date?: string;
    created_at: string;
}

/**
 * Profile Link Send Options
 */
export interface ProfileLinkSendOptions {
    channels: Array<'email' | 'sms' | 'whatsapp'>;
    customMessage?: string;
    sendAt?: Date | string; // Schedule for later
}

/**
 * Member Activity Summary
 */
export interface MemberActivitySummary {
    member_id: string;
    total_events_attended: number;
    last_attendance_date?: Date | string;
    attendance_rate: number; // Percentage
    groups: string[]; // Group IDs or names
    last_contribution_date?: Date | string;
    total_contributions?: number;
}

/**
 * Member Validation Error
 */
export interface MemberValidationError {
    field: string;
    message: string;
    value?: any;
}

/**
 * Member Validation Result
 */
export interface MemberValidationResult {
    valid: boolean;
    errors: MemberValidationError[];
}

/**
 * Duplicate Member Check Result
 */
export interface DuplicateMemberCheck {
    isDuplicate: boolean;
    matches: Array<{
        member: Member;
        matchScore: number;
        matchedFields: string[];
    }>;
}

/**
 * Member Quick Stats
 */
export interface MemberQuickStats {
    total_members: number;
    new_this_week: number;
    new_this_month: number;
    active_percentage: number;
    profile_completion_rate: number;
}

/**
 * Type guards
 */
export const isMember = (obj: any): obj is Member => {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof obj.id === 'string' &&
        typeof obj.church_id === 'string' &&
        typeof obj.first_name === 'string' &&
        typeof obj.last_name === 'string'
    );
};

export const isValidGender = (value: any): value is Gender => {
    return ['male', 'female', 'other'].includes(value);
};

export const isValidMaritalStatus = (value: any): value is MaritalStatus => {
    return ['single', 'married', 'divorced', 'widowed'].includes(value);
};

export const isValidMemberStatus = (value: any): value is MemberStatus => {
    return ['active', 'inactive', 'suspended'].includes(value);
};

export const isValidFamilyRole = (value: any): value is FamilyRole => {
    const validRoles: FamilyRole[] = [
        'father', 'mother', 'son', 'daughter', 'grandfather', 'grandmother',
        'grandson', 'granddaughter', 'uncle', 'aunt', 'nephew', 'niece', 'cousin',
        'brother', 'sister', 'brother_in_law', 'sister_in_law', 'father_in_law',
        'mother_in_law', 'stepfather', 'stepmother', 'stepson', 'stepdaughter',
        'guardian', 'ward', 'other'
    ];
    return validRoles.includes(value);
};

/**
 * Helper functions
 */
export const getFullName = (member: Member | MemberSearchResult): string => {
    return `${member.first_name} ${member.last_name}`.trim();
};

export const getMemberAge = (member: Member): number | null => {
    if (!member.date_of_birth) return null;

    const birthDate = new Date(member.date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
};

export const getAnniversaryYears = (member: Member): number | null => {
    if (!member.wedding_anniversary || member.marital_status !== 'married') return null;

    const anniversaryDate = new Date(member.wedding_anniversary);
    const today = new Date();
    let years = today.getFullYear() - anniversaryDate.getFullYear();
    const monthDiff = today.getMonth() - anniversaryDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < anniversaryDate.getDate())) {
        years--;
    }

    return years;
};

export const isProfileComplete = (member: Member): boolean => {
    return !!member.profile_completed_at;
};

export const isProfileLinkExpired = (member: Member): boolean => {
    if (!member.profile_update_token_expires_at) return true;

    const expiryDate = new Date(member.profile_update_token_expires_at);
    return expiryDate < new Date();
};

export const hasPendingProfileUpdate = (member: Member): boolean => {
    return (
        !!member.profile_update_token &&
        !isProfileLinkExpired(member) &&
        !member.profile_completed_at
    );
};

/**
 * Constants
 */
export const MEMBER_CONSTANTS = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    PROFILE_LINK_EXPIRY_DAYS: 30,
    MIN_AGE: 0,
    MAX_AGE: 150,
    SEARCH_MIN_LENGTH: 2,
} as const;

export const FAMILY_ROLE_LABELS: Record<FamilyRole, string> = {
    father: 'Father',
    mother: 'Mother',
    son: 'Son',
    daughter: 'Daughter',
    grandfather: 'Grandfather',
    grandmother: 'Grandmother',
    grandson: 'Grandson',
    granddaughter: 'Granddaughter',
    uncle: 'Uncle',
    aunt: 'Aunt',
    nephew: 'Nephew',
    niece: 'Niece',
    cousin: 'Cousin',
    brother: 'Brother',
    sister: 'Sister',
    brother_in_law: 'Brother-in-law',
    sister_in_law: 'Sister-in-law',
    father_in_law: 'Father-in-law',
    mother_in_law: 'Mother-in-law',
    stepfather: 'Stepfather',
    stepmother: 'Stepmother',
    stepson: 'Stepson',
    stepdaughter: 'Stepdaughter',
    guardian: 'Guardian',
    ward: 'Ward',
    other: 'Other',
};

export const GENDER_LABELS: Record<Gender, string> = {
    male: 'Male',
    female: 'Female',
    other: 'Other',
};

export const MARITAL_STATUS_LABELS: Record<MaritalStatus, string> = {
    single: 'Single',
    married: 'Married',
    divorced: 'Divorced',
    widowed: 'Widowed',
};

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
    active: 'Active',
    inactive: 'Inactive',
    suspended: 'Suspended',
};