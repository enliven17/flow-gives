# UI Components

This directory contains reusable React components for the StacksGives crowdfunding platform.

## Components

### WalletConnectButton

A component for wallet connection and management.

**Features:**
- Display "Connect Wallet" button when disconnected
- Show wallet address when connected (truncated or full)
- Handle connection and disconnection
- Display connection errors
- Optional balance display
- Loading states
- Accessible (WCAG 2.1 AA compliant)

**Usage:**

```tsx
import { WalletConnectButton } from '@/lib/components';

// Basic usage
<WalletConnectButton />

// With balance display
<WalletConnectButton showBalance={true} />

// With full address
<WalletConnectButton showFullAddress={true} />

// With custom styling
<WalletConnectButton className="my-custom-class" />
```

**Props:**

- `className?: string` - Optional CSS class for styling
- `showFullAddress?: boolean` - Show full address instead of truncated (default: false)
- `showBalance?: boolean` - Show USDCx balance when connected (default: false)

**Requirements:** 1.1, 1.2, 1.4

## Testing

All components have comprehensive test coverage including:
- Unit tests for rendering and behavior
- Accessibility tests
- Error handling tests
- Loading state tests

Run tests with:

```bash
npm test lib/components
```

## Styling

Components use Tailwind CSS for styling. The design follows a minimal, modern aesthetic with:
- Consistent color palette
- Proper spacing and typography
- Responsive layouts
- Accessible focus states
- Smooth transitions

## Accessibility

All components follow WCAG 2.1 Level AA standards:
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Sufficient color contrast
- Focus indicators

## Future Components

Planned components for upcoming tasks:
- ProjectCard
- ProjectList
- ContributionForm
- ContributionList
- ProjectForm
