/**
 * Unit tests for ContributionRepository
 * 
 * Tests CRUD operations, queries, and aggregation methods for contributions.
 * Validates: Requirements 3.5, 7.4
 */

import { ContributionRepository, ContributionData } from './contribution.repository';
import { supabaseAdmin } from '../supabase/server';

// Mock the Supabase client
jest.mock('../supabase/server', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

describe('ContributionRepository', () => {
  let repository: ContributionRepository;
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockInsert: jest.Mock;
  let mockEq: jest.Mock;
  let mockOrder: jest.Mock;
  let mockLimit: jest.Mock;
  let mockSingle: jest.Mock;

  beforeEach(() => {
    repository = new ContributionRepository();
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Set up mock chain
    mockSingle = jest.fn();
    mockLimit = jest.fn().mockReturnValue({ data: null, error: null });
    mockOrder = jest.fn().mockReturnValue({ 
      limit: mockLimit,
      data: null, 
      error: null 
    });
    mockEq = jest.fn().mockReturnValue({ 
      single: mockSingle,
      order: mockOrder,
      data: null, 
      error: null 
    });
    mockSelect = jest.fn().mockReturnValue({ 
      eq: mockEq,
      single: mockSingle,
      data: null, 
      error: null 
    });
    mockInsert = jest.fn().mockReturnValue({ 
      select: mockSelect,
      data: null, 
      error: null 
    });
    mockFrom = jest.fn().mockReturnValue({
      insert: mockInsert,
      select: mockSelect,
    });
    
    (supabaseAdmin.from as jest.Mock) = mockFrom;
  });

  describe('create', () => {
    const contributionData: ContributionData = {
      projectId: '123e4567-e89b-12d3-a456-426614174000',
      contributorAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      amount: 100000000n,
      txId: '0x1234567890abcdef',
      blockHeight: 12345,
    };

    it('should create a contribution successfully', async () => {
      const mockRow = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        project_id: contributionData.projectId,
        contributor_address: contributionData.contributorAddress,
        amount: 100000000,
        tx_id: contributionData.txId,
        block_height: contributionData.blockHeight,
        created_at: '2024-01-01T00:00:00Z',
      };

      mockSingle.mockResolvedValue({ data: mockRow, error: null });

      const result = await repository.create(contributionData);

      expect(mockFrom).toHaveBeenCalledWith('contributions');
      expect(mockInsert).toHaveBeenCalledWith({
        project_id: contributionData.projectId,
        contributor_address: contributionData.contributorAddress,
        amount: 100000000,
        tx_id: contributionData.txId,
        block_height: contributionData.blockHeight,
      });
      expect(result.id).toBe(mockRow.id);
      expect(result.projectId).toBe(contributionData.projectId);
      expect(result.amount).toBe(100000000n);
    });

    it('should throw error when creation fails', async () => {
      mockSingle.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      await expect(repository.create(contributionData))
        .rejects.toThrow('Failed to create contribution: Database error');
    });

    it('should handle bigint amounts correctly', async () => {
      const largeAmount = 999999999999n;
      const dataWithLargeAmount = {
        ...contributionData,
        amount: largeAmount,
      };

      const mockRow = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        project_id: dataWithLargeAmount.projectId,
        contributor_address: dataWithLargeAmount.contributorAddress,
        amount: 999999999999,
        tx_id: dataWithLargeAmount.txId,
        block_height: dataWithLargeAmount.blockHeight,
        created_at: '2024-01-01T00:00:00Z',
      };

      mockSingle.mockResolvedValue({ data: mockRow, error: null });

      const result = await repository.create(dataWithLargeAmount);

      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        amount: 999999999999,
      }));
      expect(result.amount).toBe(largeAmount);
    });
  });

  describe('findByTxId', () => {
    const txId = '0x1234567890abcdef';

    it('should find contribution by transaction ID', async () => {
      const mockRow = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        contributor_address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        amount: 100000000,
        tx_id: txId,
        block_height: 12345,
        created_at: '2024-01-01T00:00:00Z',
      };

      mockSingle.mockResolvedValue({ data: mockRow, error: null });

      const result = await repository.findByTxId(txId);

      expect(mockFrom).toHaveBeenCalledWith('contributions');
      expect(mockEq).toHaveBeenCalledWith('tx_id', txId);
      expect(result).not.toBeNull();
      expect(result?.txId).toBe(txId);
    });

    it('should return null when contribution not found', async () => {
      mockSingle.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116', message: 'Not found' } 
      });

      const result = await repository.findByTxId(txId);

      expect(result).toBeNull();
    });

    it('should throw error for other database errors', async () => {
      mockSingle.mockResolvedValue({ 
        data: null, 
        error: { code: 'OTHER', message: 'Database error' } 
      });

      await expect(repository.findByTxId(txId))
        .rejects.toThrow('Failed to find contribution: Database error');
    });
  });

  describe('findByProject', () => {
    const projectId = '123e4567-e89b-12d3-a456-426614174000';

    it('should find all contributions for a project', async () => {
      const mockRows = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          project_id: projectId,
          contributor_address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
          amount: 100000000,
          tx_id: '0x1234567890abcdef',
          block_height: 12345,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          project_id: projectId,
          contributor_address: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
          amount: 200000000,
          tx_id: '0xabcdef1234567890',
          block_height: 12346,
          created_at: '2024-01-02T00:00:00Z',
        },
      ];

      mockOrder.mockResolvedValue({ data: mockRows, error: null });

      const result = await repository.findByProject(projectId);

      expect(mockFrom).toHaveBeenCalledWith('contributions');
      expect(mockEq).toHaveBeenCalledWith('project_id', projectId);
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toHaveLength(2);
      expect(result[0].projectId).toBe(projectId);
      expect(result[1].projectId).toBe(projectId);
    });

    it('should apply limit when provided', async () => {
      const mockRows = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          project_id: projectId,
          contributor_address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
          amount: 100000000,
          tx_id: '0x1234567890abcdef',
          block_height: 12345,
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockLimit.mockResolvedValue({ data: mockRows, error: null });

      const result = await repository.findByProject(projectId, 10);

      expect(mockLimit).toHaveBeenCalledWith(10);
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no contributions found', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      const result = await repository.findByProject(projectId);

      expect(result).toEqual([]);
    });

    it('should throw error when query fails', async () => {
      mockOrder.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      await expect(repository.findByProject(projectId))
        .rejects.toThrow('Failed to find contributions by project: Database error');
    });
  });

  describe('findByContributor', () => {
    const contributorAddress = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';

    it('should find all contributions by a contributor', async () => {
      const mockRows = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          project_id: '123e4567-e89b-12d3-a456-426614174000',
          contributor_address: contributorAddress,
          amount: 100000000,
          tx_id: '0x1234567890abcdef',
          block_height: 12345,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          project_id: '123e4567-e89b-12d3-a456-426614174999',
          contributor_address: contributorAddress,
          amount: 200000000,
          tx_id: '0xabcdef1234567890',
          block_height: 12346,
          created_at: '2024-01-02T00:00:00Z',
        },
      ];

      mockOrder.mockResolvedValue({ data: mockRows, error: null });

      const result = await repository.findByContributor(contributorAddress);

      expect(mockFrom).toHaveBeenCalledWith('contributions');
      expect(mockEq).toHaveBeenCalledWith('contributor_address', contributorAddress);
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toHaveLength(2);
      expect(result[0].contributorAddress).toBe(contributorAddress);
      expect(result[1].contributorAddress).toBe(contributorAddress);
    });

    it('should return empty array when contributor has no contributions', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      const result = await repository.findByContributor(contributorAddress);

      expect(result).toEqual([]);
    });

    it('should throw error when query fails', async () => {
      mockOrder.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      await expect(repository.findByContributor(contributorAddress))
        .rejects.toThrow('Failed to find contributions by contributor: Database error');
    });
  });

  describe('getStats', () => {
    const projectId = '123e4567-e89b-12d3-a456-426614174000';

    it('should calculate statistics for project contributions', async () => {
      const mockRows = [
        {
          amount: 100000000,
          contributor_address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        },
        {
          amount: 200000000,
          contributor_address: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
        },
        {
          amount: 150000000,
          contributor_address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', // Same contributor
        },
      ];

      mockEq.mockResolvedValue({ data: mockRows, error: null });

      const result = await repository.getStats(projectId);

      expect(mockFrom).toHaveBeenCalledWith('contributions');
      expect(mockSelect).toHaveBeenCalledWith('amount, contributor_address');
      expect(mockEq).toHaveBeenCalledWith('project_id', projectId);
      
      expect(result.totalRaised).toBe(450000000n);
      expect(result.contributorCount).toBe(2); // Two unique contributors
      expect(result.averageContribution).toBe(150000000n); // 450000000 / 3
      expect(result.largestContribution).toBe(200000000n);
    });

    it('should return zero stats for project with no contributions', async () => {
      mockEq.mockResolvedValue({ data: [], error: null });

      const result = await repository.getStats(projectId);

      expect(result.totalRaised).toBe(0n);
      expect(result.contributorCount).toBe(0);
      expect(result.averageContribution).toBe(0n);
      expect(result.largestContribution).toBe(0n);
    });

    it('should handle single contribution correctly', async () => {
      const mockRows = [
        {
          amount: 100000000,
          contributor_address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        },
      ];

      mockEq.mockResolvedValue({ data: mockRows, error: null });

      const result = await repository.getStats(projectId);

      expect(result.totalRaised).toBe(100000000n);
      expect(result.contributorCount).toBe(1);
      expect(result.averageContribution).toBe(100000000n);
      expect(result.largestContribution).toBe(100000000n);
    });

    it('should handle large amounts correctly', async () => {
      const mockRows = [
        {
          amount: 999999999999,
          contributor_address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        },
        {
          amount: 888888888888,
          contributor_address: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
        },
      ];

      mockEq.mockResolvedValue({ data: mockRows, error: null });

      const result = await repository.getStats(projectId);

      expect(result.totalRaised).toBe(1888888888887n);
      expect(result.largestContribution).toBe(999999999999n);
    });

    it('should throw error when query fails', async () => {
      mockEq.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      await expect(repository.getStats(projectId))
        .rejects.toThrow('Failed to get contribution stats: Database error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle contributions with minimum valid amount', async () => {
      const contributionData: ContributionData = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        contributorAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        amount: 1n,
        txId: '0x1234567890abcdef',
        blockHeight: 12345,
      };

      const mockRow = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        project_id: contributionData.projectId,
        contributor_address: contributionData.contributorAddress,
        amount: 1,
        tx_id: contributionData.txId,
        block_height: contributionData.blockHeight,
        created_at: '2024-01-01T00:00:00Z',
      };

      mockSingle.mockResolvedValue({ data: mockRow, error: null });

      const result = await repository.create(contributionData);

      expect(result.amount).toBe(1n);
    });

    it('should handle contributions with block height 0', async () => {
      const contributionData: ContributionData = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        contributorAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        amount: 100000000n,
        txId: '0x1234567890abcdef',
        blockHeight: 0,
      };

      const mockRow = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        project_id: contributionData.projectId,
        contributor_address: contributionData.contributorAddress,
        amount: 100000000,
        tx_id: contributionData.txId,
        block_height: 0,
        created_at: '2024-01-01T00:00:00Z',
      };

      mockSingle.mockResolvedValue({ data: mockRow, error: null });

      const result = await repository.create(contributionData);

      expect(result.blockHeight).toBe(0);
    });
  });
});
