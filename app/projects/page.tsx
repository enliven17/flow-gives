'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { WalletConnectButton } from '@/lib/components/WalletConnectButton';
import { ProjectList } from '@/lib/components/ProjectList';
import { Footer } from '@/lib/components/Footer';
import { WalletProvider } from '@/lib/contexts/wallet.context';
import { Project } from '@/lib/models/project';
import Link from 'next/link';

function ProjectsContent() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle project card click - navigate to project detail page
   */
  const handleProjectClick = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true);
        const response = await fetch('/api/projects?status=active');

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

        // Remove duplicates by ID (in case API returns duplicates)
        const uniqueProjects = Array.from(
          new Map(projectsWithDates.map((p: Project) => [p.id, p])).values()
        );

        setProjects(uniqueProjects as Project[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-background-secondary border border-accent-error/30 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-accent-error mb-2">Error</h2>
          <p className="text-text-secondary">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
            Browse Projects
          </h1>
          <p className="text-sm sm:text-base text-text-secondary">
            Discover and support innovative projects on Stacks
          </p>
        </div>
        <Link
          href="/projects/new"
          className="w-full sm:w-auto px-5 py-2.5 glass-orange text-text-primary rounded-lg font-medium hover:opacity-90 transition-all inline-flex items-center justify-center gap-2 min-h-[44px] touch-manipulation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Project
        </Link>
      </div>

      {/* Project List */}
      <ProjectList
        projects={projects}
        isLoading={loading}
        onProjectClick={handleProjectClick}
      />
    </div>
  );
}

export default function ProjectsPage() {
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
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href="/my-projects"
                  className="hidden sm:block px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  My Projects
                </Link>
                <WalletConnectButton />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1">
          <ProjectsContent />
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </WalletProvider>
  );
}
