import { ItemStatus, OrderPriority, StationType, StepStatus } from '@prisma/client';

export interface StationDataInput {
  name: string;
  type: StationType;
  displayLimit: number;
  currentLoad: number;
  maxCapacity: number;
  isActive: boolean;
  queueItems: QueueItemsDataInput[];
}

export interface QueueItemsDataInput {
  orderId: string;
  stationId: string;
  priority: OrderPriority;
  status: ItemStatus;
  startedAt?: Date;
  completedAt?: Date;
  waitTime: number;
}

export interface WorkflowStepDataInput {
  orderId: string;
  stations: string[];
  stepOrder: number;
  isParallel: boolean;
  status: StepStatus;
  startedAt?: Date;
  completedAt?: Date;
}
