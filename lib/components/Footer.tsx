/**
 * Footer Component
 * 
 * Minimal and sweet footer for StacksGives platform
 */

import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border-default bg-background-secondary/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          <Link href="/" className="text-lg sm:text-xl font-bold text-text-primary hover:text-accent-primary/80 transition-colors">
            StacksGives
          </Link>
          <p className="text-xs sm:text-sm text-text-muted">
            © {currentYear} StacksGives
          </p>
        </div>
      </div>
    </footer>
  );
}
