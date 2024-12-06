import { prisma } from '../prisma/client';
import { PerformanceReview, Permission, Prisma, ShiftAssignment } from '@prisma/client';
import {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  TimeOffInput,
  PerformanceReviewInput,
  CreateRole,
  UpdateRole,
  EmployeeRoleInput,
  StatusChangeInput,
  EmployeeCertificationInput,
  TimeOffResponse,
  SalaryAdjustment,
} from '../interfaces/employee.interface';
import {
  EmployeeStatus,
  Department,
  EmployeeRole,
  Employee,
  Role,
  TimeOff,
  Certification,
  Break,
  BreakType,
  TimeOffType,
} from '@prisma/client';
import { auditLog, logger } from '../lib/logging/logger';

export class EmployeeService {
  private handleServiceError(error: unknown, context: string): never {
    logger.error(`Error in EmployeeService.${context}:`, error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          throw new Error('A record with this value already exists');
        case 'P2025':
          throw new Error('Record not found');
        case 'P2003':
          throw new Error('Foreign key constraint failed');
        case 'P2014':
          throw new Error('The provided data is invalid');
        default:
          throw new Error(`Database error: ${error.message}`);
      }
    }

    if (error instanceof Error) {
      return this.handleServiceError(error, 'handleServiceError');
    }

