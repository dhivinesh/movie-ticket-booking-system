import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MovieDetail from './pages/MovieDetail';
import Showtimes from './pages/Showtimes';
import SeatSelection from './pages/SeatSelection';
import Checkout from './pages/Checkout';
import ETicket from './pages/ETicket';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import OwnerDashboard from './pages/OwnerDashboard';

// Components
import Navbar from './components/Navbar';

import { Toaster } from 'react-hot-toast';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  
  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/" replace />;
  
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="min-h-screen flex flex-col pt-16">
        <Navbar />
        <main className="flex-grow bg-gray-50">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            <Route path="/movies/:id" element={<MovieDetail />} />
            <Route path="/movies/:id/showtimes" element={<Showtimes />} />
            
            <Route path="/shows/:showId/seats" element={
              <ProtectedRoute allowedRoles={['customer', 'admin', 'theater_owner']}>
                <SeatSelection />
              </ProtectedRoute>
            } />

            <Route path="/checkout" element={
              <ProtectedRoute allowedRoles={['customer', 'admin', 'theater_owner']}>
                <Checkout />
              </ProtectedRoute>
            } />

            <Route path="/tickets/:bookingId" element={
              <ProtectedRoute allowedRoles={['customer', 'admin', 'theater_owner']}>
                <ETicket />
              </ProtectedRoute>
            } />

            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            <Route path="/owner" element={
              <ProtectedRoute allowedRoles={['theater_owner']}>
                <OwnerDashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
