/**
 * Services barrel export
 * 
 * Exports all service classes and utilities for easy importing
 */

export { 
  WalletService,
  type WalletConnection,
  type WalletServiceConfig,
} from './wallet.service';

export {
  TransactionService,
  type TransactionStatus,
  type Transaction,
} from './transaction.service';

export {
  ProjectService,
  projectService,
  type CreateProjectInput,
  type UpdateProjectInput,
  type ValidationError,
} from './project.service';

export {
  SyncService,
  type SyncServiceConfig,
} from './sync.service';
