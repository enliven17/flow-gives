/**
 * Services barrel export
 * 
 * Exports all service classes and utilities for easy importing
 */

export { 
  WalletService,
  formatUSDCx,
  toMicroUSDCx,
  fromMicroUSDCx,
  type WalletConnection,
  type WalletServiceConfig,
} from './wallet.service';

export {
  TransactionService,
  toMicroUSDCx as txToMicroUSDCx,
  fromMicroUSDCx as txFromMicroUSDCx,
  type UnsignedTransaction,
  type TransactionResult,
  type TransactionStatus,
  type Transaction,
  type TransactionServiceConfig,
} from './transaction.service';

export {
  ProjectService,
  projectService,
  type CreateProjectInput,
  type UpdateProjectInput,
  type ValidationError,
} from './project.service';
