import { PrismaClient } from '@prisma/client';
import { logger } from '../../lib/logging/logger';

const prisma = new PrismaClient();

async function createSupplierWithProducts(supplier: any) {
  const created = await prisma.supplier.create({
    data: {
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
    },
  });
  return created;
}

export async function seedSuppliers() {
  logger.info('📦 Suppliers suppliers...');
  try {
    const suppliers = [
      {
        name: 'Big Food Co.',
        email: 'bigfood@mail.com',
        phone: '123-456-7890',
        address: '1234 Big Food Lane',
      },
      {
        name: 'Fresh Produce Inc.',
        email: 'freshprod@mail.com',
        phone: '098-765-4321',
        address: '5678 Fresh Produce Blvd',
      },
      {
        name: 'Meat Lovers LLC',
        email: 'meatlover@mail.com',
        phone: '456-789-0123',
        address: '9012 Meat Lovers St',
      },
    ];

    for (const supplier of suppliers) {
      await createSupplierWithProducts(supplier);
    }

    logger.info('📦 Suppliers seeded successfully');
  } catch (error) {
    logger.error('📦 Error seeding suppliers:', error);
    throw error;
  }
}
