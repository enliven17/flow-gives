# ContributionList Component - Usage Examples

## Quick Start

```tsx
import { ContributionList } from '@/lib/components/ContributionList';

<ContributionList contributions={contributions} />
```

## Common Use Cases

### 1. Basic Display (Client-Side Pagination)

Display contributions with automatic client-side pagination:

```tsx
import { ContributionList } from '@/lib/components/ContributionList';
import { Contribution } from '@/lib/models/project';

function ProjectPage() {
  const contributions: Contribution[] = [
    {
      id: '1',
      projectId: 'project-123',
      contributorAddress: 'ST1X6Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P',
      amount: 5000000n, // 5 USDCx
      txId: '0xabc123...',
      blockHeight: 12345,
      createdAt: new Date('2024-01-15T10:00:00Z'),
    },
    // ... more contributions
  ];

  return (
    <div className="container mx-auto p-4">
      <ContributionList
        contributions={contributions}
        pageSize={10}
      />
    </div>
  );
}
```

### 2. With Loading State

Show loading skeleton while fetching data:

```tsx
import { useState, useEffect } from 'react';
import { ContributionList } from '@/lib/components/ContributionList';
import { contributionService } from '@/lib/services/contribution.service';

function ProjectContributions({ projectId }: { projectId: string }) {
  const [contributions, setContributions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await contributionService.getProjectContributions(projectId);
        setContributions(data);
      } catch (error) {
        console.error('Failed to load contributions:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [projectId]);

  return (
    <ContributionList
      contributions={contributions}
      isLoading={isLoading}
    />
  );
}
```

### 3. Server-Side Pagination

Implement server-side pagination for large datasets:

