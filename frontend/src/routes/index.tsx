import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import HomePage from '../LoginPage/HomePage';
import MainPageLayout from '../MainPage/MainPage';
import LoginCallback from '../LoginPage/LoginCallback';
import NoteDetailPage from '../Note/NoteDetailPage';

// Protected Route Component
interface ProtectedRouteProps {
  element: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element }) => {
  const token = localStorage.getItem('token');
  return token ? element : <Navigate to="/login" replace />;
};

// Login Redirect Component (redirect to main if already logged in)
const LoginRedirect: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const token = localStorage.getItem('token');
  return token ? <Navigate to="/dashboard" replace /> : element;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/login',
    element: <LoginRedirect element={<HomePage />} />,
  },
  {
    path: '/login/callback',
    element: <LoginCallback />,
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute element={<MainPageLayout />} />,
  },
  {
    path: '/dashboard/notes/:id',
    element: <ProtectedRoute element={<NoteDetailPage />} />,
  },
  {
    path: '/dashboard/:module',
    element: <ProtectedRoute element={<MainPageLayout />} />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default router;
