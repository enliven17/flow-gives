/**
 * Unit tests for ContributionList component
 * 
 * Tests cover:
 * - Rendering contributions with amounts and addresses
 * - Address truncation display
 * - Timestamp formatting
 * - Loading states
 * - Empty states
 * - Pagination (client-side and server-side)
 * - Load More functionality
 * 
 * Requirements: 6.4, 6.6
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ContributionList } from './ContributionList';
import { Contribution } from '../models/project';

/**
 * Helper function to create mock contributions
 */
function createMockContribution(overrides?: Partial<Contribution>): Contribution {
  return {
    id: 'contrib-1',
    projectId: 'project-1',
    contributorAddress: 'ST1X6Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P',
    amount: 1000000n, // 1 USDCx
    txId: '0x1234567890abcdef',
    blockHeight: 12345,
    createdAt: new Date('2024-01-15T10:00:00Z'),
    ...overrides,
  };
}

describe('ContributionList', () => {
  describe('Rendering', () => {
    it('should render contribution list with title', () => {
      const contributions = [createMockContribution()];
      
      render(<ContributionList contributions={contributions} />);
      
      expect(screen.getByText('Recent Contributions')).toBeInTheDocument();
      expect(screen.getByText('(1 total)')).toBeInTheDocument();
    });

    it('should render multiple contributions', () => {
      const contributions = [
        createMockContribution({ id: 'contrib-1', amount: 1000000n }),
        createMockContribution({ id: 'contrib-2', amount: 2000000n }),
        createMockContribution({ id: 'contrib-3', amount: 3000000n }),
      ];
      
      render(<ContributionList contributions={contributions} />);
      
      expect(screen.getByText('(3 total)')).toBeInTheDocument();
      expect(screen.getByText('1.00 USDCx')).toBeInTheDocument();
      expect(screen.getByText('2.00 USDCx')).toBeInTheDocument();
      expect(screen.getByText('3.00 USDCx')).toBeInTheDocument();
    });

    it('should display contribution amounts correctly', () => {
      const contributions = [
        createMockContribution({ amount: 1500000n }), // 1.50 USDCx
      ];
      
      render(<ContributionList contributions={contributions} />);
      
      expect(screen.getByText('1.50 USDCx')).toBeInTheDocument();
    });

    it('should truncate contributor addresses - Requirements: 6.6', () => {
      const contributions = [
        createMockContribution({
          contributorAddress: 'ST1X6Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P',
        }),
      ];
      
      render(<ContributionList contributions={contributions} />);
      
      // Address should be truncated to first 6 and last 4 characters
      // ST1X6Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P -> ST1X6Y...7O8P
      expect(screen.getByText('ST1X6Y...7O8P')).toBeInTheDocument();
      
      // Full address should be in title attribute
      const addressElement = screen.getByText('ST1X6Y...7O8P');
      expect(addressElement).toHaveAttribute(
        'title',
        'ST1X6Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P'
      );
    });

    it('should display timestamps', () => {
      const now = new Date('2024-01-15T12:00:00Z');
      jest.useFakeTimers();
      jest.setSystemTime(now);

      const contributions = [
        createMockContribution({
          createdAt: new Date('2024-01-15T11:30:00Z'), // 30 minutes ago
        }),
      ];
      
      render(<ContributionList contributions={contributions} />);
      
      expect(screen.getByText('30 minutes ago')).toBeInTheDocument();

      jest.useRealTimers();
    });
  });

  describe('Loading State', () => {
    it('should render loading skeleton when isLoading is true', () => {
      render(<ContributionList contributions={[]} isLoading={true} />);
      
      expect(screen.getByText('Recent Contributions')).toBeInTheDocument();
      
      // Should show loading skeletons
      const loadingItems = screen.getAllByRole('status', { name: /loading contribution/i });
      expect(loadingItems).toHaveLength(5);
    });

    it('should not render contributions when loading', () => {
      const contributions = [createMockContribution()];
      
      render(<ContributionList contributions={contributions} isLoading={true} />);
      
      // Should not show actual contributions
      expect(screen.queryByText('1.00 USDCx')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should render empty state when no contributions', () => {
      render(<ContributionList contributions={[]} />);
      
      expect(screen.getByText('Recent Contributions')).toBeInTheDocument();
      expect(
        screen.getByText('No contributions yet. Be the first to support this project!')
      ).toBeInTheDocument();
    });

    it('should not show Load More button in empty state', () => {
      render(<ContributionList contributions={[]} />);
      
      expect(screen.queryByText('Load More')).not.toBeInTheDocument();
    });
  });

  describe('Pagination - Client-side', () => {
    it('should show only pageSize contributions initially', () => {
      const contributions = Array.from({ length: 15 }, (_, i) =>
        createMockContribution({
          id: `contrib-${i}`,
          amount: BigInt((i + 1) * 1000000),
        })
      );
      
      render(<ContributionList contributions={contributions} pageSize={10} />);
      
      // Should show "Showing X of Y" indicator
      expect(screen.getByText('Showing 10 of 15 contributions')).toBeInTheDocument();
      
      // Should show Load More button
      expect(screen.getByText('Load More')).toBeInTheDocument();
    });

    it('should load more contributions when Load More is clicked', () => {
      const contributions = Array.from({ length: 15 }, (_, i) =>
        createMockContribution({
          id: `contrib-${i}`,
          amount: BigInt((i + 1) * 1000000),
        })
      );
      
      render(<ContributionList contributions={contributions} pageSize={10} />);
      
      expect(screen.getByText('Showing 10 of 15 contributions')).toBeInTheDocument();
      
      // Click Load More
      fireEvent.click(screen.getByText('Load More'));
      
      // Should now show all contributions
      expect(screen.queryByText('Showing 10 of 15 contributions')).not.toBeInTheDocument();
      expect(screen.queryByText('Load More')).not.toBeInTheDocument();
    });

    it('should not show Load More when all contributions are visible', () => {
      const contributions = Array.from({ length: 5 }, (_, i) =>
        createMockContribution({
          id: `contrib-${i}`,
          amount: BigInt((i + 1) * 1000000),
        })
      );
      
      render(<ContributionList contributions={contributions} pageSize={10} />);
      
      // Should not show Load More button
      expect(screen.queryByText('Load More')).not.toBeInTheDocument();
      expect(screen.queryByText(/Showing \d+ of \d+ contributions/)).not.toBeInTheDocument();
    });
  });

  describe('Pagination - Server-side', () => {
    it('should call onLoadMore when Load More is clicked', () => {
      const onLoadMore = jest.fn();
      const contributions = [createMockContribution()];
      
      render(
        <ContributionList
          contributions={contributions}
          onLoadMore={onLoadMore}
          hasMore={true}
        />
      );
      
      expect(screen.getByText('Load More')).toBeInTheDocument();
      
      // Click Load More
      fireEvent.click(screen.getByText('Load More'));
      
      expect(onLoadMore).toHaveBeenCalledTimes(1);
    });

    it('should show loading state when isLoadingMore is true', () => {
      const contributions = [createMockContribution()];
      
      render(
        <ContributionList
          contributions={contributions}
          onLoadMore={() => {}}
          hasMore={true}
          isLoadingMore={true}
        />
      );
      
      const loadMoreButton = screen.getByRole('button', { name: /load more contributions/i });
      expect(loadMoreButton).toBeDisabled();
      expect(within(loadMoreButton).getByText('Loading...')).toBeInTheDocument();
    });

    it('should not show Load More when hasMore is false', () => {
      const contributions = [createMockContribution()];
      
      render(
        <ContributionList
          contributions={contributions}
          onLoadMore={() => {}}
          hasMore={false}
        />
      );
      
      expect(screen.queryByText('Load More')).not.toBeInTheDocument();
    });

    it('should not show client-side pagination indicator with server-side pagination', () => {
      const contributions = Array.from({ length: 15 }, (_, i) =>
        createMockContribution({
          id: `contrib-${i}`,
          amount: BigInt((i + 1) * 1000000),
        })
      );
      
      render(
        <ContributionList
          contributions={contributions}
          onLoadMore={() => {}}
          hasMore={true}
        />
      );
      
      // Should not show "Showing X of Y" indicator
      expect(screen.queryByText(/Showing \d+ of \d+ contributions/)).not.toBeInTheDocument();
    });
  });

  describe('Load More Control', () => {
    it('should hide Load More button when showLoadMore is false', () => {
      const contributions = Array.from({ length: 15 }, (_, i) =>
        createMockContribution({
          id: `contrib-${i}`,
          amount: BigInt((i + 1) * 1000000),
        })
      );
      
      render(
        <ContributionList
          contributions={contributions}
          pageSize={10}
          showLoadMore={false}
        />
      );
      
      expect(screen.queryByText('Load More')).not.toBeInTheDocument();
    });
  });

  describe('Timestamp Formatting', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should show "Just now" for very recent contributions', () => {
      const now = new Date('2024-01-15T12:00:00Z');
      jest.setSystemTime(now);

      const contributions = [
        createMockContribution({
          createdAt: new Date('2024-01-15T11:59:30Z'), // 30 seconds ago
        }),
      ];
      
      render(<ContributionList contributions={contributions} />);
      
      expect(screen.getByText('Just now')).toBeInTheDocument();
    });

    it('should show minutes for contributions within an hour', () => {
      const now = new Date('2024-01-15T12:00:00Z');
      jest.setSystemTime(now);

      const contributions = [
        createMockContribution({
          createdAt: new Date('2024-01-15T11:45:00Z'), // 15 minutes ago
        }),
      ];
      
      render(<ContributionList contributions={contributions} />);
      
      expect(screen.getByText('15 minutes ago')).toBeInTheDocument();
    });

    it('should show hours for contributions within a day', () => {
      const now = new Date('2024-01-15T12:00:00Z');
      jest.setSystemTime(now);

      const contributions = [
        createMockContribution({
          createdAt: new Date('2024-01-15T09:00:00Z'), // 3 hours ago
        }),
      ];
      
      render(<ContributionList contributions={contributions} />);
      
      expect(screen.getByText('3 hours ago')).toBeInTheDocument();
    });

    it('should show days for contributions within a week', () => {
      const now = new Date('2024-01-15T12:00:00Z');
      jest.setSystemTime(now);

      const contributions = [
        createMockContribution({
          createdAt: new Date('2024-01-13T12:00:00Z'), // 2 days ago
        }),
      ];
      
      render(<ContributionList contributions={contributions} />);
      
      expect(screen.getByText('2 days ago')).toBeInTheDocument();
    });

    it('should show formatted date for older contributions', () => {
      const now = new Date('2024-01-15T12:00:00Z');
      jest.setSystemTime(now);

      const contributions = [
        createMockContribution({
          createdAt: new Date('2024-01-01T12:00:00Z'), // 14 days ago
        }),
      ];
      
      render(<ContributionList contributions={contributions} />);
      
      expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument();
    });

    it('should use singular form for 1 minute/hour/day', () => {
      const now = new Date('2024-01-15T12:00:00Z');
      jest.setSystemTime(now);

      const contributions = [
        createMockContribution({
          id: 'contrib-1',
          createdAt: new Date('2024-01-15T11:59:00Z'), // 1 minute ago
        }),
        createMockContribution({
          id: 'contrib-2',
          createdAt: new Date('2024-01-15T11:00:00Z'), // 1 hour ago
        }),
        createMockContribution({
          id: 'contrib-3',
          createdAt: new Date('2024-01-14T12:00:00Z'), // 1 day ago
        }),
      ];
      
      render(<ContributionList contributions={contributions} />);
      
      expect(screen.getByText('1 minute ago')).toBeInTheDocument();
      expect(screen.getByText('1 hour ago')).toBeInTheDocument();
      expect(screen.getByText('1 day ago')).toBeInTheDocument();
    });
  });

  describe('Styling and Accessibility', () => {
    it('should apply custom className', () => {
      const contributions = [createMockContribution()];
      
      const { container } = render(
        <ContributionList contributions={contributions} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should have proper ARIA labels', () => {
      // Need more contributions than pageSize to show Load More button
      const contributions = Array.from({ length: 15 }, (_, i) =>
        createMockContribution({
          id: `contrib-${i}`,
          amount: BigInt((i + 1) * 1000000),
        })
      );
      
      render(<ContributionList contributions={contributions} pageSize={10} />);
      
      expect(screen.getByRole('list', { name: /contribution list/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /load more contributions/i })).toBeInTheDocument();
    });

    it('should show hover effect on contribution items', () => {
      const contributions = [createMockContribution()];
      
      const { container } = render(<ContributionList contributions={contributions} />);
      
      const contributionItem = container.querySelector('[role="listitem"]');
      expect(contributionItem).toHaveClass('hover:bg-gray-50');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large contribution amounts', () => {
      const contributions = [
        createMockContribution({
          amount: 1000000000000n, // 1,000,000 USDCx
        }),
      ];
      
      render(<ContributionList contributions={contributions} />);
      
      expect(screen.getByText('1000000.00 USDCx')).toBeInTheDocument();
    });

    it('should handle very small contribution amounts', () => {
      const contributions = [
        createMockContribution({
          amount: 1n, // 0.000001 USDCx
        }),
      ];
      
      render(<ContributionList contributions={contributions} />);
      
      expect(screen.getByText('0.00 USDCx')).toBeInTheDocument();
    });

    it('should handle short wallet addresses', () => {
      const contributions = [
        createMockContribution({
          contributorAddress: 'ST123',
        }),
      ];
      
      render(<ContributionList contributions={contributions} />);
      
      // Short addresses should not be truncated
      expect(screen.getByText('ST123')).toBeInTheDocument();
    });

    it('should handle contributions with same timestamp', () => {
      const sameTime = new Date('2024-01-15T10:00:00Z');
      const contributions = [
        createMockContribution({ id: 'contrib-1', createdAt: sameTime }),
        createMockContribution({ id: 'contrib-2', createdAt: sameTime }),
        createMockContribution({ id: 'contrib-3', createdAt: sameTime }),
      ];
      
      render(<ContributionList contributions={contributions} />);
      
      // All should render without errors
      expect(screen.getByText('(3 total)')).toBeInTheDocument();
    });
  });
});
