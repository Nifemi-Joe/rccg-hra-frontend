// src/pages/Notifications.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Bell,
    BellOff,
    Check,
    CheckCheck,
    MoreHorizontal,
    Trash2,
    ExternalLink,
    User,
    Users,
    DollarSign,
    Calendar,
    UserPlus,
    RefreshCw,
    Filter,
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { Notification, NotificationType } from '@/types/notification';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const NOTIFICATION_ICONS: Record<NotificationType, React.ReactNode> = {
    member_added: <UserPlus className="h-5 w-5 text-green-500" />,
    member_imported: <Users className="h-5 w-5 text-blue-500" />,
    members_bulk_imported: <Users className="h-5 w-5 text-blue-500" />,
    first_timer_added: <User className="h-5 w-5 text-purple-500" />,
    first_timer_converted: <UserPlus className="h-5 w-5 text-green-500" />,
    offering_recorded: <DollarSign className="h-5 w-5 text-green-500" />,
    expense_recorded: <DollarSign className="h-5 w-5 text-red-500" />,
    event_created: <Calendar className="h-5 w-5 text-blue-500" />,
    event_checkin: <Check className="h-5 w-5 text-green-500" />,
    attendance_recorded: <Users className="h-5 w-5 text-blue-500" />,
    staff_added: <UserPlus className="h-5 w-5 text-purple-500" />,
    staff_removed: <User className="h-5 w-5 text-red-500" />,
    password_changed: <Bell className="h-5 w-5 text-yellow-500" />,
    profile_updated: <User className="h-5 w-5 text-blue-500" />,
    family_created: <Users className="h-5 w-5 text-purple-500" />,
    system_alert: <Bell className="h-5 w-5 text-yellow-500" />,
    reminder: <Bell className="h-5 w-5 text-blue-500" />,
};

export default function Notifications() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

    const {
        notifications,
        pagination,
        unreadCount,
        isLoading,
        filters,
        setFilters,
        refetch,
        markAsRead,
        markAllAsRead,
        deleteNotification,
    } = useNotifications({
        isRead: activeTab === 'unread' ? false : undefined,
        limit: 50,
    });

    const handleTabChange = (tab: string) => {
        setActiveTab(tab as 'all' | 'unread');
        setFilters(prev => ({
            ...prev,
            isRead: tab === 'unread' ? false : undefined,
            page: 1,
        }));
    };

    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read if unread
        if (!notification.isRead) {
            await markAsRead(notification.id);
        }

        // Navigate to action URL if available
        if (notification.actionUrl) {
            navigate(notification.actionUrl);
        }
    };

    const NotificationItem = ({ notification }: { notification: Notification }) => (
        <div
            className={cn(
                "flex items-start gap-4 p-4 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors",
                !notification.isRead && "bg-blue-50/50 dark:bg-blue-900/10"
            )}
            onClick={() => handleNotificationClick(notification)}
        >
            <div className="flex-shrink-0 mt-1">
                {NOTIFICATION_ICONS[notification.type] || <Bell className="h-5 w-5 text-gray-500" />}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <p className={cn(
                            "text-sm",
                            !notification.isRead && "font-semibold"
                        )}>
                            {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </span>
                            {notification.actorName && (
                                <span className="text-xs text-muted-foreground">
                                    by {notification.actorName}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        {!notification.isRead && (
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {!notification.isRead && (
                                    <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation();
                                        markAsRead(notification.id);
                                    }}>
                                        <Check className="h-4 w-4 mr-2" />
                                        Mark as read
                                    </DropdownMenuItem>
                                )}
                                {notification.actionUrl && (
                                    <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(notification.actionUrl!);
                                    }}>
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        View details
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotification(notification.id);
                                    }}
                                    className="text-destructive"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </div>
    );

    if (isLoading) {
        return (
            <DashboardLayout title="Notifications">
                <div className="p-6 space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                    ))}
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Notifications">
            <div className="p-4 md:p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Notifications</h1>
                        <p className="text-muted-foreground">
                            Stay updated with activity in your church
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => refetch()}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                        {unreadCount > 0 && (
                            <Button variant="outline" size="sm" onClick={() => markAllAsRead()}>
                                <CheckCheck className="h-4 w-4 mr-2" />
                                Mark all as read
                            </Button>
                        )}
                    </div>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <Tabs value={activeTab} onValueChange={handleTabChange}>
                            <TabsList>
                                <TabsTrigger value="all" className="gap-2">
                                    <Bell className="h-4 w-4" />
                                    All
                                    <Badge variant="secondary" className="ml-1">
                                        {pagination?.total || 0}
                                    </Badge>
                                </TabsTrigger>
                                <TabsTrigger value="unread" className="gap-2">
                                    <BellOff className="h-4 w-4" />
                                    Unread
                                    {unreadCount > 0 && (
                                        <Badge variant="default" className="ml-1">
                                            {unreadCount}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </CardHeader>
                    <CardContent className="p-0">
                        {notifications.length > 0 ? (
                            <ScrollArea className="h-[calc(100vh-300px)]">
                                <div className="divide-y">
                                    {notifications.map((notification) => (
                                        <NotificationItem
                                            key={notification.id}
                                            notification={notification}
                                        />
                                    ))}
                                </div>
                            </ScrollArea>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                <h3 className="text-lg font-medium">No notifications</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {activeTab === 'unread'
                                        ? "You're all caught up!"
                                        : "You don't have any notifications yet"}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}