/**
 * ProjectRepository - Data access layer for projects
 * 
 * Provides CRUD operations and query methods for project data in Supabase.
 * Handles data transformation between database format and application models.
 * 
 * Validates: Requirements 2.2, 2.6, 5.3, 5.4, 7.5
 */

import { Database } from '../supabase/database.types';
import { Project, ProjectStatus, createProject } from '../models/project';
import { retryDatabaseOperation } from '../utils/retry';

type ProjectRow = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

/**
 * Lazy getter for supabaseAdmin to prevent client-side bundling
 * This should only be called in server-side code (API routes)
 */
function getSupabaseAdmin() {
  if (typeof window !== 'undefined') {
    throw new Error('ProjectRepository should only be used in server-side code (API routes)');
  }
  // Dynamic import to prevent client-side bundling
  const { supabaseAdmin } = require('../supabase/server');
  return supabaseAdmin;
}

/**
 * Input data for creating a new project
 */
export interface ProjectData {
  title: string;
  description: string;
  fundingGoal: bigint;
  fundraiserAddress: string;
  deadline: Date;
  imageUrl?: string;
  category?: string;
  status?: ProjectStatus;
}

/**
 * Filters for querying projects
 */
export interface ProjectFilters {
  status?: ProjectStatus[];
  category?: string;
  fundraiserAddress?: string;
  sortBy?: 'newest' | 'mostFunded' | 'endingSoon';
  limit?: number;
  offset?: number;
}

/**
 * Funding metrics for updating project statistics
 */
export interface FundingMetrics {
  totalRaised: bigint;
  contributorCount: number;
}

/**
 * ProjectRepository class providing data access methods for projects
 */
export class ProjectRepository {
  /**
   * Convert database row to Project model with computed properties
   */
  private rowToProject(row: ProjectRow): Project {
    // Support both old and new schema
    const rowAny = row as any;
    
    return createProject({
      id: row.id,
      title: row.title,
      description: row.description,
      // Try new schema first, fallback to old
      fundingGoal: BigInt(rowAny.goal_amount || rowAny.funding_goal || 0),
      totalRaised: BigInt(rowAny.current_amount || rowAny.total_raised || 0),
      contributorCount: rowAny.contributor_count || 0,
      // Try new schema first, fallback to old
      fundraiserAddress: rowAny.creator_address || rowAny.fundraiser_address || '',
      status: row.status as ProjectStatus,
      deadline: new Date(row.deadline),
      imageUrl: rowAny.image_url || undefined,
      category: rowAny.category || undefined,
      contractId: rowAny.contract_id || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      publishedAt: rowAny.published_at ? new Date(rowAny.published_at) : undefined,
    });
  }

  /**
   * Convert ProjectData to database insert format
   */
  private dataToInsert(data: ProjectData): ProjectInsert {
    // Map status to new schema values
    // New schema: ('active', 'funded', 'expired', 'withdrawn')
    // Old schema: ('draft', 'active', 'funded', 'expired', 'cancelled')
    let status = data.status || ProjectStatus.DRAFT;
    if (status === ProjectStatus.DRAFT || status === ProjectStatus.CANCELLED) {
      status = ProjectStatus.ACTIVE; // Map draft/cancelled to active for new schema
    }
    
    // Use the new schema column names (platform_modernization migration)
    const insert: any = {
      title: data.title,
      description: data.description,
      goal_amount: Number(data.fundingGoal),
      current_amount: 0,
      deadline: data.deadline.toISOString(),
      creator_address: data.fundraiserAddress,
      status: status,
    };
    
    // Add image_url if provided
    if (data.imageUrl) {
      insert.image_url = data.imageUrl;
    }
    
    // Note: contributor_count doesn't exist in new schema
    // Note: category doesn't exist in new schema
    
    return insert as ProjectInsert;
  }

  /**
   * Create a new project record
   * 
   * @param data - Project data to create
   * @returns Created project with computed properties
   * @throws Error if creation fails
   */
  async create(data: ProjectData): Promise<Project> {
    return retryDatabaseOperation(async () => {
      const insertData = this.dataToInsert(data);
      const supabaseAdmin = getSupabaseAdmin();
      
      const { data: row, error } = await supabaseAdmin
        .from('projects')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create project: ${error.message}`);
      }

      return this.rowToProject(row);
    });
  }

  /**
   * Update an existing project record
   * 
   * @param id - Project ID
   * @param data - Partial project data to update
   * @returns Updated project with computed properties
   * @throws Error if update fails or project not found
   */
  async update(id: string, data: Partial<ProjectData>): Promise<Project> {
    // Use any type for update data since schema may vary
    const updateData: any = {};
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.fundingGoal !== undefined) {
      // Try new schema first, fallback to old
      updateData.goal_amount = Number(data.fundingGoal);
      updateData.funding_goal = Number(data.fundingGoal);
    }
    if (data.deadline !== undefined) updateData.deadline = data.deadline.toISOString();
    // Image URL may not exist in new schema, but try to set it anyway
    if (data.imageUrl !== undefined) {
      updateData.image_url = data.imageUrl || null;
    }
    // Category column may not exist in all database migrations - skip if not available
    // if (data.category !== undefined) updateData.category = data.category || null;
    if (data.status !== undefined) updateData.status = data.status;
    
    // Always update the updated_at timestamp
    updateData.updated_at = new Date().toISOString();
    const supabaseAdmin = getSupabaseAdmin();

    const { data: row, error } = await supabaseAdmin
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update project: ${error.message}`);
    }

    return this.rowToProject(row);
  }

