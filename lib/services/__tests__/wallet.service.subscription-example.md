# WalletService Subscription Usage Examples

This document provides examples of how to use the `subscribeToAuthChanges()` method in React components.

## Basic Usage in a React Component

```typescript
import { useEffect, useState } from 'react';
import { WalletService } from '@/lib/services/wallet.service';

function WalletStatus({ walletService }: { walletService: WalletService }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Subscribe to auth changes
    const unsubscribe = walletService.subscribeToAuthChanges((user) => {
      if (user?.addr) {
        setAddress(user.addr);
        setIsConnected(true);
        console.log('Wallet connected:', user.addr);
      } else {
        setAddress(null);
        setIsConnected(false);
        console.log('Wallet disconnected');
      }
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [walletService]);

  return (
    <div>
      {isConnected ? (
        <div>
          <p>Connected: {address}</p>
          <button onClick={() => walletService.disconnect()}>
            Disconnect
          </button>
        </div>
      ) : (
        <button onClick={() => walletService.connect()}>
          Connect Wallet
        </button>
      )}
    </div>
  );
}
```

## Using with React Context

```typescript
import { createContext, useContext, useEffect, useState } from 'react';
import { WalletService } from '@/lib/services/wallet.service';

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ 
  children,
  walletService 
}: { 
  children: React.ReactNode;
  walletService: WalletService;
}) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Subscribe to auth changes
    const unsubscribe = walletService.subscribeToAuthChanges((user) => {
      if (user?.addr) {
        setAddress(user.addr);
        setIsConnected(true);
      } else {
        setAddress(null);
        setIsConnected(false);
      }
    });

    return () => unsubscribe();
  }, [walletService]);

  const connect = async () => {
    await walletService.connect();
  };

  const disconnect = async () => {
    await walletService.disconnect();
  };

  return (
    <WalletContext.Provider value={{ address, isConnected, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}
```

## Multiple Subscribers

```typescript
import { useEffect } from 'react';
import { WalletService } from '@/lib/services/wallet.service';

function BalanceDisplay({ walletService }: { walletService: WalletService }) {
  const [balance, setBalance] = useState<string>('0.00000000');

  useEffect(() => {
    // Subscribe to auth changes
    const unsubscribe = walletService.subscribeToAuthChanges(async (user) => {
      if (user?.addr) {
        // Fetch balance when wallet connects
        try {
          const newBalance = await walletService.getFlowBalance();
          setBalance(newBalance);
        } catch (error) {
          console.error('Failed to fetch balance:', error);
        }
      } else {
        // Reset balance when wallet disconnects
        setBalance('0.00000000');
      }
    });

    return () => unsubscribe();
  }, [walletService]);

  return <div>Balance: {balance} FLOW</div>;
}

function UserProfile({ walletService }: { walletService: WalletService }) {
  const [userAddress, setUserAddress] = useState<string | null>(null);

  useEffect(() => {
    // Another independent subscriber
    const unsubscribe = walletService.subscribeToAuthChanges((user) => {
      setUserAddress(user?.addr || null);
    });

    return () => unsubscribe();
  }, [walletService]);

  return userAddress ? (
    <div>User: {userAddress.slice(0, 6)}...{userAddress.slice(-4)}</div>
  ) : null;
}

// Both components can subscribe independently
function App({ walletService }: { walletService: WalletService }) {
  return (
    <div>
      <BalanceDisplay walletService={walletService} />
      <UserProfile walletService={walletService} />
    </div>
  );
}
```

## Handling Connection State Changes

```typescript
import { useEffect, useState } from 'react';
import { WalletService } from '@/lib/services/wallet.service';

function ConnectionMonitor({ walletService }: { walletService: WalletService }) {
  const [connectionHistory, setConnectionHistory] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = walletService.subscribeToAuthChanges((user) => {
      const timestamp = new Date().toISOString();
      const event = user?.addr 
        ? `Connected: ${user.addr} at ${timestamp}`
        : `Disconnected at ${timestamp}`;
      
      setConnectionHistory(prev => [...prev, event]);
    });

    return () => unsubscribe();
  }, [walletService]);

  return (
    <div>
      <h3>Connection History</h3>
      <ul>
        {connectionHistory.map((event, index) => (
          <li key={index}>{event}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Key Points

1. **Always unsubscribe**: Return the unsubscribe function from `useEffect` to prevent memory leaks
2. **Multiple subscribers**: Multiple components can subscribe independently
3. **User object**: The callback receives a user object with `addr` (address) and `loggedIn` properties
4. **Null handling**: Check for `user?.addr` as it will be null when disconnected
5. **Automatic updates**: Subscribers are notified automatically when connection state changes
