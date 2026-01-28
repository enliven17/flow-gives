# ContributionList Component

## Overview

The `ContributionList` component displays a list of contributions to a crowdfunding project. It shows contributor addresses (truncated for privacy), contribution amounts in USDCx, and timestamps. The component supports both client-side and server-side pagination with a "Load More" button.

## Features

- **Contribution Display**: Shows list of contributions with amounts, addresses, and timestamps
- **Address Truncation**: Displays wallet addresses in truncated format (first 6 + last 4 characters) for privacy
- **Timestamp Formatting**: Shows relative time (e.g., "5 minutes ago") or formatted dates
- **Pagination**: Supports both client-side and server-side pagination
- **Load More**: Optional "Load More" button for loading additional contributions
- **Loading States**: Displays skeleton loaders while fetching data
- **Empty State**: Shows friendly message when no contributions exist
- **Responsive Design**: Works on mobile, tablet, and desktop devices
- **Accessibility**: Proper ARIA labels and semantic HTML

## Requirements

Validates:
- **Requirement 6.4**: Display list of recent contributions with amounts and timestamps
- **Requirement 6.6**: Display contributor wallet addresses in truncated format for privacy

## Props

```typescript
interface ContributionListProps {
  // Required
  contributions: Contribution[];        // Array of contributions to display
  
  // Optional
  isLoading?: boolean;                  // Whether the list is loading (default: false)
  className?: string;                   // Additional CSS classes
  pageSize?: number;                    // Items per page (default: 10)
  showLoadMore?: boolean;               // Show Load More button (default: true)
  onLoadMore?: () => void;              // Callback for Load More (enables server-side pagination)
  hasMore?: boolean;                    // Whether more items available (server-side)
  isLoadingMore?: boolean;              // Whether Load More is loading (server-side)
}
```

## Usage

### Basic Usage

```tsx
import { ContributionList } from '@/lib/components/ContributionList';
import { Contribution } from '@/lib/models/project';

function ProjectDetailPage() {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch contributions
    fetchContributions().then(data => {
      setContributions(data);
      setIsLoading(false);
    });
  }, []);

  return (
    <div>
      <ContributionList
        contributions={contributions}
        isLoading={isLoading}
      />
    </div>
  );
}
```

### Client-Side Pagination

The component automatically handles client-side pagination when `onLoadMore` is not provided:

```tsx
<ContributionList
  contributions={allContributions}
  pageSize={10}
  showLoadMore={true}
/>
```

### Server-Side Pagination

For server-side pagination, provide the `onLoadMore` callback:

```tsx
function ProjectDetailPage() {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    const nextPage = page + 1;
    const newContributions = await fetchContributions(nextPage);
    
    setContributions([...contributions, ...newContributions]);
    setHasMore(newContributions.length > 0);
    setPage(nextPage);
    setIsLoadingMore(false);
  };

  return (
    <ContributionList
      contributions={contributions}
      onLoadMore={handleLoadMore}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
    />
  );
}
```

### Without Load More Button

```tsx
<ContributionList
  contributions={contributions}
  showLoadMore={false}
/>
```

### Custom Styling

```tsx
<ContributionList
  contributions={contributions}
  className="my-8"
/>
```

## Component States

### Loading State

Displays skeleton loaders while fetching data:

```tsx
<ContributionList
  contributions={[]}
  isLoading={true}
/>
```

### Empty State

Shows a friendly message when no contributions exist:

```tsx
<ContributionList
  contributions={[]}
  isLoading={false}
/>
```

### With Contributions

Displays the list of contributions with all details:

```tsx
<ContributionList
  contributions={contributions}
  isLoading={false}
/>
```

## Address Truncation

Contributor addresses are automatically truncated for privacy and space efficiency:

- **Format**: First 6 characters + "..." + Last 4 characters
- **Example**: `ST1X6Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P` → `ST1X6Y...7O8P`
- **Hover**: Full address shown in tooltip (title attribute)

