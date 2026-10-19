// src/pages/FirstTimers.tsx
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Users,
    UserPlus,
    Star,
    TrendingUp,
    Clock,
    UserCheck,
    Phone,
    Mail,
    MoreHorizontal,
    Pencil,
    Trash2,
    Eye,
    Search,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Settings,
    Sparkles,
    PhoneCall,
    CalendarPlus,
    Download
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FirstTimerModal } from "@/components/modals/FirstTimerModal";
import { ConvertToMemberModal } from "@/components/modals/ConvertToMemberModal";
import { useFirstTimers } from "@/hooks/useFirstTimers";
import { FirstTimer } from "@/lib/api";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { ImportModal } from "@/components/modals/ImportModal";
import { useImport } from "@/hooks/useImport";

export default function FirstTimers() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [showModal, setShowModal] = useState(false);
    const [showConvertModal, setShowConvertModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const { importData: importFirstTimers } = useImport('first_timers');
    const [selectedFirstTimer, setSelectedFirstTimer] = useState<FirstTimer | null>(null);
    const [firstTimerToDelete, setFirstTimerToDelete] = useState<FirstTimer | null>(null);
    const [firstTimerToConvert, setFirstTimerToConvert] = useState<FirstTimer | null>(null);

    // Get initial values from URL params
    const initialSearch = searchParams.get('search') || '';
    const initialStatus = searchParams.get('status') || 'all';
    const initialFollowUpStatus = searchParams.get('followUpStatus') || '';
    const initialPage = parseInt(searchParams.get('page') || '1');

    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
    const [followUpFilter, setFollowUpFilter] = useState<string>(initialFollowUpStatus);
    const [conversionDays, setConversionDays] = useState<number>(30);
    console.log(initialStatus)
    const {
        firstTimers,
        statistics,
        pagination,
        conversionSettings,
        isLoading,
        isLoadingStats,
        filters,
        setFilters,
        deleteFirstTimer,
        recordVisit,
        recordContact,
        convertToMember,
        updateConversionSettings,
        refetch,
    } = useFirstTimers();

    // Sync URL params with filters on mount
    useEffect(() => {
        const urlFilters: any = {
            page: initialPage,
            limit: 20,
        };

        if (initialSearch) urlFilters.search = initialSearch;
        if (initialStatus && initialStatus !== 'all') urlFilters.status = initialStatus;
        if (initialFollowUpStatus) urlFilters.followUpStatus = initialFollowUpStatus;

        setFilters(urlFilters);
    }, []);

    // Update URL when filters change
    const updateUrlParams = (newFilters: any) => {
        const params: any = {};

        if (newFilters.search) params.search = newFilters.search;
        if (newFilters.status && newFilters.status !== 'all') params.status = newFilters.status;
        if (newFilters.followUpStatus) params.followUpStatus = newFilters.followUpStatus;
        if (newFilters.page && newFilters.page > 1) params.page = newFilters.page.toString();

        setSearchParams(params);
    };

    // Handle search
    const handleSearch = (value: string) => {
        setSearchQuery(value);
        const newFilters = { ...filters, search: value || undefined, page: 1 };
        setFilters(newFilters);
        updateUrlParams(newFilters);
    };

    // Handle status filter
    const handleStatusFilter = (value: string) => {
        setStatusFilter(value);
        const newFilters = {
            ...filters,
            status: value === 'all' ? undefined : value,
            page: 1
        };
        setFilters(newFilters);
        updateUrlParams(newFilters);
    };

    // Handle follow-up filter
    const handleFollowUpFilter = (value: string) => {
        setFollowUpFilter(value);
        const newFilters = {
            ...filters,
            followUpStatus: value === 'all' ? undefined : value,
            page: 1
        };
        setFilters(newFilters);
        updateUrlParams(newFilters);
    };

    // Handle pagination
    const handlePageChange = (page: number) => {
        const newFilters = { ...filters, page };
        setFilters(newFilters);
        updateUrlParams(newFilters);
    };

    const handleEdit = (firstTimer: FirstTimer) => {
        setSelectedFirstTimer(firstTimer);
        setShowModal(true);
    };

    const handleDelete = async () => {
        if (firstTimerToDelete) {
            await deleteFirstTimer(firstTimerToDelete.id);
            setFirstTimerToDelete(null);
        }
    };

    const handleConvert = (firstTimer: FirstTimer) => {
        setFirstTimerToConvert(firstTimer);
        setShowConvertModal(true);
    };

    const handleConvertConfirm = async (additionalData?: any) => {
        if (firstTimerToConvert) {
            const success = await convertToMember(firstTimerToConvert.id, additionalData);
            if (success) {
                setShowConvertModal(false);
                setFirstTimerToConvert(null);
            }
        }
    };

    const handleRecordVisit = async (id: string) => {
        await recordVisit(id);
    };

    const handleRecordContact = async (id: string) => {
        await recordContact(id);
    };

    const handleSaveSettings = async () => {
        await updateConversionSettings(conversionDays);
        setShowSettingsModal(false);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setSelectedFirstTimer(null);
    };

    const handleModalSuccess = () => {
        handleModalClose();
        refetch();
    };

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; className?: string }> = {
            new: { variant: "default", label: "New", className: "bg-blue-500" },
            following_up: { variant: "secondary", label: "Following Up" },
            regular_visitor: { variant: "outline", label: "Regular Visitor" },
            converted: { variant: "default", label: "Converted", className: "bg-green-500" },
            inactive: { variant: "destructive", label: "Inactive" },
        };
        const config = variants[status] || variants.new;
        return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
    };

    const getFollowUpBadge = (status: string) => {
        const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
            pending: { variant: "outline", label: "Pending" },
            contacted: { variant: "secondary", label: "Contacted" },
            scheduled: { variant: "default", label: "Scheduled" },
            completed: { variant: "default", label: "Completed" },
            no_response: { variant: "destructive", label: "No Response" },
        };
        const config = variants[status] || variants.pending;
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const isConversionEligible = (firstTimer: FirstTimer) => {
        if (!firstTimer.conversion_eligible_date) return false;
        return new Date(firstTimer.conversion_eligible_date) <= new Date() && firstTimer.status !== 'converted';
    };

    // Prepare chart data
    const chartData = statistics?.weeklyTrend || [];

    return (
        <DashboardLayout
            title="First Timers"
            actions={
                <>
                    <Button variant="outline" size="icon" onClick={() => setShowSettingsModal(true)}>
                        <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => setShowImportModal(true)}
                    >
                        <Download className="h-4 w-4" />
                        Import
                    </Button>
                    <Button
                        className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                        onClick={() => {
                            setSelectedFirstTimer(null);
                            setShowModal(true);
                        }}
                    >
                        <UserPlus className="h-4 w-4" />
                        Add First Timer
                    </Button>
                </>
            }
        >
            <div className="p-6 space-y-6">
                {/* Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {isLoadingStats ? (
                                <Skeleton className="h-8 w-16" />
                            ) : (
                                <div className="text-2xl font-bold">{statistics?.total || 0}</div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
                            <Star className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            {isLoadingStats ? (
                                <Skeleton className="h-8 w-16" />
                            ) : (
                                <div className="text-2xl font-bold text-amber-600">{statistics?.newThisWeek || 0}</div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Follow-up</CardTitle>
                            <Clock className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            {isLoadingStats ? (
                                <Skeleton className="h-8 w-16" />
                            ) : (
                                <div className="text-2xl font-bold text-orange-600">{statistics?.pendingFollowUp || 0}</div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Ready to Convert</CardTitle>
                            <Sparkles className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            {isLoadingStats ? (
                                <Skeleton className="h-8 w-16" />
                            ) : (
                                <div className="text-2xl font-bold text-green-600">{statistics?.conversionEligible || 0}</div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
                            <TrendingUp className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            {isLoadingStats ? (
                                <Skeleton className="h-8 w-16" />
                            ) : (
                                <div className="text-2xl font-bold">{statistics?.conversionRate || 0}%</div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Chart */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                                    <Star className="h-5 w-5 text-amber-600" />
                                </div>
                                <div>
                                    <CardTitle>First Timer Trend</CardTitle>
                                    <CardDescription>Weekly first-time visitors</CardDescription>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" />
                                    <YAxis stroke="hsl(var(--muted-foreground))" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--card))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "var(--radius)",
                                        }}
                                    />
                                    <Bar dataKey="count" fill="hsl(var(--chart-1))" name="First Timers" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                                No data available yet
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* First Timers List */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <CardTitle>All First Timers</CardTitle>
                            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                                <Button size="icon" variant="outline" onClick={refetch}>
                                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                                </Button>
                                <Select value={statusFilter} onValueChange={handleStatusFilter}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="new">New</SelectItem>
                                        <SelectItem value="following_up">Following Up</SelectItem>
                                        <SelectItem value="regular_visitor">Regular Visitor</SelectItem>
                                        <SelectItem value="converted">Converted</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={followUpFilter} onValueChange={handleFollowUpFilter}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Follow-up" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Follow-up</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="contacted">Contacted</SelectItem>
                                        <SelectItem value="scheduled">Scheduled</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="no_response">No Response</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="relative flex-1 sm:w-64">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="space-y-2 flex-1">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-48" />
                                        </div>
                                        <Skeleton className="h-6 w-16" />
                                    </div>
                                ))}
                            </div>
                        ) : firstTimers.length === 0 ? (
                            <div className="text-center py-12">
                                <Star className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No First Timers Yet</h3>
                                <p className="text-muted-foreground mb-6">
                                    Start tracking your first-time visitors to follow up and help them connect with your church.
                                </p>
                                <Button onClick={() => setShowModal(true)} className="bg-amber-600 hover:bg-amber-700">
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Add First Timer
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead className="hidden md:table-cell">Contact</TableHead>
                                                <TableHead className="hidden lg:table-cell">First Visit</TableHead>
                                                <TableHead className="hidden lg:table-cell">Visits</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="hidden md:table-cell">Follow-up</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {firstTimers.map((firstTimer) => (
                                                <TableRow key={firstTimer.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-10 w-10">
                                                                <AvatarFallback className="bg-amber-500/10 text-amber-600 font-medium">
                                                                    {getInitials(firstTimer.first_name, firstTimer.last_name)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="font-medium flex items-center gap-2">
                                                                    {firstTimer.first_name} {firstTimer.last_name}
                                                                    {isConversionEligible(firstTimer) && (
                                                                        <Sparkles className="h-4 w-4 text-green-500" />
                                                                    )}
                                                                </p>
                                                                {firstTimer.how_did_you_hear && (
                                                                    <p className="text-xs text-muted-foreground">
                                                                        via {firstTimer.how_did_you_hear}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell">
                                                        <div className="space-y-1 text-sm">
                                                            {firstTimer.email && (
                                                                <div className="flex items-center gap-1">
                                                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                                                    <span className="truncate max-w-[150px]">{firstTimer.email}</span>
                                                                </div>
                                                            )}
                                                            {firstTimer.phone && (
                                                                <div className="flex items-center gap-1">
                                                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                                                    <span>{firstTimer.phone}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="hidden lg:table-cell">
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <Calendar className="h-3 w-3 text-muted-foreground" />
                                                            {format(parseISO(firstTimer.first_visit_date), 'MMM d, yyyy')}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatDistanceToNow(parseISO(firstTimer.first_visit_date), { addSuffix: true })}
                                                        </p>
                                                    </TableCell>
                                                    <TableCell className="hidden lg:table-cell">
                                                        <Badge variant="outline">{firstTimer.visit_count}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getStatusBadge(firstTimer.status)}
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell">
                                                        {getFollowUpBadge(firstTimer.follow_up_status)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => handleEdit(firstTimer)}>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    View Details
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleEdit(firstTimer)}>
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => handleRecordVisit(firstTimer.id)}>
                                                                    <CalendarPlus className="mr-2 h-4 w-4" />
                                                                    Record Visit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleRecordContact(firstTimer.id)}>
                                                                    <PhoneCall className="mr-2 h-4 w-4" />
                                                                    Record Contact
                                                                </DropdownMenuItem>
                                                                {firstTimer.status !== 'converted' && (
                                                                    <>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleConvert(firstTimer)}
                                                                            disabled={!isConversionEligible(firstTimer)}
                                                                            className="text-green-600"
                                                                        >
                                                                            <UserCheck className="mr-2 h-4 w-4" />
                                                                            Convert to Member
                                                                        </DropdownMenuItem>
                                                                    </>
                                                                )}
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-destructive focus:text-destructive"
                                                                    onClick={() => setFirstTimerToDelete(firstTimer)}
                                                                    disabled={firstTimer.status === 'converted'}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                {pagination && pagination.totalPages > 1 && (
                                    <div className="flex items-center justify-between mt-4">
                                        <p className="text-sm text-muted-foreground">
                                            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                                            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                                            {pagination.total}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePageChange(pagination.page - 1)}
                                                disabled={pagination.page <= 1}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <span className="text-sm">
                                                {pagination.page} / {pagination.totalPages}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePageChange(pagination.page + 1)}
                                                disabled={pagination.page >= pagination.totalPages}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* First Timer Modal */}
            <FirstTimerModal
                open={showModal}
                onClose={handleModalClose}
                onSuccess={handleModalSuccess}
                firstTimer={selectedFirstTimer}
            />

            {/* Convert to Member Modal */}
            <ConvertToMemberModal
                open={showConvertModal}
                onClose={() => {
                    setShowConvertModal(false);
                    setFirstTimerToConvert(null);
                }}
                onConfirm={handleConvertConfirm}
                firstTimer={firstTimerToConvert}
            />

            {/* Settings Modal */}
            <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Conversion Settings</DialogTitle>
                        <DialogDescription>
                            Configure when first timers become eligible for membership conversion
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="conversionDays">Conversion Period (Days)</Label>
                            <Input
                                id="conversionDays"
                                type="number"
                                min={1}
                                max={365}
                                value={conversionDays}
                                onChange={(e) => setConversionDays(parseInt(e.target.value) || 30)}
                            />
                            <p className="text-sm text-muted-foreground">
                                First timers become eligible to convert to members after this many days from their first visit.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSettingsModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveSettings}>
                            Save Settings
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ImportModal
                open={showImportModal}
                onClose={() => setShowImportModal(false)}
                onSuccess={() => {
                    setShowImportModal(false);
                    refetch();
                }}
                importType="first_timers"
                onImport={importFirstTimers}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={!!firstTimerToDelete} onOpenChange={() => setFirstTimerToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete First Timer</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete{' '}
                            <span className="font-medium">
                                {firstTimerToDelete?.first_name} {firstTimerToDelete?.last_name}
                            </span>
                            ? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
}