// src/types/support.ts

export type TicketCategory =
    | 'general'
    | 'technical'
    | 'billing'
    | 'feature_request'
    | 'bug_report'
    | 'account'
    | 'other';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';

export interface SupportTicket {
    id: string;
    churchId: string;
    userId?: string;
    ticketNumber: string;
    subject: string;
    description: string;
    category: TicketCategory;
    priority: TicketPriority;
    status: TicketStatus;
    contactEmail: string;
    contactName: string;
    contactPhone?: string;
    assignedTo?: string;
    resolvedAt?: string;
    resolutionNotes?: string;
    attachments: string[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateTicketDTO {
    subject: string;
    description: string;
    category: TicketCategory;
    priority?: TicketPriority;
    contactEmail: string;
    contactName: string;
    contactPhone?: string;
}

export interface TicketMessage {
    id: string;
    ticketId: string;
    userId?: string;
    message: string;
    isStaffReply: boolean;
    attachments: string[];
    createdAt: string;
    firstName?: string;
    lastName?: string;
    userEmail?: string;
}

export interface FAQ {
    id: string;
    question: string;
    answer: string;
    category: string;
    order: number;
}

export const TICKET_CATEGORIES: { value: TicketCategory; label: string }[] = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'technical', label: 'Technical Issue' },
    { value: 'billing', label: 'Billing & Subscription' },
    { value: 'feature_request', label: 'Feature Request' },
    { value: 'bug_report', label: 'Bug Report' },
    { value: 'account', label: 'Account Issues' },
    { value: 'other', label: 'Other' },
];

export const TICKET_PRIORITIES: { value: TicketPriority; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-700' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-700' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700' },
];

export const TICKET_STATUSES: { value: TicketStatus; label: string; color: string }[] = [
    { value: 'open', label: 'Open', color: 'bg-green-100 text-green-700' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
    { value: 'waiting', label: 'Waiting', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'resolved', label: 'Resolved', color: 'bg-purple-100 text-purple-700' },
    { value: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-700' },
];