  /**
   * Delete a project record
   * 
   * @param id - Project ID to delete
   * @throws Error if deletion fails
   */
  async delete(id: string): Promise<void> {
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete project: ${error.message}`);
    }
  }

  /**
   * Find a project by ID
   * 
   * @param id - Project ID
   * @returns Project if found, null otherwise
   * @throws Error if query fails
   */
  async findById(id: string): Promise<Project | null> {
    const supabaseAdmin = getSupabaseAdmin();
    
    // Fetch project data
    const { data: row, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      throw new Error(`Failed to find project: ${error.message}`);
    }

    // Fetch contributor count from contributions table
    const { data: contributions, error: contribError } = await supabaseAdmin
      .from('contributions')
      .select('contributor_address')
      .eq('project_id', id);

    if (contribError) {
      console.error('Failed to fetch contributor count:', contribError);
    }

    // Calculate unique contributor count
    const uniqueContributors = contributions 
      ? new Set(contributions.map((c: any) => c.contributor_address)).size 
      : 0;

    // Add contributor count to row data
    const rowWithCount = {
      ...row,
      contributor_count: uniqueContributors
    };

    return this.rowToProject(rowWithCount);
  }

  /**
   * Find projects with optional filters and sorting
   * 
   * @param filters - Query filters and options
   * @returns Array of projects matching the filters
   * @throws Error if query fails
   */
  async find(filters: ProjectFilters = {}): Promise<Project[]> {
    const supabaseAdmin = getSupabaseAdmin();
    let query = supabaseAdmin.from('projects').select('*');

    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }

    // Apply category filter
    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    // Apply fundraiser filter
    if (filters.fundraiserAddress) {
      query = query.eq('fundraiser_address', filters.fundraiserAddress);
    }

    // Apply sorting
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'mostFunded':
          query = query.order('total_raised', { ascending: false });
          break;
        case 'endingSoon':
          query = query.order('deadline', { ascending: true });
          break;
      }
    } else {
      // Default sort by newest
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    if (filters.limit !== undefined) {
      query = query.limit(filters.limit);
    }
    if (filters.offset !== undefined) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
    }

    const { data: rows, error } = await query;

    if (error) {
      throw new Error(`Failed to find projects: ${error.message}`);
    }

    if (!rows) {
      return [];
    }

    // Fetch contributor counts for all projects
    const projectIds = rows.map((row: ProjectRow) => row.id);
    const { data: contributions, error: contribError } = await supabaseAdmin
      .from('contributions')
      .select('project_id, contributor_address')
      .in('project_id', projectIds);

    if (contribError) {
      console.error('Failed to fetch contributor counts:', contribError);
    }

    // Calculate contributor counts per project
    const contributorCounts = new Map<string, number>();
    if (contributions) {
      const contributorsByProject = new Map<string, Set<string>>();
      contributions.forEach((c: any) => {
        if (!contributorsByProject.has(c.project_id)) {
          contributorsByProject.set(c.project_id, new Set());
        }
        contributorsByProject.get(c.project_id)!.add(c.contributor_address);
      });
      contributorsByProject.forEach((contributors, projectId) => {
        contributorCounts.set(projectId, contributors.size);
      });
    }

    // Add contributor counts to rows
    const rowsWithCounts = rows.map((row: ProjectRow) => ({
      ...row,
      contributor_count: contributorCounts.get(row.id) || 0
    }));

    return rowsWithCounts.map((row: ProjectRow) => this.rowToProject(row));
  }

  /**
   * Update project status
   * 
   * @param id - Project ID
   * @param status - New status
   * @throws Error if update fails
   */
  async updateStatus(id: string, status: ProjectStatus): Promise<void> {
    const updateData: ProjectUpdate = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Set published_at when transitioning to active
    if (status === ProjectStatus.ACTIVE) {
      updateData.published_at = new Date().toISOString();
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from('projects')
      .update(updateData)
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update project status: ${error.message}`);
    }
  }

  /**
   * Update project funding metrics
   * 
   * @param id - Project ID
   * @param metrics - Funding metrics to update
   * @throws Error if update fails
   */
  async updateMetrics(id: string, metrics: FundingMetrics): Promise<void> {
    const updateData: ProjectUpdate = {
      total_raised: Number(metrics.totalRaised),
      contributor_count: metrics.contributorCount,
      updated_at: new Date().toISOString(),
    };

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from('projects')
      .update(updateData)
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update project metrics: ${error.message}`);
    }
  }
}

// Export singleton instance
export const projectRepository = new ProjectRepository();
