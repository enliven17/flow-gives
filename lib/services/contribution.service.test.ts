/**
 * ContributionService Tests
 * 
 * Tests for contribution business logic including:
 * - Contribution validation
 * - Transaction construction and broadcasting
 * - Recording confirmed contributions
 * - Retrieving contributions and statistics
 */

import { ContributionService, ContributionResult, RecordContributionInput } from './contribution.service';
import { contributionRepository, ContributionData } from '../repositories/contribution.repository';
import { projectRepository } from '../repositories/project.repository';
import { TransactionService, TransactionResult, TransactionStatus, Transaction } from './transaction.service';
import { Project, ProjectStatus, Contribution } from '../models/project';

// Mock dependencies
jest.mock('../repositories/contribution.repository', () => ({
  contributionRepository: {
    create: jest.fn(),
    findByTxId: jest.fn(),
    findByProject: jest.fn(),
    findByContributor: jest.fn(),
    getStats: jest.fn(),
  },
}));

jest.mock('../repositories/project.repository', () => ({
  projectRepository: {
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    find: jest.fn(),
    updateStatus: jest.fn(),
    updateMetrics: jest.fn(),
  },
}));

jest.mock('./transaction.service');

describe('ContributionService', () => {
  let service: ContributionService;
  let mockTransactionService: jest.Mocked<TransactionService>;

  // Sample test data
  const mockProject: Project = {
    id: 'project-1',
    title: 'Test Project',
    description: 'A test project for contributions',
    fundingGoal: 10000000000n, // 10,000 USDCx
    totalRaised: 1000000000n, // 1,000 USDCx
    contributorCount: 5,
    fundraiserAddress: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
    status: ProjectStatus.ACTIVE,
    deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    percentFunded: 10,
    timeRemaining: 365 * 24 * 60 * 60 * 1000,
    isActive: true,
    isFunded: false,
    isExpired: false,
  };

  const mockContribution: Contribution = {
    id: 'contribution-1',
    projectId: 'project-1',
    contributorAddress: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
    amount: 500000000n, // 500 USDCx
    txId: '0x1234567890abcdef',
    blockHeight: 12345,
    createdAt: new Date('2024-01-15'),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create service instance
    service = new ContributionService({ network: 'testnet' });

    // Get mocked transaction service instance
    mockTransactionService = (service as any).transactionService as jest.Mocked<TransactionService>;
  });

  describe('contribute', () => {
    it('should successfully create and broadcast a contribution transaction', async () => {
      // Mock project repository
      (projectRepository.findById as jest.Mock).mockResolvedValue(mockProject);

      // Mock transaction service
      const mockTransaction = {
        contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        contractName: 'usdcx-token',
        functionName: 'transfer',
        functionArgs: [],
        network: 'testnet' as const,
        senderAddress: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
        amount: 500000000n,
        recipient: mockProject.fundraiserAddress,
      };

      const mockTxResult: TransactionResult = {
        txId: '0x1234567890abcdef',
        txRaw: '0xabcdef',
      };

      mockTransactionService.createTransferTransaction.mockResolvedValue(mockTransaction);
      mockTransactionService.signAndBroadcast.mockResolvedValue(mockTxResult);

      // Execute contribution
      const result = await service.contribute(
        'project-1',
        500000000n,
        'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE'
      );

      // Verify result
      expect(result).toEqual({
        txId: '0x1234567890abcdef',
        amount: 500000000n,
        projectId: 'project-1',
        contributorAddress: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      });

      // Verify transaction service was called correctly
      expect(mockTransactionService.createTransferTransaction).toHaveBeenCalledWith(
        mockProject.fundraiserAddress,
        500000000n,
        'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
        'Contribution to project project-1'
      );
      expect(mockTransactionService.signAndBroadcast).toHaveBeenCalledWith(mockTransaction);
    });

    it('should reject contribution with zero amount', async () => {
      await expect(
        service.contribute('project-1', 0n, 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE')
      ).rejects.toThrow('Contribution amount must be greater than zero');
    });

    it('should reject contribution with negative amount', async () => {
      await expect(
        service.contribute('project-1', -100n, 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE')
      ).rejects.toThrow('Contribution amount must be greater than zero');
    });

    it('should reject contribution to non-existent project', async () => {
      (projectRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.contribute('nonexistent', 500000000n, 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE')
      ).rejects.toThrow('Project not found');
    });

    it('should reject contribution to inactive project', async () => {
      const inactiveProject = { ...mockProject, status: ProjectStatus.DRAFT };
      (projectRepository.findById as jest.Mock).mockResolvedValue(inactiveProject);

      await expect(
        service.contribute('project-1', 500000000n, 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE')
      ).rejects.toThrow('Project is not active and cannot accept contributions');
    });

    it('should reject contribution to funded project', async () => {
      const fundedProject = { ...mockProject, status: ProjectStatus.FUNDED };
      (projectRepository.findById as jest.Mock).mockResolvedValue(fundedProject);

      await expect(
        service.contribute('project-1', 500000000n, 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE')
      ).rejects.toThrow('Project is not active and cannot accept contributions');
    });

    it('should reject contribution to expired project', async () => {
      const expiredProject = { 
        ...mockProject, 
        deadline: new Date('2020-01-01') // Past deadline
      };
      (projectRepository.findById as jest.Mock).mockResolvedValue(expiredProject);

      await expect(
        service.contribute('project-1', 500000000n, 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE')
      ).rejects.toThrow('Project deadline has passed');
    });
  });

  describe('recordContribution', () => {
    it('should successfully record a confirmed contribution', async () => {
      // Mock repository methods
      (contributionRepository.findByTxId as jest.Mock).mockResolvedValue(null);
      (projectRepository.findById as jest.Mock).mockResolvedValue(mockProject);
      (contributionRepository.create as jest.Mock).mockResolvedValue(mockContribution);

      const input: RecordContributionInput = {
        projectId: 'project-1',
        contributorAddress: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
        amount: 500000000n,
        txId: '0x1234567890abcdef',
        blockHeight: 12345,
        timestamp: new Date('2024-01-15'),
      };

      const result = await service.recordContribution(input);

      expect(result).toEqual(mockContribution);
      expect(contributionRepository.create).toHaveBeenCalledWith({
        projectId: 'project-1',
        contributorAddress: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
        amount: 500000000n,
        txId: '0x1234567890abcdef',
        blockHeight: 12345,
      });
    });

    it('should reject duplicate contribution (same transaction ID)', async () => {
      // Mock existing contribution
      (contributionRepository.findByTxId as jest.Mock).mockResolvedValue(mockContribution);

      const input: RecordContributionInput = {
        projectId: 'project-1',
        contributorAddress: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
        amount: 500000000n,
        txId: '0x1234567890abcdef',
        blockHeight: 12345,
        timestamp: new Date('2024-01-15'),
      };

      await expect(service.recordContribution(input)).rejects.toThrow(
        'Contribution already recorded for this transaction'
      );
    });

    it('should reject contribution for non-existent project', async () => {
      (contributionRepository.findByTxId as jest.Mock).mockResolvedValue(null);
      (projectRepository.findById as jest.Mock).mockResolvedValue(null);

      const input: RecordContributionInput = {
        projectId: 'nonexistent',
        contributorAddress: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
        amount: 500000000n,
        txId: '0x1234567890abcdef',
        blockHeight: 12345,
        timestamp: new Date('2024-01-15'),
      };

      await expect(service.recordContribution(input)).rejects.toThrow('Project not found');
    });
  });

  describe('getProjectContributions', () => {
    it('should retrieve contributions for a project', async () => {
      const contributions = [mockContribution];
      (contributionRepository.findByProject as jest.Mock).mockResolvedValue(contributions);

      const result = await service.getProjectContributions('project-1');

      expect(result).toEqual(contributions);
      expect(contributionRepository.findByProject).toHaveBeenCalledWith('project-1', undefined);
    });

    it('should retrieve limited contributions for a project', async () => {
      const contributions = [mockContribution];
      (contributionRepository.findByProject as jest.Mock).mockResolvedValue(contributions);

      const result = await service.getProjectContributions('project-1', 10);

      expect(result).toEqual(contributions);
      expect(contributionRepository.findByProject).toHaveBeenCalledWith('project-1', 10);
    });

    it('should return empty array for project with no contributions', async () => {
      (contributionRepository.findByProject as jest.Mock).mockResolvedValue([]);

      const result = await service.getProjectContributions('project-1');

      expect(result).toEqual([]);
    });
  });

  describe('getContributorContributions', () => {
    it('should retrieve contributions by a contributor', async () => {
      const contributions = [mockContribution];
      (contributionRepository.findByContributor as jest.Mock).mockResolvedValue(contributions);

      const result = await service.getContributorContributions(
        'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE'
      );

      expect(result).toEqual(contributions);
      expect(contributionRepository.findByContributor).toHaveBeenCalledWith(
        'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE'
      );
    });

    it('should return empty array for contributor with no contributions', async () => {
      (contributionRepository.findByContributor as jest.Mock).mockResolvedValue([]);

      const result = await service.getContributorContributions(
        'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE'
      );

      expect(result).toEqual([]);
    });
  });

  describe('getContributionStats', () => {
    it('should retrieve contribution statistics for a project', async () => {
      const stats = {
        totalRaised: 5000000000n,
        contributorCount: 10,
        averageContribution: 500000000n,
        largestContribution: 1000000000n,
      };
      (contributionRepository.getStats as jest.Mock).mockResolvedValue(stats);

      const result = await service.getContributionStats('project-1');

      expect(result).toEqual(stats);
      expect(contributionRepository.getStats).toHaveBeenCalledWith('project-1');
    });

    it('should return zero stats for project with no contributions', async () => {
      const emptyStats = {
        totalRaised: 0n,
        contributorCount: 0,
        averageContribution: 0n,
        largestContribution: 0n,
      };
      (contributionRepository.getStats as jest.Mock).mockResolvedValue(emptyStats);

      const result = await service.getContributionStats('project-1');

      expect(result).toEqual(emptyStats);
    });
  });

  describe('waitForConfirmationAndRecord', () => {
    it('should wait for confirmation and record contribution', async () => {
      const contributionResult: ContributionResult = {
        txId: '0x1234567890abcdef',
        amount: 500000000n,
        projectId: 'project-1',
        contributorAddress: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      };

      const txStatus: TransactionStatus = {
        txId: '0x1234567890abcdef',
        status: 'confirmed',
        blockHeight: 12345,
      };

      const transaction: Transaction = {
        txId: '0x1234567890abcdef',
        txStatus: 'success',
        txType: 'contract_call',
        fee: '1000',
        senderAddress: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
        blockHeight: 12345,
      };

      mockTransactionService.waitForConfirmation.mockResolvedValue(txStatus);
      mockTransactionService.getTransaction.mockResolvedValue(transaction);
      (contributionRepository.findByTxId as jest.Mock).mockResolvedValue(null);
      (projectRepository.findById as jest.Mock).mockResolvedValue(mockProject);
      (contributionRepository.create as jest.Mock).mockResolvedValue(mockContribution);

      const result = await service.waitForConfirmationAndRecord(contributionResult);

      expect(result).toEqual(mockContribution);
      expect(mockTransactionService.waitForConfirmation).toHaveBeenCalledWith(
        '0x1234567890abcdef',
        60
      );
      expect(mockTransactionService.getTransaction).toHaveBeenCalledWith('0x1234567890abcdef');
    });

    it('should throw error if transaction fails', async () => {
      const contributionResult: ContributionResult = {
        txId: '0x1234567890abcdef',
        amount: 500000000n,
        projectId: 'project-1',
        contributorAddress: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      };

      const txStatus: TransactionStatus = {
        txId: '0x1234567890abcdef',
        status: 'failed',
        error: 'Insufficient balance',
      };

      mockTransactionService.waitForConfirmation.mockResolvedValue(txStatus);

      await expect(
        service.waitForConfirmationAndRecord(contributionResult)
      ).rejects.toThrow('Transaction failed: Insufficient balance');
    });

    it('should use custom max attempts', async () => {
      const contributionResult: ContributionResult = {
        txId: '0x1234567890abcdef',
        amount: 500000000n,
        projectId: 'project-1',
        contributorAddress: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      };

      const txStatus: TransactionStatus = {
        txId: '0x1234567890abcdef',
        status: 'confirmed',
        blockHeight: 12345,
      };

      const transaction: Transaction = {
        txId: '0x1234567890abcdef',
        txStatus: 'success',
        txType: 'contract_call',
        fee: '1000',
        senderAddress: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
        blockHeight: 12345,
      };

      mockTransactionService.waitForConfirmation.mockResolvedValue(txStatus);
      mockTransactionService.getTransaction.mockResolvedValue(transaction);
      (contributionRepository.findByTxId as jest.Mock).mockResolvedValue(null);
      (projectRepository.findById as jest.Mock).mockResolvedValue(mockProject);
      (contributionRepository.create as jest.Mock).mockResolvedValue(mockContribution);

      await service.waitForConfirmationAndRecord(contributionResult, 30);

      expect(mockTransactionService.waitForConfirmation).toHaveBeenCalledWith(
        '0x1234567890abcdef',
        30
      );
    });
  });

  describe('getExplorerUrl', () => {
    it('should return correct explorer URL', () => {
      mockTransactionService.getExplorerUrl.mockReturnValue(
        'https://testnet.flowscan.org/transaction/0x1234567890abcdef'
      );

      const url = service.getExplorerUrl('0x1234567890abcdef');

      expect(url).toBe('https://testnet.flowscan.org/transaction/0x1234567890abcdef');
      expect(mockTransactionService.getExplorerUrl).toHaveBeenCalledWith('0x1234567890abcdef');
    });
  });
});
