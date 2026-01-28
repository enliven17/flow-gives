/**
 * Unit tests for Project and Contribution models
 * 
 * Tests the creation and computed properties of project and contribution models.
 */

import { ProjectStatus, createProject, createContribution } from './project';

describe('Project Model', () => {
  describe('ProjectStatus enum', () => {
    it('should have all required status values', () => {
      expect(ProjectStatus.DRAFT).toBe('draft');
      expect(ProjectStatus.ACTIVE).toBe('active');
      expect(ProjectStatus.FUNDED).toBe('funded');
      expect(ProjectStatus.EXPIRED).toBe('expired');
      expect(ProjectStatus.CANCELLED).toBe('cancelled');
    });
  });

  describe('createProject', () => {
    const baseProjectData = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Test Project',
      description: 'A test crowdfunding project',
      fundingGoal: 10000n,
      totalRaised: 5000n,
      contributorCount: 10,
      fundraiserAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      status: ProjectStatus.ACTIVE,
      deadline: new Date(Date.now() + 86400000), // 1 day from now
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create a project with all required fields', () => {
      const project = createProject(baseProjectData);
      
      expect(project.id).toBe(baseProjectData.id);
      expect(project.title).toBe(baseProjectData.title);
      expect(project.description).toBe(baseProjectData.description);
      expect(project.fundingGoal).toBe(baseProjectData.fundingGoal);
      expect(project.totalRaised).toBe(baseProjectData.totalRaised);
      expect(project.contributorCount).toBe(baseProjectData.contributorCount);
      expect(project.fundraiserAddress).toBe(baseProjectData.fundraiserAddress);
      expect(project.status).toBe(baseProjectData.status);
      expect(project.deadline).toBe(baseProjectData.deadline);
    });

    it('should calculate percentFunded correctly', () => {
      const project = createProject(baseProjectData);
      
      // 5000 / 10000 * 100 = 50%
      expect(project.percentFunded).toBe(50);
    });

    it('should calculate percentFunded as 0 when fundingGoal is 0', () => {
      const project = createProject({
        ...baseProjectData,
        fundingGoal: 0n,
      });
      
      expect(project.percentFunded).toBe(0);
    });

    it('should calculate percentFunded over 100 when goal is exceeded', () => {
      const project = createProject({
        ...baseProjectData,
        totalRaised: 15000n,
      });
      
      // 15000 / 10000 * 100 = 150%
      expect(project.percentFunded).toBe(150);
    });

    it('should calculate timeRemaining as positive for future deadline', () => {
      const futureDate = new Date(Date.now() + 86400000); // 1 day from now
      const project = createProject({
        ...baseProjectData,
        deadline: futureDate,
      });
      
      expect(project.timeRemaining).toBeGreaterThan(0);
      expect(project.timeRemaining).toBeLessThanOrEqual(86400000);
    });

    it('should calculate timeRemaining as negative for past deadline', () => {
      const pastDate = new Date(Date.now() - 86400000); // 1 day ago
      const project = createProject({
        ...baseProjectData,
        deadline: pastDate,
      });
      
      expect(project.timeRemaining).toBeLessThan(0);
    });

    it('should set isActive to true when status is ACTIVE', () => {
      const project = createProject({
        ...baseProjectData,
        status: ProjectStatus.ACTIVE,
      });
      
      expect(project.isActive).toBe(true);
    });

    it('should set isActive to false when status is not ACTIVE', () => {
      const statuses = [
        ProjectStatus.DRAFT,
        ProjectStatus.FUNDED,
        ProjectStatus.EXPIRED,
        ProjectStatus.CANCELLED,
      ];
      
      statuses.forEach(status => {
        const project = createProject({
          ...baseProjectData,
          status,
        });
        
        expect(project.isActive).toBe(false);
      });
    });

    it('should set isFunded to true when status is FUNDED', () => {
      const project = createProject({
        ...baseProjectData,
        status: ProjectStatus.FUNDED,
      });
      
      expect(project.isFunded).toBe(true);
    });

    it('should set isFunded to true when totalRaised >= fundingGoal', () => {
      const project = createProject({
        ...baseProjectData,
        status: ProjectStatus.ACTIVE,
        totalRaised: 10000n,
      });
      
      expect(project.isFunded).toBe(true);
    });

    it('should set isFunded to false when totalRaised < fundingGoal and status is not FUNDED', () => {
      const project = createProject({
        ...baseProjectData,
        status: ProjectStatus.ACTIVE,
        totalRaised: 5000n,
      });
      
      expect(project.isFunded).toBe(false);
    });

    it('should set isExpired to true when status is EXPIRED', () => {
      const project = createProject({
        ...baseProjectData,
        status: ProjectStatus.EXPIRED,
      });
      
      expect(project.isExpired).toBe(true);
    });

    it('should set isExpired to true when deadline has passed and not funded', () => {
      const pastDate = new Date(Date.now() - 86400000); // 1 day ago
      const project = createProject({
        ...baseProjectData,
        status: ProjectStatus.ACTIVE,
        deadline: pastDate,
        totalRaised: 5000n,
      });
      
      expect(project.isExpired).toBe(true);
    });

    it('should set isExpired to false when deadline has not passed', () => {
      const futureDate = new Date(Date.now() + 86400000); // 1 day from now
      const project = createProject({
        ...baseProjectData,
        status: ProjectStatus.ACTIVE,
        deadline: futureDate,
      });
      
      expect(project.isExpired).toBe(false);
    });

    it('should handle optional fields', () => {
      const projectWithOptionals = createProject({
        ...baseProjectData,
        imageUrl: 'https://example.com/image.jpg',
        category: 'Technology',
        publishedAt: new Date(),
      });
      
      expect(projectWithOptionals.imageUrl).toBe('https://example.com/image.jpg');
      expect(projectWithOptionals.category).toBe('Technology');
      expect(projectWithOptionals.publishedAt).toBeInstanceOf(Date);
    });

    it('should handle missing optional fields', () => {
      const project = createProject(baseProjectData);
      
      expect(project.imageUrl).toBeUndefined();
      expect(project.category).toBeUndefined();
      expect(project.publishedAt).toBeUndefined();
    });
  });
});

