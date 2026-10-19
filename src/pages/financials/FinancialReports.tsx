// src/pages/financials/FinancialReports.tsx

import { useState, useMemo } from 'react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ExportDropdown } from '@/components/ExportDropdown';
import { Separator } from '@/components/ui/separator';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Calendar,
    RefreshCw,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
    Receipt,
    Building2,
    Target,
    Printer,
    CreditCard,
    Smartphone,
    BarChart3,
    LineChart as LineChartIcon,
} from 'lucide-react';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ComposedChart,
} from 'recharts';
import { useFinancialSummary, useTransactions, useAccounts, useExpenseCategories } from '@/hooks/useFinancials';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';
import { MonthlyTrendItem } from '@/types/financial';

const CHART_COLORS = {
    income: '#10b981',
    expense: '#ef4444',
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    tertiary: '#f59e0b',
    net: '#06b6d4',
};

const PIE_COLORS = ['#3b82f6', '#10b981', '#ec4899', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444'];

// Date range presets
const DATE_PRESETS = [
    { value: 'this-month', label: 'This Month' },
    { value: 'last-month', label: 'Last Month' },
    { value: 'last-3-months', label: 'Last 3 Months' },
    { value: 'last-6-months', label: 'Last 6 Months' },
    { value: 'this-year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' },
];

// Trend months options
const TREND_MONTHS_OPTIONS = [
    { value: 3, label: 'Last 3 Months' },
    { value: 6, label: 'Last 6 Months' },
    { value: 12, label: 'Last 12 Months' },
    { value: 24, label: 'Last 24 Months' },
];

export default function FinancialReports() {
    const [datePreset, setDatePreset] = useState('this-month');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [trendMonths, setTrendMonths] = useState(6);

    // Currency hook
    const { formatCurrency, formatCompact, currencySymbol } = useCurrency();

    // Calculate date range based on preset
    const dateRange = useMemo(() => {
        const now = new Date();
        let start: Date;
        let end: Date = endOfMonth(now);

        switch (datePreset) {
            case 'this-month':
                start = startOfMonth(now);
                break;
            case 'last-month':
                start = startOfMonth(subMonths(now, 1));
                end = endOfMonth(subMonths(now, 1));
                break;
            case 'last-3-months':
                start = startOfMonth(subMonths(now, 2));
                break;
            case 'last-6-months':
                start = startOfMonth(subMonths(now, 5));
                break;
            case 'this-year':
                start = new Date(now.getFullYear(), 0, 1);
                break;
            case 'custom':
                start = customStartDate ? new Date(customStartDate) : startOfMonth(now);
                end = customEndDate ? new Date(customEndDate) : endOfMonth(now);
                break;
            default:
                start = startOfMonth(now);
        }

        return {
            start: format(start, 'yyyy-MM-dd'),
            end: format(end, 'yyyy-MM-dd'),
        };
    }, [datePreset, customStartDate, customEndDate]);

    // Hooks - now with trend support
    const {
        summary,
        isLoading: isLoadingSummary,
        refetch
    } = useFinancialSummary(
        dateRange.start,
        dateRange.end,
        true,  // includeTrend
        trendMonths
    );

    const { transactions, isLoading: isLoadingTransactions } = useTransactions({
        startDate: dateRange.start,
        endDate: dateRange.end,
        limit: 100,
    });
    const { accounts } = useAccounts();
    const { categories } = useExpenseCategories();

    // Calculated metrics
    const netIncome = (summary?.totalIncome || 0) - (summary?.totalExpenses || 0);
    const profitMargin = summary?.totalIncome ? ((netIncome / summary.totalIncome) * 100).toFixed(1) : '0';

    // Income breakdown data
    const incomeBreakdownData = summary ? [
        { name: 'Tithes', value: summary.incomeBreakdown?.tithes || 0, color: PIE_COLORS[0] },
        { name: 'Offerings', value: summary.incomeBreakdown?.offerings || 0, color: PIE_COLORS[1] },
        { name: 'Donations', value: summary.incomeBreakdown?.donations || 0, color: PIE_COLORS[2] },
        { name: 'Pledges', value: summary.incomeBreakdown?.pledges || 0, color: PIE_COLORS[3] },
        { name: 'Other', value: summary.incomeBreakdown?.other || 0, color: PIE_COLORS[4] },
    ].filter(d => d.value > 0) : [];

    // Payment channel data
    const paymentChannelData = summary ? [
        {
            name: 'Cash',
            value: summary.paymentChannels?.cash || 0,
            icon: Wallet,
            color: PIE_COLORS[0]
        },
        {
            name: 'Bank Transfer',
            value: summary.paymentChannels?.bankTransfer || 0,
            icon: Building2,
            color: PIE_COLORS[1]
        },
        {
            name: 'Card',
            value: summary.paymentChannels?.card || 0,
            icon: CreditCard,
            color: PIE_COLORS[2]
        },
        {
            name: 'Mobile Money',
            value: summary.paymentChannels?.mobileMoney || 0,
            icon: Smartphone,
            color: PIE_COLORS[3]
        },
        {
            name: 'Online',
            value: summary.paymentChannels?.online || 0,
            icon: DollarSign,
            color: PIE_COLORS[4]
        },
        {
            name: 'Other',
            value: summary.paymentChannels?.other || 0,
            icon: Wallet,
            color: PIE_COLORS[6]
        },
    ].filter(d => d.value > 0) : [];

    // Monthly trend data from API - with proper transformation
    const monthlyTrendData: MonthlyTrendItem[] = useMemo(() => {
        if (summary?.monthlyTrend && Array.isArray(summary.monthlyTrend) && summary.monthlyTrend.length > 0) {
            return summary.monthlyTrend;
        }
        // Return empty array if no data - charts will show "No data" message
        return [];
    }, [summary?.monthlyTrend]);

    // Transform monthly trend for chart display
    const chartTrendData = useMemo(() => {
        return monthlyTrendData.map(item => ({
            name: `${item.month} ${item.year}`,
            month: item.month,
            year: item.year,
            income: item.income,
            expenses: item.expenses,
            net: item.net,
            transactionCount: item.transactionCount,
        }));
    }, [monthlyTrendData]);

    // Calculate trend statistics
    const trendStats = useMemo(() => {
        if (monthlyTrendData.length < 2) {
            return { incomeChange: 0, expenseChange: 0, netChange: 0 };
        }

        const current = monthlyTrendData[monthlyTrendData.length - 1];
        const previous = monthlyTrendData[monthlyTrendData.length - 2];

        const incomeChange = previous.income > 0
            ? ((current.income - previous.income) / previous.income * 100)
            : 0;
        const expenseChange = previous.expenses > 0
            ? ((current.expenses - previous.expenses) / previous.expenses * 100)
            : 0;
        const netChange = previous.net !== 0
            ? ((current.net - previous.net) / Math.abs(previous.net) * 100)
            : 0;

        return {
            incomeChange: parseFloat(incomeChange.toFixed(1)),
            expenseChange: parseFloat(expenseChange.toFixed(1)),
            netChange: parseFloat(netChange.toFixed(1)),
        };
    }, [monthlyTrendData]);

    // Expense by category data
    const expenseByCategoryData = summary?.expensesByCategory?.map((item, index) => ({
        name: item.categoryName || 'Unknown',
        value: Math.abs(item.amount || 0),
        color: PIE_COLORS[index % PIE_COLORS.length],
    })) || [];

    // Top transactions
    const topTransactions = [...transactions]
        .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
        .slice(0, 10);

    const handlePrint = () => {
        window.print();
    };

    const exportReportData = {
        summary: {
            totalIncome: summary?.totalIncome || 0,
            totalExpenses: summary?.totalExpenses || 0,
            netIncome,
            profitMargin: `${profitMargin}%`,
        },
        incomeBreakdown: incomeBreakdownData,
        paymentChannels: paymentChannelData,
        expensesByCategory: expenseByCategoryData,
        monthlyTrend: monthlyTrendData,
        dateRange,
    };

    // Custom tooltip for charts with currency support
    const CustomTooltip = ({ active, payload, label }: any) => {
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

    // Y-axis tick formatter for charts
    const yAxisTickFormatter = (value: number) => {
        if (Math.abs(value) >= 1000000) {
            return `${currencySymbol}${(value / 1000000).toFixed(1)}M`;
        }
        if (Math.abs(value) >= 1000) {
            return `${currencySymbol}${(value / 1000).toFixed(0)}k`;
        }
        return `${currencySymbol}${value}`;
    };

    return (
        <DashboardLayout
            title="Financial Reports"
            actions={
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => refetch()} disabled={isLoadingSummary}>
                        <RefreshCw className={cn("h-4 w-4 mr-2", isLoadingSummary && "animate-spin")} />
                        Refresh
                    </Button>
                    <Button variant="outline" onClick={handlePrint} className="gap-2">
                        <Printer className="h-4 w-4" />
                        <span className="hidden sm:inline">Print</span>
                    </Button>
                    <ExportDropdown
                        data={[exportReportData]}
                        filename={`financial-report-${dateRange.start}-to-${dateRange.end}`}
                    />
                </div>
            }
        >
            <div className="p-4 md:p-6 space-y-6 print:p-0">
                {/* Date Range Selector */}
                <Card className="print:hidden">
                    <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                <span className="font-medium">Report Period:</span>
                            </div>
                            <Select value={datePreset} onValueChange={setDatePreset}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {DATE_PRESETS.map(preset => (
                                        <SelectItem key={preset.value} value={preset.value}>
                                            {preset.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {datePreset === 'custom' && (
                                <div className="flex gap-2">
                                    <Input
                                        type="date"
                                        value={customStartDate}
                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                        className="w-auto"
                                    />
                                    <span className="self-center text-muted-foreground">to</span>
                                    <Input
                                        type="date"
                                        value={customEndDate}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                        className="w-auto"
                                    />
                                </div>
                            )}

                            <div className="flex items-center gap-2 ml-auto">
                                <LineChartIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Trend:</span>
                                <Select
                                    value={trendMonths.toString()}
                                    onValueChange={(v) => setTrendMonths(parseInt(v))}
                                >
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TREND_MONTHS_OPTIONS.map(option => (
                                            <SelectItem key={option.value} value={option.value.toString()}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Badge variant="secondary">
                                {format(new Date(dateRange.start), 'MMM d')} - {format(new Date(dateRange.end), 'MMM d, yyyy')}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Key Metrics */}
                <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardContent className="p-4 md:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs md:text-sm text-muted-foreground">Total Income</p>
                                    {isLoadingSummary ? (
                                        <Skeleton className="h-8 w-24 mt-1" />
                                    ) : (
                                        <>
                                            <p className="text-xl font-bold text-green-600">
                                                {formatCurrency(summary?.totalIncome || 0)}
                                            </p>
                                            {trendStats.incomeChange !== 0 && (
                                                <p className={cn(
                                                    "text-xs flex items-center gap-1 mt-1",
                                                    trendStats.incomeChange >= 0 ? "text-green-600" : "text-red-600"
                                                )}>
                                                    {trendStats.incomeChange >= 0 ? (
                                                        <ArrowUpRight className="h-3 w-3" />
                                                    ) : (
                                                        <ArrowDownRight className="h-3 w-3" />
                                                    )}
                                                    {Math.abs(trendStats.incomeChange)}% vs last month
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                                <div className="p-3 rounded-full bg-green-500/10">
                                    <TrendingUp className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 md:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs md:text-sm text-muted-foreground">Total Expenses</p>
                                    {isLoadingSummary ? (
                                        <Skeleton className="h-8 w-24 mt-1" />
                                    ) : (
                                        <>
                                            <p className="text-xl font-bold text-red-600">
                                                {formatCurrency(summary?.totalExpenses || 0)}
                                            </p>
                                            {trendStats.expenseChange !== 0 && (
                                                <p className={cn(
                                                    "text-xs flex items-center gap-1 mt-1",
                                                    trendStats.expenseChange <= 0 ? "text-green-600" : "text-red-600"
                                                )}>
                                                    {trendStats.expenseChange >= 0 ? (
                                                        <ArrowUpRight className="h-3 w-3" />
                                                    ) : (
                                                        <ArrowDownRight className="h-3 w-3" />
                                                    )}
                                                    {Math.abs(trendStats.expenseChange)}% vs last month
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                                <div className="p-3 rounded-full bg-red-500/10">
                                    <TrendingDown className="h-6 w-6 text-red-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 md:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs md:text-sm text-muted-foreground">Net Income</p>
                                    {isLoadingSummary ? (
                                        <Skeleton className="h-8 w-24 mt-1" />
                                    ) : (
                                        <>
                                            <p className={cn(
                                                "text-xl font-bold",
                                                netIncome >= 0 ? "text-green-600" : "text-red-600"
                                            )}>
                                                {netIncome < 0 ? '-' : ''}{formatCurrency(Math.abs(netIncome))}
                                            </p>
                                            {trendStats.netChange !== 0 && (
                                                <p className={cn(
                                                    "text-xs flex items-center gap-1 mt-1",
                                                    trendStats.netChange >= 0 ? "text-green-600" : "text-red-600"
                                                )}>
                                                    {trendStats.netChange >= 0 ? (
                                                        <ArrowUpRight className="h-3 w-3" />
                                                    ) : (
                                                        <ArrowDownRight className="h-3 w-3" />
                                                    )}
                                                    {Math.abs(trendStats.netChange)}% vs last month
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                                <div className={cn(
                                    "p-3 rounded-full",
                                    netIncome >= 0 ? "bg-green-500/10" : "bg-red-500/10"
                                )}>
                                    {netIncome >= 0 ? (
                                        <ArrowUpRight className="h-6 w-6 text-green-600" />
                                    ) : (
                                        <ArrowDownRight className="h-6 w-6 text-red-600" />
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 md:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs md:text-sm text-muted-foreground">Profit Margin</p>
                                    {isLoadingSummary ? (
                                        <Skeleton className="h-8 w-16 mt-1" />
                                    ) : (
                                        <p className={cn(
                                            "text-2xl md:text-3xl font-bold",
                                            parseFloat(profitMargin) >= 0 ? "text-green-600" : "text-red-600"
                                        )}>
                                            {profitMargin}%
                                        </p>
                                    )}
                                </div>
                                <div className="p-3 rounded-full bg-primary/10">
                                    <Target className="h-6 w-6 text-primary" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Report Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="print:hidden">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
                        <TabsTrigger value="income">Income Analysis</TabsTrigger>
                        <TabsTrigger value="expenses">Expense Analysis</TabsTrigger>
                        <TabsTrigger value="accounts">Account Summary</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6 mt-6">
                        {/* Income vs Expenses Trend Chart */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Income vs Expenses Trend</CardTitle>
                                        <CardDescription>
                                            Monthly comparison for the last {trendMonths} months
                                        </CardDescription>
                                    </div>
                                    <Badge variant="outline" className="flex items-center gap-1">
                                        <BarChart3 className="h-3 w-3" />
                                        {chartTrendData.length} months
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoadingSummary ? (
                                    <Skeleton className="h-[300px] w-full" />
                                ) : chartTrendData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <ComposedChart data={chartTrendData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                            <XAxis
                                                dataKey="name"
                                                stroke="hsl(var(--muted-foreground))"
                                                tick={{ fontSize: 12 }}
                                            />
                                            <YAxis
                                                stroke="hsl(var(--muted-foreground))"
                                                tickFormatter={yAxisTickFormatter}
                                            />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />
                                            <Bar
                                                dataKey="income"
                                                name="Income"
                                                fill={CHART_COLORS.income}
                                                radius={[4, 4, 0, 0]}
                                            />
                                            <Bar
                                                dataKey="expenses"
                                                name="Expenses"
                                                fill={CHART_COLORS.expense}
                                                radius={[4, 4, 0, 0]}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="net"
                                                name="Net"
                                                stroke={CHART_COLORS.net}
                                                strokeWidth={3}
                                                dot={{ fill: CHART_COLORS.net, strokeWidth: 2 }}
                                            />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                                        <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
                                        <p>No trend data available</p>
                                        <p className="text-sm">Record some transactions to see trends</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Two Column Charts */}
                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Income Breakdown */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Income Distribution</CardTitle>
                                    <CardDescription>Breakdown by income type</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {isLoadingSummary ? (
                                        <Skeleton className="h-[250px] w-full" />
                                    ) : incomeBreakdownData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={250}>
                                            <RechartsPieChart>
                                                <Pie
                                                    data={incomeBreakdownData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={90}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                >
                                                    {incomeBreakdownData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(value: number) => [formatCurrency(value), 'Amount']}
                                                    contentStyle={{
                                                        backgroundColor: 'hsl(var(--card))',
                                                        border: '1px solid hsl(var(--border))',
                                                        borderRadius: 'var(--radius)',
                                                    }}
                                                />
                                            </RechartsPieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                                            No income data available
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Payment Channels */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Payment Channels</CardTitle>
                                    <CardDescription>How payments were received</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {isLoadingSummary ? (
                                        <Skeleton className="h-[250px] w-full" />
                                    ) : paymentChannelData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={250}>
                                            <BarChart data={paymentChannelData} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                                <XAxis type="number" stroke="hsl(var(--muted-foreground))" tickFormatter={yAxisTickFormatter} />
                                                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={100} />
                                                <Tooltip
                                                    formatter={(value: number) => [formatCurrency(value), 'Amount']}
                                                    contentStyle={{
                                                        backgroundColor: 'hsl(var(--card))',
                                                        border: '1px solid hsl(var(--border))',
                                                        borderRadius: 'var(--radius)',
                                                    }}
                                                />
                                                <Bar dataKey="value" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]}>
                                                    {paymentChannelData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                                            No payment data available
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Top Transactions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Top Transactions</CardTitle>
                                <CardDescription>Largest transactions in this period</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoadingTransactions ? (
                                    <div className="space-y-3">
                                        {[...Array(5)].map((_, i) => (
                                            <Skeleton key={i} className="h-12 w-full" />
                                        ))}
                                    </div>
                                ) : topTransactions.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead className="hidden md:table-cell">Description</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {topTransactions.map((transaction) => (
                                                <TableRow key={transaction.id}>
                                                    <TableCell>
                                                        {format(new Date(transaction.transactionDate), 'MMM d, yyyy')}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="capitalize">
                                                            {transaction.transactionType}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                                                        {transaction.description || '-'}
                                                    </TableCell>
                                                    <TableCell className={cn(
                                                        "text-right font-medium",
                                                        transaction.amount > 0 ? "text-green-600" : "text-red-600"
                                                    )}>
                                                        {transaction.amount > 0 ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No transactions in this period
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Monthly Trends Tab */}
                    <TabsContent value="trends" className="space-y-6 mt-6">
                        {/* Trend Summary Cards */}
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Average Monthly Income</p>
                                            <p className="text-2xl font-bold text-green-600">
                                                {formatCurrency(
                                                    monthlyTrendData.length > 0
                                                        ? Math.round(monthlyTrendData.reduce((sum, m) => sum + m.income, 0) / monthlyTrendData.length)
                                                        : 0
                                                )}
                                            </p>
                                        </div>
                                        <TrendingUp className="h-8 w-8 text-green-500/50" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Average Monthly Expenses</p>
                                            <p className="text-2xl font-bold text-red-600">
                                                {formatCurrency(
                                                    monthlyTrendData.length > 0
                                                        ? Math.round(monthlyTrendData.reduce((sum, m) => sum + m.expenses, 0) / monthlyTrendData.length)
                                                        : 0
                                                )}
                                            </p>
                                        </div>
                                        <TrendingDown className="h-8 w-8 text-red-500/50" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Average Net Income</p>
                                            <p className={cn(
                                                "text-2xl font-bold",
                                                monthlyTrendData.reduce((sum, m) => sum + m.net, 0) >= 0
                                                    ? "text-green-600"
                                                    : "text-red-600"
                                            )}>
                                                {formatCurrency(
                                                    monthlyTrendData.length > 0
                                                        ? Math.round(monthlyTrendData.reduce((sum, m) => sum + m.net, 0) / monthlyTrendData.length)
                                                        : 0
                                                )}
                                            </p>
                                        </div>
                                        <Target className="h-8 w-8 text-primary/50" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Area Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Financial Trend Over Time</CardTitle>
                                <CardDescription>
                                    Income, expenses, and net balance for the last {trendMonths} months
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoadingSummary ? (
                                    <Skeleton className="h-[400px] w-full" />
                                ) : chartTrendData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={400}>
                                        <AreaChart data={chartTrendData}>
                                            <defs>
                                                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={CHART_COLORS.income} stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor={CHART_COLORS.income} stopOpacity={0}/>
                                                </linearGradient>
                                                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={CHART_COLORS.expense} stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor={CHART_COLORS.expense} stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                            <XAxis
                                                dataKey="name"
                                                stroke="hsl(var(--muted-foreground))"
                                                tick={{ fontSize: 12 }}
                                            />
                                            <YAxis
                                                stroke="hsl(var(--muted-foreground))"
                                                tickFormatter={yAxisTickFormatter}
                                            />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />
                                            <Area
                                                type="monotone"
                                                dataKey="income"
                                                name="Income"
                                                stroke={CHART_COLORS.income}
                                                fillOpacity={1}
                                                fill="url(#incomeGradient)"
                                                strokeWidth={2}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="expenses"
                                                name="Expenses"
                                                stroke={CHART_COLORS.expense}
                                                fillOpacity={1}
                                                fill="url(#expenseGradient)"
                                                strokeWidth={2}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="net"
                                                name="Net"
                                                stroke={CHART_COLORS.net}
                                                strokeWidth={3}
                                                dot={{ fill: CHART_COLORS.net, strokeWidth: 2, r: 4 }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground">
                                        <LineChartIcon className="h-16 w-16 mb-4 opacity-50" />
                                        <p className="text-lg font-medium">No trend data available</p>
                                        <p className="text-sm">Record transactions to see financial trends</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Monthly Data Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Monthly Breakdown</CardTitle>
                                <CardDescription>Detailed monthly financial data</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {monthlyTrendData.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Month</TableHead>
                                                <TableHead className="text-right">Income</TableHead>
                                                <TableHead className="text-right">Expenses</TableHead>
                                                <TableHead className="text-right">Net</TableHead>
                                                <TableHead className="text-right hidden md:table-cell">Transactions</TableHead>
                                                <TableHead className="text-right hidden lg:table-cell">Margin</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {monthlyTrendData.map((item, index) => {
                                                const margin = item.income > 0
                                                    ? ((item.net / item.income) * 100).toFixed(1)
                                                    : '0';
                                                return (
                                                    <TableRow key={index}>
                                                        <TableCell className="font-medium">
                                                            {item.monthFull} {item.year}
                                                        </TableCell>
                                                        <TableCell className="text-right text-green-600">
                                                            {formatCurrency(item.income)}
                                                        </TableCell>
                                                        <TableCell className="text-right text-red-600">
                                                            {formatCurrency(item.expenses)}
                                                        </TableCell>
                                                        <TableCell className={cn(
                                                            "text-right font-medium",
                                                            item.net >= 0 ? "text-green-600" : "text-red-600"
                                                        )}>
                                                            {item.net < 0 ? '-' : ''}{formatCurrency(Math.abs(item.net))}
                                                        </TableCell>
                                                        <TableCell className="text-right hidden md:table-cell">
                                                            <Badge variant="outline">{item.transactionCount}</Badge>
                                                        </TableCell>
                                                        <TableCell className={cn(
                                                            "text-right hidden lg:table-cell",
                                                            parseFloat(margin) >= 0 ? "text-green-600" : "text-red-600"
                                                        )}>
                                                            {margin}%
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                            {/* Totals Row */}
                                            <TableRow className="bg-muted/50 font-bold">
                                                <TableCell>Total / Average</TableCell>
                                                <TableCell className="text-right text-green-600">
                                                    {formatCurrency(monthlyTrendData.reduce((sum, m) => sum + m.income, 0))}
                                                </TableCell>
                                                <TableCell className="text-right text-red-600">
                                                    {formatCurrency(monthlyTrendData.reduce((sum, m) => sum + m.expenses, 0))}
                                                </TableCell>
                                                <TableCell className={cn(
                                                    "text-right",
                                                    monthlyTrendData.reduce((sum, m) => sum + m.net, 0) >= 0
                                                        ? "text-green-600"
                                                        : "text-red-600"
                                                )}>
                                                    {formatCurrency(Math.abs(monthlyTrendData.reduce((sum, m) => sum + m.net, 0)))}
                                                </TableCell>
                                                <TableCell className="text-right hidden md:table-cell">
                                                    <Badge>{monthlyTrendData.reduce((sum, m) => sum + m.transactionCount, 0)}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right hidden lg:table-cell">
                                                    {(() => {
                                                        const totalIncome = monthlyTrendData.reduce((sum, m) => sum + m.income, 0);
                                                        const totalNet = monthlyTrendData.reduce((sum, m) => sum + m.net, 0);
                                                        return totalIncome > 0
                                                            ? `${((totalNet / totalIncome) * 100).toFixed(1)}%`
                                                            : '0%';
                                                    })()}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No monthly data available</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Year-over-Year Comparison if we have enough data */}
                        {monthlyTrendData.length >= 12 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Monthly Comparison Chart</CardTitle>
                                    <CardDescription>Visual comparison of all months</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={chartTrendData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                            <XAxis
                                                dataKey="month"
                                                stroke="hsl(var(--muted-foreground))"
                                            />
                                            <YAxis
                                                stroke="hsl(var(--muted-foreground))"
                                                tickFormatter={yAxisTickFormatter}
                                            />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />
                                            <Bar dataKey="income" name="Income" fill={CHART_COLORS.income} />
                                            <Bar dataKey="expenses" name="Expenses" fill={CHART_COLORS.expense} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Income Analysis Tab */}
                    <TabsContent value="income" className="space-y-6 mt-6">
                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Income by Type */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Income by Type</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {incomeBreakdownData.map((item) => {
                                            const percentage = summary?.totalIncome
                                                ? ((item.value / summary.totalIncome) * 100).toFixed(1)
                                                : '0';
                                            return (
                                                <div key={item.name} className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="flex items-center gap-2">
                                                            <div
                                                                className="w-3 h-3 rounded-full"
                                                                style={{ backgroundColor: item.color }}
                                                            />
                                                            {item.name}
                                                        </span>
                                                        <span className="font-medium">{formatCurrency(item.value)}</span>
                                                    </div>
                                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all"
                                                            style={{
                                                                width: `${percentage}%`,
                                                                backgroundColor: item.color,
                                                            }}
                                                        />
                                                    </div>
                                                    <p className="text-xs text-muted-foreground text-right">{percentage}%</p>
                                                </div>
                                            );
                                        })}
                                        {incomeBreakdownData.length === 0 && (
                                            <p className="text-center text-muted-foreground py-4">No income data</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Income Summary */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Income Summary</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center py-3 border-b">
                                            <span className="text-muted-foreground">Tithes</span>
                                            <span className="font-medium">{formatCurrency(summary?.incomeBreakdown?.tithes || 0)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-3 border-b">
                                            <span className="text-muted-foreground">Offerings</span>
                                            <span className="font-medium">{formatCurrency(summary?.incomeBreakdown?.offerings || 0)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-3 border-b">
                                            <span className="text-muted-foreground">Donations</span>
                                            <span className="font-medium">{formatCurrency(summary?.incomeBreakdown?.donations || 0)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-3 border-b">
                                            <span className="text-muted-foreground">Pledges</span>
                                            <span className="font-medium">{formatCurrency(summary?.incomeBreakdown?.pledges || 0)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-3 border-b">
                                            <span className="text-muted-foreground">Other Income</span>
                                            <span className="font-medium">{formatCurrency(summary?.incomeBreakdown?.other || 0)}</span>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between items-center py-3">
                                            <span className="font-semibold">Total Income</span>
                                            <span className="font-bold text-lg text-green-600">
                                                {formatCurrency(summary?.totalIncome || 0)}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Payment Methods Breakdown */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Payment Methods Analysis</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                    {paymentChannelData.map((item) => (
                                        <Card key={item.name}>
                                            <CardContent className="p-4 text-center">
                                                <item.icon className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                                                <p className="text-lg font-bold">{formatCurrency(item.value)}</p>
                                                <p className="text-xs text-muted-foreground">{item.name}</p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {paymentChannelData.length === 0 && (
                                        <div className="col-span-full text-center py-8 text-muted-foreground">
                                            No payment data available
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Income Trend */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Income Trend</CardTitle>
                                <CardDescription>Monthly income over time</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {chartTrendData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <LineChart data={chartTrendData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                                            <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={yAxisTickFormatter} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Line
                                                type="monotone"
                                                dataKey="income"
                                                name="Income"
                                                stroke={CHART_COLORS.income}
                                                strokeWidth={3}
                                                dot={{ fill: CHART_COLORS.income, strokeWidth: 2, r: 4 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                                        No trend data available
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Expense Analysis Tab */}
                    <TabsContent value="expenses" className="space-y-6 mt-6">
                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Expenses by Category Chart */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Expenses by Category</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {isLoadingSummary ? (
                                        <Skeleton className="h-[300px] w-full" />
                                    ) : expenseByCategoryData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={300}>
                                            <RechartsPieChart>
                                                <Pie
                                                    data={expenseByCategoryData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={70}
                                                    outerRadius={110}
                                                    paddingAngle={3}
                                                    dataKey="value"
                                                    label={({ name, value }) => `${name}: ${formatCompact(value)}`}
                                                >
                                                    {expenseByCategoryData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(value: number) => [formatCurrency(value), 'Amount']}
                                                    contentStyle={{
                                                        backgroundColor: 'hsl(var(--card))',
                                                        border: '1px solid hsl(var(--border))',
                                                        borderRadius: 'var(--radius)',
                                                    }}
                                                />
                                                <Legend />
                                            </RechartsPieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                            No expense data available
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Expense Category Table */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Category Breakdown</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {expenseByCategoryData.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Category</TableHead>
                                                    <TableHead className="text-right">Amount</TableHead>
                                                    <TableHead className="text-right">% of Total</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {expenseByCategoryData.map((item) => {
                                                    const percentage = summary?.totalExpenses
                                                        ? ((item.value / summary.totalExpenses) * 100).toFixed(1)
                                                        : '0';
                                                    return (
                                                        <TableRow key={item.name}>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <div
                                                                        className="w-3 h-3 rounded-full"
                                                                        style={{ backgroundColor: item.color }}
                                                                    />
                                                                    {item.name}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right font-medium text-red-600">
                                                                {formatCurrency(item.value)}
                                                            </TableCell>
                                                            <TableCell className="text-right text-muted-foreground">
                                                                {percentage}%
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                                <TableRow className="bg-muted/50">
                                                    <TableCell className="font-bold">Total</TableCell>
                                                    <TableCell className="text-right font-bold text-red-600">
                                                        {formatCurrency(summary?.totalExpenses || 0)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold">100%</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No expense data available
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Expense Comparison */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Category Comparison</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {expenseByCategoryData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={expenseByCategoryData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                                            <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={yAxisTickFormatter} />
                                            <Tooltip
                                                formatter={(value: number) => [formatCurrency(value), 'Amount']}
                                                contentStyle={{
                                                    backgroundColor: 'hsl(var(--card))',
                                                    border: '1px solid hsl(var(--border))',
                                                    borderRadius: 'var(--radius)',
                                                }}
                                            />
                                            <Bar dataKey="value" fill={CHART_COLORS.expense} radius={[4, 4, 0, 0]}>
                                                {expenseByCategoryData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                        No expense data available
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Expense Trend */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Expense Trend</CardTitle>
                                <CardDescription>Monthly expenses over time</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {chartTrendData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <LineChart data={chartTrendData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                                            <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={yAxisTickFormatter} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Line
                                                type="monotone"
                                                dataKey="expenses"
                                                name="Expenses"
                                                stroke={CHART_COLORS.expense}
                                                strokeWidth={3}
                                                dot={{ fill: CHART_COLORS.expense, strokeWidth: 2, r: 4 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                                        No trend data available
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Account Summary Tab */}
                    <TabsContent value="accounts" className="space-y-6 mt-6">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {accounts.map((account) => (
                                <Card key={account.id}>
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "p-2 rounded-lg",
                                                    account.isActive ? "bg-primary/10" : "bg-muted"
                                                )}>
                                                    {account.accountType === 'bank' ? (
                                                        <Building2 className="h-5 w-5 text-primary" />
                                                    ) : account.accountType === 'digital' ? (
                                                        <Wallet className="h-5 w-5 text-purple-600" />
                                                    ) : (
                                                        <DollarSign className="h-5 w-5 text-green-600" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold">{account.name}</h3>
                                                    <p className="text-xs text-muted-foreground capitalize">{account.accountType}</p>
                                                </div>
                                            </div>
                                            <Badge variant={account.isActive ? "default" : "secondary"}>
                                                {account.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Current Balance</span>
                                                <span className={cn(
                                                    "font-bold text-lg",
                                                    account.balance >= 0 ? "text-green-600" : "text-red-600"
                                                )}>
                                                    {formatCurrency(Math.abs(account.balance))}
                                                </span>
                                            </div>
                                            {account.bankName && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Bank</span>
                                                    <span>{account.bankName}</span>
                                                </div>
                                            )}
                                            {account.transactionCount !== undefined && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Transactions</span>
                                                    <span>{account.transactionCount}</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {accounts.length === 0 && (
                                <div className="col-span-full text-center py-12 text-muted-foreground">
                                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No accounts found</p>
                                </div>
                            )}
                        </div>

                        {/* Account Balances Summary */}
                        {accounts.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Account Balances Overview</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Account</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Balance</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {accounts.map((account) => (
                                                <TableRow key={account.id}>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-medium">{account.name}</p>
                                                            {account.bankName && (
                                                                <p className="text-sm text-muted-foreground">{account.bankName}</p>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="capitalize">
                                                            {account.accountType}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={account.isActive ? "default" : "secondary"}>
                                                            {account.isActive ? 'Active' : 'Inactive'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className={cn(
                                                        "text-right font-medium",
                                                        account.balance >= 0 ? "text-green-600" : "text-red-600"
                                                    )}>
                                                        {formatCurrency(Math.abs(account.balance))}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow className="bg-muted/50">
                                                <TableCell colSpan={3} className="font-bold">Total Balance</TableCell>
                                                <TableCell className={cn(
                                                    "text-right font-bold text-lg",
                                                    accounts.reduce((sum, a) => sum + a.balance, 0) >= 0 ? "text-green-600" : "text-red-600"
                                                )}>
                                                    {formatCurrency(Math.abs(accounts.reduce((sum, a) => sum + a.balance, 0)))}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>

                {/* Print Footer */}
                <div className="hidden print:block mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
                    <p>Financial Report generated on {format(new Date(), 'PPP')}</p>
                    <p>Report Period: {format(new Date(dateRange.start), 'MMM d, yyyy')} - {format(new Date(dateRange.end), 'MMM d, yyyy')}</p>
                </div>
            </div>
        </DashboardLayout>
    );
}