    throw new Error('An unexpected error occurred');
  }

  async employeeExists(filters: {
    id?: string;
    email?: string;
    phone?: string;
    employeeId?: string;
  }): Promise<boolean> {
    try {
      if (!Object.keys(filters).length) {
        throw new Error('At least one filter must be provided');
      }

      const whereClause: any = {
        OR: [],
        AND: [],
      };

      // Build dynamic where clause
      if (filters.id) {
        whereClause.OR.push({ id: filters.id });
      }
      if (filters.email) {
        whereClause.OR.push({ email: filters.email.toLowerCase() });
      }
      if (filters.phone) {
        whereClause.OR.push({ phone: filters.phone });
      }
      if (filters.employeeId) {
        whereClause.OR.push({ id: filters.employeeId });
      }

      const count = await prisma.employee.count({
        where: whereClause,
      });

      return count > 0;
    } catch (error) {
      logger.error('Error checking employee existence:', error);
      return this.handleServiceError(error, 'employeeExists');
    }
  }

  async roleExists(filters: {
    id?: string;
    name?: string;
    permissions?: string[];
  }): Promise<boolean> {
    try {
      if (!Object.keys(filters).length) {
        throw new Error('At least one filter must be provided');
      }

      const whereClause: any = {
        OR: [],
      };

      // Build dynamic where clause
      if (filters.id) {
        whereClause.OR.push({ id: filters.id });
      }
      if (filters.name) {
        whereClause.OR.push({
          name: {
            equals: filters.name,
            mode: 'insensitive', // Case insensitive search
          },
        });
      }
      if (filters.permissions) {
        whereClause.OR.push({
          permissions: {
            hasEvery: filters.permissions,
          },
        });
      }

      const count = await prisma.role.count({
        where: whereClause,
      });

      return count > 0;
    } catch (error) {
      logger.error('Error checking role existence:', error);
      return this.handleServiceError(error, 'roleExists');
    }
  }

  async checkOverlappingTimeOff(
    employeeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<boolean> {
    const count = await prisma.timeOff.count({
      where: {
        employeeId,
        status: 'APPROVED',
        OR: [
          {
            AND: [{ startDate: { lte: startDate } }, { endDate: { gte: startDate } }],
          },
          {
            AND: [{ startDate: { lte: endDate } }, { endDate: { gte: endDate } }],
          },
        ],
      },
    });
    return count > 0;
  }

  private validateEmployeeData(data: CreateEmployeeInput) {
    if (!this.isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }

    if (!this.isValidPhone(data.phone)) {
      throw new Error('Invalid phone number');
    }

    if (data.hourlyRate < 0) {
      throw new Error('Hourly rate cannot be negative');
    }

    if (data.maxHoursPerWeek && (data.maxHoursPerWeek < 0 || data.maxHoursPerWeek > 168)) {
      throw new Error('Invalid weekly hours');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s-]{8,}$/;
    return phoneRegex.test(phone);
  }

  async createEmployee(data: CreateEmployeeInput): Promise<Employee> {
    try {
      if (await this.employeeExists({ email: data.email })) {
        throw new Error('Employee with this email already exists');
      }

      if (await this.employeeExists({ phone: data.phone })) {
        throw new Error('Employee with this phone number already exists');
      }

      if (data.maxHoursPerWeek && data.maxHoursPerWeek > 168) {
        throw new Error('Max hours per week cannot exceed 168');
      }

      if (data.maxHoursPerWeek && data.maxHoursPerWeek < 0) {
        throw new Error('Max hours per week cannot be negative');
      }

      if (data.hourlyRate < 0) {
        throw new Error('Hourly rate cannot be negative');
      }

      this.validateEmployeeData(data);
      const employee = await prisma.employee.create({
        data: {
          ...data,
          password: data.password,
          salaryHours: data.salaryHours,
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
        data.user || 'SYSTEM'
      );

      return employee;
    } catch (error) {
      logger.error('Error creating employee:', error);
      return this.handleServiceError(error, 'createEmployee');
    }
  }

  async updateEmployee(data: UpdateEmployeeInput): Promise<Employee> {
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
      return this.handleServiceError(error, 'updateEmployee');
    }
  }

  async updateEmployeeStatus(data: StatusChangeInput): Promise<Employee> {
    try {
      const employee = await prisma.employee.update({
        where: { id: data.employeeId },
        data: {
          status: data.status,
          endDate: data.status === 'TERMINATED' ? new Date() : undefined,
        },
      });

      await auditLog(
        'UPDATE_EMPLOYEE_STATUS',
        {
          employeeId: data.employeeId,
          oldStatus: employee.status,
          newStatus: data.status,
          reason: data.reason,
          action: 'Updated employee status',
        },
        data.user
      );

      return employee;
    } catch (error) {
      logger.error('Error updating employee status:', error);
      return this.handleServiceError(error, 'updateEmployeeStatus');
    }
  }

  async getEmployees(filters?: {
    department?: Department[];
    status?: EmployeeStatus;
    role?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ data: Employee[]; total: number; pages: number }> {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const skip = (page - 1) * limit;

      const [employees, total] = await prisma.$transaction([
        prisma.employee.findMany({
          where: {
            ...(filters?.department && { department: { hasEvery: filters.department } }),
            ...(filters?.status && { status: filters.status }),
            ...(filters?.role && {
              roles: { some: { role: { id: filters.role } } },
            }),
          },
          include: {
            roles: { include: { role: true } },
          },
          skip,
          take: limit,
          orderBy: filters?.sortBy ? { [filters.sortBy]: filters.sortOrder } : undefined,
        }),
        prisma.employee.count({
          where: {
            ...(filters?.department && { department: { hasEvery: filters.department } }),
            ...(filters?.status && { status: filters.status }),
            ...(filters?.role && {
              roles: { some: { role: { id: filters.role } } },
            }),
          },
        }),
      ]);

      return {
        data: employees,
        total,
        pages: Math.ceil(total / limit),
      };
    } catch (error) {
      return this.handleServiceError(error, 'getEmployees');
    }
  }

  async createRole(data: CreateRole): Promise<Role> {
    try {
      if (!data.name) {
        throw new Error('Role name is required');
      }
      if (await this.roleExists({ name: data.name })) {
        throw new Error('Role already exists');
      }
      if (!data.permissions || !data.permissions.length) {
        throw new Error('At least one permission is required');
      }

      const role = await prisma.role.create({
        data: {
          name: data.name,
          description: data.description,
          permissions: {
            create: data.permissions.map((permission) => ({
              permission: { connect: { id: permission } },
            })),
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
      return this.handleServiceError(error, 'createRole');
    }
  }

  async updateRole(data: UpdateRole): Promise<Role> {
    try {
      if (!data.id) {
        throw new Error('Role ID is required');
      }
      if (!(await this.roleExists({ id: data.id }))) {
        throw new Error('Role not found');
      }
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
      return this.handleServiceError(error, 'updateRole');
    }
  }

  async getRoles(): Promise<Role[]> {
    try {
      return await prisma.role.findMany();
    } catch (error) {
      logger.error('Error getting roles:', error);
      return this.handleServiceError(error, 'getRoles');
    }
  }

  async getRole(id: string): Promise<Role | null> {
    try {
      if (!id) {
        throw new Error('Role ID is required');
      }
      return await prisma.role.findUnique({
        where: { id },
      });
    } catch (error) {
      logger.error('Error getting role:', error);
      return this.handleServiceError(error, 'getRole');
    }
  }

  async getEmployeeRoles(employeeId: string): Promise<EmployeeRole[]> {
    try {
      if (!employeeId) {
        throw new Error('Employee ID is required');
      }
      if (!(await this.employeeExists({ id: employeeId }))) {
        throw new Error('Employee not found');
      }
      return await prisma.employeeRole.findMany({
        where: {
          employeeId,
        },
      });
    } catch (error) {
      logger.error('Error getting employee roles:', error);
      return this.handleServiceError(error, 'getEmployeeRoles');
    }
  }

  async deleteRole(data: { user: string; id: string }): Promise<Role> {
    try {
      if (!data.id) {
        throw new Error('Role ID is required');
      }

      if (!(await this.roleExists({ id: data.id }))) {
        throw new Error('Role not found');
      }

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
      return this.handleServiceError(error, 'deleteRole');
    }
  }

  async deleteEmployee(data: { user: string; id: string }): Promise<Employee> {
    try {
      if (!data.id) {
        throw new Error('Employee ID is required');
      }

      if (!(await this.employeeExists({ id: data.id }))) {
        throw new Error('Employee not found');
      }

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
      return this.handleServiceError(error, 'deleteEmployee');
    }
  }

  async createEmployeeRole(data: EmployeeRoleInput): Promise<EmployeeRole> {
    try {
      if (!data.employeeId) {
        throw new Error('Employee ID is required');
      }
      if (!data.roleId) {
        throw new Error('Role ID is required');
      }
      if (
        !(await this.employeeExists({ id: data.employeeId })) ||
        !(await this.roleExists({ id: data.roleId }))
      ) {
        throw new Error('Employee or role not found');
      }

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
      return this.handleServiceError(error, 'createEmployeeRole');
    }
  }

  async createPerformanceReview(data: PerformanceReviewInput): Promise<void> {
    try {
      if (!data.employeeId) {
        throw new Error('Employee ID is required');
      }
      if (!data.reviewerId) {
        throw new Error('Reviewer ID is required');
      }
      if (data.rating < 1 || data.rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      if (
        (await this.employeeExists({ id: data.employeeId })) &&
        (await this.employeeExists({ id: data.reviewerId }))
      ) {
        await prisma.performanceReview.create({
          data: {
            employeeId: data.employeeId,
            reviewerId: data.reviewerId,
            reviewDate: new Date(),
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
      } else {
        throw new Error('Employee not found');
      }
    } catch (error) {
      logger.error('Error creating performance review:', error);
      return this.handleServiceError(error, 'createPerformanceReview');
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
      return this.handleServiceError(error, 'getEmployee');
    }
  }

  async addEmployeeCertification(data: EmployeeCertificationInput): Promise<Certification> {
    try {
      const certification = await prisma.certification.create({
        data: {
          employeeId: data.employeeId,
          name: data.name,
          issuedBy: data.issuedBy,
          issueDate: data.issueDate,
          expiryDate: data.expiryDate,
          certificateNumber: data.certificateNumber,
        },
      });

      await auditLog(
        'ADD_EMPLOYEE_CERTIFICATION',
        {
          employeeId: data.employeeId,
          certificationId: certification.id,
          action: 'Added employee certification',
        },
        data.user
      );

      return certification;
    } catch (error) {
      logger.error('Error adding employee certification:', error);
      return this.handleServiceError(error, 'addEmployeeCertification');
    }
  }

  async createTimeOff(data: TimeOffInput): Promise<TimeOff> {
    try {
      if (!data.employeeId) {
        throw new Error('Employee ID is required');
      }
      if (!data.type || !Object.values(TimeOffType).includes(data.type)) {
        throw new Error('Time off type is required');
      }
      await this.checkOverlappingTimeOff(data.employeeId, data.startDate, data.endDate);
      if (data.startDate > data.endDate) {
        throw new Error('Start date must be before end date');
      }

      if (await this.employeeExists({ id: data.employeeId })) {
        const timeOffRequest = await prisma.timeOff.create({
          data: {
            employeeId: data.employeeId,
            type: data.type,
            startDate: data.startDate,
            endDate: data.endDate,
            reason: data.reason,
          },
        });

        await auditLog(
          'CREATE_TIME_OFF_REQUEST',
          {
            employeeId: data.employeeId,
            timeOffId: timeOffRequest.id,
            action: 'Created time off request',
          },
          data.user
        );

        return timeOffRequest;
      } else {
        throw new Error('Employee not found');
      }
    } catch (error) {
      logger.error('Error creating time off request:', error);
      return this.handleServiceError(error, 'createTimeOff');
    }
  }

  async updateTimeOff(data: TimeOffResponse): Promise<TimeOff> {
    try {
      const timeOffRequest = await prisma.timeOff.findUnique({
        where: { id: data.id },
      });
      if (!timeOffRequest) {
        throw new Error('Time off request not found');
      }
      if (timeOffRequest.status !== 'PENDING') {
        throw new Error('Time off request has already been approved/rejected');
      }
      if (data.startDate > data.endDate) {
        throw new Error('Start date must be before end date');
      }

      if (data.startDate < new Date()) {
        throw new Error('Start date must be in the future');
      }
      await this.checkOverlappingTimeOff(data.id, data.startDate, data.endDate);
      if (
        (await this.employeeExists({ id: data.id })) ||
        (await this.employeeExists({ id: data.approvedById }))
      ) {
        const updatedTimeOffRequest = await prisma.timeOff.update({
          where: { id: data.id },
          data: {
            type: data.type,
            startDate: data.startDate,
            endDate: data.endDate,
            reason: data.reason,
            status: data.status,
            approvedById: data.approvedById,
            approvedAt: data.status === 'APPROVED' ? new Date() : null,
          },
        });

        await auditLog(
          'UPDATE_TIME_OFF_REQUEST',
          {
            employeeId: updatedTimeOffRequest.employeeId,
            timeOffId: updatedTimeOffRequest.id,
            action: 'Updated time off request',
          },
          data.id
        );

        return updatedTimeOffRequest;
      } else {
        throw new Error('Employee not found');
      }
    } catch (error) {
      logger.error('Error updating time off request:', error);
      return this.handleServiceError(error, 'updateTimeOff');
    }
  }

  async startEmployeeBreak(data: {
    user: string;
    employeeId: string;
    type: BreakType;
  }): Promise<Break> {
    try {
      if (!data.employeeId) {
        throw new Error('Employee ID is required');
      }
      if (!data.type || !Object.values(BreakType).includes(data.type)) {
        throw new Error('Break type is required');
      }
      if (await this.employeeExists({ id: data.employeeId })) {
        const breakRecord = await prisma.break.create({
          data: {
            employeeId: data.employeeId,
            type: data.type,
            startTime: new Date(),
          },
        });

        await auditLog(
          'START_EMPLOYEE_BREAK',
          {
            employeeId: data.employeeId,
            breakId: breakRecord.id,
            action: 'Started employee break',
          },
          data.user
        );
        return breakRecord;
      } else {
        throw new Error('Employee not found');
      }
    } catch (error) {
      logger.error('Error starting employee break:', error);
      return this.handleServiceError(error, 'startEmployeeBreak');
    }
  }

  async endEmployeeBreak(data: { user: string; breakId: string }): Promise<Break> {
    try {
      const breakRecord = await prisma.break.findUnique({
        where: { id: data.breakId },
      });
      if (!breakRecord) {
        throw new Error('Break record not found');
      }
      if (breakRecord.endTime) {
        throw new Error('Break has already ended');
      }
      const duration = (new Date().getTime() - breakRecord.startTime.getTime()) / 1000;
      await prisma.break.update({
        where: { id: data.breakId },
        data: {
          endTime: new Date(),
          duration: duration,
        },
      });

      await auditLog(
        'END_EMPLOYEE_BREAK',
        {
          breakId: breakRecord.id,
          action: 'Ended employee break',
        },
        data.user
      );

      return breakRecord;
    } catch (error) {
      logger.error('Error ending employee break:', error);
      return this.handleServiceError(error, 'endEmployeeBreak');
    }
  }

  async getEmployeeSchedule(
    employeeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ShiftAssignment[]> {
    try {
      return await prisma.shiftAssignment.findMany({
        where: {
          employeeId,
          startTime: { gte: startDate },
          endTime: { lte: endDate },
        },
        include: {
          shift: true,
          scheduledBreaks: true,
        },
      });
    } catch (error) {
      return this.handleServiceError(error, 'getEmployeeSchedule');
    }
  }

  async getPerformanceMetrics(
    employeeId: string,
    period: { start: Date; end: Date }
  ): Promise<{
    reviews: PerformanceReview[];
    attendance: { present: number; late: number; absent: number };
    averageRating: number;
  }> {
    try {
      const [reviews, shifts] = await Promise.all([
        prisma.performanceReview.findMany({
          where: {
            employeeId,
            reviewDate: { gte: period.start, lte: period.end },
          },
        }),
        prisma.shiftAssignment.findMany({
          where: {
            employeeId,
            startTime: { gte: period.start, lte: period.end },
          },
        }),
      ]);

      const attendance = {
        present: shifts.filter((s) => s.status === 'COMPLETED').length,
        late: shifts.filter((s) => s.isLate).length,
        absent: shifts.filter((s) => s.status === 'NO_SHOW').length,
      };

      const averageRating = reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length || 0;

      return { reviews, attendance, averageRating };
    } catch (error) {
      return this.handleServiceError(error, 'getPerformanceMetrics');
    }
  }

  async adjustEmployeeSalary(data: SalaryAdjustment): Promise<Employee> {
    try {
      const employee = await prisma.employee.update({
        where: { id: data.employeeId },
        data: {
          hourlyRate: data.hourlyRate,
          salaryHours: data.salary,
        },
      });

      await auditLog(
        'ADJUST_EMPLOYEE_SALARY',
        {
          employeeId: data.employeeId,
          action: 'Adjusted employee salary',
        },
        data.user
      );

      return employee;
    } catch (error) {
      return this.handleServiceError(error, 'adjustEmployeeSalary');
    }
  }

  async searchEmployees(query: string): Promise<Employee[]> {
    try {
      return await prisma.employee.findMany({
        where: {
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query } },
          ],
        },
        include: {
          roles: { include: { role: true } },
        },
      });
    } catch (error) {
      return this.handleServiceError(error, 'searchEmployees');
    }
  }
}
