import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '@/lib/api';

// ============================================================================
// INTERFACES
// ============================================================================

interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
    country?: string;
    membership_size?: string;
    church_id: string;
    role: string;
    role_display?: string;
    status: string;
    profile_completed: boolean;
    must_reset_password: boolean;
    is_temporary_password: boolean;
    email_verified: boolean;
    permissions?: string[];
    created_at?: string;
    updated_at?: string;
}

interface Church {
    id: string;
    name: string;
    email?: string;
    slug: string;
    setupStatus: 'pending_admin' | 'active';
    adminSetupSkipped: boolean;
    currency: string;
}

interface AuthContextType {
    user: User | null;
    church: Church | null;
    token: string | null;
    isLoading: boolean;
    isInitializing: boolean;
    isAuthenticated: boolean;
    needsAdminSetup: boolean;
    needsPasswordReset: boolean;
    login: (token: string, user: any, church?: any) => void;
    logout: () => void;
    setChurch: (church: Church) => void;
    updateUser: (user: Partial<User>) => void;
    refreshUserData: () => Promise<void>;
    markAdminSetupComplete: () => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Normalize user data from API (handles different field naming conventions)
const normalizeUser = (userData: any): User => {
    return {
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name || userData.firstName || '',
        last_name: userData.last_name || userData.lastName || '',
        phone_number: userData.phone_number || userData.phoneNumber,
        country: userData.country,
        membership_size: userData.membership_size || userData.membershipSize,
        church_id: userData.church_id || userData.churchId,
        role: userData.role,
        role_display: userData.role_display || userData.roleDisplay,
        status: userData.status || 'active',
        profile_completed: userData.profile_completed ?? userData.profileCompleted ?? false,
        must_reset_password: userData.must_reset_password ?? userData.mustResetPassword ?? false,
        is_temporary_password: userData.is_temporary_password ?? userData.isTemporaryPassword ?? false,
        email_verified: userData.email_verified ?? userData.emailVerified ?? false,
        permissions: userData.permissions || [],
        created_at: userData.created_at || userData.createdAt,
        updated_at: userData.updated_at || userData.updatedAt,
    };
};

// Normalize church data from API
const normalizeChurch = (churchData: any): Church => {
    return {
        id: churchData.id,
        name: churchData.name,
        email: churchData.email,
        slug: churchData.slug,
        currency: churchData.currency,
        setupStatus: churchData.setupStatus || churchData.setup_status || 'active',
        adminSetupSkipped: churchData.adminSetupSkipped ?? churchData.admin_setup_skipped ?? false,
    };
};

// Check if token is expired (JWT decode)
const isTokenExpired = (token: string): boolean => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000; // Convert to milliseconds
        return Date.now() >= exp;
    } catch {
        return true;
    }
};

