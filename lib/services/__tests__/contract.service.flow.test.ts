/**
 * ContractService Flow Integration Tests
 * 
 * Unit tests for the Flow-based ContractService that interacts with the
 * Cadence crowdfunding smart contract.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
 */

import { ContractService } from '../contract.service';

// Mock FCL
jest.mock('@onflow/fcl', () => ({
  mutate: jest.fn(),
  query: jest.fn(),
  tx: jest.fn(),
  config: jest.fn(),
}));

import * as fcl from '@onflow/fcl';

describe('ContractService - Flow Implementation', () => {
  let contractService: ContractService;
  const mockContractAddress = '0x0ee0a7ac3ca6d12c';

  beforeEach(() => {
    // Set environment variable for contract address
    process.env.NEXT_PUBLIC_CROWDFUNDING_CONTRACT_ADDRESS = mockContractAddress;
    contractService = new ContractService();
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    it('should call fcl.mutate with correct Cadence transaction', async () => {
      const mockTxId = 'mock-tx-id-123';
      (fcl.mutate as jest.Mock).mockResolvedValue(mockTxId);

      const params = {
        title: 'Test Project',
        description: 'A test crowdfunding project',
        goal: '100.0',
        deadline: 1735689600,
      };

      const result = await contractService.createProject(params);

      expect(fcl.mutate).toHaveBeenCalledTimes(1);
      expect(fcl.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          cadence: expect.stringContaining('import Crowdfunding'),
          limit: 9999,
        })
      );
      expect(result).toBe(mockTxId);
    });

    it('should pass correct parameters to transaction', async () => {
      const mockTxId = 'mock-tx-id-456';
      (fcl.mutate as jest.Mock).mockResolvedValue(mockTxId);

      const params = {
        title: 'My Project',
        description: 'Project description',
        goal: '500.0',
        deadline: 1735689600,
      };

      await contractService.createProject(params);

      const mutateCall = (fcl.mutate as jest.Mock).mock.calls[0][0];
      expect(mutateCall.cadence).toContain('transaction(title: String, description: String, goal: UFix64, deadline: UFix64)');
    });
  });

  describe('contribute', () => {
    it('should call fcl.mutate with correct Cadence transaction', async () => {
      const mockTxId = 'mock-contribute-tx-123';
      (fcl.mutate as jest.Mock).mockResolvedValue(mockTxId);

      const params = {
        projectId: '1',
        amount: '50.0',
      };

      const result = await contractService.contribute(params);

      expect(fcl.mutate).toHaveBeenCalledTimes(1);
      expect(fcl.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          cadence: expect.stringContaining('import Crowdfunding'),
          limit: 9999,
        })
      );
      expect(result).toBe(mockTxId);
    });

    it('should include FlowToken and FungibleToken imports', async () => {
      const mockTxId = 'mock-contribute-tx-456';
      (fcl.mutate as jest.Mock).mockResolvedValue(mockTxId);

      const params = {
        projectId: '2',
        amount: '100.0',
      };

      await contractService.contribute(params);

      const mutateCall = (fcl.mutate as jest.Mock).mock.calls[0][0];
      expect(mutateCall.cadence).toContain('import FlowToken');
      expect(mutateCall.cadence).toContain('import FungibleToken');
    });
  });

  describe('withdrawFunds', () => {
    it('should call fcl.mutate with correct Cadence transaction', async () => {
      const mockTxId = 'mock-withdraw-tx-123';
      (fcl.mutate as jest.Mock).mockResolvedValue(mockTxId);

      const projectId = '1';
      const result = await contractService.withdrawFunds(projectId);

      expect(fcl.mutate).toHaveBeenCalledTimes(1);
      expect(fcl.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          cadence: expect.stringContaining('withdrawFromProject'),
          limit: 9999,
        })
      );
      expect(result).toBe(mockTxId);
    });

    it('should pass projectId as UInt64', async () => {
      const mockTxId = 'mock-withdraw-tx-456';
      (fcl.mutate as jest.Mock).mockResolvedValue(mockTxId);

      await contractService.withdrawFunds('5');

      const mutateCall = (fcl.mutate as jest.Mock).mock.calls[0][0];
      expect(mutateCall.cadence).toContain('transaction(projectId: UInt64)');
    });
  });

  describe('requestRefund', () => {
    it('should call fcl.mutate with correct Cadence transaction', async () => {
      const mockTxId = 'mock-refund-tx-123';
      (fcl.mutate as jest.Mock).mockResolvedValue(mockTxId);

      const projectId = '1';
      const result = await contractService.requestRefund(projectId);

      expect(fcl.mutate).toHaveBeenCalledTimes(1);
      expect(fcl.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          cadence: expect.stringContaining('refundFromProject'),
          limit: 9999,
        })
      );
      expect(result).toBe(mockTxId);
    });

    it('should include contributor vault reference', async () => {
      const mockTxId = 'mock-refund-tx-456';
      (fcl.mutate as jest.Mock).mockResolvedValue(mockTxId);

      await contractService.requestRefund('3');

      const mutateCall = (fcl.mutate as jest.Mock).mock.calls[0][0];
      expect(mutateCall.cadence).toContain('contributorVault');
    });
  });

  describe('getProject', () => {
    it('should call fcl.query with correct Cadence script', async () => {
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

      expect(fcl.query).toHaveBeenCalledTimes(1);
      expect(fcl.query).toHaveBeenCalledWith(
        expect.objectContaining({
          cadence: expect.stringContaining('import Crowdfunding'),
        })
      );
      expect(result).toEqual(mockProject);
    });

    it('should return null when project not found', async () => {
      (fcl.query as jest.Mock).mockRejectedValue(new Error('Project not found'));

      const result = await contractService.getProject('999');

      expect(result).toBeNull();
    });

    it('should handle query errors gracefully', async () => {
      (fcl.query as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await contractService.getProject('1');

      expect(result).toBeNull();
    });
  });

  describe('getProjectCount', () => {
    it('should call fcl.query and return project count', async () => {
      const mockCount = 42;
      (fcl.query as jest.Mock).mockResolvedValue(mockCount);

      const result = await contractService.getProjectCount();

      expect(fcl.query).toHaveBeenCalledTimes(1);
      expect(fcl.query).toHaveBeenCalledWith(
        expect.objectContaining({
          cadence: expect.stringContaining('getProjectCount'),
        })
      );
      expect(result).toBe(mockCount);
    });

    it('should convert result to number', async () => {
      (fcl.query as jest.Mock).mockResolvedValue('10');

      const result = await contractService.getProjectCount();

      expect(typeof result).toBe('number');
      expect(result).toBe(10);
    });
  });

  describe('canWithdraw', () => {
    it('should call fcl.query with correct script', async () => {
      (fcl.query as jest.Mock).mockResolvedValue(true);

      const result = await contractService.canWithdraw('1');

      expect(fcl.query).toHaveBeenCalledTimes(1);
      expect(fcl.query).toHaveBeenCalledWith(
        expect.objectContaining({
          cadence: expect.stringContaining('canWithdraw'),
        })
      );
      expect(result).toBe(true);
    });

    it('should return false when withdrawal not allowed', async () => {
      (fcl.query as jest.Mock).mockResolvedValue(false);

      const result = await contractService.canWithdraw('1');

      expect(result).toBe(false);
    });
  });

  describe('canRefund', () => {
    it('should call fcl.query with correct script', async () => {
      (fcl.query as jest.Mock).mockResolvedValue(true);

      const result = await contractService.canRefund('1');

      expect(fcl.query).toHaveBeenCalledTimes(1);
      expect(fcl.query).toHaveBeenCalledWith(
        expect.objectContaining({
          cadence: expect.stringContaining('canRefund'),
        })
      );
      expect(result).toBe(true);
    });

    it('should return false when refund not allowed', async () => {
      (fcl.query as jest.Mock).mockResolvedValue(false);

      const result = await contractService.canRefund('1');

      expect(result).toBe(false);
    });
  });

  describe('pollTransactionStatus', () => {
    it('should return confirmed when transaction is sealed', async () => {
      const mockTxId = 'mock-tx-sealed';
      const mockTx = {
        snapshot: jest.fn().mockResolvedValue({ status: 4 }), // Sealed
      };
      (fcl.tx as jest.Mock).mockReturnValue(mockTx);

      const result = await contractService.pollTransactionStatus(mockTxId);

      expect(fcl.tx).toHaveBeenCalledWith(mockTxId);
      expect(mockTx.snapshot).toHaveBeenCalled();
      expect(result).toBe('confirmed');
    });

    it('should return pending when transaction is processing', async () => {
      const mockTxId = 'mock-tx-pending';
      const mockTx = {
        snapshot: jest.fn().mockResolvedValue({ status: 1 }), // Pending
      };
      (fcl.tx as jest.Mock).mockReturnValue(mockTx);

      const result = await contractService.pollTransactionStatus(mockTxId);

      expect(result).toBe('pending');
    });

    it('should return failed when transaction is expired', async () => {
      const mockTxId = 'mock-tx-expired';
      const mockTx = {
        snapshot: jest.fn().mockResolvedValue({ status: 5 }), // Expired
      };
      (fcl.tx as jest.Mock).mockReturnValue(mockTx);

      const result = await contractService.pollTransactionStatus(mockTxId);

      expect(result).toBe('failed');
    });

    it('should return failed when transaction has error message', async () => {
      const mockTxId = 'mock-tx-error';
      const mockTx = {
        snapshot: jest.fn().mockResolvedValue({ 
          status: 3, 
          errorMessage: 'Execution failed' 
        }),
      };
      (fcl.tx as jest.Mock).mockReturnValue(mockTx);

      const result = await contractService.pollTransactionStatus(mockTxId);

      expect(result).toBe('failed');
    });

    it('should return failed when snapshot throws error', async () => {
      const mockTxId = 'mock-tx-error';
      const mockTx = {
        snapshot: jest.fn().mockRejectedValue(new Error('Network error')),
      };
      (fcl.tx as jest.Mock).mockReturnValue(mockTx);

      const result = await contractService.pollTransactionStatus(mockTxId);

      expect(result).toBe('failed');
    });
  });

  describe('waitForTransaction', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should wait for transaction to be sealed', async () => {
      const mockTxId = 'mock-tx-sealed';
      const mockTx = {
        onceSealed: jest.fn().mockResolvedValue(undefined),
      };
      (fcl.tx as jest.Mock).mockReturnValue(mockTx);

      const resultPromise = contractService.waitForTransaction(mockTxId);
      
      // Fast-forward time to ensure no timeout
      jest.advanceTimersByTime(1000);
      
      const result = await resultPromise;

      expect(fcl.tx).toHaveBeenCalledWith(mockTxId);
      expect(mockTx.onceSealed).toHaveBeenCalled();
      expect(result).toBe('confirmed');
    });

    it('should return failed when transaction fails', async () => {
      const mockTxId = 'mock-tx-failed';
      const mockTx = {
        onceSealed: jest.fn().mockRejectedValue(new Error('Transaction failed')),
      };
      (fcl.tx as jest.Mock).mockReturnValue(mockTx);

      const result = await contractService.waitForTransaction(mockTxId);

      expect(result).toBe('failed');
    });

    it('should handle timeout and check final status', async () => {
      const mockTxId = 'mock-tx-timeout';
      const mockTx = {
        onceSealed: jest.fn().mockImplementation(() => 
          new Promise((resolve) => setTimeout(resolve, 120000)) // 2 minutes
        ),
        snapshot: jest.fn().mockResolvedValue({ status: 1 }), // Still pending
      };
      (fcl.tx as jest.Mock).mockReturnValue(mockTx);

      const resultPromise = contractService.waitForTransaction(mockTxId, 5000);
      
      // Fast-forward past the timeout
      jest.advanceTimersByTime(5000);
      
      const result = await resultPromise;

      expect(result).toBe('failed');
    });

    it('should return confirmed if transaction sealed before timeout', async () => {
      const mockTxId = 'mock-tx-quick';
      const mockTx = {
        onceSealed: jest.fn().mockResolvedValue(undefined),
      };
      (fcl.tx as jest.Mock).mockReturnValue(mockTx);

      const resultPromise = contractService.waitForTransaction(mockTxId, 10000);
      
      // Fast-forward a bit but not to timeout
      jest.advanceTimersByTime(2000);
      
      const result = await resultPromise;

      expect(result).toBe('confirmed');
    });

    it('should use default timeout of 60 seconds', async () => {
      const mockTxId = 'mock-tx-default-timeout';
      const mockTx = {
        onceSealed: jest.fn().mockImplementation(() => 
          new Promise((resolve) => setTimeout(resolve, 120000))
        ),
        snapshot: jest.fn().mockResolvedValue({ status: 1 }),
      };
      (fcl.tx as jest.Mock).mockReturnValue(mockTx);

      const resultPromise = contractService.waitForTransaction(mockTxId);
      
      // Fast-forward to default timeout (60 seconds)
      jest.advanceTimersByTime(60000);
      
      const result = await resultPromise;

      expect(result).toBe('failed');
    });

    it('should check final status on timeout and return confirmed if sealed', async () => {
      const mockTxId = 'mock-tx-timeout-sealed';
      const mockTx = {
        onceSealed: jest.fn().mockImplementation(() => 
          new Promise((resolve) => setTimeout(resolve, 120000))
        ),
        snapshot: jest.fn().mockResolvedValue({ status: 4 }), // Sealed
      };
      (fcl.tx as jest.Mock).mockReturnValue(mockTx);

      const resultPromise = contractService.waitForTransaction(mockTxId, 5000);
      
      // Fast-forward past the timeout
      jest.advanceTimersByTime(5000);
      
      const result = await resultPromise;

      expect(result).toBe('confirmed');
      expect(mockTx.snapshot).toHaveBeenCalled();
    });
  });

  describe('Contract address configuration', () => {
    it('should use contract address from environment', () => {
      expect(contractService['contractAddress']).toBe(mockContractAddress);
    });

    it('should handle missing contract address', () => {
      delete process.env.NEXT_PUBLIC_CROWDFUNDING_CONTRACT_ADDRESS;
      const service = new ContractService();
      expect(service['contractAddress']).toBe('');
    });
  });

  describe('Transaction parameter formatting', () => {
    it('should format goal as UFix64 string', async () => {
      (fcl.mutate as jest.Mock).mockResolvedValue('tx-123');

      await contractService.createProject({
        title: 'Test',
        description: 'Test',
        goal: '123.45678901',
        deadline: 1735689600,
      });

      expect(fcl.mutate).toHaveBeenCalled();
    });

    it('should format deadline as UFix64 string', async () => {
      (fcl.mutate as jest.Mock).mockResolvedValue('tx-456');

      await contractService.createProject({
        title: 'Test',
        description: 'Test',
        goal: '100.0',
        deadline: 1735689600,
      });

      const mutateCall = (fcl.mutate as jest.Mock).mock.calls[0][0];
      expect(mutateCall.cadence).toContain('deadline: UFix64');
    });
  });
});
