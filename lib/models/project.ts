/**
 * Project and Contribution data models for StacksGives crowdfunding platform
 * 
 * These interfaces define the structure of project and contribution data,
 * including computed properties for funding metrics and status checks.
 */

import { calculateFundingPercentage, calculateTimeRemaining } from '../utils/format';

/**
 * Enum representing the possible states of a crowdfunding project
 */
export enum ProjectStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  FUNDED = 'funded',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

/**
 * Interface representing a crowdfunding project
 * 
 * Validates: Requirements 2.1, 3.8
 */
export interface Project {
  // Core fields
  id: string;
  title: string;
  description: string;
  fundingGoal: bigint;
  totalRaised: bigint;
  contributorCount: number;
  fundraiserAddress: string;
  status: ProjectStatus;
  deadline: Date;
  imageUrl?: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  
  // Computed properties
  /**
   * Percentage of funding goal achieved (0-100+)
   * Calculated as: (totalRaised / fundingGoal) * 100
   */
  percentFunded: number;
  
  /**
   * Time remaining until deadline in milliseconds
   * Positive if deadline is in the future, negative if past
   */
  timeRemaining: number;
  
  /**
   * Whether the project is currently active and accepting contributions
   */
  isActive: boolean;
  
  /**
   * Whether the project has reached its funding goal
   */
  isFunded: boolean;
  
  /**
   * Whether the project deadline has passed
   */
  isExpired: boolean;
}

/**
 * Interface representing a contribution to a project
 * 
 * Validates: Requirements 3.8
 */
export interface Contribution {
  // Core fields
  id: string;
  projectId: string;
  contributorAddress: string;
  amount: bigint;
  txId: string;
  blockHeight: number;
  createdAt: Date;
  
  // Optional relations
  project?: Project;
}

/**
 * Helper function to create a Project with computed properties
 * 
 * @param data - Raw project data from database
 * @returns Project with computed properties
 */
export function createProject(data: {
  id: string;
  title: string;
  description: string;
  fundingGoal: bigint;
  totalRaised: bigint;
  contributorCount: number;
  fundraiserAddress: string;
  status: ProjectStatus;
  deadline: Date;
  imageUrl?: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}): Project {
  const now = new Date();
  const percentFunded = calculateFundingPercentage(data.totalRaised, data.fundingGoal);
  const timeRemaining = calculateTimeRemaining(data.deadline, now);
  const isActive = data.status === ProjectStatus.ACTIVE;
  const isFunded = data.status === ProjectStatus.FUNDED || data.totalRaised >= data.fundingGoal;
  const isExpired = data.status === ProjectStatus.EXPIRED || (timeRemaining < 0 && !isFunded);
  
  return {
    ...data,
    percentFunded,
    timeRemaining,
    isActive,
    isFunded,
    isExpired,
  };
}

/**
 * Helper function to create a Contribution from database data
 * 
 * @param data - Raw contribution data from database
 * @returns Contribution object
 */
export function createContribution(data: {
  id: string;
  projectId: string;
  contributorAddress: string;
  amount: bigint;
  txId: string;
  blockHeight: number;
  createdAt: Date;
  project?: Project;
}): Contribution {
  return {
    ...data,
  };
}
