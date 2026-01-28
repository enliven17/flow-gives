/**
 * Unit tests for WalletService
 * 
 * Tests wallet connection, disconnection, state management,
 * and USDCx balance queries.
 */

import { WalletService, formatUSDCx, toMicroUSDCx, fromMicroUSDCx } from './wallet.service';
import { UserSession } from '@stacks/connect';
import { callReadOnlyFunction } from '@stacks/transactions';

// Mock @stacks/connect
jest.mock('@stacks/connect', () => ({
  AppConfig: jest.fn().mockImplementation(() => ({})),
  UserSession: jest.fn().mockImplementation(() => ({
    isUserSignedIn: jest.fn().mockReturnValue(false),
    loadUserData: jest.fn(),
    signUserOut: jest.fn(),
  })),
  showConnect: jest.fn(),
}));

// Mock @stacks/transactions
jest.mock('@stacks/transactions', () => ({
  callReadOnlyFunction: jest.fn(),
  cvToValue: jest.fn(),
  standardPrincipalCV: jest.fn(),
}));

// Mock @stacks/network
jest.mock('@stacks/network', () => ({
  STACKS_MAINNET: { name: 'mainnet', chainId: 1 },
  STACKS_TESTNET: { name: 'testnet', chainId: 2147483648 },
}));

describe('WalletService', () => {
  let walletService: WalletService;
  let mockUserSession: jest.Mocked<UserSession>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    walletService = new WalletService({
      appName: 'StacksGives Test',
      network: 'testnet',
    });

    // Get the mocked user session instance
    mockUserSession = (walletService as any).userSession;
  });

  describe('constructor', () => {
    it('should initialize with testnet configuration', () => {
      const service = new WalletService({
        appName: 'Test App',
        network: 'testnet',
      });

      expect(service.getNetwork()).toBe('testnet');
    });

    it('should initialize with mainnet configuration', () => {
      const service = new WalletService({
        appName: 'Test App',
        network: 'mainnet',
      });

      expect(service.getNetwork()).toBe('mainnet');
    });
  });

  describe('isConnected', () => {
    it('should return false when wallet is not connected', () => {
      mockUserSession.isUserSignedIn.mockReturnValue(false);
      
      expect(walletService.isConnected()).toBe(false);
    });

    it('should return true when wallet is connected', () => {
      mockUserSession.isUserSignedIn.mockReturnValue(true);
      
      expect(walletService.isConnected()).toBe(true);
    });
  });

  describe('getAddress', () => {
    it('should return null when wallet is not connected', () => {
      mockUserSession.isUserSignedIn.mockReturnValue(false);
      
      expect(walletService.getAddress()).toBeNull();
    });

    it('should return address when wallet is connected', () => {
      const testAddress = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
      
      mockUserSession.isUserSignedIn.mockReturnValue(true);
      mockUserSession.loadUserData.mockReturnValue({
        profile: {
          stxAddress: {
            testnet: testAddress,
            mainnet: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
          },
        },
      } as any);
      
      expect(walletService.getAddress()).toBe(testAddress);
    });

    it('should return null when user data is incomplete', () => {
      mockUserSession.isUserSignedIn.mockReturnValue(true);
      mockUserSession.loadUserData.mockReturnValue({
        profile: {},
      } as any);
      
      expect(walletService.getAddress()).toBeNull();
    });
  });

  describe('disconnect', () => {
    it('should call signUserOut on user session', async () => {
      await walletService.disconnect();
      
      expect(mockUserSession.signUserOut).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUSDCxBalance', () => {
    const testAddress = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';

    beforeEach(() => {
      mockUserSession.isUserSignedIn.mockReturnValue(true);
      mockUserSession.loadUserData.mockReturnValue({
        profile: {
          stxAddress: {
            testnet: testAddress,
          },
        },
      } as any);
    });

    it('should throw error when wallet is not connected', async () => {
      mockUserSession.isUserSignedIn.mockReturnValue(false);
      
      await expect(walletService.getUSDCxBalance()).rejects.toThrow(
        'Wallet not connected'
      );
    });

    it('should return balance when query succeeds', async () => {
      const mockBalance = 1000000n; // 1 USDCx
      
      (callReadOnlyFunction as jest.Mock).mockResolvedValue({
        type: 'uint',
        value: mockBalance,
      });

      const { cvToValue } = require('@stacks/transactions');
      cvToValue.mockReturnValue({ value: mockBalance });

      const balance = await walletService.getUSDCxBalance();
      
      expect(balance).toBe(mockBalance);
      expect(callReadOnlyFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          contractName: 'usdcx-token',
          functionName: 'get-balance',
          senderAddress: testAddress,
        })
      );
    });

    it('should handle zero balance', async () => {
      (callReadOnlyFunction as jest.Mock).mockResolvedValue({
        type: 'uint',
        value: 0n,
      });

      const { cvToValue } = require('@stacks/transactions');
      cvToValue.mockReturnValue({ value: 0n });

      const balance = await walletService.getUSDCxBalance();
      
      expect(balance).toBe(0n);
    });

    it('should throw error when query fails', async () => {
      (callReadOnlyFunction as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await expect(walletService.getUSDCxBalance()).rejects.toThrow(
        'Failed to fetch USDCx balance'
      );
    });
  });

  describe('getNetwork', () => {
    it('should return configured network', () => {
      expect(walletService.getNetwork()).toBe('testnet');
    });
  });

  describe('getUserSession', () => {
    it('should return user session instance', () => {
      const session = walletService.getUserSession();
      expect(session).toBe(mockUserSession);
    });
  });
});

describe('Utility functions', () => {
  describe('formatUSDCx', () => {
    it('should format micro-USDCx to display string', () => {
      expect(formatUSDCx(1000000n)).toBe('1.00');
      expect(formatUSDCx(1500000n)).toBe('1.50');
      expect(formatUSDCx(123456n)).toBe('0.12');
      expect(formatUSDCx(0n)).toBe('0.00');
    });

    it('should handle large amounts', () => {
      expect(formatUSDCx(1000000000000n)).toBe('1000000.00');
    });
  });

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
  });
});
