// src/components/CreateNewMenu.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Plus,
    Users,
    UserPlus,
    Home,
    DollarSign,
    FileText,
    Wallet,
} from 'lucide-react';

// Import all modals
import { AddMemberModal } from '@/components/modals/AddMemberModal';
import { AddFirstTimerModal } from '@/components/modals/AddFirstTimerModal';
import { FamilyModal } from '@/components/modals/FamilyModal';
import { AddGroupModal } from '@/components/modals/AddGroupModal';
import { AddOfferingModal } from '@/components/modals/AddOfferingModal';
import { AddExpenseModal } from '@/components/modals/AddExpenseModal';
import { GenerateReportModal } from '@/components/modals/GenerateReportModal';

type ModalType = 'member' | 'firstTimer' | 'family' | 'group' | 'offering' | 'expense' | 'report' | null;

interface CreateNewMenuProps {
    onSuccess?: () => void;
}

export function CreateNewMenu({ onSuccess }: CreateNewMenuProps) {
    const [activeModal, setActiveModal] = useState<ModalType>(null);

    const menuItems = [
        {
            type: 'member' as ModalType,
            label: 'New Member',
            icon: Users,
            description: 'Add a church member',
        },
        {
            type: 'firstTimer' as ModalType,
            label: 'First Timer',
            icon: UserPlus,
            description: 'Register a first-time visitor',
        },
        {
            type: 'family' as ModalType,
            label: 'Family',
            icon: Home,
            description: 'Create a family unit',
        },
        {
            type: 'group' as ModalType,
            label: 'Group',
            icon: Users,
            description: 'Create a ministry group',
        },
        { type: 'separator' as const },
        {
            type: 'offering' as ModalType,
            label: 'Offering',
            icon: DollarSign,
            description: 'Record an offering',
        },
        {
            type: 'expense' as ModalType,
            label: 'Expense',
            icon: Wallet,
            description: 'Record an expense',
        },
        { type: 'separator' as const },
        {
            type: 'report' as ModalType,
            label: 'Report',
            icon: FileText,
            description: 'Generate a report',
        },
    ];

    const handleModalClose = () => {
        setActiveModal(null);
    };

    const handleSuccess = () => {
        setActiveModal(null);
        onSuccess?.();
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button className="bg-gradient-primary text-white hover:opacity-90 gap-2">
                        <Plus className="h-4 w-4" />
                        Create New
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Create New</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {menuItems.map((item, index) => {
                        if (item.type === 'separator') {
                            return <DropdownMenuSeparator key={`sep-${index}`} />;
                        }
                        const Icon = item.icon;
                        return (
                            <DropdownMenuItem
                                key={item.type}
                                onClick={() => setActiveModal(item.type)}
                                className="cursor-pointer"
                            >
                                <Icon className="mr-2 h-4 w-4" />
                                <div className="flex flex-col">
                                    <span>{item.label}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {item.description}
                                    </span>
                                </div>
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* All Modals */}
            <AddMemberModal
                open={activeModal === 'member'}
                onClose={handleModalClose}
                onSuccess={handleSuccess}
            />

            <AddFirstTimerModal
                open={activeModal === 'firstTimer'}
                onClose={handleModalClose}
                onSuccess={handleSuccess}
            />

            <FamilyModal
                open={activeModal === 'family'}
                onClose={handleModalClose}
                onSuccess={handleSuccess}
            />

            <AddGroupModal
                open={activeModal === 'group'}
                onClose={handleModalClose}
                onSuccess={handleSuccess}
            />

            <AddOfferingModal
                open={activeModal === 'offering'}
                onClose={handleModalClose}
                onSuccess={handleSuccess}
            />

            <AddExpenseModal
                open={activeModal === 'expense'}
                onClose={handleModalClose}
                onSuccess={handleSuccess}
            />

            <GenerateReportModal
                open={activeModal === 'report'}
                onClose={handleModalClose}
                onSuccess={handleSuccess}
            />
        </>
    );
}