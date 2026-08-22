import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import ChangePassword from './pages/ChangePassword';
import Employees from './pages/Employees';
import EmployeeDetail from './pages/EmployeeDetail';
import AttendancePage from './pages/Attendance';
import TimeOffPage from './pages/TimeOff';
import PayrollPage from './pages/Payroll';
import AdminPayrollPage from './pages/AdminPayroll';
import DocumentsPage from './pages/Documents';
import AdminDocumentsPage from './pages/AdminDocuments';
import ReportsPage from './pages/Reports';
import ProposalsPage from './pages/Proposals';
import AnnouncementsPage from './pages/Announcements';
import NotificationsPage from './pages/Notifications';
import HelpSupportPage from './pages/HelpSupport';
import SettingsPage from './pages/Settings';
import PerformancePage from './pages/Performance';
import CalendarPage from './pages/Calendar';
import { ProtectedRoute } from './routes/ProtectedRoute';

const TimeOffWrapper = () => {
  const { user } = useAuth();
  return user?.role === 'ADMIN' ? <ProposalsPage /> : <TimeOffPage />;
};

const PayrollWrapper = () => {
  const { user } = useAuth();
  return user?.role === 'ADMIN' ? <AdminPayrollPage /> : <PayrollPage />;
};

const DocumentsWrapper = () => {
  const { user } = useAuth();
  return user?.role === 'ADMIN' ? <AdminDocumentsPage /> : <DocumentsPage />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/landing" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Register />} />
          <Route path="/register" element={<Register />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/change-password" element={<ChangePassword />} />
            
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="time-off" element={<TimeOffWrapper />} />
              <Route path="payroll" element={<PayrollWrapper />} />
              <Route path="documents" element={<DocumentsWrapper />} />
              <Route path="profile" element={<EmployeeDetail isSelfProfile />} />

              {/* Active Functional Pages */}
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="performance" element={<PerformancePage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="help" element={<HelpSupportPage />} />
              <Route path="settings" element={<SettingsPage />} />
              
              {/* Admin Protected Routes */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="employees" element={<Employees />} />
                <Route path="employees/:id" element={<EmployeeDetail />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="proposals" element={<ProposalsPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/landing" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
