import { OrderService } from '../services/order.service';
import { jest } from '@jest/globals';
import { prisma } from '../prisma/client';
import { redisManager } from '../lib/redis/redis.manager';
import { KitchenService } from '../services/kitchen.service';
import { ProductService } from '../services/product.service';
import { auditLog } from '../lib/logging/logger';
import { OrderDataInput, createWorkflowStepsDataInput } from '../interfaces/order.interface';

jest.mock('../prisma/client');
jest.mock('../lib/redis/redis.manager');
jest.mock('../lib/redis/redis.utils');
jest.mock('./kitchen.service');
jest.mock('./product.service');
jest.mock('../lib/logging/logger');

describe('OrderService', () => {
    let orderService: OrderService;

    beforeEach(() => {
        orderService = new OrderService();
    });

    describe('getOrderProducts', () => {
        it('should return products from cache and database', async () => {
            const productIds = ['product1', 'product2'];
            const cachedProduct = { id: 'product1', name: 'Cached Product' };
            const dbProduct = { id: 'product2', name: 'DB Product' };

            redisManager.get.mockResolvedValueOnce(cachedProduct);
            redisManager.get.mockResolvedValueOnce(null);
            prisma.product.findMany.mockResolvedValueOnce([dbProduct]);
            redisManager.set.mockResolvedValueOnce(null);

            const products = await orderService.getOrderProducts(productIds);

            expect(products).toEqual({
                product1: cachedProduct,
                product2: dbProduct,
            });
        });

        it('should handle errors', async () => {
            const productIds = ['product1'];
            redisManager.get.mockRejectedValueOnce(new Error('Redis error'));

            await expect(orderService.getOrderProducts(productIds)).rejects.toThrow('ValidationError');
        });
    });

    describe('validateOrderData', () => {
        it('should throw MissingParameterError if data is missing', () => {
            expect(() => orderService.validateOrderData(null)).toThrow('MissingParameterError');
        });

        it('should throw ValidationError for invalid order number length', () => {
            const data: OrderDataInput = {
                orderNumber: '',
                customerId: 'valid-uuid',
                type: 'DINE_IN',
                items: [],
            };
            expect(() => orderService.validateOrderData(data)).toThrow('ValidationError');
        });

        it('should throw ValidationError for invalid customer ID', () => {
            const data: OrderDataInput = {
                orderNumber: '12345',
                customerId: 'invalid-uuid',
                type: 'DINE_IN',
                items: [],
            };
            expect(() => orderService.validateOrderData(data)).toThrow('ValidationError');
        });

        it('should throw ValidationError if order type is missing', () => {
            const data: OrderDataInput = {
                orderNumber: '12345',
                customerId: 'valid-uuid',
                type: '',
                items: [],
            };
            expect(() => orderService.validateOrderData(data)).toThrow('ValidationError');
        });
    });

    describe('createWorkflowSteps', () => {
        it('should create workflow steps', async () => {
            const data: createWorkflowStepsDataInput = {
                orderId: 'order1',
                items: [{ productId: 'product1', quantity: 1 }],
            };
            const stations = [{ id: 'station1', seenCategory: ['category1'], isIndependent: false }];
            const product = { id: 'product1', categoryId: 'category1' };

            KitchenService.prototype.getStations.mockResolvedValueOnce(stations);
            ProductService.prototype.getProduct.mockResolvedValueOnce(product);
            prisma.workflowStep.create.mockResolvedValueOnce({ id: 'step1' });

            const steps = await orderService.createWorkflowSteps(data);

            expect(steps).toEqual([{ id: 'step1' }]);
        });

        it('should handle errors', async () => {
            const data: createWorkflowStepsDataInput = {
                orderId: 'order1',
                items: [{ productId: 'product1', quantity: 1 }],
            };
            KitchenService.prototype.getStations.mockRejectedValueOnce(new Error('Kitchen error'));

            await expect(orderService.createWorkflowSteps(data)).rejects.toThrow('ValidationError');
        });
    });

    describe('createOrder', () => {
        it('should create an order', async () => {
            const data: OrderDataInput = {
                orderNumber: '12345',
                customerId: 'valid-uuid',
                type: 'DINE_IN',
                items: [{ productId: 'product1', quantity: 1 }],
            };
            const product = { id: 'product1', price: 10 };
            const order = { id: 'order1', items: [{ id: 'item1' }] };

            orderService.validateOrderData = jest.fn();
            orderService.getOrderProducts = jest.fn().mockResolvedValueOnce({ product1: product });
            prisma.$transaction.mockImplementationOnce(async (callback) => callback(prisma));
            prisma.order.create.mockResolvedValueOnce(order);
            prisma.orderItem.updateMany.mockResolvedValueOnce(null);
            orderService.createWorkflowSteps = jest.fn().mockResolvedValueOnce([]);
            auditLog.mockResolvedValueOnce(null);

            const createdOrder = await orderService.createOrder(data);

            expect(createdOrder).toEqual(order);
        });

        it('should handle errors', async () => {
            const data: OrderDataInput = {
                orderNumber: '12345',
                customerId: 'valid-uuid',
                type: 'DINE_IN',
                items: [{ productId: 'product1', quantity: 1 }],
            };
            orderService.validateOrderData = jest.fn();
            orderService.getOrderProducts = jest.fn().mockRejectedValueOnce(new Error('Product error'));

            await expect(orderService.createOrder(data)).rejects.toThrow('ValidationError');
        });
    });
});