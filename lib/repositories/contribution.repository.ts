/**
 * ContributionRepository - Data access layer for contributions
 * 
 * Provides CRUD operations and query methods for contribution data in Supabase.
 * Handles data transformation between database format and application models.
 * 
 * Validates: Requirements 3.5, 7.4, 7.5
 */

import { Database } from '../supabase/database.types';
import { Contribution, createContribution } from '../models/project';
import { retryDatabaseOperation } from '../utils/retry';

type ContributionRow = Database['public']['Tables']['contributions']['Row'];
type ContributionInsert = Database['public']['Tables']['contributions']['Insert'];

/**
 * Lazy getter for supabaseAdmin to prevent client-side bundling
 * This should only be called in server-side code (API routes)
 */
function getSupabaseAdmin() {
  if (typeof window !== 'undefined') {
    throw new Error('ContributionRepository should only be used in server-side code (API routes)');
  }
  // Dynamic import to prevent client-side bundling
  const { supabaseAdmin } = require('../supabase/server');
  return supabaseAdmin;
}

/**
 * Input data for creating a new contribution
 */
export interface ContributionData {
  projectId: string;
  contributorAddress: string;
  amount: bigint;
  txId: string;
  blockHeight: number;
}

/**
 * Statistics about contributions to a project
 */
export interface ContributionStats {
  totalRaised: bigint;
  contributorCount: number;
  averageContribution: bigint;
  largestContribution: bigint;
}

/**
 * ContributionRepository class providing data access methods for contributions
 */
export class ContributionRepository {
  /**
   * Convert database row to Contribution model
   */
  private rowToContribution(row: ContributionRow): Contribution {
    return createContribution({
      id: row.id,
      projectId: row.project_id,
      contributorAddress: row.contributor_address,
      amount: BigInt(row.amount),
      txId: row.tx_hash,
      blockHeight: 0, // tx_hash schema doesn't have block_height
      createdAt: new Date(row.created_at),
    });
  }

  /**
   * Convert ContributionData to database insert format
   */
  private dataToInsert(data: ContributionData): ContributionInsert {
    // Convert bigint to number for database
    // Note: PostgreSQL BIGINT can handle up to 2^63-1, but JavaScript Number.MAX_SAFE_INTEGER is 2^53-1
    // For values larger than MAX_SAFE_INTEGER, we need to use string representation
    const amountValue = data.amount > BigInt(Number.MAX_SAFE_INTEGER)
      ? Number(data.amount.toString()) // This will lose precision for very large values
      : Number(data.amount);
    
    // Validate amount is within safe range
    if (amountValue > Number.MAX_SAFE_INTEGER) {
      throw new Error(`Amount ${data.amount.toString()} exceeds maximum safe integer value`);
    }
    
    return {
      project_id: data.projectId,
      contributor_address: data.contributorAddress,
      amount: amountValue,
      tx_hash: data.txId,
    };
  }

  /**
   * Create a new contribution record
   * 
   * @param data - Contribution data to create
   * @returns Created contribution
   * @throws Error if creation fails
   */
  async create(data: ContributionData): Promise<Contribution> {
    return retryDatabaseOperation(async () => {
      const insertData = this.dataToInsert(data);
      const supabaseAdmin = getSupabaseAdmin();
      
      console.log('Creating contribution with data:', {
        project_id: insertData.project_id,
        contributor_address: insertData.contributor_address,
        amount: insertData.amount,
        tx_hash: insertData.tx_hash,
      });
      
      const { data: row, error } = await supabaseAdmin
        .from('contributions')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating contribution:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          insertData,
        });
        throw new Error(`Failed to create contribution: ${error.message}${error.details ? ` - ${error.details}` : ''}${error.hint ? ` (${error.hint})` : ''}`);
      }

      if (!row) {
        throw new Error('Failed to create contribution: No data returned from insert');
      }

      return this.rowToContribution(row);
    });
  }

  /**
   * Find a contribution by transaction ID
   * 
   * @param txId - Transaction ID
   * @returns Contribution if found, null otherwise
   * @throws Error if query fails
   */
  async findByTxId(txId: string): Promise<Contribution | null> {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: row, error } = await supabaseAdmin
      .from('contributions')
      .select('*')
      .eq('tx_hash', txId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      throw new Error(`Failed to find contribution: ${error.message}`);
    }

    return this.rowToContribution(row);
  }

  /**
   * Find contributions for a specific project
   * 
   * @param projectId - Project ID
   * @param limit - Maximum number of contributions to return (optional)
   * @returns Array of contributions for the project
   * @throws Error if query fails
   */
  async findByProject(projectId: string, limit?: number): Promise<Contribution[]> {
    const supabaseAdmin = getSupabaseAdmin();
    let query = supabaseAdmin
      .from('contributions')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (limit !== undefined) {
      query = query.limit(limit);
    }

    const { data: rows, error } = await query;

    if (error) {
      throw new Error(`Failed to find contributions by project: ${error.message}`);
    }

    if (!rows) {
      return [];
    }

    return rows.map((row: ContributionRow) => this.rowToContribution(row));
  }

  /**
   * Find contributions by a specific contributor
   * 
   * @param address - Contributor wallet address
   * @returns Array of contributions by the contributor
   * @throws Error if query fails
   */
  async findByContributor(address: string): Promise<Contribution[]> {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: rows, error } = await supabaseAdmin
      .from('contributions')
      .select('*')
      .eq('contributor_address', address)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find contributions by contributor: ${error.message}`);
    }

    if (!rows) {
      return [];
    }

    return rows.map((row: ContributionRow) => this.rowToContribution(row));
  }

  /**
   * Get aggregated statistics for a project's contributions
   * 
   * @param projectId - Project ID
   * @returns Contribution statistics
   * @throws Error if query fails
   */
  async getStats(projectId: string): Promise<ContributionStats> {
    // Get all contributions for the project
    const supabaseAdmin = getSupabaseAdmin();
    const { data: rows, error } = await supabaseAdmin
      .from('contributions')
      .select('amount, contributor_address')
      .eq('project_id', projectId);

    if (error) {
      throw new Error(`Failed to get contribution stats: ${error.message}`);
    }

    if (!rows) {
      return {
        totalRaised: 0n,
        contributorCount: 0,
        averageContribution: 0n,
        largestContribution: 0n,
      };
    }

    // Calculate statistics
    if (rows.length === 0) {
      return {
        totalRaised: 0n,
        contributorCount: 0,
        averageContribution: 0n,
        largestContribution: 0n,
      };
    }

    const amounts = rows.map((row: Pick<ContributionRow, 'amount'>) => BigInt(row.amount));
    const totalRaised = amounts.reduce((sum: bigint, amount: bigint) => sum + amount, 0n);
    const uniqueContributors = new Set(rows.map((row: Pick<ContributionRow, 'contributor_address'>) => row.contributor_address));
    const contributorCount = uniqueContributors.size;
    const averageContribution = totalRaised / BigInt(rows.length);
    const largestContribution = amounts.reduce((max: bigint, amount: bigint) => amount > max ? amount : max, 0n);

    return {
      totalRaised,
      contributorCount,
      averageContribution,
      largestContribution,
    };
  }
}

// Export singleton instance
export const contributionRepository = new ContributionRepository();
