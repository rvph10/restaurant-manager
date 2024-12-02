import { PrismaClient, Employee, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { logger } from '../lib/logging/logger';
import { config } from '../config';

export class AuthService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }

  private async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, 12);
    } catch (error) {
      logger.error('Error hashing password:', error);
      throw new Error('Password hashing failed');
    }
  }

  private generateToken(userId: string, roles: string[]): string {
    try {
      return jwt.sign({ userId, roles }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
    } catch (error) {
      logger.error('Error generating token:', error);
      throw new Error('Token generation failed');
    }
  }

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
  }): Promise<{ employee: Employee; token: string }> {
    logger.info('Starting registration process', { email: data.email });

    try {
      // Check if user exists
      const existingUser = await this.prisma.employee.findFirst({
        where: {
          OR: [{ email: data.email }, { phone: data.phone }],
        },
      });

      if (existingUser) {
        logger.warn('Registration failed - user exists', { email: data.email });
        throw new Error('User already exists');
      }

      // Find or create default role
      let defaultRole = await this.prisma.role.findFirst({
        where: {
          name: 'USER',
        },
      });

      logger.info('Creating or fetching default role');
      if (!defaultRole) {
        try {
          defaultRole = await this.prisma.role.create({
            data: {
              name: 'USER',
              description: 'Default user role',
              permissions: [],
            },
          });
          logger.info('Created default role', { roleId: defaultRole.id });
        } catch (error) {
          logger.error('Error creating default role:', error);
          throw new Error('Failed to create default role');
        }
      }

      logger.info('Hashing password');
      const hashedPassword = await this.hashPassword(data.password);
      logger.info('Password hashed successfully');

      // Create user with role
      logger.info('Creating new employee record');
      const employeeData: Prisma.EmployeeCreateInput = {
        email: data.email.toLowerCase(),
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        startDate: new Date(),
        birthDate: new Date(),
        employmentType: 'FULL_TIME',
        hourlyRate: new Prisma.Decimal(0),
        department: ['SERVICE'],
        roles: {
          create: [
            {
              roleId: defaultRole.id,
            },
          ],
        },
      };

      const employee = await this.prisma.employee.create({
        data: employeeData,
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      logger.info('Employee created successfully', { employeeId: employee.id });

      // Generate token
      const token = this.generateToken(
        employee.id,
        employee.roles.map((r) => r.role.name)
      );

      logger.info('Registration completed successfully');
      return { employee, token };
    } catch (error) {
      logger.error('Registration error:', {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        data: { ...data, password: '[REDACTED]' },
      });

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        logger.error('Prisma error:', {
          code: error.code,
          meta: error.meta,
          message: error.message,
        });
      }

      throw error;
    }
  }

  async login(email: string, password: string): Promise<{ employee: Employee; token: string }> {
    try {
      logger.info('Login attempt', { email });

      const employee = await this.prisma.employee.findUnique({
        where: { email: email.toLowerCase() },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!employee) {
        logger.warn('Login failed - user not found', { email });
        throw new Error('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(password, employee.password);
      if (!isPasswordValid) {
        logger.warn('Login failed - invalid password', { email });
        throw new Error('Invalid credentials');
      }

      // Update last login
      await this.prisma.employee.update({
        where: { id: employee.id },
        data: { lastLogin: new Date() },
      });

      const token = this.generateToken(
        employee.id,
        employee.roles.map((r) => r.role.name)
      );

      logger.info('Login successful', { userId: employee.id });
      return { employee, token };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }
}
