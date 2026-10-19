// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, RequireAuth, PublicRoute } from "@/contexts/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { SetupReminderModal } from "@/components/modals/SetupReminderModal.tsx";
import { SessionExpiredModal } from "@/components/modals/SessionExpiredModal";
import * as React from "react";

// Page imports
import Welcome from "./pages/Welcome";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import FirstTimers from "./pages/FirstTimers";
import Events from "./pages/Events";
import Groups from "./pages/Groups.tsx";
import Families from '@/pages/Families';
import CheckIn from "./pages/CheckIn";
import Financials from "./pages/Financials";
import OfferingsAndDonations from "./pages/financials/OfferingsAndDonations";
import ChartsOfAccount from "./pages/financials/ChartsOfAccount";
import Reports from "./pages/Reports";
import ServiceReports from "./pages/ServiceReports";
import ServiceReportPage from "./pages/events/ServiceReportPage";
import EventRegistration from "./pages/events/EventRegistration";
import Profile from "./pages/Profile.tsx"
import Expenses from './pages/financials/Expenses';
import FinancialReports from './pages/financials/FinancialReports';
import ChurchSettings from "./pages/ChurchSettings";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import SetupAdmin from "./pages/auth/SetupAdmin";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ResetPasswordFirstLogin from "./pages/auth/ResetPasswordFirstLogin";
import NotFound from "./pages/NotFound";
import ManualRegistrationPage from '@/pages/registrations/ManualRegistrationPage';
import PublicRegistrationPage from '@/pages/registrations/PublicRegistrationPage';
import ProfileCompletionPage from '@/pages/public/ProfileCompletionPage';
import Notifications from '@/pages/Notifications';
import AuditLogs from '@/pages/AuditLogs';
import HelpSupport from '@/pages/HelpSupport';
// SMS Pages
import SmsPage from '@/pages/sms/SmsPage';
import ComposeSms from '@/pages/sms/ComposeSms';
import SentSms from '@/pages/sms/SentSms';
import SmsReplies from '@/pages/sms/SmsReplies';
import SmsDrafts from '@/pages/sms/SmsDrafts';
import SmsScheduled from '@/pages/sms/SmsScheduled';
import SmsContactLists from '@/pages/sms/SmsContactLists';
import BuyUnits from '@/pages/sms/BuyUnits';
import Whatsapp from "@/pages/WhatsAppPage.tsx"
// Email Pages
import EmailPage from '@/pages/email/EmailPage';
import ComposeEmail from '@/pages/email/ComposeEmail';
import SentEmail from '@/pages/email/SentEmail';
import EmailDrafts from '@/pages/email/EmailDrafts';
import EmailScheduled from '@/pages/email/EmailScheduled';
import WalletPage from "@/pages/WalletPage.tsx";
import ProfileUpdate from '@/pages/ProfileUpdate';
import MemberSelfUpdate from './pages/MemberSelfUpdate';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 1,
        },
    },
});

// Page transition variants
const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
};

const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.3,
};

// Wrapper component for animated routes
const AnimatedRoute = ({ children }: { children: React.ReactNode }) => {
    return (
        <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
        >
            {children}
        </motion.div>
    );
};

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    return (
        <RequireAuth>
            <AnimatedRoute>{children}</AnimatedRoute>
        </RequireAuth>
    );
};

// Public Route wrapper (redirects to dashboard if logged in)
const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
    return (
        <PublicRoute>
            <AnimatedRoute>{children}</AnimatedRoute>
        </PublicRoute>
    );
};

