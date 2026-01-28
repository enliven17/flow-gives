/**
 * Unit tests for TransactionService
 * 
 * Tests transaction creation, signing, broadcasting, and confirmation polling.
 */

import {
  TransactionService,
  toMicroUSDCx,
  fromMicroUSDCx,
  type UnsignedTransaction,
  type TransactionResult,
} from './transaction.service';
import { openContractCall } from '@stacks/connect';
import { Cl } from '@stacks/transactions';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill TextEncoder/TextDecoder for Node.js test environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock @stacks/connect
jest.mock('@stacks/connect', () => ({
  openContractCall: jest.fn(),
}));

// Mock @stacks/transactions
jest.mock('@stacks/transactions', () => ({
  ...jest.requireActual('@stacks/transactions'),
  makeStandardFungiblePostCondition: jest.fn(),
  createAssetInfo: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('TransactionService', () => {
  let transactionService: TransactionService;
  const testSenderAddress = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
  const testRecipientAddress = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';

  beforeEach(() => {
    jest.clearAllMocks();
    
    transactionService = new TransactionService({
      network: 'testnet',
    });

    // Reset fetch mock
    (global.fetch as jest.Mock).mockReset();
  });

  describe('constructor', () => {
    it('should initialize with testnet configuration', () => {
      const service = new TransactionService({
        network: 'testnet',
      });

      expect(service).toBeDefined();
    });

    it('should initialize with mainnet configuration', () => {
      const service = new TransactionService({
        network: 'mainnet',
      });

      expect(service).toBeDefined();
    });
  });

  describe('createTransferTransaction', () => {
    it('should create a valid transfer transaction', async () => {
      const amount = 1000000n; // 1 USDCx
      
      const transaction = await transactionService.createTransferTransaction(
        testRecipientAddress,
        amount,
        testSenderAddress
      );

      expect(transaction).toEqual({
        contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        contractName: 'usdcx-token',
        functionName: 'transfer',
        functionArgs: expect.any(Array),
        network: 'testnet',
        senderAddress: testSenderAddress,
        amount,
        recipient: testRecipientAddress,
      });

      expect(transaction.functionArgs).toHaveLength(4);
    });

    it('should create transaction with memo', async () => {
      const amount = 1000000n;
      const memo = 'Test contribution';
      
      const transaction = await transactionService.createTransferTransaction(
        testRecipientAddress,
        amount,
        testSenderAddress,
        memo
      );

      expect(transaction.functionArgs).toHaveLength(4);
      // Fourth argument should be some(memo), not none()
      expect(transaction.functionArgs[3]).toBeDefined();
    });

    it('should create transaction without memo', async () => {
      const amount = 1000000n;
      
      const transaction = await transactionService.createTransferTransaction(
        testRecipientAddress,
        amount,
        testSenderAddress
      );

      expect(transaction.functionArgs).toHaveLength(4);
      // Fourth argument should be none()
      expect(transaction.functionArgs[3]).toBeDefined();
    });

    it('should throw error for zero amount', async () => {
      await expect(
        transactionService.createTransferTransaction(
          testRecipientAddress,
          0n,
          testSenderAddress
        )
      ).rejects.toThrow('Transfer amount must be greater than zero');
    });

    it('should throw error for negative amount', async () => {
      await expect(
        transactionService.createTransferTransaction(
          testRecipientAddress,
          -1000n,
          testSenderAddress
        )
      ).rejects.toThrow('Transfer amount must be greater than zero');
    });

    it('should throw error for missing recipient', async () => {
      await expect(
        transactionService.createTransferTransaction(
          '',
          1000000n,
          testSenderAddress
        )
      ).rejects.toThrow('Recipient and sender addresses are required');
    });

    it('should throw error for missing sender', async () => {
      await expect(
        transactionService.createTransferTransaction(
          testRecipientAddress,
          1000000n,
          ''
        )
      ).rejects.toThrow('Recipient and sender addresses are required');
    });

    it('should handle large amounts', async () => {
      const largeAmount = 1000000000000n; // 1 million USDCx
      
      const transaction = await transactionService.createTransferTransaction(
        testRecipientAddress,
        largeAmount,
        testSenderAddress
      );

      expect(transaction.amount).toBe(largeAmount);
    });
  });

  describe('signAndBroadcast', () => {
    const mockTransaction: UnsignedTransaction = {
      contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      contractName: 'usdcx-token',
      functionName: 'transfer',
      functionArgs: [
        Cl.uint(1000000n),
        Cl.principal(testSenderAddress),
        Cl.principal(testRecipientAddress),
        Cl.none(),
      ],
      network: 'testnet',
      senderAddress: testSenderAddress,
      amount: 1000000n,
      recipient: testRecipientAddress,
    };

    it('should sign and broadcast transaction successfully', async () => {
      const mockTxId = '0x1234567890abcdef';
      const mockTxRaw = '0xabcdef1234567890';

      (openContractCall as jest.Mock).mockImplementation((options) => {
        // Simulate successful signing
        setTimeout(() => {
          options.onFinish({
            txId: mockTxId,
            txRaw: mockTxRaw,
          });
        }, 0);
      });

      const result = await transactionService.signAndBroadcast(mockTransaction);

      expect(result).toEqual({
        txId: mockTxId,
        txRaw: mockTxRaw,
      });

      expect(openContractCall).toHaveBeenCalledWith(
        expect.objectContaining({
          contractAddress: mockTransaction.contractAddress,
          contractName: mockTransaction.contractName,
          functionName: mockTransaction.functionName,
          functionArgs: mockTransaction.functionArgs,
        })
      );
    });

    it('should reject when user cancels signing', async () => {
      (openContractCall as jest.Mock).mockImplementation((options) => {
        // Simulate user cancellation
        setTimeout(() => {
          options.onCancel();
        }, 0);
      });

      await expect(
        transactionService.signAndBroadcast(mockTransaction)
      ).rejects.toThrow('Transaction signing cancelled by user');
    });

    it('should include post conditions', async () => {
      (openContractCall as jest.Mock).mockImplementation((options) => {
        expect(options.postConditions).toBeDefined();
        expect(options.postConditions.length).toBeGreaterThan(0);
        
        options.onFinish({
          txId: '0x123',
          txRaw: '0xabc',
        });
      });

      await transactionService.signAndBroadcast(mockTransaction);
    });
  });

  describe('waitForConfirmation', () => {
    const mockTxId = '0x1234567890abcdef';

    it('should return confirmed status when transaction succeeds', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          tx_id: mockTxId,
          tx_status: 'success',
          block_height: 12345,
        }),
      });

      const status = await transactionService.waitForConfirmation(mockTxId, 5);

      expect(status).toEqual({
        txId: mockTxId,
        status: 'confirmed',
        blockHeight: 12345,
        error: undefined,
      });
    });

    it('should poll until transaction is confirmed', async () => {
      let callCount = 0;
      
      (global.fetch as jest.Mock).mockImplementation(async () => {
        callCount++;
        
        if (callCount < 3) {
          // First two calls: pending
          return {
            ok: true,
            json: async () => ({
              tx_id: mockTxId,
              tx_status: 'pending',
            }),
          };
        } else {
          // Third call: confirmed
          return {
            ok: true,
            json: async () => ({
              tx_id: mockTxId,
              tx_status: 'success',
              block_height: 12345,
            }),
          };
        }
      });

      const status = await transactionService.waitForConfirmation(mockTxId, 10);

      expect(status.status).toBe('confirmed');
      expect(callCount).toBe(3);
    });

    it('should throw error when transaction fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          tx_id: mockTxId,
          tx_status: 'abort_by_response',
        }),
      });

      await expect(
        transactionService.waitForConfirmation(mockTxId, 5)
      ).rejects.toThrow('Transaction aborted');
    });

    it('should throw error when max attempts exceeded', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          tx_id: mockTxId,
          tx_status: 'pending',
        }),
      });

      await expect(
        transactionService.waitForConfirmation(mockTxId, 3)
      ).rejects.toThrow('Transaction confirmation timeout');
    });

    it('should handle transaction not found initially', async () => {
      let callCount = 0;
      
      (global.fetch as jest.Mock).mockImplementation(async () => {
        callCount++;
        
        if (callCount === 1) {
          // First call: not found (transaction not indexed yet)
          return {
            ok: false,
            status: 404,
            statusText: 'Not Found',
          };
        } else {
          // Second call: confirmed
          return {
            ok: true,
            json: async () => ({
              tx_id: mockTxId,
              tx_status: 'success',
              block_height: 12345,
            }),
          };
        }
      });

      const status = await transactionService.waitForConfirmation(mockTxId, 10);

      expect(status.status).toBe('confirmed');
      expect(callCount).toBe(2);
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(
        transactionService.waitForConfirmation(mockTxId, 5)
      ).rejects.toThrow('API error');
    });
  });

  describe('getTransaction', () => {
    const mockTxId = '0x1234567890abcdef';

    it('should retrieve transaction details', async () => {
      const mockTxData = {
        tx_id: mockTxId,
        tx_status: 'success',
        tx_type: 'contract_call',
        fee_rate: '1000',
        sender_address: testSenderAddress,
        block_height: 12345,
        block_hash: '0xabcdef',
        block_time: 1234567890,
        contract_call: {
          contract_id: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx-token',
          function_name: 'transfer',
          function_args: [],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockTxData,
      });

      const transaction = await transactionService.getTransaction(mockTxId);

      expect(transaction).toEqual({
        txId: mockTxId,
        txStatus: 'success',
        txType: 'contract_call',
        fee: '1000',
        senderAddress: testSenderAddress,
        blockHeight: 12345,
        blockHash: '0xabcdef',
        blockTime: 1234567890,
        contractCall: {
          contractId: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx-token',
          functionName: 'transfer',
          functionArgs: [],
        },
      });
    });

    it('should handle transaction without contract call', async () => {
      const mockTxData = {
        tx_id: mockTxId,
        tx_status: 'success',
        tx_type: 'token_transfer',
        fee_rate: '1000',
        sender_address: testSenderAddress,
        block_height: 12345,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockTxData,
      });

      const transaction = await transactionService.getTransaction(mockTxId);

      expect(transaction.contractCall).toBeUndefined();
    });

    it('should throw error when transaction not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(
        transactionService.getTransaction(mockTxId)
      ).rejects.toThrow('Transaction not found');
    });

    it('should throw error on API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(
        transactionService.getTransaction(mockTxId)
      ).rejects.toThrow('API error');
    });
  });

  describe('getExplorerUrl', () => {
    it('should generate testnet explorer URL', () => {
      const txId = '0x1234567890abcdef';
      const url = transactionService.getExplorerUrl(txId);

      expect(url).toBe(
        'https://explorer.stacks.co/txid/0x1234567890abcdef?chain=testnet'
      );
    });

    it('should generate mainnet explorer URL', () => {
      const mainnetService = new TransactionService({
        network: 'mainnet',
      });

      const txId = '0x1234567890abcdef';
      const url = mainnetService.getExplorerUrl(txId);

      expect(url).toBe(
        'https://explorer.stacks.co/txid/0x1234567890abcdef?chain=mainnet'
      );
    });
  });
});

