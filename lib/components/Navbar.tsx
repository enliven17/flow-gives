'use client';

import { useState } from 'react';
import Link from 'next/link';
import { WalletConnectButton } from './WalletConnectButton';
import { MobileMenu } from './MobileMenu';

export interface NavbarProps {
  showWallet?: boolean;
  showProjects?: boolean;
  showMyProjects?: boolean;
  showCreateProject?: boolean;
}

export function Navbar({
  showWallet = true,
  showProjects = true,
  showMyProjects = true,
  showCreateProject = false,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="bg-background-secondary/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border-default">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link href="/" className="hover:opacity-90 transition-opacity">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight">
                <span className="text-white">Flow</span>
                <span className="logo-gradient">Gives</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="flex items-center gap-2 sm:gap-3">
              {showProjects && (
                <Link
                  href="/projects"
                  className="hidden sm:block px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  Projects
                </Link>
              )}
              {showMyProjects && (
                <Link
                  href="/my-projects"
                  className="hidden sm:block px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  My Projects
                </Link>
              )}
              {showCreateProject && (
                <Link
                  href="/projects/new"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 glass-green text-text-primary rounded-lg font-medium hover:opacity-90 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Project
                </Link>
              )}
              {showWallet && (
                <div className="hidden sm:block">
                  <WalletConnectButton />
                </div>
              )}

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
        showWallet={showWallet}
      />
    </>
  );
}
