/**
 * Unit tests for WalletService - Flow Balance Query
 * 
 * Tests the getFlowBalance() method implementation
 * Requirements: 2.3, 8.4
 */

import { WalletService } from '../wallet.service';
import * as fcl from '@onflow/fcl';

// Mock @onflow/fcl
jest.mock('@onflow/fcl', () => ({
  authenticate: jest.fn(),
  unauthenticate: jest.fn(),
  currentUser: {
    subscribe: jest.fn(() => jest.fn()),
    snapshot: jest.fn(),
  },
  query: jest.fn(),
  config: jest.fn(),
}));

describe('WalletService - getFlowBalance', () => {
  let walletService: WalletService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });

    walletService = new WalletService({
      appName: 'FlowGives Test',
      network: 'testnet',
    });

    // Set a mock address
    (walletService as any).address = '0x1234567890abcdef';
  });

  describe('getFlowBalance', () => {
    it('should throw error when wallet is not connected', async () => {
      // Clear the address
      (walletService as any).address = null;

      await expect(walletService.getFlowBalance()).rejects.toThrow(
        'Wallet not connected'
      );
    });

    it('should return balance as string with 8 decimal precision', async () => {
      const mockBalance = '100.50000000';
      
      (fcl.query as jest.Mock).mockResolvedValue(mockBalance);

      const balance = await walletService.getFlowBalance();
      
      expect(balance).toBe(mockBalance);
      expect(fcl.query).toHaveBeenCalledWith(
        expect.objectContaining({
          cadence: expect.stringContaining('import FlowToken from 0xFlowToken'),
          args: expect.any(Function),
        })
      );
    });

    it('should return zero balance when account has no tokens', async () => {
      (fcl.query as jest.Mock).mockResolvedValue('0.00000000');

      const balance = await walletService.getFlowBalance();
      
      expect(balance).toBe('0.00000000');
    });

    it('should return default zero balance when query returns null', async () => {
      (fcl.query as jest.Mock).mockResolvedValue(null);

      const balance = await walletService.getFlowBalance();
      
      expect(balance).toBe('0.00000000');
    });

    it('should return default zero balance when query returns undefined', async () => {
      (fcl.query as jest.Mock).mockResolvedValue(undefined);

      const balance = await walletService.getFlowBalance();
      
      expect(balance).toBe('0.00000000');
    });

    it('should handle large balance amounts', async () => {
      const mockBalance = '1000000.12345678';
      
      (fcl.query as jest.Mock).mockResolvedValue(mockBalance);

      const balance = await walletService.getFlowBalance();
      
      expect(balance).toBe(mockBalance);
    });

    it('should throw error when query fails', async () => {
      (fcl.query as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await expect(walletService.getFlowBalance()).rejects.toThrow(
        'Failed to fetch Flow balance: Network error'
      );
    });

    it('should use correct Cadence script with FlowToken and FungibleToken imports', async () => {
      (fcl.query as jest.Mock).mockResolvedValue('50.00000000');

      await walletService.getFlowBalance();
      
      const callArgs = (fcl.query as jest.Mock).mock.calls[0][0];
      expect(callArgs.cadence).toContain('import FlowToken from 0xFlowToken');
      expect(callArgs.cadence).toContain('import FungibleToken from 0xFungibleToken');
      expect(callArgs.cadence).toContain('access(all) fun main(address: Address): UFix64');
      expect(callArgs.cadence).toContain('/public/flowTokenBalance');
    });

    it('should pass correct address argument to Cadence script', async () => {
      const testAddress = '0x1234567890abcdef';
      (walletService as any).address = testAddress;
      
      (fcl.query as jest.Mock).mockResolvedValue('25.00000000');

      await walletService.getFlowBalance();
      
      const callArgs = (fcl.query as jest.Mock).mock.calls[0][0];
      expect(callArgs.args).toBeDefined();
      
      // Test the args function
      const mockArg = jest.fn();
      const mockTypes = { Address: 'Address' };
      callArgs.args(mockArg, mockTypes);
      
      expect(mockArg).toHaveBeenCalledWith(testAddress, 'Address');
    });

    it('should handle fractional Flow amounts with 8 decimal precision', async () => {
      const mockBalance = '0.12345678';
      
      (fcl.query as jest.Mock).mockResolvedValue(mockBalance);

      const balance = await walletService.getFlowBalance();
      
      expect(balance).toBe(mockBalance);
    });
  });
});
