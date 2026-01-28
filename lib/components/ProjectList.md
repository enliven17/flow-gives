# ProjectList Component

## Overview

The `ProjectList` component displays a grid of project cards with filtering and sorting capabilities. It provides a comprehensive interface for browsing crowdfunding projects with status filters, sort options, and responsive design.

## Features

- **Grid Display**: Responsive grid layout that adapts to different screen sizes
- **Status Filtering**: Filter projects by status (all, active, funded, expired, draft, cancelled)
- **Sorting Options**: Sort projects by newest, most funded, or ending soon
- **Loading State**: Skeleton loading cards with animations
- **Empty State**: User-friendly message when no projects match filters
- **Results Count**: Display count of filtered projects
- **Accessibility**: Full keyboard navigation and ARIA labels

## Requirements

Validates the following requirements:
- **5.1**: Display all active projects on homepage
- **5.2**: Show project cards in responsive grid layout
- **5.3**: Allow users to filter projects by status
- **5.4**: Allow users to sort projects by newest, most funded, and ending soon

## Usage

### Basic Usage

```tsx
import { ProjectList } from '@/lib/components/ProjectList';
import { Project } from '@/lib/models/project';

function HomePage({ projects }: { projects: Project[] }) {
  return (
    <ProjectList
      projects={projects}
      onProjectClick={(projectId) => {
        router.push(`/projects/${projectId}`);
      }}
    />
  );
}
```

### With Loading State

```tsx
function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProjects().then((data) => {
      setProjects(data);
      setIsLoading(false);
    });
  }, []);

  return (
    <ProjectList
      projects={projects}
      isLoading={isLoading}
      onProjectClick={(projectId) => {
        router.push(`/projects/${projectId}`);
      }}
    />
  );
}
```

### Without Controls

```tsx
// Display projects without filter/sort controls
<ProjectList
  projects={projects}
  showControls={false}
  onProjectClick={handleProjectClick}
/>
```

### With Initial Filters

```tsx
// Start with active projects sorted by ending soon
<ProjectList
  projects={projects}
  initialStatusFilter={ProjectStatus.ACTIVE}
  initialSort="endingSoon"
  onProjectClick={handleProjectClick}
/>
```

## Props

### `projects` (required)
- **Type**: `Project[]`
- **Description**: Array of projects to display

### `isLoading` (optional)
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Whether the list is currently loading. Shows skeleton loading cards when true.

### `onProjectClick` (optional)
- **Type**: `(projectId: string) => void`
- **Description**: Callback function called when a project card is clicked

### `className` (optional)
- **Type**: `string`
- **Default**: `''`
- **Description**: Additional CSS classes to apply to the container

### `showControls` (optional)
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Whether to show filter and sort controls

### `initialStatusFilter` (optional)
- **Type**: `ProjectStatus | 'all'`
- **Default**: `'all'`
- **Description**: Initial status filter to apply

### `initialSort` (optional)
- **Type**: `'newest' | 'mostFunded' | 'endingSoon'`
- **Default**: `'newest'`
- **Description**: Initial sort option to apply

## Filtering

The component supports filtering by project status:

- **All Projects**: Shows all projects regardless of status
- **Active**: Shows only active projects accepting contributions
- **Funded**: Shows only projects that reached their funding goal
- **Expired**: Shows only projects past their deadline
- **Draft**: Shows only draft projects (not published)
- **Cancelled**: Shows only cancelled projects

## Sorting

The component supports three sorting options:

### Newest
Sorts projects by creation date in descending order (newest first).

**Implementation**: `projects.sort((a, b) => b.createdAt - a.createdAt)`

### Most Funded
Sorts projects by total raised amount in descending order (highest first).

**Implementation**: `projects.sort((a, b) => b.totalRaised - a.totalRaised)`

### Ending Soon
Sorts projects by deadline in ascending order (soonest first).

**Implementation**: `projects.sort((a, b) => a.deadline - b.deadline)`

## States

### Loading State
Displays 6 skeleton loading cards with animated pulse effects.

### Empty State
Shows when no projects match the current filters. Displays:
- Icon
- "No projects found" heading
- Context-specific message based on active filter
- Suggestion to change filters

### Normal State
Displays:
- Filter and sort controls (if `showControls` is true)
- Results count
- Grid of project cards

## Responsive Design

The component uses a responsive grid layout:
- **Mobile** (< 768px): 1 column
- **Tablet** (768px - 1024px): 2 columns
- **Desktop** (> 1024px): 3 columns

Controls stack vertically on mobile and display horizontally on larger screens.

## Accessibility

The component follows accessibility best practices:

- **Semantic HTML**: Uses proper list structure with `role="list"` and `role="listitem"`
- **Labels**: All form controls have associated labels
- **ARIA Attributes**: Proper ARIA labels for screen readers
- **Keyboard Navigation**: Full keyboard support for all interactive elements
- **Loading States**: Proper `role="status"` for loading indicators

## Styling

The component uses Tailwind CSS for styling with:
- Responsive grid layout
- Hover effects on dropdowns
- Focus states for keyboard navigation
- Smooth transitions
- Consistent spacing and typography

## Performance Considerations

- **Memoization**: Uses `useMemo` to prevent unnecessary re-sorting/filtering
- **Efficient Sorting**: Sorting algorithms are optimized for performance
- **Lazy Loading**: Consider implementing pagination for large datasets

## Testing

The component has comprehensive test coverage including:
- Display and layout tests
- Filtering functionality tests
- Sorting functionality tests
- Loading and empty state tests
- Accessibility tests
- Edge case handling

Run tests with:
```bash
npm test -- lib/components/ProjectList.test.tsx
```

## Related Components

- **ProjectCard**: Individual project card component
- **Project Model**: Data structure for projects

## Future Enhancements

Potential improvements for future versions:
- Pagination or infinite scroll for large datasets
- Search functionality
- Category filtering
- Multiple status filters
- Save filter preferences
- Export filtered results
