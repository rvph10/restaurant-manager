import { Gender, EmploymentType, Department, Weekday } from '@prisma/client';
export interface LoginCredentials {
  email: string;
  password: string;
  ip?: string;
}

export interface RegisterData {
  user: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  birthDate: Date;
  gender?: Gender;
  employmentType: EmploymentType;
  startDate: Date;
  endDate?: Date | null;
  department: Department[];
  hourlyRate: number;
  bankAccount?: string;
  maxHoursPerWeek?: number;
  unavailableDays?: Weekday[];
  roles: string[];
  isAdmin?: boolean;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  };
  token: string;
  sessionId: string;
}

export interface JwtPayload {
  userId: string;
  roles: string[];
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  token: string;
  password: string;
}
