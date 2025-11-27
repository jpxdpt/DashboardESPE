export type UserRole = 'PROFESSOR' | 'SECRETARIA';
export type AlertStatus = 'PENDING' | 'RESOLVED';

// Export as const for runtime use
export const UserRoleEnum = {
  PROFESSOR: 'PROFESSOR' as const,
  SECRETARIA: 'SECRETARIA' as const,
} as const;

export interface User {
  id: string;
  email: string;
  name: string;
  employeeNumber?: string;
  role: UserRole;
  createdAt: string;
}

export interface Room {
  id: string;
  name: string;
  number: string;
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  userId: string;
  roomId: string;
  status: AlertStatus;
  createdAt: string;
  resolvedAt?: string;
  resolvedById?: string;
  professor: {
    id: string;
    name: string;
    email: string;
  };
  room: {
    id: string;
    name: string;
    number: string;
  };
  resolvedBy?: {
    id: string;
    name: string;
  };
}

