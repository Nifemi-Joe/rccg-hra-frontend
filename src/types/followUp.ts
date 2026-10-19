// src/types/followUp.ts

export type FollowUpChannel = 'sms' | 'whatsapp' | 'email' | 'phone_call' | 'in_person' | 'other';
export type FollowUpStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type FollowUpPriority = 'low' | 'medium' | 'high' | 'urgent';
export type AssignmentStatus = 'active' | 'completed' | 'cancelled';
export type FollowUpMemberRole = 'leader' | 'coordinator' | 'member';
export type FollowUpMemberStatus = 'active' | 'inactive';
export type ActivityType = 'message_sent' | 'call_made' | 'visit_made' | 'response_received' | 'note_added' | 'status_changed';
export type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

// Department
export interface FollowUpDepartmentSettings {
    autoAssign: boolean;
    maxAssignmentsPerMember: number;
    followUpDeadlineDays: number;
    reminderIntervals: number[];
    defaultMessageTemplates: {
        sms?: string;
        whatsapp?: string;
        email?: string;
    };
    notificationPreferences: {
        notifyOnNewAssignment: boolean;
        notifyOnDeadline: boolean;
        notifyOnResponse: boolean;
    };
}

export interface FollowUpDepartment {
    id: string;
    churchId: string;
    name: string;
    description?: string;
    isActive: boolean;
    settings: FollowUpDepartmentSettings;
    createdAt: string;
    updatedAt: string;
}

// Team Members
export interface FollowUpMember {
    id: string;
    departmentId: string;
    memberId: string;
    churchId: string;
    role: FollowUpMemberRole;
    status: FollowUpMemberStatus;
    joinedAt: string;
    createdAt: string;
    updatedAt: string;
    member?: {
        id: string;
        firstName: string;
        lastName: string;
        email?: string;
        phone?: string;
        profileImageUrl?: string;
    };
    activeAssignmentsCount?: number;
    totalAssignmentsCount?: number;
    completedAssignmentsCount?: number;
    successRate?: number;
}

// Assignments
export interface AssignedMember {
    id: string;
    assignmentId: string;
    followUpMemberId: string;
    isPrimary: boolean;
    status: 'active' | 'completed' | 'removed';
    assignedAt: string;
    completedAt?: string;
    member?: {
        id: string;
        firstName: string;
        lastName: string;
        email?: string;
        phone?: string;
        profileImageUrl?: string;
    };
}

export interface FollowUpAssignment {
    id: string;
    churchId: string;
    firstTimerId: string;
    priority: FollowUpPriority;
    status: AssignmentStatus;
    dueDate?: string;
    notes?: string;
    tags?: string[];
    createdBy: string;
    completedAt?: string;
    completionNotes?: string;
    createdAt: string;
    updatedAt: string;
    firstTimer?: {
        id: string;
        firstName: string;
        lastName: string;
        email?: string;
        phone?: string;
        firstVisitDate: string;
        status: string;
        followUpStatus: string;
        howDidYouHear?: string;
        address?: string;
        notes?: string;
    };
    assignedMembers?: AssignedMember[];
}

// Activities
export interface FollowUpActivity {
    id: string;
    assignmentId: string;
    firstTimerId: string;
    churchId: string;
    performedBy: string;
    channel: FollowUpChannel;
    activityType: ActivityType;
    status: FollowUpStatus;
    subject?: string;
    content?: string;
    response?: string;
    responseAt?: string;
    durationMinutes?: number;
    metadata?: Record<string, any>;
    scheduledAt?: string;
    externalMessageId?: string;
    deliveryStatus?: DeliveryStatus;
    createdAt: string;
    updatedAt: string;
    performer?: {
        id: string;
        firstName: string;
        lastName: string;
    };
}

// Templates
export interface MessageTemplate {
    id: string;
    churchId: string;
    name: string;
    channel: FollowUpChannel;
    subject?: string;
    content: string;
    variables: string[];
    isDefault: boolean;
    isActive: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

// Statistics
export interface FollowUpStatistics {
    totalAssignments: number;
    activeAssignments: number;
    completedAssignments: number;
    overdueAssignments: number;
    averageCompletionDays: number;
    totalActivities: number;
    activitiesByChannel: Record<FollowUpChannel, number>;
    successRate: number;
    memberPerformance: MemberPerformance[];
    weeklyTrend: WeeklyTrendItem[];
}

export interface MemberPerformance {
    memberId: string;
    memberName: string;
    activeCount: number;
    completedCount: number;
    successRate: number;
}

export interface WeeklyTrendItem {
    week: string;
    newAssignments: number;
    completed: number;
}

// DTOs
export interface CreateAssignmentDTO {
    firstTimerId: string;
    assignedMemberIds: string[];
    primaryMemberId?: string;
    priority?: FollowUpPriority;
    dueDate?: string;
    notes?: string;
    tags?: string[];
}

export interface BulkCreateAssignmentsDTO {
    firstTimerIds: string[];
    assignedMemberIds: string[];
    autoDistribute?: boolean;
    priority?: FollowUpPriority;
    dueDate?: string;
}

export interface UpdateAssignmentDTO {
    priority?: FollowUpPriority;
    status?: AssignmentStatus;
    dueDate?: string;
    notes?: string;
    tags?: string[];
}

export interface SendMessageDTO {
    assignmentId: string;
    firstTimerId: string;
    channel: FollowUpChannel;
    subject?: string;
    content: string;
    scheduledAt?: string;
    templateId?: string;
}

export interface RecordActivityDTO {
    assignmentId: string;
    firstTimerId: string;
    channel: FollowUpChannel;
    activityType: ActivityType;
    status: FollowUpStatus;
    subject?: string;
    content?: string;
    durationMinutes?: number;
    metadata?: Record<string, any>;
}

export interface CreateTemplateDTO {
    name: string;
    channel: FollowUpChannel;
    subject?: string;
    content: string;
    variables?: string[];
    isDefault?: boolean;
}

export interface UpdateTemplateDTO {
    name?: string;
    subject?: string;
    content?: string;
    variables?: string[];
    isDefault?: boolean;
    isActive?: boolean;
}

export interface CreateFollowUpMemberDTO {
    memberId: string;
    role?: FollowUpMemberRole;
}

export interface UpdateFollowUpMemberDTO {
    role?: FollowUpMemberRole;
    status?: FollowUpMemberStatus;
}

// Filters
export interface FollowUpFilters {
    search?: string;
    status?: AssignmentStatus;
    priority?: FollowUpPriority;
    assignedMemberId?: string;
    dateFrom?: string;
    dateTo?: string;
    overdue?: boolean;
    page?: number;
    limit?: number;
}

// Pagination
export interface PaginatedAssignments {
    assignments: FollowUpAssignment[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface PaginatedActivities {
    activities: FollowUpActivity[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

// First Timer for assignments
export interface UnassignedFirstTimer {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    firstVisitDate: string;
    status: string;
    followUpStatus: string;
    howDidYouHear?: string;
    daysSinceVisit: number;
}