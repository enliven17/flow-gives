/**
 * ContributionService - Business logic for contribution processing
 * 
 * This service handles:
 * - Contribution validation and processing
 * - Transaction construction and broadcasting
 * - Recording confirmed contributions
 * - Retrieving contribution data and statistics
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.8
 */

import { 
  contributionRepository, 
  ContributionData,
  ContributionStats 
} from '../repositories/contribution.repository';
import { projectRepository } from '../repositories/project.repository';
import { Contribution } from '../models/project';
import { ProjectStatus } from '../models/project';
import { 
  TransactionService, 
  TransactionResult,
  TransactionStatus 
} from './transaction.service';

/**
 * Result of a contribution operation
 */
export interface ContributionResult {
  txId: string;
  amount: bigint;
  projectId: string;
  contributorAddress: string;
}

/**
 * Input data for recording a confirmed contribution
 */
export interface RecordContributionInput {
  projectId: string;
  contributorAddress: string;
  amount: bigint;
  txId: string;
  blockHeight: number;
  timestamp: Date;
}

/**
 * Configuration for ContributionService
 */
export interface ContributionServiceConfig {
  network: 'mainnet' | 'testnet';
}

/**
 * ContributionService - Manages contribution lifecycle and business logic
 */
export class ContributionService {
  private transactionService: TransactionService;

  constructor(config: ContributionServiceConfig) {
    this.transactionService = new TransactionService({ network: config.network });
  }

  /**
   * Validate contribution amount
   * 
   * @param amount - Contribution amount in micro-USDCx
   * @throws Error if amount is invalid
   * 
   * Requirements: 3.2
   */
  private validateAmount(amount: bigint): void {
    if (amount <= 0n) {
      throw new Error('Contribution amount must be greater than zero');
    }
  }

