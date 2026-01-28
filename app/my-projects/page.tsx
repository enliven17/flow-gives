'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { WalletProvider, useWallet } from '@/lib/contexts/wallet.context';
import { WalletConnectButton } from '@/lib/components/WalletConnectButton';
import { ProjectCard } from '@/lib/components/ProjectCard';
import { Footer } from '@/lib/components/Footer';
import { Project } from '@/lib/models/project';
import Link from 'next/link';

function MyProjectsContent() {
  const { address, isConnected } = useWallet();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      if (!isConnected || !address) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/projects?fundraiser=${address}`);

        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }

        const data = await response.json();
        // Convert date strings back to Date objects
        const projectsWithDates = data.map((project: any) => ({
          ...project,
          createdAt: new Date(project.createdAt),
          updatedAt: new Date(project.updatedAt),
          deadline: new Date(project.deadline),
          publishedAt: project.publishedAt ? new Date(project.publishedAt) : undefined,
        }));
        setProjects(projectsWithDates);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [address, isConnected]);

  const handleCancelProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to cancel this project? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel project');
      }

      // Remove project from list
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel project');
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fade-in">
        <div className="bg-background-secondary border border-accent-warning/30 rounded-lg p-6 sm:p-8 text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-accent-warning/20 flex items-center justify-center">
            <svg className="w-7 h-7 sm:w-8 sm:h-8 text-accent-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-text-primary mb-2">
            Wallet Not Connected
          </h2>
          <p className="text-sm sm:text-base text-text-secondary mb-4 sm:mb-6">
            Please connect your wallet to view your projects.
          </p>
          <WalletConnectButton />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fade-in">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-accent-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm sm:text-base text-text-secondary">Loading your projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fade-in">
        <div className="bg-background-secondary border border-accent-error/30 rounded-lg p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-accent-error mb-2">Error</h2>
          <p className="text-sm sm:text-base text-text-secondary">{error}</p>
        </div>
      </div>
    );
  }

  const draftProjects = projects.filter(p => p.status === 'draft');
  const publishedProjects = projects.filter(p => p.status !== 'draft');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-fade-in">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8 animate-slide-down">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4 text-text-primary">
          My Projects
        </h1>
        <p className="text-base sm:text-lg text-text-secondary">
          Manage your crowdfunding projects
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="bg-background-secondary rounded-lg p-6 sm:p-8 md:p-12 text-center border border-border-default">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-accent-primary/10 flex items-center justify-center">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <p className="text-lg sm:text-xl text-text-secondary mb-4 sm:mb-6">You haven&apos;t created any projects yet.</p>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 glass-orange text-text-primary rounded-lg font-medium hover:opacity-90 transition-all min-h-[44px] touch-manipulation text-sm sm:text-base"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Your First Project
          </Link>
        </div>
      ) : (
        <>
          {/* Draft Projects */}
          {draftProjects.length > 0 && (
            <div className="mb-8 sm:mb-12 animate-slide-up">
              <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <span className="w-1 h-6 sm:h-8 bg-gradient-to-b from-accent-warning to-accent-error rounded-full"></span>
                Draft Projects ({draftProjects.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {draftProjects.map((project, index) => (
                  <div key={project.id} className="relative animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <ProjectCard
                      project={project}
                      onClick={() => router.push(`/projects/${project.id}`)}
                    />
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => router.push(`/projects/${project.id}/edit`)}
                        className="flex-1 px-4 py-2.5 sm:py-2 bg-background-tertiary hover:bg-background-tertiary/80 active:bg-background-tertiary/70 text-text-primary text-sm rounded-lg border border-border-default transition-colors min-h-[44px] touch-manipulation"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleCancelProject(project.id)}
                        className="flex-1 px-4 py-2.5 sm:py-2 bg-accent-error/20 hover:bg-accent-error/30 active:bg-accent-error/40 text-accent-error text-sm rounded-lg border border-accent-error/30 transition-colors min-h-[44px] touch-manipulation"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Published Projects */}
          {publishedProjects.length > 0 && (
            <div className="animate-slide-up">
              <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-3">
                <span className="w-1 h-8 bg-accent-success rounded-full"></span>
                Published Projects ({publishedProjects.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publishedProjects.map((project, index) => (
                  <div key={project.id} className="animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <ProjectCard
                      project={project}
                      onClick={() => router.push(`/projects/${project.id}`)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function MyProjectsPage() {
  return (
    <WalletProvider appName="StacksGives">
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-background-secondary/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border-default">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Image
                  src="/logo.png"
                  alt="StacksGives"
                  width={32}
                  height={32}
                  className="w-8 h-8 sm:w-10 sm:h-10"
                  priority
                />
                <span className="text-xl sm:text-2xl font-black tracking-tight text-text-primary">
                  <span className="font-black">Stacks</span>
                  <span className="logo-gradient font-black">Gives</span>
                </span>
              </Link>
              <div className="flex items-center gap-2 sm:gap-4">
                <Link
                  href="/projects/new"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 glass-orange text-text-primary rounded-lg font-medium hover:opacity-90 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Project
                </Link>
                <WalletConnectButton />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1">
          <MyProjectsContent />
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </WalletProvider>
  );
}
