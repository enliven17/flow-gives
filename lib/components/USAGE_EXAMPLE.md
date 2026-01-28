# WalletConnectButton Usage Examples

This document provides practical examples of using the WalletConnectButton component in your application.

## Basic Setup

First, ensure your app is wrapped with the WalletProvider:

```tsx
// app/layout.tsx
import { WalletProvider } from '@/lib/contexts';

export default function RootLayout({ children }: { children: React.ReactNode }) {
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

## Example 1: Basic Usage in Header

```tsx
// components/Header.tsx
import { WalletConnectButton } from '@/lib/components';

export function Header() {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">StacksGives</h1>
        <WalletConnectButton />
      </div>
    </header>
  );
}
```

## Example 2: With Balance Display

```tsx
// components/UserProfile.tsx
import { WalletConnectButton } from '@/lib/components';

export function UserProfile() {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Your Wallet</h2>
      <WalletConnectButton 
        showBalance={true}
        className="w-full"
      />
    </div>
  );
}
```

## Example 3: Full Address Display

```tsx
// components/AccountSettings.tsx
import { WalletConnectButton } from '@/lib/components';

export function AccountSettings() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Account Settings</h2>
      <div className="border rounded-lg p-4">
        <label className="block text-sm font-medium mb-2">
          Connected Wallet
        </label>
        <WalletConnectButton 
          showFullAddress={true}
          showBalance={true}
        />
      </div>
    </div>
  );
}
```

## Example 4: Conditional Rendering Based on Connection

```tsx
// components/ContributeSection.tsx
import { WalletConnectButton } from '@/lib/components';
import { useWallet } from '@/lib/contexts';

export function ContributeSection() {
  const { isConnected } = useWallet();

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Support This Project</h2>
      
      {!isConnected ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">
            Connect your wallet to contribute to this project
          </p>
          <WalletConnectButton className="mx-auto" />
        </div>
      ) : (
        <div>
          {/* Contribution form goes here */}
          <p className="text-green-600 mb-4">Wallet connected! You can now contribute.</p>
          {/* ... contribution form ... */}
        </div>
      )}
    </div>
  );
}
```

## Example 5: Mobile-Responsive Navigation

```tsx
// components/MobileNav.tsx
import { WalletConnectButton } from '@/lib/components';
import { useWallet } from '@/lib/contexts';

export function MobileNav() {
  const { isConnected, address } = useWallet();

  return (
    <nav className="md:hidden">
      <div className="px-4 py-3 space-y-3">
        <a href="/" className="block py-2">Home</a>
        <a href="/projects" className="block py-2">Projects</a>
        
        {isConnected && (
          <a href="/my-projects" className="block py-2">My Projects</a>
        )}
        
        <div className="pt-3 border-t">
          <WalletConnectButton className="w-full" />
        </div>
      </div>
    </nav>
  );
}
```

## Example 6: Protected Route

```tsx
// components/ProtectedContent.tsx
import { WalletConnectButton } from '@/lib/components';
import { useWallet } from '@/lib/contexts';

export function ProtectedContent({ children }: { children: React.ReactNode }) {
  const { isConnected, isLoading } = useWallet();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">Wallet Connection Required</h1>
          <p className="text-gray-600 mb-6">
            You need to connect your wallet to access this page.
          </p>
          <WalletConnectButton />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
```

## Example 7: Custom Styled Button

```tsx
// components/CustomWalletButton.tsx
import { WalletConnectButton } from '@/lib/components';

export function CustomWalletButton() {
  return (
    <WalletConnectButton 
      className="
        bg-gradient-to-r from-purple-600 to-blue-600
        hover:from-purple-700 hover:to-blue-700
        text-white font-bold py-3 px-6 rounded-full
        shadow-lg hover:shadow-xl
        transition-all duration-200
      "
      showBalance={true}
    />
  );
}
```

## Example 8: With Error Handling

```tsx
// components/WalletSection.tsx
import { WalletConnectButton } from '@/lib/components';
import { useWallet } from '@/lib/contexts';

export function WalletSection() {
  const { error, isConnected } = useWallet();

  return (
    <div className="space-y-4">
      <WalletConnectButton showBalance={true} />
      
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">
            Troubleshooting Tips:
          </h3>
          <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
            <li>Make sure you have Hiro Wallet or Xverse installed</li>
            <li>Check that your wallet is unlocked</li>
            <li>Ensure you're on the correct network (testnet/mainnet)</li>
            <li>Try refreshing the page</li>
          </ul>
        </div>
      )}
    </div>
  );
}
```

## Styling Tips

### Tailwind CSS Classes

The component uses Tailwind CSS and can be customized with the `className` prop:

```tsx
// Centered button
<WalletConnectButton className="mx-auto" />

// Full width
<WalletConnectButton className="w-full" />

// With margin
<WalletConnectButton className="mt-4 mb-2" />

// Custom colors (override defaults)
<WalletConnectButton className="[&>button]:bg-purple-600 [&>button]:hover:bg-purple-700" />
```

### Responsive Design

```tsx
// Different layouts for mobile/desktop
<WalletConnectButton 
  className="
    w-full sm:w-auto
    text-sm sm:text-base
    px-4 sm:px-6
  "
/>
```

## Accessibility

The component is fully accessible out of the box:

- ✅ Proper ARIA labels
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Focus indicators
- ✅ Error announcements

No additional configuration needed!

## Best Practices

1. **Always wrap with WalletProvider**: The component requires WalletProvider in the component tree
2. **Handle loading states**: Use `isLoading` from `useWallet()` for better UX
3. **Show errors clearly**: The component displays errors automatically, but you can add additional help text
4. **Use appropriate props**: Show balance in user profiles, use full address in settings
5. **Test on mobile**: Ensure the button works well on small screens
6. **Consider placement**: Typically in header/navigation for easy access

## Common Patterns

### Pattern 1: Wallet-Gated Actions

```tsx
const { isConnected } = useWallet();

return (
  <div>
    {isConnected ? (
      <button onClick={handleAction}>Perform Action</button>
    ) : (
      <div>
        <p>Connect wallet to continue</p>
        <WalletConnectButton />
      </div>
    )}
  </div>
);
```

### Pattern 2: Show Different Content

```tsx
const { isConnected, address } = useWallet();

return (
  <div>
    <WalletConnectButton showBalance={true} />
    {isConnected && (
      <div className="mt-4">
        <h3>Welcome back!</h3>
        <p>Your address: {address}</p>
      </div>
    )}
  </div>
);
```

### Pattern 3: Redirect After Connection

```tsx
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

function LoginPage() {
  const { isConnected } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) {
      router.push('/dashboard');
    }
  }, [isConnected, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-6">Welcome to StacksGives</h1>
        <WalletConnectButton />
      </div>
    </div>
  );
}
```
