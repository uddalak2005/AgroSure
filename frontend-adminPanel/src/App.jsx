// App.js - Plain React version (No ShadCN components)
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import AllFarmers from './pages/allFarmers';
import Login from "./pages/login";
import Dashboard from './pages/dashboard';
import { ToastContainer } from 'react-toastify';
import './index.css'
import { AddAgentForm } from './components/Forms/addKioskForm';
import AllKiosks from './pages/allKiosks';
import AddFarmerPage from './pages/addFarmer';
// import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

function ProtectedRoute({ children }) {

  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-kiosk"
        element={
          <ProtectedRoute>
            <AddAgentForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/all-kiosks"
        element={
          <ProtectedRoute>
            <AllKiosks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/all-farmers"
        element={
          <ProtectedRoute>
            <AllFarmers />
          </ProtectedRoute>
        }
      />

      <Route
        path="/add-farmer"
        element={
          <ProtectedRoute>
            <AddFarmerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* Tooltips and Toasters can be custom integrated later if needed */}
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
      <ToastContainer/>
    </QueryClientProvider>
  );
}
