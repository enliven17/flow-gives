'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { WalletProvider } from '@/lib/contexts/wallet.context';
import { WalletConnectButton } from '@/lib/components/WalletConnectButton';
import { ProjectForm } from '@/lib/components/ProjectForm';
import { Footer } from '@/lib/components/Footer';
import Link from 'next/link';

export default function NewProjectPage() {
  const router = useRouter();

  const handleSuccess = (projectId: string) => {
    // Redirect to project detail page on success
    router.push(`/projects/${projectId}`);
  };

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
              <WalletConnectButton />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-fade-in">
            {/* Back Link */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm sm:text-base text-text-secondary hover:text-text-primary mb-4 sm:mb-6 transition-colors group animate-slide-down min-h-[44px] touch-manipulation"
            >
              <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to projects
            </Link>

            {/* Page Header */}
            <div className="mb-6 sm:mb-8 animate-slide-up">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4 text-text-primary">
                Create New Project
              </h1>
              <p className="text-lg text-text-secondary">
                Fill in the details below to create your crowdfunding project. You can save as a draft or publish immediately.
              </p>
            </div>

            {/* Project Form */}
            <div className="bg-background-secondary rounded-lg p-8 border border-border-default">
              <ProjectForm onSuccess={handleSuccess} mode="create" />
            </div>

            {/* Help Text */}
            <div className="mt-6 bg-background-secondary rounded-lg p-6 border border-accent-primary/20">
              <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Tips for a successful project:
              </h3>
              <ul className="text-text-secondary space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-accent-primary mt-1">•</span>
                  <span>Write a clear, compelling title that describes your project</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-primary mt-1">•</span>
                  <span>Provide detailed information about what you&apos;re building and why</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-primary mt-1">•</span>
                  <span>Set a realistic funding goal and deadline</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-primary mt-1">•</span>
                  <span>Include an image to make your project more appealing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-primary mt-1">•</span>
                  <span>Save as draft to review before publishing</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </WalletProvider>
  );
}
