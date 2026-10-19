// src/pages/FollowUp/index.tsx

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard,
    Users,
    ClipboardList,
    FileText,
    Settings,
    UserPlus,
} from 'lucide-react';
import { FollowUpDashboard } from '@/components/FollowUpDashboard';
import { FollowUpAssignments } from './FollowUpAssignments';
import { FollowUpTeam } from './FollowUpTeam';
import { FollowUpTemplates } from './FollowUpTemplates';
import { FollowUpSettings } from './FollowUpSettings';
import { CreateAssignmentModal } from '@/components/modals/CreateAssignmentModal';

export default function FollowUpPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'dashboard';
    const [showCreateModal, setShowCreateModal] = useState(false);

    const handleTabChange = (value: string) => {
        setSearchParams({ tab: value });
    };

    return (
        <DashboardLayout
            title="Follow-Up"
            actions={
                <Button
                    className="bg-gradient-primary text-white hover:opacity-90 gap-2"
                    onClick={() => setShowCreateModal(true)}
                >
                    <UserPlus className="h-4 w-4" />
                    Create Assignment
                </Button>
            }
        >
            <div className="p-6">
                <Tabs value={activeTab} onValueChange={handleTabChange}>
                    <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
                        <TabsTrigger value="dashboard" className="gap-2">
                            <LayoutDashboard className="h-4 w-4" />
                            <span className="hidden sm:inline">Dashboard</span>
                        </TabsTrigger>
                        <TabsTrigger value="assignments" className="gap-2">
                            <ClipboardList className="h-4 w-4" />
                            <span className="hidden sm:inline">Assignments</span>
                        </TabsTrigger>
                        <TabsTrigger value="team" className="gap-2">
                            <Users className="h-4 w-4" />
                            <span className="hidden sm:inline">Team</span>
                        </TabsTrigger>
                        <TabsTrigger value="templates" className="gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="hidden sm:inline">Templates</span>
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="gap-2">
                            <Settings className="h-4 w-4" />
                            <span className="hidden sm:inline">Settings</span>
                        </TabsTrigger>
                    </TabsList>

                    <div className="mt-6">
                        <TabsContent value="dashboard">
                            <FollowUpDashboard />
                        </TabsContent>

                        <TabsContent value="assignments">
                            <FollowUpAssignments />
                        </TabsContent>

                        <TabsContent value="team">
                            <FollowUpTeam />
                        </TabsContent>

                        <TabsContent value="templates">
                            <FollowUpTemplates />
                        </TabsContent>

                        <TabsContent value="settings">
                            <FollowUpSettings />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>

            <CreateAssignmentModal
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                    setShowCreateModal(false);
                    // Refresh data if needed
                }}
            />
        </DashboardLayout>
    );
}