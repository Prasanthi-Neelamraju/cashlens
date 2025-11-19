import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import PrivateRoute from './components/PrivateRoute.jsx';
import Login from './components/login.jsx';
import Register from './components/register.jsx';
import Dashboard from './components/Dashboard.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

function App() {
  return (
    <AuthProvider>
      <Routes>
      
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />

    
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/" element={<Navigate to="/login" replace />} />

        
        <Route 
          path="*" 
          element={<div className="text-white text-center p-10 bg-gray-900 min-h-screen">404 - Not Found</div>} 
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
