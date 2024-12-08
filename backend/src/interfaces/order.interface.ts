import { OrderItemStatus, OrderStatus, OrderType, Prisma } from '@prisma/client';

export interface OrderDataInput {
  orderNumber: string;
  customerId: string;
  type: OrderType;
  status: OrderStatus;
  items: OrderItemDataInput[];
  totalAmount: number;
  tax: number;
  discount: number;
  deliveryFee?: number;
  tableId: string;
  notes?: string;
}

export interface OrderItemDataInput {
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: Prisma.Decimal;
  modifications: Prisma.JsonValue;
  extraPrice: Prisma.Decimal;
  specialRequest: string | null;
  status: OrderItemStatus;
}

export interface createWorkflowStepsDataInput {
  orderId: string;
  items: OrderItemDataInput[];
}