describe('Contribution Model', () => {
  describe('createContribution', () => {
    const baseContributionData = {
      id: '123e4567-e89b-12d3-a456-426614174001',
      projectId: '123e4567-e89b-12d3-a456-426614174000',
      contributorAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      amount: 1000n,
      txId: '0x1234567890abcdef',
      blockHeight: 12345,
      createdAt: new Date(),
    };

    it('should create a contribution with all required fields', () => {
      const contribution = createContribution(baseContributionData);
      
      expect(contribution.id).toBe(baseContributionData.id);
      expect(contribution.projectId).toBe(baseContributionData.projectId);
      expect(contribution.contributorAddress).toBe(baseContributionData.contributorAddress);
      expect(contribution.amount).toBe(baseContributionData.amount);
      expect(contribution.txId).toBe(baseContributionData.txId);
      expect(contribution.blockHeight).toBe(baseContributionData.blockHeight);
      expect(contribution.createdAt).toBe(baseContributionData.createdAt);
    });

    it('should handle optional project relation', () => {
      const project = createProject({
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Project',
        description: 'A test project',
        fundingGoal: 10000n,
        totalRaised: 5000n,
        contributorCount: 10,
        fundraiserAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        status: ProjectStatus.ACTIVE,
        deadline: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const contribution = createContribution({
        ...baseContributionData,
        project,
      });
      
      expect(contribution.project).toBeDefined();
      expect(contribution.project?.id).toBe(project.id);
    });

    it('should handle missing optional project relation', () => {
      const contribution = createContribution(baseContributionData);
      
      expect(contribution.project).toBeUndefined();
    });
  });
});