describe('Utility functions', () => {
  describe('toMicroUSDCx', () => {
    it('should convert USDCx to micro-USDCx', () => {
      expect(toMicroUSDCx(1)).toBe(1000000n);
      expect(toMicroUSDCx(1.5)).toBe(1500000n);
      expect(toMicroUSDCx(0.123456)).toBe(123456n);
      expect(toMicroUSDCx(0)).toBe(0n);
    });

    it('should handle fractional amounts correctly', () => {
      expect(toMicroUSDCx(0.000001)).toBe(1n);
      expect(toMicroUSDCx(0.0000001)).toBe(0n); // Below precision
    });

    it('should handle large amounts', () => {
      expect(toMicroUSDCx(1000000)).toBe(1000000000000n);
    });
  });

  describe('fromMicroUSDCx', () => {
    it('should convert micro-USDCx to USDCx', () => {
      expect(fromMicroUSDCx(1000000n)).toBe(1);
      expect(fromMicroUSDCx(1500000n)).toBe(1.5);
      expect(fromMicroUSDCx(123456n)).toBe(0.123456);
      expect(fromMicroUSDCx(0n)).toBe(0);
    });

    it('should handle large amounts', () => {
      expect(fromMicroUSDCx(1000000000000n)).toBe(1000000);
    });
  });

  describe('round-trip conversion', () => {
    it('should maintain value through conversion cycle', () => {
      const original = 123.456789;
      const micro = toMicroUSDCx(original);
      const back = fromMicroUSDCx(micro);
      
      // Should be close due to precision limits
      expect(Math.abs(back - original)).toBeLessThan(0.000001);
    });

    it('should handle edge cases', () => {
      // Very small amount
      const small = 0.000001;
      expect(fromMicroUSDCx(toMicroUSDCx(small))).toBe(small);

      // Very large amount
      const large = 999999.999999;
      const microLarge = toMicroUSDCx(large);
      const backLarge = fromMicroUSDCx(microLarge);
      expect(Math.abs(backLarge - large)).toBeLessThan(0.000001);
    });
  });
});
