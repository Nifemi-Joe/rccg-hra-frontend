// src/components/modals/SessionExpiredModal.tsx

import { useState, useEffect, useCallback } from 'react';
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
import { ShieldAlert } from 'lucide-react';

// Global event system for session expiry
type SessionExpiredListener = () => void;
const listeners: Set<SessionExpiredListener> = new Set();

export const sessionExpiredEvent = {
    emit: () => {
        listeners.forEach((listener) => listener());
    },
    subscribe: (listener: SessionExpiredListener) => {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    },
};

export function SessionExpiredModal() {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = sessionExpiredEvent.subscribe(() => {
            setIsOpen(true);
        });

        return unsubscribe;
    }, []);

    const handleGoToLogin = useCallback(() => {
        // Clear all auth data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_church');
        localStorage.removeItem('pastor_setup_skipped');

        setIsOpen(false);

        // Navigate to login
        navigate('/login', { replace: true });
    }, [navigate]);

    return (
        <Dialog open={isOpen} onOpenChange={() => {}}>
            <DialogContent
                className="sm:max-w-[425px]"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                // Hide the default close button
                hideCloseButton
            >
                <DialogHeader className="flex flex-col items-center text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                        <ShieldAlert className="h-8 w-8 text-red-600" />
                    </div>
                    <DialogTitle className="text-xl font-semibold">
                        Session Expired
                    </DialogTitle>
                    <DialogDescription className="text-center mt-2">
                        Your session has expired or you are not authenticated.
                        Please log in again to continue using the application.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-6 sm:justify-center">
                    <Button
                        onClick={handleGoToLogin}
                        className="w-full sm:w-auto min-w-[200px]"
                        size="lg"
                    >
                        Go to Login
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}