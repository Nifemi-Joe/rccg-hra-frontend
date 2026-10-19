// src/pages/email/SentEmail.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, ChevronLeft, ChevronRight, Send, Eye as EyeIcon, MousePointer } from 'lucide-react';
import { format } from 'date-fns';
import { emailApi, EmailCampaign } from '@/services/emailApi';

export default function SentEmail() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

    const { data: campaigns, isLoading } = useQuery({
        queryKey: ['email-campaigns', { status: 'sent', search, page }],
        queryFn: () => emailApi.getCampaigns({ status: 'sent', search, page, limit: 20 }),
    });

    const { data: report } = useQuery({
        queryKey: ['email-campaign-report', selectedCampaign],
        queryFn: () => emailApi.getCampaignReport(selectedCampaign!),
        enabled: !!selectedCampaign,
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Sent Emails</CardTitle>
                <CardDescription>View sent email campaigns and their performance</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search campaigns..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Campaign</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Sent</TableHead>
                            <TableHead>Opens</TableHead>
                            <TableHead>Clicks</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                            </TableRow>
                        ) : campaigns?.data?.data?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    No sent campaigns found
                                </TableCell>
                            </TableRow>
                        ) : (
                            campaigns?.data?.data?.map((campaign: EmailCampaign) => (
                                <TableRow key={campaign.id}>
                                    <TableCell className="font-medium">
                                        {campaign.name || 'Untitled'}
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate">
                                        {campaign.subject}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Send className="h-3 w-3" />
                                            {campaign.sent_count}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <EyeIcon className="h-3 w-3" />
                                            {campaign.opened_count}
                                            <span className="text-xs text-muted-foreground">
                                                ({campaign.sent_count > 0
                                                ? ((campaign.opened_count / campaign.sent_count) * 100).toFixed(1)
                                                : 0}%)
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <MousePointer className="h-3 w-3" />
                                            {campaign.clicked_count}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {campaign.sent_at && format(new Date(campaign.sent_at), 'PPp')}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedCampaign(campaign.id)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-muted-foreground">
                        Page {page} of {campaigns?.data?.totalPages || 1}
                    </span>
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
                            onClick={() => setPage(p => p + 1)}
                            disabled={page >= (campaigns?.data?.totalPages || 1)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Report Dialog */}
                <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
                    <DialogContent className="max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>Campaign Report</DialogTitle>
                        </DialogHeader>
                        {report?.data?.data && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-4 gap-4">
                                    <Card>
                                        <CardContent className="pt-4">
                                            <div className="text-2xl font-bold">{report.data.data.stats.sent}</div>
                                            <p className="text-sm text-muted-foreground">Sent</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="pt-4">
                                            <div className="text-2xl font-bold text-green-600">
                                                {report.data.data.stats.openRate.toFixed(1)}%
                                            </div>
                                            <p className="text-sm text-muted-foreground">Open Rate</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="pt-4">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {report.data.data.stats.clickRate.toFixed(1)}%
                                            </div>
                                            <p className="text-sm text-muted-foreground">Click Rate</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="pt-4">
                                            <div className="text-2xl font-bold text-red-600">
                                                {report.data.data.stats.bounced}
                                            </div>
                                            <p className="text-sm text-muted-foreground">Bounced</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}