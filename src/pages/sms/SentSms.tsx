// src/pages/sms/SentSms.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    Send
} from 'lucide-react';
import { format } from 'date-fns';
import { smsApi, SmsCampaign, SmsMessage } from '@/services/smsApi';

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    sent: 'bg-blue-100 text-blue-800',
    delivered: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    rejected: 'bg-red-100 text-red-800',
};

const statusIcons: Record<string, React.ReactNode> = {
    pending: <Clock className="h-3 w-3" />,
    sent: <Send className="h-3 w-3" />,
    delivered: <CheckCircle className="h-3 w-3" />,
    failed: <XCircle className="h-3 w-3" />,
    rejected: <XCircle className="h-3 w-3" />,
};

export default function SentSms() {
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<string>('all'); // Changed from '' to 'all'
    const [page, setPage] = useState(1);
    const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
    const limit = 20;

    // Get campaigns (sent messages are grouped by campaign)
    const { data: campaigns, isLoading } = useQuery({
        queryKey: ['sms-campaigns', { status: status === 'all' ? 'sent' : status, search, page, limit }],
        queryFn: () => smsApi.getCampaigns({
            search,
            page,
            limit
        }),
    });
    console.log('campaigns', campaigns)
    // Get campaign report when viewing details
    const { data: campaignReport } = useQuery({
        queryKey: ['sms-campaign-report', selectedCampaign],
        queryFn: () => smsApi.getCampaignReport(selectedCampaign!),
        enabled: !!selectedCampaign,
    });

    const totalPages = campaigns?.data?.totalPages || 1;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Sent Messages</CardTitle>
                <CardDescription>View all sent SMS campaigns and their delivery status</CardDescription>
            </CardHeader>
            <CardContent>
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search messages..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="sent">Sent</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Campaign</TableHead>
                                <TableHead>Message</TableHead>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Recipients</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Units</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : campaigns?.data?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No sent messages found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                campaigns?.data?.map((campaign: SmsCampaign) => (
                                    <TableRow key={campaign.id}>
                                        <TableCell className="font-medium">
                                            {campaign.name || 'Untitled Campaign'}
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate">
                                            {campaign.message}
                                        </TableCell>
                                        <TableCell>
                                            {campaign.sent_at && format(new Date(campaign.sent_at), 'PPp')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span>{campaign.total_recipients} total</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {campaign.successful_count} sent, {campaign.failed_count} failed
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <Badge variant="outline" className="bg-green-100 text-green-800 w-fit">
                                                    {campaign.successful_count} Delivered
                                                </Badge>
                                                {campaign.failed_count > 0 && (
                                                    <Badge variant="outline" className="bg-red-100 text-red-800 w-fit">
                                                        {campaign.failed_count} Failed
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{campaign.units_used}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedCampaign(campaign.id)}
                                            >
                                                <Eye className="h-4 w-4 mr-1" />
                                                Report
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Campaign Report Dialog */}
                <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Campaign Report</DialogTitle>
                            <DialogDescription>
                                Detailed delivery report for this SMS campaign
                            </DialogDescription>
                        </DialogHeader>

                        {campaignReport?.data && (
                            <div className="space-y-6">
                                {/* Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <Card>
                                        <CardContent className="pt-4">
                                            <div className="text-2xl font-bold">
                                                {campaignReport.data.stats.total}
                                            </div>
                                            <p className="text-sm text-muted-foreground">Total</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="pt-4">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {campaignReport.data.stats.sent}
                                            </div>
                                            <p className="text-sm text-muted-foreground">Sent</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="pt-4">
                                            <div className="text-2xl font-bold text-green-600">
                                                {campaignReport.data.stats.delivered}
                                            </div>
                                            <p className="text-sm text-muted-foreground">Delivered</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="pt-4">
                                            <div className="text-2xl font-bold text-red-600">
                                                {campaignReport.data.stats.failed}
                                            </div>
                                            <p className="text-sm text-muted-foreground">Failed</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="pt-4">
                                            <div className="text-2xl font-bold">
                                                {campaignReport.data.stats.unitsUsed}
                                            </div>
                                            <p className="text-sm text-muted-foreground">Units Used</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Message Details */}
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Recipient</TableHead>
                                            <TableHead>Phone</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Sent At</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {campaignReport.data.messages.map((msg: SmsMessage) => (
                                            <TableRow key={msg.id}>
                                                <TableCell>{msg.recipient_name || '-'}</TableCell>
                                                <TableCell>{msg.phone_number}</TableCell>
                                                <TableCell>
                                                    <Badge className={statusColors[msg.status]}>
                                                        <span className="flex items-center gap-1">
                                                            {statusIcons[msg.status]}
                                                            {msg.status}
                                                        </span>
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {msg.sent_at && format(new Date(msg.sent_at), 'PPp')}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}