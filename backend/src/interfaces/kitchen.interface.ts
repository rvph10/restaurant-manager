import { StationType } from '@prisma/client';

export interface CreateStationInput {
  user: string;
  name: string;
  type: StationType;
  displayLimit: number;
  maxCapacity: number;
  isActive?: boolean;
  isIndependent?: boolean;
}

export interface UpdateStationInput {
  user: string;
  id: string;
  name?: string;
  type?: StationType;
  displayLimit?: number;
  maxCapacity?: number;
  isActive?: boolean;
  isIndependent?: boolean;
}

export interface StationFilters {
  isActive?: boolean;
  type?: StationType;
  isIndependent?: boolean;
}
