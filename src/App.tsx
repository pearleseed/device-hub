import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SkipToContent } from "@/components/accessibility/SkipToContent";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Lazy load heavy pages for better performance
const UserDashboard = lazy(() => import("./pages/user/UserDashboard"));
const DeviceCatalog = lazy(() => import("./pages/user/DeviceCatalog"));
const DeviceDetail = lazy(() => import("./pages/user/DeviceDetail"));
const UserProfile = lazy(() => import("./pages/user/UserProfile"));
const LoanManagement = lazy(() => import("./pages/user/LoanManagement"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminInventory = lazy(() => import("./pages/admin/AdminInventory"));
const AdminCalendar = lazy(() => import("./pages/admin/AdminCalendar"));
const AdminRequests = lazy(() => import("./pages/admin/AdminRequests"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminProfile = lazy(() => import("./pages/admin/AdminProfile"));
const AdminDeviceDetail = lazy(() => import("./pages/admin/AdminDeviceDetail"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
      gcTime: 10 * 60 * 1000, // 10 minutes - garbage collection time
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnMount: false, // Don't refetch on component mount if data is fresh
      retry: 1, // Only retry once on failure
    },
  },
});

// Loading component for lazy-loaded pages
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  adminOnly?: boolean;
}> = ({ children, adminOnly }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  // Wait for auth validation to complete before redirecting
  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

const AppRoutes = () => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  // Show loading while checking auth state
  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to={isAdmin ? "/admin" : "/dashboard"} />
            ) : (
              <Login />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/catalog"
          element={
            <ProtectedRoute>
              <DeviceCatalog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/device/:id"
          element={
            <ProtectedRoute>
              <DeviceDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/loans"
          element={
            <ProtectedRoute>
              <LoanManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute adminOnly>
              <AdminAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/inventory"
          element={
            <ProtectedRoute adminOnly>
              <AdminInventory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/inventory/:id"
          element={
            <ProtectedRoute adminOnly>
              <AdminDeviceDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/calendar"
          element={
            <ProtectedRoute adminOnly>
              <AdminCalendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/requests"
          element={
            <ProtectedRoute adminOnly>
              <AdminRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute adminOnly>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute adminOnly>
              <AdminProfile />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <LanguageProvider>
              <NotificationProvider>
                <TooltipProvider>
                  {/* Accessibility: Skip to main content link */}
                  <SkipToContent />

                  {/* Toast notifications with ARIA */}
                  <Toaster />
                  <Sonner />

                  {/* Main application routes */}
                  <AppRoutes />
                </TooltipProvider>
              </NotificationProvider>
            </LanguageProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
