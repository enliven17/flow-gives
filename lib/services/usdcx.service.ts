/**
 * USDCx Token Service
 * 
 * This service provides methods to interact with the USDCx token contract
 * on the Stacks blockchain for balance queries, transfers, and approvals.
 * 
 * Requirements: 3.2, 3.3, 3.5
 */

import {
  fetchCallReadOnlyFunction,
  cvToValue,
  standardPrincipalCV,
  uintCV,
  contractPrincipalCV,
} from '@stacks/transactions';
import { StacksNetwork, STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';

/**
 * USDCx contract addresses on Stacks
 * 
 * Official USDCx contracts:
 * - Mainnet: SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx
 * - Testnet: ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx
 * 
 * Source: https://docs.stacks.co/learn/bridging/usdcx
 */
const USDCX_CONTRACTS = {
  mainnet: {
    address: 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE',
    name: 'usdcx',
  },
  testnet: {
    address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    name: 'usdcx',
  },
};

/**
 * USDCx Token Service Interface
 */
export interface IUSDCxService {
  getBalance(address: string): Promise<bigint>;
  getAllowance(owner: string, spender: string): Promise<bigint>;
  getMetadata(): Promise<USDCxMetadata>;
}

/**
 * USDCx token metadata
 */
export interface USDCxMetadata {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
}

/**
 * USDCx Token Service Implementation
 * 
 * Requirements: 3.2, 3.3, 3.5
 */
export class USDCxService implements IUSDCxService {
  private network: StacksNetwork;
  private contractAddress: string;
  private contractName: string;

  constructor(network: 'mainnet' | 'testnet' = 'testnet') {
    this.network = network === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;
    const contract = USDCX_CONTRACTS[network];
    this.contractAddress = contract.address;
    this.contractName = contract.name;
  }

  /**
   * Get USDCx balance for an address
   * 
   * @param address - Stacks address to query
   * @returns Balance in micro-USDCx (6 decimals)
   * 
   * Requirements: 3.2
   */
  async getBalance(address: string): Promise<bigint> {
    try {
      const result = await fetchCallReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'get-balance',
        functionArgs: [standardPrincipalCV(address)],
        network: this.network,
        senderAddress: address,
      });

      const value = cvToValue(result);
      
      // Balance should be a uint, convert to bigint
      if (typeof value === 'object' && 'value' in value) {
        return BigInt(value.value as number);
      }
      
      return BigInt(value as number || 0);
    } catch (error) {
      throw new Error(
        `Failed to fetch USDCx balance: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get allowance for a spender
   * 
   * @param owner - Address that owns the tokens
   * @param spender - Address allowed to spend tokens
   * @returns Allowance in micro-USDCx
   * 
   * Requirements: 3.3
   */
  async getAllowance(owner: string, spender: string): Promise<bigint> {
    try {
      const result = await fetchCallReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'get-allowance',
        functionArgs: [
          standardPrincipalCV(owner),
          standardPrincipalCV(spender),
        ],
        network: this.network,
        senderAddress: owner,
      });

      const value = cvToValue(result);
      
      if (typeof value === 'object' && 'value' in value) {
        return BigInt(value.value as number);
      }
      
      return BigInt(value as number || 0);
    } catch (error) {
      throw new Error(
        `Failed to fetch allowance: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get USDCx token metadata
   * 
   * @returns Token metadata including name, symbol, decimals, and total supply
   * 
   * Requirements: 3.5
   */
  async getMetadata(): Promise<USDCxMetadata> {
    try {
      // Get token name
      const nameResult = await fetchCallReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'get-name',
        functionArgs: [],
        network: this.network,
        senderAddress: this.contractAddress,
      });

      // Get token symbol
      const symbolResult = await fetchCallReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'get-symbol',
        functionArgs: [],
        network: this.network,
        senderAddress: this.contractAddress,
      });

      // Get decimals (should be 6 for USDCx)
      const decimalsResult = await fetchCallReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'get-decimals',
        functionArgs: [],
        network: this.network,
        senderAddress: this.contractAddress,
      });

      // Get total supply
      const supplyResult = await fetchCallReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'get-total-supply',
        functionArgs: [],
        network: this.network,
        senderAddress: this.contractAddress,
      });

      const name = cvToValue(nameResult) as string;
      const symbol = cvToValue(symbolResult) as string;
      const decimalsValue = cvToValue(decimalsResult);
      const supplyValue = cvToValue(supplyResult);

      const decimals = typeof decimalsValue === 'object' && 'value' in decimalsValue
        ? decimalsValue.value as number
        : decimalsValue as number;

      const totalSupply = typeof supplyValue === 'object' && 'value' in supplyValue
        ? BigInt(supplyValue.value as number)
        : BigInt(supplyValue as number || 0);

      return {
        name,
        symbol,
        decimals,
        totalSupply,
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch USDCx metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

/**
 * Create a singleton instance of the USDCx service
 */
let usdcxServiceInstance: USDCxService | null = null;

export function getUSDCxService(network: 'mainnet' | 'testnet' = 'testnet'): USDCxService {
  if (!usdcxServiceInstance) {
    usdcxServiceInstance = new USDCxService(network);
  }
  return usdcxServiceInstance;
}

/**
 * Initialize USDCx service with custom network
 */
export function initializeUSDCxService(network: 'mainnet' | 'testnet'): void {
  usdcxServiceInstance = new USDCxService(network);
}
