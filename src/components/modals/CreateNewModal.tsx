// src/components/modals/CreateNewModal.tsx

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    DollarSign,
    Users,
    UserPlus,
    Home,
    HandCoins,
    FileText,
    UserCheck,
    ChevronRight,
    Calendar,
} from 'lucide-react';

export type CreateNewOption =
    | 'expense'
    | 'group'
    | 'member'
    | 'family'
    | 'first-timer'
    | 'offering'
    | 'report'
    | 'event';

interface CreateNewModalProps {
    open: boolean;
    onClose: () => void;
    onSelect: (option: CreateNewOption) => void;
}

const createOptions = [
    {
        id: 'member' as CreateNewOption,
        label: 'New Member',
        description: 'Add a new church member',
        icon: UserPlus,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        hoverBg: 'hover:bg-green-50',
    },
    {
        id: 'first-timer' as CreateNewOption,
        label: 'New First Timer',
        description: 'Register a first-time visitor',
        icon: UserCheck,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        hoverBg: 'hover:bg-orange-50',
    },
    {
        id: 'family' as CreateNewOption,
        label: 'New Family',
        description: 'Create a family unit',
        icon: Home,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        hoverBg: 'hover:bg-purple-50',
    },
    {
        id: 'group' as CreateNewOption,
        label: 'New Group',
        description: 'Create a ministry or cell group',
        icon: Users,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        hoverBg: 'hover:bg-blue-50',
    },
    {
        id: 'event' as CreateNewOption,
        label: 'New Event',
        description: 'Create a church event',
        icon: Calendar,
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-100',
        hoverBg: 'hover:bg-cyan-50',
    },
    {
        id: 'offering' as CreateNewOption,
        label: 'New Offering',
        description: 'Record tithes and offerings',
        icon: HandCoins,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-100',
        hoverBg: 'hover:bg-emerald-50',
    },
    {
        id: 'expense' as CreateNewOption,
        label: 'New Expense',
        description: 'Record a new church expense',
        icon: DollarSign,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        hoverBg: 'hover:bg-red-50',
    },
    {
        id: 'report' as CreateNewOption,
        label: 'New Report',
        description: 'Generate a custom report',
        icon: FileText,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100',
        hoverBg: 'hover:bg-indigo-50',
    },
];

export function CreateNewModal({ open, onClose, onSelect }: CreateNewModalProps) {
    const handleSelect = (option: CreateNewOption) => {
        onSelect(option);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-display">Create New</DialogTitle>
                    <DialogDescription>
                        What would you like to create?
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-2 py-4 max-h-[60vh] overflow-y-auto">
                    {createOptions.map((option) => (
                        <Button
                            key={option.id}
                            variant="ghost"
                            className={cn(
                                "w-full justify-start h-auto p-4 group",
                                option.hoverBg
                            )}
                            onClick={() => handleSelect(option.id)}
                        >
                            <div className="flex items-center gap-4 w-full">
                                <div className={cn("p-3 rounded-lg", option.bgColor)}>
                                    <option.icon className={cn("h-5 w-5", option.color)} />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-medium text-foreground">{option.label}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {option.description}
                                    </p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </Button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}