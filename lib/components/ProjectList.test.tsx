/**
 * ProjectList component tests
 * 
 * Tests for project list display component with filtering and sorting.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProjectList } from './ProjectList';
import { Project, ProjectStatus, createProject } from '../models/project';

/**
 * Helper function to create a test project
 */
function createTestProject(overrides?: Partial<Project>): Project {
  const baseProject = {
    id: `test-project-${Math.random()}`,
    title: 'Test Project',
    description: 'Test project description',
    fundingGoal: 100000000n, // 100 USDCx
    totalRaised: 50000000n, // 50 USDCx
    contributorCount: 10,
    fundraiserAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    status: ProjectStatus.ACTIVE,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    imageUrl: 'https://example.com/image.jpg',
    category: 'Technology',
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date(),
  };

  return createProject({ ...baseProject, ...overrides });
}

describe('ProjectList', () => {
  /**
   * Test: Display grid of project cards
   * Requirements: 5.1, 5.2
   */
  it('should display a grid of project cards', () => {
    const projects = [
      createTestProject({ id: 'project-1', title: 'Project 1' }),
      createTestProject({ id: 'project-2', title: 'Project 2' }),
      createTestProject({ id: 'project-3', title: 'Project 3' }),
    ];

    render(<ProjectList projects={projects} />);

    expect(screen.getByText('Project 1')).toBeInTheDocument();
    expect(screen.getByText('Project 2')).toBeInTheDocument();
    expect(screen.getByText('Project 3')).toBeInTheDocument();
  });

  /**
   * Test: Display loading state
   * Requirements: 5.1
   */
  it('should display loading state when isLoading is true', () => {
    render(<ProjectList projects={[]} isLoading={true} />);

    const loadingElements = screen.getAllByRole('status', { name: /loading project/i });
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  /**
   * Test: Display empty state when no projects
   * Requirements: 5.1
   */
  it('should display empty state when no projects are provided', () => {
    render(<ProjectList projects={[]} />);

    expect(screen.getByText('No projects found')).toBeInTheDocument();
    expect(screen.getByText(/There are no projects available at the moment/i)).toBeInTheDocument();
  });

  /**
   * Test: Display status filter dropdown
   * Requirements: 5.3
   */
  it('should display status filter dropdown', () => {
    const projects = [createTestProject()];
    render(<ProjectList projects={projects} />);

    const filterSelect = screen.getByLabelText('Filter projects by status');
    expect(filterSelect).toBeInTheDocument();
    expect(filterSelect).toHaveValue('all');
  });

  /**
   * Test: Status filter options
   * Requirements: 5.3
   */
  it('should have all status filter options', () => {
    const projects = [createTestProject()];
    render(<ProjectList projects={projects} />);

    const filterSelect = screen.getByLabelText('Filter projects by status');
    const options = within(filterSelect as HTMLElement).getAllByRole('option');

    expect(options).toHaveLength(6); // all, active, funded, expired, draft, cancelled
    expect(options[0]).toHaveTextContent('All Projects');
    expect(options[1]).toHaveTextContent('Active');
    expect(options[2]).toHaveTextContent('Funded');
    expect(options[3]).toHaveTextContent('Expired');
    expect(options[4]).toHaveTextContent('Draft');
    expect(options[5]).toHaveTextContent('Cancelled');
  });

  /**
   * Test: Display sort options dropdown
   * Requirements: 5.4
   */
  it('should display sort options dropdown', () => {
    const projects = [createTestProject()];
    render(<ProjectList projects={projects} />);

    const sortSelect = screen.getByLabelText('Sort projects');
    expect(sortSelect).toBeInTheDocument();
    expect(sortSelect).toHaveValue('newest');
  });

  /**
   * Test: Sort options
   * Requirements: 5.4
   */
  it('should have all sort options', () => {
    const projects = [createTestProject()];
    render(<ProjectList projects={projects} />);

    const sortSelect = screen.getByLabelText('Sort projects');
    const options = within(sortSelect as HTMLElement).getAllByRole('option');

    expect(options).toHaveLength(3); // newest, mostFunded, endingSoon
    expect(options[0]).toHaveTextContent('Newest');
    expect(options[1]).toHaveTextContent('Most Funded');
    expect(options[2]).toHaveTextContent('Ending Soon');
  });

  /**
   * Test: Filter projects by active status
   * Requirements: 5.3
   */
  it('should filter projects by active status', () => {
    const projects = [
      createTestProject({ id: 'project-1', title: 'Active Project', status: ProjectStatus.ACTIVE }),
      createTestProject({ id: 'project-2', title: 'Funded Project', status: ProjectStatus.FUNDED }),
      createTestProject({ id: 'project-3', title: 'Expired Project', status: ProjectStatus.EXPIRED }),
    ];

    render(<ProjectList projects={projects} />);

    // Initially all projects should be visible
    expect(screen.getByText('Active Project')).toBeInTheDocument();
    expect(screen.getByText('Funded Project')).toBeInTheDocument();
    expect(screen.getByText('Expired Project')).toBeInTheDocument();

    // Filter by active status
    const filterSelect = screen.getByLabelText('Filter projects by status');
    fireEvent.change(filterSelect, { target: { value: ProjectStatus.ACTIVE } });

    // Only active project should be visible
    expect(screen.getByText('Active Project')).toBeInTheDocument();
    expect(screen.queryByText('Funded Project')).not.toBeInTheDocument();
    expect(screen.queryByText('Expired Project')).not.toBeInTheDocument();
  });

  /**
   * Test: Filter projects by funded status
   * Requirements: 5.3
   */
  it('should filter projects by funded status', () => {
    const projects = [
      createTestProject({ id: 'project-1', title: 'Active Project', status: ProjectStatus.ACTIVE }),
      createTestProject({ id: 'project-2', title: 'Funded Project', status: ProjectStatus.FUNDED }),
    ];

    render(<ProjectList projects={projects} />);

    const filterSelect = screen.getByLabelText('Filter projects by status');
    fireEvent.change(filterSelect, { target: { value: ProjectStatus.FUNDED } });

    expect(screen.queryByText('Active Project')).not.toBeInTheDocument();
    expect(screen.getByText('Funded Project')).toBeInTheDocument();
  });

  /**
   * Test: Filter projects by expired status
   * Requirements: 5.3
   */
  it('should filter projects by expired status', () => {
    const projects = [
      createTestProject({ id: 'project-1', title: 'Active Project', status: ProjectStatus.ACTIVE }),
      createTestProject({ id: 'project-2', title: 'Expired Project', status: ProjectStatus.EXPIRED }),
    ];

    render(<ProjectList projects={projects} />);

    const filterSelect = screen.getByLabelText('Filter projects by status');
    fireEvent.change(filterSelect, { target: { value: ProjectStatus.EXPIRED } });

    expect(screen.queryByText('Active Project')).not.toBeInTheDocument();
    expect(screen.getByText('Expired Project')).toBeInTheDocument();
  });

  /**
   * Test: Show all projects when filter is set to "all"
   * Requirements: 5.3
   */
  it('should show all projects when filter is set to "all"', () => {
    const projects = [
      createTestProject({ id: 'project-1', title: 'Active Project', status: ProjectStatus.ACTIVE }),
      createTestProject({ id: 'project-2', title: 'Funded Project', status: ProjectStatus.FUNDED }),
    ];

    render(<ProjectList projects={projects} />);

    // Filter by active first
    const filterSelect = screen.getByLabelText('Filter projects by status');
    fireEvent.change(filterSelect, { target: { value: ProjectStatus.ACTIVE } });
    expect(screen.queryByText('Funded Project')).not.toBeInTheDocument();

    // Change back to all
    fireEvent.change(filterSelect, { target: { value: 'all' } });
    expect(screen.getByText('Active Project')).toBeInTheDocument();
    expect(screen.getByText('Funded Project')).toBeInTheDocument();
  });

  /**
   * Test: Sort projects by newest
   * Requirements: 5.4
   */
  it('should sort projects by newest (createdAt descending)', () => {
    const now = Date.now();
    const projects = [
      createTestProject({ 
        id: 'project-1', 
        title: 'Old Project',
        createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      }),
      createTestProject({ 
        id: 'project-2', 
        title: 'New Project',
        createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      }),
      createTestProject({ 
        id: 'project-3', 
        title: 'Middle Project',
        createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      }),
    ];

    render(<ProjectList projects={projects} />);

    const sortSelect = screen.getByLabelText('Sort projects');
    fireEvent.change(sortSelect, { target: { value: 'newest' } });

    const projectCards = screen.getAllByRole('listitem');
    expect(within(projectCards[0]).getByText('New Project')).toBeInTheDocument();
    expect(within(projectCards[1]).getByText('Middle Project')).toBeInTheDocument();
    expect(within(projectCards[2]).getByText('Old Project')).toBeInTheDocument();
  });

  /**
   * Test: Sort projects by most funded
   * Requirements: 5.4
   */
  it('should sort projects by most funded (totalRaised descending)', () => {
    const projects = [
      createTestProject({ 
        id: 'project-1', 
        title: 'Low Funded',
        totalRaised: 10000000n // 10 USDCx
      }),
      createTestProject({ 
        id: 'project-2', 
        title: 'High Funded',
        totalRaised: 90000000n // 90 USDCx
      }),
      createTestProject({ 
        id: 'project-3', 
        title: 'Medium Funded',
        totalRaised: 50000000n // 50 USDCx
      }),
    ];

    render(<ProjectList projects={projects} />);

    const sortSelect = screen.getByLabelText('Sort projects');
    fireEvent.change(sortSelect, { target: { value: 'mostFunded' } });

    const projectCards = screen.getAllByRole('listitem');
    expect(within(projectCards[0]).getByText('High Funded')).toBeInTheDocument();
    expect(within(projectCards[1]).getByText('Medium Funded')).toBeInTheDocument();
    expect(within(projectCards[2]).getByText('Low Funded')).toBeInTheDocument();
  });

  /**
   * Test: Sort projects by ending soon
   * Requirements: 5.4
   */
  it('should sort projects by ending soon (deadline ascending)', () => {
    const now = Date.now();
    const projects = [
      createTestProject({ 
        id: 'project-1', 
        title: 'Far Deadline',
        deadline: new Date(now + 10 * 24 * 60 * 60 * 1000) // 10 days from now
      }),
      createTestProject({ 
        id: 'project-2', 
        title: 'Near Deadline',
        deadline: new Date(now + 2 * 24 * 60 * 60 * 1000) // 2 days from now
      }),
      createTestProject({ 
        id: 'project-3', 
        title: 'Middle Deadline',
        deadline: new Date(now + 5 * 24 * 60 * 60 * 1000) // 5 days from now
      }),
    ];

    render(<ProjectList projects={projects} />);

    const sortSelect = screen.getByLabelText('Sort projects');
    fireEvent.change(sortSelect, { target: { value: 'endingSoon' } });

    const projectCards = screen.getAllByRole('listitem');
    expect(within(projectCards[0]).getByText('Near Deadline')).toBeInTheDocument();
    expect(within(projectCards[1]).getByText('Middle Deadline')).toBeInTheDocument();
    expect(within(projectCards[2]).getByText('Far Deadline')).toBeInTheDocument();
  });

  /**
   * Test: Combine filtering and sorting
   * Requirements: 5.3, 5.4
   */
  it('should apply both filtering and sorting', () => {
    const now = Date.now();
    const projects = [
      createTestProject({ 
        id: 'project-1', 
        title: 'Active Far',
        status: ProjectStatus.ACTIVE,
        deadline: new Date(now + 10 * 24 * 60 * 60 * 1000)
      }),
      createTestProject({ 
        id: 'project-2', 
        title: 'Active Near',
        status: ProjectStatus.ACTIVE,
        deadline: new Date(now + 2 * 24 * 60 * 60 * 1000)
      }),
      createTestProject({ 
        id: 'project-3', 
        title: 'Funded Near',
        status: ProjectStatus.FUNDED,
        deadline: new Date(now + 1 * 24 * 60 * 60 * 1000)
      }),
    ];

    render(<ProjectList projects={projects} />);

    // Filter by active
    const filterSelect = screen.getByLabelText('Filter projects by status');
    fireEvent.change(filterSelect, { target: { value: ProjectStatus.ACTIVE } });

    // Sort by ending soon
    const sortSelect = screen.getByLabelText('Sort projects');
    fireEvent.change(sortSelect, { target: { value: 'endingSoon' } });

    // Should only show active projects, sorted by deadline
    const projectCards = screen.getAllByRole('listitem');
    expect(projectCards).toHaveLength(2);
    expect(within(projectCards[0]).getByText('Active Near')).toBeInTheDocument();
    expect(within(projectCards[1]).getByText('Active Far')).toBeInTheDocument();
    expect(screen.queryByText('Funded Near')).not.toBeInTheDocument();
  });

  /**
   * Test: Display results count
   * Requirements: 5.1
   */
  it('should display the count of filtered projects', () => {
    const projects = [
      createTestProject({ id: 'project-1', status: ProjectStatus.ACTIVE }),
      createTestProject({ id: 'project-2', status: ProjectStatus.ACTIVE }),
      createTestProject({ id: 'project-3', status: ProjectStatus.FUNDED }),
    ];

    render(<ProjectList projects={projects} />);

    expect(screen.getByText('Showing 3 projects')).toBeInTheDocument();

    // Filter by active
    const filterSelect = screen.getByLabelText('Filter projects by status');
    fireEvent.change(filterSelect, { target: { value: ProjectStatus.ACTIVE } });

    expect(screen.getByText('Showing 2 projects')).toBeInTheDocument();
  });

  /**
   * Test: Display singular "project" for count of 1
   * Requirements: 5.1
   */
  it('should display singular "project" for count of 1', () => {
    const projects = [
      createTestProject({ id: 'project-1' }),
    ];

    render(<ProjectList projects={projects} />);

    expect(screen.getByText('Showing 1 project')).toBeInTheDocument();
  });

  /**
   * Test: Handle project card click
   * Requirements: 5.2
   */
  it('should call onProjectClick when a project card is clicked', () => {
    const projects = [
      createTestProject({ id: 'project-1', title: 'Clickable Project' }),
    ];
    const handleClick = jest.fn();

    render(<ProjectList projects={projects} onProjectClick={handleClick} />);

    const projectCard = screen.getByRole('button', { name: /view project: clickable project/i });
    fireEvent.click(projectCard);

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith('project-1');
  });

  /**
   * Test: Hide controls when showControls is false
   * Requirements: 5.1
   */
  it('should hide filter and sort controls when showControls is false', () => {
    const projects = [createTestProject()];

    render(<ProjectList projects={projects} showControls={false} />);

    expect(screen.queryByLabelText('Filter projects by status')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Sort projects')).not.toBeInTheDocument();
  });

  /**
   * Test: Apply custom className
   */
  it('should apply custom className', () => {
    const projects = [createTestProject()];
    const { container } = render(<ProjectList projects={projects} className="custom-class" />);

    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  /**
   * Test: Use initial status filter
   * Requirements: 5.3
   */
  it('should use initialStatusFilter prop', () => {
    const projects = [
      createTestProject({ id: 'project-1', status: ProjectStatus.ACTIVE }),
      createTestProject({ id: 'project-2', status: ProjectStatus.FUNDED }),
    ];

    render(<ProjectList projects={projects} initialStatusFilter={ProjectStatus.ACTIVE} />);

    const filterSelect = screen.getByLabelText('Filter projects by status');
    expect(filterSelect).toHaveValue(ProjectStatus.ACTIVE);

    // Should only show active projects
    const projectCards = screen.getAllByRole('listitem');
    expect(projectCards).toHaveLength(1);
  });

  /**
   * Test: Use initial sort option
   * Requirements: 5.4
   */
  it('should use initialSort prop', () => {
    const projects = [
      createTestProject({ id: 'project-1', totalRaised: 10000000n }),
      createTestProject({ id: 'project-2', totalRaised: 90000000n }),
    ];

    render(<ProjectList projects={projects} initialSort="mostFunded" />);

    const sortSelect = screen.getByLabelText('Sort projects');
    expect(sortSelect).toHaveValue('mostFunded');
  });

  /**
   * Test: Empty state message changes based on filter
   * Requirements: 5.1
   */
  it('should show filter-specific empty state message', () => {
    const projects: Project[] = [];

    render(<ProjectList projects={projects} initialStatusFilter={ProjectStatus.ACTIVE} />);

    expect(screen.getByText(/There are no active projects at the moment/i)).toBeInTheDocument();
  });

  /**
   * Test: Responsive grid layout
   * Requirements: 5.1
   */
  it('should have responsive grid layout classes', () => {
    const projects = [createTestProject()];
    const { container } = render(<ProjectList projects={projects} />);

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
  });

  /**
   * Test: Accessibility - list has proper role
   */
  it('should have proper role for project grid', () => {
    const projects = [createTestProject()];
    render(<ProjectList projects={projects} />);

    const list = screen.getByRole('list', { name: 'Project list' });
    expect(list).toBeInTheDocument();
  });

  /**
   * Test: Accessibility - filter has label
   */
  it('should have accessible label for status filter', () => {
    const projects = [createTestProject()];
    render(<ProjectList projects={projects} />);

    const filterLabel = screen.getByText('Filter by status:');
    expect(filterLabel).toBeInTheDocument();
    expect(filterLabel).toHaveAttribute('for', 'status-filter');
  });

  /**
   * Test: Accessibility - sort has label
   */
  it('should have accessible label for sort options', () => {
    const projects = [createTestProject()];
    render(<ProjectList projects={projects} />);

    const sortLabel = screen.getByText('Sort by:');
    expect(sortLabel).toBeInTheDocument();
    expect(sortLabel).toHaveAttribute('for', 'sort-option');
  });

  /**
   * Test: Loading state shows skeleton cards
   * Requirements: 5.1
   */
  it('should show skeleton loading cards', () => {
    render(<ProjectList projects={[]} isLoading={true} />);

    const skeletons = screen.getAllByRole('status', { name: /loading project/i });
    expect(skeletons.length).toBe(6);
  });

  /**
   * Test: Loading state shows animated elements
   * Requirements: 5.1
   */
  it('should have animated loading elements', () => {
    const { container } = render(<ProjectList projects={[]} isLoading={true} />);

    const animatedElements = container.querySelectorAll('.animate-pulse');
    expect(animatedElements.length).toBeGreaterThan(0);
  });

  /**
   * Test: Empty state has icon
   * Requirements: 5.1
   */
  it('should display icon in empty state', () => {
    const { container } = render(<ProjectList projects={[]} />);

    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  /**
   * Test: Projects maintain order after filtering
   * Requirements: 5.3, 5.4
   */
  it('should maintain sort order after filtering', () => {
    const now = Date.now();
    const projects = [
      createTestProject({ 
        id: 'project-1', 
        title: 'Active Old',
        status: ProjectStatus.ACTIVE,
        createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000)
      }),
      createTestProject({ 
        id: 'project-2', 
        title: 'Active New',
        status: ProjectStatus.ACTIVE,
        createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000)
      }),
      createTestProject({ 
        id: 'project-3', 
        title: 'Funded New',
        status: ProjectStatus.FUNDED,
        createdAt: new Date(now)
      }),
    ];

    render(<ProjectList projects={projects} />);

    // Sort by newest
    const sortSelect = screen.getByLabelText('Sort projects');
    fireEvent.change(sortSelect, { target: { value: 'newest' } });

    // Filter by active
    const filterSelect = screen.getByLabelText('Filter projects by status');
    fireEvent.change(filterSelect, { target: { value: ProjectStatus.ACTIVE } });

    // Should show active projects in newest order
    const projectCards = screen.getAllByRole('listitem');
    expect(projectCards).toHaveLength(2);
    expect(within(projectCards[0]).getByText('Active New')).toBeInTheDocument();
    expect(within(projectCards[1]).getByText('Active Old')).toBeInTheDocument();
  });

  /**
   * Test: Handle equal values in sorting
   * Requirements: 5.4
   */
  it('should handle projects with equal totalRaised in mostFunded sort', () => {
    const projects = [
      createTestProject({ 
        id: 'project-1', 
        title: 'Project A',
        totalRaised: 50000000n
      }),
      createTestProject({ 
        id: 'project-2', 
        title: 'Project B',
        totalRaised: 50000000n
      }),
    ];

    render(<ProjectList projects={projects} />);

    const sortSelect = screen.getByLabelText('Sort projects');
    fireEvent.change(sortSelect, { target: { value: 'mostFunded' } });

    // Should not error and should display both projects
    expect(screen.getByText('Project A')).toBeInTheDocument();
    expect(screen.getByText('Project B')).toBeInTheDocument();
  });

  /**
   * Test: Responsive controls layout
   * Requirements: 5.1
   */
  it('should have responsive layout for controls', () => {
    const projects = [createTestProject()];
    const { container } = render(<ProjectList projects={projects} />);

    const controlsContainer = container.querySelector('.flex.flex-col.sm\\:flex-row');
    expect(controlsContainer).toBeInTheDocument();
  });
});
