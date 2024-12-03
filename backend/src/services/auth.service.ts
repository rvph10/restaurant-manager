import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { config } from '../config';
import { auditLog, logger } from '../lib/logging/logger';
import {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  JwtPayload,
  PasswordReset,
} from '../interfaces/auth.interface';
import { AppError } from '../middleware/error.handler';
import crypto from 'crypto';

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
      logger.info('Starting registration process...');
      // Check for existing user
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
      let defaultRole = await this.prisma.role.findFirst({
        where: { name: 'USER' },
      });

      if (!defaultRole) {
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
      const hashedPassword = await this.hashPassword(data.password);
      try {
        const sessionId = uuid();
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
        logger.info('Employee created successfully !');
        const token = this.generateToken({
          userId: employee.id,
          roles: employee.roles.map((r) => r.role.name),
        });

        auditLog(
          'CREATE',
          {
            entityName: `${employee.firstName} ${employee.lastName}`,
            entityID: employee.id,
          },
          'SYSTEM'
        );
        return {
          user: {
            id: employee.id,
            email: employee.email,
            firstName: employee.firstName,
            lastName: employee.lastName,
            roles: employee.roles.map((r) => r.role.name),
          },
          token,
          sessionId
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

    const sessionId = uuid();

    await this.prisma.employee.updateMany({
      where: {
          id: employee.id,
          NOT: {
              sessionId: sessionId
          }
      },
      data: {
          sessionId: null
      }
  });

    await this.prisma.employee.update({
      where: { id: employee.id },
      data: {
        lastLogin: new Date(),
        lastLoginIP: credentials.ip,
        sessionId: sessionId,
      },
    });

    const token = this.generateToken({
      userId: employee.id,
      roles: employee.roles.map((r) => r.role.name),
    });

    auditLog(
      'LOGIN',
      {
        entityName: `${employee.firstName} ${employee.lastName}`,
        entityID: employee.id,
      },
      employee.id
    );

    return {
      user: {
        id: employee.id,
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        roles: employee.roles.map((r) => r.role.name),
      },
      token,
      sessionId,
    };
  }

  public async requestPasswordReset(email: string): Promise<void> {
    const employee = await this.prisma.employee.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (employee) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      await this.prisma.employee.update({
        where: { id: employee.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetTokenExpiry,
        },
      });

      // TODO: Send email with reset token
      logger.info(`Password reset requested for ${email}`);
    }
  }

  public async resetPassword(data: PasswordReset): Promise<void> {
    const employee = await this.prisma.employee.findFirst({
      where: {
        resetPasswordToken: data.token,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!employee) {
      throw new AppError(400, 'Invalid or expired reset token');
    }

    const hashedPassword = await this.hashPassword(data.password);

    await this.prisma.employee.update({
      where: { id: employee.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });
  }

  public async logout(userId: string): Promise<void> {
    await this.prisma.employee.update({
        where: { id: userId },
        data: {
            sessionId: null,
        }
    });

    await auditLog(
        'LOGOUT',
        {
            entityID: userId,
            action: 'User logged out'
        },
        userId
    );
}
}
