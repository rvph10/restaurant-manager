import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../lib/logging/logger';
import {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  JwtPayload,
} from '../interfaces/auth.interface';
import { AppError } from '../middleware/error.handler';

export class AuthService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  }

  private generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      logger.info('Starting registration process');

      // Check for existing user
      logger.info('Checking for existing user');
      const existingUser = await this.prisma.employee.findFirst({
        where: {
          OR: [{ email: data.email }, { phone: data.phone }],
        },
      });

      if (existingUser) {
        logger.warn('User already exists');
        throw new AppError(409, 'Email or phone already registered');
      }

      // Find or create default role
      logger.info('Looking for default role');
      let defaultRole = await this.prisma.role.findFirst({
        where: { name: 'USER' },
      });

      if (!defaultRole) {
        logger.info('Creating default role');
        try {
          defaultRole = await this.prisma.role.create({
            data: {
              name: 'USER',
              description: 'Default user role',
              permissions: [],
            },
          });
        } catch (error) {
          logger.error('Error creating default role:', error);
          throw new AppError(500, 'Failed to create default role');
        }
      }

      // Hash password
      logger.info('Hashing password');
      const hashedPassword = await this.hashPassword(data.password);
      logger.info('Password hashed');

      // Create employee
      logger.info('Creating employee');
      try {
        const employee = await this.prisma.employee.create({
          data: {
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
          },
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        });

        logger.info('Employee created successfully');

        const token = this.generateToken({
          userId: employee.id,
          roles: employee.roles.map((r) => r.role.name),
        });

        return {
          user: {
            id: employee.id,
            email: employee.email,
            firstName: employee.firstName,
            lastName: employee.lastName,
            roles: employee.roles.map((r) => r.role.name),
          },
          token,
        };
      } catch (error) {
        logger.error('Error creating employee:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw error;
        }
        throw new AppError(500, 'Failed to create employee');
      }
    } catch (error) {
      logger.error('Registration error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const employee = await this.prisma.employee.findUnique({
      where: { email: credentials.email.toLowerCase() },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!employee) {
      throw new AppError(401, 'Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(credentials.password, employee.password);
    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid credentials');
    }

    await this.prisma.employee.update({
      where: { id: employee.id },
      data: { lastLogin: new Date() },
    });

    const token = this.generateToken({
      userId: employee.id,
      roles: employee.roles.map((r) => r.role.name),
    });

    return {
      user: {
        id: employee.id,
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        roles: employee.roles.map((r) => r.role.name),
      },
      token,
    };
  }
}
