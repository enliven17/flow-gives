# WalletContext Usage Example

This document provides examples of how to use the WalletContext in your Next.js application.

## Setup in Root Layout

First, wrap your application with the `WalletProvider` in your root layout:

```tsx
// app/layout.tsx
import { WalletProvider } from '@/lib/contexts';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WalletProvider 
          appName="StacksGives"
          appIconUrl="/logo.png"
          network="testnet"
        >
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
```

## Basic Wallet Connection Button

Create a simple wallet connection button component:

```tsx
// components/WalletConnectButton.tsx
'use client';

import { useWallet } from '@/lib/contexts';
import { formatUSDCx } from '@/lib/services/wallet.service';

export function WalletConnectButton() {
  const { 
    isConnected, 
    address, 
    balance,
    isLoading,
    error,
    connect, 
    disconnect 
  } = useWallet();

  if (isLoading) {
    return (
      <button disabled className="btn-primary">
        Connecting...
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-sm">
          <div className="font-medium">
            {address.slice(0, 6)}...{address.slice(-4)}
          </div>
          {balance !== null && (
            <div className="text-gray-600">
              {formatUSDCx(balance)} USDCx
            </div>
          )}
        </div>
        <button onClick={disconnect} className="btn-secondary">
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={connect} className="btn-primary">
        Connect Wallet
      </button>
      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}
    </div>
  );
}
```

## Protected Component (Requires Wallet Connection)

Create a component that requires wallet connection:

```tsx
// components/CreateProjectButton.tsx
'use client';

import { useWallet } from '@/lib/contexts';
import { useRouter } from 'next/navigation';

export function CreateProjectButton() {
  const { isConnected, connect } = useWallet();
  const router = useRouter();

  const handleClick = async () => {
    if (!isConnected) {
      await connect();
      return;
    }
    
    router.push('/projects/new');
  };

  return (
    <button onClick={handleClick} className="btn-primary">
      {isConnected ? 'Create Project' : 'Connect to Create Project'}
    </button>
  );
}
```

## Using Wallet in a Page

Use wallet state in a page component:

```tsx
// app/my-projects/page.tsx
'use client';

import { useWallet } from '@/lib/contexts';
import { useEffect, useState } from 'react';
import { ProjectService } from '@/lib/services/project.service';

export default function MyProjectsPage() {
  const { isConnected, address, connect } = useWallet();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      setLoading(true);
      ProjectService.getProjectsByFundraiser(address)
        .then(setProjects)
        .finally(() => setLoading(false));
    }
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">My Projects</h1>
        <p className="mb-4">Please connect your wallet to view your projects.</p>
        <button onClick={connect} className="btn-primary">
          Connect Wallet
        </button>
      </div>
    );
  }

  if (loading) {
    return <div>Loading projects...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">My Projects</h1>
      {projects.length === 0 ? (
        <p>You haven't created any projects yet.</p>
      ) : (
        <div className="grid gap-4">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
```

## Refreshing Balance After Transaction

Refresh the wallet balance after a successful transaction:

```tsx
// components/ContributionForm.tsx
'use client';

import { useWallet } from '@/lib/contexts';
import { useState } from 'react';
import { ContributionService } from '@/lib/services/contribution.service';

export function ContributionForm({ projectId }: { projectId: string }) {
  const { isConnected, balance, refreshBalance } = useWallet();
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const amountInMicroUSDCx = BigInt(parseFloat(amount) * 1_000_000);
      
      await ContributionService.contribute(projectId, amountInMicroUSDCx);
      
      // Refresh balance after successful contribution
      await refreshBalance();
      
      alert('Contribution successful!');
      setAmount('');
    } catch (error) {
      alert(`Contribution failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Amount (USDCx)
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="input"
          required
        />
        {balance !== null && (
          <p className="text-sm text-gray-600 mt-1">
            Available: {(Number(balance) / 1_000_000).toFixed(2)} USDCx
          </p>
        )}
      </div>
      
      <button 
        type="submit" 
        disabled={isSubmitting || !isConnected}
        className="btn-primary w-full"
      >
        {isSubmitting ? 'Processing...' : 'Contribute'}
      </button>
    </form>
  );
}
```

## Accessing WalletService Directly

For advanced use cases, you can access the WalletService instance directly:

```tsx
'use client';

import { useWallet } from '@/lib/contexts';

export function AdvancedWalletComponent() {
  const { walletService } = useWallet();

  const handleAdvancedOperation = async () => {
    if (!walletService) {
      console.error('Wallet service not initialized');
      return;
    }

    // Access the underlying UserSession
    const userSession = walletService.getUserSession();
    
    // Get network information
    const network = walletService.getNetwork();
    
    console.log('Network:', network);
  };

  return (
    <button onClick={handleAdvancedOperation}>
      Advanced Operation
    </button>
  );
}
```

## Network Switching

To switch networks, you need to reinitialize the provider:

```tsx
// app/layout.tsx
'use client';

import { WalletProvider } from '@/lib/contexts';
import { useState } from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [network, setNetwork] = useState<'mainnet' | 'testnet'>('testnet');

  return (
    <html lang="en">
      <body>
        <WalletProvider 
          appName="StacksGives"
          network={network}
        >
          <div className="p-4">
            <select 
              value={network} 
              onChange={(e) => setNetwork(e.target.value as any)}
              className="select"
            >
              <option value="testnet">Testnet</option>
              <option value="mainnet">Mainnet</option>
            </select>
          </div>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
```

## Error Handling

Handle wallet connection errors gracefully:

```tsx
'use client';

import { useWallet } from '@/lib/contexts';
import { useEffect } from 'react';

export function WalletErrorHandler() {
  const { error, connect } = useWallet();

  useEffect(() => {
    if (error) {
      // Log error for debugging
      console.error('Wallet error:', error);
      
      // Show user-friendly message based on error type
      if (error.includes('cancelled')) {
        // User cancelled - no action needed
      } else if (error.includes('not installed')) {
        alert('Please install a Stacks wallet (Hiro Wallet or Xverse)');
      } else if (error.includes('network mismatch')) {
        alert('Please switch your wallet to the correct network');
      } else {
        alert(`Wallet error: ${error}`);
      }
    }
  }, [error]);

  return null; // This is a utility component
}
```

## Best Practices

1. **Always check `isConnected` before wallet operations**
2. **Handle loading states** to provide feedback during connection
3. **Refresh balance** after transactions that affect the wallet
4. **Handle errors gracefully** with user-friendly messages
5. **Use the `walletService` directly** only for advanced operations
6. **Wrap your app** with WalletProvider at the root level
7. **Monitor connection state** for external disconnections
