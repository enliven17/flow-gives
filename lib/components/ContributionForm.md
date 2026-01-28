# ContributionForm Component

## Overview

The `ContributionForm` component provides a complete user interface for making contributions to crowdfunding projects. It handles amount validation, balance checking, transaction signing, broadcasting, and confirmation tracking.

## Features

- **Amount Input**: Numeric input field with validation
- **Balance Display**: Shows user's current USDCx balance
- **Validation**: 
  - Amount must be greater than zero
  - Amount must meet minimum requirement
  - Amount must not exceed user's balance
- **Transaction Flow**:
  - Signing status (waiting for wallet signature)
  - Broadcasting status (sending to blockchain)
  - Confirming status (waiting for blockchain confirmation)
  - Confirmed status (transaction successful)
  - Failed status (transaction or confirmation failed)
- **Transaction Details**: Displays transaction ID and blockchain explorer link
- **Error Handling**: Clear error messages for validation and transaction failures
- **Accessibility**: Full ARIA support for screen readers

## Requirements

Implements requirements:
- **3.1**: Display contribution interface with amount input
- **3.2**: Validate contribution amount > 0
- **3.4**: Display transaction status and confirmation link

## Usage

### Basic Usage

```tsx
import { ContributionForm } from '@/lib/components';

function ProjectDetailPage({ project }) {
  return (
    <ContributionForm
      projectId={project.id}
      fundraiserAddress={project.fundraiserAddress}
    />
  );
}
```

### With Callbacks

```tsx
import { ContributionForm } from '@/lib/components';

function ProjectDetailPage({ project }) {
  const handleSuccess = (result) => {
    console.log('Contribution successful!', result);
    // Refresh project data, show success message, etc.
  };

  const handleError = (error) => {
    console.error('Contribution failed:', error);
    // Show error notification, log to error tracking, etc.
  };

  return (
    <ContributionForm
      projectId={project.id}
      fundraiserAddress={project.fundraiserAddress}
      onSuccess={handleSuccess}
      onError={handleError}
    />
  );
}
```

### With Custom Minimum Amount

```tsx
import { ContributionForm } from '@/lib/components';

function ProjectDetailPage({ project }) {
  return (
    <ContributionForm
      projectId={project.id}
      fundraiserAddress={project.fundraiserAddress}
      minAmount={10} // Minimum 10 USDCx
    />
  );
}
```

### With Custom Styling

```tsx
import { ContributionForm } from '@/lib/components';

function ProjectDetailPage({ project }) {
  return (
    <ContributionForm
      projectId={project.id}
      fundraiserAddress={project.fundraiserAddress}
      className="max-w-md mx-auto"
    />
  );
}
```

## Props

### ContributionFormProps

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `projectId` | `string` | Yes | - | Project ID to contribute to |
| `fundraiserAddress` | `string` | Yes | - | Fundraiser's wallet address (recipient) |
| `onSuccess` | `(result: ContributionResult) => void` | No | - | Callback when contribution is confirmed |
| `onError` | `(error: Error) => void` | No | - | Callback when contribution fails |
| `className` | `string` | No | `''` | Additional CSS classes |
| `minAmount` | `number` | No | `1` | Minimum contribution amount in USDCx |

### ContributionResult

```typescript
interface ContributionResult {
  txId: string;              // Transaction ID
  amount: bigint;            // Contribution amount in micro-USDCx
  projectId: string;         // Project ID
  contributorAddress: string; // Contributor's wallet address
}
```

### TransactionStatus

```typescript
type TransactionStatus = 
  | 'idle'        // No transaction in progress
  | 'signing'     // Waiting for wallet signature
  | 'broadcasting' // Broadcasting to blockchain
  | 'confirming'  // Waiting for confirmation
  | 'confirmed'   // Transaction confirmed
  | 'failed';     // Transaction failed
```

## Validation Rules

The component validates contributions according to these rules:

1. **Required**: Amount field must not be empty
2. **Numeric**: Amount must be a valid number
3. **Positive**: Amount must be greater than zero
4. **Minimum**: Amount must meet or exceed `minAmount` prop
5. **Balance**: Amount must not exceed user's USDCx balance
6. **Wallet**: User must have wallet connected

## Transaction Flow

The component manages the complete transaction lifecycle:

