/**
 * ProjectCard component tests
 * 
 * Tests for project card display component.
 * 
 * Requirements: 5.2, 4.7
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProjectCard } from './ProjectCard';
import { Project, ProjectStatus, createProject } from '../models/project';

/**
 * Helper function to create a test project
 */
function createTestProject(overrides?: Partial<Project>): Project {
  const baseProject = {
    id: 'test-project-1',
    title: 'Test Crowdfunding Project',
    description: 'This is a test project description that should be long enough to test truncation functionality. It contains multiple sentences to ensure we can test the preview feature properly.',
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

describe('ProjectCard', () => {
  /**
   * Test: Display project title
   * Requirements: 5.2
   */
  it('should display project title', () => {
    const project = createTestProject();
    render(<ProjectCard project={project} />);
    
    expect(screen.getByText('Test Crowdfunding Project')).toBeInTheDocument();
  });

  /**
   * Test: Display project description preview
   * Requirements: 5.2
   */
  it('should display truncated description preview', () => {
    const project = createTestProject();
    render(<ProjectCard project={project} />);
    
    const description = screen.getByText(/This is a test project description/);
    expect(description).toBeInTheDocument();
    // Should be truncated with ellipsis
    expect(description.textContent).toContain('...');
  });

  /**
   * Test: Display full description if short enough
   * Requirements: 5.2
   */
  it('should display full description if under length limit', () => {
    const shortDescription = 'Short description';
    const project = createTestProject({ description: shortDescription });
    render(<ProjectCard project={project} />);
    
    const description = screen.getByText(shortDescription);
    expect(description).toBeInTheDocument();
    expect(description.textContent).not.toContain('...');
  });

  /**
   * Test: Display project image
   * Requirements: 5.2
   */
  it('should display project image when imageUrl is provided', () => {
    const project = createTestProject();
    render(<ProjectCard project={project} />);
    
    const image = screen.getByAltText('Test Crowdfunding Project');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  /**
   * Test: Display placeholder when no image
   * Requirements: 5.2
   */
  it('should display placeholder when imageUrl is not provided', () => {
    const project = createTestProject({ imageUrl: undefined });
    const { container } = render(<ProjectCard project={project} />);
    
    // Should have a placeholder div with gradient background
    const placeholder = container.querySelector('.bg-gradient-to-br');
    expect(placeholder).toBeInTheDocument();
  });

  /**
   * Test: Display funding progress bar
   * Requirements: 4.7
   */
  it('should display funding progress bar', () => {
    const project = createTestProject();
    render(<ProjectCard project={project} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });

  /**
   * Test: Display funding percentage
   * Requirements: 4.7
   */
  it('should display funding percentage', () => {
    const project = createTestProject();
    render(<ProjectCard project={project} />);
    
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  /**
   * Test: Display funding amounts
   * Requirements: 4.7
   */
  it('should display total raised and funding goal', () => {
    const project = createTestProject();
    render(<ProjectCard project={project} />);
    
    expect(screen.getByText('50.00 USDCx')).toBeInTheDocument();
    expect(screen.getByText('100.00 USDCx')).toBeInTheDocument();
  });

  /**
   * Test: Display contributor count
   * Requirements: 4.7
   */
  it('should display contributor count', () => {
    const project = createTestProject();
    render(<ProjectCard project={project} />);
    
    expect(screen.getByText('10 contributors')).toBeInTheDocument();
  });

  /**
   * Test: Display singular contributor text
   * Requirements: 4.7
   */
  it('should display singular "contributor" for count of 1', () => {
    const project = createTestProject({ contributorCount: 1 });
    render(<ProjectCard project={project} />);
    
    expect(screen.getByText('1 contributor')).toBeInTheDocument();
  });

  /**
   * Test: Display time remaining
   * Requirements: 4.7
   */
  it('should display time remaining', () => {
    const project = createTestProject();
    render(<ProjectCard project={project} />);
    
    expect(screen.getByText('7 days')).toBeInTheDocument();
  });

  /**
   * Test: Display expired status
   * Requirements: 4.7
   */
  it('should display "Expired" for past deadline', () => {
    const pastDeadline = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
    const project = createTestProject({ deadline: pastDeadline });
    render(<ProjectCard project={project} />);
    
    expect(screen.getByText('Expired')).toBeInTheDocument();
  });

  /**
   * Test: Display project category
   * Requirements: 5.2
   */
  it('should display project category when provided', () => {
    const project = createTestProject();
    render(<ProjectCard project={project} />);
    
    expect(screen.getByText('Technology')).toBeInTheDocument();
  });

  /**
   * Test: Hide category when not provided
   * Requirements: 5.2
   */
  it('should not display category section when not provided', () => {
    const project = createTestProject({ category: undefined });
    render(<ProjectCard project={project} />);
    
    const categoryElement = screen.queryByText(/TECHNOLOGY/i);
    expect(categoryElement).not.toBeInTheDocument();
  });

  /**
   * Test: Display status badge
   * Requirements: 5.2
   */
  it('should display status badge', () => {
    const project = createTestProject();
    render(<ProjectCard project={project} />);
    
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  /**
   * Test: Status badge colors for different statuses
   * Requirements: 5.2
   */
  it('should display correct status badge color for active status', () => {
    const project = createTestProject({ status: ProjectStatus.ACTIVE });
    const { container } = render(<ProjectCard project={project} />);
    
    const badge = screen.getByText('Active');
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('should display correct status badge color for funded status', () => {
    const project = createTestProject({ status: ProjectStatus.FUNDED });
    const { container } = render(<ProjectCard project={project} />);
    
    const badge = screen.getByText('Funded');
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('should display correct status badge color for expired status', () => {
    const project = createTestProject({ status: ProjectStatus.EXPIRED });
    const { container } = render(<ProjectCard project={project} />);
    
    const badge = screen.getByText('Expired');
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  /**
   * Test: Progress bar color based on funding percentage
   * Requirements: 4.7
   */
  it('should display green progress bar when 100% funded', () => {
    const project = createTestProject({ 
      totalRaised: 100000000n, // 100 USDCx (100%)
    });
    const { container } = render(<ProjectCard project={project} />);
    
    const progressBar = container.querySelector('.bg-green-500');
    expect(progressBar).toBeInTheDocument();
  });

  it('should display blue progress bar when 75-99% funded', () => {
    const project = createTestProject({ 
      totalRaised: 80000000n, // 80 USDCx (80%)
    });
    const { container } = render(<ProjectCard project={project} />);
    
    const progressBar = container.querySelector('.bg-blue-500');
    expect(progressBar).toBeInTheDocument();
  });

  it('should display yellow progress bar when 50-74% funded', () => {
    const project = createTestProject({ 
      totalRaised: 60000000n, // 60 USDCx (60%)
    });
    const { container } = render(<ProjectCard project={project} />);
    
    const progressBar = container.querySelector('.bg-yellow-500');
    expect(progressBar).toBeInTheDocument();
  });

  it('should display gray progress bar when less than 50% funded', () => {
    const project = createTestProject({ 
      totalRaised: 30000000n, // 30 USDCx (30%)
    });
    const { container } = render(<ProjectCard project={project} />);
    
    const progressBar = container.querySelector('.bg-gray-400');
    expect(progressBar).toBeInTheDocument();
  });

  /**
   * Test: Click handler for navigation
   * Requirements: 5.2
   */
  it('should call onClick handler when card is clicked', () => {
    const project = createTestProject();
    const handleClick = jest.fn();
    render(<ProjectCard project={project} onClick={handleClick} />);
    
    const card = screen.getByRole('button', { name: /view project/i });
    fireEvent.click(card);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith('test-project-1');
  });

  /**
   * Test: Keyboard navigation support
   * Requirements: 5.2
   */
  it('should handle Enter key press for navigation', () => {
    const project = createTestProject();
    const handleClick = jest.fn();
    render(<ProjectCard project={project} onClick={handleClick} />);
    
    const card = screen.getByRole('button', { name: /view project/i });
    fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });
    
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith('test-project-1');
  });

  it('should handle Space key press for navigation', () => {
    const project = createTestProject();
    const handleClick = jest.fn();
    render(<ProjectCard project={project} onClick={handleClick} />);
    
    const card = screen.getByRole('button', { name: /view project/i });
    fireEvent.keyDown(card, { key: ' ', code: 'Space' });
    
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith('test-project-1');
  });

  /**
   * Test: No click handler when onClick is not provided
   * Requirements: 5.2
   */
  it('should not error when onClick is not provided', () => {
    const project = createTestProject();
    render(<ProjectCard project={project} />);
    
    const card = screen.getByRole('button', { name: /view project/i });
    expect(() => fireEvent.click(card)).not.toThrow();
  });

  /**
   * Test: Apply custom className
   */
  it('should apply custom className', () => {
    const project = createTestProject();
    const { container } = render(<ProjectCard project={project} className="custom-class" />);
    
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  /**
   * Test: Custom description length
   */
  it('should respect custom descriptionLength prop', () => {
    const project = createTestProject();
    render(<ProjectCard project={project} descriptionLength={50} />);
    
    const description = screen.getByText(/This is a test project description/);
    // Should be truncated at 50 characters
    expect(description.textContent!.length).toBeLessThanOrEqual(54); // 50 + "..."
  });

  /**
   * Test: Accessibility - card has proper role
   */
  it('should have proper role and tabIndex for accessibility', () => {
    const project = createTestProject();
    render(<ProjectCard project={project} />);
    
    const card = screen.getByRole('button', { name: /view project/i });
    expect(card).toHaveAttribute('tabIndex', '0');
  });

  /**
   * Test: Accessibility - progress bar has proper ARIA attributes
   */
  it('should have accessible progress bar with ARIA label', () => {
    const project = createTestProject();
    render(<ProjectCard project={project} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-label', 'Funding progress: 50%');
  });

  /**
   * Test: Accessibility - contributor count has ARIA label
   */
  it('should have accessible contributor count with ARIA label', () => {
    const project = createTestProject();
    render(<ProjectCard project={project} />);
    
    const contributorCount = screen.getByLabelText('10 contributors');
    expect(contributorCount).toBeInTheDocument();
  });

  /**
   * Test: Accessibility - time remaining has ARIA label
   */
  it('should have accessible time remaining with ARIA label', () => {
    const project = createTestProject();
    render(<ProjectCard project={project} />);
    
    const timeRemaining = screen.getByLabelText('Time remaining: 7 days');
    expect(timeRemaining).toBeInTheDocument();
  });

  /**
   * Test: Hover effect styling
   */
  it('should have hover effect classes', () => {
    const project = createTestProject();
    const { container } = render(<ProjectCard project={project} />);
    
    const card = container.querySelector('.hover\\:shadow-lg');
    expect(card).toBeInTheDocument();
  });

  /**
   * Test: Responsive image styling
   */
  it('should have responsive image styling', () => {
    const project = createTestProject();
    render(<ProjectCard project={project} />);
    
    const image = screen.getByAltText('Test Crowdfunding Project');
    expect(image).toHaveClass('w-full', 'h-full', 'object-cover');
  });

  /**
   * Test: Progress bar width calculation
   */
  it('should set progress bar width based on funding percentage', () => {
    const project = createTestProject({ totalRaised: 75000000n }); // 75%
    const { container } = render(<ProjectCard project={project} />);
    
    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toHaveStyle({ width: '75%' });
  });

  /**
   * Test: Progress bar caps at 100%
   */
  it('should cap progress bar width at 100% for overfunded projects', () => {
    const project = createTestProject({ totalRaised: 150000000n }); // 150%
    const { container } = render(<ProjectCard project={project} />);
    
    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toHaveStyle({ width: '100%' });
  });

  /**
   * Test: Display overfunded percentage
   */
  it('should display percentage over 100 for overfunded projects', () => {
    const project = createTestProject({ totalRaised: 150000000n }); // 150%
    render(<ProjectCard project={project} />);
    
    expect(screen.getByText('150%')).toBeInTheDocument();
  });

  /**
   * Test: Red text for expired time
   */
  it('should display expired time in red', () => {
    const pastDeadline = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
    const project = createTestProject({ deadline: pastDeadline });
    const { container } = render(<ProjectCard project={project} />);
    
    const expiredText = screen.getByText('Expired');
    expect(expiredText).toHaveClass('text-red-600', 'font-medium');
  });

  /**
   * Test: Card structure and layout
   */
  it('should have proper card structure with article element', () => {
    const project = createTestProject();
    const { container } = render(<ProjectCard project={project} />);
    
    const article = container.querySelector('article');
    expect(article).toBeInTheDocument();
    expect(article).toHaveClass('bg-white', 'rounded-lg', 'shadow-md');
  });

  /**
   * Test: Icons are present and accessible
   */
  it('should have icons with aria-hidden attribute', () => {
    const project = createTestProject();
    const { container } = render(<ProjectCard project={project} />);
    
    const icons = container.querySelectorAll('svg[aria-hidden="true"]');
    expect(icons.length).toBeGreaterThan(0);
  });
});
