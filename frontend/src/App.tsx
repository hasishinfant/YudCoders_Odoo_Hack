import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
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
import DocumentsPage from './pages/Documents';
import ReportsPage from './pages/Reports';
import { ProtectedRoute } from './routes/ProtectedRoute';

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
              <Route path="time-off" element={<TimeOffPage />} />
              <Route path="payroll" element={<PayrollPage />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="profile" element={<EmployeeDetail isSelfProfile />} />

              {/* Navigation Module Fallbacks */}
              <Route path="calendar" element={<AttendancePage />} />
              <Route path="performance" element={<EmployeeDetail isSelfProfile />} />
              <Route path="announcements" element={<Dashboard />} />
              <Route path="help" element={<EmployeeDetail isSelfProfile />} />
              <Route path="settings" element={<EmployeeDetail isSelfProfile />} />
              
              {/* Admin Protected Routes */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="employees" element={<Employees />} />
                <Route path="employees/:id" element={<EmployeeDetail />} />
                <Route path="reports" element={<ReportsPage />} />
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
