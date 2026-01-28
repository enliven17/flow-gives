/**
 * WalletService - Manages Flow wallet connection and authentication
 * 
 * This service handles:
 * - Wallet connection via Flow Client Library (FCL)
 * - Connection state management
 * - Wallet address retrieval
 * - Flow token balance queries
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 2.7
 */

import * as fcl from '@onflow/fcl';

// Re-export formatFlow from utils for backward compatibility
export { formatFlow } from '../utils/format';

/**
 * Wallet connection result
 */
export interface WalletConnection {
  address: string;
  network: 'testnet' | 'mainnet';
}

/**
 * Configuration for WalletService
 */
export interface WalletServiceConfig {
  appName: string;
  appIconUrl?: string;
  network: 'testnet' | 'mainnet';
}

/**
 * WalletService - Manages wallet connection and blockchain interactions
 */
export class WalletService {
  private config: WalletServiceConfig;
  private address: string | null = null;
  private readonly STORAGE_KEY = 'flow_gives_wallet_session';
  private authChangeUnsubscribe: (() => void) | null = null;

  constructor(config: WalletServiceConfig) {
    this.config = config;

    // Restore session
    this.restoreSession();

    // Subscribe to auth changes
    this.subscribeToAuthChanges();
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

  private subscribeToAuthChanges() {
    if (typeof window === 'undefined') return;

    this.authChangeUnsubscribe = fcl.currentUser.subscribe((user: any) => {
      if (user && user.addr) {
        this.address = user.addr;
        // Persist session
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
          address: user.addr,
          timestamp: Date.now()
        }));
      } else {
        this.address = null;
        localStorage.removeItem(this.STORAGE_KEY);
      }
    });
  }

  /**
   * Connect to user's Flow wallet
   * 
   * Initiates wallet connection flow using FCL
   * Supports Blocto, Lilico, and other FCL-compatible wallets
   * 
   * Requirements: 2.1, 2.2
   */
  async connect(): Promise<WalletConnection> {
    if (typeof window === 'undefined') {
      throw new Error("Wallet connection only available in browser");
    }

    try {
      // Authenticate using FCL
      await fcl.authenticate();

      // Get current user
      const user = await fcl.currentUser.snapshot();

      if (!user || !user.addr) {
        throw new Error("No address returned from wallet");
      }

      this.address = user.addr;

      // Persist session
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        address: user.addr,
        timestamp: Date.now()
      }));

      return {
        address: user.addr,
        network: this.config.network,
      };
    } catch (error) {
      throw new Error(
        `Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Disconnect wallet
   * 
   * Requirements: 2.4
   */
  async disconnect(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      // Unauthenticate using FCL
      await fcl.unauthenticate();

      this.address = null;
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      // Clear local state even if FCL fails
      this.address = null;
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
   * Get Flow token balance for connected wallet
   * 
   * Queries the Flow blockchain to get the balance.
   * Balance is returned as a string with 8 decimal precision.
   * 
   * Requirements: 2.3, 8.4
   * 
   * @returns Promise resolving to balance in Flow tokens (as string)
   * @throws Error if wallet not connected or query fails
   */
  async getFlowBalance(): Promise<string> {
    const address = this.getAddress();

    if (!address) {
      throw new Error('Wallet not connected');
    }

    try {
      // Query Flow token balance using FCL
      const balance = await fcl.query({
        cadence: `
          import FlowToken from 0x7e60df042a9c0868
          import FungibleToken from 0x9a0766d93b6608b7

          access(all) fun main(address: Address): UFix64 {
            let account = getAccount(address)
            let vaultRef = account.capabilities
              .get<&{FungibleToken.Balance}>(/public/flowTokenBalance)
              .borrow()
              ?? panic("Could not borrow Balance reference")
            
            return vaultRef.balance
          }
        `,
        args: (arg: any, t: any) => [arg(address, t.Address)]
      });

      // Balance is returned as UFix64 string
      return balance || '0.0';
    } catch (error) {
      throw new Error(
        `Failed to fetch Flow balance: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Subscribe to wallet authentication changes
   * 
   * Requirements: 2.6
   * 
   * @param callback Function to call when auth state changes
   * @returns Unsubscribe function
   */
  subscribeToAuthChanges(callback: (user: any) => void): () => void {
    if (typeof window === 'undefined') {
      return () => {};
    }

    return fcl.currentUser.subscribe(callback);
  }

  /**
   * Cleanup method to unsubscribe from auth changes
   */
  cleanup() {
    if (this.authChangeUnsubscribe) {
      this.authChangeUnsubscribe();
      this.authChangeUnsubscribe = null;
    }
  }
}

/**
 * Utility function to convert Flow to micro-Flow
 * 
 * @param flow Amount in Flow tokens
 * @returns Amount in micro-Flow (8 decimals)
 */
export function toMicroFlow(flow: number): bigint {
  return BigInt(Math.floor(flow * 100_000_000));
}

/**
 * Utility function to convert micro-Flow to Flow
 * 
 * @param microFlow Amount in micro-Flow
 * @returns Amount in Flow tokens
 */
export function fromMicroFlow(microFlow: bigint): number {
  return Number(microFlow) / 100_000_000;
}
