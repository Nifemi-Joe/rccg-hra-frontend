// src/components/modals/ReportModal.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
    FileText,
    Users,
    DollarSign,
    Calendar,
    TrendingUp,
    UserCheck,
    ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const reportTypes = [
    {
        id: 'membership',
        label: 'Membership Report',
        description: 'Member statistics and demographics',
        icon: Users,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        route: '/reports?type=membership',
    },
    {
        id: 'attendance',
        label: 'Attendance Report',
        description: 'Event attendance and trends',
        icon: Calendar,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        route: '/reports?type=attendance',
    },
    {
        id: 'financial',
        label: 'Financial Report',
        description: 'Offerings, tithes, and expenses',
        icon: DollarSign,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-100',
        route: '/reports?type=financial',
    },
    {
        id: 'first-timers',
        label: 'First Timers Report',
        description: 'Visitor statistics and follow-ups',
        icon: UserCheck,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        route: '/reports?type=first-timers',
    },
    {
        id: 'growth',
        label: 'Growth Analysis',
        description: 'Church growth metrics over time',
        icon: TrendingUp,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        route: '/reports?type=growth',
    },
];

interface ReportModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function ReportModal({ open, onClose, onSuccess }: ReportModalProps) {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [selectedReport, setSelectedReport] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });

    const handleGenerateReport = () => {
        if (!selectedReport) {
            toast({
                variant: 'destructive',
                title: 'Please select a report type',
            });
            return;
        }

        const report = reportTypes.find(r => r.id === selectedReport);
        if (report) {
            const url = `${report.route}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
            navigate(url);
            onSuccess?.();
            onClose();
        }
    };

    const handleClose = () => {
        setSelectedReport(null);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-display">
                                Generate Report
                            </DialogTitle>
                            <DialogDescription>
                                Select a report type and date range
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Report Type</Label>
                        <div className="grid gap-2">
                            {reportTypes.map((report) => (
                                <Button
                                    key={report.id}
                                    variant={selectedReport === report.id ? 'secondary' : 'ghost'}
                                    className={cn(
                                        "w-full justify-start h-auto p-3",
                                        selectedReport === report.id && "ring-2 ring-primary"
                                    )}
                                    onClick={() => setSelectedReport(report.id)}
                                >
                                    <div className="flex items-center gap-3 w-full">
                                        <div className={cn("p-2 rounded-lg", report.bgColor)}>
                                            <report.icon className={cn("h-4 w-4", report.color)} />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="font-medium text-sm">{report.label}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {report.description}
                                            </p>
                                        </div>
                                        <ChevronRight className={cn(
                                            "h-4 w-4 text-muted-foreground transition-opacity",
                                            selectedReport === report.id ? "opacity-100" : "opacity-0"
                                        )} />
                                    </div>
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endDate">End Date</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleGenerateReport} disabled={!selectedReport}>
                        <FileText className="mr-2 h-4 w-4" />
                        Generate Report
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}