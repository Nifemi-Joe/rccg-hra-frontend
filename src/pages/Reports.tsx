// src/pages/Reports.tsx

import { useState, useMemo } from 'react';
import { format, subMonths, subDays, startOfMonth, endOfMonth, startOfYear } from 'date-fns';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ExportDropdown } from '@/components/ExportDropdown';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Users,
    TrendingUp,
    TrendingDown,
    UserPlus,
    Calendar,
    DollarSign,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw,
    Cake,
    Heart,
    UserX,
    Clock,
    Home,
    Minus,
} from 'lucide-react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    AreaChart,
    Area,
    ComposedChart,
} from 'recharts';
import {
    useDashboardStats,
    useAttendanceTrends,
    useMemberGrowth,
    useFirstTimerConversion,
    useFinancialSummary,
    useEventPerformance,
    useInactiveMembers,
    useFamilyAttendance,
} from '@/hooks/useReports';
import { useCurrency } from '@/hooks/useCurrency';
import { ReportFilters } from '@/types/report';
import { cn } from '@/lib/utils';

const CHART_COLORS = {
    primary: 'hsl(var(--primary))',
    secondary: 'hsl(var(--chart-2))',
    tertiary: 'hsl(var(--chart-3))',
    quaternary: 'hsl(var(--chart-4))',
    destructive: 'hsl(var(--destructive))',
    success: '#10b981',
};

const DATE_PRESETS = [
    { value: '30days', label: 'Last 30 days' },
    { value: '3months', label: 'Last 3 months' },
    { value: '6months', label: 'Last 6 months' },
    { value: '1year', label: 'Last year' },
    { value: 'custom', label: 'Custom range' },
];

const GRANULARITY_OPTIONS = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
];

