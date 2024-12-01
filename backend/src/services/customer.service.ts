import { prisma } from '../prisma/client';
import { Customer, Employee } from '@prisma/client';
import { logger } from '../lib/logging/logger';

export class CustomerService {
  public async findUser(params: {
    id?: string;
    email?: string;
    phone?: string;
  }): Promise<Customer | Employee | null> {
    try {
      const { id, email, phone } = params;

      if (!id && !email && !phone) {
        throw new Error('At least one search parameter is required');
      }

      const whereClause: any = {
        OR: [],
      };

      if (id) {
        whereClause.OR.push({ id });
      }
      if (email) {
        whereClause.OR.push({ email });
      }
      if (phone) {
        whereClause.OR.push({ phone });
      }

      return await prisma.employee.findFirst({
        where: whereClause,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          status: true,
          department: true,
          roles: {
            select: {
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      logger.error('Error finding user:', error);
      throw error;
    }
  }

  async userExists(params: { id?: string; email?: string; phone?: string }): Promise<boolean> {
    try {
      const user = await this.findUser(params);
      return !!user;
    } catch (error) {
      logger.error('Error checking user existence:', error);
      throw error;
    }
  }
}
