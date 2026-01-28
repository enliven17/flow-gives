/**
 * TypeScript type definitions for the StacksGives Crowdfunding Smart Contract
 * 
 * These types map to the Clarity contract data structures and provide
 * type safety when interacting with the contract from the frontend.
 */

/**
 * Project data structure as stored in the smart contract
 */
export interface ContractProject {
  creator: string;              // Principal address of project creator
  title: string;                // Project title (max 100 chars)
  description: string;          // Project description (max 500 chars)
  goal: bigint;                 // Funding goal in USDCx micro-units
  deadline: bigint;             // Deadline in block height
  raised: bigint;               // Amount raised in USDCx micro-units
  withdrawn: boolean;           // Whether funds have been withdrawn
  'created-at': bigint;         // Creation timestamp in block height
}

/**
 * Contribution data structure as stored in the smart contract
 */
export interface ContractContribution {
  amount: bigint;               // Total contribution amount in USDCx micro-units
  refunded: boolean;            // Whether contribution has been refunded
  'contributed-at': bigint;     // First contribution timestamp in block height
}

/**
 * Project status as stored in the smart contract
 */
export interface ContractProjectStatus {
  status: bigint;               // 0 = active, 1 = funded, 2 = expired
}

/**
 * Project status enum for easier handling in TypeScript
 */
export enum ProjectStatus {
  ACTIVE = 0,
  FUNDED = 1,
  EXPIRED = 2,
}

/**
 * Error codes returned by the smart contract
 */
export enum ContractErrorCode {
  UNAUTHORIZED = 100,
  INVALID_PARAMS = 101,
  PROJECT_NOT_FOUND = 102,
  DEADLINE_PASSED = 103,
  GOAL_NOT_MET = 104,
  ALREADY_WITHDRAWN = 105,
  NOT_ELIGIBLE_REFUND = 106,
  ALREADY_REFUNDED = 107,
  TRANSFER_FAILED = 108,
  GOAL_ALREADY_MET = 109,
}

/**
 * Contract function parameters
 */
export interface CreateProjectParams {
  title: string;
  description: string;
  goal: bigint;
  deadline: bigint;
}

export interface ContributeParams {
  projectId: bigint;
  amount: bigint;
}

export interface WithdrawFundsParams {
  projectId: bigint;
}

export interface RequestRefundParams {
  projectId: bigint;
}

export interface GetProjectParams {
  projectId: bigint;
}

export interface GetContributionParams {
  projectId: bigint;
  contributor: string;
}

export interface GetProjectStatusParams {
  projectId: bigint;
}

/**
 * Contract function return types
 */
export interface CreateProjectResult {
  projectId: bigint;
}

export interface ContributeResult {
  success: boolean;
}

export interface WithdrawFundsResult {
  amount: bigint;
}

export interface RequestRefundResult {
  amount: bigint;
}

/**
 * Helper type for contract call results
 */
export type ContractResult<T> = 
  | { success: true; value: T }
  | { success: false; error: ContractErrorCode; message: string };

/**
 * Contract configuration
 */
export interface ContractConfig {
  contractAddress: string;
  contractName: string;
  network: 'mainnet' | 'testnet';
}

/**
 * Default contract configuration for testnet
 */
export const DEFAULT_CONTRACT_CONFIG: ContractConfig = {
  contractAddress: '', // To be filled after deployment
  contractName: 'crowdfunding',
  network: 'testnet',
};

/**
 * Convert block height to approximate timestamp
 * Stacks blocks are approximately 10 minutes apart
 */
export function blockHeightToTimestamp(blockHeight: bigint): Date {
  const STACKS_GENESIS_TIMESTAMP = 1598918400000; // August 31, 2020
  const BLOCK_TIME_MS = 10 * 60 * 1000; // 10 minutes in milliseconds
  const timestamp = STACKS_GENESIS_TIMESTAMP + Number(blockHeight) * BLOCK_TIME_MS;
  return new Date(timestamp);
}

/**
 * Convert timestamp to approximate block height
 */
export function timestampToBlockHeight(timestamp: Date): bigint {
  const STACKS_GENESIS_TIMESTAMP = 1598918400000;
  const BLOCK_TIME_MS = 10 * 60 * 1000;
  const blockHeight = Math.floor((timestamp.getTime() - STACKS_GENESIS_TIMESTAMP) / BLOCK_TIME_MS);
  return BigInt(Math.max(0, blockHeight));
}

/**
 * Convert USDCx micro-units to display units (with 6 decimals)
 */
export function formatUSDCx(microUnits: bigint): string {
  const units = Number(microUnits) / 1_000_000;
  return units.toFixed(2);
}

/**
 * Convert display units to USDCx micro-units
 */
export function parseUSDCx(displayUnits: string): bigint {
  const units = parseFloat(displayUnits);
  return BigInt(Math.floor(units * 1_000_000));
}

/**
 * Validate USDCx amount
 */
export function isValidUSDCxAmount(amount: bigint): boolean {
  return amount > 0n;
}

/**
 * Get human-readable error message for contract error code
 */
export function getContractErrorMessage(errorCode: ContractErrorCode): string {
  switch (errorCode) {
    case ContractErrorCode.UNAUTHORIZED:
      return 'You are not authorized to perform this action';
    case ContractErrorCode.INVALID_PARAMS:
      return 'Invalid parameters provided';
    case ContractErrorCode.PROJECT_NOT_FOUND:
      return 'Project not found';
    case ContractErrorCode.DEADLINE_PASSED:
      return 'Project deadline has passed';
    case ContractErrorCode.GOAL_NOT_MET:
      return 'Funding goal has not been met';
    case ContractErrorCode.ALREADY_WITHDRAWN:
      return 'Funds have already been withdrawn';
    case ContractErrorCode.NOT_ELIGIBLE_REFUND:
      return 'Not eligible for refund';
    case ContractErrorCode.ALREADY_REFUNDED:
      return 'Contribution has already been refunded';
    case ContractErrorCode.TRANSFER_FAILED:
      return 'Token transfer failed';
    case ContractErrorCode.GOAL_ALREADY_MET:
      return 'Project has already reached its goal';
    default:
      return 'Unknown error occurred';
  }
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: ProjectStatus): string {
  switch (status) {
    case ProjectStatus.ACTIVE:
      return 'Active';
    case ProjectStatus.FUNDED:
      return 'Funded';
    case ProjectStatus.EXPIRED:
      return 'Expired';
    default:
      return 'Unknown';
  }
}
