# ProjectList Component - Usage Examples

## Table of Contents
1. [Basic Usage](#basic-usage)
2. [With API Integration](#with-api-integration)
3. [With Loading State](#with-loading-state)
4. [Homepage Integration](#homepage-integration)
5. [My Projects Page](#my-projects-page)
6. [Category Page](#category-page)
7. [Custom Styling](#custom-styling)
8. [Advanced Patterns](#advanced-patterns)

---

## 1. Basic Usage

The simplest way to use the ProjectList component:

```tsx
import { ProjectList } from '@/lib/components/ProjectList';
import { Project } from '@/lib/models/project';

function ProjectsPage({ projects }: { projects: Project[] }) {
  const handleProjectClick = (projectId: string) => {
    console.log('Project clicked:', projectId);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Browse Projects</h1>
      <ProjectList
        projects={projects}
        onProjectClick={handleProjectClick}
      />
    </div>
  );
}
```

---

## 2. With API Integration

Fetch projects from API and display with loading state:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { ProjectList } from '@/lib/components/ProjectList';
import { Project } from '@/lib/models/project';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/projects');
        if (!response.ok) throw new Error('Failed to fetch projects');
        const data = await response.json();
        setProjects(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProjects();
  }, []);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Browse Projects</h1>
      <ProjectList
        projects={projects}
        isLoading={isLoading}
        onProjectClick={(id) => window.location.href = `/projects/${id}`}
      />
    </div>
  );
}
```

---

## 3. With Loading State

Show loading state while fetching data:

```tsx
import { ProjectList } from '@/lib/components/ProjectList';

function ProjectsPage() {
  const { projects, isLoading } = useProjects(); // Custom hook

  return (
    <ProjectList
      projects={projects}
      isLoading={isLoading}
      onProjectClick={(id) => router.push(`/projects/${id}`)}
    />
  );
}
```

---

## 4. Homepage Integration

Display active projects on the homepage:

```tsx
// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectList } from '@/lib/components/ProjectList';
import { WalletConnectButton } from '@/lib/components/WalletConnectButton';
import { Project, ProjectStatus } from '@/lib/models/project';

export default function HomePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchActiveProjects() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/projects?status=active');
        const data = await response.json();
        setProjects(data);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchActiveProjects();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">StacksGives</h1>
          <WalletConnectButton />
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Support Stacks Ecosystem Projects
          </h2>
          <p className="text-xl mb-8">
            Transparent crowdfunding powered by blockchain
          </p>
          <button
            onClick={() => router.push('/projects/new')}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Create Project
          </button>
        </div>
      </section>

      {/* Projects Section */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8">Active Projects</h2>
        <ProjectList
          projects={projects}
          isLoading={isLoading}
          initialStatusFilter={ProjectStatus.ACTIVE}
          initialSort="endingSoon"
          onProjectClick={(id) => router.push(`/projects/${id}`)}
        />
      </section>
    </div>
  );
}
```

---

## 5. My Projects Page

Display user's projects with all statuses:

```tsx
// app/my-projects/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectList } from '@/lib/components/ProjectList';
import { useWallet } from '@/lib/contexts/wallet.context';
import { Project } from '@/lib/models/project';

export default function MyProjectsPage() {
  const router = useRouter();
  const { address, isConnected } = useWallet();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isConnected || !address) {
      router.push('/');
      return;
    }

    async function fetchMyProjects() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/projects?fundraiser=${address}`);
        const data = await response.json();
        setProjects(data);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMyProjects();
  }, [address, isConnected, router]);

  if (!isConnected) {
    return null; // Will redirect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Projects</h1>
        <button
          onClick={() => router.push('/projects/new')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Create New Project
        </button>
      </div>

      <ProjectList
        projects={projects}
        isLoading={isLoading}
        initialStatusFilter="all"
        initialSort="newest"
        onProjectClick={(id) => router.push(`/projects/${id}`)}
      />
    </div>
  );
}
```

---

## 6. Category Page

Display projects filtered by category:

```tsx
// app/categories/[category]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ProjectList } from '@/lib/components/ProjectList';
import { Project, ProjectStatus } from '@/lib/models/project';

export default function CategoryPage() {
  const router = useRouter();
  const params = useParams();
  const category = params.category as string;
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCategoryProjects() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/projects?category=${category}`);
        const data = await response.json();
        setProjects(data);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCategoryProjects();
  }, [category]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2 capitalize">
        {category.replace('-', ' ')} Projects
      </h1>
      <p className="text-gray-600 mb-8">
        Browse crowdfunding projects in the {category} category
      </p>

      <ProjectList
        projects={projects}
        isLoading={isLoading}
        initialStatusFilter={ProjectStatus.ACTIVE}
        initialSort="mostFunded"
        onProjectClick={(id) => router.push(`/projects/${id}`)}
      />
    </div>
  );
}
```

---

## 7. Custom Styling

Apply custom styling to the ProjectList:

```tsx
import { ProjectList } from '@/lib/components/ProjectList';

