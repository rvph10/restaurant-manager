import { OrderItemStatus, OrderStatus, OrderType, Prisma, StationType } from '@prisma/client';

export interface OrderDataInput {
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
  productId: string;
  quantity: number;
  unitPrice: Prisma.Decimal;
  modifications: {
    added?: {
      id: string;
      name: string;
      quantity: number;
    }[];
    removed?: {
      id: string;
      name: string;
    }[];
  };
  extraPrice: Prisma.Decimal;
  specialRequest: string | null;
  status: OrderItemStatus;
}

export interface StationDataInput {
  id: string;
  type: StationType;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  icon: string;
  stepOrder: number | null;
  displayLimit: number;
  currentLoad: number;
  seenCategory: string[];
  maxCapacity: number;
  isActive: boolean;
  isIndependent: boolean;
}
export interface WorkflowStepDataInput {
  stationName: string;
  item: StepItemDataInput[];
}

export interface StepItemDataInput {
  name: string;
  quantity: number;
  id: string;
  added?: {
    id: string;
    name: string;
    quantity: number;
  }[];
  removed?: removeDataInput[];
}

export interface removeDataInput {
  id: string;
  name: string;
}
