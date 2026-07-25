import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { SocketProvider } from '@/context/SocketContext';
import AppErrorBoundary from '@/components/AppErrorBoundary';

import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import ShortcutsModal from '@/components/ShortcutsModal';
import MarketTicker from '@/components/MarketTicker';

// Lazy loaded page components for performance optimizations
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const StockExplorer = lazy(() => import('./pages/StockExplorer'));
const StockDetails = lazy(() => import('./pages/StockDetails'));
const StockCompare = lazy(() => import('./pages/StockCompare'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));
const WatchlistPage = lazy(() => import('./pages/WatchlistPage'));
const TransactionHistory = lazy(() => import('./pages/TransactionHistory'));
const AnalyticsDashboard = lazy(() => import('./pages/AnalyticsDashboard'));
const ProfileSettings = lazy(() => import('./pages/ProfileSettings'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const LearnCenter = lazy(() => import('./pages/LearnCenter'));
const LearnDashboard = lazy(() => import('./pages/LearnDashboard'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const LessonView = lazy(() => import('./pages/LessonView'));
const Glossary = lazy(() => import('./pages/Glossary'));

// Query Client setup for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000,
    },
  },
});

// Loading Page component
const PageLoader = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-dark-bg">
    <div className="flex flex-col items-center gap-4">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      <p className="text-sm font-semibold text-slate-400">Loading TickerSim sessions...</p>
    </div>
  </div>
);

// Protected route middleware
const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? <Outlet /> : <Navigate to="/landing" replace />;
};

// Admin protected route middleware
const AdminRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user && user.role === 'admin' ? <Outlet /> : <Navigate to="/" replace />;
};

import { NavLink } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Briefcase, Eye, User } from 'lucide-react';

// Mobile bottom navigation bar
const MobileBottomNav = () => {
  const activeClass = "flex flex-col items-center justify-center text-blue-600 dark:text-blue-400 font-bold";
  const inactiveClass = "flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300";

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-white/95 dark:bg-dark-card/95 backdrop-blur-md border-t border-slate-200 dark:border-dark-border flex justify-around items-center px-2 shadow-lg">
      <NavLink to="/" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
        <LayoutDashboard className="h-5 w-5" />
        <span className="text-[10px] mt-0.5">Desk</span>
      </NavLink>
      <NavLink to="/stocks" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
        <TrendingUp className="h-5 w-5" />
        <span className="text-[10px] mt-0.5">Explorer</span>
      </NavLink>
      <NavLink to="/portfolio" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
        <Briefcase className="h-5 w-5" />
        <span className="text-[10px] mt-0.5">Portfolio</span>
      </NavLink>
      <NavLink to="/watchlist" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
        <Eye className="h-5 w-5" />
        <span className="text-[10px] mt-0.5">Watchlist</span>
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
        <User className="h-5 w-5" />
        <span className="text-[10px] mt-0.5">Profile</span>
      </NavLink>
    </div>
  );
};

// Dashboard Layout wrapper
const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isFullBleedPage = location.pathname === '/stocks';

  // Navigation and UI hotkeys listener
  useEffect(() => {
    let lastKey = '';
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
        return; // Ignore hotkeys while typing in inputs
      }

      if (e.key === '?') {
        setShortcutsOpen(prev => !prev);
      }

      if (e.key === '/') {
        const searchInput = document.querySelector('input[type="text"], input[placeholder*="search" i]');
        if (searchInput) {
          e.preventDefault();
          searchInput.focus();
        }
      }

      if (lastKey === 'g') {
        if (e.key === 'd') { navigate('/'); lastKey = ''; }
        else if (e.key === 'e') { navigate('/stocks'); lastKey = ''; }
        else if (e.key === 'p') { navigate('/portfolio'); lastKey = ''; }
        else if (e.key === 'w') { navigate('/watchlist'); lastKey = ''; }
        else if (e.key === 'c') { navigate('/compare'); lastKey = ''; }
      }

      if (e.key === 'g') {
        lastKey = 'g';
        setTimeout(() => {
          if (lastKey === 'g') lastKey = '';
        }, 1000);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 dark:bg-dark-bg text-slate-800 dark:text-dark-text transition-colors duration-300">
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-xl focus:font-bold focus:shadow-lg focus:ring-2 focus:ring-blue-500/20"
      >
        Skip to main content
      </a>
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      {/* Live market ticker bar — sits flush below the navbar */}
      <MarketTicker />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main 
          id="main-content"
          tabIndex="-1"
          className={
            isFullBleedPage
              ? "flex-1 flex flex-col min-h-0 overflow-hidden outline-none"
              : "flex-1 overflow-y-auto px-4 pt-6 pb-20 md:pb-6 md:p-6 lg:p-8 outline-none"
          }
        >
          <AppErrorBoundary label="Page Content">
            <Outlet />
          </AppErrorBoundary>
        </main>
      </div>
      <MobileBottomNav />
      <ShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <Toaster 
                position="top-right" 
                toastOptions={{
                  className: 'dark:bg-dark-card dark:text-dark-text border dark:border-dark-border shadow-2xl',
                  duration: 3500
                }} 
              />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/landing" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  {/* Protected Simulation Area */}
                  <Route element={<ProtectedRoute />}>
                    <Route element={<DashboardLayout />}>
                      <Route path="/" element={<AppErrorBoundary label="Dashboard"><Dashboard /></AppErrorBoundary>} />
                      <Route path="/stocks" element={<AppErrorBoundary label="Stock Explorer"><StockExplorer /></AppErrorBoundary>} />
                      <Route path="/stocks/:symbol" element={<AppErrorBoundary label="Stock Details"><StockDetails /></AppErrorBoundary>} />
                      <Route path="/compare" element={<AppErrorBoundary label="Stock Compare"><StockCompare /></AppErrorBoundary>} />
                      <Route path="/portfolio" element={<AppErrorBoundary label="Portfolio"><PortfolioPage /></AppErrorBoundary>} />
                      <Route path="/watchlist" element={<AppErrorBoundary label="Watchlist"><WatchlistPage /></AppErrorBoundary>} />
                      <Route path="/transactions" element={<AppErrorBoundary label="Transactions"><TransactionHistory /></AppErrorBoundary>} />
                      <Route path="/analytics" element={<AppErrorBoundary label="Analytics"><AnalyticsDashboard /></AppErrorBoundary>} />
                      <Route path="/profile" element={<AppErrorBoundary label="Profile"><ProfileSettings /></AppErrorBoundary>} />
                      
                      {/* Admin Only Route */}
                      <Route element={<AdminRoute />}>
                        <Route path="/admin" element={<AdminDashboard />} />
                      </Route>

                      {/* Learning Center Routes */}
                      <Route path="/learn" element={<LearnCenter />} />
                      <Route path="/learn/dashboard" element={<LearnDashboard />} />
                      <Route path="/learn/courses/:id" element={<CourseDetail />} />
                      <Route path="/learn/lessons/:id" element={<LessonView />} />
                      <Route path="/learn/glossary" element={<Glossary />} />
                    </Route>
                  </Route>

                  {/* Fallback to Dashboard (will redirect to Landing if not authenticated) */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </Router>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
