// src/pages/Families.tsx
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Home,
    Users,
    Heart,
    UserPlus,
    Search,
    MoreHorizontal,
    Pencil,
    Trash2,
    Eye,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    TrendingUp,
    Crown,
    MapPin,
    Phone,
    Mail,
    Download,
} from 'lucide-react';
import { FamilyModal } from '@/components/modals/CreateFamilyModal.tsx';
import { ImportModal } from '@/components/modals/ImportModal';
import { useFamilies } from '@/hooks/useFamilies';
import { useImport } from '@/hooks/useImport';
import { Family } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function Families() {
    const [showFamilyModal, setShowFamilyModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
    const [familyToDelete, setFamilyToDelete] = useState<Family | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const {
        families,
        statistics,
        pagination,
        isLoading,
        isLoadingStats,
        filters,
        setFilters,
        deleteFamily,
        refetch,
    } = useFamilies();

    const { importData: importFamilies } = useImport('families');

    // Handle search with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setFilters({ ...filters, search: searchQuery, page: 1 });
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleEditFamily = (family: Family) => {
        setSelectedFamily(family);
        setShowFamilyModal(true);
    };

    const handleDeleteFamily = async () => {
        if (familyToDelete) {
            await deleteFamily(familyToDelete.id);
            setFamilyToDelete(null);
        }
    };

    const handleModalClose = () => {
        setShowFamilyModal(false);
        setSelectedFamily(null);
    };

    const handleModalSuccess = () => {
        handleModalClose();
        refetch();
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <DashboardLayout
            title="Families"
            actions={
                <>
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => setShowImportModal(true)}
                    >
                        <Download className="h-4 w-4" />
                        Import
                    </Button>
                    <Button
                        className="bg-gradient-primary text-white hover:opacity-90 gap-2"
                        onClick={() => {
                            setSelectedFamily(null);
                            setShowFamilyModal(true);
                        }}
                    >
                        <Home className="h-4 w-4" />
                        Add Family
                    </Button>
                </>
            }
        >
            <div className="p-6 space-y-6">
                {/* Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    {/* Total Families */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Families
                            </CardTitle>
                            <Home className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {isLoadingStats ? (
                                <Skeleton className="h-8 w-20" />
                            ) : (
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold">{statistics?.totalFamilies || 0}</span>
                                    {statistics?.recentlyAdded ? (
                                        <span className="text-xs text-green-600 flex items-center">
                                            <TrendingUp className="h-3 w-3 mr-1" />
                                            +{statistics.recentlyAdded} this month
                                        </span>
                                    ) : null}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Total Family Members */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Family Members
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {isLoadingStats ? (
                                <Skeleton className="h-8 w-20" />
                            ) : (
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold">{statistics?.totalFamilyMembers || 0}</span>
                                    <span className="text-xs text-muted-foreground">
                                        avg {statistics?.averageFamilySize?.toFixed(1) || 0} per family
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Two-Parent Families */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Two-Parent Families
                            </CardTitle>
                            <Heart className="h-4 w-4 text-pink-500" />
                        </CardHeader>
                        <CardContent>
                            {isLoadingStats ? (
                                <Skeleton className="h-8 w-20" />
                            ) : (
                                <span className="text-3xl font-bold">{statistics?.familiesWithBothParents || 0}</span>
                            )}
                        </CardContent>
                    </Card>

                    {/* Single-Parent Families */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Single-Parent Families
                            </CardTitle>
                            <UserPlus className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {isLoadingStats ? (
                                <Skeleton className="h-8 w-20" />
                            ) : (
                                <span className="text-3xl font-bold">{statistics?.singleParentFamilies || 0}</span>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Families List */}
                <Card>
                    <CardContent className="p-6">
                        {/* Search and Filters */}
                        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <Button size="icon" variant="outline" onClick={refetch}>
                                    <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                                </Button>
                            </div>
                            <div className="relative w-full sm:w-auto">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search families..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 w-full sm:w-64"
                                />
                            </div>
                        </div>

                        {/* Families Table */}
                        {isLoading ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <Skeleton className="h-12 w-12 rounded-full" />
                                        <div className="space-y-2 flex-1">
                                            <Skeleton className="h-4 w-40" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                        <Skeleton className="h-8 w-8" />
                                    </div>
                                ))}
                            </div>
                        ) : families.length === 0 ? (
                            <div className="text-center py-12">
                                <Home className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                                <p className="text-lg font-medium text-muted-foreground">
                                    {searchQuery ? 'No families match your search.' : 'No families added yet.'}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {searchQuery ? 'Try a different search term.' : 'Click "Add Family" to get started.'}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Family</TableHead>
                                                <TableHead className="hidden md:table-cell">Head</TableHead>
                                                <TableHead className="hidden lg:table-cell">Members</TableHead>
                                                <TableHead className="hidden lg:table-cell">Contact</TableHead>
                                                <TableHead className="hidden xl:table-cell">Location</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {families.map((family) => (
                                                <TableRow key={family.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-10 w-10">
                                                                <AvatarImage src={family.profileImageUrl} />
                                                                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                                                    {getInitials(family.name)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="font-medium">{family.name}</p>
                                                                {family.weddingAnniversary && (
                                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                                        <Heart className="h-3 w-3 text-pink-500" />
                                                                        Anniversary: {new Date(family.weddingAnniversary).toLocaleDateString()}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell">
                                                        {family.headName ? (
                                                            <div className="flex items-center gap-2">
                                                                <Crown className="h-4 w-4 text-yellow-500" />
                                                                <span>{family.headName}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground">Not assigned</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="hidden lg:table-cell">
                                                        <Badge variant="secondary" className="gap-1">
                                                            <Users className="h-3 w-3" />
                                                            {family.memberCount || 0}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="hidden lg:table-cell">
                                                        <div className="space-y-1">
                                                            {family.email && (
                                                                <div className="flex items-center gap-1 text-sm">
                                                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                                                    <span className="truncate max-w-[150px]">{family.email}</span>
                                                                </div>
                                                            )}
                                                            {family.homePhone && (
                                                                <div className="flex items-center gap-1 text-sm">
                                                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                                                    <span>{family.homePhone}</span>
                                                                </div>
                                                            )}
                                                            {!family.email && !family.homePhone && (
                                                                <span className="text-sm text-muted-foreground">No contact</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="hidden xl:table-cell">
                                                        {family.city || family.address ? (
                                                            <div className="flex items-center gap-1 text-sm">
                                                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                                                <span className="truncate max-w-[150px]">
                                                                    {family.city || family.address}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground">Not specified</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => handleEditFamily(family)}>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    View Details
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleEditFamily(family)}>
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-destructive focus:text-destructive"
                                                                    onClick={() => setFamilyToDelete(family)}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                {pagination && pagination.totalPages > 1 && (
                                    <div className="flex items-center justify-between mt-4">
                                        <p className="text-sm text-muted-foreground">
                                            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                                            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                                            {pagination.total} families
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                                                disabled={pagination.page <= 1}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                                Previous
                                            </Button>
                                            <span className="text-sm text-muted-foreground px-2">
                                                Page {pagination.page} of {pagination.totalPages}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                                                disabled={pagination.page >= pagination.totalPages}
                                            >
                                                Next
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Family Modal (Create/Edit) */}
            <FamilyModal
                open={showFamilyModal}
                onClose={handleModalClose}
                onSuccess={handleModalSuccess}
                family={selectedFamily}
            />

            {/* Import Modal */}
            <ImportModal
                open={showImportModal}
                onClose={() => setShowImportModal(false)}
                onSuccess={() => {
                    setShowImportModal(false);
                    refetch();
                }}
                importType="families"
                onImport={importFamilies}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!familyToDelete} onOpenChange={() => setFamilyToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Family</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete{' '}
                            <span className="font-medium">{familyToDelete?.name}</span>?
                            This will remove the family unit but members will remain in the system.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteFamily}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
}