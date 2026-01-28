/**
 * ProjectRepository Tests
 * 
 * Tests for the ProjectRepository data access layer.
 * Validates CRUD operations, filtering, sorting, and error handling.
 * 
 * Validates: Requirements 2.2, 2.6, 5.3, 5.4
 */

// Mock the Supabase client BEFORE importing anything else
jest.mock('../supabase/server', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

import { ProjectRepository, ProjectData, ProjectFilters } from './project.repository';
import { ProjectStatus } from '../models/project';
import { supabaseAdmin } from '../supabase/server';

describe('ProjectRepository', () => {
  let repository: ProjectRepository;
  let mockQueryBuilder: any;

  beforeEach(() => {
    repository = new ProjectRepository();
    jest.clearAllMocks();

    // Create a chainable mock query builder
    mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    (supabaseAdmin.from as jest.Mock) = jest.fn(() => mockQueryBuilder);
  });

  describe('create', () => {
    it('should create a new project with valid data', async () => {
      const projectData: ProjectData = {
        title: 'Test Project',
        description: 'A test project description',
        fundingGoal: 10000n,
        fundraiserAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        deadline: new Date('2025-12-31'),
        imageUrl: 'https://example.com/image.jpg',
        category: 'Technology',
      };

      const mockRow = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: projectData.title,
        description: projectData.description,
        funding_goal: 10000,
        total_raised: 0,
        contributor_count: 0,
        fundraiser_address: projectData.fundraiserAddress,
        status: 'draft',
        deadline: projectData.deadline.toISOString(),
        image_url: projectData.imageUrl,
        category: projectData.category,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        published_at: null,
      };

      mockQueryBuilder.single.mockResolvedValue({ data: mockRow, error: null });

      const result = await repository.create(projectData);

      expect(supabaseAdmin.from).toHaveBeenCalledWith('projects');
      expect(mockQueryBuilder.insert).toHaveBeenCalled();
      expect(result.id).toBe(mockRow.id);
      expect(result.title).toBe(projectData.title);
      expect(result.fundingGoal).toBe(10000n);
    });

    it('should throw error when creation fails', async () => {
      const projectData: ProjectData = {
        title: 'Test Project',
        description: 'A test project description',
        fundingGoal: 10000n,
        fundraiserAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        deadline: new Date('2025-12-31'),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(repository.create(projectData)).rejects.toThrow(
        'Failed to create project: Database error'
      );
    });
  });

  describe('update', () => {
    it('should update project with partial data', async () => {
      const projectId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData: Partial<ProjectData> = {
        title: 'Updated Title',
        description: 'Updated description',
      };

      const mockRow = {
        id: projectId,
        title: updateData.title,
        description: updateData.description,
        funding_goal: 10000,
        total_raised: 0,
        contributor_count: 0,
        fundraiser_address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        status: 'draft',
        deadline: new Date('2025-12-31').toISOString(),
        image_url: null,
        category: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        published_at: null,
      };

      mockQueryBuilder.single.mockResolvedValue({ data: mockRow, error: null });

      const result = await repository.update(projectId, updateData);

      expect(supabaseAdmin.from).toHaveBeenCalledWith('projects');
      expect(mockQueryBuilder.update).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', projectId);
      expect(result.title).toBe(updateData.title);
    });
  });

  describe('delete', () => {
    it('should delete a project by id', async () => {
      const projectId = '123e4567-e89b-12d3-a456-426614174000';

      mockQueryBuilder.eq.mockResolvedValue({ error: null });

      await repository.delete(projectId);

      expect(supabaseAdmin.from).toHaveBeenCalledWith('projects');
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', projectId);
    });
  });

  describe('findById', () => {
    it('should find a project by id', async () => {
      const projectId = '123e4567-e89b-12d3-a456-426614174000';
      const mockRow = {
        id: projectId,
        title: 'Test Project',
        description: 'Test description',
        funding_goal: 10000,
        total_raised: 5000,
        contributor_count: 10,
        fundraiser_address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        status: 'active',
        deadline: new Date('2025-12-31').toISOString(),
        image_url: null,
        category: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
      };

      mockQueryBuilder.single.mockResolvedValue({ data: mockRow, error: null });

      const result = await repository.findById(projectId);

      expect(supabaseAdmin.from).toHaveBeenCalledWith('projects');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', projectId);
      expect(result).not.toBeNull();
      expect(result?.id).toBe(projectId);
      expect(result?.fundingGoal).toBe(10000n);
    });

    it('should return null when project not found', async () => {
      const projectId = '123e4567-e89b-12d3-a456-426614174000';

      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const result = await repository.findById(projectId);

      expect(result).toBeNull();
    });
  });

  describe('find', () => {
    const mockProjects = [
      {
        id: '1',
        title: 'Project 1',
        description: 'Description 1',
        funding_goal: 10000,
        total_raised: 5000,
        contributor_count: 10,
        fundraiser_address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        status: 'active',
        deadline: new Date('2025-12-31').toISOString(),
        image_url: null,
        category: 'Technology',
        created_at: new Date('2024-01-01').toISOString(),
        updated_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Project 2',
        description: 'Description 2',
        funding_goal: 20000,
        total_raised: 15000,
        contributor_count: 20,
        fundraiser_address: 'ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        status: 'active',
        deadline: new Date('2025-06-30').toISOString(),
        image_url: null,
        category: 'Art',
        created_at: new Date('2024-02-01').toISOString(),
        updated_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
      },
    ];

    beforeEach(() => {
      // Make the query builder thenable so it can be awaited
      mockQueryBuilder.then = function(resolve: any) {
        return Promise.resolve({ data: mockProjects, error: null }).then(resolve);
      };
    });

    it('should find all projects without filters', async () => {
      const result = await repository.find();

      expect(supabaseAdmin.from).toHaveBeenCalledWith('projects');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(mockQueryBuilder.order).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should filter projects by status', async () => {
      const filters: ProjectFilters = {
        status: [ProjectStatus.ACTIVE],
      };

      const result = await repository.find(filters);

      expect(mockQueryBuilder.in).toHaveBeenCalledWith('status', [ProjectStatus.ACTIVE]);
      expect(result).toHaveLength(2);
    });

    it('should filter projects by category', async () => {
      const filters: ProjectFilters = {
        category: 'Technology',
      };

      const result = await repository.find(filters);

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('category', 'Technology');
      expect(result).toHaveLength(2);
    });

    it('should sort projects by newest', async () => {
      const filters: ProjectFilters = {
        sortBy: 'newest',
      };

      await repository.find(filters);

      expect(mockQueryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should sort projects by most funded', async () => {
      const filters: ProjectFilters = {
        sortBy: 'mostFunded',
      };

      await repository.find(filters);

      expect(mockQueryBuilder.order).toHaveBeenCalledWith('total_raised', { ascending: false });
    });

    it('should sort projects by ending soon', async () => {
      const filters: ProjectFilters = {
        sortBy: 'endingSoon',
      };

      await repository.find(filters);

      expect(mockQueryBuilder.order).toHaveBeenCalledWith('deadline', { ascending: true });
    });

    it('should apply limit', async () => {
      const filters: ProjectFilters = {
        limit: 10,
      };

      await repository.find(filters);

      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10);
    });

    it('should apply offset with range', async () => {
      const filters: ProjectFilters = {
        limit: 10,
        offset: 20,
      };

      await repository.find(filters);

      expect(mockQueryBuilder.range).toHaveBeenCalledWith(20, 29);
    });
  });

  describe('updateStatus', () => {
    it('should update project status', async () => {
      const projectId = '123e4567-e89b-12d3-a456-426614174000';
      const newStatus = ProjectStatus.ACTIVE;

      mockQueryBuilder.eq.mockResolvedValue({ error: null });

      await repository.updateStatus(projectId, newStatus);

      expect(supabaseAdmin.from).toHaveBeenCalledWith('projects');
      expect(mockQueryBuilder.update).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', projectId);
    });
  });

  describe('updateMetrics', () => {
    it('should update project funding metrics', async () => {
      const projectId = '123e4567-e89b-12d3-a456-426614174000';
      const metrics = {
        totalRaised: 15000n,
        contributorCount: 25,
      };

      mockQueryBuilder.eq.mockResolvedValue({ error: null });

      await repository.updateMetrics(projectId, metrics);

      expect(supabaseAdmin.from).toHaveBeenCalledWith('projects');
      expect(mockQueryBuilder.update).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', projectId);
    });
  });
});
