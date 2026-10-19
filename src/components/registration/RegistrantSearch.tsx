// src/components/registration/RegistrantSearch.tsx
import { useState, useEffect, useRef } from 'react';
import { Search, User, UserPlus, Clock, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { registrationApi } from '@/services/registrationApi';
import { RegistrantSearchResult, RegistrantType } from '@/types/registration';

interface Props {
    onSelect: (registrant: RegistrantSearchResult | null, type: RegistrantType) => void;
    selectedRegistrant: RegistrantSearchResult | null;
    registrantType: RegistrantType;
    onTypeChange: (type: RegistrantType) => void;
}

const typeOptions: { value: RegistrantType; label: string; icon: React.ReactNode; description: string }[] = [
    {
        value: 'existing_member',
        label: 'Existing Member',
        icon: <User className="w-5 h-5" />,
        description: 'Search for an existing member or first-timer'
    },
    {
        value: 'new_member',
        label: 'New Member',
        icon: <UserPlus className="w-5 h-5" />,
        description: 'Add as a new church member'
    },
    {
        value: 'first_timer',
        label: 'First Timer',
        icon: <Clock className="w-5 h-5" />,
        description: 'Add as a first-time visitor'
    },
    {
        value: 'guest',
        label: 'Guest',
        icon: <User className="w-5 h-5 text-muted-foreground" />,
        description: 'One-time guest (not saved to database)'
    },
];

export function RegistrantSearch({
                                     onSelect,
                                     selectedRegistrant,
                                     registrantType,
                                     onTypeChange
                                 }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<RegistrantSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Search as user types
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.length >= 2 && registrantType === 'existing_member') {
                setIsLoading(true);
                try {
                    const data = await registrationApi.searchRegistrants(searchTerm);
                    setResults(data);
                    setIsOpen(true);
                } catch (error) {
                    console.error('Search error:', error);
                    setResults([]);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setResults([]);
                setIsOpen(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, registrantType]);

    const handleSelect = (registrant: RegistrantSearchResult) => {
        onSelect(registrant, 'existing_member');
        setSearchTerm('');
        setIsOpen(false);
    };

    const handleClear = () => {
        onSelect(null, registrantType);
        setSearchTerm('');
    };

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    return (
        <div className="space-y-4">
            {/* Registrant Type Selection */}
            <div>
                <Label className="mb-2 block">Registrant Type</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {typeOptions.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                                onTypeChange(option.value);
                                if (option.value !== 'existing_member') {
                                    onSelect(null, option.value);
                                }
                            }}
                            className={cn(
                                "p-3 rounded-lg border-2 text-left transition-all",
                                registrantType === option.value
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-muted-foreground/50'
                            )}
                        >
                            <div className="flex items-center gap-2 mb-1">
                <span className={cn(
                    registrantType === option.value ? 'text-primary' : 'text-muted-foreground'
                )}>
                  {option.icon}
                </span>
                                <span className={cn(
                                    "font-medium text-sm",
                                    registrantType === option.value ? 'text-primary' : 'text-foreground'
                                )}>
                  {option.label}
                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">{option.description}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Search Box (only for existing members) */}
            {registrantType === 'existing_member' && (
                <div ref={wrapperRef} className="relative">
                    <Label className="mb-1 block">Search Member or First-Timer</Label>

                    {selectedRegistrant ? (
                        // Show selected registrant
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={selectedRegistrant.profileImageUrl} />
                                    <AvatarFallback className="bg-green-200 text-green-700">
                                        {getInitials(selectedRegistrant.firstName, selectedRegistrant.lastName)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{selectedRegistrant.fullName}</p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span>{selectedRegistrant.email || selectedRegistrant.phone || 'No contact info'}</span>
                                        <Badge variant={selectedRegistrant.type === 'member' ? 'default' : 'secondary'}>
                                            {selectedRegistrant.type === 'member' ? 'Member' : 'First Timer'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={handleClear}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    ) : (
                        // Show search input
                        <>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search by name, email, or phone..."
                                    className="pl-10 pr-10"
                                />
                                {isLoading && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
                                )}
                            </div>

                            {/* Search Results Dropdown */}
                            {isOpen && results.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-60 overflow-auto">
                                    {results.map((result) => (
                                        <button
                                            key={result.id}
                                            type="button"
                                            onClick={() => handleSelect(result)}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-accent text-left border-b last:border-b-0"
                                        >
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={result.profileImageUrl} />
                                                <AvatarFallback>
                                                    {getInitials(result.firstName, result.lastName)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{result.fullName}</p>
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {result.email || result.phone || 'No contact info'}
                                                </p>
                                            </div>
                                            <Badge variant={result.type === 'member' ? 'default' : 'outline'}>
                                                {result.type === 'member' ? 'Member' : 'First Timer'}
                                            </Badge>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {isOpen && results.length === 0 && searchTerm.length >= 2 && !isLoading && (
                                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg p-4 text-center">
                                    <p className="text-muted-foreground">No members found</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Try a different search or add them as a new member/first-timer
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}