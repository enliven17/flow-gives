/**
 * ContributionList - Component for displaying a list of contributions
 * 
 * This component provides:
 * - Display list of contributions with amounts
 * - Show contributor addresses (truncated)
 * - Display timestamps
 * - Add "Load More" pagination
 * 
 * Requirements: 6.4, 6.6
 */

'use client';

import React, { useState } from 'react';
import { Contribution } from '../models/project';
import { formatUSDCx, formatWalletAddress } from '../utils/format';

/**
 * ContributionList props
 */
export interface ContributionListProps {
  /**
   * Array of contributions to display
   */
  contributions: Contribution[];
  
  /**
   * Whether the list is currently loading
   */
  isLoading?: boolean;
  
  /**
   * Optional className for styling
   */
  className?: string;
  
  /**
   * Number of contributions to show per page (default: 10)
   */
  pageSize?: number;
  
  /**
   * Whether to show the "Load More" button
   */
  showLoadMore?: boolean;
  
  /**
   * Optional callback when "Load More" is clicked
   */
  onLoadMore?: () => void;
  
  /**
   * Whether more contributions are available to load
   */
  hasMore?: boolean;
  
  /**
   * Whether "Load More" is currently loading
   */
  isLoadingMore?: boolean;
}

/**
 * ContributionList component
 * 
 * Displays a list of contributions with amounts, contributor addresses (truncated),
 * and timestamps. Supports pagination with "Load More" functionality.
 * 
 * @param props Component props
 * @returns ContributionList component
 * 
 * Requirements: 6.4, 6.6
 */
export function ContributionList({
  contributions,
  isLoading = false,
  className = '',
  pageSize = 10,
  showLoadMore = true,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}: ContributionListProps) {
  // State for client-side pagination (when onLoadMore is not provided)
  const [visibleCount, setVisibleCount] = useState(pageSize);

  /**
   * Format timestamp to readable string
   * 
   * @param date - Date to format
   * @returns Formatted date string
   */
  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  /**
   * Handle "Load More" button click
   */
  const handleLoadMore = () => {
    if (onLoadMore) {
      // Server-side pagination
      onLoadMore();
    } else {
      // Client-side pagination
      setVisibleCount(prev => prev + pageSize);
    }
  };

  /**
   * Get visible contributions based on pagination
   */
  const visibleContributions = onLoadMore
    ? contributions // Server-side pagination: show all provided contributions
    : contributions.slice(0, visibleCount); // Client-side pagination: slice array

  /**
   * Check if there are more contributions to show
   */
  const hasMoreToShow = onLoadMore
    ? hasMore // Server-side: use provided hasMore prop
    : visibleCount < contributions.length; // Client-side: check if more in array

  /**
   * Render loading state
   * 
   * Requirements: 6.4
   */
  if (isLoading) {
    return (
      <div className={`bg-background-secondary rounded-lg shadow-md p-4 sm:p-6 border border-border-default ${className}`}>
        <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-3 sm:mb-4">Recent Contributions</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3 border-b border-border-default last:border-b-0"
              role="status"
              aria-label="Loading contribution"
            >
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-background-tertiary animate-pulse rounded w-1/3" />
                <div className="h-3 bg-background-tertiary animate-pulse rounded w-1/4" />
              </div>
              <div className="h-5 bg-background-tertiary animate-pulse rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /**
   * Render empty state
   * 
   * Requirements: 6.4
   */
  if (contributions.length === 0) {
    return (
      <div className={`bg-background-secondary rounded-lg shadow-md p-4 sm:p-6 border border-border-default ${className}`}>
        <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-3 sm:mb-4">Recent Contributions</h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <svg
            className="w-12 h-12 text-text-muted mb-3"
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
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-text-secondary">
            No contributions yet. Be the first to support this project!
          </p>
        </div>
      </div>
    );
  }

  /**
   * Render contribution list
   * 
   * Requirements: 6.4, 6.6
   */
  return (
    <div className={`bg-background-secondary rounded-lg shadow-md p-6 border border-border-default ${className}`}>
      <h3 className="text-xl font-bold text-text-primary mb-4">
        Recent Contributions
        <span className="ml-2 text-sm font-normal text-text-secondary">
          ({contributions.length} total)
        </span>
      </h3>

      {/* Contribution list */}
      <div className="space-y-0" role="list" aria-label="Contribution list">
        {visibleContributions.map((contribution) => (
          <div
            key={contribution.id}
            className="flex items-center justify-between py-4 border-b border-border-default last:border-b-0 hover:bg-background-tertiary transition-colors"
            role="listitem"
          >
            {/* Contributor info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {/* Contributor icon */}
                <svg
                  className="w-4 h-4 text-text-muted flex-shrink-0"
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                {/* Truncated address - Requirements: 6.6 */}
                <span
                  className="text-sm font-medium text-text-primary truncate"
                  title={contribution.contributorAddress}
                >
                  {formatWalletAddress(contribution.contributorAddress)}
                </span>
              </div>
              {/* Timestamp */}
              <p className="text-xs text-text-muted">
                {formatTimestamp(contribution.createdAt)}
              </p>
            </div>

            {/* Contribution amount */}
            <div className="ml-4 flex-shrink-0">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-accent-success/20 text-accent-success border border-accent-success/30">
                {formatUSDCx(contribution.amount)} USDCx
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Load More button */}
      {showLoadMore && hasMoreToShow && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className={`px-5 sm:px-6 py-2.5 sm:py-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-secondary focus:ring-orange-500/50 min-h-[44px] touch-manipulation text-sm sm:text-base ${
              isLoadingMore
                ? 'bg-background-tertiary text-text-muted cursor-not-allowed opacity-50'
                : 'glass-orange text-text-primary hover:opacity-90'
            }`}
            aria-label="Load more contributions"
          >
            {isLoadingMore ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Loading...
              </span>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}

      {/* Show count indicator when using client-side pagination */}
      {!onLoadMore && visibleCount < contributions.length && (
        <div className="mt-4 text-center text-sm text-text-secondary">
          Showing {visibleCount} of {contributions.length} contributions
        </div>
      )}
    </div>
  );
}
