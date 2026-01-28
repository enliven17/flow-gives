/**
 * Unit tests for TransactionService - Flow Blockchain
 * 
 * Tests transaction lifecycle management including creation, status updates,
 * polling, and query methods.
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */

import { TransactionService, TransactionType, TransactionStatus } from '../transaction.service';
import * as fcl from '@onflow/fcl';

// Mock @onflow/fcl
jest.mock('@onflow/fcl', () => ({
  tx: jest.fn(),
}));

// Mock supabaseAdmin
jest.mock('../../supabase/server', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

import { supabaseAdmin } from '../../supabase/server';

describe('TransactionService', () => {
  let transactionService: TransactionService;
  const mockTxId = '0x1234567890abcdef';
  const mockWalletAddress = '0x1234567890abcdef';
  const mockProjectId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    jest.clearAllMocks();
    transactionService = new TransactionService();
  });

  describe('createTransaction', () => {
    it('should create a transaction record with pending status', async () => {
      const mockData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        tx_id: mockTxId,
        tx_type: 'create_project',
        wallet_address: mockWalletAddress,
        project_id: mockProjectId,
        status: 'pending',
        error_message: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      });

      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await transactionService.createTransaction(
        mockTxId,
        'create_project',
        mockWalletAddress,
        mockProjectId
      );

      expect(supabaseAdmin.from).toHaveBeenCalledWith('transactions');
      expect(mockInsert).toHaveBeenCalledWith({
        tx_id: mockTxId,
        tx_type: 'create_project',
        wallet_address: mockWalletAddress,
        project_id: mockProjectId,
        status: 'pending',
      });

      expect(result).toMatchObject({
        txId: mockTxId,
        type: 'create_project',
        walletAddress: mockWalletAddress,
        projectId: mockProjectId,
        status: 'pending',
      });
    });

    it('should create transaction without project ID', async () => {
      const mockData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        tx_id: mockTxId,
        tx_type: 'contribute',
        wallet_address: mockWalletAddress,
        project_id: null,
        status: 'pending',
        error_message: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      });

      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await transactionService.createTransaction(
        mockTxId,
        'contribute',
        mockWalletAddress
      );

      expect(result.projectId).toBeNull();
    });

    it('should throw error when database insert fails', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error'),
          }),
        }),
      });

      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      await expect(
        transactionService.createTransaction(
          mockTxId,
          'create_project',
          mockWalletAddress
        )
      ).rejects.toThrow('Database error');
    });

    it('should handle all transaction types', async () => {
      const types: TransactionType[] = ['create_project', 'contribute', 'withdraw', 'refund'];

      for (const type of types) {
        const mockData = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          tx_id: mockTxId,
          tx_type: type,
          wallet_address: mockWalletAddress,
          project_id: null,
          status: 'pending',
          error_message: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const mockInsert = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
          }),
        });

        (supabaseAdmin.from as jest.Mock).mockReturnValue({
          insert: mockInsert,
        });

        const result = await transactionService.createTransaction(
          mockTxId,
          type,
          mockWalletAddress
        );

        expect(result.type).toBe(type);
      }
    });
  });

  describe('updateTransactionStatus', () => {
    it('should update transaction status to confirmed', async () => {
      const mockData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        tx_id: mockTxId,
        tx_type: 'create_project',
        wallet_address: mockWalletAddress,
        project_id: mockProjectId,
        status: 'confirmed',
        error_message: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      });

      (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
        if (table === 'transactions') {
          return {
            update: mockUpdate,
            select: mockSelect,
          };
        }
      });

      await transactionService.updateTransactionStatus(mockTxId, 'confirmed');

      expect(supabaseAdmin.from).toHaveBeenCalledWith('transactions');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'confirmed',
          updated_at: expect.any(String),
        })
      );
    });

    it('should update transaction status to failed with error message', async () => {
      const errorMessage = 'Transaction execution failed';
      const mockData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        tx_id: mockTxId,
        tx_type: 'create_project',
        wallet_address: mockWalletAddress,
        project_id: mockProjectId,
        status: 'failed',
        error_message: errorMessage,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      });

      (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
        if (table === 'transactions') {
          return {
            update: mockUpdate,
            select: mockSelect,
          };
        }
      });

      await transactionService.updateTransactionStatus(
        mockTxId,
        'failed',
        errorMessage
      );

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          error_message: errorMessage,
          updated_at: expect.any(String),
        })
      );
    });

    it('should throw error when database update fails', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: new Error('Update failed') }),
      });

      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      await expect(
        transactionService.updateTransactionStatus(mockTxId, 'confirmed')
      ).rejects.toThrow('Update failed');
    });

    it('should handle all status types', async () => {
      const statuses: TransactionStatus[] = ['pending', 'confirmed', 'failed'];

      for (const status of statuses) {
        const mockData = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          tx_id: mockTxId,
          tx_type: 'create_project',
          wallet_address: mockWalletAddress,
          project_id: mockProjectId,
          status,
          error_message: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const mockUpdate = jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        });

        const mockSelect = jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
          }),
        });

        (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
          if (table === 'transactions') {
            return {
              update: mockUpdate,
              select: mockSelect,
            };
          }
        });

        await transactionService.updateTransactionStatus(mockTxId, status);

        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            status,
          })
        );
      }
    });
  });

  describe('pollTransactionStatus', () => {
    it('should return confirmed when transaction is sealed', async () => {
      const mockSnapshot = jest.fn().mockResolvedValue({ status: 4 }); // SEALED
      (fcl.tx as jest.Mock).mockReturnValue({ snapshot: mockSnapshot });

      const status = await transactionService.pollTransactionStatus(mockTxId);

      expect(status).toBe('confirmed');
      expect(fcl.tx).toHaveBeenCalledWith(mockTxId);
    });

    it('should return failed when transaction is expired', async () => {
      const mockSnapshot = jest.fn().mockResolvedValue({ status: 5 }); // EXPIRED
      (fcl.tx as jest.Mock).mockReturnValue({ snapshot: mockSnapshot });

      const status = await transactionService.pollTransactionStatus(mockTxId);

      expect(status).toBe('failed');
    });

    it('should return pending when transaction is not finalized', async () => {
      const mockSnapshot = jest.fn().mockResolvedValue({ status: 2 }); // PENDING
      (fcl.tx as jest.Mock).mockReturnValue({ snapshot: mockSnapshot });

      const status = await transactionService.pollTransactionStatus(mockTxId);

      expect(status).toBe('pending');
    });

    it('should return failed when snapshot throws error', async () => {
      const mockSnapshot = jest.fn().mockRejectedValue(new Error('Network error'));
      (fcl.tx as jest.Mock).mockReturnValue({ snapshot: mockSnapshot });

      const status = await transactionService.pollTransactionStatus(mockTxId);

      expect(status).toBe('failed');
    });
  });

  describe('waitForTransaction', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should wait for transaction confirmation with exponential backoff', async () => {
      let callCount = 0;
      const mockSnapshot = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.resolve({ status: 2 }); // PENDING
        }
        return Promise.resolve({ status: 4 }); // SEALED
      });

      (fcl.tx as jest.Mock).mockReturnValue({ snapshot: mockSnapshot });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ 
            data: {
              id: '123',
              tx_id: mockTxId,
              tx_type: 'create_project',
              wallet_address: mockWalletAddress,
              status: 'confirmed',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, 
            error: null 
          }),
        }),
      });

      (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
        if (table === 'transactions') {
          return {
            update: mockUpdate,
            select: mockSelect,
          };
        }
      });

      const promise = transactionService.waitForTransaction(mockTxId);

      // First poll at 1 second
      await jest.advanceTimersByTimeAsync(1000);
      // Second poll at 2 seconds (exponential backoff)
      await jest.advanceTimersByTimeAsync(2000);

      const status = await promise;

      expect(status).toBe('confirmed');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'confirmed',
        })
      );
    });

    it('should use exponential backoff with max delay cap', async () => {
      const mockSnapshot = jest.fn().mockResolvedValue({ status: 2 }); // Always PENDING
      (fcl.tx as jest.Mock).mockReturnValue({ snapshot: mockSnapshot });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ 
            data: {
              id: '123',
              tx_id: mockTxId,
              tx_type: 'create_project',
              wallet_address: mockWalletAddress,
              status: 'failed',
              error_message: 'Timeout',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, 
            error: null 
          }),
        }),
      });

      (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
        if (table === 'transactions') {
          return {
            update: mockUpdate,
            select: mockSelect,
          };
        }
      });

      const promise = transactionService.waitForTransaction(mockTxId, 20000);

      // Advance through multiple backoff intervals
      // 1s, 2s, 4s, 8s, 8s (capped at max)
      for (let i = 0; i < 5; i++) {
        await jest.advanceTimersByTimeAsync(10000);
      }

      await promise;

      // Verify exponential backoff pattern exists
      expect(mockSnapshot).toHaveBeenCalled();
    });

    it('should timeout after specified duration', async () => {
      let callCount = 0;
      const mockSnapshot = jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({ status: 2 }); // Always PENDING
      });
      
      (fcl.tx as jest.Mock).mockReturnValue({ snapshot: mockSnapshot });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ 
            data: {
              id: '123',
              tx_id: mockTxId,
              tx_type: 'create_project',
              wallet_address: mockWalletAddress,
              status: 'failed',
              error_message: 'Timeout',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, 
            error: null 
          }),
        }),
      });

      (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
        if (table === 'transactions') {
          return {
            update: mockUpdate,
            select: mockSelect,
          };
        }
      });

      const promise = transactionService.waitForTransaction(mockTxId, 100); // Short timeout

      // Run all timers to completion
      await jest.runAllTimersAsync();

      const status = await promise;

      expect(status).toBe('failed');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          error_message: 'Timeout',
        })
      );
    });

    it('should return failed status immediately', async () => {
      const mockSnapshot = jest.fn().mockResolvedValue({ status: 5 }); // EXPIRED
      (fcl.tx as jest.Mock).mockReturnValue({ snapshot: mockSnapshot });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ 
            data: {
              id: '123',
              tx_id: mockTxId,
              tx_type: 'create_project',
              wallet_address: mockWalletAddress,
              status: 'failed',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, 
            error: null 
          }),
        }),
      });

      (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
        if (table === 'transactions') {
          return {
            update: mockUpdate,
            select: mockSelect,
          };
        }
      });

      const promise = transactionService.waitForTransaction(mockTxId);

      await jest.advanceTimersByTimeAsync(0);

      const status = await promise;

      expect(status).toBe('failed');
    });
  });

  describe('pollAndUpdateStatus', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should poll and update status when transaction confirms', async () => {
      let callCount = 0;
      const mockSnapshot = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 2) {
          return Promise.resolve({ status: 2 }); // PENDING
        }
        return Promise.resolve({ status: 4 }); // SEALED
      });

      (fcl.tx as jest.Mock).mockReturnValue({ snapshot: mockSnapshot });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ 
            data: {
              id: '123',
              tx_id: mockTxId,
              tx_type: 'create_project',
              wallet_address: mockWalletAddress,
              status: 'confirmed',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, 
            error: null 
          }),
        }),
      });

      (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
        if (table === 'transactions') {
          return {
            update: mockUpdate,
            select: mockSelect,
          };
        }
      });

      const promise = transactionService.pollAndUpdateStatus(mockTxId);

      await jest.advanceTimersByTimeAsync(2000);

      const status = await promise;

      expect(status).toBe('confirmed');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'confirmed',
        })
      );
    });

    it('should handle polling errors gracefully', async () => {
      const mockSnapshot = jest.fn().mockRejectedValue(new Error('Network error'));
      (fcl.tx as jest.Mock).mockReturnValue({ snapshot: mockSnapshot });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ 
            data: {
              id: '123',
              tx_id: mockTxId,
              tx_type: 'create_project',
              wallet_address: mockWalletAddress,
              status: 'failed',
              error_message: undefined,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, 
            error: null 
          }),
        }),
      });

      (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
        if (table === 'transactions') {
          return {
            update: mockUpdate,
            select: mockSelect,
          };
        }
      });

      const promise = transactionService.pollAndUpdateStatus(mockTxId);

      await jest.advanceTimersByTimeAsync(0);

      const status = await promise;

      expect(status).toBe('failed');
      // pollTransactionStatus catches errors and returns 'failed' without error message
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
        })
      );
    });

    it('should fail after max attempts', async () => {
      const mockSnapshot = jest.fn().mockResolvedValue({ status: 2 }); // Always PENDING
      (fcl.tx as jest.Mock).mockReturnValue({ snapshot: mockSnapshot });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ 
            data: {
              id: '123',
              tx_id: mockTxId,
              tx_type: 'create_project',
              wallet_address: mockWalletAddress,
              status: 'failed',
              error_message: 'Max polling attempts reached',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, 
            error: null 
          }),
        }),
      });

      (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
        if (table === 'transactions') {
          return {
            update: mockUpdate,
            select: mockSelect,
          };
        }
      });

      const promise = transactionService.pollAndUpdateStatus(mockTxId, 3);

      // Advance through all attempts
      for (let i = 0; i < 4; i++) {
        await jest.advanceTimersByTimeAsync(10000);
      }

      const status = await promise;

      expect(status).toBe('failed');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          error_message: 'Max polling attempts reached',
        })
      );
    });

    it('should use exponential backoff between polls', async () => {
      const mockSnapshot = jest.fn().mockResolvedValue({ status: 2 }); // Always PENDING
      (fcl.tx as jest.Mock).mockReturnValue({ snapshot: mockSnapshot });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ 
            data: {
              id: '123',
              tx_id: mockTxId,
              tx_type: 'create_project',
              wallet_address: mockWalletAddress,
              status: 'failed',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, 
            error: null 
          }),
        }),
      });

      (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
        if (table === 'transactions') {
          return {
            update: mockUpdate,
            select: mockSelect,
          };
        }
      });

      const promise = transactionService.pollAndUpdateStatus(mockTxId, 5);

      // Verify exponential backoff: 1s, 2s, 4s, 8s, 8s
      await jest.advanceTimersByTimeAsync(1000); // First attempt
      await jest.advanceTimersByTimeAsync(2000); // Second attempt
      await jest.advanceTimersByTimeAsync(4000); // Third attempt
      await jest.advanceTimersByTimeAsync(8000); // Fourth attempt
      await jest.advanceTimersByTimeAsync(8000); // Fifth attempt (capped)

      await promise;

      expect(mockSnapshot).toHaveBeenCalledTimes(5);
    });
  });

  describe('getTransaction', () => {
    it('should retrieve transaction by tx ID', async () => {
      const mockData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        tx_id: mockTxId,
        tx_type: 'create_project',
        wallet_address: mockWalletAddress,
        project_id: mockProjectId,
        status: 'confirmed',
        error_message: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      });

      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await transactionService.getTransaction(mockTxId);

      expect(supabaseAdmin.from).toHaveBeenCalledWith('transactions');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(result).toMatchObject({
        txId: mockTxId,
        type: 'create_project',
        walletAddress: mockWalletAddress,
        projectId: mockProjectId,
        status: 'confirmed',
      });
    });

    it('should return null when transaction not found', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await transactionService.getTransaction(mockTxId);

      expect(result).toBeNull();
    });

    it('should return null when database query fails', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Query failed'),
          }),
        }),
      });

      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await transactionService.getTransaction(mockTxId);

      expect(result).toBeNull();
    });
  });

  describe('getTransactionsByWallet', () => {
    it('should retrieve all transactions for a wallet address', async () => {
      const mockData = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          tx_id: mockTxId,
          tx_type: 'create_project',
          wallet_address: mockWalletAddress,
          project_id: mockProjectId,
          status: 'confirmed',
          error_message: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '223e4567-e89b-12d3-a456-426614174001',
          tx_id: '0xabcdef1234567890',
          tx_type: 'contribute',
          wallet_address: mockWalletAddress,
          project_id: mockProjectId,
          status: 'pending',
          error_message: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      });

      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await transactionService.getTransactionsByWallet(mockWalletAddress);

      expect(supabaseAdmin.from).toHaveBeenCalledWith('transactions');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(result).toHaveLength(2);
      expect(result[0].walletAddress).toBe(mockWalletAddress);
      expect(result[1].walletAddress).toBe(mockWalletAddress);
    });

    it('should return empty array when no transactions found', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await transactionService.getTransactionsByWallet(mockWalletAddress);

      expect(result).toEqual([]);
    });

    it('should return empty array when database query fails', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Query failed'),
          }),
        }),
      });

      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await transactionService.getTransactionsByWallet(mockWalletAddress);

      expect(result).toEqual([]);
    });

    it('should order transactions by created_at descending', async () => {
      const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      await transactionService.getTransactionsByWallet(mockWalletAddress);

      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    });
  });

  describe('getTransactionsByProject', () => {
    it('should retrieve all transactions for a project', async () => {
      const mockData = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          tx_id: mockTxId,
          tx_type: 'create_project',
          wallet_address: mockWalletAddress,
          project_id: mockProjectId,
          status: 'confirmed',
          error_message: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '223e4567-e89b-12d3-a456-426614174001',
          tx_id: '0xabcdef1234567890',
          tx_type: 'contribute',
          wallet_address: '0xabcdef1234567890',
          project_id: mockProjectId,
          status: 'confirmed',
          error_message: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      });

      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await transactionService.getTransactionsByProject(mockProjectId);

      expect(supabaseAdmin.from).toHaveBeenCalledWith('transactions');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(result).toHaveLength(2);
      expect(result[0].projectId).toBe(mockProjectId);
      expect(result[1].projectId).toBe(mockProjectId);
    });

    it('should return empty array when no transactions found', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await transactionService.getTransactionsByProject(mockProjectId);

      expect(result).toEqual([]);
    });

    it('should return empty array when database query fails', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Query failed'),
          }),
        }),
      });

      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await transactionService.getTransactionsByProject(mockProjectId);

      expect(result).toEqual([]);
    });

    it('should order transactions by created_at descending', async () => {
      const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      await transactionService.getTransactionsByProject(mockProjectId);

      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    });
  });

  describe('onStatusChange', () => {
    it('should register status change callback', () => {
      const callback = jest.fn();
      const unsubscribe = transactionService.onStatusChange(callback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should emit status change event when status updates', async () => {
      const callback = jest.fn();
      transactionService.onStatusChange(callback);

      const mockData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        tx_id: mockTxId,
        tx_type: 'create_project',
        wallet_address: mockWalletAddress,
        project_id: mockProjectId,
        status: 'confirmed',
        error_message: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      });

      (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
        if (table === 'transactions') {
          return {
            update: mockUpdate,
            select: mockSelect,
          };
        }
      });

      await transactionService.updateTransactionStatus(mockTxId, 'confirmed');

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          txId: mockTxId,
          status: 'confirmed',
        })
      );
    });

    it('should support multiple callbacks', async () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      transactionService.onStatusChange(callback1);
      transactionService.onStatusChange(callback2);

      const mockData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        tx_id: mockTxId,
        tx_type: 'create_project',
        wallet_address: mockWalletAddress,
        project_id: mockProjectId,
        status: 'confirmed',
        error_message: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      });

      (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
        if (table === 'transactions') {
          return {
            update: mockUpdate,
            select: mockSelect,
          };
        }
      });

      await transactionService.updateTransactionStatus(mockTxId, 'confirmed');

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should unsubscribe callback', async () => {
      const callback = jest.fn();
      const unsubscribe = transactionService.onStatusChange(callback);

      unsubscribe();

      const mockData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        tx_id: mockTxId,
        tx_type: 'create_project',
        wallet_address: mockWalletAddress,
        project_id: mockProjectId,
        status: 'confirmed',
        error_message: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      });

      (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
        if (table === 'transactions') {
          return {
            update: mockUpdate,
            select: mockSelect,
          };
        }
      });

      await transactionService.updateTransactionStatus(mockTxId, 'confirmed');

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle callback errors gracefully', async () => {
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      const goodCallback = jest.fn();

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      transactionService.onStatusChange(errorCallback);
      transactionService.onStatusChange(goodCallback);

      const mockData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        tx_id: mockTxId,
        tx_type: 'create_project',
        wallet_address: mockWalletAddress,
        project_id: mockProjectId,
        status: 'confirmed',
        error_message: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      });

      (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
        if (table === 'transactions') {
          return {
            update: mockUpdate,
            select: mockSelect,
          };
        }
      });

      await transactionService.updateTransactionStatus(mockTxId, 'confirmed');

      expect(errorCallback).toHaveBeenCalled();
      expect(goodCallback).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error in status change callback:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
