// src/components/DashboardLayout.tsx

import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "./ui/button";
import { ChevronDown } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { NotificationBell } from "./NotificationBell";

interface DashboardLayoutProps {
    children: ReactNode;
    title?: string;
    actions?: ReactNode;
}

export function DashboardLayout({ children, title, actions }: DashboardLayoutProps) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Get user initials safely
    const getUserInitials = () => {
        if (!user) return "JD";
        const firstInitial = user.first_name?.charAt(0)?.toUpperCase() || '';
        const lastInitial = user.last_name?.charAt(0)?.toUpperCase() || '';
        return firstInitial + lastInitial || "JD";
    };

    // Get user full name safely
    const getUserFullName = () => {
        if (!user) return "John Doe";
        return `${user.first_name || ''} ${user.last_name || ''}`.trim() || "John Doe";
    };

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-muted/30">
                <AppSidebar />

                <div className="flex-1 flex flex-col w-full">
                    {/* Header */}
                    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <div className="flex h-16 items-center justify-between px-6 gap-4">
                            <div className="flex items-center gap-4">
                                <SidebarTrigger />
                                {title && (
                                    <h1 className="text-2xl font-display font-bold text-foreground">{title}</h1>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                {actions}

                                {/* Notification Bell Component */}
                                <NotificationBell />

                                {/* User Dropdown */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="gap-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary text-white text-sm font-semibold">
                                                {getUserInitials()}
                                            </div>
                                            <span className="hidden sm:inline font-medium">
                                                {getUserFullName()}
                                            </span>
                                            <ChevronDown className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuLabel>
                                            <div className="flex flex-col space-y-1">
                                                <p className="text-sm font-medium">{getUserFullName()}</p>
                                                <p className="text-xs text-muted-foreground">{user?.email}</p>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => navigate("/profile")}>
                                            Profile
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => navigate("/settings")}>
                                            Settings
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => navigate("/help")}>
                                            Help & Support
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={handleLogout}
                                            className="text-destructive focus:text-destructive"
                                        >
                                            Logout
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </header>

                    {/* Main Content */}
                    <main className="flex-1 overflow-y-auto">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}