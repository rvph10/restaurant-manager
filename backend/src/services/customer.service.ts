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

      // First try to find an employee
      const employee = await prisma.employee.findFirst({
        where: whereClause,
      });

      if (employee) {
        return employee;
      }

      // If no employee is found, try to find a customer
      const customer = await prisma.customer.findFirst({
        where: whereClause,
      });

      return customer;
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
