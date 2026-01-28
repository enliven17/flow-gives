# Repositories

This directory contains the data access layer for the StacksGives crowdfunding platform. Repositories provide an abstraction over the Supabase database, handling data transformation between database format and application models.

## ProjectRepository

The `ProjectRepository` class provides CRUD operations and query methods for project data.

### Features

- **CRUD Operations**: Create, read, update, and delete project records
- **Filtering**: Filter projects by status, category, and fundraiser address
- **Sorting**: Sort projects by newest, most funded, or ending soon
- **Pagination**: Support for limit and offset-based pagination
- **Status Management**: Update project status with automatic timestamp handling
- **Metrics Updates**: Update funding metrics (total raised, contributor count)

### Usage

```typescript
import { projectRepository } from '@/lib/repositories';

// Create a new project
const project = await projectRepository.create({
  title: 'My Project',
  description: 'A great project',
  fundingGoal: 10000n,
  fundraiserAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  deadline: new Date('2025-12-31'),
  category: 'Technology',
});

// Find a project by ID
const project = await projectRepository.findById('project-id');

// Find projects with filters
const activeProjects = await projectRepository.find({
  status: [ProjectStatus.ACTIVE],
  sortBy: 'mostFunded',
  limit: 20,
});

// Update project
await projectRepository.update('project-id', {
  title: 'Updated Title',
  description: 'Updated description',
});

// Update project status
await projectRepository.updateStatus('project-id', ProjectStatus.ACTIVE);

// Update funding metrics
await projectRepository.updateMetrics('project-id', {
  totalRaised: 15000n,
  contributorCount: 25,
});

// Delete project
await projectRepository.delete('project-id');
```

### Data Transformation

The repository handles conversion between:
- Database format (snake_case, numbers for bigints, ISO strings for dates)
- Application format (camelCase, bigints, Date objects, computed properties)

### Error Handling

All repository methods throw descriptive errors when operations fail:
- `Failed to create project: {error message}`
- `Failed to update project: {error message}`
- `Failed to find project: {error message}`
- etc.

### Testing

The repository is fully tested with unit tests covering:
- CRUD operations
- Filtering and sorting
- Error handling
- Edge cases (not found, validation errors)

Run tests with:
```bash
npm test -- lib/repositories/project.repository.test.ts
```

## Design Principles

1. **Single Responsibility**: Each repository handles one entity type
2. **Abstraction**: Hide database implementation details from business logic
3. **Type Safety**: Full TypeScript typing for all operations
4. **Error Handling**: Consistent error messages and error propagation
5. **Testability**: Easy to mock for testing higher-level components

## ContributionRepository

The `ContributionRepository` class provides CRUD operations and query methods for contribution data.

### Features

- **Record Creation**: Insert contribution records after blockchain confirmation
- **Query by Project**: Find all contributions for a specific project
- **Query by Contributor**: Find all contributions by a specific wallet address
- **Query by Transaction ID**: Find contributions by blockchain transaction ID
- **Aggregation Methods**: Calculate statistics (total raised, contributor count, averages)

### Usage

```typescript
import { contributionRepository } from '@/lib/repositories';

// Create a new contribution
const contribution = await contributionRepository.create({
  projectId: 'project-id',
  contributorAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  amount: 100000000n,
  txId: '0x1234567890abcdef',
  blockHeight: 12345,
});

// Find contribution by transaction ID
const contribution = await contributionRepository.findByTxId('0x1234567890abcdef');

// Find contributions for a project
const contributions = await contributionRepository.findByProject('project-id', 10);

// Find contributions by a contributor
const contributions = await contributionRepository.findByContributor(
  'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
);

// Get contribution statistics
const stats = await contributionRepository.getStats('project-id');
console.log(stats.totalRaised); // bigint
console.log(stats.contributorCount); // number of unique contributors
console.log(stats.averageContribution); // bigint
console.log(stats.largestContribution); // bigint
```

### Data Transformation

The repository handles conversion between:
- Database format (snake_case, numbers for bigints, ISO strings for dates)
- Application format (camelCase, bigints, Date objects)

### Error Handling

All repository methods throw descriptive errors when operations fail:
- `Failed to create contribution: {error message}`
- `Failed to find contribution: {error message}`
- `Failed to find contributions by project: {error message}`
- `Failed to find contributions by contributor: {error message}`
- `Failed to get contribution stats: {error message}`

### Testing

The repository is fully tested with unit tests covering:
- Contribution creation
- Queries by project, contributor, and transaction ID
- Statistics aggregation
- Error handling
- Edge cases (no contributions, large amounts, minimum amounts)

Run tests with:
```bash
npm test -- lib/repositories/contribution.repository.test.ts
```

## Future Repositories

- `UserRepository`: Data access for user profiles (if needed)
