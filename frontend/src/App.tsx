import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './layout/Layout.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { POIList } from './pages/POIList.tsx';
import { POIDetail } from './pages/POIDetail.tsx';
import { Sources } from './pages/Sources.tsx';
import { Pictures } from './pages/Pictures.tsx';
import { Admin } from './pages/Admin.tsx';
import { Login } from './pages/Login.tsx';
import { Settings } from './pages/Settings.tsx';
import { JournalistDashboard } from './pages/JournalistDashboard.tsx';
import { UserManagement } from './pages/UserManagement.tsx';
import { ClaimDetail } from './pages/ClaimDetail.tsx';
import { Submissions } from './pages/Submissions.tsx';
import { WebScraper } from './pages/WebScraper.tsx';
import { ClaimsList } from './pages/ClaimsList.tsx';
import { VideoAnalyzer } from './pages/VideoAnalyzer.tsx';
import { LiveASR } from './pages/LiveASR.tsx';
import { MonitoringConsole } from './pages/MonitoringConsole.tsx';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            {/* Role-based dashboards */}
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Journalist routes */}
            <Route 
              path="journalist-dashboard" 
              element={
                <ProtectedRoute requiredRoles={['journalist', 'admin']}>
                  <JournalistDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="evidence" 
              element={
                <ProtectedRoute requiredRoles={['journalist', 'admin']}>
                  <Pictures />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="submissions" 
              element={
                <ProtectedRoute requiredRoles={['journalist', 'admin']}>
                  <Submissions />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin routes */}
            <Route 
              path="admin-dashboard" 
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <Admin />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="users" 
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <UserManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="scraper" 
              element={
                <ProtectedRoute requiredRoles={['journalist', 'admin']}>
                  <WebScraper />
                </ProtectedRoute>
              } 
            />

            
            {/* Shared routes */}
            <Route path="claims" element={<ClaimsList />} />
            <Route path="claim/:id" element={<ClaimDetail />} />
            <Route path="pois" element={<POIList />} />
            <Route path="poi/:id" element={<POIDetail />} />
            <Route path="sources" element={<Sources />} />
            <Route path="pictures" element={<Pictures />} />
            <Route path="analyzer" element={<VideoAnalyzer />} />
            <Route path="live-asr" element={<LiveASR />} />
            <Route path="site-monitor" element={<MonitoringConsole />} />
            <Route path="admin" element={<Admin />} />
            <Route 
              path="settings" 
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <Settings />
                </ProtectedRoute>
              } 
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
