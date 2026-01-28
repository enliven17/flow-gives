# ContributionForm - Usage Examples

## Quick Start

```tsx
import { ContributionForm } from '@/lib/components';

<ContributionForm
  projectId="project-123"
  fundraiserAddress="ST1X6Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P"
/>
```

## Common Use Cases

### 1. Basic Project Contribution

```tsx
import { ContributionForm } from '@/lib/components';

function ProjectPage({ project }) {
  return (
    <div className="container mx-auto p-4">
      <h1>{project.title}</h1>
      
      {project.status === 'active' && (
        <ContributionForm
          projectId={project.id}
          fundraiserAddress={project.fundraiserAddress}
        />
      )}
    </div>
  );
}
```

### 2. With Success/Error Handling

```tsx
import { ContributionForm } from '@/lib/components';
import { toast } from 'react-hot-toast';

function ProjectPage({ project, onContributionSuccess }) {
  const handleSuccess = (result) => {
    toast.success('Contribution successful!');
    onContributionSuccess(result);
  };

  const handleError = (error) => {
    toast.error(`Contribution failed: ${error.message}`);
  };

  return (
    <ContributionForm
      projectId={project.id}
      fundraiserAddress={project.fundraiserAddress}
      onSuccess={handleSuccess}
      onError={handleError}
    />
  );
}
```

### 3. With Minimum Contribution Amount

```tsx
import { ContributionForm } from '@/lib/components';

function PremiumProjectPage({ project }) {
  return (
    <div>
      <h2>Premium Project - Minimum 100 USDCx</h2>
      <ContributionForm
        projectId={project.id}
        fundraiserAddress={project.fundraiserAddress}
        minAmount={100}
      />
    </div>
  );
}
```

### 4. With Project Data Refresh

```tsx
import { useState, useEffect } from 'react';
import { ContributionForm } from '@/lib/components';
import { projectService } from '@/lib/services/project.service';

function ProjectPage({ projectId }) {
  const [project, setProject] = useState(null);

  const loadProject = async () => {
    const data = await projectService.getProject(projectId);
    setProject(data);
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const handleSuccess = async () => {
    // Refresh project data to show updated totals
    await loadProject();
  };

  if (!project) return <div>Loading...</div>;

  return (
    <div>
      <h1>{project.title}</h1>
      <p>Raised: {project.totalRaised} / {project.fundingGoal} USDCx</p>
      
      <ContributionForm
        projectId={project.id}
        fundraiserAddress={project.fundraiserAddress}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
```

### 5. With Real-time Updates

```tsx
import { useState, useEffect } from 'react';
import { ContributionForm } from '@/lib/components';
import { supabase } from '@/lib/supabase/client';

function ProjectPage({ project }) {
  const [contributions, setContributions] = useState([]);

  useEffect(() => {
    // Subscribe to new contributions
    const subscription = supabase
      .channel('contributions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contributions',
          filter: `project_id=eq.${project.id}`,
        },
        (payload) => {
          setContributions((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [project.id]);

  return (
    <div>
      <h1>{project.title}</h1>
      
      <ContributionForm
        projectId={project.id}
        fundraiserAddress={project.fundraiserAddress}
      />
      
      <div className="mt-8">
        <h2>Recent Contributions</h2>
        {contributions.map((c) => (
          <div key={c.id}>
            {c.amount / 1_000_000} USDCx from {c.contributor_address}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 6. With Analytics Tracking

```tsx
import { ContributionForm } from '@/lib/components';
import { analytics } from '@/lib/analytics';

function ProjectPage({ project }) {
  const handleSuccess = (result) => {
    // Track successful contribution
    analytics.track('contribution_completed', {
      projectId: result.projectId,
      amount: Number(result.amount) / 1_000_000,
      txId: result.txId,
    });
  };

  const handleError = (error) => {
    // Track contribution failure
    analytics.track('contribution_failed', {
      projectId: project.id,
      error: error.message,
    });
  };

  return (
    <ContributionForm
      projectId={project.id}
      fundraiserAddress={project.fundraiserAddress}
      onSuccess={handleSuccess}
      onError={handleError}
    />
  );
}
```

### 7. With Custom Styling

```tsx
import { ContributionForm } from '@/lib/components';

