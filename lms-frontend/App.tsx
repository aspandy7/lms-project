import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { CourseList } from './pages/CourseList';
import { CourseDetail } from './pages/CourseDetail';
import { CourseCreate } from './pages/CourseCreate';
import { Profile } from './pages/Profile';
import { ScormImport } from './pages/ScormImport';

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-brand-green font-display text-xl">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  return <Layout>{children}</Layout>;
};

const App = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <CourseList />
            </ProtectedRoute>
          } />
          
          <Route path="/course/:id" element={
            <ProtectedRoute>
              <CourseDetail />
            </ProtectedRoute>
          } />

          <Route path="/create-course" element={
            <ProtectedRoute>
              <CourseCreate />
            </ProtectedRoute>
          } />

          <Route path="/course/:id/import" element={
            <ProtectedRoute>
              <ScormImport />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;