# Contributions API

API endpoints for managing contributions to crowdfunding projects.

## Endpoints

### POST /api/contributions

Record a confirmed contribution in the database.

This endpoint should be called after a contribution transaction is confirmed on-chain to persist it in the database. The contribution will automatically update the project's funding metrics via database triggers.

**Request Body:**
```json
{
  "projectId": "uuid",
  "contributorAddress": "ST1X6Y...",
  "amount": "1000000",
  "txId": "0x123...",
  "blockHeight": 12345,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "projectId": "uuid",
  "contributorAddress": "ST1X6Y...",
  "amount": "1000000",
  "txId": "0x123...",
  "blockHeight": 12345,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input data
- `404 Not Found` - Project not found
- `409 Conflict` - Contribution already recorded for this transaction
- `500 Internal Server Error` - Server error

**Requirements:** 3.5, 3.8

---

### GET /api/contributions

List contributions with optional filters.

**Query Parameters:**
- `contributorAddress` (optional) - Filter by contributor wallet address

**Note:** If no `contributorAddress` is provided, returns an empty array to avoid returning all contributions.

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "projectId": "uuid",
    "contributorAddress": "ST1X6Y...",
    "amount": "1000000",
    "txId": "0x123...",
    "blockHeight": 12345,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

**Error Responses:**
- `500 Internal Server Error` - Server error

**Requirements:** 3.8

---

### GET /api/projects/[id]/contributions

Get all contributions for a specific project.

**Path Parameters:**
- `id` - Project UUID

**Query Parameters:**
- `limit` (optional) - Maximum number of contributions to return

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "projectId": "uuid",
    "contributorAddress": "ST1X6Y...",
    "amount": "1000000",
    "txId": "0x123...",
    "blockHeight": 12345,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

**Error Responses:**
- `500 Internal Server Error` - Server error

**Requirements:** 3.8

---

### GET /api/projects/[id]/stats

Get aggregated contribution statistics for a project.

**Path Parameters:**
- `id` - Project UUID

**Response (200 OK):**
```json
{
  "totalRaised": "5000000",
  "contributorCount": 10,
  "averageContribution": "500000",
  "largestContribution": "2000000"
}
```

**Error Responses:**
- `500 Internal Server Error` - Server error

**Requirements:** 3.8

---

## Data Types

### Amount Format

All amounts are represented as strings containing bigint values in micro-USDCx (6 decimals).

Example: `"1000000"` = 1 USDCx

### Address Format

Stacks wallet addresses start with `ST` (testnet) or `SP` (mainnet).

Example: `"ST1X6Y2F3Z4A5B6C7D8E9F0G1H2I3J4K5L6M7N8O"`

### Transaction ID Format

Stacks transaction IDs are hex strings prefixed with `0x`.

Example: `"0x1234567890abcdef..."`

---

## Usage Examples

### Recording a Contribution

```typescript
// After transaction is confirmed on-chain
const response = await fetch('/api/contributions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: 'project-uuid',
    contributorAddress: 'ST1X6Y...',
    amount: '1000000', // 1 USDCx
    txId: '0x123...',
    blockHeight: 12345,
    timestamp: new Date().toISOString(),
  }),
});

const contribution = await response.json();
```

### Getting Project Contributions

```typescript
// Get last 10 contributions for a project
const response = await fetch('/api/projects/project-uuid/contributions?limit=10');
const contributions = await response.json();
```

### Getting Contributor's Contributions

```typescript
// Get all contributions by a specific contributor
const response = await fetch('/api/contributions?contributorAddress=ST1X6Y...');
const contributions = await response.json();
```

### Getting Project Statistics

```typescript
// Get aggregated statistics for a project
const response = await fetch('/api/projects/project-uuid/stats');
const stats = await response.json();

console.log(`Total raised: ${stats.totalRaised} micro-USDCx`);
console.log(`Contributors: ${stats.contributorCount}`);
```

---

## Integration with Project Endpoints

The contribution endpoints work together with the project endpoints:

1. **Create Project**: `POST /api/projects`
2. **Publish Project**: `POST /api/projects/[id]/publish`
3. **View Project**: `GET /api/projects/[id]`
4. **Contribute** (off-chain): Construct and broadcast USDCx transaction
5. **Record Contribution**: `POST /api/contributions` (after confirmation)
6. **View Contributions**: `GET /api/projects/[id]/contributions`
7. **View Statistics**: `GET /api/projects/[id]/stats`

---

## Database Triggers

When a contribution is recorded via `POST /api/contributions`, the following happens automatically:

1. Contribution record is inserted into `contributions` table
2. Database trigger `update_project_metrics()` fires
3. Project's `total_raised` is incremented by contribution amount
4. Project's `contributor_count` is recalculated (distinct contributors)
5. Project's `status` is updated to `'funded'` if goal is reached
6. Project's `updated_at` timestamp is updated

This ensures data consistency and eliminates the need for manual metric updates.

---

## Error Handling

All endpoints follow consistent error handling patterns:

- **400 Bad Request**: Invalid input data or validation errors
- **404 Not Found**: Resource not found (project, contribution)
- **409 Conflict**: Duplicate resource (contribution already recorded)
- **500 Internal Server Error**: Unexpected server errors

Error responses include a descriptive message:

```json
{
  "error": "Contribution already recorded for this transaction"
}
```