```
1. User enters amount
2. User clicks "Contribute"
3. Status: signing → Wallet prompts for signature
4. Status: broadcasting → Transaction sent to blockchain
5. Status: confirming → Waiting for blockchain confirmation
6. Status: confirmed → Contribution recorded in database
7. Balance refreshed, form reset, onSuccess callback fired
```

If any step fails, status changes to `failed` and error is displayed.

## Error Handling

The component handles various error scenarios:

### Wallet Errors
- **Not connected**: Shows warning message, disables form
- **Insufficient balance**: Validation error before transaction

### Validation Errors
- **Empty amount**: "Amount is required"
- **Invalid number**: "Amount must be a valid number"
- **Zero or negative**: "Amount must be greater than zero"
- **Below minimum**: "Amount must be at least X USDCx"
- **Exceeds balance**: "Insufficient balance. You have X USDCx"

### Transaction Errors
- **User rejection**: "User rejected transaction"
- **Network error**: "Network error, please try again"
- **Confirmation timeout**: "Transaction confirmation timeout"
- **On-chain failure**: Displays blockchain error message

## Accessibility

The component follows WCAG 2.1 Level AA guidelines:

- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: 
  - Proper ARIA labels on all inputs
  - `aria-invalid` on validation errors
  - `aria-live="polite"` for status updates
  - `role="alert"` for error messages
- **Focus Management**: Clear focus indicators
- **Color Contrast**: Meets contrast requirements
- **Error Association**: Errors linked to inputs via `aria-describedby`

## Styling

The component uses Tailwind CSS classes and can be customized:

### Default Styles
- White background with shadow
- Blue primary buttons
- Red error states
- Green success states
- Responsive padding and spacing

### Customization
Pass custom classes via `className` prop to override container styles.

## Integration with Services

The component integrates with:

- **WalletContext**: For wallet connection state and balance
- **ContributionService**: For transaction creation and broadcasting
- **TransactionService**: For transaction monitoring (via ContributionService)

## Best Practices

1. **Always provide callbacks**: Use `onSuccess` and `onError` to handle results
2. **Refresh project data**: After successful contribution, refresh project to show updated totals
3. **Show notifications**: Display user-friendly success/error notifications
4. **Set appropriate minimums**: Use `minAmount` to enforce project-specific minimums
5. **Handle loading states**: Component manages its own loading, but parent should handle page-level loading

## Example: Complete Integration

```tsx
import { useState } from 'react';
import { ContributionForm } from '@/lib/components';
import { useProject } from '@/lib/hooks/useProject';

function ProjectDetailPage({ projectId }) {
  const { project, refresh } = useProject(projectId);
  const [notification, setNotification] = useState(null);

  const handleSuccess = async (result) => {
    // Show success notification
    setNotification({
      type: 'success',
      message: `Successfully contributed ${result.amount / 1_000_000} USDCx!`,
    });

    // Refresh project data to show updated totals
    await refresh();

    // Clear notification after 5 seconds
    setTimeout(() => setNotification(null), 5000);
  };

  const handleError = (error) => {
    // Show error notification
    setNotification({
      type: 'error',
      message: error.message,
    });

    // Log to error tracking service
    console.error('Contribution error:', error);

    // Clear notification after 5 seconds
    setTimeout(() => setNotification(null), 5000);
  };

  if (!project) return <div>Loading...</div>;

  return (
    <div>
      <h1>{project.title}</h1>
      <p>{project.description}</p>

      {/* Notification */}
      {notification && (
        <div className={`alert alert-${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Contribution Form */}
      {project.status === 'active' && (
        <ContributionForm
          projectId={project.id}
          fundraiserAddress={project.fundraiserAddress}
          onSuccess={handleSuccess}
          onError={handleError}
          minAmount={5}
        />
      )}
    </div>
  );
}
```

## Testing

The component includes comprehensive unit tests covering:

- Wallet connection states
- Amount validation (all rules)
- Transaction flow (success and failure)
- Error handling
- Accessibility features

Run tests:
```bash
npm test -- ContributionForm.test.tsx
```

## Related Components

- **WalletConnectButton**: For wallet connection
- **ProjectCard**: For displaying project information
- **ContributionList**: For displaying contribution history

## Related Services

- **ContributionService**: Handles contribution logic
- **TransactionService**: Manages blockchain transactions
- **WalletService**: Manages wallet connection
