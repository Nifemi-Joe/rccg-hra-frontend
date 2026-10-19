import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    CheckCircle2,
    XCircle,
    Loader2,
    AlertTriangle,
    Shield,
    Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// APPROVE CONFIRMATION DIALOG
// ============================================================================
interface ApproveDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    title: string;
    itemName: string;
    itemType: 'group' | 'member';
    description?: string;
}

export function ApproveDialog({
                                  open,
                                  onClose,
                                  onConfirm,
                                  title,
                                  itemName,
                                  itemType,
                                  description,
                              }: ApproveDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            await onConfirm();
            onClose();
        } catch {
            // Error handled by caller
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onClose}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="h-11 w-11 rounded-full bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-500/20">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <AlertDialogTitle className="text-lg">{title}</AlertDialogTitle>
                        </div>
                    </div>
                    <AlertDialogDescription className="pt-2 text-sm leading-relaxed">
                        {description || (
                            <>
                                You are about to approve{' '}
                                <span className="font-semibold text-foreground">{itemName}</span>.
                                {itemType === 'group'
                                    ? ' This will make the group active and visible to members.'
                                    : ' This will add the member to the group.'}
                            </>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20 p-3 mt-2">
                    <div className="flex items-start gap-2.5">
                        <Shield className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                            This action will be recorded with your name and timestamp for audit purposes.
                        </p>
                    </div>
                </div>

                <AlertDialogFooter className="gap-2 sm:gap-0 mt-2">
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Approving...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Approve
                            </>
                        )}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

// ============================================================================
// REJECT DIALOG WITH REASON
// ============================================================================
interface RejectDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void>;
    title: string;
    itemName: string;
    itemType: 'group' | 'member';
    description?: string;
}

export function RejectDialog({
                                 open,
                                 onClose,
                                 onConfirm,
                                 title,
                                 itemName,
                                 itemType,
                                 description,
                             }: RejectDialogProps) {
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleConfirm = async () => {
        if (!reason.trim()) {
            setError('Please provide a reason for rejecting.');
            return;
        }
        if (reason.trim().length < 10) {
            setError('Reason must be at least 10 characters.');
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            await onConfirm(reason.trim());
            setReason('');
            onClose();
        } catch {
            // Error handled by caller
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setReason('');
        setError('');
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="h-11 w-11 rounded-full bg-red-500/10 flex items-center justify-center ring-1 ring-red-500/20">
                            <XCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg">{title}</DialogTitle>
                            <DialogDescription className="text-sm mt-0.5">
                                {description || (
                                    <>
                                        Reject{' '}
                                        <span className="font-semibold text-foreground">
                                            {itemName}
                                        </span>
                                    </>
                                )}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20 p-3">
                        <div className="flex items-start gap-2.5">
                            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                                {itemType === 'group'
                                    ? 'The group creator will be notified of this decision with your reason.'
                                    : 'The person who added this member will be notified of this decision.'}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reject-reason" className="text-sm font-medium">
                            Reason for rejecting <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="reject-reason"
                            placeholder="Please explain why this request is being rejected..."
                            value={reason}
                            onChange={(e) => {
                                setReason(e.target.value);
                                if (error) setError('');
                            }}
                            rows={4}
                            className={cn(
                                'resize-none',
                                error && 'border-red-500 focus-visible:ring-red-500'
                            )}
                        />
                        <div className="flex items-center justify-between">
                            {error ? (
                                <p className="text-xs text-red-500">{error}</p>
                            ) : (
                                <p className="text-xs text-muted-foreground">Minimum 10 characters</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                {reason.length} characters
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 mt-2">
                    <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isLoading || !reason.trim()}
                        variant="destructive"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Rejecting...
                            </>
                        ) : (
                            <>
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ============================================================================
// APPROVAL STATUS BADGE
// ============================================================================
interface ApprovalStatusBadgeProps {
    status: string;
    size?: 'sm' | 'default';
    showIcon?: boolean;
    className?: string;
}

export function ApprovalStatusBadge({
                                        status,
                                        size = 'default',
                                        showIcon = true,
                                        className,
                                    }: ApprovalStatusBadgeProps) {
    const configs: Record<string, {
        label: string;
        variant: 'default' | 'secondary' | 'destructive' | 'outline';
        icon: React.ReactNode;
        classes: string;
    }> = {
        pending: {
            label: 'Pending Approval',
            variant: 'outline',
            icon: <Clock className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />,
            classes:
                'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-400',
        },
        approved: {
            label: 'Approved',
            variant: 'outline',
            icon: <CheckCircle2 className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />,
            classes:
                'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400',
        },
        rejected: {
            label: 'Rejected',
            variant: 'outline',
            icon: <XCircle className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />,
            classes:
                'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400',
        },
    };

    const config = configs[status] || configs.pending;

    return (
        <Badge
            variant={config.variant}
            className={cn(
                'gap-1 font-medium',
                config.classes,
                size === 'sm' && 'text-[10px] px-1.5 py-0',
                className
            )}
        >
            {showIcon && config.icon}
            {config.label}
        </Badge>
    );
}

// ============================================================================
// REJECTION REASON DISPLAY
// ============================================================================
interface RejectionReasonProps {
    reason: string | null;
    rejectedAt?: string | null;
    className?: string;
}

export function RejectionReason({ reason, rejectedAt, className }: RejectionReasonProps) {
    if (!reason) return null;

    return (
        <div
            className={cn(
                'rounded-lg border border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20 p-3',
                className
            )}
        >
            <div className="flex items-start gap-2.5">
                <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">
                        Reason for Rejection
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-300 leading-relaxed">
                        {reason}
                    </p>
                    {rejectedAt && (
                        <p className="text-[10px] text-red-400 mt-1.5">
                            Rejected on{' '}
                            {new Date(rejectedAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}