function StyledProjectList({ projects }: { projects: Project[] }) {
  return (
    <div className="bg-gray-100 rounded-xl p-6">
      <ProjectList
        projects={projects}
        className="max-w-7xl mx-auto"
        onProjectClick={(id) => console.log(id)}
      />
    </div>
  );
}
```

### Custom Grid Layout

```tsx
// Override grid columns with custom CSS
<div className="custom-project-grid">
  <ProjectList
    projects={projects}
    onProjectClick={handleClick}
  />
</div>

// In your CSS file:
.custom-project-grid [role="list"] {
  grid-template-columns: repeat(4, 1fr);
}

@media (max-width: 1280px) {
  .custom-project-grid [role="list"] {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .custom-project-grid [role="list"] {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

---

## 8. Advanced Patterns

### With Real-time Updates

Use Supabase real-time subscriptions:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { ProjectList } from '@/lib/components/ProjectList';
import { Project } from '@/lib/models/project';
import { supabase } from '@/lib/supabase/client';

export default function LiveProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    async function fetchProjects() {
      const response = await fetch('/api/projects');
      const data = await response.json();
      setProjects(data);
      setIsLoading(false);
    }
    fetchProjects();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
        },
        (payload) => {
          // Refetch projects on any change
          fetchProjects();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <ProjectList
      projects={projects}
      isLoading={isLoading}
      onProjectClick={(id) => window.location.href = `/projects/${id}`}
    />
  );
}
```

### With Pagination

Add pagination to the project list:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { ProjectList } from '@/lib/components/ProjectList';
import { Project } from '@/lib/models/project';

export default function PaginatedProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    async function fetchProjects() {
      setIsLoading(true);
      const response = await fetch(
        `/api/projects?limit=${pageSize}&offset=${(page - 1) * pageSize}`
      );
      const data = await response.json();
      setProjects(data.projects);
      setTotalPages(Math.ceil(data.total / pageSize));
      setIsLoading(false);
    }
    fetchProjects();
  }, [page]);

  return (
    <div className="container mx-auto px-4 py-8">
      <ProjectList
        projects={projects}
        isLoading={isLoading}
        onProjectClick={(id) => window.location.href = `/projects/${id}`}
      />

      {/* Pagination Controls */}
      <div className="flex justify-center gap-2 mt-8">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300"
        >
          Previous
        </button>
        <span className="px-4 py-2">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300"
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

### Without Controls (Embedded View)

Display projects without filter/sort controls:

```tsx
import { ProjectList } from '@/lib/components/ProjectList';

function FeaturedProjects({ projects }: { projects: Project[] }) {
  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">Featured Projects</h2>
        <ProjectList
          projects={projects.slice(0, 3)}
          showControls={false}
          onProjectClick={(id) => window.location.href = `/projects/${id}`}
        />
      </div>
    </section>
  );
}
```

### With Search

Combine with search functionality:

```tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { ProjectList } from '@/lib/components/ProjectList';
import { Project } from '@/lib/models/project';

export default function SearchableProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      const response = await fetch('/api/projects');
      const data = await response.json();
      setProjects(data);
      setIsLoading(false);
    }
    fetchProjects();
  }, []);

  // Filter projects by search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects;
    
    const query = searchQuery.toLowerCase();
    return projects.filter(
      project =>
        project.title.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query) ||
        project.category?.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Browse Projects</h1>

      {/* Search Input */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <ProjectList
        projects={filteredProjects}
        isLoading={isLoading}
        onProjectClick={(id) => window.location.href = `/projects/${id}`}
      />
    </div>
  );
}
```

---

## Tips and Best Practices

### 1. Performance
- Use `useMemo` for expensive filtering operations
- Consider pagination for large datasets
- Implement virtual scrolling for very large lists

### 2. User Experience
- Always provide loading states
- Show meaningful empty states
- Provide clear feedback for filter changes
- Consider saving filter preferences

### 3. Accessibility
- Ensure keyboard navigation works
- Test with screen readers
- Maintain proper focus management
- Use semantic HTML

### 4. Error Handling
- Handle API errors gracefully
- Provide retry mechanisms
- Show user-friendly error messages
- Log errors for debugging

### 5. Mobile Optimization
- Test on various screen sizes
- Ensure touch targets are large enough
- Consider mobile-specific layouts
- Optimize images for mobile

---

## Common Issues and Solutions

### Issue: Projects not updating after filter change
**Solution**: Ensure you're using the component's internal state management or properly managing external state.

### Issue: Loading state not showing
**Solution**: Make sure `isLoading` prop is set to `true` before data fetch and `false` after.

### Issue: Click handler not working
**Solution**: Verify `onProjectClick` prop is passed and the function is defined correctly.

### Issue: Styling conflicts
**Solution**: Use the `className` prop to add custom styles without conflicts.

---

## Related Documentation

- [ProjectList Component Documentation](./ProjectList.md)
- [ProjectCard Component](./ProjectCard.tsx)
- [Project Model](../models/project.ts)
- [API Routes](../../app/api/projects/README.md)
