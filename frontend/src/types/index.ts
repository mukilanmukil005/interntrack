// =============================================================================
// File: frontend/src/types/index.ts
// Purpose: Canonical TypeScript interface definitions for the frontend
// =============================================================================

export type Role = 'ADMIN' | 'MENTOR' | 'INTERN';

export interface User {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  internProfile?: {
    college: string;
    domain: string;
    status: string;
    startDate?: string;
    endDate?: string;
    requiredHrs: number;
    program?: {
      title: string;
      duration: string;
    };
  };
  mentorProfile?: {
    expertise: string;
    department: string;
    bio?: string;
  };
}

export interface InternshipProgram {
  id: string;
  title: string;
  description: string;
  duration: 'ONE_MONTH' | 'THREE_MONTHS';
  reqHours: number;
  isActive: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}