```tsx
import { useState, useEffect } from 'react';
import { ContributionList } from '@/lib/components/ContributionList';

function ProjectContributions({ projectId }: { projectId: string }) {
  const [contributions, setContributions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Initial load
  useEffect(() => {
    loadInitialContributions();
  }, [projectId]);

  const loadInitialContributions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/contributions?page=1&limit=${pageSize}`
      );
      const data = await response.json();
      setContributions(data.contributions);
      setHasMore(data.hasMore);
      setPage(1);
    } catch (error) {
      console.error('Failed to load contributions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await fetch(
        `/api/projects/${projectId}/contributions?page=${nextPage}&limit=${pageSize}`
      );
      const data = await response.json();
      
      setContributions([...contributions, ...data.contributions]);
      setHasMore(data.hasMore);
      setPage(nextPage);
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

### 4. Real-Time Updates with Supabase

Update contributions in real-time using Supabase subscriptions:

```tsx
import { useState, useEffect } from 'react';
import { ContributionList } from '@/lib/components/ContributionList';
import { supabase } from '@/lib/supabase/client';
import { Contribution } from '@/lib/models/project';

function LiveContributions({ projectId }: { projectId: string }) {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load initial contributions
    loadContributions();

    // Subscribe to new contributions
    const subscription = supabase
      .channel('contributions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contributions',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          // Add new contribution to the list
          const newContribution = payload.new as Contribution;
          setContributions((prev) => [newContribution, ...prev]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [projectId]);

  const loadContributions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('contributions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setContributions(data || []);
    } catch (error) {
      console.error('Failed to load contributions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ContributionList
      contributions={contributions}
      isLoading={isLoading}
    />
  );
}
```

### 5. With Custom Page Size

Control how many contributions are shown per page:

```tsx
<ContributionList
  contributions={contributions}
  pageSize={5}  // Show 5 contributions at a time
/>
```

### 6. Without Load More Button

Display all contributions without pagination:

```tsx
<ContributionList
  contributions={contributions}
  showLoadMore={false}
/>
```

### 7. With Custom Styling

Add custom CSS classes for styling:

```tsx
<ContributionList
  contributions={contributions}
  className="my-8 max-w-4xl mx-auto"
/>
```

### 8. In a Modal or Sidebar

Use in a modal or sidebar with limited space:

```tsx
import { Dialog } from '@headlessui/react';

function ContributionsModal({ isOpen, onClose, projectId }) {
  const [contributions, setContributions] = useState([]);

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <Dialog.Panel className="max-w-2xl mx-auto bg-white rounded-lg p-6">
        <Dialog.Title className="text-2xl font-bold mb-4">
          Project Contributions
        </Dialog.Title>
        
        <div className="max-h-96 overflow-y-auto">
          <ContributionList
            contributions={contributions}
            pageSize={10}
            className="shadow-none"
          />
        </div>
        
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-gray-200 rounded"
        >
          Close
        </button>
      </Dialog.Panel>
    </Dialog>
  );
}
```

### 9. With Error Handling

Handle errors gracefully:

```tsx
import { useState, useEffect } from 'react';
import { ContributionList } from '@/lib/components/ContributionList';

function ProjectContributions({ projectId }: { projectId: string }) {
  const [contributions, setContributions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await contributionService.getProjectContributions(projectId);
        setContributions(data);
      } catch (err) {
        setError('Failed to load contributions. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [projectId]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-red-600 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <ContributionList
      contributions={contributions}
      isLoading={isLoading}
    />
  );
}
```

### 10. Complete Project Detail Page Example

Full integration in a project detail page:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { ContributionList } from '@/lib/components/ContributionList';
import { ContributionForm } from '@/lib/components/ContributionForm';
import { contributionService } from '@/lib/services/contribution.service';
import { projectService } from '@/lib/services/project.service';
import { Project, Contribution } from '@/lib/models/project';

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjectData();
  }, [params.id]);

  const loadProjectData = async () => {
    try {
      setIsLoading(true);
      
      // Load project and contributions in parallel
      const [projectData, contributionsData] = await Promise.all([
        projectService.getProject(params.id),
        contributionService.getProjectContributions(params.id, 20),
      ]);
      
      setProject(projectData);
      setContributions(contributionsData);
    } catch (error) {
      console.error('Failed to load project data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContributionSuccess = () => {
    // Reload contributions after successful contribution
    loadProjectData();
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!project) {
    return <div>Project not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Project Details */}
        <div className="lg:col-span-2">
          <h1 className="text-4xl font-bold mb-4">{project.title}</h1>
          <p className="text-gray-700 mb-8">{project.description}</p>
          
          {/* Funding Progress */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Raised</span>
              <span className="font-semibold">
                {formatUSDCx(project.totalRaised)} USDCx
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${Math.min(project.percentFunded, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{project.contributorCount} contributors</span>
              <span>{formatTimeRemaining(project.timeRemaining)}</span>
            </div>
          </div>

          {/* Contributions List */}
          <ContributionList
            contributions={contributions}
            isLoading={isLoading}
          />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {project.isActive && (
            <ContributionForm
              projectId={project.id}
              fundraiserAddress={project.fundraiserAddress}
              onSuccess={handleContributionSuccess}
            />
          )}
        </div>
      </div>
    </div>
  );
}
```

## Tips and Best Practices

1. **Use Server-Side Pagination**: For projects with many contributions, use server-side pagination to improve performance
2. **Real-Time Updates**: Consider using Supabase subscriptions for real-time contribution updates
3. **Error Handling**: Always handle errors gracefully and provide retry options
4. **Loading States**: Show loading states to improve perceived performance
5. **Accessibility**: The component is accessible by default, but ensure your integration maintains accessibility
6. **Performance**: Use pagination to avoid rendering large lists
7. **Styling**: Customize the component with the `className` prop to match your design
8. **Testing**: Test your integration with different data scenarios (empty, loading, error, etc.)

## Common Patterns

### Pattern 1: Infinite Scroll

Convert Load More to infinite scroll:

```tsx
import { useEffect, useRef } from 'react';

function InfiniteContributions({ projectId }) {
  const [contributions, setContributions] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      { threshold: 1.0 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore]);

  const loadMore = async () => {
    // Load more contributions
  };

  return (
    <>
      <ContributionList
        contributions={contributions}
        showLoadMore={false}
      />
      <div ref={observerRef} className="h-10" />
    </>
  );
}
```

### Pattern 2: Filter by Contributor

Filter contributions by specific contributor:

```tsx
function ContributorContributions({ contributorAddress }) {
  const [contributions, setContributions] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const data = await contributionService.getContributorContributions(
        contributorAddress
      );
      setContributions(data);
    }
    fetchData();
  }, [contributorAddress]);

  return (
    <ContributionList
      contributions={contributions}
      showLoadMore={false}
    />
  );
}
```

### Pattern 3: Export Contributions

Add export functionality:

```tsx
function ExportableContributions({ projectId }) {
  const [contributions, setContributions] = useState([]);

  const exportToCSV = () => {
    const csv = contributions.map(c => 
      `${c.contributorAddress},${formatUSDCx(c.amount)},${c.createdAt}`
    ).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contributions.csv';
    a.click();
  };

  return (
    <>
      <button onClick={exportToCSV} className="mb-4">
        Export to CSV
      </button>
      <ContributionList contributions={contributions} />
    </>
  );
}
```
