import { PrismaClient, EmploymentType, Department } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logger } from '../../lib/logging/logger';

const prisma = new PrismaClient();

const employeeConfigs = [
  {
    email: 'admin@restaurant.com',
    password: 'Admin123!',
    firstName: 'Admin',
    lastName: 'User',
    phone: '+1234567890',
    employmentType: 'FULL_TIME' as EmploymentType,
    department: ['MANAGEMENT'] as Department[],
    roleName: 'ADMIN',
    hourlyRate: 25.0,
  },
  {
    email: 'manager@restaurant.com',
    password: 'Manager123!',
    firstName: 'Manager',
    lastName: 'User',
    phone: '+1234567891',
    employmentType: 'FULL_TIME' as EmploymentType,
    department: ['MANAGEMENT'] as Department[],
    roleName: 'MANAGER',
    hourlyRate: 20.0,
  },
  {
    email: 'chef@restaurant.com',
    password: 'Chef123!',
    firstName: 'Chef',
    lastName: 'Master',
    phone: '+1234567892',
    employmentType: 'FULL_TIME' as EmploymentType,
    department: ['KITCHEN'] as Department[],
    roleName: 'STAFF',
    hourlyRate: 18.0,
  },
  {
    email: 'server@restaurant.com',
    password: 'Server123!',
    firstName: 'Server',
    lastName: 'Staff',
    phone: '+1234567893',
    employmentType: 'PART_TIME' as EmploymentType,
    department: ['SERVICE'] as Department[],
    roleName: 'STAFF',
    hourlyRate: 15.0,
  },
];

export async function seedEmployees() {
  logger.info('👥 Seeding employees...');

  try {
    for (const config of employeeConfigs) {
      // Find the role
      const role = await prisma.role.findFirst({
        where: { name: config.roleName },
      });

      if (!role) {
        throw new Error(`Role ${config.roleName} not found`);
      }

      // Hash password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(config.password, salt);

      // Create or update employee
      await prisma.employee.upsert({
        where: { email: config.email },
        update: {
          firstName: config.firstName,
          lastName: config.lastName,
          phone: config.phone,
          employmentType: config.employmentType,
          department: config.department,
          hourlyRate: config.hourlyRate,
          roles: {
            deleteMany: {},
            create: [
              {
                roleId: role.id,
              },
            ],
          },
        },
        create: {
          email: config.email,
          password: hashedPassword,
          firstName: config.firstName,
          lastName: config.lastName,
          phone: config.phone,
          birthDate: new Date(),
          startDate: new Date(),
          employmentType: config.employmentType,
          department: config.department,
          hourlyRate: config.hourlyRate,
          roles: {
            create: [
              {
                roleId: role.id,
              },
            ],
          },
        },
      });
    }

    logger.info('👥 Employees seeded successfully');
  } catch (error) {
    logger.error('👥 Error seeding employees:', error);
    throw error;
  }
}
