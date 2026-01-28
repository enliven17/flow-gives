/**
 * TransactionService - Manages Flow blockchain transaction lifecycle
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */

import { supabase } from '../supabase/client';
import * as fcl from '@onflow/fcl';

export type TransactionType = 'create_project' | 'contribute' | 'withdraw' | 'refund';
export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface Transaction {
  id: string;
  txId: string;
  type: TransactionType;
  walletAddress: string;
  projectId?: string;
  status: TransactionStatus;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class TransactionService {
  private statusChangeCallbacks: Array<(tx: Transaction) => void> = [];

  async createTransaction(
    txId: string,
    type: TransactionType,
    walletAddress: string,
    projectId?: string
  ): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        tx_id: txId,
        tx_type: type,
        wallet_address: walletAddress,
        project_id: projectId,
        status: 'pending',
      } as any)
      .select()
      .single();

    if (error) throw error;
    return this.mapToTransaction(data);
  }

  async updateTransactionStatus(
    txId: string,
    status: TransactionStatus,
    errorMessage?: string
  ): Promise<void> {
    const { error } = await (supabase.from('transactions') as any)
      .update({
        status,
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('tx_id', txId);

    if (error) throw error;

    // Emit status change event
    const transaction = await this.getTransaction(txId);
    if (transaction) {
      this.emitStatusChange(transaction);
    }
  }

  /**
   * Poll transaction status from Flow blockchain
   * Requirements: 4.2, 4.3, 4.4
   * 
   * @param txId - Flow transaction ID
   * @returns Current transaction status
   */
  async pollTransactionStatus(txId: string): Promise<TransactionStatus> {
    try {
      const tx = await fcl.tx(txId).snapshot();
      if (tx.status === 4) return 'confirmed'; // SEALED
      if (tx.status === 5) return 'failed'; // EXPIRED
      return 'pending';
    } catch {
      return 'failed';
    }
  }

  /**
   * Wait for transaction to complete with exponential backoff
   * Requirements: 4.2, 4.3, 4.4
   * 
   * Implements exponential backoff strategy:
   * - Initial delay: 1 second
   * - Max delay: 8 seconds
   * - Backoff multiplier: 2
   * 
   * @param txId - Flow transaction ID
   * @param timeout - Maximum wait time in milliseconds (default: 60000)
   * @returns Final transaction status
   */
  async waitForTransaction(txId: string, timeout = 60000): Promise<TransactionStatus> {
    const startTime = Date.now();
    let delay = 1000; // Start with 1 second
    const maxDelay = 8000; // Max 8 seconds between polls
    const backoffMultiplier = 2;
    
    while (Date.now() - startTime < timeout) {
      const status = await this.pollTransactionStatus(txId);
      
      if (status !== 'pending') {
        await this.updateTransactionStatus(txId, status);
        return status;
      }
      
      // Wait with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase delay for next iteration (exponential backoff)
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
    
    await this.updateTransactionStatus(txId, 'failed', 'Timeout');
    return 'failed';
  }

  /**
   * Start polling for transaction status and update database
   * Requirements: 4.2, 4.3, 4.4
   * 
   * This method polls the blockchain for transaction status and updates
   * the database when the status changes. It uses exponential backoff
   * to reduce network load.
   * 
   * @param txId - Flow transaction ID
   * @param maxAttempts - Maximum number of polling attempts (default: 30)
   * @returns Final transaction status
   */
  async pollAndUpdateStatus(txId: string, maxAttempts = 30): Promise<TransactionStatus> {
    let attempts = 0;
    let delay = 1000; // Start with 1 second
    const maxDelay = 8000; // Max 8 seconds between polls
    const backoffMultiplier = 2;

    while (attempts < maxAttempts) {
      try {
        const status = await this.pollTransactionStatus(txId);
        
        // Update database if status changed from pending
        if (status !== 'pending') {
          await this.updateTransactionStatus(txId, status);
          return status;
        }

        // Wait with exponential backoff before next poll
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffMultiplier, maxDelay);
        attempts++;
      } catch (error) {
        // On error, mark as failed and stop polling
        await this.updateTransactionStatus(
          txId,
          'failed',
          error instanceof Error ? error.message : 'Unknown error'
        );
        return 'failed';
      }
    }

    // Max attempts reached, mark as failed
    await this.updateTransactionStatus(txId, 'failed', 'Max polling attempts reached');
    return 'failed';
  }

  async getTransaction(txId: string): Promise<Transaction | null> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('tx_id', txId)
      .single();

    if (error || !data) return null;
    return this.mapToTransaction(data);
  }

  async getTransactionsByWallet(walletAddress: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(this.mapToTransaction);
  }

  async getTransactionsByProject(projectId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(this.mapToTransaction);
  }

  /**
   * Subscribe to transaction status change events
   * Requirements: 4.7
   * 
   * @param callback - Function to call when transaction status changes
   * @returns Unsubscribe function
   */
  onStatusChange(callback: (tx: Transaction) => void): () => void {
    this.statusChangeCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.statusChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.statusChangeCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Emit status change event to all subscribers
   * @private
   */
  private emitStatusChange(transaction: Transaction): void {
    this.statusChangeCallbacks.forEach(callback => {
      try {
        callback(transaction);
      } catch (error) {
        console.error('Error in status change callback:', error);
      }
    });
  }

  /**
   * Get Flow blockchain explorer URL for a transaction
   * Requirements: 11.7
   * 
   * @param txId - Flow transaction ID
   * @returns URL to view transaction in Flow explorer
   */
  getExplorerUrl(txId: string): string {
    // Flow testnet explorer URL
    // For mainnet, use: https://flowscan.org/transaction/${txId}
    return `https://testnet.flowscan.org/transaction/${txId}`;
  }

  private mapToTransaction(data: any): Transaction {
    return {
      id: data.id,
      txId: data.tx_id,
      type: data.tx_type,
      walletAddress: data.wallet_address,
      projectId: data.project_id,
      status: data.status,
      errorMessage: data.error_message,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}
