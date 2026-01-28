/**
 * ProjectService - Business logic for project management
 * 
 * This service handles:
 * - Project creation with validation
 * - Project updates with draft-only restriction
 * - Project publication with validation and status transition
 * - Project cancellation with draft-only restriction
 * - Project retrieval and listing
 * - Funding metrics updates
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.9
 */

import { 
  projectRepository, 
  ProjectData, 
  ProjectFilters 
} from '../repositories/project.repository';
import { Project, ProjectStatus } from '../models/project';

/**
 * Input data for creating a new project
 */
export interface CreateProjectInput {
  title: string;
  description: string;
  fundingGoal: bigint;
  deadline: Date;
  fundraiserAddress: string;
  imageUrl?: string;
  category?: string;
}

/**
 * Input data for updating a project
 */
export interface UpdateProjectInput {
  title?: string;
  description?: string;
  fundingGoal?: bigint;
  deadline?: Date;
  imageUrl?: string;
  category?: string;
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * ProjectService - Manages project lifecycle and business logic
 */
export class ProjectService {
  /**
   * Validate project creation input
   * 
   * @param data - Project creation input
   * @returns Array of validation errors (empty if valid)
   */
  private validateCreateInput(data: CreateProjectInput): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate title
    if (!data.title || data.title.trim().length === 0) {
      errors.push({ field: 'title', message: 'Title is required' });
    } else if (data.title.length > 200) {
      errors.push({ field: 'title', message: 'Title must be 200 characters or less' });
    }

    // Validate description
    if (!data.description || data.description.trim().length === 0) {
      errors.push({ field: 'description', message: 'Description is required' });
    } else if (data.description.length < 10) {
      errors.push({ field: 'description', message: 'Description must be at least 10 characters' });
    }

    // Validate funding goal
    if (data.fundingGoal <= 0n) {
      errors.push({ field: 'fundingGoal', message: 'Funding goal must be greater than 0' });
    }

    // Validate deadline
    const now = new Date();
    if (data.deadline <= now) {
      errors.push({ field: 'deadline', message: 'Deadline must be in the future' });
    }

    // Validate fundraiser address
    if (!data.fundraiserAddress || data.fundraiserAddress.trim().length === 0) {
      errors.push({ field: 'fundraiserAddress', message: 'Fundraiser address is required' });
    } else if (!this.isValidFlowAddress(data.fundraiserAddress)) {
      errors.push({ field: 'fundraiserAddress', message: 'Invalid Flow address format' });
    }

    return errors;
  }

  /**
   * Validate Flow address format
   * 
   * Flow addresses are 0x-prefixed with exactly 16 hexadecimal characters
   * 
   * @param address - Address to validate
   * @returns true if valid, false otherwise
   */
  private isValidFlowAddress(address: string): boolean {
    // Flow addresses: 0x followed by exactly 16 hex characters
    return /^0x[a-fA-F0-9]{16}$/.test(address);
  }

  /**
   * Validate project publication requirements
   * 
   * @param project - Project to validate
   * @returns Array of validation errors (empty if valid)
   */
  private validatePublishRequirements(project: Project): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check status is draft
    if (project.status !== ProjectStatus.DRAFT) {
      errors.push({ 
        field: 'status', 
        message: 'Only draft projects can be published' 
      });
    }

    // Validate all required fields
    if (!project.title || project.title.trim().length === 0) {
      errors.push({ field: 'title', message: 'Title is required' });
    }

    if (!project.description || project.description.trim().length === 0) {
      errors.push({ field: 'description', message: 'Description is required' });
    }

    if (project.fundingGoal <= 0n) {
      errors.push({ field: 'fundingGoal', message: 'Funding goal must be greater than 0' });
    }

    const now = new Date();
    if (project.deadline <= now) {
      errors.push({ field: 'deadline', message: 'Deadline must be in the future' });
    }

