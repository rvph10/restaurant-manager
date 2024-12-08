import { StationType } from '@prisma/client';

export interface CreateStationInput {
  icon: string;
  user: string;
  name: string;
  type: StationType;
  displayLimit: number;
  stepOrder: number;
  seenCategory: string[];
  maxCapacity: number;
  isActive?: boolean;
  isIndependent?: boolean;
}

export interface UpdateStationInput {
  icon: string;
  user: string;
  id: string;
  name?: string;
  type?: StationType;
  stepOrder: number;
  displayLimit?: number;
  seenCategory: string[];
  maxCapacity?: number;
  isActive?: boolean;
  isIndependent?: boolean;
}

export interface StationFilters {
  isActive?: boolean;
  type?: StationType;
  isIndependent?: boolean;
}
