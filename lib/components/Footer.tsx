/**
 * Footer Component
 * 
 * Minimal and sweet footer for FlowGives platform
 */

import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border-default bg-background-secondary/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <span className="text-lg sm:text-xl font-bold tracking-tight">
              <span className="text-white">Flow</span>
              <span className="logo-gradient">Gives</span>
            </span>
          </Link>
          <p className="text-xs sm:text-sm text-text-muted">
            © {currentYear} FlowGives
          </p>
        </div>
      </div>
    </footer>
  );
}