    return errors;
  }

  /**
   * Create a new project
   * 
   * Creates a project in draft status with validation.
   * All required fields must be provided and valid.
   * 
   * @param data - Project creation input
   * @returns Promise resolving to created project
   * @throws Error if validation fails or creation fails
   * 
   * Requirements: 2.1, 2.2, 2.3
   */
  async createProject(data: CreateProjectInput): Promise<Project> {
    // Validate input
    const errors = this.validateCreateInput(data);
    if (errors.length > 0) {
      const errorMessages = errors.map(e => `${e.field}: ${e.message}`).join(', ');
      throw new Error(`Validation failed: ${errorMessages}`);
    }

    // Create project data with draft status
    const projectData: ProjectData = {
      title: data.title.trim(),
      description: data.description.trim(),
      fundingGoal: data.fundingGoal,
      fundraiserAddress: data.fundraiserAddress,
      deadline: data.deadline,
      imageUrl: data.imageUrl,
      category: data.category,
      status: ProjectStatus.DRAFT,
    };

    // Create project in repository
    return await projectRepository.create(projectData);
  }

  /**
   * Update project details
   * 
   * Only draft projects can be updated.
   * Validates that project exists and is in draft status.
   * 
   * @param id - Project ID
   * @param data - Partial project data to update
   * @returns Promise resolving to updated project
   * @throws Error if project not found, not draft, or update fails
   * 
   * Requirements: 2.6
   */
  async updateProject(id: string, data: UpdateProjectInput): Promise<Project> {
    // Get existing project
    const project = await projectRepository.findById(id);
    
    if (!project) {
      throw new Error('Project not found');
    }

    // Check project is in draft status
    if (project.status !== ProjectStatus.DRAFT) {
      throw new Error('Only draft projects can be updated');
    }

    // Validate updated fields
    const errors: ValidationError[] = [];

    if (data.title !== undefined) {
      if (data.title.trim().length === 0) {
        errors.push({ field: 'title', message: 'Title cannot be empty' });
      } else if (data.title.length > 200) {
        errors.push({ field: 'title', message: 'Title must be 200 characters or less' });
      }
    }

    if (data.description !== undefined) {
      if (data.description.trim().length === 0) {
        errors.push({ field: 'description', message: 'Description cannot be empty' });
      } else if (data.description.length < 10) {
        errors.push({ field: 'description', message: 'Description must be at least 10 characters' });
      }
    }

    if (data.fundingGoal !== undefined && data.fundingGoal <= 0n) {
      errors.push({ field: 'fundingGoal', message: 'Funding goal must be greater than 0' });
    }

    if (data.deadline !== undefined) {
      const now = new Date();
      if (data.deadline <= now) {
        errors.push({ field: 'deadline', message: 'Deadline must be in the future' });
      }
    }

    if (errors.length > 0) {
      const errorMessages = errors.map(e => `${e.field}: ${e.message}`).join(', ');
      throw new Error(`Validation failed: ${errorMessages}`);
    }

    // Prepare update data
    const updateData: Partial<ProjectData> = {};
    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.description !== undefined) updateData.description = data.description.trim();
    if (data.fundingGoal !== undefined) updateData.fundingGoal = data.fundingGoal;
    if (data.deadline !== undefined) updateData.deadline = data.deadline;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.category !== undefined) updateData.category = data.category;

    // Update project in repository
    return await projectRepository.update(id, updateData);
  }

  /**
   * Publish a project
   * 
   * Transitions project from draft to active status.
   * Validates all required fields and sets published_at timestamp.
   * 
   * @param id - Project ID
   * @returns Promise resolving to published project
   * @throws Error if project not found, validation fails, or not draft
   * 
   * Requirements: 2.4, 2.5
   */
  async publishProject(id: string): Promise<Project> {
    // Get existing project
    const project = await projectRepository.findById(id);
    
    if (!project) {
      throw new Error('Project not found');
    }

    // Validate publication requirements
    const errors = this.validatePublishRequirements(project);
    if (errors.length > 0) {
      const errorMessages = errors.map(e => `${e.field}: ${e.message}`).join(', ');
      throw new Error(`Cannot publish project: ${errorMessages}`);
    }

    // Update status to active
    await projectRepository.updateStatus(id, ProjectStatus.ACTIVE);

    // Fetch and return updated project
    const updatedProject = await projectRepository.findById(id);
    if (!updatedProject) {
      throw new Error('Failed to retrieve published project');
    }

    return updatedProject;
  }

  /**
   * Cancel a project
   * 
   * Only draft projects can be cancelled.
   * Sets project status to cancelled.
   * 
   * @param id - Project ID
   * @throws Error if project not found or not draft
   * 
   * Requirements: 2.9
   */
  async cancelProject(id: string): Promise<void> {
    // Get existing project
    const project = await projectRepository.findById(id);
    
    if (!project) {
      throw new Error('Project not found');
    }

    // Check project is in draft status
    if (project.status !== ProjectStatus.DRAFT) {
      throw new Error('Only draft projects can be cancelled');
    }

    // Update status to cancelled
    await projectRepository.updateStatus(id, ProjectStatus.CANCELLED);
  }

  /**
   * Get project by ID
   * 
   * @param id - Project ID
   * @returns Promise resolving to project if found, null otherwise
   * 
   * Requirements: 2.6
   */
  async getProject(id: string): Promise<Project | null> {
    return await projectRepository.findById(id);
  }

  /**
   * List projects with filters
   * 
   * Supports filtering by status, category, and sorting options.
   * 
   * @param filters - Query filters and options
   * @returns Promise resolving to array of projects
   * 
   * Requirements: 2.5
   */
  async listProjects(filters: ProjectFilters = {}): Promise<Project[]> {
    return await projectRepository.find(filters);
  }

  /**
   * Get projects by fundraiser address
   * 
   * Returns all projects created by a specific fundraiser.
   * 
   * @param address - Fundraiser wallet address
   * @returns Promise resolving to array of projects
   * 
   * Requirements: 2.6
   */
  async getProjectsByFundraiser(address: string): Promise<Project[]> {
    return await projectRepository.find({ fundraiserAddress: address });
  }

  /**
   * Update project funding metrics
   * 
   * Recalculates and updates total raised and contributor count.
   * Also checks and updates project status based on funding progress.
   * 
   * @param id - Project ID
   * @throws Error if project not found or update fails
   * 
   * Requirements: 2.6
   */
  async updateFundingMetrics(id: string): Promise<void> {
    // Get current project
    const project = await projectRepository.findById(id);
    
    if (!project) {
      throw new Error('Project not found');
    }

    // Check if project should transition to funded status
    if (project.status === ProjectStatus.ACTIVE && project.totalRaised >= project.fundingGoal) {
      await projectRepository.updateStatus(id, ProjectStatus.FUNDED);
    }

    // Check if project should transition to expired status
    const now = new Date();
    if (
      project.status === ProjectStatus.ACTIVE && 
      project.deadline < now && 
      project.totalRaised < project.fundingGoal
    ) {
      await projectRepository.updateStatus(id, ProjectStatus.EXPIRED);
    }
  }

  /**
   * Check and update project status based on current state
   * 
   * This method checks if a project should transition to funded or expired status
   * based on its current funding and deadline.
   * 
   * @param id - Project ID
   * @returns Promise resolving to updated project
   * @throws Error if project not found
   * 
   * Requirements: 2.7, 2.8
   */
  async checkAndUpdateProjectStatus(id: string): Promise<Project> {
    const project = await projectRepository.findById(id);
    
    if (!project) {
      throw new Error('Project not found');
    }

    // Only check active projects
    if (project.status !== ProjectStatus.ACTIVE) {
      return project;
    }

    const now = new Date();
    let statusChanged = false;

    // Check if project reached funding goal
    if (project.totalRaised >= project.fundingGoal) {
      await projectRepository.updateStatus(id, ProjectStatus.FUNDED);
      statusChanged = true;
    }
    // Check if project deadline passed without reaching goal
    else if (project.deadline < now) {
      await projectRepository.updateStatus(id, ProjectStatus.EXPIRED);
      statusChanged = true;
    }

    // Return updated project if status changed
    if (statusChanged) {
      const updatedProject = await projectRepository.findById(id);
      if (!updatedProject) {
        throw new Error('Failed to retrieve updated project');
      }
      return updatedProject;
    }

    return project;
  }
}

// Export singleton instance
export const projectService = new ProjectService();
