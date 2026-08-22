import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import Employees from './pages/Employees';
import EmployeeDetail from './pages/EmployeeDetail';
import AttendancePage from './pages/Attendance';
import TimeOffPage from './pages/TimeOff';
import { ProtectedRoute } from './routes/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/change-password" element={<ChangePassword />} />
            
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="time-off" element={<TimeOffPage />} />
              <Route path="profile" element={<EmployeeDetail isSelfProfile />} />
              
              {/* Admin Protected Routes */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="employees" element={<Employees />} />
                <Route path="employees/:id" element={<EmployeeDetail />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
