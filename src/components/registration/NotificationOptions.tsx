// src/components/registration/NotificationOptions.tsx
import { Mail, MessageSquare, Send, Bell } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { NotificationChannel } from '@/types/registration';

interface Props {
    sendNotification: boolean;
    onSendNotificationChange: (value: boolean) => void;
    channels: NotificationChannel[];
    onChannelsChange: (channels: NotificationChannel[]) => void;
    hasEmail: boolean;
    hasPhone: boolean;
}

const channelOptions = [
    {
        id: 'email' as NotificationChannel,
        label: 'Email',
        icon: <Mail className="w-4 h-4" />,
    },
    {
        id: 'sms' as NotificationChannel,
        label: 'SMS',
        icon: <MessageSquare className="w-4 h-4" />,
    },
    {
        id: 'whatsapp' as NotificationChannel,
        label: 'WhatsApp',
        icon: <Send className="w-4 h-4" />,
    },
];

export function NotificationOptions({
                                        sendNotification,
                                        onSendNotificationChange,
                                        channels,
                                        onChannelsChange,
                                        hasEmail,
                                        hasPhone
                                    }: Props) {
    const toggleChannel = (channel: NotificationChannel) => {
        if (channels.includes(channel)) {
            onChannelsChange(channels.filter(c => c !== channel));
        } else {
            onChannelsChange([...channels, channel]);
        }
    };

    const isChannelDisabled = (channelId: NotificationChannel) => {
        if (channelId === 'email') return !hasEmail;
        return !hasPhone;
    };

    const getTooltip = (channelId: NotificationChannel) => {
        if (channelId === 'email' && !hasEmail) return 'Email address required';
        if ((channelId === 'sms' || channelId === 'whatsapp') && !hasPhone) return 'Phone number required';
        return undefined;
    };

    return (
        <div className="space-y-4">
            {/* Toggle Send Notification */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    <div>
                        <p className="font-medium">Send Welcome Notification</p>
                        <p className="text-sm text-muted-foreground">
                            Send profile completion link to the registrant
                        </p>
                    </div>
                </div>
                <Switch
                    checked={sendNotification}
                    onCheckedChange={onSendNotificationChange}
                />
            </div>

            {/* Channel Selection */}
            {sendNotification && (
                <div className="space-y-2">
                    <Label>Notification Channels</Label>
                    <div className="flex flex-wrap gap-3">
                        {channelOptions.map((option) => {
                            const disabled = isChannelDisabled(option.id);
                            const tooltip = getTooltip(option.id);

                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => !disabled && toggleChannel(option.id)}
                                    disabled={disabled}
                                    title={tooltip}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all",
                                        disabled
                                            ? 'border-muted bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                                            : channels.includes(option.id)
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-border hover:border-primary/50'
                                    )}
                                >
                                    {option.icon}
                                    <span>{option.label}</span>
                                </button>
                            );
                        })}
                    </div>
                    {channels.length === 0 && sendNotification && (
                        <p className="text-sm text-orange-500">Please select at least one channel</p>
                    )}
                </div>
            )}

            {/* Notification Preview */}
            {sendNotification && channels.length > 0 && (
                <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                    <AlertDescription>
                        <p className="font-medium text-blue-700 dark:text-blue-300 mb-2">
                            📩 What will be sent:
                        </p>
                        <ul className="text-sm text-blue-600 dark:text-blue-400 list-disc list-inside space-y-1">
                            <li>Welcome message with event details</li>
                            <li>Profile completion link</li>
                            <li>Template download options (Excel/CSV)</li>
                        </ul>
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}