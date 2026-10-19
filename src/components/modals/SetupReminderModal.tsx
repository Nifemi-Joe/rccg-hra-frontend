import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog.tsx';
import { Button } from '@/components/ui/button.tsx';
import { UserPlus, X, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.tsx';

export function SetupReminderModal() {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, church } = useAuth();

    useEffect(() => {
        // Check if setup was skipped and profile not completed
        const shouldShow =
            church?.adminSetupSkipped &&
            !user?.profileCompleted &&
            !location.pathname.includes('/setup-admin') &&
            !sessionStorage.getItem('setup_reminder_dismissed');

        if (shouldShow) {
            // Show modal after a short delay
            const timer = setTimeout(() => {
                setIsOpen(true);
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [church, user, location.pathname]);

    const handleSetup = () => {
        setIsOpen(false);
        navigate(`/setup-admin?churchId=${church?.id}&email=${user?.email}`);
    };

    const handleDismiss = () => {
        setIsOpen(false);
        // Store in sessionStorage to not show for this session
        sessionStorage.setItem('setup_reminder_dismissed', 'true');
    };

    const handleRemindLater = () => {
        setIsOpen(false);
        // Will show again on next page navigation
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                            <AlertCircle className="h-5 w-5 text-amber-500" />
                        </div>
                        <DialogTitle className="text-lg">Complete Your Profile</DialogTitle>
                    </div>
                    <DialogDescription className="text-base">
                        You haven't completed your admin profile yet. Adding your details helps you get the most out of ChurchPlus and enables full access to all features.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-muted/50 rounded-lg p-4 my-2">
                    <p className="text-sm text-muted-foreground">
                        <strong className="text-foreground">What's missing:</strong>
                    </p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                        <li>• Personal information (Name, Phone)</li>
                        <li>• Church details (Country, Membership size)</li>
                    </ul>
                </div>

                <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
                    <Button variant="ghost" onClick={handleDismiss} className="w-full sm:w-auto">
                        <X className="h-4 w-4 mr-2" />
                        Don't show again
                    </Button>
                    <Button variant="outline" onClick={handleRemindLater} className="w-full sm:w-auto">
                        Remind me later
                    </Button>
                    <Button onClick={handleSetup} className="w-full sm:w-auto">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Complete Setup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}