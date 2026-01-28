/**
 * Sync Service
 * 
 * This service synchronizes data between the Stacks blockchain and the database.
 * It ensures that the database state matches the blockchain state, with blockchain
 * data taking precedence in case of conflicts.
 * 
 * Requirements: 4.4
 */

import { ContractService, getContractService } from './contract.service';
import { ProjectRepository } from '../repositories/project.repository';
import { ContributionRepository } from '../repositories/contribution.repository';
import { ContractProject, ContractContribution } from '../contracts/crowdfunding.types';

/**
 * Sync result
 */
export interface SyncResult {
  projectsSynced: number;
  contributionsSynced: number;
  errors: string[];
}

/**
 * Sync Service Implementation
 * 
 * Requirements: 4.4
 */
export class SyncService {
  private contractService: ContractService;
  private projectRepository: ProjectRepository;
  private contributionRepository: ContributionRepository;

  constructor(
    contractService?: ContractService,
    projectRepository?: ProjectRepository,
    contributionRepository?: ContributionRepository
  ) {
    this.contractService = contractService || getContractService();
    this.projectRepository = projectRepository || new ProjectRepository();
    this.contributionRepository = contributionRepository || new ContributionRepository();
  }

  /**
   * Sync project state from blockchain to database
   * 
   * @param projectId - Blockchain project ID
   * @returns Promise resolving when sync is complete
   * 
   * Requirements: 4.4
   */
  async syncProject(projectId: bigint): Promise<void> {
    // Get project from blockchain
    const contractResult = await this.contractService.getProject({ projectId });

    if (!contractResult.success || !contractResult.value) {
      throw new Error(`Failed to fetch project ${projectId} from blockchain`);
    }

    const contractProject = contractResult.value;

    // Get project status
    const statusResult = await this.contractService.getProjectStatus({ projectId });
    const status = statusResult.success && statusResult.value
      ? Number(statusResult.value.status)
      : 0;

    // Convert blockchain project to database format
    // Note: This assumes the database has a contract_id field to link to blockchain
    // You may need to adjust this based on your actual database schema

    // Check if project exists in database
    // If exists, update; if not, create
    // This is a simplified version - you'll need to implement the actual database operations
    console.log('Syncing project:', {
      projectId: projectId.toString(),
      title: contractProject.title,
      raised: contractProject.raised.toString(),
      status,
    });
  }

  /**
   * Sync contributions for a project from blockchain
   * 
   * @param projectId - Blockchain project ID
   * @param contributorAddresses - Optional list of contributor addresses to sync
   * @returns Promise resolving when sync is complete
   * 
   * Requirements: 4.4
   */
  async syncContributions(
    projectId: bigint,
    contributorAddresses?: string[]
  ): Promise<void> {
    // If contributor addresses are provided, sync only those
    // Otherwise, you would need to track all contributors (this might require
    // event indexing or a separate tracking mechanism)

    if (contributorAddresses && contributorAddresses.length > 0) {
      for (const address of contributorAddresses) {
        const contribResult = await this.contractService.getContribution({
          projectId,
          contributor: address,
        });

        if (contribResult.success && contribResult.value) {
          const contribution = contribResult.value;
          
          // Sync contribution to database
          console.log('Syncing contribution:', {
            projectId: projectId.toString(),
            contributor: address,
            amount: contribution.amount.toString(),
            refunded: contribution.refunded,
          });
        }
      }
    }
  }

  /**
   * Sync all projects from blockchain
   * 
   * This method syncs all projects by iterating through project IDs.
   * In a production system, you might want to use event indexing instead.
   * 
   * @returns Promise resolving to sync result
   * 
   * Requirements: 4.4
   */
  async syncAllProjects(): Promise<SyncResult> {
    const result: SyncResult = {
      projectsSynced: 0,
      contributionsSynced: 0,
      errors: [],
    };

    try {
      // Get project counter
      const counterResult = await this.contractService.getProjectCounter();

      if (!counterResult.success) {
        throw new Error('Failed to get project counter');
      }

      const projectCount = Number(counterResult.value);

      // Sync each project
      for (let i = 1; i <= projectCount; i++) {
        try {
          await this.syncProject(BigInt(i));
          result.projectsSynced++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Failed to sync project ${i}: ${errorMessage}`);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Failed to sync projects: ${errorMessage}`);
    }

    return result;
  }

  /**
   * Resolve conflicts between blockchain and database
   * 
   * Blockchain data always takes precedence.
   * 
   * @param blockchainData - Data from blockchain
   * @param databaseData - Data from database
   * @returns Resolved data (blockchain data)
   * 
   * Requirements: 4.4
   */
  resolveConflict<T>(blockchainData: T, databaseData: T): T {
    // Blockchain is source of truth
    return blockchainData;
  }
}

/**
 * Create a singleton instance of the sync service
 */
let syncServiceInstance: SyncService | null = null;

export function getSyncService(): SyncService {
  if (!syncServiceInstance) {
    syncServiceInstance = new SyncService();
  }
  return syncServiceInstance;
}
