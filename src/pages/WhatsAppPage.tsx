// src/pages/whatsapp/WhatsAppPage.tsx
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    MessageCircle,
    Send,
    FileText,
    Clock,
    Plus,
    CheckCheck,
    Eye,
    XCircle,
    LayoutTemplate,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { whatsappApi } from '@/services/whatsappApi';
import { walletApi } from '@/services/walletApi';
import {DashboardLayout} from "@/components/DashboardLayout.tsx";

const tabs = [
    { value: 'compose', label: 'Compose', icon: Plus, path: '/whatsapp/compose' },
    { value: 'sent', label: 'Sent', icon: Send, path: '/whatsapp/sent' },
    { value: 'templates', label: 'Templates', icon: LayoutTemplate, path: '/whatsapp/templates' },
    { value: 'drafts', label: 'Drafts', icon: FileText, path: '/whatsapp/drafts' },
    { value: 'scheduled', label: 'Scheduled', icon: Clock, path: '/whatsapp/scheduled' },
];

export default function WhatsAppPage() {
    const location = useLocation();
    const navigate = useNavigate();

    const currentTab = tabs.find((t) => location.pathname.startsWith(t.path))?.value || 'compose';

    // Fetch WhatsApp stats
    const { data: statsResponse } = useQuery({
        queryKey: ['whatsapp-stats'],
        queryFn: () => whatsappApi.getStats(),
    });

    // Fetch wallet data
    const { data: walletResponse } = useQuery({
        queryKey: ['wallet'],
        queryFn: () => walletApi.getWallet(),
    });

    // Extract the actual data from responses
    const stats = statsResponse?.data;
    const wallet = walletResponse?.data;

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <MessageCircle className="h-8 w-8 text-green-500" />
                            WhatsApp Center
                        </h1>
                        <p className="text-muted-foreground">Send WhatsApp messages to your contacts</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Card className="px-4 py-2">
                            <div className="flex items-center gap-2">
                                <MessageCircle className="h-4 w-4 text-green-500" />
                                <span className="text-sm text-muted-foreground">Balance:</span>
                                <span className="font-bold text-lg">
                {wallet?.whatsapp_balance?.toLocaleString() ?? 0} units
              </span>
                            </div>
                        </Card>
                        <Button
                            onClick={() => navigate('/whatsapp/compose')}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Compose Message
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Send className="h-4 w-4" />
                                Sent
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats?.totalSent?.toLocaleString() ?? 0}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <CheckCheck className="h-4 w-4" />
                                Delivered
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {stats?.totalDelivered?.toLocaleString() ?? 0}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Read
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {stats?.totalRead?.toLocaleString() ?? 0}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <XCircle className="h-4 w-4" />
                                Failed
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {stats?.totalFailed?.toLocaleString() ?? 0}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <MessageCircle className="h-4 w-4" />
                                Active Chats
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">
                                {stats?.activeConversations ?? 0}
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
                    <TabsList className="w-full justify-start">
                        {tabs.map((tab) => (
                            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                                <tab.icon className="h-4 w-4" />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                {/* Page Content */}
                <div className="mt-6">
                    <Outlet />
                </div>
            </div>
        </DashboardLayout>
    );
}