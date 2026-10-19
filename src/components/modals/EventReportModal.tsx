// src/components/modals/EventReportModal.tsx
import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ExportDropdown } from '@/components/ExportDropdown';
import {
    Users,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Calendar,
    UserCheck,
    Baby,
    Download,
    CreditCard,
    Banknote,
    Wallet,
    Smartphone,
    PiggyBank,
    Receipt,
    Printer,
    Building2,
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    LineChart,
    Line,
} from 'recharts';
import { Event } from '@/lib/api';
import { useCurrency } from '@/hooks/useCurrency';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface EventReportModalProps {
    open: boolean;
    onClose: () => void;
    event: Event | null;
}

const ATTENDANCE_COLORS = ['#3b82f6', '#ec4899', '#22c55e', '#f59e0b', '#8b5cf6'];
const OFFERING_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

export function EventReportModal({ open, onClose, event }: EventReportModalProps) {
    const [activeTab, setActiveTab] = useState('overview');
    const [isLoading, setIsLoading] = useState(false);

    // Currency hook - same as Events page
    const { formatCurrency, currencySymbol, currencyCode } = useCurrency();

    // Reset tab when modal opens
    useEffect(() => {
        if (open) {
            setActiveTab('overview');
        }
    }, [open]);

    if (!event) return null;

    // Safely extract financial data
    const financials = event.financials || {
        totalOfferings: 0,
        totalExpenses: 0,
        netAmount: 0,
        breakdown: {
            tithes: 0,
            offerings: 0,
            donations: 0,
            pledges: 0,
        },
        offeringCount: 0,
        expenseCount: 0,
    };

    // Mock attendance data (would come from service reports or registrations)
    const attendanceData = {
        men: event.currentRegistrations ? Math.floor(event.currentRegistrations * 0.4) : 100,
        women: event.currentRegistrations ? Math.floor(event.currentRegistrations * 0.48) : 120,
        children: event.currentRegistrations ? Math.floor(event.currentRegistrations * 0.12) : 30,
        firstTimers: 5,
        returning: 3,
        total: event.currentRegistrations || 250,
    };

    // Offering breakdown using financials.breakdown
    const offeringBreakdown = [
        {
            name: 'Tithes',
            value: financials.breakdown?.tithes || 0,
            icon: Wallet,
            color: OFFERING_COLORS[0]
        },
        {
            name: 'Offerings',
            value: financials.breakdown?.offerings || 0,
            icon: DollarSign,
            color: OFFERING_COLORS[1]
        },
        {
            name: 'Donations',
            value: financials.breakdown?.donations || 0,
            icon: PiggyBank,
            color: OFFERING_COLORS[2]
        },
        {
            name: 'Pledges',
            value: financials.breakdown?.pledges || 0,
            icon: Receipt,
            color: OFFERING_COLORS[3]
        },
    ].filter(item => item.value > 0);

    // Attendance chart data
    const attendanceChartData = [
        { name: 'Men', value: attendanceData.men, color: ATTENDANCE_COLORS[0] },
        { name: 'Women', value: attendanceData.women, color: ATTENDANCE_COLORS[1] },
        { name: 'Children', value: attendanceData.children, color: ATTENDANCE_COLORS[2] },
    ];

    // Visitor chart data
    const visitorChartData = [
        { name: 'First Timers', value: attendanceData.firstTimers, color: ATTENDANCE_COLORS[3] },
        { name: 'Returning', value: attendanceData.returning, color: ATTENDANCE_COLORS[4] },
    ];

    // Offering pie data
    const offeringPieData = offeringBreakdown.map((item, index) => ({
        ...item,
        fill: item.color,
    }));

    // Mock expenses data
    const expensesData = [
        { category: 'Utilities', amount: 350, description: 'Electricity and water' },
        { category: 'Sound & Media', amount: 200, description: 'Equipment rental' },
        { category: 'Hospitality', amount: 150, description: 'Refreshments' },
        { category: 'Printing', amount: 75, description: 'Bulletins and flyers' },
        { category: 'Transport', amount: 120, description: 'Guest speaker transport' },
    ];

    const totalExpenses = expensesData.reduce((sum, exp) => sum + exp.amount, 0);

    const exportData = {
        eventName: event.name,
        eventDate: event.startDate,
        currency: currencyCode,
        attendance: attendanceData,
        offerings: {
            total: financials.totalOfferings,
            breakdown: financials.breakdown,
        },
        expenses: {
            total: financials.totalExpenses,
            items: expensesData,
        },
        netIncome: financials.netAmount,
    };

    const handlePrint = () => {
        window.print();
    };

    // Custom tooltip formatter for charts
    const currencyTooltipFormatter = (value: number) => [formatCurrency(value), 'Amount'];

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-xl">Event Report</DialogTitle>
                            <DialogDescription className="flex items-center gap-2 mt-1">
                                <Calendar className="h-4 w-4" />
                                {event.name} • {format(new Date(event.startDate), 'MMMM d, yyyy')}
                            </DialogDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
                                <Printer className="h-4 w-4" />
                                Print
                            </Button>
                            <ExportDropdown
                                data={[exportData]}
                                filename={`event-report-${event.id}`}
                            />
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="space-y-6 p-4">
                            <div className="grid grid-cols-4 gap-4">
                                {[...Array(4)].map((_, i) => (
                                    <Skeleton key={i} className="h-24 rounded-lg" />
                                ))}
                            </div>
                            <Skeleton className="h-64 rounded-lg" />
                        </div>
                    ) : (
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-4 mb-4">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                                <TabsTrigger value="offerings">Offerings</TabsTrigger>
                                <TabsTrigger value="expenses">Expenses</TabsTrigger>
                            </TabsList>

                            {/* Overview Tab */}
                            <TabsContent value="overview" className="space-y-6">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-blue-500/10">
                                                    <Users className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Total Attendance</p>
                                                    <p className="text-2xl font-bold">{attendanceData.total.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-green-500/10">
                                                    <DollarSign className="h-5 w-5 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Total Offerings</p>
                                                    <p className="text-2xl font-bold">{formatCurrency(financials.totalOfferings)}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-red-500/10">
                                                    <TrendingDown className="h-5 w-5 text-red-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Total Expenses</p>
                                                    <p className="text-2xl font-bold">{formatCurrency(financials.totalExpenses)}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "p-2 rounded-lg",
                                                    financials.netAmount >= 0 ? "bg-green-500/10" : "bg-red-500/10"
                                                )}>
                                                    {financials.netAmount >= 0 ? (
                                                        <TrendingUp className="h-5 w-5 text-green-600" />
                                                    ) : (
                                                        <TrendingDown className="h-5 w-5 text-red-600" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Net Income</p>
                                                    <p className={cn(
                                                        "text-2xl font-bold",
                                                        financials.netAmount >= 0 ? "text-green-600" : "text-red-600"
                                                    )}>
                                                        {financials.netAmount < 0 && '-'}
                                                        {formatCurrency(Math.abs(financials.netAmount))}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Charts Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Attendance by Gender */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-sm font-medium">Attendance by Gender</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ResponsiveContainer width="100%" height={200}>
                                                <PieChart>
                                                    <Pie
                                                        data={attendanceChartData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={50}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {attendanceChartData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        formatter={(value: number) => [value.toLocaleString(), 'Attendees']}
                                                        contentStyle={{
                                                            backgroundColor: 'hsl(var(--card))',
                                                            border: '1px solid hsl(var(--border))',
                                                            borderRadius: 'var(--radius)',
                                                        }}
                                                    />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>

                                    {/* Offerings by Type */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-sm font-medium">Offerings by Type</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {offeringBreakdown.length > 0 ? (
                                                <ResponsiveContainer width="100%" height={200}>
                                                    <BarChart data={offeringBreakdown} layout="vertical">
                                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                                        <XAxis
                                                            type="number"
                                                            stroke="hsl(var(--muted-foreground))"
                                                            tickFormatter={(value) => formatCurrency(value)}
                                                        />
                                                        <YAxis
                                                            dataKey="name"
                                                            type="category"
                                                            stroke="hsl(var(--muted-foreground))"
                                                            width={90}
                                                        />
                                                        <Tooltip
                                                            formatter={currencyTooltipFormatter}
                                                            contentStyle={{
                                                                backgroundColor: 'hsl(var(--card))',
                                                                border: '1px solid hsl(var(--border))',
                                                                borderRadius: 'var(--radius)',
                                                            }}
                                                        />
                                                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                                                            {offeringBreakdown.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                                                    No offering data available
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Financial Summary Table */}
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm font-medium">Financial Summary</CardTitle>
                                            <Badge variant="outline" className="gap-1">
                                                <Building2 className="h-3 w-3" />
                                                {currencyCode}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Category</TableHead>
                                                    <TableHead className="text-right">Amount</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell className="font-medium">Tithes</TableCell>
                                                    <TableCell className="text-right text-green-600">
                                                        {formatCurrency(financials.breakdown?.tithes || 0)}
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell className="font-medium">Offerings</TableCell>
                                                    <TableCell className="text-right text-green-600">
                                                        {formatCurrency(financials.breakdown?.offerings || 0)}
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell className="font-medium">Donations</TableCell>
                                                    <TableCell className="text-right text-green-600">
                                                        {formatCurrency(financials.breakdown?.donations || 0)}
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell className="font-medium">Pledges</TableCell>
                                                    <TableCell className="text-right text-green-600">
                                                        {formatCurrency(financials.breakdown?.pledges || 0)}
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow className="bg-muted/50">
                                                    <TableCell className="font-bold">Total Income</TableCell>
                                                    <TableCell className="text-right font-bold text-green-600">
                                                        {formatCurrency(financials.totalOfferings)}
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell className="font-medium text-red-600">Total Expenses</TableCell>
                                                    <TableCell className="text-right text-red-600">
                                                        -{formatCurrency(financials.totalExpenses)}
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow className="bg-muted/50 border-t-2">
                                                    <TableCell className="font-bold">Net Income</TableCell>
                                                    <TableCell className={cn(
                                                        "text-right font-bold text-lg",
                                                        financials.netAmount >= 0 ? "text-green-600" : "text-red-600"
                                                    )}>
                                                        {financials.netAmount < 0 && '-'}
                                                        {formatCurrency(Math.abs(financials.netAmount))}
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Attendance Tab */}
                            <TabsContent value="attendance" className="space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <Card>
                                        <CardContent className="p-4 text-center">
                                            <div className="p-3 rounded-full bg-blue-500/10 w-fit mx-auto mb-2">
                                                <Users className="h-6 w-6 text-blue-600" />
                                            </div>
                                            <p className="text-2xl font-bold">{attendanceData.men.toLocaleString()}</p>
                                            <p className="text-xs text-muted-foreground">Men</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-4 text-center">
                                            <div className="p-3 rounded-full bg-pink-500/10 w-fit mx-auto mb-2">
                                                <Users className="h-6 w-6 text-pink-600" />
                                            </div>
                                            <p className="text-2xl font-bold">{attendanceData.women.toLocaleString()}</p>
                                            <p className="text-xs text-muted-foreground">Women</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-4 text-center">
                                            <div className="p-3 rounded-full bg-green-500/10 w-fit mx-auto mb-2">
                                                <Baby className="h-6 w-6 text-green-600" />
                                            </div>
                                            <p className="text-2xl font-bold">{attendanceData.children.toLocaleString()}</p>
                                            <p className="text-xs text-muted-foreground">Children</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-4 text-center">
                                            <div className="p-3 rounded-full bg-amber-500/10 w-fit mx-auto mb-2">
                                                <UserCheck className="h-6 w-6 text-amber-600" />
                                            </div>
                                            <p className="text-2xl font-bold">{attendanceData.firstTimers.toLocaleString()}</p>
                                            <p className="text-xs text-muted-foreground">First Timers</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-4 text-center">
                                            <div className="p-3 rounded-full bg-purple-500/10 w-fit mx-auto mb-2">
                                                <Users className="h-6 w-6 text-purple-600" />
                                            </div>
                                            <p className="text-2xl font-bold">{attendanceData.returning.toLocaleString()}</p>
                                            <p className="text-xs text-muted-foreground">Returning</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-sm font-medium">Gender Distribution</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ResponsiveContainer width="100%" height={250}>
                                                <PieChart>
                                                    <Pie
                                                        data={attendanceChartData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={100}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                    >
                                                        {attendanceChartData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        formatter={(value: number) => [value.toLocaleString(), 'Attendees']}
                                                        contentStyle={{
                                                            backgroundColor: 'hsl(var(--card))',
                                                            border: '1px solid hsl(var(--border))',
                                                            borderRadius: 'var(--radius)',
                                                        }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-sm font-medium">Visitor Types</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ResponsiveContainer width="100%" height={250}>
                                                <PieChart>
                                                    <Pie
                                                        data={visitorChartData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={100}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                    >
                                                        {visitorChartData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        formatter={(value: number) => [value.toLocaleString(), 'Visitors']}
                                                        contentStyle={{
                                                            backgroundColor: 'hsl(var(--card))',
                                                            border: '1px solid hsl(var(--border))',
                                                            borderRadius: 'var(--radius)',
                                                        }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Attendance Summary Card */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium">Attendance Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="text-center p-4 bg-muted/50 rounded-lg">
                                                <p className="text-3xl font-bold text-primary">{attendanceData.total.toLocaleString()}</p>
                                                <p className="text-sm text-muted-foreground">Total Attendance</p>
                                            </div>
                                            <div className="text-center p-4 bg-muted/50 rounded-lg">
                                                <p className="text-3xl font-bold text-blue-600">
                                                    {((attendanceData.men / attendanceData.total) * 100).toFixed(0)}%
                                                </p>
                                                <p className="text-sm text-muted-foreground">Male Ratio</p>
                                            </div>
                                            <div className="text-center p-4 bg-muted/50 rounded-lg">
                                                <p className="text-3xl font-bold text-pink-600">
                                                    {((attendanceData.women / attendanceData.total) * 100).toFixed(0)}%
                                                </p>
                                                <p className="text-sm text-muted-foreground">Female Ratio</p>
                                            </div>
                                            <div className="text-center p-4 bg-muted/50 rounded-lg">
                                                <p className="text-3xl font-bold text-amber-600">
                                                    {attendanceData.firstTimers + attendanceData.returning}
                                                </p>
                                                <p className="text-sm text-muted-foreground">Total Visitors</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Offerings Tab */}
                            <TabsContent value="offerings" className="space-y-6">
                                {/* Currency Badge */}
                                <div className="flex justify-end">
                                    <Badge variant="outline" className="gap-1">
                                        <Building2 className="h-3 w-3" />
                                        Currency: {currencyCode} ({currencySymbol})
                                    </Badge>
                                </div>

                                {/* Offering Type Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {offeringBreakdown.length > 0 ? (
                                        offeringBreakdown.map((item, index) => (
                                            <Card key={item.name}>
                                                <CardContent className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="p-2 rounded-lg"
                                                            style={{ backgroundColor: `${item.color}20` }}
                                                        >
                                                            <item.icon
                                                                className="h-5 w-5"
                                                                style={{ color: item.color }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">{item.name}</p>
                                                            <p className="text-xl font-bold">{formatCurrency(item.value)}</p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    ) : (
                                        <Card className="col-span-full">
                                            <CardContent className="p-6 text-center text-muted-foreground">
                                                No offering data available for this event
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>

                                {/* Total Offerings Card */}
                                <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-200 dark:border-green-800">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 rounded-xl bg-green-500/20">
                                                    <DollarSign className="h-8 w-8 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Total Offerings</p>
                                                    <p className="text-3xl font-bold text-green-600">
                                                        {formatCurrency(financials.totalOfferings)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-muted-foreground">Transactions</p>
                                                <p className="text-2xl font-bold">{financials.offeringCount || offeringBreakdown.length}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Offering Distribution Chart */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium">Offering Distribution</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {offeringPieData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={300}>
                                                <PieChart>
                                                    <Pie
                                                        data={offeringPieData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={70}
                                                        outerRadius={120}
                                                        paddingAngle={3}
                                                        dataKey="value"
                                                        label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                                                    >
                                                        {offeringPieData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        formatter={currencyTooltipFormatter}
                                                        contentStyle={{
                                                            backgroundColor: 'hsl(var(--card))',
                                                            border: '1px solid hsl(var(--border))',
                                                            borderRadius: 'var(--radius)',
                                                        }}
                                                    />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                                <div className="text-center">
                                                    <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-30" />
                                                    <p>No offering data available</p>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Offering Breakdown Table */}
                                {offeringBreakdown.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-sm font-medium">Offering Details</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Type</TableHead>
                                                        <TableHead className="text-right">Amount</TableHead>
                                                        <TableHead className="text-right">Percentage</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {offeringBreakdown.map((item) => (
                                                        <TableRow key={item.name}>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <div
                                                                        className="w-3 h-3 rounded-full"
                                                                        style={{ backgroundColor: item.color }}
                                                                    />
                                                                    <span className="font-medium">{item.name}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right font-medium text-green-600">
                                                                {formatCurrency(item.value)}
                                                            </TableCell>
                                                            <TableCell className="text-right text-muted-foreground">
                                                                {((item.value / financials.totalOfferings) * 100).toFixed(1)}%
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                    <TableRow className="bg-muted/50 font-bold">
                                                        <TableCell>Total</TableCell>
                                                        <TableCell className="text-right text-green-600">
                                                            {formatCurrency(financials.totalOfferings)}
                                                        </TableCell>
                                                        <TableCell className="text-right">100%</TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            {/* Expenses Tab */}
                            <TabsContent value="expenses" className="space-y-6">
                                {/* Currency Badge */}
                                <div className="flex justify-end">
                                    <Badge variant="outline" className="gap-1">
                                        <Building2 className="h-3 w-3" />
                                        Currency: {currencyCode} ({currencySymbol})
                                    </Badge>
                                </div>

                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-3 rounded-lg bg-green-500/10">
                                                    <TrendingUp className="h-6 w-6 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Total Income</p>
                                                    <p className="text-2xl font-bold text-green-600">
                                                        {formatCurrency(financials.totalOfferings)}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-3 rounded-lg bg-red-500/10">
                                                    <TrendingDown className="h-6 w-6 text-red-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                                                    <p className="text-2xl font-bold text-red-600">
                                                        {formatCurrency(financials.totalExpenses)}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "p-3 rounded-lg",
                                                    financials.netAmount >= 0 ? "bg-green-500/10" : "bg-red-500/10"
                                                )}>
                                                    <PiggyBank className={cn(
                                                        "h-6 w-6",
                                                        financials.netAmount >= 0 ? "text-green-600" : "text-red-600"
                                                    )} />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Net Income</p>
                                                    <p className={cn(
                                                        "text-2xl font-bold",
                                                        financials.netAmount >= 0 ? "text-green-600" : "text-red-600"
                                                    )}>
                                                        {financials.netAmount < 0 && '-'}
                                                        {formatCurrency(Math.abs(financials.netAmount))}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Expense Breakdown Table */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium">Expense Breakdown</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Category</TableHead>
                                                    <TableHead>Description</TableHead>
                                                    <TableHead className="text-right">Amount</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {expensesData.map((expense, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>
                                                            <Badge variant="outline">{expense.category}</Badge>
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            {expense.description}
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">
                                                            {formatCurrency(expense.amount)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow className="bg-muted/50">
                                                    <TableCell colSpan={2} className="font-bold">Total Expenses</TableCell>
                                                    <TableCell className="text-right font-bold text-red-600">
                                                        {formatCurrency(totalExpenses)}
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>

                                {/* Expense by Category Chart */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium">Expenses by Category</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={250}>
                                            <BarChart data={expensesData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                                <XAxis
                                                    dataKey="category"
                                                    stroke="hsl(var(--muted-foreground))"
                                                    tick={{ fontSize: 12 }}
                                                />
                                                <YAxis
                                                    stroke="hsl(var(--muted-foreground))"
                                                    tickFormatter={(value) => formatCurrency(value)}
                                                />
                                                <Tooltip
                                                    formatter={currencyTooltipFormatter}
                                                    contentStyle={{
                                                        backgroundColor: 'hsl(var(--card))',
                                                        border: '1px solid hsl(var(--border))',
                                                        borderRadius: 'var(--radius)',
                                                    }}
                                                />
                                                <Bar
                                                    dataKey="amount"
                                                    fill="hsl(var(--destructive))"
                                                    radius={[4, 4, 0, 0]}
                                                    name="Amount"
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>

                                {/* Profit/Loss Summary */}
                                <Card className={cn(
                                    "border-2",
                                    financials.netAmount >= 0
                                        ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-200 dark:border-green-800"
                                        : "bg-gradient-to-r from-red-500/10 to-rose-500/10 border-red-200 dark:border-red-800"
                                )}>
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium">
                                                    {financials.netAmount >= 0 ? 'Profit' : 'Loss'} Summary
                                                </p>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <span>Income: <span className="text-green-600 font-medium">{formatCurrency(financials.totalOfferings)}</span></span>
                                                    <span>-</span>
                                                    <span>Expenses: <span className="text-red-600 font-medium">{formatCurrency(financials.totalExpenses)}</span></span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={cn(
                                                    "text-4xl font-bold",
                                                    financials.netAmount >= 0 ? "text-green-600" : "text-red-600"
                                                )}>
                                                    {financials.netAmount < 0 && '-'}
                                                    {formatCurrency(Math.abs(financials.netAmount))}
                                                </p>
                                                <p className="text-sm text-muted-foreground">Net {financials.netAmount >= 0 ? 'Profit' : 'Loss'}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    )}
                </div>

                <DialogFooter className="border-t pt-4">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    <Button
                        onClick={handlePrint}
                        className="gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Download Report
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}