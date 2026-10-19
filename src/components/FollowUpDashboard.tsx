// src/pages/FollowUp/FollowUpDashboard.tsx

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Users,
    UserCheck,
    Clock,
    AlertCircle,
    TrendingUp,
    MessageSquare,
    Phone,
    Mail,
    MessagesSquare,
    BarChart3,
} from 'lucide-react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    Legend,
} from 'recharts';
import { useFollowUpStatistics, useFollowUpAssignments } from '@/hooks/useFollowUp';
import { cn } from '@/lib/utils';
import { format, parseISO, differenceInDays } from 'date-fns';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function FollowUpDashboard() {
    const { statistics, isLoading: statsLoading } = useFollowUpStatistics();
    const { assignments, isLoading: assignmentsLoading } = useFollowUpAssignments({
        status: 'active',
        limit: 5,
    });

    if (statsLoading) {
        return <DashboardSkeleton />;
    }

    const stats = statistics || {
        totalAssignments: 0,
        activeAssignments: 0,
        completedAssignments: 0,
        overdueAssignments: 0,
        averageCompletionDays: 0,
        totalActivities: 0,
        activitiesByChannel: {},
        successRate: 0,
        memberPerformance: [],
        weeklyTrend: [],
    };

    // Prepare channel data for pie chart
    const channelData = Object.entries(stats.activitiesByChannel || {}).map(([channel, count]) => ({
        name: formatChannelName(channel),
        value: count as number,
    }));

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Assignments"
                    value={stats.totalAssignments}
                    icon={Users}
                    description="All time"
                />
                <StatCard
                    title="Active"
                    value={stats.activeAssignments}
                    icon={Clock}
                    description="In progress"
                    variant="warning"
                />
                <StatCard
                    title="Completed"
                    value={stats.completedAssignments}
                    icon={UserCheck}
                    description="Successfully followed up"
                    variant="success"
                />
                <StatCard
                    title="Overdue"
                    value={stats.overdueAssignments}
                    icon={AlertCircle}
                    description="Past due date"
                    variant="destructive"
                />
            </div>

            {/* Success Rate & Average Completion */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Success Rate</CardTitle>
                        <CardDescription>Percentage of completed assignments</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="text-4xl font-bold">
                                {stats.successRate.toFixed(1)}%
                            </div>
                            <Progress value={stats.successRate} className="flex-1" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Average Completion Time</CardTitle>
                        <CardDescription>Days to complete an assignment</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="text-4xl font-bold">
                                {stats.averageCompletionDays.toFixed(1)}
                            </div>
                            <span className="text-muted-foreground">days</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Weekly Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Weekly Trend
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.weeklyTrend.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={stats.weeklyTrend}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="newAssignments"
                                        stroke="hsl(var(--chart-1))"
                                        name="New"
                                        strokeWidth={2}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="completed"
                                        stroke="hsl(var(--chart-2))"
                                        name="Completed"
                                        strokeWidth={2}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                                No data available
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Activities by Channel */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Activities by Channel
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {channelData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={channelData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, value }) => `${name}: ${value}`}
                                    >
                                        {channelData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                                No activities recorded
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Team Performance & Recent Assignments */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Team Performance */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Team Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.memberPerformance.length > 0 ? (
                            <div className="space-y-4">
                                {stats.memberPerformance.slice(0, 5).map((member) => (
                                    <div key={member.memberId} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">{member.memberName}</span>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline">
                                                    {member.activeCount} active
                                                </Badge>
                                                <Badge variant="secondary">
                                                    {member.completedCount} completed
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Progress value={member.successRate} className="flex-1" />
                                            <span className="text-sm text-muted-foreground w-12 text-right">
                                                {member.successRate.toFixed(0)}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                                No team members yet
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Active Assignments */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Active Assignments
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {assignmentsLoading ? (
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <Skeleton key={i} className="h-16 w-full" />
                                ))}
                            </div>
                        ) : assignments.length > 0 ? (
                            <div className="space-y-3">
                                {assignments.map((assignment) => (
                                    <AssignmentCard key={assignment.id} assignment={assignment} />
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                                No active assignments
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Helper Components
function StatCard({
                      title,
                      value,
                      icon: Icon,
                      description,
                      variant = 'default',
                  }: {
    title: string;
    value: number;
    icon: any;
    description: string;
    variant?: 'default' | 'success' | 'warning' | 'destructive';
}) {
    const variantStyles = {
        default: 'bg-primary/10 text-primary',
        success: 'bg-green-500/10 text-green-600',
        warning: 'bg-yellow-500/10 text-yellow-600',
        destructive: 'bg-red-500/10 text-red-600',
    };

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                    <div className={cn('p-3 rounded-lg', variantStyles[variant])}>
                        <Icon className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold">{value}</p>
                        <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function AssignmentCard({ assignment }: { assignment: any }) {
    const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();
    const daysUntilDue = assignment.dueDate
        ? differenceInDays(new Date(assignment.dueDate), new Date())
        : null;

    return (
        <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                    {assignment.firstTimer?.firstName} {assignment.firstTimer?.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                    {assignment.assignedMembers?.length || 0} assigned
                </p>
            </div>
            <div className="flex items-center gap-2">
                <Badge
                    variant={
                        assignment.priority === 'urgent'
                            ? 'destructive'
                            : assignment.priority === 'high'
                                ? 'default'
                                : 'secondary'
                    }
                >
                    {assignment.priority}
                </Badge>
                {isOverdue ? (
                    <Badge variant="destructive">Overdue</Badge>
                ) : daysUntilDue !== null && daysUntilDue <= 3 ? (
                    <Badge variant="outline" className="text-yellow-600">
                        {daysUntilDue === 0 ? 'Due today' : `${daysUntilDue}d left`}
                    </Badge>
                ) : null}
            </div>
        </div>
    );
}

function formatChannelName(channel: string): string {
    const names: Record<string, string> = {
        sms: 'SMS',
        whatsapp: 'WhatsApp',
        email: 'Email',
        phone_call: 'Phone Call',
        in_person: 'In Person',
        other: 'Other',
    };
    return names[channel] || channel;
}

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardContent className="pt-6">
                            <Skeleton className="h-20 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                {[...Array(2)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-[250px] w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}