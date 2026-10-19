// src/pages/email/EmailPage.tsx
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Send,
    FileText,
    Clock,
    Plus,
    BarChart3,
    Eye,
    MousePointer,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { emailApi } from '@/services/emailApi';
import { DashboardLayout } from '@/components/DashboardLayout.tsx';

const tabs = [
    { value: 'compose', label: 'Compose', icon: Plus, path: '/email/compose' },
    { value: 'sent', label: 'Sent', icon: Send, path: '/email/sent' },
    { value: 'drafts', label: 'Drafts', icon: FileText, path: '/email/drafts' },
    { value: 'scheduled', label: 'Scheduled', icon: Clock, path: '/email/scheduled' },
];

export default function EmailPage() {
    const location = useLocation();
    const navigate = useNavigate();

    const currentTab =
        tabs.find((t) => location.pathname.startsWith(t.path))?.value || 'compose';

    // stats is EmailStats directly — no .data nesting
    const { data: stats } = useQuery({
        queryKey: ['email-stats'],
        queryFn: () => emailApi.getStats(),
    });

    return (
        <DashboardLayout>
            <div className="container mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Email Center</h1>
                        <p className="text-muted-foreground">
                            Send and manage email campaigns
                        </p>
                    </div>
                    <Button onClick={() => navigate('/email/compose')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Compose Email
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Send className="h-4 w-4" />
                                Total Sent
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats?.totalSent?.toLocaleString() || 0}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Open Rate
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {stats?.openRate?.toFixed(1) || 0}%
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <MousePointer className="h-4 w-4" />
                                Click Rate
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {stats?.clickRate?.toFixed(1) || 0}%
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <BarChart3 className="h-4 w-4" />
                                Bounced
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {stats?.totalBounced || 0}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs Navigation */}
                <Tabs
                    value={currentTab}
                    onValueChange={(value) => {
                        const tab = tabs.find((t) => t.value === value);
                        if (tab) navigate(tab.path);
                    }}
                >
                    <TabsList className="grid grid-cols-4 w-full max-w-lg">
                        {tabs.map((tab) => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className="flex items-center gap-2"
                            >
                                <tab.icon className="h-4 w-4" />
                                <span className="hidden md:inline">{tab.label}</span>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                {/* Page Content */}
                <Outlet />
            </div>
        </DashboardLayout>
    );
}