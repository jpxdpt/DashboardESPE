import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ProfessorDashboard } from './pages/ProfessorDashboard';
import { SecretariaDashboard } from './pages/SecretariaDashboard';
import { RoomManagement } from './pages/RoomManagement';
import { UserManagement } from './pages/UserManagement';

function DashboardRouter() {
  const { user } = useAuth();
  
  // Debug: log user role
  console.log('DashboardRouter - User:', user);
  console.log('DashboardRouter - User role:', user?.role);
  console.log('DashboardRouter - Role type:', typeof user?.role);
  console.log('DashboardRouter - Is PROFESSOR?', user?.role === 'PROFESSOR');
  console.log('DashboardRouter - Is SECRETARIA?', user?.role === 'SECRETARIA');
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Use explicit string comparison
  const userRole = String(user.role).toUpperCase();
  
  if (userRole === 'PROFESSOR') {
    return <ProfessorDashboard />;
  } else if (userRole === 'SECRETARIA') {
    return <SecretariaDashboard />;
  }
  
  // Default to login if role doesn't match
  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/salas"
              element={
                <ProtectedRoute allowedRoles={['SECRETARIA']}>
                  <RoomManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/utilizadores"
              element={
                <ProtectedRoute allowedRoles={['SECRETARIA']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
