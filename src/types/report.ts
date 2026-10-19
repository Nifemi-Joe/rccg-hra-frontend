// src/types/report.ts

export interface AttendanceTrendReport {
    period: string;
    periodLabel: string;
    totalAttendance: number;
    uniqueMembers: number;
    firstTimers: number;
    guests: number;
    growthRate: number;
}

export interface MemberGrowthReport {
    period: string;
    periodLabel: string;
    newMembers: number;
    totalMembers: number;
    retentionRate: number;
    churnedMembers: number;
    netGrowth: number;
}

export interface FirstTimerConversionReport {
    period: string;
    periodLabel: string;
    firstTimers: number;
    convertedToMembers: number;
    conversionRate: number;
    averageConversionDays: number;
    pendingFollowup: number;
}

export interface FinancialSummaryReport {
    period: string;
    periodLabel: string;
    totalIncome: number;
    tithes: number;
    offerings: number;
    donations: number;
    otherIncome: number;
    totalExpenses: number;
    netBalance: number;
    growthRate: number;
}

export interface InactiveMemberReport {
    memberId: string;
    memberName: string;
    email: string;
    phone: string;
    lastAttended: string;
    daysInactive: number;
    totalAttendanceCount: number;
    membershipDate: string;
    profilePhoto?: string;
}

export interface EventPerformanceReport {
    eventId: string;
    eventName: string;
    eventType: string;
    frequency: string;
    totalInstances: number;
    averageAttendance: number;
    highestAttendance: number;
    lowestAttendance: number;
    trend: 'up' | 'down' | 'stable';
    trendPercentage: number;
}

export interface FamilyAttendanceReport {
    familyId: string;
    familyName: string;
    headOfFamily: string;
    totalMembers: number;
    activeMembers: number;
    lastFamilyAttendance: string;
    averageAttendanceRate: number;
    status: 'active' | 'irregular' | 'inactive';
}

export interface ReportFilters {
    startDate?: string;
    endDate?: string;
    granularity?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    eventType?: string;
    eventId?: string;
}

export interface DashboardStats {
    totalMembers: number;
    membersChange: number;
    membersChangePercent: number;
    totalFirstTimers: number;
    firstTimersChange: number;
    firstTimersChangePercent: number;
    averageAttendance: number;
    attendanceChange: number;
    attendanceChangePercent: number;
    totalDonations: number;
    donationsChange: number;
    donationsChangePercent: number;
    upcomingBirthdays: number;
    upcomingAnniversaries: number;
    inactiveMembers: number;
    pendingFollowups: number;
    conversionRate: number;
}

export interface FullReport {
    reportPeriod: {
        startDate: string;
        endDate: string;
        granularity: string;
    };
    dashboardStats: DashboardStats;
    attendanceTrends: AttendanceTrendReport[];
    memberGrowth: MemberGrowthReport[];
    firstTimerConversion: FirstTimerConversionReport[];
    financialSummary: FinancialSummaryReport[];
    eventPerformance: EventPerformanceReport[];
    inactiveMembers: InactiveMemberReport[];
    familyAttendance: FamilyAttendanceReport[];
    generatedAt: string;
}