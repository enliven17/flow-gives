/**
 * TransactionService - Manages Flow blockchain transaction lifecycle
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */

import { supabaseAdmin } from '../supabase/server';
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
  async createTransaction(
    txId: string,
    type: TransactionType,
    walletAddress: string,
    projectId?: string
  ): Promise<Transaction> {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .insert({
        tx_id: txId,
        tx_type: type,
        wallet_address: walletAddress,
        project_id: projectId,
        status: 'pending',
      })
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
    const { error } = await supabaseAdmin
      .from('transactions')
      .update({
        status,
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('tx_id', txId);

    if (error) throw error;
  }

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

  async waitForTransaction(txId: string, timeout = 60000): Promise<TransactionStatus> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const status = await this.pollTransactionStatus(txId);
      
      if (status !== 'pending') {
        await this.updateTransactionStatus(txId, status);
        return status;
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    await this.updateTransactionStatus(txId, 'failed', 'Timeout');
    return 'failed';
  }

  async getTransaction(txId: string): Promise<Transaction | null> {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('tx_id', txId)
      .single();

    if (error || !data) return null;
    return this.mapToTransaction(data);
  }

  async getTransactionsByWallet(walletAddress: string): Promise<Transaction[]> {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(this.mapToTransaction);
  }

  async getTransactionsByProject(projectId: string): Promise<Transaction[]> {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(this.mapToTransaction);
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
