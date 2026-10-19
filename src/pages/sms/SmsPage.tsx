  // src/pages/sms/SmsPage.tsx
import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
    MessageSquare,
    Send,
    Inbox,
    FileText,
    Clock,
    Users,
    CreditCard,
    Plus
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { smsApi } from '@/services/smsApi';
import {DashboardLayout} from "@/components/DashboardLayout.tsx";

const tabs = [
    { value: 'compose', label: 'Compose', icon: Plus, path: '/sms/compose' },
    { value: 'sent', label: 'Sent', icon: Send, path: '/sms/sent' },
    { value: 'replies', label: 'Replies', icon: Inbox, path: '/sms/replies' },
    { value: 'drafts', label: 'Drafts', icon: FileText, path: '/sms/drafts' },
    { value: 'scheduled', label: 'Scheduled', icon: Clock, path: '/sms/scheduled' },
    { value: 'contacts', label: 'Contact Lists', icon: Users, path: '/sms/contacts' },
    { value: 'units', label: 'Buy Units', icon: CreditCard, path: '/sms/units' },
];

export default function SmsPage() {
    const location = useLocation();
    const navigate = useNavigate();

    const currentTab = tabs.find(t => location.pathname.startsWith(t.path))?.value || 'compose';

    const { data: stats } = useQuery({
        queryKey: ['sms-stats'],
        queryFn: () => smsApi.getStats(),
    });

    const { data: balance } = useQuery({
        queryKey: ['sms-balance'],
        queryFn: () => smsApi.getBalance(),
    });
    console.log(balance);
    console.log(stats);
    return (
        <DashboardLayout>
            <div className="container mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">SMS Center</h1>
                        <p className="text-muted-foreground">Send and manage SMS messages</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Card className="px-4 py-2">
                            <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Balance:</span>
                                <span className="font-bold text-lg">
                                {balance?.termii?.balance.toLocaleString() || 0} {balance?.termii?.currency}
                            </span>
                            </div>
                        </Card>
                        <Button onClick={() => navigate('/sms/compose')}>
                            <Plus className="h-4 w-4 mr-2" />
                            Compose SMS
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
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
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Delivered
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {stats?.totalDelivered?.toLocaleString() || 0}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Failed
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {stats?.totalFailed?.toLocaleString() || 0}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Unread Replies
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {stats?.unreadReplies || 0}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs Navigation */}
                <Tabs value={currentTab} onValueChange={(value) => {
                    const tab = tabs.find(t => t.value === value);
                    if (tab) navigate(tab.path);
                }}>
                    <TabsList className="grid grid-cols-7 w-full">
                        {tabs.map((tab) => (
                            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
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