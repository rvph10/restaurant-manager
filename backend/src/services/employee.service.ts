import { prisma } from '../prisma/client';
import {
  Gender,
  EmployeeStatus,
  Department,
  EmploymentType,
  Weekday,
  EmployeeRole,
  Employee,
  Role,
} from '@prisma/client';
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
            create: data.roles.map((roleId) => ({
              roleId: roleId,
            })),
          },
        },
      });

      await auditLog(
        'CREATE_EMPLOYEE',
        {
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          action: 'Created new employee',
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
              create: data.roles.map((roleId) => ({
                roleId: roleId,
              })),
            },
          }),
        },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      await auditLog(
        'UPDATE_EMPLOYEE',
        {
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          action: 'Updated employee details',
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
                  id: filters.role,
                },
              },
            },
          }),
        },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });
    } catch (error) {
      logger.error('Error getting employees:', error);
      throw error;
    }
  }

  async validatePassword(data: { email: string; password: string }): Promise<boolean> {
    try {
      const employee = await prisma.employee.findUnique({
        where: { email: data.email },
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

  async createRole(data: {
    user: string;
    name: string;
    description: string | null;
    permissions: string[];
  }): Promise<Role> {
    try {
      const role = await prisma.role.create({
        data: {
          name: data.name,
          description: data.description,
          permissions: {
            set: data.permissions,
          },
        },
      });

      await auditLog(
        'CREATE_ROLE',
        {
          roleId: role.id,
          roleName: role.name,
          action: 'Created new role',
        },
        data.user
      );

      return role;
    } catch (error) {
      logger.error('Error creating role:', error);
      throw error;
    }
  }

  async updateRole(data: {
    user: string;
    id: string;
    name?: string;
    description?: string | null;
    permissions?: string[];
  }): Promise<Role> {
    try {
      const updateData: any = { ...data };
      delete updateData.user;
      delete updateData.id;

      const role = await prisma.role.update({
        where: { id: data.id },
        data: {
          ...updateData,
          ...(data.permissions && {
            permissions: {
              set: data.permissions,
            },
          }),
        },
      });

      await auditLog(
        'UPDATE_ROLE',
        {
          roleId: role.id,
          roleName: role.name,
          action: 'Updated role details',
        },
        data.user
      );

      return role;
    } catch (error) {
      logger.error('Error updating role:', error);
      throw error;
    }
  }

  async getRoles(): Promise<Role[]> {
    try {
      return await prisma.role.findMany();
    } catch (error) {
      logger.error('Error getting roles:', error);
      throw error;
    }
  }

  async getRole(id: string): Promise<Role | null> {
    try {
      return await prisma.role.findUnique({
        where: { id },
      });
    } catch (error) {
      logger.error('Error getting role:', error);
      throw error;
    }
  }

  async getEmployeeRoles(employeeId: string): Promise<EmployeeRole[]> {
    try {
      return await prisma.employeeRole.findMany({
        where: {
          employeeId,
        },
      });
    } catch (error) {
      logger.error('Error getting employee roles:', error);
      throw error;
    }
  }

  async deleteRole(data: { user: string; id: string }): Promise<Role> {
    try {
      const role = await prisma.role.delete({
        where: { id: data.id },
      });

      await auditLog(
        'DELETE_ROLE',
        {
          roleId: role.id,
          roleName: role.name,
          action: 'Deleted role',
        },
        data.user
      );

      return role;
    } catch (error) {
      logger.error('Error deleting role:', error);
      throw error;
    }
  }

  async deleteEmployee(data: { user: string; id: string }): Promise<Employee> {
    try {
      const employee = await prisma.employee.delete({
        where: { id: data.id },
      });

      await auditLog(
        'DELETE_EMPLOYEE',
        {
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          action: 'Deleted employee',
        },
        data.user
      );

      return employee;
    } catch (error) {
      logger.error('Error deleting employee:', error);
      throw error;
    }
  }

  async createEmployeeRole(data: {
    user: string;
    employeeId: string;
    roleId: string;
  }): Promise<EmployeeRole> {
    try {
      const employeeRole = await prisma.employeeRole.create({
        data: {
          employeeId: data.employeeId,
          roleId: data.roleId,
        },
      });

      await auditLog(
        'CREATE_EMPLOYEE_ROLE',
        {
          employeeId: data.employeeId,
          roleId: data.roleId,
          action: 'Assigned role to employee',
        },
        data.user
      );

      return employeeRole;
    } catch (error) {
      logger.error('Error creating employee role:', error);
      throw error;
    }
  }

  async createPerformanceReview(data: {
    employeeId: string;
    reviewerId: string;
    reviewDate: Date;
    rating: number;
    feedback: string;
    user: string;
  }): Promise<void> {
    try {
      await prisma.performanceReview.create({
        data: {
          employeeId: data.employeeId,
          reviewerId: data.reviewerId,
          reviewDate: data.reviewDate,
          rating: data.rating,
          feedback: data.feedback,
        },
      });

      await auditLog(
        'CREATE_PERFORMANCE_REVIEW',
        {
          employeeId: data.employeeId,
          action: 'Created performance review',
        },
        data.user
      );
    } catch (error) {
      logger.error('Error creating performance review:', error);
      throw error;
    }
  }

  async getEmployee(id: string): Promise<Employee | null> {
    try {
      return await prisma.employee.findUnique({
        where: { id },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });
    } catch (error) {
      logger.error('Error getting employee:', error);
      throw error;
    }
  }
}
