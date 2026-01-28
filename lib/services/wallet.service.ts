/**
 * WalletService - Manages Stacks wallet connection and authentication
 * 
 * This service handles:
 * - Wallet connection via @stacks/connect
 * - Connection state management
 * - Wallet address retrieval
 * - USDCx balance queries
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.5
 */


import { STACKS_MAINNET, STACKS_TESTNET, StacksNetwork } from '@stacks/network';
import {
  fetchCallReadOnlyFunction,
  cvToValue,
  standardPrincipalCV
} from '@stacks/transactions';

// Re-export formatUSDCx from utils for backward compatibility
export { formatUSDCx } from '../utils/format';

/**
 * Wallet connection result
 */
export interface WalletConnection {
  address: string;
  network: 'mainnet' | 'testnet';
}

/**
 * Configuration for WalletService
 */
export interface WalletServiceConfig {
  appName: string;
  appIconUrl?: string;
  network: 'mainnet' | 'testnet';
}

/**
 * USDCx contract addresses on Stacks
 * 
 * Official USDCx contracts:
 * - Mainnet: SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx
 * - Testnet: ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx
 */
const USDCX_CONTRACTS = {
  mainnet: {
    address: 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE',
    name: 'usdcx'
  },
  testnet: {
    address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    name: 'usdcx'
  }
};

/**
 * WalletService - Manages wallet connection and blockchain interactions
 */
export class WalletService {
  private config: WalletServiceConfig;
  private network: StacksNetwork;
  private address: string | null = null;
  private readonly STORAGE_KEY = 'stacks_gives_wallet_session';

  constructor(config: WalletServiceConfig) {
    this.config = config;

    // Set up network
    this.network = config.network === 'mainnet'
      ? STACKS_MAINNET
      : STACKS_TESTNET;

    // Restore session
    this.restoreSession();
  }

  private restoreSession() {
    if (typeof window === 'undefined') return;

    try {
      const sessionData = localStorage.getItem(this.STORAGE_KEY);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        // Check if session is recent (24 hours)
        const sessionAge = Date.now() - session.timestamp;
        const maxAge = 24 * 60 * 60 * 1000;

        if (sessionAge < maxAge && session.address) {
          this.address = session.address;
        } else {
          localStorage.removeItem(this.STORAGE_KEY);
        }
      }
    } catch (e) {
      console.error('Failed to restore wallet session:', e);
    }
  }

  /**
   * Connect to user's Stacks wallet
   * 
   * Initiates wallet connection flow using @stacks/connect dynamic import
   * consistent with overflow-stacks implementation
   */
  async connect(): Promise<WalletConnection> {
    if (typeof window === 'undefined') {
      throw new Error("Wallet connection only available in browser");
    }

    // Dynamically import from @stacks/connect
    const stacksConnect = await import('@stacks/connect');
    let addresses: string[] = [];

    // Try using connect() function first (simpler API)
    if (stacksConnect.connect) {
      // @ts-ignore - connect() exists in v8 but might not be in types if using older types
      const result: any = await stacksConnect.connect();

      if (Array.isArray(result)) {
        addresses = result;
      } else if (result && typeof result === 'object') {
        if (Array.isArray(result.result)) {
          addresses = result.result;
        } else if (result.addresses) {
          addresses = Array.isArray(result.addresses) ? result.addresses : [result.addresses];
        } else if (result.address) {
          addresses = [result.address];
        }
      } else if (typeof result === 'string') {
        addresses = [result];
      }
    } else if (stacksConnect.request) {
      // Fallback to request('getAddresses')
      const response: any = await stacksConnect.request('getAddresses');

      if (response.status === 'success' && response.result) {
        addresses = Array.isArray(response.result) ? response.result : [response.result];
      } else {
        throw new Error(response.error || 'Failed to get addresses from wallet');
      }
    } else {
      throw new Error('Neither connect() nor request() function available from @stacks/connect');
    }

    if (!addresses || addresses.length === 0) {
      throw new Error("No addresses returned from wallet");
    }

    // Filter addresses based on network
    const addressStrings = addresses.map((addr: any) =>
      typeof addr === 'string' ? addr : (addr.address || addr)
    );

    // Find address for current network
    const address = addressStrings.find((addr: string) =>
      this.config.network === 'mainnet' ? addr.startsWith('SP') : addr.startsWith('ST')
    ) || addressStrings[0];

    if (!address) {
      throw new Error("Failed to extract valid address");
    }

    this.address = address;

    // Persist session
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
      address,
      timestamp: Date.now()
    }));

    return {
      address,
      network: this.config.network,
    };
  }

  /**
   * Disconnect wallet
   */
  async disconnect(): Promise<void> {
    this.address = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Check if wallet is currently connected
   */
  isConnected(): boolean {
    return !!this.address;
  }

  /**
   * Get connected wallet address
   */
  getAddress(): string | null {
    return this.address;
  }

  /**
   * Get USDCx balance for connected wallet
   * 
   * Queries the USDCx token contract to get the balance.
   * Balance is returned in micro-USDCx (6 decimals).
   * 
   * @returns Promise resolving to balance in micro-USDCx
   * @throws Error if wallet not connected or query fails
   */
  async getUSDCxBalance(): Promise<bigint> {
    const address = this.getAddress();

    if (!address) {
      throw new Error('Wallet not connected');
    }

    const contract = USDCX_CONTRACTS[this.config.network];

    try {
      const result = await fetchCallReadOnlyFunction({
        contractAddress: contract.address,
        contractName: contract.name,
        functionName: 'get-balance',
        functionArgs: [standardPrincipalCV(address)],
        network: this.network,
        senderAddress: address,
      });

      // Convert Clarity value to JavaScript value
      const balance = cvToValue(result);

      // Balance should be a uint, convert to bigint
      return BigInt(balance.value || 0);
    } catch (error) {
      throw new Error(
        `Failed to fetch USDCx balance: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get the user session instance
   * Deprecated in this implementation as we manage session manually
   */
  getUserSession(): any {
    console.warn('getUserSession is deprecated in this version');
    return null;
  }
}

/**
 * Utility function to convert USDCx to micro-USDCx
 * 
 * @param usdcx Amount in USDCx
 * @returns Amount in micro-USDCx
 */
export function toMicroUSDCx(usdcx: number): bigint {
  return BigInt(Math.floor(usdcx * 1_000_000));
}

/**
 * Utility function to convert micro-USDCx to USDCx
 * 
 * @param microUsdcx Amount in micro-USDCx
 * @returns Amount in USDCx
 */
export function fromMicroUSDCx(microUsdcx: bigint): number {
  return Number(microUsdcx) / 1_000_000;
}
