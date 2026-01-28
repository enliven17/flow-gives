# Data Models

This directory contains the TypeScript interfaces and types for the StacksGives crowdfunding platform.

## Overview

The data models define the structure of core entities in the application:
- **Project**: Crowdfunding campaigns with funding goals and deadlines
- **Contribution**: Individual contributions made to projects

## Files

- `project.ts` - Project and Contribution interfaces with helper functions
- `index.ts` - Barrel export for easy imports
- `project.test.ts` - Unit tests for model creation and computed properties

## Usage

### Importing Models

```typescript
import { ProjectStatus, Project, Contribution, createProject, createContribution } from '@/lib/models';
```

### Creating a Project

```typescript
const project = createProject({
  id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'My Crowdfunding Project',
  description: 'A detailed description of the project',
  fundingGoal: 10000n, // 10,000 USDCx (in micro-units)
  totalRaised: 5000n,  // 5,000 USDCx raised so far
  contributorCount: 25,
  fundraiserAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  status: ProjectStatus.ACTIVE,
  deadline: new Date('2024-12-31'),
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Access computed properties
console.log(project.percentFunded); // 50
console.log(project.isActive);      // true
console.log(project.isFunded);      // false
console.log(project.timeRemaining); // milliseconds until deadline
```

### Creating a Contribution

```typescript
const contribution = createContribution({
  id: '123e4567-e89b-12d3-a456-426614174001',
  projectId: '123e4567-e89b-12d3-a456-426614174000',
  contributorAddress: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
  amount: 1000n, // 1,000 USDCx (in micro-units)
  txId: '0x1234567890abcdef',
  blockHeight: 12345,
  createdAt: new Date(),
});
```

## Project Status

Projects can be in one of five states:

- **DRAFT**: Project is being created but not yet published
- **ACTIVE**: Project is live and accepting contributions
- **FUNDED**: Project has reached its funding goal
- **EXPIRED**: Project deadline has passed without reaching the goal
- **CANCELLED**: Project was cancelled by the fundraiser

## Computed Properties

### Project.percentFunded

Calculates the percentage of the funding goal that has been achieved:
- Formula: `(totalRaised / fundingGoal) * 100`
- Returns 0 if fundingGoal is 0
- Can exceed 100% if the project is overfunded

### Project.timeRemaining

Time remaining until the project deadline in milliseconds:
- Positive value: deadline is in the future
- Negative value: deadline has passed
- Formula: `deadline.getTime() - Date.now()`

### Project.isActive

Boolean indicating if the project is currently active:
- `true` if status is `ProjectStatus.ACTIVE`
- `false` otherwise

### Project.isFunded

Boolean indicating if the project has reached its funding goal:
- `true` if status is `ProjectStatus.FUNDED` OR `totalRaised >= fundingGoal`
- `false` otherwise

### Project.isExpired

Boolean indicating if the project deadline has passed:
- `true` if status is `ProjectStatus.EXPIRED` OR (deadline has passed AND not funded)
- `false` otherwise

## BigInt Usage

The platform uses `bigint` for monetary amounts to ensure precision when working with blockchain tokens:
- USDCx has 6 decimal places (1 USDCx = 1,000,000 micro-USDCx)
- All amounts are stored in micro-units as `bigint`
- Use helper functions to convert between display values and micro-units

Example:
```typescript
// Convert 100 USDCx to micro-units
const microUnits = 100n * 1_000_000n; // 100000000n

// Convert micro-units to USDCx for display
const displayValue = Number(microUnits) / 1_000_000; // 100
```

## Testing

Run the model tests:
```bash
npm test -- lib/models/project.test.ts
```

The test suite covers:
- Enum values
- Field assignment
- Computed property calculations
- Edge cases (zero funding goal, past deadlines, etc.)
- Optional field handling

## Requirements Validation

These models validate the following requirements:
- **Requirement 2.1**: Project creation with required fields
- **Requirement 3.8**: Contribution recording with all required fields
