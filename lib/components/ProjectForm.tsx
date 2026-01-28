'use client';

import { useState } from 'react';
import { useWallet } from '@/lib/contexts/wallet.context';
import { ImageUpload } from './ImageUpload';

export interface ProjectFormProps {
  onSuccess?: (projectId: string) => void;
  initialData?: {
    title?: string;
    description?: string;
    fundingGoal?: string;
    deadline?: string;
    imageUrl?: string;
    category?: string;
  };
  projectId?: string;
  mode?: 'create' | 'edit';
}

interface FormErrors {
  title?: string;
  description?: string;
  fundingGoal?: string;
  deadline?: string;
  general?: string;
}

export function ProjectForm({
  onSuccess,
  initialData,
  projectId,
  mode = 'create',
}: ProjectFormProps) {
  const { address, isConnected } = useWallet();
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    fundingGoal: initialData?.fundingGoal || '',
    deadline: initialData?.deadline || '',
    imageUrl: initialData?.imageUrl || '',
    category: initialData?.category || '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be 200 characters or less';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.fundingGoal) {
      newErrors.fundingGoal = 'Funding goal is required';
    } else {
      const goal = parseFloat(formData.fundingGoal);
      if (isNaN(goal) || goal <= 0) {
        newErrors.fundingGoal = 'Funding goal must be greater than 0';
      }
    }

    if (!formData.deadline) {
      newErrors.deadline = 'Deadline is required';
    } else {
      const deadlineDate = new Date(formData.deadline);
      const now = new Date();
      if (deadlineDate <= now) {
        newErrors.deadline = 'Deadline must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (publish: boolean = false) => {
    if (!isConnected || !address) {
      setErrors({ general: 'Please connect your wallet first' });
      return;
    }

    if (!validateForm()) {
      return;
    }

    if (publish) {
      setIsPublishing(true);
    } else {
      setIsSubmitting(true);
    }

    try {
      // Convert funding goal to micro-USDCx (6 decimals)
      const fundingGoalUSDCx = BigInt(Math.floor(parseFloat(formData.fundingGoal) * 1_000_000));

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        fundingGoal: fundingGoalUSDCx.toString(),
        deadline: new Date(formData.deadline).toISOString(),
        fundraiserAddress: address,
        imageUrl: formData.imageUrl.trim() || undefined,
        category: formData.category.trim() || undefined,
      };

      let response;
      
      if (mode === 'edit' && projectId) {
        // Update existing project
        response = await fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new project
        response = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save project');
      }

      const project = await response.json();

      // If publishing, make publish request
      if (publish) {
        const publishResponse = await fetch(`/api/projects/${project.id}/publish`, {
          method: 'POST',
        });

        if (!publishResponse.ok) {
          const errorData = await publishResponse.json();
          throw new Error(errorData.error || 'Failed to publish project');
        }
      }

      if (onSuccess) {
        onSuccess(project.id);
      }
    } catch (err) {
      setErrors({
        general: err instanceof Error ? err.message : 'An error occurred',
      });
    } finally {
      setIsSubmitting(false);
      setIsPublishing(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-accent-warning/20 border border-accent-warning/30 rounded-lg p-6">
        <p className="text-accent-warning">
          Please connect your wallet to create a project.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(false);
      }}
      className="space-y-6"
    >
      {errors.general && (
        <div className="bg-accent-error/20 border border-accent-error/30 rounded-lg p-4">
          <p className="text-accent-error">{errors.general}</p>
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-text-primary mb-2">
          Project Title *
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className={`w-full px-4 py-3 sm:py-2 bg-background-secondary border rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary text-text-primary placeholder-text-muted text-base sm:text-sm min-h-[44px] touch-manipulation ${
            errors.title ? 'border-accent-error' : 'border-border-default'
          }`}
          placeholder="Enter project title"
          maxLength={200}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-accent-error">{errors.title}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-text-primary mb-2">
          Description *
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={6}
          className={`w-full px-4 py-3 sm:py-2 bg-background-secondary border rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary text-text-primary placeholder-text-muted text-base sm:text-sm min-h-[44px] touch-manipulation ${
            errors.description ? 'border-accent-error' : 'border-border-default'
          }`}
          placeholder="Describe your project"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-accent-error">{errors.description}</p>
        )}
      </div>

      {/* Funding Goal */}
      <div>
        <label htmlFor="fundingGoal" className="block text-sm font-medium text-text-primary mb-2">
          Funding Goal (USDCx) *
        </label>
        <input
          type="number"
          id="fundingGoal"
          value={formData.fundingGoal}
          onChange={(e) => setFormData({ ...formData, fundingGoal: e.target.value })}
          step="0.01"
          min="0"
          className={`w-full px-4 py-3 sm:py-2 bg-background-secondary border rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary text-text-primary placeholder-text-muted text-base sm:text-sm min-h-[44px] touch-manipulation ${
            errors.fundingGoal ? 'border-accent-error' : 'border-border-default'
          }`}
          placeholder="0.00"
        />
        {errors.fundingGoal && (
          <p className="mt-1 text-sm text-accent-error">{errors.fundingGoal}</p>
        )}
      </div>

      {/* Deadline */}
      <div>
        <label htmlFor="deadline" className="block text-sm font-medium text-text-primary mb-2">
          Deadline *
        </label>
        <input
          type="datetime-local"
          id="deadline"
          value={formData.deadline}
          onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
          className={`w-full px-4 py-2 bg-background-secondary border rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary text-text-primary ${
            errors.deadline ? 'border-accent-error' : 'border-border-default'
          }`}
        />
        {errors.deadline && (
          <p className="mt-1 text-sm text-accent-error">{errors.deadline}</p>
        )}
      </div>

      {/* Image Upload */}
      <div>
        <ImageUpload
          currentImageUrl={formData.imageUrl}
          onImageUploaded={(url) => setFormData({ ...formData, imageUrl: url })}
          maxSizeMB={5}
        />
        {/* Fallback: Manual URL input */}
        <div className="mt-4">
          <label htmlFor="imageUrl" className="block text-sm font-medium text-text-secondary mb-2">
            Or enter image URL manually:
          </label>
          <input
            type="url"
            id="imageUrl"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            className="w-full px-4 py-3 sm:py-2 bg-background-secondary border border-border-default rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary text-text-primary placeholder-text-muted text-base sm:text-sm min-h-[44px] touch-manipulation"
            placeholder="https://example.com/image.jpg"
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-text-primary mb-2">
          Category (optional)
        </label>
        <input
          type="text"
          id="category"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full px-4 py-3 sm:py-2 bg-background-secondary border border-border-default rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary text-text-primary placeholder-text-muted text-base sm:text-sm min-h-[44px] touch-manipulation"
          placeholder="e.g., Technology, Art, Community"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <button
          type="submit"
          disabled={isSubmitting || isPublishing}
          className="flex-1 px-6 py-3 sm:py-2.5 bg-background-tertiary text-text-primary rounded-lg hover:bg-background-tertiary/80 active:bg-background-tertiary/70 disabled:bg-background-tertiary/50 disabled:cursor-not-allowed transition-colors border border-border-default min-h-[44px] touch-manipulation text-base sm:text-sm"
        >
          {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update Draft' : 'Save Draft'}
        </button>
        <button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={isSubmitting || isPublishing}
          className="flex-1 px-5 sm:px-6 py-2.5 sm:py-2.5 glass-orange text-text-primary rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[44px] touch-manipulation text-sm sm:text-base font-medium"
        >
          {isPublishing ? 'Publishing...' : mode === 'edit' ? 'Update & Publish' : 'Publish'}
        </button>
      </div>
    </form>
  );
}
