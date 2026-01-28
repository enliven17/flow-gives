/**
 * CommentSection - Component for displaying and adding comments on projects
 */

'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/lib/contexts/wallet.context';
import { formatWalletAddress } from '@/lib/utils/format';

export interface Comment {
  id: string;
  project_id: string;
  author_address: string;
  content: string;
  parent_id?: string | null;
  created_at: string;
  updated_at: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CommentSectionProps {
  projectId: string;
}

export function CommentSection({ projectId }: CommentSectionProps) {
  const { address, isConnected } = useWallet();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
  }, [projectId]);

  async function fetchComments() {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/comments`);

      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const data = await response.json();
      setComments(data);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isConnected || !address) {
      setError('Please connect your wallet to comment');
      return;
    }

    if (!newComment.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    if (newComment.length > 2000) {
      setError('Comment must be less than 2000 characters');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/projects/${projectId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authorAddress: address,
          content: newComment.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to post comment');
      }

      const comment = await response.json();
      setComments([comment, ...comments]);
      setNewComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  }

  // Group comments by parent (for future nested replies)
  const topLevelComments = comments.filter(c => !c.parent_id);
  const repliesMap = new Map<string, Comment[]>();
  comments.forEach(comment => {
    if (comment.parent_id) {
      if (!repliesMap.has(comment.parent_id)) {
        repliesMap.set(comment.parent_id, []);
      }
      repliesMap.get(comment.parent_id)!.push(comment);
    }
  });

  return (
    <div className="bg-background-secondary rounded-lg p-4 sm:p-6 md:p-8 border border-border-default">
      <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
        <span className="w-1 h-6 sm:h-8 bg-orange-500/60 rounded-full"></span>
        Comments ({comments.length})
      </h2>

      {/* Comment Form */}
      {isConnected ? (
        <form onSubmit={handleSubmit} className="mb-6 sm:mb-8">
          <div className="mb-3 sm:mb-4">
            <textarea
              value={newComment}
              onChange={(e) => {
                setNewComment(e.target.value);
                setError(null);
              }}
              placeholder="Share your thoughts about this project..."
              className="w-full px-4 py-3 bg-background-tertiary border border-border-default rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 resize-none transition-all"
              rows={4}
              maxLength={2000}
              disabled={submitting}
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-text-muted">
                {newComment.length}/2000 characters
              </p>
              {error && (
                <p className="text-xs text-accent-error">{error}</p>
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="px-5 py-2.5 glass-orange text-text-primary rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                Posting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Post Comment
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="mb-6 sm:mb-8 p-4 bg-background-tertiary/50 border border-border-default rounded-lg">
          <p className="text-sm text-text-secondary text-center">
            Please connect your wallet to leave a comment
          </p>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-8 sm:py-12">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-accent-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm sm:text-base text-text-secondary">Loading comments...</p>
        </div>
      ) : topLevelComments.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-background-tertiary flex items-center justify-center">
            <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-text-secondary">No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {topLevelComments.map((comment) => (
            <div
              key={comment.id}
              className="p-4 rounded-lg bg-background-tertiary/50 border border-border-default hover:bg-background-tertiary transition-colors"
            >
              <div className="flex items-start gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500/90 font-bold flex-shrink-0">
                  {formatWalletAddress(comment.author_address).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-text-primary">
                      {formatWalletAddress(comment.author_address)}
                    </p>
                    <span className="text-xs text-text-muted">
                      {new Date(comment.created_at || comment.createdAt || '').toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
