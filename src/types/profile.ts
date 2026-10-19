// src/types/profile.ts

export type StaffRole =
    | 'admin'
    | 'pastor'
    | 'associate_pastor'
    | 'worship_leader'
    | 'youth_pastor'
    | 'children_minister'
    | 'finance_officer'
    | 'secretary'
    | 'head_usher'
    | 'head_choir'
    | 'media_director'
    | 'outreach_coordinator'
    | 'staff'
    | 'volunteer_leader'
    | 'leader'
    | 'member'
    | 'volunteer';

export const STAFF_ROLES: { value: StaffRole; label: string; description: string }[] = [
    { value: 'admin', label: 'Administrator', description: 'Full system access' },
    { value: 'pastor', label: 'Pastor', description: 'Pastoral access and oversight' },
    { value: 'associate_pastor', label: 'Associate Pastor', description: 'Pastoral support role' },
    { value: 'worship_leader', label: 'Worship Leader', description: 'Manages worship team' },
    { value: 'youth_pastor', label: 'Youth Pastor', description: 'Youth ministry oversight' },
    { value: 'children_minister', label: 'Children Minister', description: 'Children ministry' },
    { value: 'finance_officer', label: 'Finance Officer', description: 'Financial management' },
    { value: 'secretary', label: 'Secretary', description: 'Administrative support' },
    { value: 'head_usher', label: 'Head Usher', description: 'Usher coordination' },
    { value: 'head_choir', label: 'Choir Director', description: 'Choir management' },
    { value: 'media_director', label: 'Media Director', description: 'Media and communications' },
    { value: 'outreach_coordinator', label: 'Outreach Coordinator', description: 'Outreach programs' },
    { value: 'staff', label: 'Staff', description: 'General staff access' },
    { value: 'volunteer_leader', label: 'Volunteer Leader', description: 'Volunteer coordination' },
    { value: 'leader', label: 'Leader', description: 'Group/ministry leader' },
    { value: 'volunteer', label: 'Volunteer', description: 'Volunteer access' },
];

export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed';
export type Gender = 'male' | 'female' | 'other';

export interface StaffMember {
    id: string;
    churchId?: string;
    church_id?: string;
    email: string;
    firstName?: string;
    first_name?: string;
    lastName?: string;
    last_name?: string;
    phoneNumber?: string;
    phone_number?: string;
    role: StaffRole;
    permissions?: string[];
    status: 'active' | 'inactive' | 'pending' | 'suspended';
    profileImageUrl?: string;
    profile_image_url?: string;
    isTemporaryPassword?: boolean;
    is_temporary_password?: boolean;
    mustResetPassword?: boolean;
    must_reset_password?: boolean;
    lastLoginAt?: string;
    last_login_at?: string;
    createdAt?: string;
    created_at?: string;
    createdBy?: string;
}

export interface UpdateProfileDTO {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    country?: string;
    profileImageUrl?: string;
}

export interface ChangePasswordDTO {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface CreateStaffDTO {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    role: StaffRole;
    permissions?: string[];
    sendInvite?: boolean;
    createAsMember?: boolean;
}

export interface UpdateStaffDTO {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    role?: StaffRole;
    permissions?: string[];
    status?: 'active' | 'inactive' | 'suspended';
}

// Member Profile DTO for users updating their own linked member record
export interface UpdateMemberProfileDTO {
    firstName?: string;
    lastName?: string;
    phone?: string;
    gender?: Gender;
    maritalStatus?: MaritalStatus;
    dateOfBirth?: string;
    weddingAnniversary?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    occupation?: string;
    employer?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelationship?: string;
}

export interface MemberProfile {
    id: string;
    churchId?: string;
    church_id?: string;
    firstName?: string;
    first_name?: string;
    lastName?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    gender?: Gender;
    maritalStatus?: MaritalStatus;
    marital_status?: MaritalStatus;
    dateOfBirth?: string;
    date_of_birth?: string;
    weddingAnniversary?: string;
    wedding_anniversary?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    postal_code?: string;
    profileImageUrl?: string;
    profile_image_url?: string;
    occupation?: string;
    employer?: string;
    emergencyContactName?: string;
    emergency_contact_name?: string;
    emergencyContactPhone?: string;
    emergency_contact_phone?: string;
    emergencyContactRelationship?: string;
    emergency_contact_relationship?: string;
    status?: string;
    createdAt?: string;
    created_at?: string;
    updatedAt?: string;
    updated_at?: string;
}