// ============================================================================
// AUTH PROVIDER
// ============================================================================

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [church, setChurchState] = useState<Church | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);

    // =========================================================================
    // REFRESH USER DATA FROM API
    // =========================================================================

    const refreshUserData = useCallback(async (): Promise<void> => {
        const storedToken = localStorage.getItem('auth_token');

        if (!storedToken) {
            setIsInitializing(false);
            return;
        }

        // Check if token is expired
        if (isTokenExpired(storedToken)) {
            console.log('Token expired, clearing auth data');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            localStorage.removeItem('auth_church');
            setToken(null);
            setUser(null);
            setChurchState(null);
            setIsInitializing(false);
            return;
        }

        setIsLoading(true);

        try {
            // Call API to get current user and church
            const response = await authApi.getCurrentUser();

            if (response && response.user) {
                const normalizedUser = normalizeUser(response.user);
                const normalizedChurch = response.church ? normalizeChurch(response.church) : null;
                console.log('i am ', response.church);
                // Update state
                setToken(storedToken);
                setUser(normalizedUser);
                if (normalizedChurch) {
                    setChurchState(normalizedChurch);
                }

                // Update localStorage with fresh data
                localStorage.setItem('auth_user', JSON.stringify(normalizedUser));
                if (normalizedChurch) {
                    localStorage.setItem('auth_church', JSON.stringify(normalizedChurch));
                }

                console.log('Auth data refreshed successfully');
            }
        } catch (error: any) {
            console.error('Failed to refresh user data:', error);

            // If unauthorized or token invalid, clear auth
            if (error.message?.includes('401') ||
                error.message?.includes('Unauthorized') ||
                error.message?.includes('Invalid') ||
                error.message?.includes('expired')) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_user');
                localStorage.removeItem('auth_church');
                setToken(null);
                setUser(null);
                setChurchState(null);
            } else {
                // For other errors, try to use cached data
                const storedUser = localStorage.getItem('auth_user');
                const storedChurch = localStorage.getItem('auth_church');

                if (storedUser) {
                    try {
                        setToken(storedToken);
                        setUser(JSON.parse(storedUser));
                        if (storedChurch) {
                            setChurchState(JSON.parse(storedChurch));
                        }
                    } catch {
                        // Invalid cached data
                        localStorage.removeItem('auth_token');
                        localStorage.removeItem('auth_user');
                        localStorage.removeItem('auth_church');
                    }
                }
            }
        } finally {
            setIsLoading(false);
            setIsInitializing(false);
        }
    }, []);

    // =========================================================================
    // INITIALIZE AUTH ON MOUNT
    // =========================================================================

    useEffect(() => {
        refreshUserData();
    }, [refreshUserData]);

    // =========================================================================
    // LOGIN
    // =========================================================================

    const login = useCallback((newToken: string, newUser: any, newChurch?: any) => {
        const normalizedUser = normalizeUser(newUser);
        const normalizedChurch = newChurch ? normalizeChurch(newChurch) : null;

        // Save to localStorage
        localStorage.setItem('auth_token', newToken);
        localStorage.setItem('auth_user', JSON.stringify(normalizedUser));
        if (normalizedChurch) {
            localStorage.setItem('auth_church', JSON.stringify(normalizedChurch));
        }

        // Update state
        setToken(newToken);
        setUser(normalizedUser);
        if (normalizedChurch) {
            setChurchState(normalizedChurch);
        }
    }, []);

    // =========================================================================
    // LOGOUT
    // =========================================================================

    const logout = useCallback(() => {
        // Clear localStorage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_church');
        localStorage.removeItem('pastor_setup_skipped');

        // Clear state
        setToken(null);
        setUser(null);
        setChurchState(null);

        // Optional: Call logout API
        try {
            authApi.logout().catch(() => {});
        } catch {
            // Ignore errors
        }
    }, []);

    // =========================================================================
    // SET CHURCH
    // =========================================================================

    const setChurch = useCallback((newChurch: Church) => {
        localStorage.setItem('auth_church', JSON.stringify(newChurch));
        setChurchState(newChurch);
    }, []);

    // =========================================================================
    // UPDATE USER
    // =========================================================================

    const updateUser = useCallback((updates: Partial<User>) => {
        setUser(prevUser => {
            if (!prevUser) return null;
            const updatedUser = { ...prevUser, ...updates };
            localStorage.setItem('auth_user', JSON.stringify(updatedUser));
            return updatedUser;
        });
    }, []);

    // =========================================================================
    // MARK ADMIN SETUP COMPLETE
    // =========================================================================

    const markAdminSetupComplete = useCallback(() => {
        if (church) {
            const updatedChurch: Church = {
                ...church,
                setupStatus: 'active',
                adminSetupSkipped: false
            };
            setChurch(updatedChurch);
            localStorage.removeItem('pastor_setup_skipped');
        }
        if (user) {
            updateUser({ profile_completed: true });
        }
    }, [church, user, setChurch, updateUser]);

    // =========================================================================
    // COMPUTED VALUES
    // =========================================================================

    const isAuthenticated = !!token && !!user;
    const needsAdminSetup = !!(church && church.adminSetupSkipped);
    const needsPasswordReset = !!(user && user.must_reset_password);

    // =========================================================================
    // CONTEXT VALUE
    // =========================================================================

    const value: AuthContextType = {
        user,
        church,
        token,
        isLoading,
        isInitializing,
        isAuthenticated,
        needsAdminSetup,
        needsPasswordReset,
        login,
        logout,
        setChurch,
        updateUser,
        refreshUserData,
        markAdminSetupComplete,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// ============================================================================
// HOOKS
// ============================================================================

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// ============================================================================
// REQUIRE AUTH COMPONENT
// ============================================================================

interface RequireAuthProps {
    children: ReactNode;
    redirectTo?: string;
}

export function RequireAuth({ children, redirectTo = '/login' }: RequireAuthProps) {
    const { isAuthenticated, isInitializing, needsPasswordReset, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (isInitializing) return;

        if (!isAuthenticated) {
            // Save the attempted URL for redirecting after login
            const returnUrl = location.pathname + location.search;
            navigate(`${redirectTo}?returnUrl=${encodeURIComponent(returnUrl)}`, { replace: true });
            return;
        }

        // Check if user needs to reset password
        if (needsPasswordReset && location.pathname !== '/reset-password-first-login') {
            navigate(`/reset-password-first-login?userId=${user?.id}&email=${user?.email}`, { replace: true });
            return;
        }
    }, [isAuthenticated, isInitializing, needsPasswordReset, user, navigate, location, redirectTo]);

    // Show loading while initializing
    if (isInitializing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    // Don't render children if not authenticated
    if (!isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}

// ============================================================================
// PUBLIC ROUTE COMPONENT (Redirect if authenticated)
// ============================================================================

interface PublicRouteProps {
    children: ReactNode;
    redirectTo?: string;
}

export function PublicRoute({ children, redirectTo = '/dashboard' }: PublicRouteProps) {
    const { isAuthenticated, isInitializing } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (isInitializing) return;

        if (isAuthenticated) {
            // Get return URL from query params or use default
            const params = new URLSearchParams(location.search);
            const returnUrl = params.get('returnUrl') || redirectTo;
            navigate(returnUrl, { replace: true });
        }
    }, [isAuthenticated, isInitializing, navigate, location.search, redirectTo]);

    if (isInitializing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return <>{children}</>;
}