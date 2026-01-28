/**
 * TransactionService - Manages blockchain transactions for USDCx transfers
 * 
 * This service handles:
 * - Creating USDCx transfer transactions
 * - Signing and broadcasting transactions
 * - Polling for transaction confirmation
 * - Retrieving transaction details
 * 
 * Requirements: 3.3, 8.2, 8.3, 8.4
 */

import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  Pc,
  uintCV,
  principalCV,
  noneCV,
} from '@stacks/transactions';
import { openContractCall } from '@stacks/connect';
import { StacksNetwork, STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';

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
    name: 'usdcx',
  },
  testnet: {
    address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    name: 'usdcx',
  },
};

/**
 * Stacks API endpoints
 */
const STACKS_API_URLS = {
  mainnet: 'https://api.mainnet.hiro.so',
  testnet: 'https://api.testnet.hiro.so',
};

/**
 * Unsigned transaction data
 */
export interface UnsignedTransaction {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: any[];
  network: 'mainnet' | 'testnet';
  senderAddress: string;
  amount: bigint;
  recipient: string;
}

/**
 * Transaction result after broadcasting
 */
export interface TransactionResult {
  txId: string;
  txRaw: string;
}

/**
 * Transaction status
 */
export interface TransactionStatus {
  txId: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockHeight?: number;
  error?: string;
}

/**
 * Detailed transaction information
 */
export interface Transaction {
  txId: string;
  txStatus: 'pending' | 'success' | 'abort_by_response' | 'abort_by_post_condition';
  txType: string;
  fee: string;
  senderAddress: string;
  blockHeight?: number;
  blockHash?: string;
  blockTime?: number;
  contractCall?: {
    contractId: string;
    functionName: string;
    functionArgs: any[];
  };
}

/**
 * Configuration for TransactionService
 */
export interface TransactionServiceConfig {
  network: 'mainnet' | 'testnet';
}

/**
 * TransactionService - Handles blockchain transaction operations
 */
export class TransactionService {
  private config: TransactionServiceConfig;
  private network: StacksNetwork;
  private apiUrl: string;

  constructor(config: TransactionServiceConfig) {
    this.config = config;
    this.network = config.network === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;
    this.apiUrl = STACKS_API_URLS[config.network];
  }

  /**
   * Create a USDCx transfer transaction
   * 
   * Constructs an unsigned transaction for transferring USDCx tokens.
   * The transaction calls the USDCx contract's transfer function.
   * 
   * @param recipient - Recipient's Stacks address
   * @param amount - Amount in micro-USDCx (6 decimals)
   * @param senderAddress - Sender's Stacks address
   * @param memo - Optional memo for the transfer
   * @returns Promise resolving to unsigned transaction data
   * 
   * Requirements: 3.3, 8.2, 8.3
   */
  async createTransferTransaction(
    recipient: string,
    amount: bigint,
    senderAddress: string,
    memo?: string
  ): Promise<UnsignedTransaction> {
    if (amount <= 0n) {
      throw new Error('Transfer amount must be greater than zero');
    }

    if (!recipient || !senderAddress) {
      throw new Error('Recipient and sender addresses are required');
    }

    const contract = USDCX_CONTRACTS[this.config.network];

    // Build function args using CV helpers (same as overflow-stacks project)
    // transfer(amount uint, sender principal, recipient principal, memo (optional (buff 34)))
    // Note: Overflow project doesn't use memo, so we use noneCV() for compatibility
    const functionArgs = [
      uintCV(amount.toString()), // amount (uint) - convert bigint to string
      principalCV(senderAddress), // sender (principal) - MUST match tx-sender
      principalCV(recipient), // recipient (principal)
      noneCV(), // memo (optional (buff 34)) - using none for compatibility with overflow-stacks pattern
    ];

    return {
      contractAddress: contract.address,
      contractName: contract.name,
      functionName: 'transfer',
      functionArgs,
      network: this.config.network,
      senderAddress,
      amount,
      recipient,
    };
  }

