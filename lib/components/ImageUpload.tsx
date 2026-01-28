/**
 * ImageUpload - Component for uploading images to Supabase Storage
 * 
 * This component provides:
 * - File input for image selection
 * - Image preview
 * - Upload to Supabase Storage
 * - Progress indicator
 */

'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface ImageUploadProps {
  /**
   * Current image URL (for editing existing projects)
   */
  currentImageUrl?: string;
  
  /**
   * Callback when image is uploaded successfully
   */
  onImageUploaded?: (url: string) => void;
  
  /**
   * Optional className for styling
   */
  className?: string;
  
  /**
   * Maximum file size in MB (default: 5)
   */
  maxSizeMB?: number;
}

/**
 * ImageUpload component
 * 
 * Allows users to upload images to Supabase Storage and get a public URL.
 */
export function ImageUpload({
  currentImageUrl,
  onImageUploaded,
  className = '',
  maxSizeMB = 5,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle file selection
   */
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`Image size must be less than ${maxSizeMB}MB`);
      return;
    }

    setError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `project-images/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        // If bucket doesn't exist, provide helpful error message
        if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('not found')) {
          throw new Error(
            'Storage bucket not configured. Please run "npm run storage:setup" or create the bucket manually in Supabase Dashboard.'
          );
        }
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('project-images')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get image URL');
      }

      setUploadProgress(100);
      setPreview(urlData.publicUrl);

      // Call callback
      if (onImageUploaded) {
        onImageUploaded(urlData.publicUrl);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload image';
      setError(errorMessage);
      setPreview(null);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  /**
   * Handle remove image
   */
  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onImageUploaded) {
      onImageUploaded('');
    }
  };

  return (
    <div className={className}>
      {/* Image Preview */}
      {preview && (
        <div className="mb-4 relative">
          <img
            src={preview}
            alt="Project preview"
            className="w-full h-48 object-cover rounded-lg border border-border-default"
          />
          {!uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-2 bg-background-secondary/90 hover:bg-background-secondary rounded-full border border-border-default transition-colors"
              aria-label="Remove image"
            >
              <svg
                className="w-5 h-5 text-text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="mb-4">
          <div className="w-full bg-background-tertiary rounded-full h-2">
            <div
              className="bg-accent-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-text-secondary mt-2">Uploading image...</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-accent-error/20 border border-accent-error/30 rounded-lg">
          <p className="text-sm text-accent-error">{error}</p>
        </div>
      )}

      {/* File Input */}
      <div>
        <label
          htmlFor="image-upload"
          className="block text-sm font-medium text-text-primary mb-2"
        >
          Project Image {preview ? '(Change)' : '(Optional)'}
        </label>
        <input
          ref={fileInputRef}
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
        />
        <label
          htmlFor="image-upload"
          className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors min-h-[44px] touch-manipulation ${
            uploading
              ? 'border-border-default bg-background-tertiary cursor-not-allowed opacity-50'
              : 'border-border-default hover:border-accent-primary/50 bg-background-secondary'
          }`}
        >
          <svg
            className="w-5 h-5 text-text-secondary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-sm text-text-secondary">
            {uploading ? 'Uploading...' : preview ? 'Change Image' : 'Choose Image'}
          </span>
        </label>
        <p className="mt-2 text-xs text-text-muted">
          Supported formats: JPG, PNG, GIF, WebP (max {maxSizeMB}MB)
        </p>
      </div>
    </div>
  );
}
