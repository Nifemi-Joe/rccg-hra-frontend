// src/components/modals/ConvertToMemberModal.tsx
import { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FirstTimer } from '@/lib/api';
import { Loader2, UserCheck, ArrowRight, Sparkles } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConvertToMemberModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (additionalData?: any) => Promise<void>;
    firstTimer: FirstTimer | null;
}

export function ConvertToMemberModal({ open, onClose, onConfirm, firstTimer }: ConvertToMemberModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [maritalStatus, setMaritalStatus] = useState<string>('');
    const [weddingAnniversary, setWeddingAnniversary] = useState<Date | undefined>();
    const [postalCode, setPostalCode] = useState('');
    const [notes, setNotes] = useState('');

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            await onConfirm({
                maritalStatus: maritalStatus || undefined,
                weddingAnniversary: weddingAnniversary ? format(weddingAnniversary, 'yyyy-MM-dd') : undefined,
                postalCode: postalCode || undefined,
                notes: notes || undefined,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setMaritalStatus('');
        setWeddingAnniversary(undefined);
        setPostalCode('');
        setNotes('');
        onClose();
    };

    if (!firstTimer) return null;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                            <UserCheck className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-display flex items-center gap-2">
                                Convert to Member
                                <Sparkles className="h-4 w-4 text-green-500" />
                            </DialogTitle>
                            <DialogDescription>
                                Convert {firstTimer.first_name} {firstTimer.last_name} to a full member
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Summary */}
                    <div className="rounded-lg border p-4 bg-muted/30">
                        <h4 className="font-medium mb-2">First Timer Information</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-muted-foreground">Name:</span>{' '}
                                {firstTimer.first_name} {firstTimer.last_name}
                            </div>
                            <div>
                                <span className="text-muted-foreground">First Visit:</span>{' '}
                                {format(parseISO(firstTimer.first_visit_date), 'MMM d, yyyy')}
                            </div>
                            {firstTimer.email && (
                                <div>
                                    <span className="text-muted-foreground">Email:</span>{' '}
                                    {firstTimer.email}
                                </div>
                            )}
                            {firstTimer.phone && (
                                <div>
                                    <span className="text-muted-foreground">Phone:</span>{' '}
                                    {firstTimer.phone}
                                </div>
                            )}
                            <div>
                                <span className="text-muted-foreground">Visits:</span>{' '}
                                {firstTimer.visit_count}
                            </div>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-sm text-muted-foreground">Additional Information (Optional)</h4>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Marital Status</Label>
                                <Select value={maritalStatus} onValueChange={setMaritalStatus}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="single">Single</SelectItem>
                                        <SelectItem value="married">Married</SelectItem>
                                        <SelectItem value="divorced">Divorced</SelectItem>
                                        <SelectItem value="widowed">Widowed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {maritalStatus === 'married' && (
                                <div className="space-y-2">
                                    <Label>Wedding Anniversary</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    'w-full justify-start text-left font-normal',
                                                    !weddingAnniversary && 'text-muted-foreground'
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {weddingAnniversary ? format(weddingAnniversary, 'PPP') : 'Pick a date'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={weddingAnniversary}
                                                onSelect={setWeddingAnniversary}
                                                disabled={(date) => date > new Date()}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Postal Code</Label>
                            <Input
                                placeholder="Enter postal code"
                                value={postalCode}
                                onChange={(e) => setPostalCode(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Additional Notes</Label>
                            <Textarea
                                placeholder="Any notes for the new member record..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Converting...
                            </>
                        ) : (
                            <>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Convert to Member
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}