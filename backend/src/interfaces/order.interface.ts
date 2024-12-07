import { OrderItemStatus, OrderStatus, OrderType } from '@prisma/client';

export interface OrderDataInput {
  orderNumber: string;
  customerId: string;
  type: OrderType;
  status: OrderStatus;
  items: OrderItemDataInput;
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
  unitPrice: number;
  modifications: JSON;
  extraPrice: number;
  specialRequest: string;
  status: OrderItemStatus;
}
