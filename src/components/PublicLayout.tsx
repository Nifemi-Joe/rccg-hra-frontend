// src/components/PublicLayout.tsx
import { ReactNode } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
    Calendar,
    ClipboardCheck,
    Home,
    LogIn,
    Menu,
    X,
    ChevronRight,
    Church
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface PublicLayoutProps {
    children: ReactNode;
    eventName?: string;
    churchName?: string;
    churchLogo?: string;
}

const publicNavItems = [
    {
        title: "Register",
        icon: ClipboardCheck,
        href: "#register",
        description: "Check in for this event"
    },
];

export function PublicLayout({
                                 children,
                                 eventName,
                                 churchName = "Welcome",
                                 churchLogo
                             }: PublicLayoutProps) {
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4">
                    <div className="flex h-16 items-center justify-between">
                        {/* Logo/Church Name */}
                        <div className="flex items-center gap-3">
                            {churchLogo ? (
                                <img
                                    src={churchLogo}
                                    alt={churchName}
                                    className="h-10 w-10 rounded-lg object-cover"
                                />
                            ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary text-white">
                                    <Church className="h-5 w-5" />
                                </div>
                            )}
                            <div className="hidden sm:block">
                                <p className="font-semibold text-foreground">{churchName}</p>
                                {eventName && (
                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                        {eventName}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-4">
                            <Button
                                variant="outline"
                                onClick={() => navigate('/login')}
                                className="gap-2"
                            >
                                <LogIn className="h-4 w-4" />
                                Admin Login
                            </Button>
                        </div>

                        {/* Mobile Menu */}
                        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                            <SheetTrigger asChild className="md:hidden">
                                <Button variant="ghost" size="icon">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[280px] sm:w-[350px]">
                                <div className="flex flex-col h-full">
                                    <div className="flex items-center gap-3 pb-6 border-b">
                                        {churchLogo ? (
                                            <img
                                                src={churchLogo}
                                                alt={churchName}
                                                className="h-10 w-10 rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary text-white">
                                                <Church className="h-5 w-5" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-semibold">{churchName}</p>
                                            {eventName && (
                                                <p className="text-xs text-muted-foreground">{eventName}</p>
                                            )}
                                        </div>
                                    </div>

                                    <nav className="flex-1 py-6 space-y-2">
                                        {publicNavItems.map((item) => (
                                            <a
                                                key={item.title}
                                                href={item.href}
                                                onClick={() => setMobileOpen(false)}
                                                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                                            >
                                                <item.icon className="h-5 w-5 text-muted-foreground" />
                                                <div>
                                                    <p className="font-medium">{item.title}</p>
                                                    <p className="text-xs text-muted-foreground">{item.description}</p>
                                                </div>
                                            </a>
                                        ))}
                                    </nav>

                                    <div className="pt-6 border-t space-y-3">
                                        <Button
                                            variant="outline"
                                            className="w-full gap-2"
                                            onClick={() => {
                                                setMobileOpen(false);
                                                navigate('/login');
                                            }}
                                        >
                                            <LogIn className="h-4 w-4" />
                                            Admin Login
                                        </Button>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t bg-muted/30 py-6 mt-auto">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-sm text-muted-foreground">
                        Powered by <span className="font-semibold">He Reigns Assembly</span>
                    </p>
                </div>
            </footer>
        </div>
    );
}