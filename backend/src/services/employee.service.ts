import { prisma } from '../prisma/client';
import { Gender, EmployeeStatus, Department, EmploymentType, Weekday, EmployeeRole, Employee } from '@prisma/client';
import { auditLog, logger } from '../lib/logging/logger';
import bcrypt from 'bcrypt';

export class EmployeeService {

    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, 10);
    }

    async comparePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }
  async createEmployee(data: {
    user: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    status: EmployeeStatus | null; 
    birthDate: Date;
    Gender: Gender;
    employmentType: EmploymentType;
    startDate: Date;
    endDate: Date | null;
    department: Department[];
    hourlyRate: number;
    bankAccount: string;
    maxHoursPerWeek?: number;
    unavailableDays: Weekday[];
    roles: EmployeeRole[];
    isAdmin: boolean;
  }): Promise<Employee> {
    try {
      const employee = await prisma.employee.create({
        data: {
          ...data,
          password: await this.hashPassword(data.password),
          roles: {
            create: data.roles.map(roleId => ({
              roleId: roleId
            }))
          }
        },
      });

      await auditLog(
        'CREATE_EMPLOYEE',
        {
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          action: 'Created new employee'
        },
        data.user
      );

      return employee;
    } catch (error) {
      logger.error('Error creating employee:', error);
      throw error;
    }
  }

  async updateEmployee(data: {
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
  }): Promise<Employee> {
    try {
      const updateData: any = { ...data };
      delete updateData.user;
      delete updateData.id;
      delete updateData.roles;

      const employee = await prisma.employee.update({
        where: { id: data.id },
        data: {
          ...updateData,
          ...(data.roles && {
            roles: {
              deleteMany: {},
              create: data.roles.map(roleId => ({
                roleId: roleId
              }))
            }
          })
        },
        include: {
          roles: {
            include: {
              role: true
            }
          }
        }
      });

      await auditLog(
        'UPDATE_EMPLOYEE',
        {
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          action: 'Updated employee details'
        },
        data.user
      );

      return employee;
    } catch (error) {
      logger.error('Error updating employee:', error);
      throw error;
    }
  }

  async getEmployees(filters?: {
    department?: Department[];
    status?: EmployeeStatus;
    role?: string;
  }): Promise<Employee[]> {
    try {
      return await prisma.employee.findMany({
        where: {
          ...(filters?.department && { department: { hasEvery: filters.department } }),
          ...(filters?.status && { status: filters.status }),
          ...(filters?.role && {
            roles: {
              some: {
                role: {
                  id: filters.role
                }
              }
            }
          })
        },
        include: {
          roles: {
            include: {
              role: true
            }
          }
        }
      });
    } catch (error) {
      logger.error('Error getting employees:', error);
      throw error;
    }
  }

  async validatePassword(data: {
    email: string;
    password: string;
  }): Promise<boolean> {
    try {
      const employee = await prisma.employee.findUnique({
        where: { email: data.email }
      });
  
      if (!employee) {
        return false;
      }
  
      return this.comparePassword(data.password, employee.password);
    } catch (error) {
      logger.error('Error validating password:', error);
      throw error;
    }
  }

  async 

  async getEmployee(id: string): Promise<Employee | null> {
    try {
      return await prisma.employee.findUnique({
        where: { id },
        include: {
          roles: {
            include: {
              role: true
            }
          }
        }
      });
    } catch (error) {
      logger.error('Error getting employee:', error);
      throw error;
    }
  }
}