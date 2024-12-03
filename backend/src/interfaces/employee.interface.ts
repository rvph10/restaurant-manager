import {
  EmploymentType,
  Gender,
  Department,
  Weekday,
  EmployeeStatus,
  DocumentType,
  BreakType,
  TimeOffType,
  TimeOffStatus,
} from '@prisma/client';

// Create Employee Input
export interface CreateEmployeeInput {
  user: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  salaryHours?: number;
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

// Update Employee Input
export interface UpdateEmployeeInput {
  user: string;
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  status?: EmployeeStatus;
  department?: Department[];
  hourlyRate?: number;
  roles?: string[];
  bankAccount?: string;
  maxHoursPerWeek?: number;
  unavailableDays?: Weekday[];
}

// Employee Document Input
export interface EmployeeDocumentInput {
  user: string;
  employeeId: string;
  type: DocumentType;
  name: string;
  url: string;
  expiryDate?: Date;
}

// Employee Break Input
export interface EmployeeBreakInput {
  user: string;
  employeeId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  type: BreakType;
}

// Create Role Input
export interface CreateRole {
  user: string;
  name: string;
  description?: string | null;
  permissions: string[];
}

// Update Role Input
export interface UpdateRole {
  user: string;
  id: string;
  name?: string;
  description?: string | null;
  permissions?: string[];
}

// Employee Role Input
export interface EmployeeRoleInput {
  user: string;
  employeeId: string;
  roleId: string;
}

// Employee Time Off Input
export interface TimeOffInput {
  user: string;
  employeeId: string;
  type: TimeOffType;
  startDate: Date;
  endDate: Date;
  reason?: string;
}

// Employee Performance Review Input
export interface PerformanceReviewInput {
  user: string;
  employeeId: string;
  reviewerId: string;
  reviewDate: Date;
  rating: number;
  feedback: string;
}

// Employee Status Change Input
export interface StatusChangeInput {
  user: string;
  employeeId: string;
  status: EmployeeStatus;
  reason?: string;
}

// Employee Availability Input
export interface AvailabilityInput {
  user: string;
  employeeId: string;
  unavailableDays: Weekday[];
  maxHoursPerWeek?: number;
}

// Employee Filter Options
export interface EmployeeFilterOptions {
  department?: Department[];
  status?: EmployeeStatus;
  role?: string;
  employmentType?: EmploymentType;
  isActive?: boolean;
}

// Time Off Response Interface
export interface TimeOffResponse {
  id: string;
  type: TimeOffType;
  startDate: Date;
  endDate: Date;
  status: TimeOffStatus;
  reason?: string;
  approvedById?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Performance Review Response
export interface PerformanceReviewResponse {
  id: string;
  employeeId: string;
  reviewerId: string;
  reviewDate: Date;
  rating: number;
  feedback: string;
  createdAt: Date;
  updatedAt: Date;
}

// Employee Certification Input
export interface EmployeeCertificationInput {
  user: string;
  employeeId: string;
  name: string;
  issuedBy: string;
  issueDate: Date;
  expiryDate?: Date;
  certificateNumber?: string;
}

export interface SalaryAdjustment {
  user: string;
  employeeId: string;
  hourlyRate: number;
  salary: number;
}
