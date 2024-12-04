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
  PasswordResetVerify,
  PasswordResetResponse,
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

  private async handleFailedLogin(employeeId: string, ip: string | undefined): Promise<void> {
    await this.prisma.employee.update({
      where: { id: employeeId },
      data: {
        failedAttempts: {
          increment: 1
        }
      }
    });
  
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId }
    });
  
    if (employee && employee.failedAttempts >= 5) {
      const lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      await this.prisma.employee.update({
        where: { id: employeeId },
        data: {
          lockedUntil: lockUntil,
          failedAttempts: 0
        }
      });
    }
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
              permissions: {
                create: [],
              },
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
          sessionId,
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

// Check if account is locked
if (employee.lockedUntil && employee.lockedUntil > new Date()) {
  throw new AppError(401, 'Account is temporarily locked. Please try again later');
}

const isPasswordValid = await bcrypt.compare(credentials.password, employee.password);
if (!isPasswordValid) {
  await this.handleFailedLogin(employee.id, credentials.ip);
  throw new AppError(401, 'Invalid credentials');
}

// Reset failed attempts on successful login
await this.prisma.employee.update({
  where: { id: employee.id },
  data: {
    failedAttempts: 0,
    lockedUntil: null
  }
});

    const sessionId = uuid();
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

  private async generateResetToken(): Promise<string> {
    return crypto.randomBytes(32).toString('hex');
  }

  async requestPasswordReset(email: string): Promise<PasswordResetResponse> {
    try {
      const employee = await this.prisma.employee.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!employee) {
        // Return success even if email doesn't exist (security best practice)
        return {
          success: true,
          message: 'If your email exists in our system, you will receive a reset link',
        };
      }

      const resetToken = await this.generateResetToken();
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour validity

      await this.prisma.employee.update({
        where: { id: employee.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetTokenExpiry,
          sessionId: null, // Invalidate any existing sessions
        },
      });

      // TODO: Send email with reset link
      // const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

      logger.info('Password reset requested', {
        userId: employee.id,
        email: employee.email,
      });

      return {
        success: true,
        message: 'If your email exists in our system, you will receive a reset link',
      };
    } catch (error) {
      logger.error('Password reset request failed:', error);
      throw new AppError(500, 'Failed to process password reset request');
    }
  }

  async verifyAndResetPassword(data: PasswordResetVerify): Promise<PasswordResetResponse> {
    try {
      const employee = await this.prisma.employee.findFirst({
        where: {
          resetPasswordToken: data.token,
          resetPasswordExpires: {
            gt: new Date(), // Token must not be expired
          },
        },
      });

      if (!employee) {
        throw new AppError(400, 'Invalid or expired reset token');
      }

      // Hash new password
      const hashedPassword = await this.hashPassword(data.newPassword);

      // Update password and clear reset token
      await this.prisma.employee.update({
        where: { id: employee.id },
        data: {
          password: hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpires: null,
          sessionId: null, // Invalidate any existing sessions
        },
      });

      await auditLog(
        'PASSWORD_RESET',
        {
          userId: employee.id,
          action: 'Password reset completed',
        },
        employee.id
      );

      return {
        success: true,
        message: 'Password has been successfully reset',
      };
    } catch (error) {
      logger.error('Password reset verification failed:', error);
      throw error;
    }
  }

  async resetPassword(data: PasswordResetVerify): Promise<void> {
    const employee = await this.prisma.employee.findFirst({
      where: {
        resetPasswordToken: data.token,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!employee) {
      throw new AppError(400, 'Invalid or expired reset token');
    }

    const hashedPassword = await this.hashPassword(data.newPassword);

    await this.prisma.employee.update({
      where: { id: employee.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.employee.update({
      where: { id: userId },
      data: {
        sessionId: null,
      },
    });

    await auditLog(
      'LOGOUT',
      {
        entityID: userId,
        action: 'User logged out',
      },
      userId
    );
  }
}
