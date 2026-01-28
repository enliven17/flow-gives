/**
 * USDCx Service Tests
 * 
 * Unit tests for the USDCx token service.
 * 
 * Requirements: 3.2, 3.3, 3.5
 */

import { USDCxService, getUSDCxService, initializeUSDCxService } from './usdcx.service';

// Mock @stacks/transactions
jest.mock('@stacks/transactions', () => ({
  callReadOnlyFunction: jest.fn(),
  cvToValue: jest.fn((value) => value),
  standardPrincipalCV: jest.fn((address) => ({ type: 'principal', address })),
  uintCV: jest.fn((value) => ({ type: 'uint', value })),
  contractPrincipalCV: jest.fn((address, name) => ({ type: 'contract', address, name })),
}));

// Mock @stacks/network
jest.mock('@stacks/network', () => ({
  STACKS_MAINNET: { coreApiUrl: 'https://api.hiro.so' },
  STACKS_TESTNET: { coreApiUrl: 'https://api.testnet.hiro.so' },
}));

describe('USDCxService', () => {
  let usdcxService: USDCxService;
  const mockCallReadOnlyFunction = require('@stacks/transactions').callReadOnlyFunction;
  const mockCvToValue = require('@stacks/transactions').cvToValue;

  beforeEach(() => {
    jest.clearAllMocks();
    usdcxService = new USDCxService('testnet');
  });

  describe('getBalance', () => {
    it('should return balance in micro-USDCx', async () => {
      const mockBalance = { value: 1000000000 }; // 1000 USDCx
      mockCallReadOnlyFunction.mockResolvedValue(mockBalance);
      mockCvToValue.mockReturnValue(mockBalance);

      const balance = await usdcxService.getBalance('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');

      expect(balance).toBe(BigInt(1000000000));
      expect(mockCallReadOnlyFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'get-balance',
        })
      );
    });

    it('should handle zero balance', async () => {
      const mockBalance = { value: 0 };
      mockCallReadOnlyFunction.mockResolvedValue(mockBalance);
      mockCvToValue.mockReturnValue(mockBalance);

      const balance = await usdcxService.getBalance('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');

      expect(balance).toBe(BigInt(0));
    });

    it('should throw error on failure', async () => {
      mockCallReadOnlyFunction.mockRejectedValue(new Error('Network error'));

      await expect(
        usdcxService.getBalance('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM')
      ).rejects.toThrow('Failed to fetch USDCx balance');
    });
  });

  describe('getAllowance', () => {
    it('should return allowance in micro-USDCx', async () => {
      const mockAllowance = { value: 500000000 }; // 500 USDCx
      mockCallReadOnlyFunction.mockResolvedValue(mockAllowance);
      mockCvToValue.mockReturnValue(mockAllowance);

      const allowance = await usdcxService.getAllowance(
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        'ST2CY5V39NHDPWSXMW3Q3VS5W7Y8WQEYGBK7H6FAF'
      );

      expect(allowance).toBe(BigInt(500000000));
      expect(mockCallReadOnlyFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'get-allowance',
        })
      );
    });

    it('should handle zero allowance', async () => {
      const mockAllowance = { value: 0 };
      mockCallReadOnlyFunction.mockResolvedValue(mockAllowance);
      mockCvToValue.mockReturnValue(mockAllowance);

      const allowance = await usdcxService.getAllowance(
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        'ST2CY5V39NHDPWSXMW3Q3VS5W7Y8WQEYGBK7H6FAF'
      );

      expect(allowance).toBe(BigInt(0));
    });
  });

  describe('getMetadata', () => {
    it('should return token metadata', async () => {
      mockCallReadOnlyFunction
        .mockResolvedValueOnce('USDCx') // name
        .mockResolvedValueOnce('USDCx') // symbol
        .mockResolvedValueOnce({ value: 6 }) // decimals
        .mockResolvedValueOnce({ value: 1000000000000 }); // total supply

      mockCvToValue
        .mockReturnValueOnce('USDCx')
        .mockReturnValueOnce('USDCx')
        .mockReturnValueOnce({ value: 6 })
        .mockReturnValueOnce({ value: 1000000000000 });

      const metadata = await usdcxService.getMetadata();

      expect(metadata).toEqual({
        name: 'USDCx',
        symbol: 'USDCx',
        decimals: 6,
        totalSupply: BigInt(1000000000000),
      });
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const service1 = getUSDCxService('testnet');
      const service2 = getUSDCxService('testnet');

      expect(service1).toBe(service2);
    });

    it('should create new instance after initialization', () => {
      const service1 = getUSDCxService('testnet');
      initializeUSDCxService('mainnet');
      const service2 = getUSDCxService('mainnet');

      expect(service1).not.toBe(service2);
    });
  });
});
