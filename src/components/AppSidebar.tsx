// src/components/AppSidebar.tsx
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    MessageSquare,
    Calendar,
    DollarSign,
    BarChart3,
    LogOut,
    UserPlus,
    UsersRound,
    Home,
    Mail,
    MessageCircle,
    Phone,
    ChevronRight,
    FileText,
    PieChart,
    Settings,
    HelpCircle,
    Bell,
    UserCheck,
    Activity,
    QrCode,
    ClipboardCheck,
    TrendingUp,
    Clock, Wallet,
} from "lucide-react";
import { useState, useEffect } from "react";
import logo from "@/assets/hralogo.png";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarMenuBadge,
    useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";

// Navigation item types
interface NavSubItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    description?: string;
    badge?: string | number;
    badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

interface NavItem {
    name: string;
    href?: string;
    icon: React.ComponentType<{ className?: string }>;
    description?: string;
    items?: NavSubItem[];
    badge?: string | number;
    badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
    adminOnly?: boolean;
}

// Navigation items with proper structure
const navigationItems: NavItem[] = [
    {
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        description: "Overview & analytics"
    },
    {
        name: "People",
        icon: Users,
        description: "Manage church members",
        items: [
            { name: "Members", href: "/members", icon: Users, description: "All members" },
            { name: "First Timers", href: "/first-timers", icon: UserPlus, description: "New visitors", badge: 12, badgeVariant: 'secondary' },
            { name: "Groups", href: "/groups", icon: UsersRound, description: "Cell groups" },
            { name: "Families", href: "/families", icon: Home, description: "Family units" },
        ],
    },
    {
        name: "Communication",
        icon: MessageSquare,
        description: "Reach your members",
        items: [
            { name: "SMS", href: "/sms", icon: MessageCircle, description: "Text messages" },
            { name: "Email", href: "/email", icon: Mail, description: "Email campaigns" },
            { name: "Whatsapp", href: "/whatsapp", icon: MessageSquare, description: "Whatsapp" },
            // { name: "Voice", href: "/voice", icon: Phone, description: "Voice calls" },
        ],
    },
    {
        name: "Events",
        icon: Calendar,
        description: "Services & gatherings",
        items: [
            { name: "All Events", href: "/events", icon: Calendar, description: "Event list" },
            { name: "Manual Registration", href: "/events/manual-registration", icon: ClipboardCheck, description: "Walk-in check-ins" },
            { name: "Service Reports", href: "/events/service-reports", icon: FileText, description: "Service analytics" },
        ],
    },
    {
        name: "Wallet",
        href: "/wallet",
        icon: Wallet,  // Add this import: import { Wallet } from 'lucide-react';
        description: "Payment transactions & credits",
    },
    {
        name: "Financials",
        icon: DollarSign,
        description: "Manage church finances",
        items: [
            { name: "Offerings & Donations", href: "/financials/offerings", icon: DollarSign, description: "Income tracking" },
            { name: "Chart of Accounts", href: "/financials/accounts", icon: PieChart, description: "Account management" },
            { name: "Expenses", href: "/financials/expenses", icon: FileText, description: "Track expenses" },
            { name: "Financial Reports", href: "/financials/reports", icon: BarChart3, description: "Financial analytics" },
        ],
    },
    {
        name: "Reports",
        icon: BarChart3,
        description: "Insights & analytics",
        items: [
            { name: "Analytics Dashboard", href: "/reports", icon: TrendingUp, description: "Overview" },
            { name: "Attendance Reports", href: "/reports/attendance", icon: UserCheck, description: "Attendance trends" },
            { name: "Growth Reports", href: "/reports/growth", icon: BarChart3, description: "Church growth" },
        ],
    },
    {
        name: "Notifications",
        href: "/notifications",
        icon: Bell,
        description: "View all notifications"
    },
    {
        name: "Audit Logs",
        href: "/audit-logs",
        icon: Activity,
        description: "System activity logs",
        adminOnly: true,
    },
];

const bottomNavItems = [
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "Help & Support", href: "/help", icon: HelpCircle },
];

// Quick action items
interface QuickAction {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
}

const quickActions: QuickAction[] = [
    {
        name: "Check In",
        href: "/events/manual-registration",
        icon: UserCheck,
        color: "text-primary",
        bgColor: "bg-primary/10 hover:bg-primary/20"
    },
    {
        name: "Offering",
        href: "/financials/offerings",
        icon: DollarSign,
        color: "text-green-600",
        bgColor: "bg-green-500/10 hover:bg-green-500/20"
    },
];