  /**
   * Validate project is eligible for contributions
   * 
   * @param projectId - Project ID
   * @throws Error if project not found or not active
   * 
   * Requirements: 3.1
   */
  private async validateProject(projectId: string): Promise<void> {
    const project = await projectRepository.findById(projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    if (project.status !== ProjectStatus.ACTIVE) {
      throw new Error('Project is not active and cannot accept contributions');
    }

    // Check if deadline has passed
    const now = new Date();
    if (project.deadline < now) {
      throw new Error('Project deadline has passed');
    }
  }

  /**
   * Create and broadcast a contribution transaction
   * 
   * Validates the contribution, constructs a USDCx transfer transaction,
   * and broadcasts it to the blockchain. Does not wait for confirmation.
   * 
   * @param projectId - Project ID to contribute to
   * @param amount - Contribution amount in micro-USDCx
   * @param contributorAddress - Contributor's wallet address
   * @returns Promise resolving to contribution result with transaction ID
   * @throws Error if validation fails or transaction broadcast fails
   * 
   * Requirements: 3.1, 3.2, 3.3, 3.4
   */
  async contribute(
    projectId: string,
    amount: bigint,
    contributorAddress: string
  ): Promise<ContributionResult> {
    // Validate amount
    this.validateAmount(amount);

    // Validate project is active and accepting contributions
    await this.validateProject(projectId);

    // Get project to retrieve fundraiser address
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Create transaction for USDCx transfer to fundraiser
    const transaction = await this.transactionService.createTransferTransaction(
      project.fundraiserAddress,
      amount,
      contributorAddress,
      `Contribution to project ${projectId}`
    );

    // Sign and broadcast transaction
    const result = await this.transactionService.signAndBroadcast(transaction);

    return {
      txId: result.txId,
      amount,
      projectId,
      contributorAddress,
    };
  }

  /**
   * Record a confirmed contribution in the database
   * 
   * Should be called after a contribution transaction is confirmed on-chain.
   * Updates project funding metrics automatically via database trigger.
   * 
   * @param data - Contribution data to record
   * @returns Promise resolving to created contribution
   * @throws Error if recording fails or duplicate transaction
   * 
   * Requirements: 3.5, 3.6, 3.8
   */
  async recordContribution(data: RecordContributionInput): Promise<Contribution> {
    // Check if contribution already exists (prevent duplicates)
    const existing = await contributionRepository.findByTxId(data.txId);
    if (existing) {
      throw new Error('Contribution already recorded for this transaction');
    }

    // Validate project exists
    const project = await projectRepository.findById(data.projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Ensure user exists in users table (required by foreign key constraint)
    // Dynamic import to prevent client-side bundling
    const { supabaseAdmin } = await import('../supabase/server');
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('wallet_address')
      .eq('wallet_address', data.contributorAddress)
      .single();

    if (!existingUser) {
      // Create user if it doesn't exist
      const { error: userError } = await supabaseAdmin
        .from('users')
        .insert({ wallet_address: data.contributorAddress } as any);

      if (userError) {
        // If user already exists (race condition), that's okay
        if (userError.code === '23505' || userError.message.includes('duplicate') || userError.message.includes('unique')) {
          console.log(`User ${data.contributorAddress} already exists (race condition)`);
        } else {
          console.error('Error creating user:', {
            error: userError.message,
            code: userError.code,
            details: userError.details,
            hint: userError.hint,
          });
          throw new Error(`Failed to create user: ${userError.message}${userError.details ? ` - ${userError.details}` : ''}`);
        }
      } else {
        console.log(`Created user for contributor: ${data.contributorAddress}`);
      }
    }

    // Create contribution record
    const contributionData: ContributionData = {
      projectId: data.projectId,
      contributorAddress: data.contributorAddress,
      amount: data.amount,
      txId: data.txId,
      blockHeight: data.blockHeight,
    };

    const contribution = await contributionRepository.create(contributionData);

    // Note: Project metrics are updated automatically by database trigger
    // See: update_project_metrics() trigger in database schema

    return contribution;
  }

  /**
   * Get contributions for a specific project
   * 
   * Returns contributions ordered by most recent first.
   * 
   * @param projectId - Project ID
   * @param limit - Maximum number of contributions to return (optional)
   * @returns Promise resolving to array of contributions
   * @throws Error if query fails
   * 
   * Requirements: 3.8
   */
  async getProjectContributions(
    projectId: string,
    limit?: number
  ): Promise<Contribution[]> {
    return await contributionRepository.findByProject(projectId, limit);
  }

  /**
   * Get contributions by a specific contributor
   * 
   * Returns all contributions made by a contributor across all projects.
   * 
   * @param address - Contributor wallet address
   * @returns Promise resolving to array of contributions
   * @throws Error if query fails
   * 
   * Requirements: 3.8
   */
  async getContributorContributions(address: string): Promise<Contribution[]> {
    return await contributionRepository.findByContributor(address);
  }

  /**
   * Get contribution statistics for a project
   * 
   * Calculates aggregated statistics including total raised, contributor count,
   * average contribution, and largest contribution.
   * 
   * @param projectId - Project ID
   * @returns Promise resolving to contribution statistics
   * @throws Error if query fails
   * 
   * Requirements: 3.8
   */
  async getContributionStats(projectId: string): Promise<ContributionStats> {
    return await contributionRepository.getStats(projectId);
  }

  /**
   * Wait for contribution transaction confirmation
   * 
   * Polls the blockchain for transaction confirmation and automatically
   * records the contribution once confirmed.
   * 
   * @param contributionResult - Result from contribute() method
   * @param maxAttempts - Maximum polling attempts (default: 60)
   * @returns Promise resolving to recorded contribution
   * @throws Error if confirmation times out or transaction fails
   * 
   * Requirements: 3.4, 3.5
   */
  async waitForConfirmationAndRecord(
    contributionResult: ContributionResult,
    maxAttempts: number = 60
  ): Promise<Contribution> {
    // Wait for transaction confirmation
    const status = await this.transactionService.waitForConfirmation(
      contributionResult.txId,
      maxAttempts
    );

    if (status.status !== 'confirmed') {
      throw new Error(`Transaction failed: ${status.error || 'Unknown error'}`);
    }

    // Get transaction details for block height
    const transaction = await this.transactionService.getTransaction(
      contributionResult.txId
    );

    // Record contribution in database
    const recordData: RecordContributionInput = {
      projectId: contributionResult.projectId,
      contributorAddress: contributionResult.contributorAddress,
      amount: contributionResult.amount,
      txId: contributionResult.txId,
      blockHeight: transaction.blockHeight || 0,
      timestamp: new Date(),
    };

    return await this.recordContribution(recordData);
  }

  /**
   * Get transaction explorer URL
   * 
   * Generates a URL to view the transaction in the Stacks explorer.
   * 
   * @param txId - Transaction ID
   * @returns Explorer URL
   * 
   * Requirements: 8.5
   */
  getExplorerUrl(txId: string): string {
    return this.transactionService.getExplorerUrl(txId);
  }
}

// Export singleton instance for testnet (default for development)
export const contributionService = new ContributionService({ network: 'testnet' });
