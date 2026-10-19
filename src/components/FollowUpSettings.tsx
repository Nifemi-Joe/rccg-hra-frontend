// src/pages/FollowUp/FollowUpSettings.tsx

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
    Settings,
    Bell,
    Clock,
    Users,
    Save,
    Loader2,
} from 'lucide-react';
import { useFollowUpDepartment } from '@/hooks/useFollowUp';
import { useToast } from '@/hooks/use-toast';

export function FollowUpSettings() {
    const { department, isLoading, updateSettings } = useFollowUpDepartment();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const [settings, setSettings] = useState({
        autoAssign: department?.settings?.autoAssign ?? false,
        maxAssignmentsPerMember: department?.settings?.maxAssignmentsPerMember ?? 10,
        followUpDeadlineDays: department?.settings?.followUpDeadlineDays ?? 7,
        notifyOnNewAssignment: department?.settings?.notificationPreferences?.notifyOnNewAssignment ?? true,
        notifyOnDeadline: department?.settings?.notificationPreferences?.notifyOnDeadline ?? true,
        notifyOnResponse: department?.settings?.notificationPreferences?.notifyOnResponse ?? true,
    });

    // Update local settings when department loads
    useState(() => {
        if (department?.settings) {
            setSettings({
                autoAssign: department.settings.autoAssign,
                maxAssignmentsPerMember: department.settings.maxAssignmentsPerMember,
                followUpDeadlineDays: department.settings.followUpDeadlineDays,
                notifyOnNewAssignment: department.settings.notificationPreferences?.notifyOnNewAssignment ?? true,
                notifyOnDeadline: department.settings.notificationPreferences?.notifyOnDeadline ?? true,
                notifyOnResponse: department.settings.notificationPreferences?.notifyOnResponse ?? true,
            });
        }
    });

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await updateSettings({
                autoAssign: settings.autoAssign,
                maxAssignmentsPerMember: settings.maxAssignmentsPerMember,
                followUpDeadlineDays: settings.followUpDeadlineDays,
                notificationPreferences: {
                    notifyOnNewAssignment: settings.notifyOnNewAssignment,
                    notifyOnDeadline: settings.notifyOnDeadline,
                    notifyOnResponse: settings.notifyOnResponse,
                },
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <SettingsSkeleton />;
    }

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Assignment Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Assignment Settings
                    </CardTitle>
                    <CardDescription>
                        Configure how follow-up assignments are handled
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Auto-Assign First Timers</Label>
                            <p className="text-sm text-muted-foreground">
                                Automatically assign new first timers to team members
                            </p>
                        </div>
                        <Switch
                            checked={settings.autoAssign}
                            onCheckedChange={(checked) =>
                                setSettings({ ...settings, autoAssign: checked })
                            }
                        />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <Label htmlFor="maxAssignments">Maximum Assignments per Member</Label>
                        <Input
                            id="maxAssignments"
                            type="number"
                            min={1}
                            max={50}
                            value={settings.maxAssignmentsPerMember}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    maxAssignmentsPerMember: parseInt(e.target.value) || 10,
                                })
                            }
                            className="max-w-xs"
                        />
                        <p className="text-sm text-muted-foreground">
                            Limit how many active assignments each team member can have
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Deadline Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Deadline Settings
                    </CardTitle>
                    <CardDescription>
                        Configure follow-up deadlines and reminders
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="deadlineDays">Default Follow-Up Deadline (days)</Label>
                        <Input
                            id="deadlineDays"
                            type="number"
                            min={1}
                            max={30}
                            value={settings.followUpDeadlineDays}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    followUpDeadlineDays: parseInt(e.target.value) || 7,
                                })
                            }
                            className="max-w-xs"
                        />
                        <p className="text-sm text-muted-foreground">
                            Number of days team members have to complete a follow-up
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notification Preferences
                    </CardTitle>
                    <CardDescription>
                        Configure when team members receive notifications
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>New Assignment Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                                Notify team members when they receive a new assignment
                            </p>
                        </div>
                        <Switch
                            checked={settings.notifyOnNewAssignment}
                            onCheckedChange={(checked) =>
                                setSettings({ ...settings, notifyOnNewAssignment: checked })
                            }
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Deadline Reminders</Label>
                            <p className="text-sm text-muted-foreground">
                                Send reminders as deadlines approach
                            </p>
                        </div>
                        <Switch
                            checked={settings.notifyOnDeadline}
                            onCheckedChange={(checked) =>
                                setSettings({ ...settings, notifyOnDeadline: checked })
                            }
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Response Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                                Notify when a first timer responds to a message
                            </p>
                        </div>
                        <Switch
                            checked={settings.notifyOnResponse}
                            onCheckedChange={(checked) =>
                                setSettings({ ...settings, notifyOnResponse: checked })
                            }
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                    {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4" />
                    )}
                    Save Settings
                </Button>
            </div>
        </div>
    );
}

function SettingsSkeleton() {
    return (
        <div className="space-y-6 max-w-2xl">
            {[...Array(3)].map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {[...Array(2)].map((_, j) => (
                            <div key={j} className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-48" />
                                </div>
                                <Skeleton className="h-6 w-12" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}