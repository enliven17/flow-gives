/**
 * Sync Service Tests
 * 
 * Unit tests for the sync service.
 * 
 * Requirements: 4.4
 */

import { SyncService, getSyncService } from './sync.service';
import { ContractService } from './contract.service';
import { ProjectRepository } from '../repositories/project.repository';
import { ContributionRepository } from '../repositories/contribution.repository';
import { ContractResult, ContractProject, ContractContribution } from '../contracts/crowdfunding.types';

// Mock dependencies
jest.mock('./contract.service');
jest.mock('../repositories/project.repository');
jest.mock('../repositories/contribution.repository');

describe('SyncService', () => {
  let syncService: SyncService;
  let mockContractService: jest.Mocked<ContractService>;
  let mockProjectRepository: jest.Mocked<ProjectRepository>;
  let mockContributionRepository: jest.Mocked<ContributionRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockContractService = {
      getProject: jest.fn(),
      getProjectStatus: jest.fn(),
      getContribution: jest.fn(),
      getProjectCounter: jest.fn(),
    } as any;

    mockProjectRepository = {} as any;
    mockContributionRepository = {} as any;

    syncService = new SyncService(
      mockContractService,
      mockProjectRepository,
      mockContributionRepository
    );
  });

  describe('syncProject', () => {
    it('should sync project from blockchain to database', async () => {
      const mockProject: ContractProject = {
        creator: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        title: 'Test Project',
        description: 'Test Description',
        goal: BigInt(1000000000),
        deadline: BigInt(1000),
        raised: BigInt(500000000),
        withdrawn: false,
        'created-at': BigInt(100),
      };

      const mockStatus = {
        status: BigInt(0), // active
      };

      mockContractService.getProject.mockResolvedValue({
        success: true,
        value: mockProject,
      });

      mockContractService.getProjectStatus.mockResolvedValue({
        success: true,
        value: mockStatus,
      });

      await syncService.syncProject(BigInt(1));

      expect(mockContractService.getProject).toHaveBeenCalledWith({ projectId: BigInt(1) });
      expect(mockContractService.getProjectStatus).toHaveBeenCalledWith({ projectId: BigInt(1) });
    });

    it('should throw error if project not found on blockchain', async () => {
      mockContractService.getProject.mockResolvedValue({
        success: false,
        error: 102, // PROJECT_NOT_FOUND
        message: 'Project not found',
      });

      await expect(syncService.syncProject(BigInt(999))).rejects.toThrow();
    });
  });

  describe('syncContributions', () => {
    it('should sync contributions for given addresses', async () => {
      const mockContribution: ContractContribution = {
        amount: BigInt(100000000),
        refunded: false,
        'contributed-at': BigInt(200),
      };

      mockContractService.getContribution.mockResolvedValue({
        success: true,
        value: mockContribution,
      });

      await syncService.syncContributions(
        BigInt(1),
        ['ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM']
      );

      expect(mockContractService.getContribution).toHaveBeenCalledWith({
        projectId: BigInt(1),
        contributor: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      });
    });
  });

  describe('syncAllProjects', () => {
    it('should sync all projects from blockchain', async () => {
      const mockProject: ContractProject = {
        creator: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        title: 'Test Project',
        description: 'Test Description',
        goal: BigInt(1000000000),
        deadline: BigInt(1000),
        raised: BigInt(500000000),
        withdrawn: false,
        'created-at': BigInt(100),
      };

      const mockStatus = {
        status: BigInt(0),
      };

      mockContractService.getProjectCounter.mockResolvedValue({
        success: true,
        value: BigInt(2),
      });

      mockContractService.getProject.mockResolvedValue({
        success: true,
        value: mockProject,
      });

      mockContractService.getProjectStatus.mockResolvedValue({
        success: true,
        value: mockStatus,
      });

      const result = await syncService.syncAllProjects();

      expect(result.projectsSynced).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle errors gracefully', async () => {
      mockContractService.getProjectCounter.mockResolvedValue({
        success: true,
        value: BigInt(2),
      });

      mockContractService.getProject
        .mockResolvedValueOnce({
          success: true,
          value: {} as ContractProject,
        })
        .mockResolvedValueOnce({
          success: false,
          error: 102,
          message: 'Project not found',
        });

      mockContractService.getProjectStatus.mockResolvedValue({
        success: true,
        value: { status: BigInt(0) },
      });

      const result = await syncService.syncAllProjects();

      expect(result.projectsSynced).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('resolveConflict', () => {
    it('should return blockchain data as source of truth', () => {
      const blockchainData = { value: 'blockchain' };
      const databaseData = { value: 'database' };

      const resolved = syncService.resolveConflict(blockchainData, databaseData);

      expect(resolved).toBe(blockchainData);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const service1 = getSyncService();
      const service2 = getSyncService();

      expect(service1).toBe(service2);
    });
  });
});
