# StacksGives Crowdfunding Smart Contract

## Overview

This directory contains the Clarity smart contract for the StacksGives crowdfunding platform. The contract manages decentralized crowdfunding projects with USDCx token integration on the Stacks blockchain.

## Contract: crowdfunding.clar

### Data Structures

#### Projects Map
Stores all project information:
- `project-id`: Unique identifier (uint)
- `creator`: Project creator's principal address
- `title`: Project title (max 100 characters)
- `description`: Project description (max 500 characters)
- `goal`: Funding goal in USDCx micro-units (uint)
- `deadline`: Project deadline in block height (uint)
- `raised`: Amount raised so far in USDCx micro-units (uint)
- `withdrawn`: Whether funds have been withdrawn (bool)
- `created-at`: Creation timestamp in block height (uint)

#### Contributions Map
Stores individual contributions:
- Key: `{ project-id, contributor }`
- `amount`: Total contribution amount in USDCx micro-units (uint)
- `refunded`: Whether contribution has been refunded (bool)
- `contributed-at`: First contribution timestamp in block height (uint)

#### Project Status Map
Tracks project status:
- `project-id`: Project identifier
- `status`: Status code (0 = active, 1 = funded, 2 = expired)

### Public Functions

#### create-project
Creates a new crowdfunding project.

**Parameters:**
- `title` (string-utf8 100): Project title
- `description` (string-utf8 500): Project description
- `goal` (uint): Funding goal in USDCx micro-units
- `deadline` (uint): Project deadline in block height

**Returns:** `(ok project-id)` on success

**Validations:**
- Title must not be empty
- Description must not be empty
- Goal must be greater than 0
- Deadline must be in the future

**Requirements Addressed:** 3.1, 3.2, 3.3, 3.4, 3.5

#### contribute
Records a contribution to a project.

**Parameters:**
- `project-id` (uint): Target project ID
- `amount` (uint): Contribution amount in USDCx micro-units

**Returns:** `(ok true)` on success

**Validations:**
- Amount must be greater than 0
- Project must exist
- Deadline must not have passed
- Goal must not already be met
- Funds must not have been withdrawn

**Side Effects:**
- Updates or creates contribution record
- Increases project's raised amount
- Updates project status to "funded" if goal is met

**Requirements Addressed:** 3.2, 3.3, 3.4, 3.5

#### withdraw-funds
Allows project creator to withdraw funds from a successful project.

**Parameters:**
- `project-id` (uint): Project ID to withdraw from

**Returns:** `(ok raised-amount)` on success

**Validations:**
- Caller must be the project creator
- Project must have reached its funding goal
- Funds must not have been withdrawn already

**Side Effects:**
- Marks project as withdrawn
- Updates project status to "funded"

**Requirements Addressed:** 3.3, 3.4, 3.5

#### request-refund
Allows contributor to request a refund for a failed project.

**Parameters:**
- `project-id` (uint): Project ID to refund from

**Returns:** `(ok refund-amount)` on success

**Validations:**
- Project deadline must have passed
- Project must not have reached its goal
- Funds must not have been withdrawn
- Contribution must exist
- Contribution must not have been refunded already

**Side Effects:**
- Marks contribution as refunded
- Updates project status to "expired"

**Requirements Addressed:** 3.3, 3.4, 3.5

### Read-Only Functions

#### get-project
Retrieves project details by ID.

**Parameters:**
- `project-id` (uint): Project ID

**Returns:** `(ok (optional project-data))`

#### get-contribution
Retrieves contribution details.

**Parameters:**
- `project-id` (uint): Project ID
- `contributor` (principal): Contributor address

**Returns:** `(ok (optional contribution-data))`

#### get-project-status
Retrieves project status.

**Parameters:**
- `project-id` (uint): Project ID

**Returns:** `(ok (optional status-data))`

#### get-project-counter
Returns the current project counter.

**Returns:** `(ok counter-value)`

#### is-project-active
Checks if a project is currently active.

**Parameters:**
- `project-id` (uint): Project ID

**Returns:** `(ok bool)`

#### can-withdraw
Checks if funds can be withdrawn from a project.

**Parameters:**
- `project-id` (uint): Project ID

**Returns:** `(ok bool)`

#### can-refund
Checks if a project is eligible for refunds.

**Parameters:**
- `project-id` (uint): Project ID

**Returns:** `(ok bool)`

## Error Codes

- `u100`: Unauthorized - Caller is not authorized for this operation
- `u101`: Invalid parameters - Input validation failed
- `u102`: Project not found - Project ID does not exist
- `u103`: Deadline passed - Project deadline has expired
- `u104`: Goal not met - Funding goal has not been reached
- `u105`: Already withdrawn - Funds have already been withdrawn
- `u106`: Not eligible for refund - Project is not eligible for refunds
- `u107`: Already refunded - Contribution has already been refunded
- `u108`: Transfer failed - Token transfer operation failed
- `u109`: Goal already met - Project has already reached its goal

## Project Status Codes

- `0`: Active - Project is accepting contributions
- `1`: Funded - Project has reached its goal and funds can be withdrawn
- `2`: Expired - Project deadline passed without reaching goal, refunds available

## USDCx Integration

The contract is designed to integrate with the USDCx token contract on Stacks. The commented-out sections in the code show where token transfers would occur:

1. **Contributions**: Transfer USDCx from contributor to contract
2. **Withdrawals**: Transfer USDCx from contract to project creator
3. **Refunds**: Transfer USDCx from contract back to contributor

To enable full USDCx integration, uncomment the `contract-call?` statements and configure the USDCx token contract address.

## Deployment

### Prerequisites
- Clarinet CLI installed
- Stacks testnet account with STX for deployment
- USDCx token contract address on testnet

### Deployment Steps

1. **Test locally with Clarinet:**
   ```bash
   clarinet test
   ```

2. **Deploy to testnet:**
   ```bash
   clarinet deploy --testnet
   ```

3. **Verify deployment:**
   - Note the contract address
   - Update frontend configuration with contract address
   - Test contract functions using Stacks Explorer

## Testing

Unit tests for this contract should be created in the `tests/` directory using Clarinet's testing framework. See task 2.2 in the implementation plan.

## Security Considerations

1. **Authorization**: Only project creators can withdraw funds
2. **Validation**: All inputs are validated before processing
3. **State Management**: Project and contribution states are carefully managed to prevent double-spending
4. **Refund Protection**: Contributions can only be refunded once
5. **Withdrawal Protection**: Funds can only be withdrawn once and only if goal is met

## Future Enhancements

1. **Partial Withdrawals**: Allow creators to withdraw funds in stages
2. **Milestone-Based Funding**: Release funds based on project milestones
3. **Contribution Limits**: Set minimum/maximum contribution amounts
4. **Project Categories**: Add categorization for better discovery
5. **Extended Deadlines**: Allow creators to extend deadlines under certain conditions
