/**
 * SyncService - Synchronizes Flow blockchain state with database
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
 */

import { supabaseAdmin } from '../supabase/server';
import * as fcl from '@onflow/fcl';

export interface SyncServiceConfig {
  pollInterval: number;
  startBlock?: number;
}

interface FlowEvent {
  type: string;
  transactionId: string;
  transactionIndex: number;
  eventIndex: number;
  data: any;
  blockHeight: number;
  blockTimestamp: string;
}

export class SyncService {
  private config: SyncServiceConfig;
  private running = false;
  private intervalId: NodeJS.Timeout | null = null;
  private lastSyncedBlock: number;
  private errorCallbacks: Array<(error: Error) => void> = [];
  private contractAddress: string;

  constructor(config: SyncServiceConfig) {
    this.config = config;
    this.lastSyncedBlock = config.startBlock || 0;
    this.contractAddress = process.env.NEXT_PUBLIC_CROWDFUNDING_CONTRACT_ADDRESS || '';
  }

  /**
   * Start the sync service
   * Requirements: 6.5, 6.7
   */
  async start(): Promise<void> {
    if (this.running) {
      console.warn('Sync service is already running');
      return;
    }

    this.running = true;
    console.log('Starting sync service...');

    // Initial sync with retry logic
    try {
      await this.syncAllWithRetry();
    } catch (error) {
      console.error('Initial sync failed after retries:', error);
      this.emitError(error as Error);
    }

    // Set up polling interval
    this.intervalId = setInterval(async () => {
      try {
        await this.syncAllWithRetry();
      } catch (error) {
        console.error('Sync failed after retries:', error);
        this.emitError(error as Error);
      }
    }, this.config.pollInterval);
  }

  /**
   * Stop the sync service
   */
  async stop(): Promise<void> {
    if (!this.running) return;

    this.running = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('Sync service stopped');
  }

  /**
   * Check if service is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Sync all event types with retry logic
   * Requirements: 6.7
   */
  private async syncAllWithRetry(): Promise<void> {
    await this.retryWithBackoff(async () => await this.syncAll());
  }

  /**
   * Sync all event types
   */
  private async syncAll(): Promise<void> {
    await this.syncProjects();
    await this.syncContributions();
    await this.syncWithdrawals();
    await this.syncRefunds();
  }

  /**
   * Sync project creation events
   * Requirements: 6.1, 6.7
   */
  async syncProjects(): Promise<void> {
    try {
      const events = await this.fetchEvents('ProjectCreated');
      const sortedEvents = this.sortEventsByBlockHeight(events);

      for (const event of sortedEvents) {
        await this.processProjectCreatedEvent(event);
      }
    } catch (error) {
      console.error('Error syncing projects:', error);
      this.logSyncError('syncProjects', error as Error);
      throw error;
    }
  }

  /**
   * Sync contribution events
   * Requirements: 6.2, 6.7
   */
  async syncContributions(): Promise<void> {
    try {
      const events = await this.fetchEvents('ContributionMade');
      const sortedEvents = this.sortEventsByBlockHeight(events);

      for (const event of sortedEvents) {
        await this.processContributionMadeEvent(event);
      }
    } catch (error) {
      console.error('Error syncing contributions:', error);
      this.logSyncError('syncContributions', error as Error);
      throw error;
    }
  }

  /**
   * Sync withdrawal events
   * Requirements: 6.3, 6.7
   */
  async syncWithdrawals(): Promise<void> {
    try {
      const events = await this.fetchEvents('FundsWithdrawn');
      const sortedEvents = this.sortEventsByBlockHeight(events);

      for (const event of sortedEvents) {
        await this.processFundsWithdrawnEvent(event);
      }
    } catch (error) {
      console.error('Error syncing withdrawals:', error);
      this.logSyncError('syncWithdrawals', error as Error);
      throw error;
    }
  }

  /**
   * Sync refund events
   * Requirements: 6.4, 6.7
   */
  async syncRefunds(): Promise<void> {
    try {
      const events = await this.fetchEvents('RefundProcessed');
      const sortedEvents = this.sortEventsByBlockHeight(events);

      for (const event of sortedEvents) {
        await this.processRefundProcessedEvent(event);
      }
    } catch (error) {
      console.error('Error syncing refunds:', error);
      this.logSyncError('syncRefunds', error as Error);
      throw error;
    }
  }

  /**
   * Fetch events from Flow blockchain
   * Requirements: 6.5
   */
  private async fetchEvents(eventType: string): Promise<FlowEvent[]> {
    try {
      // Query events from Flow blockchain
      // This is a simplified version - in production you'd use Flow's event API
      const events: FlowEvent[] = [];
      
      // Note: FCL doesn't have a direct event query API yet
      // In production, you'd use Flow's Access API or a third-party indexer
      // For now, we'll return empty array and rely on transaction-based sync
      
      return events;
    } catch (error) {
      console.error(`Error fetching ${eventType} events:`, error);
      return [];
    }
  }

  /**
   * Sort events by block height and event index
   * Requirements: 6.6
   */
  private sortEventsByBlockHeight(events: FlowEvent[]): FlowEvent[] {
    // Create a copy to avoid mutating the original array
    return [...events].sort((a, b) => {
      if (a.blockHeight !== b.blockHeight) {
        return a.blockHeight - b.blockHeight;
      }
      return a.eventIndex - b.eventIndex;
    });
  }

