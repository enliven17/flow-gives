'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/lib/components/Navbar';
import { WalletProvider } from '@/lib/contexts/wallet.context';
import { ContributionForm } from '@/lib/components/ContributionForm';
import { CommentSection } from '@/lib/components/CommentSection';
import { Footer } from '@/lib/components/Footer';
import { Project, Contribution } from '@/lib/models/project';
import { formatFlow, formatWalletAddress, calculateFundingPercentage, calculateTimeRemaining } from '@/lib/utils/format';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

function ProjectDetailContent() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingContributions, setLoadingContributions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProject() {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${projectId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch project');
        }

        const data = await response.json();
        // Convert date strings back to Date objects and BigInt strings to BigInt
        const projectWithDates = {
          ...data,
          fundingGoal: typeof data.fundingGoal === 'string' ? BigInt(data.fundingGoal) : data.fundingGoal,
          totalRaised: typeof data.totalRaised === 'string' ? BigInt(data.totalRaised) : data.totalRaised,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
          deadline: new Date(data.deadline),
          publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined,
        };
        setProject(projectWithDates);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    async function fetchContributions() {
      try {
        setLoadingContributions(true);
        const response = await fetch(`/api/projects/${projectId}/contributions`);

        if (response.ok) {
          const data = await response.json();
          // Convert BigInt strings to BigInt and date strings to Date objects
          const contributionsWithTypes = data.map((contrib: any) => ({
            ...contrib,
            amount: typeof contrib.amount === 'string' ? BigInt(contrib.amount) : contrib.amount,
            createdAt: new Date(contrib.createdAt),
          }));
          setContributions(contributionsWithTypes);
        }
      } catch (err) {
        console.error('Failed to fetch contributions:', err);
      } finally {
        setLoadingContributions(false);
      }
    }

    fetchProject();
    fetchContributions();

    // Set up real-time subscriptions only on client-side
    if (typeof window === 'undefined') {
      return;
    }

    // Set up real-time subscription for project updates
    const projectChannel = supabase
      .channel(`project-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`,
        },
        (payload) => {
          // Update project with new data
          if (payload.new) {
            setProject((prev) => {
              if (!prev) return null;
              // Handle both old and new schema
              const rowAny = payload.new as any;
              return {
                ...prev,
                totalRaised: BigInt(rowAny.current_amount || rowAny.total_raised || 0),
                contributorCount: rowAny.contributor_count || 0,
                status: (rowAny.status || prev.status) as typeof prev.status,
                updatedAt: new Date(rowAny.updated_at || Date.now()),
              };
            });
          }
        }
      )
      .subscribe();

    // Set up real-time subscription for new contributions
    const contributionsChannel = supabase
      .channel(`contributions-${projectId}`)
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
          if (payload.new) {
            const rowAny = payload.new as any;
            const newContribution: Contribution = {
              id: rowAny.id,
              projectId: rowAny.project_id,
              contributorAddress: rowAny.contributor_address,
              amount: BigInt(rowAny.amount),
              txId: rowAny.tx_hash || rowAny.tx_id, // Support both schemas
              blockHeight: rowAny.block_height || 0,
              createdAt: new Date(rowAny.created_at),
            };
            setContributions((prev) => [newContribution, ...prev]);
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(projectChannel);
      supabase.removeChannel(contributionsChannel);
    };
  }, [projectId]);

  const refreshData = async () => {
    try {
      const [projectRes, contributionsRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/contributions`)
      ]);

      if (projectRes.ok) {
        const projectData = await projectRes.json();
        // Convert date strings back to Date objects and BigInt strings to BigInt
        const projectWithDates = {
          ...projectData,
          fundingGoal: typeof projectData.fundingGoal === 'string' ? BigInt(projectData.fundingGoal) : projectData.fundingGoal,
          totalRaised: typeof projectData.totalRaised === 'string' ? BigInt(projectData.totalRaised) : projectData.totalRaised,
          createdAt: new Date(projectData.createdAt),
          updatedAt: new Date(projectData.updatedAt),
          deadline: new Date(projectData.deadline),
          publishedAt: projectData.publishedAt ? new Date(projectData.publishedAt) : undefined,
        };
        setProject(projectWithDates);
      }

      if (contributionsRes.ok) {
        const contributionsData = await contributionsRes.json();
        // Convert BigInt strings to BigInt and date strings to Date objects
        const contributionsWithTypes = contributionsData.map((contrib: any) => ({
          ...contrib,
          amount: typeof contrib.amount === 'string' ? BigInt(contrib.amount) : contrib.amount,
          createdAt: new Date(contrib.createdAt),
        }));
        setContributions(contributionsWithTypes);
      }
    } catch (err) {
      console.error('Failed to refresh data:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12 animate-fade-in">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-accent-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm sm:text-base text-text-secondary">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fade-in">
        <div className="bg-background-secondary border border-accent-error/30 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-accent-error mb-2">Error</h2>
          <p className="text-text-secondary mb-4">{error || 'Project not found'}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 glass-green text-text-primary rounded-lg transition-all hover:opacity-90"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to projects
          </Link>
        </div>
      </div>
    );
  }

  const percentFunded = calculateFundingPercentage(project.totalRaised, project.fundingGoal);
  const timeRemaining = calculateTimeRemaining(project.deadline);
  const isActive = project.status === 'active';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-fade-in">
      {/* Back Link */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 transition-colors group animate-slide-down"
      >
        <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to projects
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Header */}
          <div className="bg-background-secondary rounded-xl p-6 sm:p-8 border border-border-default shadow-lg">
            {project.imageUrl && (
              <div className="relative mb-6 rounded-xl overflow-hidden group">
                <img
                  src={project.imageUrl}
                  alt={project.title}
                  className="w-full h-64 sm:h-80 md:h-96 object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background-primary/90 via-background-primary/40 to-transparent"></div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-text-primary mb-3 break-words leading-tight">
                  {project.title}
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-sm sm:text-base text-text-secondary flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0 text-accent-primary/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="truncate font-medium">by {formatWalletAddress(project.fundraiserAddress)}</span>
                  </p>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-bold border ${project.status === 'active'
                        ? 'bg-accent-success/20 text-accent-success border-accent-success/40'
                        : project.status === 'funded'
                          ? 'bg-accent-primary/20 text-accent-primary border-accent-primary/40'
                          : project.status === 'expired'
                            ? 'bg-text-muted/20 text-text-muted border-text-muted/40'
                            : 'bg-accent-warning/20 text-accent-warning border-accent-warning/40'
                      }`}
                  >
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            <div className="prose prose-invert max-w-none">
              <p className="text-base sm:text-lg text-text-secondary whitespace-pre-wrap leading-relaxed">
                {project.description}
              </p>
            </div>

            {/* Funding Metrics */}
            <div className="border-t border-border-default pt-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-accent-primary/10 to-accent-primary/5 border border-accent-primary/20">
                  <p className="text-xs text-text-muted mb-2">Raised</p>
                  <p className="text-2xl sm:text-3xl font-black text-accent-primary">
                    {formatFlow(project.totalRaised)}
                  </p>
                  <p className="text-xs text-text-muted mt-1">FLOW</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-background-tertiary/50 border border-border-default">
                  <p className="text-xs text-text-muted mb-2">Goal</p>
                  <p className="text-2xl sm:text-3xl font-black text-text-primary">
                    {formatFlow(project.fundingGoal)}
                  </p>
                  <p className="text-xs text-text-muted mt-1">FLOW</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative mb-4">
                <div className="w-full bg-background-tertiary rounded-full h-5 overflow-hidden shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent-primary via-accent-success to-accent-primary transition-all duration-1000 ease-out shadow-lg"
                    style={{ width: `${Math.min(percentFunded, 100)}%` }}
                  >
                  </div>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <p className="text-sm font-bold text-text-primary">
                    {percentFunded.toFixed(1)}% funded
                  </p>
                  <div className="flex items-center gap-4 text-xs text-text-secondary">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {project.contributorCount} contributors
                    </span>
                    <span className={`flex items-center gap-1 ${timeRemaining > 0 ? 'text-accent-success' : 'text-accent-error'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {timeRemaining > 0 ? `${Math.ceil(timeRemaining / (1000 * 60 * 60 * 24))} days left` : 'Ended'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contribution Form */}
          {isActive && (
            <div className="bg-background-secondary rounded-xl p-6 sm:p-8 border border-border-default shadow-lg">
              <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-3">
                <span className="w-1 h-8 bg-accent-primary/60 rounded-full"></span>
                Support This Project
              </h2>
              <ContributionForm
                projectId={projectId}
                fundraiserAddress={project.fundraiserAddress}
                onSuccess={refreshData}
              />
            </div>
          )}

          {/* Comments Section */}
          <CommentSection projectId={projectId} />
        </div>

        {/* Sidebar - Right Column (1/3) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Contributions List */}
          <div className="bg-background-secondary rounded-xl p-6 border border-border-default shadow-lg sticky top-24">
            <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-accent-primary/60 rounded-full"></span>
              Recent Contributions
            </h2>
            {loadingContributions ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-accent-primary border-t-transparent mx-auto"></div>
                <p className="mt-4 text-sm text-text-secondary">Loading...</p>
              </div>
            ) : contributions.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-background-tertiary flex items-center justify-center">
                  <svg className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-text-secondary">No contributions yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {contributions.slice(0, 10).map((contribution) => (
                  <div
                    key={contribution.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-background-tertiary/50 border border-border-default hover:bg-background-tertiary transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-accent-primary/10 border border-accent-primary/30 flex items-center justify-center text-accent-primary/90 font-bold flex-shrink-0">
                      {formatWalletAddress(contribution.contributorAddress).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {formatWalletAddress(contribution.contributorAddress)}
                      </p>
                      <p className="text-xs text-text-muted">
                        {formatFlow(contribution.amount)} FLOW
                      </p>
                    </div>
                  </div>
                ))}
                {contributions.length > 10 && (
                  <p className="text-xs text-text-muted text-center pt-2">
                    +{contributions.length - 10} more
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  return (
    <WalletProvider appName="FlowGives">
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <Navbar showMyProjects showWallet />

        {/* Main Content */}
        <div className="flex-1">
          <ProjectDetailContent />
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </WalletProvider>
  );
}
