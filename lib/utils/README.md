# Utility Functions

This directory contains utility functions for the StacksGives crowdfunding platform. These functions provide reusable formatting and calculation logic used throughout the application.

## Modules

### `format.ts`

Formatting and calculation utilities for display purposes.

#### Functions

##### `calculateFundingPercentage(totalRaised: bigint, fundingGoal: bigint): number`

Calculates the funding percentage for a project.

- **Parameters:**
  - `totalRaised`: Amount raised in micro-USDCx
  - `fundingGoal`: Funding goal in micro-USDCx
- **Returns:** Percentage of goal achieved (0-100+), or 0 if goal is 0
- **Validates:** Requirements 4.3

**Example:**
```typescript
calculateFundingPercentage(50000000n, 100000000n) // Returns 50
calculateFundingPercentage(150000000n, 100000000n) // Returns 150 (overfunded)
```

##### `calculateTimeRemaining(deadline: Date, currentTime?: Date): number`

Calculates the time remaining until a deadline.

- **Parameters:**
  - `deadline`: The deadline date
  - `currentTime`: Optional current time (defaults to now)
- **Returns:** Time remaining in milliseconds (positive if future, negative if past)
- **Validates:** Requirements 4.5

**Example:**
```typescript
const deadline = new Date('2024-12-31');
calculateTimeRemaining(deadline) // Returns milliseconds until deadline
```

##### `formatWalletAddress(address: string): string`

Formats a wallet address for display by truncating the middle.

- **Parameters:**
  - `address`: Full wallet address
- **Returns:** Truncated address (e.g., "ST1X6Y...AB12")
- **Validates:** Requirements 6.6

**Example:**
```typescript
formatWalletAddress('ST1X6Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P') 
// Returns "ST1X6Y...N7O8P"
```

##### `formatUSDCx(microUsdcx: bigint): string`

Formats micro-USDCx amount to display string with 2 decimal places.

- **Parameters:**
  - `microUsdcx`: Amount in micro-USDCx (smallest unit)
- **Returns:** Formatted string with 2 decimal places (e.g., "1.50")
- **Validates:** Requirements 4.1, 4.2

**Example:**
```typescript
formatUSDCx(1000000n) // Returns "1.00"
formatUSDCx(1500000n) // Returns "1.50"
```

##### `formatTimeRemaining(milliseconds: number): string`

Formats time remaining into a human-readable string.

- **Parameters:**
  - `milliseconds`: Time remaining in milliseconds
- **Returns:** Human-readable string (e.g., "5 days", "3 hours", "45 minutes")

**Example:**
```typescript
formatTimeRemaining(432000000) // Returns "5 days"
formatTimeRemaining(10800000) // Returns "3 hours"
formatTimeRemaining(-1000) // Returns "Expired"
```

## Usage

Import utilities from the index file:

```typescript
import {
  calculateFundingPercentage,
  calculateTimeRemaining,
  formatWalletAddress,
  formatUSDCx,
  formatTimeRemaining,
} from '@/lib/utils';

// Calculate funding percentage
const percentage = calculateFundingPercentage(
  project.totalRaised,
  project.fundingGoal
);

// Format wallet address for display
const displayAddress = formatWalletAddress(project.fundraiserAddress);

// Format USDCx amount
const displayAmount = formatUSDCx(contribution.amount);

// Calculate and format time remaining
const msRemaining = calculateTimeRemaining(project.deadline);
const timeDisplay = formatTimeRemaining(msRemaining);
```

## Testing

All utility functions have comprehensive unit tests covering:
- Standard use cases
- Edge cases (zero values, negative values, boundary conditions)
- Large and small values
- Format validation

Run tests with:
```bash
npm test lib/utils/format.test.ts
```

## Design Principles

1. **Pure Functions**: All utilities are pure functions with no side effects
2. **Type Safety**: Full TypeScript type definitions for all parameters and returns
3. **Consistent Formatting**: All display functions follow consistent formatting rules
4. **Edge Case Handling**: Robust handling of edge cases (zero, negative, very large values)
5. **Documentation**: Comprehensive JSDoc comments with examples
