// src/pages/Dashboard.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Import all Modals
import { AddPastorModal } from "@/components/modals/AddPastorModal";
import { CreateNewModal, CreateNewOption } from "@/components/modals/CreateNewModal";
import { ExpenseModal } from "@/components/modals/ExpenseModal";
import { GroupModal } from "@/components/modals/CreateGroupModal";
import { MemberModal } from "@/components/modals/CreateMemberModal.tsx";
import { FamilyModal } from "@/components/modals/CreateFamilyModal.tsx";
import { FirstTimerModal } from "@/components/modals/FirstTimerModal";
import { OfferingModal } from "@/components/modals/OfferingModal";
import { ReportModal } from "@/components/modals/ReportModal";

import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStats, useAttendanceTrends } from "@/hooks/useReports";
import { useCelebrations } from "@/hooks/useCelebrations";
import { useCurrency } from "@/hooks/useCurrency";
import { useGroups } from "@/hooks/useGroups";
import {
    Users,
    UserPlus,
    Cake,
    Heart,
    DollarSign,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Plus,
    RefreshCw,
    ChevronRight,
    MessageCircle,
    Clock,
    AlertCircle,
    Gift,
    TrendingUp,
} from "lucide-react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Line,
} from "recharts";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function Dashboard() {
    const navigate = useNavigate();
    const { user, church, needsAdminSetup, markAdminSetupComplete } = useAuth();
    const { formatCompact } = useCurrency();

    // Modal states
    const [showPastorModal, setShowPastorModal] = useState(false);
    const [showCreateNewModal, setShowCreateNewModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [showFamilyModal, setShowFamilyModal] = useState(false);
    const [showFirstTimerModal, setShowFirstTimerModal] = useState(false);
    const [showOfferingModal, setShowOfferingModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);

    // Fetch dashboard data
    const { stats, isLoading: isLoadingStats, refetch: refetchStats } = useDashboardStats();
    const { trends, isLoading: isLoadingTrends } = useAttendanceTrends({ granularity: 'weekly' });
    const { celebrations, summary: celebrationSummary, isLoading: isLoadingCelebrations } = useCelebrations({
        daysAhead: 7,
        limit: 10
    });
    const { groupTypes } = useGroups();

    useEffect(() => {
        if (needsAdminSetup) {
            setShowPastorModal(true);
        }
    }, [needsAdminSetup]);

    const handlePastorSetupSuccess = () => {
        markAdminSetupComplete();
        setShowPastorModal(false);
    };

    // Handle Create New selection
    const handleCreateNewSelect = (option: CreateNewOption) => {
        switch (option) {
            case 'expense':
                setShowExpenseModal(true);
                break;
            case 'group':
                setShowGroupModal(true);
                break;
            case 'member':
                setShowMemberModal(true);
                break;
            case 'family':
                setShowFamilyModal(true);
                break;
            case 'first-timer':
                setShowFirstTimerModal(true);
                break;
            case 'offering':
                setShowOfferingModal(true);
                break;
            case 'report':
                setShowReportModal(true);
                break;
        }
    };

    // Handle modal success - refresh data
    const handleModalSuccess = () => {
        refetchStats();
    };

    const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Pastor';

    // Format number with abbreviation
    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    // Transform attendance data for chart
    const attendanceChartData = trends.map((t) => ({
        period: t.periodLabel,
        attendance: t.totalAttendance,
        firstTimers: t.firstTimers,
        members: t.uniqueMembers,
    }));

    // Stat cards data
    const statCards = [
        {
            label: "Total Members",
            value: stats?.totalMembers || 0,
            change: stats?.membersChange || 0,
            changePercent: stats?.membersChangePercent || 0,
            icon: Users,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
            href: "/members",
        },
        {
            label: "First Timers",
            value: stats?.totalFirstTimers || 0,
            change: stats?.firstTimersChange || 0,
            changePercent: stats?.firstTimersChangePercent || 0,
            icon: UserPlus,
            color: "text-purple-600",
            bgColor: "bg-purple-100",
            href: "/first-timers",
        },
        {
            label: "Avg. Attendance",
            value: stats?.averageAttendance || 0,
            change: stats?.attendanceChange || 0,
            changePercent: stats?.attendanceChangePercent || 0,
            icon: Calendar,
            color: "text-green-600",
            bgColor: "bg-green-100",
            href: "/events",
        },
        {
            label: "Total Donations",
            value: stats?.totalDonations || 0,
            change: stats?.donationsChange || 0,
            changePercent: stats?.donationsChangePercent || 0,
            icon: DollarSign,
            color: "text-emerald-600",
            bgColor: "bg-emerald-100",
            href: "/financials/offerings",
            isCurrency: true,
        },
    ];

    // Quick action cards
    const quickActions = [
        {
            label: "Pending Follow-ups",
            value: stats?.pendingFollowups || 0,
            icon: Clock,
            color: "text-orange-600",
            bgColor: "bg-orange-100",
            href: "/first-timers?followUpStatus=pending",
        },
        {
            label: "Inactive Members",
            value: stats?.inactiveMembers || 0,
            icon: AlertCircle,
            color: "text-red-600",
            bgColor: "bg-red-100",
            href: "/reports?tab=inactive",
        },
        {
            label: "Conversion Rate",
            value: `${stats?.conversionRate || 0}%`,
            icon: TrendingUp,
            color: "text-green-600",
            bgColor: "bg-green-100",
            href: "/reports",
        },
    ];

    return (
        <DashboardLayout
            title="Dashboard"
            actions={
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => refetchStats()}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                        className="bg-gradient-primary text-white hover:opacity-90 gap-2"
                        onClick={() => setShowCreateNewModal(true)}
                    >
                        <Plus className="h-4 w-4" />
                        Create New
                    </Button>
                </div>
            }
        >
            <div className="p-4 md:p-6 space-y-6">
                {/* All Modals */}
                <AddPastorModal
                    open={showPastorModal}
                    onClose={() => setShowPastorModal(false)}
                    onSuccess={handlePastorSetupSuccess}
                    churchName={church?.name}
                />

                <CreateNewModal
                    open={showCreateNewModal}
                    onClose={() => setShowCreateNewModal(false)}
                    onSelect={handleCreateNewSelect}
                />

                <ExpenseModal
                    open={showExpenseModal}
                    onClose={() => setShowExpenseModal(false)}
                    onSuccess={handleModalSuccess}
                />

                <GroupModal
                    open={showGroupModal}
                    onClose={() => setShowGroupModal(false)}
                    onSuccess={handleModalSuccess}
                    groupTypes={groupTypes || []}
                />

                <MemberModal
                    open={showMemberModal}
                    onClose={() => setShowMemberModal(false)}
                    onSuccess={handleModalSuccess}
                />

                <FamilyModal
                    open={showFamilyModal}
                    onClose={() => setShowFamilyModal(false)}
                    onSuccess={handleModalSuccess}
                />

                <FirstTimerModal
                    open={showFirstTimerModal}
                    onClose={() => setShowFirstTimerModal(false)}
                    onSuccess={handleModalSuccess}
                />

                <OfferingModal
                    open={showOfferingModal}
                    onClose={() => setShowOfferingModal(false)}
                    onSuccess={handleModalSuccess}
                />

                <ReportModal
                    open={showReportModal}
                    onClose={() => setShowReportModal(false)}
                    onSuccess={handleModalSuccess}
                />

                {/* Welcome Banner */}
                <Card className="border-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent shadow-md">
                    <CardContent className="p-6 md:p-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
                                    Welcome back, {userName}! 👋
                                </h2>
                                <p className="text-muted-foreground">
                                    Here's what's happening with {church?.name || 'your church'} today
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm text-muted-foreground">Today's Date</p>
                                    <p className="font-semibold">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Stats */}
                <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
                    {isLoadingStats ? (
                        [...Array(4)].map((_, i) => (
                            <Card key={i}>
                                <CardContent className="p-4 md:p-6">
                                    <Skeleton className="h-12 w-12 rounded-xl mb-4" />
                                    <Skeleton className="h-8 w-24 mb-2" />
                                    <Skeleton className="h-4 w-32" />
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        statCards.map((stat) => (
                            <Card
                                key={stat.label}
                                className="hover:shadow-lg transition-all cursor-pointer group"
                                onClick={() => navigate(stat.href)}
                            >
                                <CardContent className="p-4 md:p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={cn("p-2 md:p-3 rounded-xl", stat.bgColor)}>
                                            <stat.icon className={cn("h-5 w-5 md:h-6 md:w-6", stat.color)} />
                                        </div>
                                        <Badge
                                            variant={stat.changePercent >= 0 ? "default" : "destructive"}
                                            className="gap-1"
                                        >
                                            {stat.changePercent >= 0 ? (
                                                <ArrowUpRight className="h-3 w-3" />
                                            ) : (
                                                <ArrowDownRight className="h-3 w-3" />
                                            )}
                                            {Math.abs(stat.changePercent)}%
                                        </Badge>
                                    </div>
                                    <div className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">
                                        {stat.isCurrency
                                            ? formatCompact(stat.value as number)
                                            : formatNumber(stat.value as number)
                                        }
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">{stat.label}</span>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Quick Actions */}
                <div className="grid gap-4 md:grid-cols-3">
                    {quickActions.map((action) => (
                        <Card
                            key={action.label}
                            className="cursor-pointer hover:shadow-md transition-all"
                            onClick={() => navigate(action.href)}
                        >
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className={cn("p-3 rounded-lg", action.bgColor)}>
                                    <action.icon className={cn("h-5 w-5", action.color)} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-2xl font-bold">{action.value}</p>
                                    <p className="text-sm text-muted-foreground">{action.label}</p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Charts and Celebrations Row */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Celebrations Card */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg bg-pink-100">
                                        <Gift className="h-5 w-5 md:h-6 md:w-6 text-pink-600" />
                                    </div>
                                    <div>
                                        <CardTitle>Celebrations</CardTitle>
                                        <CardDescription>
                                            {celebrationSummary?.todayBirthdays || 0} birthdays, {celebrationSummary?.todayAnniversaries || 0} anniversaries today
                                        </CardDescription>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => navigate('/members?tab=celebrations')}>
                                    View All
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoadingCelebrations ? (
                                <div className="space-y-3">
                                    {[...Array(3)].map((_, i) => (
                                        <Skeleton key={i} className="h-16 w-full" />
                                    ))}
                                </div>
                            ) : celebrations.length > 0 ? (
                                <div className="space-y-3">
                                    {celebrations.slice(0, 5).map((celebration) => (
                                        <div
                                            key={`${celebration.id}-${celebration.type}`}
                                            className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                                            onClick={() => navigate(`/members/${celebration.memberId}`)}
                                        >
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={celebration.profileImageUrl} />
                                                <AvatarFallback>
                                                    {celebration.firstName?.[0]}{celebration.lastName?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{celebration.memberName}</p>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <span>{celebration.date}</span>
                                                    {celebration.type === 'birthday' && celebration.age && (
                                                        <span>• Turning {celebration.age}</span>
                                                    )}
                                                    {celebration.type === 'anniversary' && celebration.yearsMarried && (
                                                        <span>• {celebration.yearsMarried} years</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant={celebration.dayLabel === 'Today' ? 'default' : 'outline'}
                                                    className={cn(
                                                        celebration.dayLabel === 'Today' && 'bg-green-100 text-green-700',
                                                        celebration.dayLabel === 'Tomorrow' && 'bg-blue-100 text-blue-700'
                                                    )}
                                                >
                                                    {celebration.dayLabel}
                                                </Badge>
                                                {celebration.type === 'birthday' ? (
                                                    <Cake className="h-4 w-4 text-pink-500" />
                                                ) : (
                                                    <Heart className="h-4 w-4 text-red-500" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>No upcoming celebrations this week</p>
                                </div>
                            )}

                            {/* Summary badges */}
                            {celebrationSummary && (
                                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                                    <Badge variant="outline" className="gap-1">
                                        <Cake className="h-3 w-3" />
                                        {celebrationSummary.thisWeekBirthdays} {celebrationSummary.thisWeekBirthdays === 1 ? 'birthday' : 'birthdays'} this week
                                    </Badge>
                                    <Badge variant="outline" className="gap-1">
                                        <Heart className="h-3 w-3" />
                                        {celebrationSummary.thisWeekAnniversaries} {celebrationSummary.thisWeekAnniversaries === 1 ? 'anniversary' : 'anniversaries'} this week
                                    </Badge>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Attendance Chart */}
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg bg-blue-100">
                                        <Users className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <CardTitle>Attendance Trends</CardTitle>
                                        <CardDescription>Weekly attendance overview</CardDescription>
                                    </div>
                                </div>
                                <Button variant="link" size="sm" onClick={() => navigate('/reports')}>
                                    View Reports
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoadingTrends ? (
                                <Skeleton className="h-64 w-full" />
                            ) : attendanceChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <AreaChart data={attendanceChartData}>
                                        <defs>
                                            <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis
                                            dataKey="period"
                                            stroke="hsl(var(--muted-foreground))"
                                            fontSize={12}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            stroke="hsl(var(--muted-foreground))"
                                            fontSize={12}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "hsl(var(--card))",
                                                border: "1px solid hsl(var(--border))",
                                                borderRadius: "var(--radius)",
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="attendance"
                                            stroke="hsl(var(--chart-1))"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorAttendance)"
                                            name="Total Attendance"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="firstTimers"
                                            stroke="hsl(var(--chart-2))"
                                            strokeWidth={2}
                                            dot={{ r: 3 }}
                                            name="First Timers"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-64 flex items-center justify-center text-muted-foreground">
                                    <div className="text-center">
                                        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p>No attendance data available</p>
                                        <p className="text-sm">Start tracking attendance to see trends</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Bottom Row - Additional Info */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Quick Links */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-3"
                                onClick={() => setShowMemberModal(true)}
                            >
                                <UserPlus className="h-4 w-4" />
                                Add New Member
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-3"
                                onClick={() => setShowFirstTimerModal(true)}
                            >
                                <Users className="h-4 w-4" />
                                Register First Timer
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-3"
                                onClick={() => navigate('/events/new')}
                            >
                                <Calendar className="h-4 w-4" />
                                Create Event
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-3"
                                onClick={() => setShowOfferingModal(true)}
                            >
                                <DollarSign className="h-4 w-4" />
                                Record Offering
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-3"
                                onClick={() => navigate('/sms')}
                            >
                                <MessageCircle className="h-4 w-4" />
                                Send SMS
                            </Button>
                        </CardContent>
                    </Card>

                    {/* This Week's Highlights */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>This Week's Highlights</CardTitle>
                                <Button variant="outline" size="sm" onClick={() => navigate('/reports')}>
                                    Full Report
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center p-4 bg-muted/50 rounded-lg">
                                    <p className="text-3xl font-bold text-blue-600">
                                        {stats?.membersChange || 0}
                                    </p>
                                    <p className="text-sm text-muted-foreground">New Members</p>
                                </div>
                                <div className="text-center p-4 bg-muted/50 rounded-lg">
                                    <p className="text-3xl font-bold text-purple-600">
                                        {stats?.totalFirstTimers || 0}
                                    </p>
                                    <p className="text-sm text-muted-foreground">First Timers</p>
                                </div>
                                <div className="text-center p-4 bg-muted/50 rounded-lg">
                                    <p className="text-3xl font-bold text-pink-600">
                                        {celebrationSummary?.thisWeekBirthdays || 0}
                                    </p>
                                    <p className="text-sm text-muted-foreground">Birthdays</p>
                                </div>
                                <div className="text-center p-4 bg-muted/50 rounded-lg">
                                    <p className="text-3xl font-bold text-red-600">
                                        {celebrationSummary?.thisWeekAnniversaries || 0}
                                    </p>
                                    <p className="text-sm text-muted-foreground">Anniversaries</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}