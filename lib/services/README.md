# Services

This directory contains business logic services for the StacksGives crowdfunding platform.

## WalletService

The `WalletService` manages Stacks wallet connection and blockchain interactions.

### Features

- **Wallet Connection**: Connect to Hiro Wallet, Xverse, and other Stacks-compatible wallets
- **Connection State Management**: Track connection status and wallet address
- **USDCx Balance Queries**: Fetch token balances from the blockchain
- **Network Support**: Works with both mainnet and testnet

### Usage

```typescript
import { WalletService } from '@/lib/services/wallet.service';

// Initialize the service
const walletService = new WalletService({
  appName: 'StacksGives',
  appIconUrl: '/icon.png',
  network: 'testnet', // or 'mainnet'
});

// Connect wallet
try {
  const connection = await walletService.connect();
  console.log('Connected:', connection.address);
} catch (error) {
  console.error('Connection failed:', error);
}

// Check connection status
if (walletService.isConnected()) {
  const address = walletService.getAddress();
  console.log('Wallet address:', address);
}

// Get USDCx balance
const balance = await walletService.getUSDCxBalance();
console.log('Balance:', balance); // Returns bigint in micro-USDCx

// Disconnect
await walletService.disconnect();
```

### Utility Functions

The service also exports utility functions for working with USDCx amounts:

```typescript
import { formatUSDCx, toMicroUSDCx, fromMicroUSDCx } from '@/lib/services/wallet.service';

// Format for display
const displayAmount = formatUSDCx(1500000n); // "1.50"

// Convert to micro-USDCx (for blockchain transactions)
const microAmount = toMicroUSDCx(1.5); // 1500000n

// Convert from micro-USDCx (for display)
const usdcxAmount = fromMicroUSDCx(1500000n); // 1.5
```

### USDCx Token Details

- **Decimals**: 6 (1 USDCx = 1,000,000 micro-USDCx)
- **Mainnet Contract**: `SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.usdcx-token`
- **Testnet Contract**: TBD (update when available)

### Error Handling

The service throws descriptive errors for common failure scenarios:

- **Wallet not connected**: When trying to get address or balance without connection
- **User cancelled**: When user rejects the connection request
- **Network error**: When blockchain queries fail
- **Invalid configuration**: When required config is missing

### Testing

Unit tests are provided in `wallet.service.test.ts`. Run tests with:

```bash
npm test -- lib/services/wallet.service.test.ts
```

### Requirements Satisfied

- **1.1**: Display wallet connection option
- **1.2**: Initiate connection request to Stacks wallet
- **1.3**: Store wallet address in session and manage connection state
- **1.5**: Support multiple Stacks-compatible wallet providers

### Future Enhancements

- Add support for additional wallet providers
- Implement wallet event listeners (account change, network change)
- Add caching for balance queries
- Support for multiple token types beyond USDCx

## TransactionService

The `TransactionService` handles blockchain transaction operations for USDCx transfers.

### Features

- **Transaction Construction**: Create USDCx transfer transactions
- **Transaction Signing**: Sign transactions via wallet connection
- **Transaction Broadcasting**: Submit transactions to the blockchain
- **Transaction Monitoring**: Poll for confirmation with exponential backoff
- **Transaction Details**: Retrieve transaction information from the blockchain

### Usage

```typescript
import { TransactionService } from '@/lib/services/transaction.service';

// Initialize the service
const transactionService = new TransactionService({
  network: 'testnet', // or 'mainnet'
});

// Create a transfer transaction
const transaction = await transactionService.createTransferTransaction(
  'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7', // recipient
  1000000n, // amount in micro-USDCx (1 USDCx)
  'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE', // sender
  'Payment for services' // optional memo
);

// Sign and broadcast
const result = await transactionService.signAndBroadcast(transaction);
console.log('Transaction ID:', result.txId);

// Wait for confirmation
const status = await transactionService.waitForConfirmation(result.txId);
console.log('Status:', status.status); // 'confirmed' or 'failed'

// Get transaction details
const txDetails = await transactionService.getTransaction(result.txId);
console.log('Block height:', txDetails.blockHeight);

// Get explorer URL
const explorerUrl = transactionService.getExplorerUrl(result.txId);
console.log('View on explorer:', explorerUrl);
```

### Requirements Satisfied

- **3.3**: Initiate USDCx transfer transaction via connected wallet
- **8.2**: Use USDCx token contract for funding transactions
- **8.3**: Construct valid Stacks transactions with correct contract calls
- **8.4**: Monitor transaction status until confirmation
- **8.5**: Display transaction IDs and provide explorer links

## ProjectService

The `ProjectService` manages project lifecycle and business logic.

### Features

- **Project Creation**: Create new crowdfunding projects with validation
- **Project Updates**: Update draft projects with field validation
- **Project Publication**: Transition projects from draft to active status
- **Project Cancellation**: Cancel draft projects
- **Project Retrieval**: Get projects by ID or list with filters
- **Status Management**: Automatic status transitions based on funding and deadline

### Usage

