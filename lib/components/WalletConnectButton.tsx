/**
 * WalletConnectButton - Component for wallet connection
 * 
 * This component provides:
 * - "Connect Wallet" button when disconnected
 * - Wallet address display when connected
 * - Connection and disconnection handling
 * - Error display
 * 
 * Requirements: 1.1, 1.2, 1.4
 */

'use client';

import React from 'react';
import { useWallet } from '../contexts/wallet.context';
import { formatWalletAddress } from '../utils/format';

/**
 * WalletConnectButton props
 */
export interface WalletConnectButtonProps {
  /**
   * Optional className for styling
   */
  className?: string;
  
  /**
   * Show full address instead of truncated
   */
  showFullAddress?: boolean;
  
  /**
   * Show balance when connected
   */
  showBalance?: boolean;
}

/**
 * WalletConnectButton component
 * 
 * Displays a button to connect/disconnect wallet with proper state management.
 * 
 * @param props Component props
 * @returns WalletConnectButton component
 * 
 * Requirements: 1.1, 1.2, 1.4
 */
export function WalletConnectButton({
  className = '',
  showFullAddress = false,
  showBalance = false,
}: WalletConnectButtonProps) {
  const { isConnected, address, balance, isLoading, error, connect, disconnect } = useWallet();

  /**
   * Handle connect button click
   * 
   * Requirements: 1.2
   */
  const handleConnect = async () => {
    try {
      await connect();
    } catch (err) {
      // Error is already handled in context
      console.error('Connection failed:', err);
    }
  };

  /**
   * Handle disconnect button click
   * 
   * Requirements: 1.2
   */
  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (err) {
      console.error('Disconnection failed:', err);
    }
  };

  /**
   * Format balance for display
   */
  const formatBalance = (bal: bigint | null): string => {
    if (bal === null) return '...';
    // Convert micro-USDCx to USDCx (6 decimals)
    const usdcx = Number(bal) / 1_000_000;
    return usdcx.toFixed(2);
  };

  // Loading state
  if (isLoading) {
    return (
      <button
        disabled
        className={`px-4 sm:px-6 py-2.5 sm:py-2 bg-background-tertiary text-text-muted rounded-lg cursor-not-allowed border border-border-default min-h-[44px] text-sm sm:text-base ${className}`}
        aria-busy="true"
        aria-label="Connecting wallet"
      >
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Connecting...
        </span>
      </button>
    );
  }

  // Connected state
  if (isConnected && address) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent-success flex-shrink-0"></div>
              <span
                className="text-sm font-medium text-text-primary truncate"
                title={showFullAddress ? undefined : address}
                aria-label={`Connected wallet: ${address}`}
              >
                {showFullAddress ? address : formatWalletAddress(address)}
              </span>
            </div>
            {showBalance && (
              <span className="text-xs text-text-secondary block mt-1" aria-label={`Balance: ${formatBalance(balance)} USDCx`}>
                {formatBalance(balance)} USDCx
              </span>
            )}
          </div>
          <button
            onClick={handleDisconnect}
            className="px-3 sm:px-4 py-2 bg-accent-error/20 hover:bg-accent-error/30 active:bg-accent-error/40 text-accent-error rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-accent-error/50 focus:ring-offset-2 focus:ring-offset-background-secondary min-h-[44px] touch-manipulation text-xs sm:text-sm font-medium border border-accent-error/30 flex-shrink-0"
            aria-label="Disconnect wallet"
          >
            <span className="hidden sm:inline">Disconnect</span>
            <span className="sm:hidden">Dis</span>
          </button>
        </div>
        {error && (
          <div
            className="text-sm text-accent-error bg-accent-error/20 px-3 py-2 rounded border border-accent-error/30"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}
      </div>
    );
  }

  // Disconnected state
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <button
        onClick={handleConnect}
        className="w-full px-4 sm:px-6 py-2.5 sm:py-2 glass-orange text-text-primary font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-2 focus:ring-offset-background-secondary min-h-[44px] touch-manipulation text-sm sm:text-base hover:opacity-90"
        aria-label="Connect wallet"
      >
        Connect Wallet
      </button>
      {error && (
        <div
          className="text-sm text-accent-error bg-accent-error/20 px-3 py-2 rounded border border-accent-error/30"
          role="alert"
          aria-live="polite"
        >
          <p className="font-medium">Connection Error</p>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
