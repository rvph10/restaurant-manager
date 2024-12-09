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
  tableId?: string;
  notes?: string;
}

export interface OrderItemDataInput {
  orderId: string;
  productId: string;
  quantity: number;
  type: string;
  unitPrice: Prisma.Decimal;
  modifications: OrderModificationDataInput;
  extraPrice: Prisma.Decimal;
  specialRequest: string | null;
  status: OrderItemStatus;
}

export interface OrderModificationDataInput {
  orderNumber: string;
  modifications: ModificationDataInput;
}

export interface ModificationDataInput {
  added: AddedItemDataInput[];
  removed: RemovedItemDataInput[];
}

export interface AddedItemDataInput {
  id : string;
  name: string;
  quantity: number;
  price: Prisma.Decimal;
}

export interface RemovedItemDataInput {
  id: string;
  name: string;
  price: Prisma.Decimal;
}

export interface WorkflowStepDataInput {
  name: string;
  quantity: number;
  id: string;
  added: AddedItemDataInput[];
  removed: RemovedItemDataInput[];
}