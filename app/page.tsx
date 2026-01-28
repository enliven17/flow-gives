'use client';

import { useState } from 'react';
import Image from 'next/image';
import { WalletConnectButton } from '@/lib/components/WalletConnectButton';
import { Footer } from '@/lib/components/Footer';
import { ShaderAnimation } from '@/lib/components/ShaderAnimation';
import { MobileMenu } from '@/lib/components/MobileMenu';
import { WalletProvider } from '@/lib/contexts/wallet.context';
import Link from 'next/link';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <WalletProvider appName="FlowGives">
      <main className="min-h-screen relative">
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
                  href="/projects"
                  className="hidden sm:block px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  Projects
                </Link>
                <Link
                  href="/my-projects"
                  className="hidden sm:block px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  My Projects
                </Link>
                <div className="hidden sm:block">
                  <WalletConnectButton />
                </div>
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="sm:hidden p-2 text-text-secondary hover:text-text-primary transition-colors"
                  aria-label="Open menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Menu */}
        <MobileMenu 
          isOpen={mobileMenuOpen} 
          onClose={() => setMobileMenuOpen(false)}
          showWallet
        />

        {/* Hero Section */}
        <section className="relative w-full py-20 md:py-32 overflow-hidden min-h-[600px]">
          {/* Shader Animation Background */}
          <div className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
            <ShaderAnimation />
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto relative z-10">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-text-primary mb-4 sm:mb-6 leading-tight px-2">
              Fund the Future on Stacks
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-text-secondary mb-6 sm:mb-8 md:mb-10 leading-relaxed px-2">
              Transparent, decentralized crowdfunding powered by blockchain. 
              Support innovative projects with FLOW on the Flow network.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2">
              <Link
                href="/projects"
                className="px-5 sm:px-6 md:px-7 py-2.5 sm:py-3 glass-green text-text-primary rounded-lg font-medium text-sm sm:text-base hover:opacity-90 transition-all inline-flex items-center justify-center gap-2 min-h-[44px] touch-manipulation"
              >
                Browse Projects
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/projects/new"
                className="px-5 sm:px-6 md:px-7 py-2.5 sm:py-3 glass-green text-text-primary rounded-lg font-medium text-sm sm:text-base hover:opacity-90 transition-all inline-flex items-center justify-center gap-2 min-h-[44px] touch-manipulation"
              >
                Create Project
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </Link>
            </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="p-6">
              <div className="w-12 h-12 rounded-lg bg-accent-primary/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-accent-primary/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-medium text-text-primary mb-2">Transparent</h3>
              <p className="text-sm sm:text-base text-text-secondary">
                All transactions are recorded on the blockchain. Every contribution is verifiable and transparent.
              </p>
            </div>
            <div className="p-6">
              <div className="w-12 h-12 rounded-lg bg-accent-primary/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-accent-primary/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-medium text-text-primary mb-2">Decentralized</h3>
              <p className="text-sm sm:text-base text-text-secondary">
                Built on Stacks blockchain. No intermediaries. Funds go directly to project creators.
              </p>
            </div>
            <div className="p-6">
              <div className="w-12 h-12 rounded-lg bg-accent-primary/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-accent-primary/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-medium text-text-primary mb-2">Fast & Secure</h3>
              <p className="text-text-secondary">
                Powered by FLOW on Flow blockchain. Fast transactions with low fees and enterprise-grade security.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </main>
    </WalletProvider>
  );
}
