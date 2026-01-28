# Contexts

This directory contains React Context providers for global state management.

## WalletContext

The `WalletContext` provides wallet connection state and methods to the entire application.

### Usage

1. **Wrap your app with WalletProvider:**

```tsx
import { WalletProvider } from '@/lib/contexts';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <WalletProvider 
          appName="StacksGives"
          network="testnet"
        >
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
```

2. **Use the useWallet hook in components:**

```tsx
import { useWallet } from '@/lib/contexts';

export function MyComponent() {
  const { 
    isConnected, 
    address, 
    balance, 
    connect, 
    disconnect,
    refreshBalance 
  } = useWallet();

  return (
    <div>
      {isConnected ? (
        <>
          <p>Address: {address}</p>
          <p>Balance: {balance?.toString()} micro-USDCx</p>
          <button onClick={disconnect}>Disconnect</button>
          <button onClick={refreshBalance}>Refresh Balance</button>
        </>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  );
}
```

### Features

- **Automatic connection restoration**: Restores wallet connection from previous session
- **Balance management**: Automatically loads and provides methods to refresh USDCx balance
- **Error handling**: Provides error state for connection failures
- **Loading states**: Tracks loading state during connection
- **Disconnection detection**: Monitors for external wallet disconnection
- **Network support**: Supports both mainnet and testnet

### State

The context provides the following state:

- `isConnected`: Boolean indicating if wallet is connected
- `address`: Connected wallet address (or null)
- `network`: Current network ('mainnet' | 'testnet' | null)
- `balance`: USDCx balance in micro-USDCx (or null)
- `isLoading`: Boolean indicating if connection is in progress
- `error`: Error message (or null)

### Methods

- `connect()`: Initiates wallet connection flow
- `disconnect()`: Disconnects wallet and clears state
- `refreshBalance()`: Fetches latest USDCx balance
- `walletService`: Direct access to WalletService instance (for advanced use)

### Requirements

Validates Requirements 1.3: Wallet connection state management
