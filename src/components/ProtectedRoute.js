import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Login from './Login';

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();

  return currentUser ? children : <Login />;
}

export default ProtectedRoute;