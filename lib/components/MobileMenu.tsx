'use client';

import { useState } from 'react';
import Link from 'next/link';
import { WalletConnectButton } from './WalletConnectButton';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  showWallet?: boolean;
}

export function MobileMenu({ isOpen, onClose, showWallet = false }: MobileMenuProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Menu */}
      <div className="fixed top-0 right-0 h-full w-64 bg-background-secondary border-l border-border-default z-50 md:hidden transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-border-default">
            <span className="text-xl font-bold text-text-primary">Menu</span>
            <button
              onClick={onClose}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Close menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Wallet Section */}
          {showWallet && (
            <div className="p-4 border-b border-border-default bg-background-tertiary/30">
              <p className="text-xs text-text-muted mb-2 font-medium uppercase tracking-wide">Wallet</p>
              <WalletConnectButton className="w-full" />
            </div>
          )}
          
          {/* Navigation Links */}
          <nav className="flex flex-col p-4 gap-2 flex-1 overflow-y-auto">
            <Link
              href="/"
              onClick={onClose}
              className="px-4 py-3 text-text-secondary hover:text-text-primary hover:bg-background-tertiary rounded-lg transition-colors"
            >
              Home
            </Link>
            <Link
              href="/projects"
              onClick={onClose}
              className="px-4 py-3 text-text-secondary hover:text-text-primary hover:bg-background-tertiary rounded-lg transition-colors"
            >
              Projects
            </Link>
            <Link
              href="/my-projects"
              onClick={onClose}
              className="px-4 py-3 text-text-secondary hover:text-text-primary hover:bg-background-tertiary rounded-lg transition-colors"
            >
              My Projects
            </Link>
            <Link
              href="/projects/new"
              onClick={onClose}
              className="px-4 py-3 glass-green text-text-primary rounded-lg font-medium hover:opacity-90 transition-opacity text-center"
            >
              Create Project
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
}
