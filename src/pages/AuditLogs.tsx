// src/pages/AuditLogs.tsx

import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Search,
    RefreshCw,
    Filter,
    Eye,
    Activity,
    User,
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Download,
} from 'lucide-react';
import { useAuditLogs, useAuditLogStats } from '@/hooks/useAuditLogs';
import { AuditLog, AuditAction, AuditActionType, AuditStatus } from '@/types/auditLog';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const ACTION_LABELS: Record<AuditAction, string> = {
    create: 'Created',
    update: 'Updated',
    delete: 'Deleted',
    view: 'Viewed',
    login: 'Logged In',
    logout: 'Logged Out',
    import: 'Imported',
    export: 'Exported',
    checkin: 'Checked In',
    checkout: 'Checked Out',
    convert: 'Converted',
    assign: 'Assigned',
    unassign: 'Unassigned',
    approve: 'Approved',
    reject: 'Rejected',
    send: 'Sent',
    receive: 'Received',
};

const ACTION_TYPE_LABELS: Record<AuditActionType, string> = {
    auth: 'Authentication',
    member: 'Member',
    first_timer: 'First Timer',
    family: 'Family',
    event: 'Event',
    attendance: 'Attendance',
    financial: 'Financial',
    offering: 'Offering',
    expense: 'Expense',
    staff: 'Staff',
    settings: 'Settings',
    report: 'Report',
    notification: 'Notification',
    system: 'System',
};

const STATUS_CONFIG: Record<AuditStatus, { label: string; icon: React.ReactNode; color: string }> = {
    success: { label: 'Success', icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-600' },
    failure: { label: 'Failed', icon: <XCircle className="h-4 w-4" />, color: 'text-red-600' },
    pending: { label: 'Pending', icon: <AlertCircle className="h-4 w-4" />, color: 'text-yellow-600' },
};

export default function AuditLogs() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    const {
        logs,
        pagination,
        isLoading,
        filters,
        setFilters,
        refetch,
    } = useAuditLogs({ limit: 50 });

    const { stats } = useAuditLogStats();

    const handleSearch = (value: string) => {
        setSearchQuery(value);
        setFilters(prev => ({ ...prev, search: value, page: 1 }));
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: value === 'all' ? undefined : value,
            page: 1,
        }));
    };

    const LogDetailDialog = () => (
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Audit Log Details</DialogTitle>
                </DialogHeader>
                {selectedLog && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Action</p>
                                <p className="font-medium">{ACTION_LABELS[selectedLog.action]}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Type</p>
                                <p className="font-medium">{ACTION_TYPE_LABELS[selectedLog.actionType]}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">User</p>
                                <p className="font-medium">{selectedLog.userName || 'Nifemi Joseph' || selectedLog.userEmail || 'System'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <div className={cn("flex items-center gap-1", STATUS_CONFIG[selectedLog.status].color)}>
                                    {STATUS_CONFIG[selectedLog.status].icon}
                                    <span className="font-medium">{STATUS_CONFIG[selectedLog.status].label}</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Entity</p>
                                <p className="font-medium">{selectedLog.entityName || selectedLog.entityType}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Timestamp</p>
                                <p className="font-medium">{format(new Date(selectedLog.createdAt), 'PPpp')}</p>
                            </div>
                        </div>

                        {selectedLog.description && (
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Description</p>
                                <p className="text-sm bg-muted p-3 rounded-lg">{selectedLog.description}</p>
                            </div>
                        )}

                        {selectedLog.ipAddress && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">IP Address</p>
                                    <p className="font-mono text-sm">{selectedLog.ipAddress}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Request Path</p>
                                    <p className="font-mono text-sm">{selectedLog.requestMethod} {selectedLog.requestPath}</p>
                                </div>
                            </div>
                        )}

                        {(selectedLog.oldValues || selectedLog.newValues) && (
                            <div className="grid grid-cols-2 gap-4">
                                {selectedLog.oldValues && (
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Previous Values</p>
                                        <pre className="text-xs bg-red-50 dark:bg-red-900/20 p-3 rounded-lg overflow-auto max-h-40">
                                            {JSON.stringify(selectedLog.oldValues, null, 2)}
                                        </pre>
                                    </div>
                                )}
                                {selectedLog.newValues && (
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">New Values</p>
                                        <pre className="text-xs bg-green-50 dark:bg-green-900/20 p-3 rounded-lg overflow-auto max-h-40">
                                            {JSON.stringify(selectedLog.newValues, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        )}

                        {selectedLog.errorMessage && (
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Error Message</p>
                                <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                                    {selectedLog.errorMessage}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );

    if (isLoading) {
        return (
            <DashboardLayout title="Audit Logs">
                <div className="p-6 space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Audit Logs">
            <div className="p-4 md:p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Audit Logs</h1>
                        <p className="text-muted-foreground">
                            Track all activities and changes in your church system
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => refetch()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Activity className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Logs</p>
                                    <p className="text-2xl font-bold">{stats?.totalLogs || 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <Clock className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Today's Activity</p>
                                    <p className="text-2xl font-bold">{stats?.todayLogs || 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <User className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Active Users</p>
                                    <p className="text-2xl font-bold">{stats?.byUser?.length || 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <Calendar className="h-5 w-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Action Types</p>
                                    <p className="text-2xl font-bold">{Object.keys(stats?.byActionType || {}).length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters and Table */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search logs..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Select
                                    value={filters.actionType || 'all'}
                                    onValueChange={(value) => handleFilterChange('actionType', value)}
                                >
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue placeholder="Action Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        {Object.entries(ACTION_TYPE_LABELS).map(([value, label]) => (
                                            <SelectItem key={value} value={value}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={filters.status || 'all'}
                                    onValueChange={(value) => handleFilterChange('status', value)}
                                >
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="success">Success</SelectItem>
                                        <SelectItem value="failure">Failure</SelectItem>
                                        // src/pages/AuditLogs.tsx (continued)

                                        <SelectItem value="pending">Pending</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {logs.length > 0 ? (
                            <div className="rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Timestamp</TableHead>
                                            <TableHead>User</TableHead>
                                            <TableHead>Action</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Entity</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {logs.map((log) => (
                                            <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50">
                                                <TableCell className="text-sm">
                                                    {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm')}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                                            <User className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium">
                                                                {log.userName || 'System'}
                                                            </p>
                                                            {log.userEmail && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    {log.userEmail}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {ACTION_LABELS[log.action]}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm">
                                                        {ACTION_TYPE_LABELS[log.actionType]}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm">
                                                        {log.entityName || log.entityType || '-'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className={cn(
                                                        "flex items-center gap-1",
                                                        STATUS_CONFIG[log.status].color
                                                    )}>
                                                        {STATUS_CONFIG[log.status].icon}
                                                        <span className="text-sm">{STATUS_CONFIG[log.status].label}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setSelectedLog(log)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                <h3 className="text-lg font-medium">No audit logs found</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Activity logs will appear here as actions are performed
                                </p>
                            </div>
                        )}

                        {/* Pagination */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-sm text-muted-foreground">
                                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                                    {pagination.total} logs
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={pagination.page === 1}
                                        onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={pagination.page >= pagination.totalPages}
                                        onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <LogDetailDialog />
            </div>
        </DashboardLayout>
    );
}