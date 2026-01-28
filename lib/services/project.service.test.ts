/**
 * Unit tests for ProjectService
 * 
 * Tests business logic for project management including:
 * - Project creation with validation
 * - Project updates with draft-only restriction
 * - Project publication with validation
 * - Project cancellation with draft-only restriction
 * - Project retrieval and listing
 * - Funding metrics updates
 */

import { ProjectService } from './project.service';
import { projectRepository } from '../repositories/project.repository';
import { Project, ProjectStatus } from '../models/project';

// Mock the project repository
jest.mock('../repositories/project.repository', () => ({
  projectRepository: {
    create: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    updateStatus: jest.fn(),
    updateMetrics: jest.fn(),
  },
}));

describe('ProjectService', () => {
  let service: ProjectService;
  
  beforeEach(() => {
    service = new ProjectService();
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    const validInput = {
      title: 'Test Project',
      description: 'This is a test project description',
      fundingGoal: 10000n,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      fundraiserAddress: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
      imageUrl: 'https://example.com/image.jpg',
      category: 'Technology',
    };

    it('should create a project with valid input', async () => {
      const mockProject: Project = {
        id: '123',
        ...validInput,
        totalRaised: 0n,
        contributorCount: 0,
        status: ProjectStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
        percentFunded: 0,
        timeRemaining: 30 * 24 * 60 * 60 * 1000,
        isActive: false,
        isFunded: false,
        isExpired: false,
      };

      (projectRepository.create as jest.Mock).mockResolvedValue(mockProject);

      const result = await service.createProject(validInput);

      expect(result).toEqual(mockProject);
      expect(projectRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: validInput.title,
          description: validInput.description,
          fundingGoal: validInput.fundingGoal,
          deadline: validInput.deadline,
          fundraiserAddress: validInput.fundraiserAddress,
          status: ProjectStatus.DRAFT,
        })
      );
    });

    it('should reject project with empty title', async () => {
      const invalidInput = { ...validInput, title: '' };

      await expect(service.createProject(invalidInput)).rejects.toThrow(
        'Validation failed: title: Title is required'
      );
    });

    it('should reject project with title too long', async () => {
      const invalidInput = { ...validInput, title: 'a'.repeat(201) };

      await expect(service.createProject(invalidInput)).rejects.toThrow(
        'title: Title must be 200 characters or less'
      );
    });

    it('should reject project with empty description', async () => {
      const invalidInput = { ...validInput, description: '' };

      await expect(service.createProject(invalidInput)).rejects.toThrow(
        'description: Description is required'
      );
    });

    it('should reject project with description too short', async () => {
      const invalidInput = { ...validInput, description: 'short' };

      await expect(service.createProject(invalidInput)).rejects.toThrow(
        'description: Description must be at least 10 characters'
      );
    });

    it('should reject project with zero funding goal', async () => {
      const invalidInput = { ...validInput, fundingGoal: 0n };

      await expect(service.createProject(invalidInput)).rejects.toThrow(
        'fundingGoal: Funding goal must be greater than 0'
      );
    });

    it('should reject project with negative funding goal', async () => {
      const invalidInput = { ...validInput, fundingGoal: -1000n };

      await expect(service.createProject(invalidInput)).rejects.toThrow(
        'fundingGoal: Funding goal must be greater than 0'
      );
    });

    it('should reject project with deadline in the past', async () => {
      const invalidInput = {
        ...validInput,
        deadline: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      };

      await expect(service.createProject(invalidInput)).rejects.toThrow(
        'deadline: Deadline must be in the future'
      );
    });

    it('should reject project with invalid Stacks address', async () => {
      const invalidInput = { ...validInput, fundraiserAddress: 'invalid-address' };

      await expect(service.createProject(invalidInput)).rejects.toThrow(
        'fundraiserAddress: Invalid Stacks address format'
      );
    });

    it('should accept mainnet Stacks address (SP)', async () => {
      const mockProject: Project = {
        id: '123',
        ...validInput,
        fundraiserAddress: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
        totalRaised: 0n,
        contributorCount: 0,
        status: ProjectStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
        percentFunded: 0,
        timeRemaining: 30 * 24 * 60 * 60 * 1000,
        isActive: false,
        isFunded: false,
        isExpired: false,
      };

      (projectRepository.create as jest.Mock).mockResolvedValue(mockProject);

      await expect(
        service.createProject({
          ...validInput,
          fundraiserAddress: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
        })
      ).resolves.toBeDefined();
    });

    it('should accept testnet Stacks address (ST)', async () => {
      const mockProject: Project = {
        id: '123',
        ...validInput,
        fundraiserAddress: 'ST2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
        totalRaised: 0n,
        contributorCount: 0,
        status: ProjectStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
        percentFunded: 0,
        timeRemaining: 30 * 24 * 60 * 60 * 1000,
        isActive: false,
        isFunded: false,
        isExpired: false,
      };

      (projectRepository.create as jest.Mock).mockResolvedValue(mockProject);

      await expect(
        service.createProject({
          ...validInput,
          fundraiserAddress: 'ST2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
        })
      ).resolves.toBeDefined();
    });
  });

  describe('updateProject', () => {
    const mockDraftProject: Project = {
      id: '123',
      title: 'Original Title',
      description: 'Original description',
      fundingGoal: 10000n,
      totalRaised: 0n,
      contributorCount: 0,
      fundraiserAddress: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
      status: ProjectStatus.DRAFT,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
      percentFunded: 0,
      timeRemaining: 30 * 24 * 60 * 60 * 1000,
      isActive: false,
      isFunded: false,
      isExpired: false,
    };

    it('should update draft project with valid data', async () => {
      (projectRepository.findById as jest.Mock).mockResolvedValue(mockDraftProject);
      
      const updatedProject = { ...mockDraftProject, title: 'Updated Title' };
      (projectRepository.update as jest.Mock).mockResolvedValue(updatedProject);

      const result = await service.updateProject('123', { title: 'Updated Title' });

      expect(result.title).toBe('Updated Title');
      expect(projectRepository.update).toHaveBeenCalledWith('123', { title: 'Updated Title' });
    });

    it('should reject update if project not found', async () => {
      (projectRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateProject('123', { title: 'Updated Title' })
      ).rejects.toThrow('Project not found');
    });

    it('should reject update if project is not draft', async () => {
      const activeProject = { ...mockDraftProject, status: ProjectStatus.ACTIVE };
      (projectRepository.findById as jest.Mock).mockResolvedValue(activeProject);

      await expect(
        service.updateProject('123', { title: 'Updated Title' })
      ).rejects.toThrow('Only draft projects can be updated');
    });

    it('should reject update with empty title', async () => {
      (projectRepository.findById as jest.Mock).mockResolvedValue(mockDraftProject);

      await expect(
        service.updateProject('123', { title: '' })
      ).rejects.toThrow('title: Title cannot be empty');
    });

    it('should reject update with title too long', async () => {
      (projectRepository.findById as jest.Mock).mockResolvedValue(mockDraftProject);

      await expect(
        service.updateProject('123', { title: 'a'.repeat(201) })
      ).rejects.toThrow('title: Title must be 200 characters or less');
    });

    it('should reject update with empty description', async () => {
      (projectRepository.findById as jest.Mock).mockResolvedValue(mockDraftProject);

      await expect(
        service.updateProject('123', { description: '' })
      ).rejects.toThrow('description: Description cannot be empty');
    });

    it('should reject update with description too short', async () => {
      (projectRepository.findById as jest.Mock).mockResolvedValue(mockDraftProject);

      await expect(
        service.updateProject('123', { description: 'short' })
      ).rejects.toThrow('description: Description must be at least 10 characters');
    });

    it('should reject update with zero funding goal', async () => {
      (projectRepository.findById as jest.Mock).mockResolvedValue(mockDraftProject);

      await expect(
        service.updateProject('123', { fundingGoal: 0n })
      ).rejects.toThrow('fundingGoal: Funding goal must be greater than 0');
    });

    it('should reject update with deadline in the past', async () => {
      (projectRepository.findById as jest.Mock).mockResolvedValue(mockDraftProject);

      await expect(
        service.updateProject('123', {
          deadline: new Date(Date.now() - 24 * 60 * 60 * 1000),
        })
      ).rejects.toThrow('deadline: Deadline must be in the future');
    });
  });

  describe('publishProject', () => {
    const mockDraftProject: Project = {
      id: '123',
      title: 'Test Project',
      description: 'This is a test project description',
      fundingGoal: 10000n,
      totalRaised: 0n,
      contributorCount: 0,
      fundraiserAddress: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
      status: ProjectStatus.DRAFT,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
      percentFunded: 0,
      timeRemaining: 30 * 24 * 60 * 60 * 1000,
      isActive: false,
      isFunded: false,
      isExpired: false,
    };

    it('should publish valid draft project', async () => {
      (projectRepository.findById as jest.Mock)
        .mockResolvedValueOnce(mockDraftProject)
        .mockResolvedValueOnce({ ...mockDraftProject, status: ProjectStatus.ACTIVE });

      const result = await service.publishProject('123');

      expect(result.status).toBe(ProjectStatus.ACTIVE);
      expect(projectRepository.updateStatus).toHaveBeenCalledWith('123', ProjectStatus.ACTIVE);
    });

    it('should reject publish if project not found', async () => {
      (projectRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.publishProject('123')).rejects.toThrow('Project not found');
    });

    it('should reject publish if project is not draft', async () => {
      const activeProject = { ...mockDraftProject, status: ProjectStatus.ACTIVE };
      (projectRepository.findById as jest.Mock).mockResolvedValue(activeProject);

      await expect(service.publishProject('123')).rejects.toThrow(
        'Only draft projects can be published'
      );
    });

    it('should reject publish if title is empty', async () => {
      const invalidProject = { ...mockDraftProject, title: '' };
      (projectRepository.findById as jest.Mock).mockResolvedValue(invalidProject);

      await expect(service.publishProject('123')).rejects.toThrow(
        'title: Title is required'
      );
    });

    it('should reject publish if description is empty', async () => {
      const invalidProject = { ...mockDraftProject, description: '' };
      (projectRepository.findById as jest.Mock).mockResolvedValue(invalidProject);

      await expect(service.publishProject('123')).rejects.toThrow(
        'description: Description is required'
      );
    });

    it('should reject publish if funding goal is zero', async () => {
      const invalidProject = { ...mockDraftProject, fundingGoal: 0n };
      (projectRepository.findById as jest.Mock).mockResolvedValue(invalidProject);

      await expect(service.publishProject('123')).rejects.toThrow(
        'fundingGoal: Funding goal must be greater than 0'
      );
    });

    it('should reject publish if deadline is in the past', async () => {
      const invalidProject = {
        ...mockDraftProject,
        deadline: new Date(Date.now() - 24 * 60 * 60 * 1000),
      };
      (projectRepository.findById as jest.Mock).mockResolvedValue(invalidProject);

      await expect(service.publishProject('123')).rejects.toThrow(
        'deadline: Deadline must be in the future'
      );
    });
  });

  describe('cancelProject', () => {
    const mockDraftProject: Project = {
      id: '123',
      title: 'Test Project',
      description: 'This is a test project description',
      fundingGoal: 10000n,
      totalRaised: 0n,
      contributorCount: 0,
      fundraiserAddress: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
      status: ProjectStatus.DRAFT,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
      percentFunded: 0,
      timeRemaining: 30 * 24 * 60 * 60 * 1000,
      isActive: false,
      isFunded: false,
      isExpired: false,
    };

    it('should cancel draft project', async () => {
      (projectRepository.findById as jest.Mock).mockResolvedValue(mockDraftProject);

      await service.cancelProject('123');

      expect(projectRepository.updateStatus).toHaveBeenCalledWith('123', ProjectStatus.CANCELLED);
    });

    it('should reject cancel if project not found', async () => {
      (projectRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.cancelProject('123')).rejects.toThrow('Project not found');
    });

    it('should reject cancel if project is not draft', async () => {
      const activeProject = { ...mockDraftProject, status: ProjectStatus.ACTIVE };
      (projectRepository.findById as jest.Mock).mockResolvedValue(activeProject);

      await expect(service.cancelProject('123')).rejects.toThrow(
        'Only draft projects can be cancelled'
      );
    });

    it('should reject cancel if project is funded', async () => {
      const fundedProject = { ...mockDraftProject, status: ProjectStatus.FUNDED };
      (projectRepository.findById as jest.Mock).mockResolvedValue(fundedProject);

      await expect(service.cancelProject('123')).rejects.toThrow(
        'Only draft projects can be cancelled'
      );
    });
  });

  describe('getProject', () => {
    it('should return project if found', async () => {
      const mockProject: Project = {
        id: '123',
        title: 'Test Project',
        description: 'Test description',
        fundingGoal: 10000n,
        totalRaised: 5000n,
        contributorCount: 10,
        fundraiserAddress: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
        status: ProjectStatus.ACTIVE,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        percentFunded: 50,
        timeRemaining: 30 * 24 * 60 * 60 * 1000,
        isActive: true,
        isFunded: false,
        isExpired: false,
      };

      (projectRepository.findById as jest.Mock).mockResolvedValue(mockProject);

      const result = await service.getProject('123');

      expect(result).toEqual(mockProject);
    });

    it('should return null if project not found', async () => {
      (projectRepository.findById as jest.Mock).mockResolvedValue(null);

      const result = await service.getProject('123');

      expect(result).toBeNull();
    });
  });

  describe('listProjects', () => {
    it('should return list of projects', async () => {
      const mockProjects: Project[] = [
        {
          id: '1',
          title: 'Project 1',
          description: 'Description 1',
          fundingGoal: 10000n,
          totalRaised: 5000n,
          contributorCount: 10,
          fundraiserAddress: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
          status: ProjectStatus.ACTIVE,
          deadline: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          percentFunded: 50,
          timeRemaining: 1000,
          isActive: true,
          isFunded: false,
          isExpired: false,
        },
      ];

      (projectRepository.find as jest.Mock).mockResolvedValue(mockProjects);

      const result = await service.listProjects();

      expect(result).toEqual(mockProjects);
    });

    it('should pass filters to repository', async () => {
      (projectRepository.find as jest.Mock).mockResolvedValue([]);

      await service.listProjects({
        status: [ProjectStatus.ACTIVE],
        sortBy: 'newest',
        limit: 10,
      });

      expect(projectRepository.find).toHaveBeenCalledWith({
        status: [ProjectStatus.ACTIVE],
        sortBy: 'newest',
        limit: 10,
      });
    });
  });

  describe('getProjectsByFundraiser', () => {
    it('should return projects by fundraiser address', async () => {
      const mockProjects: Project[] = [
        {
          id: '1',
          title: 'Project 1',
          description: 'Description 1',
          fundingGoal: 10000n,
          totalRaised: 5000n,
          contributorCount: 10,
          fundraiserAddress: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
          status: ProjectStatus.ACTIVE,
          deadline: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          percentFunded: 50,
          timeRemaining: 1000,
          isActive: true,
          isFunded: false,
          isExpired: false,
        },
      ];

      (projectRepository.find as jest.Mock).mockResolvedValue(mockProjects);

      const result = await service.getProjectsByFundraiser('SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7');

      expect(result).toEqual(mockProjects);
      expect(projectRepository.find).toHaveBeenCalledWith({
        fundraiserAddress: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
      });
    });
  });

  describe('updateFundingMetrics', () => {
    it('should update status to funded when goal reached', async () => {
      const mockProject: Project = {
        id: '123',
        title: 'Test Project',
        description: 'Test description',
        fundingGoal: 10000n,
        totalRaised: 10000n, // Goal reached
        contributorCount: 10,
        fundraiserAddress: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
        status: ProjectStatus.ACTIVE,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        percentFunded: 100,
        timeRemaining: 30 * 24 * 60 * 60 * 1000,
        isActive: true,
        isFunded: true,
        isExpired: false,
      };

      (projectRepository.findById as jest.Mock).mockResolvedValue(mockProject);

      await service.updateFundingMetrics('123');

      expect(projectRepository.updateStatus).toHaveBeenCalledWith('123', ProjectStatus.FUNDED);
    });

    it('should update status to expired when deadline passed', async () => {
      const mockProject: Project = {
        id: '123',
        title: 'Test Project',
        description: 'Test description',
        fundingGoal: 10000n,
        totalRaised: 5000n, // Goal not reached
        contributorCount: 10,
        fundraiserAddress: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
        status: ProjectStatus.ACTIVE,
        deadline: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        createdAt: new Date(),
        updatedAt: new Date(),
        percentFunded: 50,
        timeRemaining: -24 * 60 * 60 * 1000,
        isActive: true,
        isFunded: false,
        isExpired: true,
      };

      (projectRepository.findById as jest.Mock).mockResolvedValue(mockProject);

      await service.updateFundingMetrics('123');

      expect(projectRepository.updateStatus).toHaveBeenCalledWith('123', ProjectStatus.EXPIRED);
    });

    it('should not update status if project is not active', async () => {
      const mockProject: Project = {
        id: '123',
        title: 'Test Project',
        description: 'Test description',
        fundingGoal: 10000n,
        totalRaised: 10000n,
        contributorCount: 10,
        fundraiserAddress: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
        status: ProjectStatus.DRAFT,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        percentFunded: 100,
        timeRemaining: 30 * 24 * 60 * 60 * 1000,
        isActive: false,
        isFunded: true,
        isExpired: false,
      };

      (projectRepository.findById as jest.Mock).mockResolvedValue(mockProject);

      await service.updateFundingMetrics('123');

      expect(projectRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should throw error if project not found', async () => {
      (projectRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.updateFundingMetrics('123')).rejects.toThrow('Project not found');
    });
  });

  describe('checkAndUpdateProjectStatus', () => {
    it('should transition active project to funded when goal reached', async () => {
      const mockProject: Project = {
        id: '123',
        title: 'Test Project',
        description: 'Test description',
        fundingGoal: 10000n,
        totalRaised: 10000n,
        contributorCount: 10,
        fundraiserAddress: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
        status: ProjectStatus.ACTIVE,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        percentFunded: 100,
        timeRemaining: 30 * 24 * 60 * 60 * 1000,
        isActive: true,
        isFunded: true,
        isExpired: false,
      };

      const fundedProject = { ...mockProject, status: ProjectStatus.FUNDED };

      (projectRepository.findById as jest.Mock)
        .mockResolvedValueOnce(mockProject)
        .mockResolvedValueOnce(fundedProject);

      const result = await service.checkAndUpdateProjectStatus('123');

      expect(result.status).toBe(ProjectStatus.FUNDED);
      expect(projectRepository.updateStatus).toHaveBeenCalledWith('123', ProjectStatus.FUNDED);
    });

    it('should transition active project to expired when deadline passed', async () => {
      const mockProject: Project = {
        id: '123',
        title: 'Test Project',
        description: 'Test description',
        fundingGoal: 10000n,
        totalRaised: 5000n,
        contributorCount: 10,
        fundraiserAddress: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
        status: ProjectStatus.ACTIVE,
        deadline: new Date(Date.now() - 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        percentFunded: 50,
        timeRemaining: -24 * 60 * 60 * 1000,
        isActive: true,
        isFunded: false,
        isExpired: true,
      };

      const expiredProject = { ...mockProject, status: ProjectStatus.EXPIRED };

      (projectRepository.findById as jest.Mock)
        .mockResolvedValueOnce(mockProject)
        .mockResolvedValueOnce(expiredProject);

      const result = await service.checkAndUpdateProjectStatus('123');

      expect(result.status).toBe(ProjectStatus.EXPIRED);
      expect(projectRepository.updateStatus).toHaveBeenCalledWith('123', ProjectStatus.EXPIRED);
    });

    it('should not change status if project is not active', async () => {
      const mockProject: Project = {
        id: '123',
        title: 'Test Project',
        description: 'Test description',
        fundingGoal: 10000n,
        totalRaised: 10000n,
        contributorCount: 10,
        fundraiserAddress: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
        status: ProjectStatus.DRAFT,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        percentFunded: 100,
        timeRemaining: 30 * 24 * 60 * 60 * 1000,
        isActive: false,
        isFunded: true,
        isExpired: false,
      };

      (projectRepository.findById as jest.Mock).mockResolvedValue(mockProject);

      const result = await service.checkAndUpdateProjectStatus('123');

      expect(result.status).toBe(ProjectStatus.DRAFT);
      expect(projectRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should throw error if project not found', async () => {
      (projectRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.checkAndUpdateProjectStatus('123')).rejects.toThrow(
        'Project not found'
      );
    });
  });
});