This validates **Requirement 6.6**.

## Timestamp Formatting

Timestamps are displayed in a human-readable format:

- **< 1 minute**: "Just now"
- **< 1 hour**: "X minutes ago"
- **< 24 hours**: "X hours ago"
- **< 7 days**: "X days ago"
- **≥ 7 days**: Formatted date (e.g., "Jan 15, 2024")

## Pagination Behavior

### Client-Side Pagination

When `onLoadMore` is **not** provided:
- Component manages pagination internally
- Shows `pageSize` contributions initially
- "Load More" button loads next `pageSize` contributions
- Shows "Showing X of Y contributions" indicator
- No network requests on Load More

### Server-Side Pagination

When `onLoadMore` **is** provided:
- Parent component manages pagination
- "Load More" button calls `onLoadMore` callback
- Parent fetches and appends new contributions
- Uses `hasMore` prop to show/hide Load More button
- Uses `isLoadingMore` prop to show loading state

## Accessibility

The component follows accessibility best practices:

- **Semantic HTML**: Uses proper list elements (`role="list"`, `role="listitem"`)
- **ARIA Labels**: Descriptive labels for interactive elements
- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Readers**: Proper announcements for loading states and updates
- **Focus Management**: Clear focus indicators on interactive elements

## Styling

The component uses Tailwind CSS for styling:

- **Container**: White background with rounded corners and shadow
- **Contributions**: Hover effect on contribution items
- **Amounts**: Green badge for contribution amounts
- **Responsive**: Adapts to different screen sizes
- **Loading**: Animated skeleton loaders
- **Empty State**: Centered icon and message

## Integration with Services

The component works with the contribution service:

```tsx
import { contributionService } from '@/lib/services/contribution.service';

async function fetchProjectContributions(projectId: string) {
  const contributions = await contributionService.getProjectContributions(
    projectId,
    20 // limit
  );
  return contributions;
}
```

## Performance Considerations

- **Pagination**: Use pagination to avoid rendering large lists
- **Virtual Scrolling**: For very large lists, consider virtual scrolling
- **Memoization**: Memoize timestamp formatting for better performance
- **Lazy Loading**: Load contributions on demand with server-side pagination

## Related Components

- **ContributionForm**: Component for making contributions
- **ProjectCard**: Component for displaying project cards
- **ProjectList**: Component for displaying project lists

## Testing

The component has comprehensive unit tests covering:

- Rendering contributions with amounts and addresses
- Address truncation display
- Timestamp formatting (all time ranges)
- Loading states
- Empty states
- Client-side pagination
- Server-side pagination
- Load More functionality
- Accessibility features
- Edge cases (large amounts, short addresses, etc.)

Run tests:

```bash
npm test ContributionList.test.tsx
```

## Example: Complete Integration

```tsx
'use client';

import { useState, useEffect } from 'react';
import { ContributionList } from '@/lib/components/ContributionList';
import { contributionService } from '@/lib/services/contribution.service';
import { Contribution } from '@/lib/models/project';

export default function ProjectContributions({ projectId }: { projectId: string }) {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const pageSize = 20;

  // Initial load
  useEffect(() => {
    loadContributions();
  }, [projectId]);

  const loadContributions = async () => {
    try {
      setIsLoading(true);
      const data = await contributionService.getProjectContributions(
        projectId,
        pageSize
      );
      setContributions(data);
      setHasMore(data.length === pageSize);
      setOffset(pageSize);
    } catch (error) {
      console.error('Failed to load contributions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = async () => {
    try {
      setIsLoadingMore(true);
      const data = await contributionService.getProjectContributions(
        projectId,
        pageSize
      );
      setContributions([...contributions, ...data]);
      setHasMore(data.length === pageSize);
      setOffset(offset + pageSize);
    } catch (error) {
      console.error('Failed to load more contributions:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <ContributionList
      contributions={contributions}
      isLoading={isLoading}
      onLoadMore={handleLoadMore}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
    />
  );
}
```
