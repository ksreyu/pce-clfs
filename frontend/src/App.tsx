import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DarkModeProvider } from './context/DarkModeContext';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';
import PublicItemsPage from './pages/public/PublicItemsPage';
import PublicItemDetailPage from './pages/public/PublicItemDetailPage';
import DashboardPage from './pages/user/DashboardPage';
import ReportLostPage from './pages/user/ReportLostPage';
import ReportFoundPage from './pages/user/ReportFoundPage';
import MyItemsPage from './pages/user/MyItemsPage';
import MatchesPage from './pages/user/MatchesPage';
import ClaimsPage from './pages/user/ClaimsPage';
import ClaimDetailPage from './pages/user/ClaimDetailPage';
import NotificationsPage from './pages/user/NotificationsPage';
import ProfilePage from './pages/user/ProfilePage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminItemsPage from './pages/admin/AdminItemsPage';
import AdminClaimsPage from './pages/admin/AdminClaimsPage';
import AdminMatchesPage from './pages/admin/AdminMatchesPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
      <div className="text-center animate-fade-in">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/dashboard" />;
  return <>{children}</>;
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <Sidebar />
      <div className="flex-1 ml-0 lg:ml-64">
        <Navbar />
        <main className="p-4 lg:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <Sidebar admin />
      <div className="flex-1 ml-0 lg:ml-64">
        <Navbar />
        <main className="p-4 lg:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/items" element={<PublicItemsPage />} />
      <Route path="/items/:id" element={<PublicItemDetailPage />} />

      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><DashboardPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/report-lost" element={<ProtectedRoute><DashboardLayout><ReportLostPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/report-found" element={<ProtectedRoute><DashboardLayout><ReportFoundPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/my-items" element={<ProtectedRoute><DashboardLayout><MyItemsPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/matches" element={<ProtectedRoute><DashboardLayout><MatchesPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/claims" element={<ProtectedRoute><DashboardLayout><ClaimsPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/claims/:id" element={<ProtectedRoute><DashboardLayout><ClaimDetailPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><DashboardLayout><NotificationsPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><DashboardLayout><ProfilePage /></DashboardLayout></ProtectedRoute>} />

      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout><AdminDashboardPage /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminLayout><AdminUsersPage /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/items" element={<ProtectedRoute adminOnly><AdminLayout><AdminItemsPage /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/claims" element={<ProtectedRoute adminOnly><AdminLayout><AdminClaimsPage /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/matches" element={<ProtectedRoute adminOnly><AdminLayout><AdminMatchesPage /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute adminOnly><AdminLayout><AdminReportsPage /></AdminLayout></ProtectedRoute>} />

      <Route path="*" element={
        <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
          <div className="text-center animate-scale-in">
            <h1 className="text-7xl font-bold gradient-text mb-4">404</h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-6">Page not found</p>
            <a href="/" className="btn-primary inline-block">Go Home</a>
          </div>
        </div>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <DarkModeProvider>
      <AuthProvider>
        <Router>
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'dark:bg-gray-800 dark:text-gray-100',
              duration: 3000,
            }}
          />
          <AppRoutes />
        </Router>
      </AuthProvider>
    </DarkModeProvider>
  );
}
