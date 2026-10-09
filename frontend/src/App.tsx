import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { HudStatusBar } from './components/HudStatusBar';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { pageVariants } from './lib/animations';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UploadPage } from './pages/UploadPage';
import { CatalogPage } from './pages/CatalogPage';
import { PolicyPage } from './pages/PolicyPage';
import { EventExplorerPage } from './pages/EventExplorerPage';
import { AlertCenterPage } from './pages/AlertCenterPage';
import { ModelEvaluationPage } from './pages/ModelEvaluationPage';
import { ReportsPage } from './pages/ReportsPage';

/** Animated page wrapper — only the content fades/slides, not the shell */
const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    variants={pageVariants}
    initial="hidden"
    animate="visible"
    exit="exit"
  >
    {children}
  </motion.div>
);

/** Application shell — sidebar + main content area */
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{ backgroundColor: 'var(--bg-page)' }}
    >
      {/* Status bar */}
      <HudStatusBar />

      {/* Top navbar */}
      <Navbar />

      {/* Body: sidebar + main */}
      <div className="flex flex-1 relative min-h-0">
        <Sidebar />

        <main
          className="flex-1 flex flex-col overflow-x-hidden relative min-w-0"
          style={{ backgroundColor: 'var(--bg-page)' }}
          id="main-content"
          role="main"
          aria-label="Main content"
        >
          {/* Very subtle grid overlay */}
          <div
            className="absolute inset-0 cyber-grid pointer-events-none"
            style={{ opacity: 0.6 }}
            aria-hidden="true"
          />
          <div className="relative z-10 p-4 sm:p-6 md:p-7 lg:p-8 flex-1">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

/** Routes with AnimatePresence for page transitions */
const AnimatedRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public */}
        <Route path="/" element={<PageWrapper><LandingPage /></PageWrapper>} />
        <Route path="/login" element={<PageWrapper><LoginPage /></PageWrapper>} />

        {/* Protected */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PageWrapper><DashboardPage /></PageWrapper>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute allowedRoles={['admin', 'analyst']}>
              <AppLayout>
                <PageWrapper><UploadPage /></PageWrapper>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/catalog"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PageWrapper><CatalogPage /></PageWrapper>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/policies"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PageWrapper><PolicyPage /></PageWrapper>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/events"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PageWrapper><EventExplorerPage /></PageWrapper>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/alerts"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PageWrapper><AlertCenterPage /></PageWrapper>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/model"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PageWrapper><ModelEvaluationPage /></PageWrapper>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PageWrapper><ReportsPage /></PageWrapper>
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
