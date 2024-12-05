import { PrismaClient } from '@prisma/client';
import { logger } from '../../lib/logging/logger';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seedCustomers() {
  logger.info('👥 Seeding customers...');
  try {
    const customerData = [];
    
    // Create 50 customers
    for (let i = 1; i <= 50; i++) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      customerData.push({
        name: `Customer ${i}`,
        email: `customer${i}@example.com`,
        phone: `+32${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}`,
        password: hashedPassword,
        isVerified: true,
        addresses: {
          create: [{
            streetName: `Street ${i}`,
            houseNumber: String(Math.floor(Math.random() * 100) + 1),
            address: `Street ${i}, ${Math.floor(Math.random() * 100) + 1}`,
            city: 'Brussels',
            postalCode: '1000',
            country: 'Belgium',
            deliveryNotes: 'Ring the bell'
          }]
        },
        loyaltyPoints: Math.floor(Math.random() * 1000),
        preferences: {
          preferredLanguage: 'en',
          dietary: ['None'],
          contactPreference: 'email'
        }
      });
    }

    for (const data of customerData) {
      await prisma.customer.create({
        data
      });
    }

    logger.info('👥 Customers seeded successfully');
  } catch (error) {
    logger.error('Error seeding customers:', error);
    throw error;
  }
}