  /**
   * Process ProjectCreated event
   */
  private async processProjectCreatedEvent(event: FlowEvent): Promise<void> {
    const { projectId, creator, title, goal, deadline } = event.data;

    // Check if project already exists
    const { data: existing } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('contract_id', projectId)
      .single();

    if (existing) {
      console.log(`Project ${projectId} already synced`);
      return;
    }

    // Ensure user exists
    await this.ensureUserExists(creator);

    // Create project in database
    await supabaseAdmin.from('projects').insert({
      contract_id: projectId,
      title: title,
      description: '', // Will be updated from contract query
      goal_amount: this.flowToMicroFlow(goal),
      current_amount: 0,
      deadline: new Date(deadline * 1000).toISOString(),
      creator_address: creator,
      status: 'active',
    } as any);

    console.log(`Synced project ${projectId}`);
  }

  /**
   * Process ContributionMade event
   */
  private async processContributionMadeEvent(event: FlowEvent): Promise<void> {
    const { projectId, contributor, amount } = event.data;

    // Ensure user exists
    await this.ensureUserExists(contributor);

    // Get project from database
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('contract_id', projectId)
      .single();

    if (!project) {
      console.warn(`Project ${projectId} not found for contribution`);
      return;
    }

    // Check if contribution already exists
    const { data: existing } = await supabaseAdmin
      .from('contributions')
      .select('id')
      .eq('tx_hash', event.transactionId)
      .single();

    if (existing) {
      console.log(`Contribution ${event.transactionId} already synced`);
      return;
    }

    // Create contribution
    await supabaseAdmin.from('contributions').insert({
      project_id: (project as any).id,
      contributor_address: contributor,
      amount: this.flowToMicroFlow(amount),
      tx_hash: event.transactionId,
    } as any);

    // Update project current_amount (trigger will handle this automatically)
    console.log(`Synced contribution to project ${projectId}`);
  }

  /**
   * Process FundsWithdrawn event
   */
  private async processFundsWithdrawnEvent(event: FlowEvent): Promise<void> {
    const { projectId, amount } = event.data;

    // Update project status to withdrawn
    await (supabaseAdmin
      .from('projects') as any)
      .update({ status: 'withdrawn' })
      .eq('contract_id', projectId);

    console.log(`Synced withdrawal for project ${projectId}`);
  }

  /**
   * Process RefundProcessed event
   */
  private async processRefundProcessedEvent(event: FlowEvent): Promise<void> {
    const { projectId, contributor, amount } = event.data;

    // Update project status if needed
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('status')
      .eq('contract_id', projectId)
      .single();

    if (project && (project as any).status === 'active') {
      await (supabaseAdmin
        .from('projects') as any)
        .update({ status: 'expired' })
        .eq('contract_id', projectId);
    }

    console.log(`Synced refund for project ${projectId}, contributor ${contributor}`);
  }

  /**
   * Ensure user exists in database
   */
  private async ensureUserExists(walletAddress: string): Promise<void> {
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (!existing) {
      await supabaseAdmin.from('users').insert({
        wallet_address: walletAddress,
      } as any);
    }
  }

  /**
   * Convert Flow to micro-Flow
   */
  private flowToMicroFlow(flow: number): number {
    return Math.floor(flow * 100_000_000);
  }

  /**
   * Retry with exponential backoff
   * Requirements: 6.7
   */
  private async retryWithBackoff(
    fn: () => Promise<void>,
    maxRetries = 5,
    baseDelay = 1000
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        await fn();
        // Success - log if this was a retry
        if (i > 0) {
          console.log(`Sync succeeded after ${i} retries`);
        }
        return;
      } catch (error) {
        lastError = error as Error;
        
        if (i === maxRetries - 1) {
          console.error(`Sync failed after ${maxRetries} retries:`, lastError);
          throw lastError;
        }
        
        const delay = baseDelay * Math.pow(2, i);
        console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms due to error: ${lastError.message}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // This should never be reached, but TypeScript needs it
    if (lastError) throw lastError;
  }

  /**
   * Log sync errors for monitoring
   * Requirements: 6.7
   */
  private logSyncError(operation: string, error: Error): void {
    const errorLog = {
      timestamp: new Date().toISOString(),
      operation,
      error: error.message,
      stack: error.stack,
      lastSyncedBlock: this.lastSyncedBlock,
    };
    
    console.error('[SyncService Error]', JSON.stringify(errorLog, null, 2));
  }

  /**
   * Register error callback
   * Requirements: 6.7
   */
  onError(callback: (error: Error) => void): () => void {
    this.errorCallbacks.push(callback);
    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Emit error to all callbacks
   */
  private emitError(error: Error): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (err) {
        console.error('Error in error callback:', err);
      }
    });
  }

  /**
   * Process a single event
   * Requirements: 6.5, 6.6
   */
  async processEvent(event: FlowEvent): Promise<void> {
    switch (event.type) {
      case 'ProjectCreated':
        await this.processProjectCreatedEvent(event);
        break;
      case 'ContributionMade':
        await this.processContributionMadeEvent(event);
        break;
      case 'FundsWithdrawn':
        await this.processFundsWithdrawnEvent(event);
        break;
      case 'RefundProcessed':
        await this.processRefundProcessedEvent(event);
        break;
      default:
        console.warn(`Unknown event type: ${event.type}`);
    }

    // Update last synced block
    if (event.blockHeight > this.lastSyncedBlock) {
      this.lastSyncedBlock = event.blockHeight;
    }
  }
}
