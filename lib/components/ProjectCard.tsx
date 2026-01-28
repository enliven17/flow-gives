/**
 * ProjectCard - Component for displaying project cards
 * 
 * This component provides:
 * - Display project title, description preview, and image
 * - Show funding progress bar and percentage
 * - Display deadline and time remaining
 * - Show contributor count
 * - Add click handler for navigation
 * 
 * Requirements: 5.2, 4.7
 */

'use client';

import React from 'react';
import { Project } from '../models/project';
import { formatFlow, formatTimeRemaining } from '../utils/format';

/**
 * ProjectCard props
 */
export interface ProjectCardProps {
  /**
   * Project data to display
   */
  project: Project;
  
  /**
   * Optional click handler for navigation
   */
  onClick?: (projectId: string) => void;
  
  /**
   * Optional className for styling
   */
  className?: string;
  
  /**
   * Maximum length for description preview
   */
  descriptionLength?: number;
}

/**
 * ProjectCard component
 * 
 * Displays a project card with funding progress, deadline, and contributor count.
 * 
 * @param props Component props
 * @returns ProjectCard component
 * 
 * Requirements: 5.2, 4.7
 */
export function ProjectCard({
  project,
  onClick,
  className = '',
  descriptionLength = 150,
}: ProjectCardProps) {
  /**
   * Handle card click
   * 
   * Requirements: 5.2
   */
  const handleClick = () => {
    if (onClick) {
      onClick(project.id);
    }
  };

  /**
   * Truncate description to preview length
   */
  const getDescriptionPreview = (): string => {
    if (project.description.length <= descriptionLength) {
      return project.description;
    }
    return project.description.slice(0, descriptionLength).trim() + '...';
  };

  /**
   * Get status badge color (dark theme)
   */
  const getStatusColor = (): string => {
    switch (project.status) {
      case 'active':
        return 'bg-accent-success/20 text-accent-success border border-accent-success/30';
      case 'funded':
        return 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30';
      case 'expired':
        return 'bg-text-muted/20 text-text-muted border border-text-muted/30';
      case 'draft':
        return 'bg-accent-warning/20 text-accent-warning border border-accent-warning/30';
      case 'cancelled':
        return 'bg-accent-error/20 text-accent-error border border-accent-error/30';
      default:
        return 'bg-text-muted/20 text-text-muted border border-text-muted/30';
    }
  };

  /**
   * Get progress bar color based on funding percentage (dark theme)
   * Uses green shades for all funding levels
   */
  const getProgressColor = (): string => {
    if (project.percentFunded >= 100) {
      return 'bg-accent-success'; // Bright green for 100%+
    } else if (project.percentFunded >= 75) {
      return 'bg-accent-primary'; // Primary green for 75-99%
    } else if (project.percentFunded >= 50) {
      return 'bg-accent-secondary'; // Dark green for 50-74%
    } else {
      return 'bg-accent-secondary/60'; // Muted green for <50%
    }
  };

  return (
    <article
      className={`bg-background-secondary rounded-lg overflow-hidden cursor-pointer border border-border-default card-hover group relative ${className}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`View project: ${project.title}`}
    >
      {/* Project Image */}
      {project.imageUrl ? (
        <div className="relative w-full h-40 sm:h-48 bg-background-tertiary overflow-hidden">
          <img
            src={project.imageUrl}
            alt={project.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background-primary/40 to-transparent"></div>
          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <span
              className={`px-3 py-1.5 text-xs font-bold rounded-full backdrop-blur-sm ${getStatusColor()}`}
            >
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </span>
          </div>
        </div>
      ) : (
        <div className="relative w-full h-48 bg-background-tertiary flex items-center justify-center border border-border-default">
          <svg
            className="w-20 h-20 text-text-muted group-hover:text-accent-primary/80 transition-colors duration-300"
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
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <span
              className={`px-3 py-1.5 text-xs font-bold rounded-full backdrop-blur-sm ${getStatusColor()}`}
            >
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </span>
          </div>
        </div>
      )}

      {/* Project Content */}
      <div className="p-4 sm:p-6">
        {/* Title */}
        <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-2 sm:mb-3 line-clamp-2 group-hover:text-accent-primary/80 transition-colors duration-300">
          {project.title}
        </h3>

        {/* Category */}
        {project.category && (
          <div className="mb-3">
            <span className="inline-block px-2 py-1 text-xs text-accent-primary bg-accent-primary/10 rounded-md uppercase tracking-wide border border-accent-primary/20">
              {project.category}
            </span>
          </div>
        )}

        {/* Description Preview */}
        <p className="text-xs sm:text-sm text-text-secondary mb-4 sm:mb-6 line-clamp-3 leading-relaxed">
          {getDescriptionPreview()}
        </p>

        {/* Funding Progress */}
        <div className="mb-4 sm:mb-6">
          {/* Progress Bar */}
          <div className="relative w-full h-3 bg-background-tertiary rounded-full overflow-hidden mb-3">
            <div
              className={`absolute top-0 left-0 h-full rounded-full ${getProgressColor()} transition-all duration-1000 ease-out relative overflow-hidden`}
              style={{ width: `${Math.min(project.percentFunded, 100)}%` }}
              role="progressbar"
              aria-valuenow={project.percentFunded}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Funding progress: ${project.percentFunded}%`}
            >
            </div>
          </div>

          {/* Funding Stats */}
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold text-text-primary gradient-text">
                {formatFlow(project.totalRaised)} FLOW
              </span>
              <span className="text-xs text-text-muted">
                of {formatFlow(project.fundingGoal)} FLOW
              </span>
            </div>
            <div className="text-right">
              <span className="text-xl sm:text-2xl font-bold text-text-primary">
                {project.percentFunded}%
              </span>
            </div>
          </div>
        </div>

        {/* Project Metrics */}
        <div className="flex items-center justify-between text-xs sm:text-sm text-text-secondary pt-3 sm:pt-4 border-t border-border-default">
          {/* Contributors */}
          <div className="flex items-center gap-2 group/contrib">
            <div className="p-1.5 rounded-lg bg-accent-primary/10 group-hover/contrib:bg-accent-primary/20 transition-colors">
              <svg
                className="w-4 h-4 text-accent-primary"
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <span aria-label={`${project.contributorCount} contributors`} className="font-medium">
              {project.contributorCount}
            </span>
          </div>

          {/* Time Remaining */}
          <div className="flex items-center gap-2 group/time">
            <div className={`p-1.5 rounded-lg transition-colors ${
              project.timeRemaining < 0 
                ? 'bg-accent-error/10 group-hover/time:bg-accent-error/20' 
                : 'bg-accent-success/10 group-hover/time:bg-accent-success/20'
            }`}>
              <svg
                className={`w-4 h-4 ${project.timeRemaining < 0 ? 'text-accent-error' : 'text-accent-success'}`}
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span
              className={`font-medium ${project.timeRemaining < 0 ? 'text-accent-error' : 'text-accent-success'}`}
              aria-label={`Time remaining: ${formatTimeRemaining(project.timeRemaining)}`}
            >
              {formatTimeRemaining(project.timeRemaining)}
            </span>
          </div>
        </div>
      </div>
      
    </article>
  );
}