// Routes component with animation support
const AnimatedRoutes = () => {
    const location = useLocation();

    return (
        <>
            <SetupReminderModal />
            <SessionExpiredModal />
            <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                    {/* ==================== PUBLIC ROUTES ==================== */}
                    <Route path="/" element={<AnimatedRoute><Welcome /></AnimatedRoute>} />

                    {/* ==================== AUTH ROUTES ==================== */}
                    <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
                    <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
                    <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
                    <Route path="/reset-password" element={<AnimatedRoute><ResetPassword /></AnimatedRoute>} />
                    <Route path="/verify-email" element={<AnimatedRoute><VerifyEmail /></AnimatedRoute>} />
                    <Route path="/register/:eventId" element={<AnimatedRoute><PublicRegistrationPage /></AnimatedRoute>} />
                    <Route path="/check-in/:eventId" element={<AnimatedRoute><PublicRegistrationPage /></AnimatedRoute>} />
                    <Route path="/event/:eventId/register" element={<AnimatedRoute><PublicRegistrationPage /></AnimatedRoute>} />
                    <Route path="/setup-admin" element={<AnimatedRoute><SetupAdmin /></AnimatedRoute>} />
                    <Route path="/reset-password-first-login" element={<AnimatedRoute><ResetPasswordFirstLogin /></AnimatedRoute>} />
                    <Route path="/profile/update/:token" element={<AnimatedRoute><ProfileUpdate /></AnimatedRoute>} />

                    <Route path="/checkin/:eventId" element={<AnimatedRoute><CheckIn /></AnimatedRoute>} />

                    <Route path="/complete-profile/:token" element={<AnimatedRoute><ProfileCompletionPage /></AnimatedRoute>} />

                    {/* ==================== PROTECTED ROUTES ==================== */}

                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

                    <Route path="/members" element={<ProtectedRoute><Members /></ProtectedRoute>} />
                    <Route path="/member/update/:memberId?" element={<MemberSelfUpdate />} />
                    <Route path="/first-timers" element={<ProtectedRoute><FirstTimers /></ProtectedRoute>} />
                    <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
                    <Route path="/families" element={<ProtectedRoute><Families /></ProtectedRoute>} />

                    <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
                    <Route path="/events/registration" element={<ProtectedRoute><EventRegistration /></ProtectedRoute>} />
                    <Route path="/events/manual-registration" element={<ProtectedRoute><ManualRegistrationPage /></ProtectedRoute>} />
                    <Route path="/events/service-reports" element={<ProtectedRoute><ServiceReportPage /></ProtectedRoute>} />

                    <Route path="/registrations/manual" element={<Navigate to="/events/manual-registration" replace />} />
                    <Route path="/events/service-report" element={<Navigate to="/events/service-reports" replace />} />

                    <Route path="/financials" element={<ProtectedRoute><Financials /></ProtectedRoute>} />
                    <Route path="/financials/offerings" element={<ProtectedRoute><OfferingsAndDonations /></ProtectedRoute>} />
                    <Route path="/financials/accounts" element={<ProtectedRoute><ChartsOfAccount /></ProtectedRoute>} />
                    <Route path="/financials/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
                    <Route path="/financials/reports" element={<ProtectedRoute><FinancialReports /></ProtectedRoute>} />

                    <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />

                    <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                    <Route path="/reports/attendance" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                    <Route path="/reports/financial" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                    <Route path="/reports/growth" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                    <Route path="/service-reports" element={<ProtectedRoute><ServiceReports /></ProtectedRoute>} />

                    <Route path="/settings" element={<ProtectedRoute><ChurchSettings /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                    <Route path="/audit-logs" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
                    <Route path="/help" element={<ProtectedRoute><HelpSupport /></ProtectedRoute>} />
                    <Route path="/voice" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/social" element={<Navigate to="/dashboard" replace />} />

                    <Route path="/sms" element={<ProtectedRoute><SmsPage /></ProtectedRoute>}>
                        <Route index element={<ComposeSms />} />
                        <Route path="compose" element={<ComposeSms />} />
                        <Route path="sent" element={<SentSms />} />
                        <Route path="replies" element={<SmsReplies />} />
                        <Route path="drafts" element={<SmsDrafts />} />
                        <Route path="scheduled" element={<SmsScheduled />} />
                        <Route path="contacts" element={<SmsContactLists />} />
                        <Route path="units" element={<BuyUnits />} />
                    </Route>
                    <Route path="/whatsapp" element={<ProtectedRoute><Whatsapp /></ProtectedRoute>} />

                    <Route path="/email" element={<ProtectedRoute><EmailPage /></ProtectedRoute>}>
                        <Route index element={<ComposeEmail />} />
                        <Route path="compose" element={<ComposeEmail />} />
                        <Route path="sent" element={<SentEmail />} />
                        <Route path="drafts" element={<EmailDrafts />} />
                        <Route path="scheduled" element={<EmailScheduled />} />
                    </Route>

                    <Route path="/more" element={<Navigate to="/dashboard" replace />} />

                    {/* ==================== 404 ==================== */}
                    <Route path="*" element={<AnimatedRoute><NotFound /></AnimatedRoute>} />
                </Routes>
            </AnimatePresence>
        </>
    );
};

const App = () => (
    <QueryClientProvider client={queryClient}>
        <BrowserRouter>
            <AuthProvider>
                <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <AnimatedRoutes />
                </TooltipProvider>
            </AuthProvider>
        </BrowserRouter>
    </QueryClientProvider>
);

export default App;