  /**
   * Sign and broadcast a transaction
   * 
   * Opens the wallet connection to sign the transaction and broadcasts it
   * to the Stacks blockchain.
   * 
   * @param transaction - Unsigned transaction data
   * @returns Promise resolving to transaction result with txId
   * @throws Error if signing is rejected or broadcast fails
   * 
   * Requirements: 3.3, 8.3
   */
  async signAndBroadcast(
    transaction: UnsignedTransaction
  ): Promise<TransactionResult> {
    return new Promise((resolve, reject) => {
      const contract = USDCX_CONTRACTS[this.config.network];
      // Use exact same format as overflow-stacks: "address.name"
      const usdcxContract = `${contract.address}.${contract.name}`;

      // Create post-conditions for the transfer (exact same as overflow-stacks)
      // User (sender) will send exactly the amount of USDCx
      // IMPORTANT: Use transaction.senderAddress (the user signing) not recipient
      // Asset name must match the token name in the contract (usdcx-token)
      // Reference: overflow-stacks/components/balance/DepositModal.tsx
      const postConditions = [
        Pc.principal(transaction.senderAddress)
          .willSendEq(transaction.amount.toString())
          .ft(usdcxContract as `${string}.${string}`, 'usdcx-token'),
      ];

      // Debug logging to verify post condition format
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.log('Post condition details:', {
          principal: transaction.senderAddress,
          amount: transaction.amount.toString(),
          contract: usdcxContract,
          assetName: 'usdcx-token',
          postConditionsCount: postConditions.length,
        });
      }

      // App details for wallet display (same as overflow-stacks)
      const appDetails = {
        name: 'StacksGives',
        icon: typeof window !== 'undefined' ? window.location.origin + '/logo.png' : '',
      };

      // Use openContractCall exactly as overflow-stacks does
      // Note: overflow-stacks does NOT have onError callback, only onFinish and onCancel
      openContractCall({
        contractAddress: transaction.contractAddress,
        contractName: transaction.contractName,
        functionName: transaction.functionName,
        functionArgs: transaction.functionArgs,
        postConditions,
        postConditionMode: PostConditionMode.Deny, // Explicitly deny unauthorized transfers
        network: this.network,
        appDetails,
        onFinish: (data: any) => {
          // Same txId extraction logic as overflow-stacks
          const txId = data.txId || data.txid || data.stacksTransaction?.txid;
          if (!txId) {
            reject(new Error('Transaction completed but no transaction ID received'));
            return;
          }
          resolve({
            txId,
            txRaw: data.txRaw || '',
          });
        },
        onCancel: () => {
          reject(new Error('Transaction signing cancelled by user'));
        },
        // Note: overflow-stacks does NOT have onError callback
        // Errors are handled through onFinish with status checks
      });
    });
  }

  /**
   * Wait for transaction confirmation
   * 
   * Polls the Stacks API for transaction status until it's confirmed or failed.
   * Uses exponential backoff to avoid overwhelming the API.
   * 
   * @param txId - Transaction ID to monitor
   * @param maxAttempts - Maximum number of polling attempts (default: 60)
   * @returns Promise resolving to final transaction status
   * @throws Error if max attempts exceeded or transaction fails
   * 
   * Requirements: 8.4
   */
  async waitForConfirmation(
    txId: string,
    maxAttempts: number = 60
  ): Promise<TransactionStatus> {
    let attempts = 0;
    let delay = 1000; // Start with 1 second
    const maxDelay = 10000; // Cap at 10 seconds

    while (attempts < maxAttempts) {
      try {
        const status = await this.getTransactionStatus(txId);

        // Check if transaction reached a terminal state
        if (status.status === 'confirmed') {
          return status;
        }

        if (status.status === 'failed') {
          throw new Error(status.error || 'Transaction failed');
        }

        // Transaction still pending, wait before next attempt
        await this.sleep(delay);

        // Exponential backoff with cap
        delay = Math.min(delay * 1.5, maxDelay);
        attempts++;
      } catch (error) {
        // If it's a "not found" error, transaction might not be indexed yet
        if (error instanceof Error && error.message.includes('not found')) {
          await this.sleep(delay);
          delay = Math.min(delay * 1.5, maxDelay);
          attempts++;
          continue;
        }

        throw error;
      }
    }

    throw new Error(
      `Transaction confirmation timeout after ${maxAttempts} attempts`
    );
  }

  /**
   * Get transaction status
   * 
   * Queries the Stacks API for the current status of a transaction.
   * 
   * @param txId - Transaction ID
   * @returns Promise resolving to transaction status
   * @throws Error if transaction not found or API error
   */
  private async getTransactionStatus(txId: string): Promise<TransactionStatus> {
    const response = await fetch(`${this.apiUrl}/extended/v1/tx/${txId}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Transaction not found');
      }
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Map API status to our status enum
    let status: 'pending' | 'confirmed' | 'failed';
    if (data.tx_status === 'pending') {
      status = 'pending';
    } else if (data.tx_status === 'success') {
      status = 'confirmed';
    } else {
      status = 'failed';
    }

    return {
      txId: data.tx_id,
      status,
      blockHeight: data.block_height,
      error: data.tx_status === 'abort_by_response' || data.tx_status === 'abort_by_post_condition'
        ? `Transaction aborted: ${data.tx_status}`
        : undefined,
    };
  }

  /**
   * Get detailed transaction information
   * 
   * Retrieves complete transaction details from the Stacks blockchain.
   * 
   * @param txId - Transaction ID
   * @returns Promise resolving to transaction details
   * @throws Error if transaction not found or API error
   * 
   * Requirements: 8.4
   */
  async getTransaction(txId: string): Promise<Transaction> {
    const response = await fetch(`${this.apiUrl}/extended/v1/tx/${txId}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Transaction not found');
      }
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      txId: data.tx_id,
      txStatus: data.tx_status,
      txType: data.tx_type,
      fee: data.fee_rate,
      senderAddress: data.sender_address,
      blockHeight: data.block_height,
      blockHash: data.block_hash,
      blockTime: data.block_time,
      contractCall: data.contract_call
        ? {
          contractId: data.contract_call.contract_id,
          functionName: data.contract_call.function_name,
          functionArgs: data.contract_call.function_args,
        }
        : undefined,
    };
  }

  /**
   * Get transaction explorer URL
   * 
   * Generates a URL to view the transaction in the Stacks explorer.
   * 
   * @param txId - Transaction ID
   * @returns Explorer URL
   * 
   * Requirements: 8.5
   */
  getExplorerUrl(txId: string): string {
    const chain = this.config.network === 'mainnet' ? 'mainnet' : 'testnet';
    return `https://explorer.stacks.co/txid/${txId}?chain=${chain}`;
  }

  /**
   * Sleep utility for polling delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
