// src/components/NotificationBell.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Bell,
    User,
    Users,
    DollarSign,
    Calendar,
    UserPlus,
    Check,
    ExternalLink,
    CheckCheck,
} from 'lucide-react';
import { useNotifications, useUnreadNotificationCount } from '@/hooks/useNotifications';
import { Notification, NotificationType } from '@/types/notification';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const NOTIFICATION_ICONS: Record<NotificationType, React.ReactNode> = {
    member_added: <UserPlus className="h-4 w-4 text-green-500" />,
    member_imported: <Users className="h-4 w-4 text-blue-500" />,
    members_bulk_imported: <Users className="h-4 w-4 text-blue-500" />,
    first_timer_added: <User className="h-4 w-4 text-purple-500" />,
    first_timer_converted: <UserPlus className="h-4 w-4 text-green-500" />,
    offering_recorded: <DollarSign className="h-4 w-4 text-green-500" />,
    expense_recorded: <DollarSign className="h-4 w-4 text-red-500" />,
    event_created: <Calendar className="h-4 w-4 text-blue-500" />,
    event_checkin: <Check className="h-4 w-4 text-green-500" />,
    attendance_recorded: <Users className="h-4 w-4 text-blue-500" />,
    staff_added: <UserPlus className="h-4 w-4 text-purple-500" />,
    staff_removed: <User className="h-4 w-4 text-red-500" />,
    password_changed: <Bell className="h-4 w-4 text-yellow-500" />,
    profile_updated: <User className="h-4 w-4 text-blue-500" />,
    family_created: <Users className="h-4 w-4 text-purple-500" />,
    system_alert: <Bell className="h-4 w-4 text-yellow-500" />,
    reminder: <Bell className="h-4 w-4 text-blue-500" />,
};

export function NotificationBell() {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const { count, isLoading: isLoadingCount } = useUnreadNotificationCount();
    const {
        notifications,
        isLoading,
        markAsRead,
        markAllAsRead,
        unreadCount,
    } = useNotifications({ limit: 5 });

    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read if unread
        if (!notification.isRead) {
            try {
                await markAsRead(notification.id);
            } catch (error) {
                // Continue navigation even if marking fails
            }
        }

        setIsOpen(false);

        // Navigate to action URL if available
        if (notification.actionUrl) {
            navigate(notification.actionUrl);
        }
    };

    const handleViewAll = () => {
        setIsOpen(false);
        navigate('/notifications');
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllAsRead();
        } catch (error) {
            // Error handled by hook
        }
    };

    const displayCount = count || unreadCount || 0;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {displayCount > 0 && (
                        <Badge
                            className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
                            variant="destructive"
                        >
                            {displayCount > 99 ? '99+' : displayCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold">Notifications</h4>
                    {displayCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-auto py-1"
                            onClick={handleMarkAllRead}
                        >
                            <CheckCheck className="h-3 w-3 mr-1" />
                            Mark all read
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-80">
                    {isLoading ? (
                        <div className="p-4 space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : notifications.length > 0 ? (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "flex items-start gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                                        !notification.isRead && "bg-blue-50/50 dark:bg-blue-900/10"
                                    )}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="flex-shrink-0 mt-0.5">
                                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                            {NOTIFICATION_ICONS[notification.type] || <Bell className="h-4 w-4 text-gray-500" />}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn(
                                            "text-sm line-clamp-2",
                                            !notification.isRead && "font-medium"
                                        )}>
                                            {notification.message}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                            </p>
                                            {notification.actorName && (
                                                <span className="text-xs text-muted-foreground">
                                                    • {notification.actorName}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {!notification.isRead && (
                                        <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                <Bell className="h-6 w-6 text-muted-foreground/50" />
                            </div>
                            <p className="text-sm font-medium">No notifications</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                You're all caught up!
                            </p>
                        </div>
                    )}
                </ScrollArea>

                <Separator />

                <div className="p-2">
                    <Button
                        variant="ghost"
                        className="w-full justify-center text-sm"
                        onClick={handleViewAll}
                    >
                        View all notifications
                        <ExternalLink className="h-3 w-3 ml-2" />
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}