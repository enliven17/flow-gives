/**
 * ProjectList - Component for displaying a list of projects
 * 
 * This component provides:
 * - Display grid of ProjectCard components
 * - Implement status filter dropdown
 * - Implement sort options (newest, most funded, ending soon)
 * - Add loading and empty states
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Project, ProjectStatus } from '../models/project';
import { ProjectCard } from './ProjectCard';

/**
 * Sort options for project list
 */
export type SortOption = 'newest' | 'mostFunded' | 'endingSoon';

/**
 * ProjectList props
 */
export interface ProjectListProps {
  /**
   * Array of projects to display
   */
  projects: Project[];
  
  /**
   * Whether the list is currently loading
   */
  isLoading?: boolean;
  
  /**
   * Optional click handler for project cards
   */
  onProjectClick?: (projectId: string) => void;
  
  /**
   * Optional className for styling
   */
  className?: string;
  
  /**
   * Whether to show filter and sort controls
   */
  showControls?: boolean;
  
  /**
   * Initial status filter
   */
  initialStatusFilter?: ProjectStatus | 'all';
  
  /**
   * Initial sort option
   */
  initialSort?: SortOption;
}

/**
 * ProjectList component
 * 
 * Displays a grid of project cards with filtering and sorting capabilities.
 * 
 * @param props Component props
 * @returns ProjectList component
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
export function ProjectList({
  projects,
  isLoading = false,
  onProjectClick,
  className = '',
  showControls = true,
  initialStatusFilter = 'all',
  initialSort = 'newest',
}: ProjectListProps) {
  // State for filters and sorting
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>(initialStatusFilter);
  const [sortOption, setSortOption] = useState<SortOption>(initialSort);

  /**
   * Filter and sort projects based on current selections
   * 
   * Requirements: 5.3, 5.4
   */
  const filteredAndSortedProjects = useMemo(() => {
    // Filter by status
    let filtered = projects;
    if (statusFilter !== 'all') {
      filtered = projects.filter(project => project.status === statusFilter);
    }

    // Sort projects
    const sorted = [...filtered].sort((a, b) => {
      // Ensure dates are Date objects
      const aCreatedAt = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const bCreatedAt = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      const aDeadline = a.deadline instanceof Date ? a.deadline : new Date(a.deadline);
      const bDeadline = b.deadline instanceof Date ? b.deadline : new Date(b.deadline);
      
      switch (sortOption) {
        case 'newest':
          // Sort by createdAt descending (newest first)
          return bCreatedAt.getTime() - aCreatedAt.getTime();
        
        case 'mostFunded':
          // Sort by totalRaised descending (highest first)
          if (b.totalRaised > a.totalRaised) return 1;
          if (b.totalRaised < a.totalRaised) return -1;
          return 0;
        
        case 'endingSoon':
          // Sort by deadline ascending (soonest first)
          return aDeadline.getTime() - bDeadline.getTime();
        
        default:
          return 0;
      }
    });

    return sorted;
  }, [projects, statusFilter, sortOption]);

  /**
   * Handle status filter change
   * 
   * Requirements: 5.3
   */
  const handleStatusFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setStatusFilter(value === 'all' ? 'all' : value as ProjectStatus);
  };

  /**
   * Handle sort option change
   * 
   * Requirements: 5.4
   */
  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(event.target.value as SortOption);
  };

  /**
   * Render loading state
   * 
   * Requirements: 5.1
   */
  if (isLoading) {
    return (
      <div className={`w-full ${className}`}>
        {showControls && (
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-start sm:items-center">
            <div className="w-full sm:w-auto h-10 bg-background-tertiary animate-pulse rounded-md" style={{ width: '200px' }} />
            <div className="w-full sm:w-auto h-10 bg-background-tertiary animate-pulse rounded-md" style={{ width: '200px' }} />
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-background-secondary rounded-lg shadow-md overflow-hidden border border-border-default"
              role="status"
              aria-label="Loading project"
            >
              <div className="w-full h-48 bg-background-tertiary animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-6 bg-background-tertiary animate-pulse rounded" />
                <div className="h-4 bg-background-tertiary animate-pulse rounded w-3/4" />
                <div className="h-4 bg-background-tertiary animate-pulse rounded w-1/2" />
                <div className="h-2 bg-background-tertiary animate-pulse rounded mt-4" />
                <div className="flex justify-between mt-4">
                  <div className="h-4 bg-background-tertiary animate-pulse rounded w-1/3" />
                  <div className="h-4 bg-background-tertiary animate-pulse rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /**
   * Render empty state
   * 
   * Requirements: 5.1
   */
  if (filteredAndSortedProjects.length === 0) {
    return (
      <div className={`w-full ${className}`}>
        {showControls && (
          <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center glass rounded-xl p-4 border border-border-default">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="status-filter" className="text-sm font-medium text-text-secondary">
                Filter by status:
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="px-3 sm:px-4 py-2 bg-background-tertiary border border-border-default rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary text-sm text-text-primary transition-all duration-300 hover:border-border-hover min-h-[44px] touch-manipulation"
                aria-label="Filter projects by status"
              >
                <option value="all">All Projects</option>
                <option value={ProjectStatus.ACTIVE}>Active</option>
                <option value={ProjectStatus.FUNDED}>Funded</option>
                <option value={ProjectStatus.EXPIRED}>Expired</option>
                <option value={ProjectStatus.DRAFT}>Draft</option>
                <option value={ProjectStatus.CANCELLED}>Cancelled</option>
              </select>
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <label htmlFor="sort-option" className="text-sm font-medium text-text-secondary">
                Sort by:
              </label>
              <select
                id="sort-option"
                value={sortOption}
                onChange={handleSortChange}
                className="px-3 sm:px-4 py-2 bg-background-tertiary border border-border-default rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary text-sm text-text-primary transition-all duration-300 hover:border-border-hover min-h-[44px] touch-manipulation"
                aria-label="Sort projects"
              >
                <option value="newest">Newest</option>
                <option value="mostFunded">Most Funded</option>
                <option value="endingSoon">Ending Soon</option>
              </select>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <svg
            className="w-16 h-16 text-text-muted mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            No projects found
          </h3>
          <p className="text-sm text-text-secondary max-w-md">
            {statusFilter !== 'all'
              ? `There are no ${statusFilter} projects at the moment. Try changing the filter to see more projects.`
              : 'There are no projects available at the moment. Check back later for new crowdfunding opportunities.'}
          </p>
        </div>
      </div>
    );
  }

  /**
   * Render project grid
   * 
   * Requirements: 5.1, 5.2
   */
  return (
    <div className={`w-full ${className}`}>
      {showControls && (
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center glass rounded-xl p-4 border border-border-default">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-sm font-medium text-text-secondary">
              Filter by status:
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="px-3 sm:px-4 py-2 bg-background-tertiary border border-border-default rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary text-sm text-text-primary transition-all duration-300 hover:border-border-hover min-h-[44px] touch-manipulation"
              aria-label="Filter projects by status"
            >
              <option value="all">All Projects</option>
              <option value={ProjectStatus.ACTIVE}>Active</option>
              <option value={ProjectStatus.FUNDED}>Funded</option>
              <option value={ProjectStatus.EXPIRED}>Expired</option>
              <option value={ProjectStatus.DRAFT}>Draft</option>
              <option value={ProjectStatus.CANCELLED}>Cancelled</option>
            </select>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <label htmlFor="sort-option" className="text-sm font-medium text-text-secondary">
              Sort by:
            </label>
            <select
              id="sort-option"
              value={sortOption}
              onChange={handleSortChange}
              className="px-3 sm:px-4 py-2 bg-background-tertiary border border-border-default rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary text-sm text-text-primary transition-all duration-300 hover:border-border-hover min-h-[44px] touch-manipulation"
              aria-label="Sort projects"
            >
              <option value="newest">Newest</option>
              <option value="mostFunded">Most Funded</option>
              <option value="endingSoon">Ending Soon</option>
            </select>
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="mb-4 text-sm text-text-secondary flex items-center gap-2">
        <span className="px-3 py-1 rounded-full bg-background-tertiary border border-border-default">
          {filteredAndSortedProjects.length} {filteredAndSortedProjects.length === 1 ? 'project' : 'projects'}
        </span>
      </div>

      {/* Project Grid */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        role="list"
        aria-label="Project list"
      >
        {filteredAndSortedProjects.map((project, index) => (
          <div 
            key={project.id} 
            role="listitem"
            className="animate-scale-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <ProjectCard
              project={project}
              onClick={onProjectClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
