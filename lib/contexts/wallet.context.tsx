/**
 * WalletContext - React Context for wallet state management
 * 
 * This context provides:
 * - Wallet connection state
 * - Wallet connection/disconnection methods
 * - Wallet address and balance
 * - Network information
 * 
 * Requirements: 1.3
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { WalletService, WalletConnection } from '../services/wallet.service';

/**
 * Wallet state interface
 */
export interface WalletState {
  isConnected: boolean;
  address: string | null;
  network: 'mainnet' | 'testnet' | null;
  balance: string | null; // Flow balance as string with 8 decimal precision
  isLoading: boolean;
  error: string | null;
}

/**
 * Wallet context interface
 */
export interface WalletContextValue extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  walletService: WalletService | null;
}

/**
 * Default wallet state
 */
const defaultWalletState: WalletState = {
  isConnected: false,
  address: null,
  network: null,
  balance: null,
  isLoading: false,
  error: null,
};

/**
 * Wallet context
 */
const WalletContext = createContext<WalletContextValue | undefined>(undefined);

/**
 * Wallet provider props
 */
export interface WalletProviderProps {
  children: ReactNode;
  appName: string;
  appIconUrl?: string;
  network?: 'mainnet' | 'testnet';
}

/**
 * WalletProvider - Provides wallet state to the application
 * 
 * @param props Provider props
 * @returns Provider component
 * 
 * Requirements: 1.3
 */
export function WalletProvider({ 
  children, 
  appName, 
  appIconUrl,
  network = 'testnet' 
}: WalletProviderProps) {
  const [state, setState] = useState<WalletState>(defaultWalletState);
  const [walletService, setWalletService] = useState<WalletService | null>(null);

  // Initialize wallet service
  useEffect(() => {
    const service = new WalletService({
      appName,
      appIconUrl,
      network,
    });
    setWalletService(service);

    // Check if wallet is already connected (from previous session)
    if (service.isConnected()) {
      const address = service.getAddress();
      if (address) {
        setState(prev => ({
          ...prev,
          isConnected: true,
          address,
          network,
        }));

        // Load balance
        service.getFlowBalance()
          .then(balance => {
            setState(prev => ({
              ...prev,
              balance,
            }));
          })
          .catch(error => {
            console.error('Failed to load balance:', error);
          });
      }
    }
  }, [appName, appIconUrl, network]);

  /**
   * Connect wallet
   * 
   * Initiates wallet connection flow and updates state.
   * 
   * Requirements: 1.3
   */
  const connect = useCallback(async () => {
    if (!walletService) {
      setState(prev => ({
        ...prev,
        error: 'Wallet service not initialized',
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const connection: WalletConnection = await walletService.connect();
      
      setState(prev => ({
        ...prev,
        isConnected: true,
        address: connection.address,
        network: connection.network,
        isLoading: false,
      }));

      // Load balance after connection
      try {
        const balance = await walletService.getFlowBalance();
        setState(prev => ({
          ...prev,
          balance,
        }));
      } catch (balanceError) {
        console.error('Failed to load balance:', balanceError);
        // Don't set error state for balance failure
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [walletService]);

  /**
   * Disconnect wallet
   * 
   * Disconnects wallet and clears state.
   * 
   * Requirements: 1.3
   */
  const disconnect = useCallback(async () => {
    if (!walletService) {
      return;
    }

    try {
      await walletService.disconnect();
      setState(defaultWalletState);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to disconnect wallet';
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
    }
  }, [walletService]);

  /**
   * Refresh wallet balance
   * 
   * Fetches the latest Flow balance from the blockchain.
   * 
   * Requirements: 1.3, 2.3, 8.4
   */
  const refreshBalance = useCallback(async () => {
    if (!walletService || !state.isConnected) {
      return;
    }

    try {
      const balance = await walletService.getFlowBalance();
      setState(prev => ({
        ...prev,
        balance,
      }));
    } catch (error) {
      console.error('Failed to refresh balance:', error);
      // Don't set error state for balance refresh failure
    }
  }, [walletService, state.isConnected]);

  // Handle wallet disconnection events (e.g., user disconnects from wallet extension)
  useEffect(() => {
    if (!walletService) {
      return;
    }

    // Check connection status periodically
    const intervalId = setInterval(() => {
      const isConnected = walletService.isConnected();
      
      if (state.isConnected && !isConnected) {
        // Wallet was disconnected externally
        setState(defaultWalletState);
      }
    }, 1000); // Check every second

    return () => {
      clearInterval(intervalId);
    };
  }, [walletService, state.isConnected]);

  const value: WalletContextValue = {
    ...state,
    connect,
    disconnect,
    refreshBalance,
    walletService,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

/**
 * useWallet hook - Access wallet context
 * 
 * @returns Wallet context value
 * @throws Error if used outside WalletProvider
 * 
 * Requirements: 1.3
 */
export function useWallet(): WalletContextValue {
  const context = useContext(WalletContext);
  
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  
  return context;
}