export default function Reports() {
    const [dateRange, setDateRange] = useState('6months');
    const [granularity, setGranularity] = useState<ReportFilters['granularity']>('monthly');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [activeTab, setActiveTab] = useState('attendance');
    const [inactiveDays, setInactiveDays] = useState(30);

    // Currency hook
    const { formatCurrency, currencySymbol } = useCurrency();

    // Calculate date range
    const filters: ReportFilters = useMemo(() => {
        const now = new Date();
        let startDate: Date;
        let endDate: Date = now;

        switch (dateRange) {
            case '30days':
                startDate = subDays(now, 30);
                break;
            case '3months':
                startDate = startOfMonth(subMonths(now, 2));
                break;
            case '6months':
                startDate = startOfMonth(subMonths(now, 5));
                break;
            case '1year':
                startDate = startOfYear(now);
                break;
            case 'custom':
                startDate = customStartDate ? new Date(customStartDate) : subMonths(now, 6);
                endDate = customEndDate ? new Date(customEndDate) : now;
                break;
            default:
                startDate = startOfMonth(subMonths(now, 5));
        }

        return {
            startDate: format(startDate, 'yyyy-MM-dd'),
            endDate: format(endDate, 'yyyy-MM-dd'),
            granularity,
        };
    }, [dateRange, granularity, customStartDate, customEndDate]);

    // Fetch data using hooks
    const { stats, isLoading: isLoadingStats, refetch: refetchStats } = useDashboardStats();
    const { trends: attendanceTrends, isLoading: isLoadingAttendance, refetch: refetchAttendance } = useAttendanceTrends(filters);
    const { growth: memberGrowth, isLoading: isLoadingGrowth, refetch: refetchGrowth } = useMemberGrowth(filters);
    const { conversion: firstTimerConversion, isLoading: isLoadingConversion, refetch: refetchConversion } = useFirstTimerConversion(filters);
    const { summary: financialSummary, isLoading: isLoadingFinancial, refetch: refetchFinancial } = useFinancialSummary(filters);
    const { events: eventPerformance, isLoading: isLoadingEvents, refetch: refetchEvents } = useEventPerformance(filters);
    const { members: inactiveMembers, isLoading: isLoadingInactive, refetch: refetchInactive } = useInactiveMembers(inactiveDays);
    const { families: familyAttendance, isLoading: isLoadingFamilies, refetch: refetchFamilies } = useFamilyAttendance(filters);

    const isLoading = isLoadingStats || isLoadingAttendance || isLoadingGrowth ||
        isLoadingConversion || isLoadingFinancial || isLoadingEvents ||
        isLoadingInactive || isLoadingFamilies;

    const refetchAll = () => {
        refetchStats();
        refetchAttendance();
        refetchGrowth();
        refetchConversion();
        refetchFinancial();
        refetchEvents();
        refetchInactive();
        refetchFamilies();
    };

    // Transform data for charts
    const attendanceChartData = attendanceTrends.map(t => ({
        period: t.periodLabel,
        total: t.totalAttendance,
        members: t.uniqueMembers,
        firstTimers: t.firstTimers,
        guests: t.guests,
    }));

    const memberGrowthChartData = memberGrowth.map(g => ({
        period: g.periodLabel,
        newMembers: g.newMembers,
        churned: g.churnedMembers,
        total: g.totalMembers,
        netGrowth: g.netGrowth,
    }));

    const conversionChartData = firstTimerConversion.map(c => ({
        period: c.periodLabel,
        firstTimers: c.firstTimers,
        converted: c.convertedToMembers,
        rate: c.conversionRate,
    }));

    const financialChartData = financialSummary.map(f => ({
        period: f.periodLabel,
        tithes: f.tithes,
        offerings: f.offerings,
        donations: f.donations,
        expenses: f.totalExpenses,
        net: f.netBalance,
    }));

    // Y-axis tick formatter for financial charts
    const yAxisCurrencyFormatter = (value: number) => {
        if (Math.abs(value) >= 1000000) {
            return `${currencySymbol}${(value / 1000000).toFixed(1)}M`;
        }
        if (Math.abs(value) >= 1000) {
            return `${currencySymbol}${(value / 1000).toFixed(0)}k`;
        }
        return `${currencySymbol}${value}`;
    };

    // Stat card component
    const StatCard = ({
                          title,
                          value,
                          change,
                          changePercent,
                          icon: Icon,
                          iconColor,
                          loading = false,
                          isCurrency = false,
                          suffix = '',
                      }: {
        title: string;
        value: number | string;
        change?: number;
        changePercent?: number;
        icon: any;
        iconColor: string;
        loading?: boolean;
        isCurrency?: boolean;
        suffix?: string;
    }) => (
        <Card>
            <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-xs md:text-sm text-muted-foreground">{title}</p>
                        {loading ? (
                            <Skeleton className="h-8 w-20 mt-1" />
                        ) : (
                            <p className="text-xl font-bold">
                                {isCurrency
                                    ? formatCurrency(typeof value === 'number' ? value : parseFloat(value as string) || 0)
                                    : typeof value === 'number' ? value.toLocaleString() : value
                                }{suffix}
                            </p>
                        )}
                    </div>
                    <div className={cn("p-2 md:p-3 rounded-xl", iconColor)}>
                        <Icon className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                </div>
                {(change !== undefined || changePercent !== undefined) && !loading && (
                    <div className={cn(
                        "flex items-center gap-1 mt-2 text-xs",
                        (changePercent || 0) >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                        {(changePercent || 0) >= 0 ? (
                            <ArrowUpRight className="h-3 w-3" />
                        ) : (
                            <ArrowDownRight className="h-3 w-3" />
                        )}
                        {change !== undefined && (
                            <span>
                                {change >= 0 ? '+' : ''}
                                {isCurrency ? formatCurrency(change) : change.toLocaleString()}
                            </span>
                        )}
                        {changePercent !== undefined && (
                            <span>({changePercent >= 0 ? '+' : ''}{changePercent}%)</span>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );

    // Custom tooltip for charts
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-card border rounded-lg shadow-lg p-3">
                    <p className="font-medium mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ color: entry.color }} className="text-sm">
                            {entry.name}: {entry.value.toLocaleString()}
                            {entry.name.includes('Rate') || entry.name.includes('%') ? '%' : ''}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    // Custom tooltip for financial charts with currency support
    const FinancialTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-card border rounded-lg shadow-lg p-3">
                    <p className="font-medium mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ color: entry.color }} className="text-sm">
                            {entry.name}: {formatCurrency(entry.value)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <DashboardLayout
            title="Reports & Analytics"
            actions={
                <Button variant="outline" onClick={refetchAll} disabled={isLoading}>
                    <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                    Refresh
                </Button>
            }
        >
            <div className="p-4 md:p-6 space-y-6">
                {/* Filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 space-y-2">
                                <Label>Date Range</Label>
                                <Select value={dateRange} onValueChange={setDateRange}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover z-50">
                                        {DATE_PRESETS.map(preset => (
                                            <SelectItem key={preset.value} value={preset.value}>
                                                {preset.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex-1 space-y-2">
                                <Label>Granularity</Label>
                                <Select value={granularity} onValueChange={(v) => setGranularity(v as any)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover z-50">
                                        {GRANULARITY_OPTIONS.map(option => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {dateRange === 'custom' && (
                                <>
                                    <div className="flex-1 space-y-2">
                                        <Label>Start Date</Label>
                                        <Input
                                            type="date"
                                            value={customStartDate}
                                            onChange={(e) => setCustomStartDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <Label>End Date</Label>
                                        <Input
                                            type="date"
                                            value={customEndDate}
                                            onChange={(e) => setCustomEndDate(e.target.value)}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Stats */}
                <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Members"
                        value={stats?.totalMembers || 0}
                        change={stats?.membersChange}
                        changePercent={stats?.membersChangePercent}
                        icon={Users}
                        iconColor="bg-primary/10 text-primary"
                        loading={isLoadingStats}
                    />
                    <StatCard
                        title="Avg Attendance"
                        value={stats?.averageAttendance || 0}
                        change={stats?.attendanceChange}
                        changePercent={stats?.attendanceChangePercent}
                        icon={Calendar}
                        iconColor="bg-blue-500/10 text-blue-500"
                        loading={isLoadingStats}
                    />
                    <StatCard
                        title="First Timer Conv."
                        value={stats?.conversionRate || 0}
                        suffix="%"
                        icon={UserPlus}
                        iconColor="bg-green-500/10 text-green-500"
                        loading={isLoadingStats}
                    />
                    <StatCard
                        title="Inactive Members"
                        value={stats?.inactiveMembers || 0}
                        icon={AlertTriangle}
                        iconColor="bg-yellow-500/10 text-yellow-500"
                        loading={isLoadingStats}
                    />
                </div>

                {/* Additional Quick Stats */}
                <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="First Timers (30d)"
                        value={stats?.totalFirstTimers || 0}
                        change={stats?.firstTimersChange}
                        changePercent={stats?.firstTimersChangePercent}
                        icon={UserPlus}
                        iconColor="bg-purple-500/10 text-purple-500"
                        loading={isLoadingStats}
                    />
                    <StatCard
                        title="Total Donations"
                        value={stats?.totalDonations || 0}
                        change={stats?.donationsChange}
                        changePercent={stats?.donationsChangePercent}
                        icon={DollarSign}
                        iconColor="bg-emerald-500/10 text-emerald-500"
                        loading={isLoadingStats}
                        isCurrency={true}
                    />
                    <StatCard
                        title="Upcoming Birthdays"
                        value={stats?.upcomingBirthdays || 0}
                        icon={Cake}
                        iconColor="bg-pink-500/10 text-pink-500"
                        loading={isLoadingStats}
                    />
                    <StatCard
                        title="Pending Follow-ups"
                        value={stats?.pendingFollowups || 0}
                        icon={Clock}
                        iconColor="bg-orange-500/10 text-orange-500"
                        loading={isLoadingStats}
                    />
                </div>

                {/* Tabs for different report types */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="flex-wrap h-auto gap-1">
                        <TabsTrigger value="attendance">Attendance</TabsTrigger>
                        <TabsTrigger value="members">Members</TabsTrigger>
                        <TabsTrigger value="firsttimers">First Timers</TabsTrigger>
                        <TabsTrigger value="financial">Financial</TabsTrigger>
                        <TabsTrigger value="events">Events</TabsTrigger>
                        <TabsTrigger value="families">Families</TabsTrigger>
                        <TabsTrigger value="inactive">Inactive</TabsTrigger>
                    </TabsList>

                    {/* Attendance Tab */}
                    <TabsContent value="attendance" className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <CardTitle>Attendance Trends</CardTitle>
                                    <CardDescription>Track attendance patterns over time</CardDescription>
                                </div>
                                <ExportDropdown
                                    data={attendanceTrends}
                                    filename="attendance-trends"
                                />
                            </CardHeader>
                            <CardContent>
                                {isLoadingAttendance ? (
                                    <Skeleton className="h-[400px] w-full" />
                                ) : attendanceChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={400}>
                                        <AreaChart data={attendanceChartData}>
                                            <defs>
                                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                            <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" />
                                            <YAxis stroke="hsl(var(--muted-foreground))" />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />
                                            <Area
                                                type="monotone"
                                                dataKey="total"
                                                stroke={CHART_COLORS.primary}
                                                fillOpacity={1}
                                                fill="url(#colorTotal)"
                                                name="Total"
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="members"
                                                stroke={CHART_COLORS.secondary}
                                                name="Members"
                                                strokeWidth={2}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="firstTimers"
                                                stroke={CHART_COLORS.tertiary}
                                                name="First Timers"
                                                strokeWidth={2}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="guests"
                                                stroke={CHART_COLORS.quaternary}
                                                name="Guests"
                                                strokeWidth={2}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                                        <div className="text-center">
                                            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>No attendance data available for this period</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Attendance Summary Table */}
                        {attendanceTrends.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Attendance Summary</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Period</TableHead>
                                                <TableHead className="text-right">Total</TableHead>
                                                <TableHead className="text-right">Members</TableHead>
                                                <TableHead className="text-right">First Timers</TableHead>
                                                <TableHead className="text-right">Guests</TableHead>
                                                <TableHead className="text-right">Growth</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {attendanceTrends.map((row, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">{row.periodLabel}</TableCell>
                                                    <TableCell className="text-right">{row.totalAttendance.toLocaleString()}</TableCell>
                                                    <TableCell className="text-right">{row.uniqueMembers.toLocaleString()}</TableCell>
                                                    <TableCell className="text-right">{row.firstTimers.toLocaleString()}</TableCell>
                                                    <TableCell className="text-right">{row.guests.toLocaleString()}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge className={cn(
                                                            row.growthRate >= 0
                                                                ? "bg-green-500/10 text-green-600"
                                                                : "bg-red-500/10 text-red-600"
                                                        )}>
                                                            {row.growthRate >= 0 ? '+' : ''}{row.growthRate}%
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Members Tab */}
                    <TabsContent value="members" className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <CardTitle>Member Growth</CardTitle>
                                    <CardDescription>Track membership changes over time</CardDescription>
                                </div>
                                <ExportDropdown
                                    data={memberGrowth}
                                    filename="member-growth"
                                />
                            </CardHeader>
                            <CardContent>
                                {isLoadingGrowth ? (
                                    <Skeleton className="h-[400px] w-full" />
                                ) : memberGrowthChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={400}>
                                        <ComposedChart data={memberGrowthChartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                            <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" />
                                            <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
                                            <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />
                                            <Bar
                                                yAxisId="left"
                                                dataKey="newMembers"
                                                fill={CHART_COLORS.success}
                                                name="New Members"
                                                radius={[4, 4, 0, 0]}
                                            />
                                            <Bar
                                                yAxisId="left"
                                                dataKey="churned"
                                                fill={CHART_COLORS.destructive}
                                                name="Churned"
                                                radius={[4, 4, 0, 0]}
                                            />
                                            <Line
                                                yAxisId="right"
                                                type="monotone"
                                                dataKey="total"
                                                stroke={CHART_COLORS.primary}
                                                name="Total Members"
                                                strokeWidth={3}
                                            />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                                        <div className="text-center">
                                            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>No member growth data available</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Member Growth Table */}
                        {memberGrowth.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Growth Details</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Period</TableHead>
                                                <TableHead className="text-right">New</TableHead>
                                                <TableHead className="text-right">Churned</TableHead>
                                                <TableHead className="text-right">Net Growth</TableHead>
                                                <TableHead className="text-right">Total</TableHead>
                                                <TableHead className="text-right">Retention</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {memberGrowth.map((row, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">{row.periodLabel}</TableCell>
                                                    <TableCell className="text-right text-green-600">+{row.newMembers}</TableCell>
                                                    <TableCell className="text-right text-red-600">-{row.churnedMembers}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge className={cn(
                                                            row.netGrowth >= 0
                                                                ? "bg-green-500/10 text-green-600"
                                                                : "bg-red-500/10 text-red-600"
                                                        )}>
                                                            {row.netGrowth >= 0 ? '+' : ''}{row.netGrowth}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">{row.totalMembers.toLocaleString()}</TableCell>
                                                    <TableCell className="text-right">{row.retentionRate}%</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* First Timers Tab */}
                    <TabsContent value="firsttimers" className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <CardTitle>First Timer Conversion</CardTitle>
                                    <CardDescription>Track first-time visitor to member conversion</CardDescription>
                                </div>
                                <ExportDropdown
                                    data={firstTimerConversion}
                                    filename="first-timer-conversion"
                                />
                            </CardHeader>
                            <CardContent>
                                {isLoadingConversion ? (
                                    <Skeleton className="h-[400px] w-full" />
                                ) : conversionChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={400}>
                                        <ComposedChart data={conversionChartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                            <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" />
                                            <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
                                            <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />
                                            <Bar
                                                yAxisId="left"
                                                dataKey="firstTimers"
                                                fill={CHART_COLORS.tertiary}
                                                name="First Timers"
                                                radius={[4, 4, 0, 0]}
                                            />
                                            <Bar
                                                yAxisId="left"
                                                dataKey="converted"
                                                fill={CHART_COLORS.success}
                                                name="Converted"
                                                radius={[4, 4, 0, 0]}
                                            />
                                            <Line
                                                yAxisId="right"
                                                type="monotone"
                                                dataKey="rate"
                                                stroke={CHART_COLORS.primary}
                                                name="Conversion Rate %"
                                                strokeWidth={3}
                                            />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                                        <div className="text-center">
                                            <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>No first timer data available</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Conversion Stats Cards */}
                        {firstTimerConversion.length > 0 && (
                            <div className="grid gap-4 md:grid-cols-4">
                                <Card>
                                    <CardContent className="p-4">
                                        <p className="text-sm text-muted-foreground">Total First Timers</p>
                                        <p className="text-2xl font-bold">
                                            {firstTimerConversion.reduce((sum, c) => sum + c.firstTimers, 0).toLocaleString()}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4">
                                        <p className="text-sm text-muted-foreground">Converted</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {firstTimerConversion.reduce((sum, c) => sum + c.convertedToMembers, 0).toLocaleString()}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4">
                                        <p className="text-sm text-muted-foreground">Avg Conversion Rate</p>
                                        <p className="text-2xl font-bold">
                                            {firstTimerConversion.length > 0
                                                ? Math.round(firstTimerConversion.reduce((sum, c) => sum + c.conversionRate, 0) / firstTimerConversion.length)
                                                : 0}%
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4">
                                        <p className="text-sm text-muted-foreground">Pending Follow-up</p>
                                        <p className="text-2xl font-bold text-yellow-600">
                                            {firstTimerConversion.reduce((sum, c) => sum + c.pendingFollowup, 0).toLocaleString()}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </TabsContent>

                    {/* Financial Tab */}
                    <TabsContent value="financial" className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <CardTitle>Financial Summary</CardTitle>
                                    <CardDescription>Income and expense breakdown</CardDescription>
                                </div>
                                <ExportDropdown
                                    data={financialSummary}
                                    filename="financial-summary"
                                />
                            </CardHeader>
                            <CardContent>
                                {isLoadingFinancial ? (
                                    <Skeleton className="h-[400px] w-full" />
                                ) : financialChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={400}>
                                        <BarChart data={financialChartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                            <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" />
                                            <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={yAxisCurrencyFormatter} />
                                            <Tooltip content={<FinancialTooltip />} />
                                            <Legend />
                                            <Bar dataKey="tithes" fill={CHART_COLORS.primary} name="Tithes" radius={[4, 4, 0, 0]} stackId="income" />
                                            <Bar dataKey="offerings" fill={CHART_COLORS.secondary} name="Offerings" radius={[4, 4, 0, 0]} stackId="income" />
                                            <Bar dataKey="donations" fill={CHART_COLORS.tertiary} name="Donations" radius={[4, 4, 0, 0]} stackId="income" />
                                            <Bar dataKey="expenses" fill={CHART_COLORS.destructive} name="Expenses" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                                        <div className="text-center">
                                            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>No financial data available</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Financial Summary Table */}
                        {financialSummary.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Detailed Breakdown</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Period</TableHead>
                                                    <TableHead className="text-right">Tithes</TableHead>
                                                    <TableHead className="text-right">Offerings</TableHead>
                                                    <TableHead className="text-right">Donations</TableHead>
                                                    <TableHead className="text-right">Expenses</TableHead>
                                                    <TableHead className="text-right">Net</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {financialSummary.map((row, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell className="font-medium">{row.periodLabel}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(row.tithes)}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(row.offerings)}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(row.donations)}</TableCell>
                                                        <TableCell className="text-right text-red-600">{formatCurrency(row.totalExpenses)}</TableCell>
                                                        <TableCell className={cn(
                                                            "text-right font-medium",
                                                            row.netBalance >= 0 ? "text-green-600" : "text-red-600"
                                                        )}>
                                                            {formatCurrency(row.netBalance)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {/* Totals row */}
                                                <TableRow className="bg-muted/50 font-bold">
                                                    <TableCell>Total</TableCell>
                                                    <TableCell className="text-right">
                                                        {formatCurrency(financialSummary.reduce((s, r) => s + r.tithes, 0))}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {formatCurrency(financialSummary.reduce((s, r) => s + r.offerings, 0))}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {formatCurrency(financialSummary.reduce((s, r) => s + r.donations, 0))}
                                                    </TableCell>
                                                    <TableCell className="text-right text-red-600">
                                                        {formatCurrency(financialSummary.reduce((s, r) => s + r.totalExpenses, 0))}
                                                    </TableCell>
                                                    <TableCell className={cn(
                                                        "text-right",
                                                        financialSummary.reduce((s, r) => s + r.netBalance, 0) >= 0
                                                            ? "text-green-600"
                                                            : "text-red-600"
                                                    )}>
                                                        {formatCurrency(financialSummary.reduce((s, r) => s + r.netBalance, 0))}
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Events Tab */}
                    <TabsContent value="events" className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <CardTitle>Event Performance</CardTitle>
                                    <CardDescription>Attendance metrics by event</CardDescription>
                                </div>
                                <ExportDropdown
                                    data={eventPerformance.map(e => ({
                                        Event: e.eventName,
                                        Type: e.eventType,
                                        Frequency: e.frequency,
                                        Instances: e.totalInstances,
                                        'Avg Attendance': e.averageAttendance,
                                        'Highest': e.highestAttendance,
                                        'Lowest': e.lowestAttendance,
                                        Trend: e.trend,
                                    }))}
                                    filename="event-performance"
                                />
                            </CardHeader>
                            <CardContent>
                                {isLoadingEvents ? (
                                    <div className="space-y-3">
                                        {[...Array(5)].map((_, i) => (
                                            <Skeleton key={i} className="h-12 w-full" />
                                        ))}
                                    </div>
                                ) : eventPerformance.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Event</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead className="text-right">Instances</TableHead>
                                                    <TableHead className="text-right">Avg Attendance</TableHead>
                                                    <TableHead className="text-right hidden md:table-cell">Highest</TableHead>
                                                    <TableHead className="text-right hidden md:table-cell">Lowest</TableHead>
                                                    <TableHead className="text-right">Trend</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {eventPerformance.map((event) => (
                                                    <TableRow key={event.eventId}>
                                                        <TableCell className="font-medium">{event.eventName}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="capitalize">{event.eventType}</Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">{event.totalInstances}</TableCell>
                                                        <TableCell className="text-right font-medium">{event.averageAttendance}</TableCell>
                                                        <TableCell className="text-right hidden md:table-cell">{event.highestAttendance}</TableCell>
                                                        <TableCell className="text-right hidden md:table-cell">{event.lowestAttendance}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Badge className={cn(
                                                                event.trend === 'up' && "bg-green-500/10 text-green-600",
                                                                event.trend === 'down' && "bg-red-500/10 text-red-600",
                                                                event.trend === 'stable' && "bg-gray-500/10 text-gray-600",
                                                            )}>
                                                                {event.trend === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
                                                                {event.trend === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
                                                                {event.trend === 'stable' && <Minus className="h-3 w-3 mr-1" />}
                                                                {event.trend === 'stable' ? 'Stable' : `${event.trendPercentage >= 0 ? '+' : ''}${event.trendPercentage}%`}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No event data available</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Families Tab */}
                    <TabsContent value="families" className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <CardTitle>Family Attendance</CardTitle>
                                    <CardDescription>Track family engagement</CardDescription>
                                </div>
                                <ExportDropdown
                                    data={familyAttendance.map(f => ({
                                        Family: f.familyName,
                                        'Head of Family': f.headOfFamily,
                                        'Total Members': f.totalMembers,
                                        'Active Members': f.activeMembers,
                                        'Last Attendance': f.lastFamilyAttendance,
                                        'Attendance Rate': `${f.averageAttendanceRate}%`,
                                        Status: f.status,
                                    }))}
                                    filename="family-attendance"
                                />
                            </CardHeader>
                            <CardContent>
                                {isLoadingFamilies ? (
                                    <div className="space-y-3">
                                        {[...Array(5)].map((_, i) => (
                                            <Skeleton key={i} className="h-12 w-full" />
                                        ))}
                                    </div>
                                ) : familyAttendance.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Family</TableHead>
                                                    <TableHead className="hidden md:table-cell">Head</TableHead>
                                                    <TableHead className="text-right">Members</TableHead>
                                                    <TableHead className="text-right">Active</TableHead>
                                                    <TableHead className="hidden sm:table-cell">Last Attended</TableHead>
                                                    <TableHead className="text-right">Rate</TableHead>
                                                    <TableHead>Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {familyAttendance.map((family) => (
                                                    <TableRow key={family.familyId}>
                                                        <TableCell className="font-medium">
                                                            <div className="flex items-center gap-2">
                                                                <Home className="h-4 w-4 text-muted-foreground" />
                                                                {family.familyName}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="hidden md:table-cell">{family.headOfFamily}</TableCell>
                                                        <TableCell className="text-right">{family.totalMembers}</TableCell>
                                                        <TableCell className="text-right">{family.activeMembers}</TableCell>
                                                        <TableCell className="hidden sm:table-cell">{family.lastFamilyAttendance}</TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                                                    <div
                                                                        className={cn(
                                                                            "h-full rounded-full",
                                                                            family.averageAttendanceRate >= 70 && "bg-green-500",
                                                                            family.averageAttendanceRate >= 30 && family.averageAttendanceRate < 70 && "bg-yellow-500",
                                                                            family.averageAttendanceRate < 30 && "bg-red-500",
                                                                        )}
                                                                        style={{ width: `${family.averageAttendanceRate}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-sm">{family.averageAttendanceRate}%</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={cn(
                                                                family.status === 'active' && "bg-green-500/10 text-green-600",
                                                                family.status === 'irregular' && "bg-yellow-500/10 text-yellow-600",
                                                                family.status === 'inactive' && "bg-red-500/10 text-red-600",
                                                            )}>
                                                                {family.status}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No family data available</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Inactive Tab */}
                    <TabsContent value="inactive" className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <CardTitle>Inactive Members</CardTitle>
                                    <CardDescription>Members who haven't attended recently</CardDescription>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <Label className="text-sm">Inactive for:</Label>
                                        <Select value={inactiveDays.toString()} onValueChange={(v) => setInactiveDays(parseInt(v))}>
                                            <SelectTrigger className="w-32">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="14">14+ days</SelectItem>
                                                <SelectItem value="30">30+ days</SelectItem>
                                                <SelectItem value="60">60+ days</SelectItem>
                                                <SelectItem value="90">90+ days</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <ExportDropdown
                                        data={inactiveMembers.map(m => ({
                                            Name: m.memberName,
                                            Email: m.email,
                                            Phone: m.phone,
                                            'Last Attended': m.lastAttended,
                                            'Days Inactive': m.daysInactive,
                                            'Total Attendance': m.totalAttendanceCount,
                                        }))}
                                        filename="inactive-members"
                                    />
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoadingInactive ? (
                                    <div className="space-y-3">
                                        {[...Array(5)].map((_, i) => (
                                            <Skeleton key={i} className="h-16 w-full" />
                                        ))}
                                    </div>
                                ) : inactiveMembers.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Member</TableHead>
                                                    <TableHead className="hidden md:table-cell">Contact</TableHead>
                                                    <TableHead>Last Attended</TableHead>
                                                    <TableHead className="text-right">Days Inactive</TableHead>
                                                    <TableHead className="text-right hidden sm:table-cell">Total Attendance</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {inactiveMembers.map((member) => (
                                                    <TableRow key={member.memberId}>
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarImage src={member.profilePhoto} />
                                                                    <AvatarFallback>
                                                                        {member.memberName.split(' ').map(n => n[0]).join('')}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span className="font-medium">{member.memberName}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="hidden md:table-cell">
                                                            <div className="text-sm">
                                                                <p>{member.email}</p>
                                                                <p className="text-muted-foreground">{member.phone}</p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{member.lastAttended}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Badge className={cn(
                                                                member.daysInactive > 60 && "bg-red-500/10 text-red-600",
                                                                member.daysInactive > 30 && member.daysInactive <= 60 && "bg-yellow-500/10 text-yellow-600",
                                                                member.daysInactive <= 30 && "bg-orange-500/10 text-orange-600",
                                                            )}>
                                                                {member.daysInactive} days
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right hidden sm:table-cell">
                                                            {member.totalAttendanceCount}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button size="sm" variant="outline">
                                                                Follow Up
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <UserX className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No inactive members found</p>
                                        <p className="text-sm">All members have attended within the last {inactiveDays} days</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}