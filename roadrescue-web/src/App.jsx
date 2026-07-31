import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './index.css';

// Context
import { AuthProvider } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRouteGuard from './components/admin/AdminRouteGuard';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CustomerDashboard from './pages/CustomerDashboard';
import MechanicDashboard from './pages/MechanicDashboard';

// Admin Pages
import AdminLoginPage from './pages/admin/AdminLoginPage';
import Dashboard from './pages/admin/Dashboard';
import MechanicManagement from './pages/admin/MechanicManagement';
import MechanicDetail from './pages/admin/MechanicDetail';
import CustomerManagement from './pages/admin/CustomerManagement';
import CustomerDetail from './pages/admin/CustomerDetail';
import SOSCenter from './pages/admin/SOSCenter';
import LiveMap from './pages/admin/LiveMap';
import ChatMonitoring from './pages/admin/ChatMonitoring';
import APKManagement from './pages/admin/APKManagement';

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL || '/RoadRescue/'}>
      <AuthProvider>
        <div className="d-flex flex-column min-vh-100 bg-dark text-white">
          <Navbar />
          <main className="flex-grow-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Admin Login routes */}
              <Route path="/admin-login" element={<AdminLoginPage />} />
              <Route path="/admin/login" element={<Navigate to="/admin-login" replace />} />

              {/* Driver Dashboard (Role: USER / CUSTOMER) */}
              <Route 
                path="/dashboard" 
                element = {
                  <ProtectedRoute allowedRoles={['USER', 'CUSTOMER', 'customer', 'user']}>
                    <CustomerDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Mechanic Dashboard (Role: MECHANIC) */}
              <Route 
                path="/mechanic" 
                element = {
                  <ProtectedRoute allowedRoles={['MECHANIC', 'mechanic']}>
                    <MechanicDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Enterprise Admin Routes (Protected by AdminRouteGuard) */}
              <Route path="/admin" element={<AdminRouteGuard />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="mechanics" element={<MechanicManagement />} />
                <Route path="mechanics/:mechanicId" element={<MechanicDetail />} />
                <Route path="customers" element={<CustomerManagement />} />
                <Route path="customers/:customerId" element={<CustomerDetail />} />
                <Route path="sos-center" element={<SOSCenter />} />
                <Route path="live-map" element={<LiveMap />} />
                <Route path="chat-monitoring" element={<ChatMonitoring />} />
                <Route path="apk-management" element={<APKManagement />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Route>

              {/* Fallback to Home */}
              <Route path="*" element={<LandingPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
