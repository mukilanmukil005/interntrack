// =============================================================================
// File: frontend/src/hooks/useAuth.ts
// Purpose: Custom hook to consume the AuthContext safely
// =============================================================================

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