function ProjectPage({ project }) {
  return (
    <div className="max-w-2xl mx-auto">
      <ContributionForm
        projectId={project.id}
        fundraiserAddress={project.fundraiserAddress}
        className="border-2 border-blue-500 rounded-xl"
      />
    </div>
  );
}
```

### 8. With Conditional Rendering

```tsx
import { ContributionForm } from '@/lib/components';
import { useWallet } from '@/lib/contexts/wallet.context';

function ProjectPage({ project }) {
  const { isConnected } = useWallet();

  return (
    <div>
      <h1>{project.title}</h1>
      
      {project.status === 'active' ? (
        isConnected ? (
          <ContributionForm
            projectId={project.id}
            fundraiserAddress={project.fundraiserAddress}
          />
        ) : (
          <div className="alert alert-info">
            Please connect your wallet to contribute
          </div>
        )
      ) : (
        <div className="alert alert-warning">
          This project is no longer accepting contributions
        </div>
      )}
    </div>
  );
}
```

### 9. With Loading State

```tsx
import { useState } from 'react';
import { ContributionForm } from '@/lib/components';

function ProjectPage({ project }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSuccess = async (result) => {
    setIsProcessing(true);
    try {
      // Perform additional actions
      await sendConfirmationEmail(result);
      await updateUserStats(result);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            Processing your contribution...
          </div>
        </div>
      )}
      
      <ContributionForm
        projectId={project.id}
        fundraiserAddress={project.fundraiserAddress}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
```

### 10. With Multiple Projects

```tsx
import { ContributionForm } from '@/lib/components';

function MultiProjectPage({ projects }) {
  const [selectedProject, setSelectedProject] = useState(null);

  return (
    <div>
      <h1>Choose a Project to Support</h1>
      
      <div className="grid grid-cols-3 gap-4 mb-8">
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => setSelectedProject(project)}
            className={`p-4 border rounded ${
              selectedProject?.id === project.id ? 'border-blue-500' : ''
            }`}
          >
            {project.title}
          </button>
        ))}
      </div>
      
      {selectedProject && (
        <ContributionForm
          projectId={selectedProject.id}
          fundraiserAddress={selectedProject.fundraiserAddress}
        />
      )}
    </div>
  );
}
```

## Integration Patterns

### With React Query

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ContributionForm } from '@/lib/components';

function ProjectPage({ project }) {
  const queryClient = useQueryClient();

  const handleSuccess = () => {
    // Invalidate and refetch project data
    queryClient.invalidateQueries(['project', project.id]);
    queryClient.invalidateQueries(['contributions', project.id]);
  };

  return (
    <ContributionForm
      projectId={project.id}
      fundraiserAddress={project.fundraiserAddress}
      onSuccess={handleSuccess}
    />
  );
}
```

### With Redux

```tsx
import { useDispatch } from 'react-redux';
import { ContributionForm } from '@/lib/components';
import { addContribution, refreshProject } from '@/store/actions';

function ProjectPage({ project }) {
  const dispatch = useDispatch();

  const handleSuccess = (result) => {
    dispatch(addContribution(result));
    dispatch(refreshProject(project.id));
  };

  return (
    <ContributionForm
      projectId={project.id}
      fundraiserAddress={project.fundraiserAddress}
      onSuccess={handleSuccess}
    />
  );
}
```

### With Form Library (React Hook Form)

```tsx
import { useForm } from 'react-hook-form';
import { ContributionForm } from '@/lib/components';

function ProjectPage({ project }) {
  const { setValue } = useForm();

  const handleSuccess = (result) => {
    // Update parent form with contribution data
    setValue('contributionTxId', result.txId);
    setValue('contributionAmount', result.amount);
  };

  return (
    <ContributionForm
      projectId={project.id}
      fundraiserAddress={project.fundraiserAddress}
      onSuccess={handleSuccess}
    />
  );
}
```

## Tips and Best Practices

1. **Always handle callbacks**: Implement both `onSuccess` and `onError` for better UX
2. **Refresh data**: Update project totals after successful contributions
3. **Show feedback**: Use toast notifications or modals to confirm actions
4. **Track analytics**: Monitor contribution patterns and success rates
5. **Handle edge cases**: Check project status before showing form
6. **Optimize performance**: Memoize callbacks to prevent unnecessary re-renders
7. **Test thoroughly**: Test with different wallet states and network conditions
8. **Provide context**: Show project details near the contribution form
9. **Set appropriate minimums**: Use `minAmount` based on project requirements
10. **Monitor transactions**: Keep users informed throughout the transaction process