export function AppSidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { state } = useSidebar();
    const collapsed = state === "collapsed";
    const [openGroups, setOpenGroups] = useState<string[]>([]);
    const { user, logout } = useAuth();

    // Check if user is admin
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

    // Auto-expand groups based on current path
    useEffect(() => {
        const currentPath = location.pathname;
        const groupsToOpen: string[] = [];

        navigationItems.forEach(item => {
            if (item.items) {
                const hasActiveChild = item.items.some(
                    subItem => currentPath === subItem.href || currentPath.startsWith(subItem.href + '/')
                );
                if (hasActiveChild) {
                    groupsToOpen.push(item.name);
                }
            }
        });

        if (groupsToOpen.length > 0) {
            setOpenGroups(prev => [...new Set([...prev, ...groupsToOpen])]);
        }
    }, [location.pathname]);

    const isGroupActive = (items?: NavSubItem[]) => {
        return items?.some((item) =>
            location.pathname === item.href || location.pathname.startsWith(item.href + '/')
        ) || false;
    };

    const isItemActive = (href: string) => {
        return location.pathname === href || location.pathname.startsWith(href + '/');
    };

    const toggleGroup = (name: string) => {
        setOpenGroups((prev) =>
            prev.includes(name) ? prev.filter((g) => g !== name) : [...prev, name]
        );
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Filter navigation items based on admin status
    const filteredNavigationItems = navigationItems.filter(item => {
        if (item.adminOnly && !isAdmin) return false;
        return true;
    });

    // Get user initials
    const getUserInitials = () => {
        if (!user) return "U";
        const firstInitial = user.first_name?.charAt(0)?.toUpperCase() || '';
        const lastInitial = user.last_name?.charAt(0)?.toUpperCase() || '';
        return (firstInitial + lastInitial) || "U";
    };

    // Get user full name
    const getUserFullName = () => {
        if (!user) return "User";
        return `${user.first_name || ''} ${user.last_name || ''}`.trim() || "User";
    };

    return (
        <TooltipProvider delayDuration={0}>
            <Sidebar
                collapsible="icon"
                className="border-r border-border/50 bg-gradient-to-b from-background to-muted/20"
            >
                {/* Header */}
                <SidebarHeader className="border-b border-border/50">
                    <div className="flex items-center gap-3 px-3 py-4">
                        <div className="relative flex-shrink-0">
                            <img
                                src={logo}
                                alt="ChurchFlow"
                                className="h-9 w-9 rounded-lg shadow-sm object-contain"
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                        </div>
                        {!collapsed && (
                            <div className="flex flex-col min-w-0">
                                <h2 className="text-lg font-display font-bold text-foreground tracking-tight truncate">
                                    He Reigns
                                </h2>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                    Church Management
                                </p>
                            </div>
                        )}
                    </div>
                </SidebarHeader>

                <SidebarContent className="px-2 py-4">
                    {/* Main Navigation */}
                    <SidebarGroup>
                        <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold mb-2 px-2">
                            Main Menu
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu className="space-y-1">
                                {filteredNavigationItems.map((item) => {
                                    const hasSubItems = item.items && item.items.length > 0;
                                    const isActive = item.href ? isItemActive(item.href) : false;
                                    const hasActiveChild = hasSubItems ? isGroupActive(item.items) : false;

                                    // Items WITH sub-items (dropdown menu)
                                    if (hasSubItems) {
                                        const isOpen = openGroups.includes(item.name);

                                        return (
                                            <Collapsible
                                                key={item.name}
                                                open={isOpen}
                                                onOpenChange={() => toggleGroup(item.name)}
                                            >
                                                <SidebarMenuItem>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <CollapsibleTrigger asChild>
                                                                <SidebarMenuButton
                                                                    className={cn(
                                                                        "w-full rounded-lg transition-all duration-200",
                                                                        hasActiveChild
                                                                            ? "bg-primary/10 text-primary font-medium shadow-sm"
                                                                            : "hover:bg-muted/80"
                                                                    )}
                                                                >
                                                                    <div className={cn(
                                                                        "p-1.5 rounded-md transition-colors",
                                                                        hasActiveChild ? "bg-primary/20" : "bg-muted"
                                                                    )}>
                                                                        <item.icon className="h-4 w-4" />
                                                                    </div>
                                                                    <span className="flex-1 text-left truncate">{item.name}</span>
                                                                    {item.badge && (
                                                                        <Badge
                                                                            variant={item.badgeVariant || 'secondary'}
                                                                            className="text-[10px] px-1.5 py-0"
                                                                        >
                                                                            {item.badge}
                                                                        </Badge>
                                                                    )}
                                                                    <ChevronRight
                                                                        className={cn(
                                                                            "h-4 w-4 text-muted-foreground transition-transform duration-200",
                                                                            isOpen && "rotate-90"
                                                                        )}
                                                                    />
                                                                </SidebarMenuButton>
                                                            </CollapsibleTrigger>
                                                        </TooltipTrigger>
                                                        {collapsed && (
                                                            <TooltipContent side="right" className="flex flex-col gap-1">
                                                                <span className="font-medium">{item.name}</span>
                                                                <span className="text-xs text-muted-foreground">{item.description}</span>
                                                            </TooltipContent>
                                                        )}
                                                    </Tooltip>
                                                    <CollapsibleContent className="animate-in slide-in-from-top-1 duration-200">
                                                        <SidebarMenuSub className="ml-4 mt-1 space-y-0.5 border-l-2 border-border/50 pl-3">
                                                            {item.items!.map((subItem) => {
                                                                const isSubActive = isItemActive(subItem.href);
                                                                return (
                                                                    <SidebarMenuSubItem key={subItem.name}>
                                                                        <SidebarMenuSubButton asChild>
                                                                            <NavLink
                                                                                to={subItem.href}
                                                                                className={cn(
                                                                                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-all",
                                                                                    isSubActive
                                                                                        ? "bg-primary text-primary-foreground font-medium shadow-sm"
                                                                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                                                                )}
                                                                                activeClassName=""
                                                                            >
                                                                                <subItem.icon className="h-3.5 w-3.5 flex-shrink-0" />
                                                                                <span className="flex-1 truncate">{subItem.name}</span>
                                                                                {subItem.badge && (
                                                                                    <Badge
                                                                                        variant={subItem.badgeVariant || 'secondary'}
                                                                                        className={cn(
                                                                                            "text-[10px] px-1.5 py-0",
                                                                                            isSubActive && "bg-primary-foreground/20 text-primary-foreground"
                                                                                        )}
                                                                                    >
                                                                                        {subItem.badge}
                                                                                    </Badge>
                                                                                )}
                                                                            </NavLink>
                                                                        </SidebarMenuSubButton>
                                                                    </SidebarMenuSubItem>
                                                                );
                                                            })}
                                                        </SidebarMenuSub>
                                                    </CollapsibleContent>
                                                </SidebarMenuItem>
                                            </Collapsible>
                                        );
                                    }

                                    // Items WITHOUT sub-items (direct link)
                                    return (
                                        <SidebarMenuItem key={item.name}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <SidebarMenuButton asChild>
                                                        <NavLink
                                                            to={item.href!}
                                                            className={cn(
                                                                "rounded-lg transition-all duration-200",
                                                                isActive
                                                                    ? "bg-primary text-primary-foreground font-medium shadow-sm"
                                                                    : "hover:bg-muted/80"
                                                            )}
                                                            activeClassName=""
                                                        >
                                                            <div className={cn(
                                                                "p-1.5 rounded-md transition-colors",
                                                                isActive ? "bg-primary-foreground/20" : "bg-muted"
                                                            )}>
                                                                <item.icon className="h-4 w-4" />
                                                            </div>
                                                            <span className="truncate">{item.name}</span>
                                                            {item.badge && (
                                                                <Badge
                                                                    variant={item.badgeVariant || 'secondary'}
                                                                    className={cn(
                                                                        "text-[10px] px-1.5 py-0",
                                                                        isActive && "bg-primary-foreground/20 text-primary-foreground"
                                                                    )}
                                                                >
                                                                    {item.badge}
                                                                </Badge>
                                                            )}
                                                        </NavLink>
                                                    </SidebarMenuButton>
                                                </TooltipTrigger>
                                                {collapsed && (
                                                    <TooltipContent side="right" className="flex flex-col gap-1">
                                                        <span className="font-medium">{item.name}</span>
                                                        <span className="text-xs text-muted-foreground">{item.description}</span>
                                                    </TooltipContent>
                                                )}
                                            </Tooltip>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>

                    {/* Quick Actions - Only show when not collapsed */}
                    {!collapsed && (
                        <>
                            <Separator className="my-4" />
                            <SidebarGroup>
                                <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold mb-2 px-2">
                                    Quick Actions
                                </SidebarGroupLabel>
                                <SidebarGroupContent>
                                    <div className="grid grid-cols-2 gap-2 px-2">
                                        {quickActions.map((action) => (
                                            <NavLink
                                                key={action.name}
                                                to={action.href}
                                                className={cn(
                                                    "flex flex-col items-center gap-1.5 p-3 rounded-lg transition-all duration-200 text-center group",
                                                    action.bgColor
                                                )}
                                            >
                                                <action.icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", action.color)} />
                                                <span className="text-xs font-medium">{action.name}</span>
                                            </NavLink>
                                        ))}
                                    </div>
                                </SidebarGroupContent>
                            </SidebarGroup>
                        </>
                    )}

                    {/* Today's Stats - Only show when not collapsed */}
                    {!collapsed && (
                        <>
                            <Separator className="my-4" />
                            <SidebarGroup>
                                <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold mb-2 px-2">
                                    Today's Activity
                                </SidebarGroupLabel>
                                <SidebarGroupContent>
                                    <div className="px-2 space-y-2">
                                        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1 rounded bg-green-500/20">
                                                    <UserCheck className="h-3.5 w-3.5 text-green-600" />
                                                </div>
                                                <span className="text-xs text-muted-foreground">Check-ins</span>
                                            </div>
                                            <span className="text-sm font-semibold">156</span>
                                        </div>
                                        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1 rounded bg-blue-500/20">
                                                    <UserPlus className="h-3.5 w-3.5 text-blue-600" />
                                                </div>
                                                <span className="text-xs text-muted-foreground">New Visitors</span>
                                            </div>
                                            <span className="text-sm font-semibold">8</span>
                                        </div>
                                    </div>
                                </SidebarGroupContent>
                            </SidebarGroup>
                        </>
                    )}
                </SidebarContent>

                {/* Footer */}
                <SidebarFooter className="border-t border-border/50 p-2">
                    <SidebarMenu className="space-y-1">
                        {bottomNavItems.map((item) => {
                            const isActive = isItemActive(item.href);
                            return (
                                <SidebarMenuItem key={item.name}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <SidebarMenuButton asChild>
                                                <NavLink
                                                    to={item.href}
                                                    className={cn(
                                                        "rounded-lg transition-colors",
                                                        isActive
                                                            ? "bg-muted text-foreground"
                                                            : "hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                                                    )}
                                                    activeClassName=""
                                                >
                                                    <item.icon className="h-4 w-4" />
                                                    <span>{item.name}</span>
                                                </NavLink>
                                            </SidebarMenuButton>
                                        </TooltipTrigger>
                                        {collapsed && (
                                            <TooltipContent side="right">
                                                {item.name}
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                </SidebarMenuItem>
                            );
                        })}

                        <Separator className="my-2" />

                        {/* User Profile Section */}
                        <SidebarMenuItem>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        className={cn(
                                            "flex items-center gap-3 p-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors",
                                            collapsed && "justify-center"
                                        )}
                                        onClick={() => navigate('/profile')}
                                    >
                                        <Avatar className="h-8 w-8 flex-shrink-0">
                                            <AvatarImage src={user?.avatar || "/placeholder-avatar.jpg"} />
                                            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                                                {getUserInitials()}
                                            </AvatarFallback>
                                        </Avatar>
                                        {!collapsed && (
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {getUserFullName()}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {user?.email || "user@church.com"}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </TooltipTrigger>
                                {collapsed && (
                                    <TooltipContent side="right" className="flex flex-col gap-1">
                                        <span className="font-medium">{getUserFullName()}</span>
                                        <span className="text-xs text-muted-foreground">{user?.email}</span>
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <SidebarMenuButton
                                        className="rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                                        onClick={handleLogout}
                                    >
                                        <LogOut className="h-4 w-4" />
                                        <span>Logout</span>
                                    </SidebarMenuButton>
                                </TooltipTrigger>
                                {collapsed && (
                                    <TooltipContent side="right">
                                        Logout
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>
        </TooltipProvider>
    );
}