```typescript
import { projectService } from '@/lib/services/project.service';

// Create a new project
const project = await projectService.createProject({
  title: 'My Crowdfunding Project',
  description: 'A detailed description of the project...',
  fundingGoal: 10000000000n, // 10,000 USDCx
  deadline: new Date('2025-12-31'),
  fundraiserAddress: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
  imageUrl: 'https://example.com/image.jpg',
  category: 'Technology',
});

// Update a draft project
const updated = await projectService.updateProject(project.id, {
  title: 'Updated Project Title',
  description: 'Updated description...',
});

// Publish the project
const published = await projectService.publishProject(project.id);

// Get project by ID
const retrieved = await projectService.getProject(project.id);

// List active projects
const activeProjects = await projectService.listProjects({
  status: ['active'],
  sortBy: 'newest',
  limit: 20,
});

// Get projects by fundraiser
const myProjects = await projectService.getProjectsByFundraiser(
  'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7'
);

// Check and update project status
const statusUpdated = await projectService.checkAndUpdateProjectStatus(project.id);
```

### Requirements Satisfied

- **2.1**: Require project title, description, funding goal, and deadline
- **2.2**: Assign unique identifier and store in database
- **2.3**: Save projects as draft and prevent public visibility
- **2.4**: Validate and publish projects to active status
- **2.5**: Display active projects in public listings
- **2.6**: Save project updates to database
- **2.7**: Automatically update status to funded when goal reached
- **2.8**: Update status to expired when deadline passes
- **2.9**: Allow cancellation only for draft projects

## ContributionService

The `ContributionService` handles contribution processing and recording.

### Features

- **Contribution Validation**: Validate amounts and project eligibility
- **Transaction Processing**: Create and broadcast contribution transactions
- **Contribution Recording**: Record confirmed contributions in database
- **Contribution Queries**: Retrieve contributions by project or contributor
- **Statistics**: Calculate aggregated contribution statistics

### Usage

```typescript
import { contributionService } from '@/lib/services/contribution.service';

// Make a contribution
const result = await contributionService.contribute(
  'project-123', // project ID
  500000000n, // 500 USDCx in micro-USDCx
  'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE' // contributor address
);

console.log('Transaction ID:', result.txId);

// Wait for confirmation and automatically record
const contribution = await contributionService.waitForConfirmationAndRecord(result);
console.log('Contribution recorded:', contribution.id);

// Or manually record after confirmation
const recorded = await contributionService.recordContribution({
  projectId: 'project-123',
  contributorAddress: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
  amount: 500000000n,
  txId: '0x1234567890abcdef',
  blockHeight: 12345,
  timestamp: new Date(),
});

// Get contributions for a project
const projectContributions = await contributionService.getProjectContributions(
  'project-123',
  10 // limit to 10 most recent
);

// Get contributions by a contributor
const myContributions = await contributionService.getContributorContributions(
  'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE'
);

// Get contribution statistics
const stats = await contributionService.getContributionStats('project-123');
console.log('Total raised:', stats.totalRaised);
console.log('Contributors:', stats.contributorCount);
console.log('Average:', stats.averageContribution);
console.log('Largest:', stats.largestContribution);

// Get explorer URL for transaction
const explorerUrl = contributionService.getExplorerUrl(result.txId);
console.log('View transaction:', explorerUrl);
```

### Contribution Flow

1. **Validate**: Check amount > 0 and project is active
2. **Create Transaction**: Construct USDCx transfer to fundraiser
3. **Sign & Broadcast**: User signs transaction in wallet
4. **Monitor**: Poll blockchain for confirmation
5. **Record**: Save contribution to database after confirmation
6. **Update Metrics**: Project totals updated automatically via database trigger

### Error Handling

The service throws descriptive errors for:

- **Invalid amount**: Amount must be greater than zero
- **Project not found**: Project doesn't exist
- **Project not active**: Project is draft, funded, expired, or cancelled
- **Deadline passed**: Project deadline has already passed
- **Duplicate transaction**: Contribution already recorded for transaction ID
- **Transaction failed**: Blockchain transaction failed or was rejected

### Requirements Satisfied

- **3.1**: Display contribution interface with amount input
- **3.2**: Validate contribution amount is greater than zero
- **3.3**: Initiate USDCx transfer transaction via connected wallet
- **3.4**: Display transaction status and confirmation link
- **3.5**: Record contribution in database after on-chain confirmation
- **3.6**: Update project's total raised amount
- **3.8**: Associate contribution with wallet address and timestamp

### Testing

Unit tests are provided in `contribution.service.test.ts`. Run tests with:

```bash
npm test -- lib/services/contribution.service.test.ts
```

### Integration with Other Services

The ContributionService integrates with:

- **TransactionService**: For blockchain transaction operations
- **ProjectRepository**: For project validation and retrieval
- **ContributionRepository**: For data persistence

### Future Enhancements

- Add support for contribution refunds
- Implement contribution rewards/tiers
- Add contribution comments/messages
- Support for recurring contributions
- Batch contribution processing
