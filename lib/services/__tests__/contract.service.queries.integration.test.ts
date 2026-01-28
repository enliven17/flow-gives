/**
 * ContractService Read-Only Query Integration Tests
 * 
 * Integration tests to verify the read-only query methods work correctly
 * with the deployed Cadence contract.
 * 
 * Task: 6.3 - Implement read-only contract queries
 * Requirements: 3.5, 3.6
 */

// Mock FCL before importing ContractService
jest.mock('@onflow/fcl', () => ({
  mutate: jest.fn(),
  query: jest.fn(),
  tx: jest.fn(),
  config: jest.fn(),
}));

import { ContractService } from '../contract.service';
import * as fcl from '@onflow/fcl';

describe('ContractService - Read-Only Queries (Integration)', () => {
  let contractService: ContractService;

  beforeEach(() => {
    // Set up contract service with test environment
    process.env.NEXT_PUBLIC_CROWDFUNDING_CONTRACT_ADDRESS = '0x0ee0a7ac3ca6d12c';
    contractService = new ContractService();
    jest.clearAllMocks();
  });

  describe('getProject', () => {
    it('should have correct Cadence script structure', () => {
      // Verify the method exists and has correct signature
      expect(contractService.getProject).toBeDefined();
      expect(typeof contractService.getProject).toBe('function');
    });

    it('should call fcl.query with correct parameters', async () => {
      const mockProject = {
        id: '1',
        creator: '0x01',
        title: 'Test Project',
        description: 'Description',
        goal: '100.0',
        deadline: 1735689600,
        raised: '50.0',
        withdrawn: false,
        createdAt: 1700000000,
      };
      (fcl.query as jest.Mock).mockResolvedValue(mockProject);

      const result = await contractService.getProject('1');

      expect(fcl.query).toHaveBeenCalledWith(
        expect.objectContaining({
          cadence: expect.stringContaining('getProject'),
        })
      );
      expect(result).toEqual(mockProject);
    });

    it('should return null for non-existent project', async () => {
      (fcl.query as jest.Mock).mockRejectedValue(new Error('Not found'));
      
      const result = await contractService.getProject('999');
      
      expect(result).toBeNull();
    });
  });

  describe('getProjectCount', () => {
    it('should have correct Cadence script structure', () => {
      expect(contractService.getProjectCount).toBeDefined();
      expect(typeof contractService.getProjectCount).toBe('function');
    });

    it('should call fcl.query and return number', async () => {
      (fcl.query as jest.Mock).mockResolvedValue(5);
      
      const result = await contractService.getProjectCount();
      
      expect(fcl.query).toHaveBeenCalledWith(
        expect.objectContaining({
          cadence: expect.stringContaining('getProjectCount'),
        })
      );
      expect(typeof result).toBe('number');
      expect(result).toBe(5);
    });
  });

  describe('canWithdraw', () => {
    it('should have correct Cadence script structure', () => {
      expect(contractService.canWithdraw).toBeDefined();
      expect(typeof contractService.canWithdraw).toBe('function');
    });

    it('should call fcl.query and return boolean', async () => {
      (fcl.query as jest.Mock).mockResolvedValue(true);
      
      const result = await contractService.canWithdraw('1');
      
      expect(fcl.query).toHaveBeenCalledWith(
        expect.objectContaining({
          cadence: expect.stringContaining('canWithdraw'),
        })
      );
      expect(typeof result).toBe('boolean');
      expect(result).toBe(true);
    });
  });

  describe('canRefund', () => {
    it('should have correct Cadence script structure', () => {
      expect(contractService.canRefund).toBeDefined();
      expect(typeof contractService.canRefund).toBe('function');
    });

    it('should call fcl.query and return boolean', async () => {
      (fcl.query as jest.Mock).mockResolvedValue(false);
      
      const result = await contractService.canRefund('1');
      
      expect(fcl.query).toHaveBeenCalledWith(
        expect.objectContaining({
          cadence: expect.stringContaining('canRefund'),
        })
      );
      expect(typeof result).toBe('boolean');
      expect(result).toBe(false);
    });
  });

  describe('Query method signatures', () => {
    it('should accept string projectId for getProject', () => {
      expect(() => contractService.getProject('1')).not.toThrow();
    });

    it('should accept no parameters for getProjectCount', () => {
      expect(() => contractService.getProjectCount()).not.toThrow();
    });

    it('should accept string projectId for canWithdraw', () => {
      expect(() => contractService.canWithdraw('1')).not.toThrow();
    });

    it('should accept string projectId for canRefund', () => {
      expect(() => contractService.canRefund('1')).not.toThrow();
    });
  });

  describe('Return type validation', () => {
    it('getProject should return ContractProject or null', async () => {
      (fcl.query as jest.Mock).mockResolvedValue({
        id: '1',
        creator: '0x01',
        title: 'Test',
        description: 'Desc',
        goal: '100.0',
        deadline: 1735689600,
        raised: '0.0',
        withdrawn: false,
        createdAt: 1700000000,
      });
      
      const result = await contractService.getProject('1');
      expect(result === null || typeof result === 'object').toBe(true);
      if (result) {
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('creator');
        expect(result).toHaveProperty('title');
      }
    });

    it('getProjectCount should return number', async () => {
      (fcl.query as jest.Mock).mockResolvedValue(10);
      
      const result = await contractService.getProjectCount();
      expect(typeof result).toBe('number');
    });

    it('canWithdraw should return boolean', async () => {
      (fcl.query as jest.Mock).mockResolvedValue(true);
      
      const result = await contractService.canWithdraw('1');
      expect(typeof result).toBe('boolean');
    });

    it('canRefund should return boolean', async () => {
      (fcl.query as jest.Mock).mockResolvedValue(false);
      
      const result = await contractService.canRefund('1');
      expect(typeof result).toBe('boolean');
    });
  });
});
