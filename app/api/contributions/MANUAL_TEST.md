# Manual Testing Guide for Contributions API

This guide provides curl commands to manually test all the contribution API endpoints.

## Prerequisites

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Ensure the database is set up and running (see DATABASE_SETUP.md)

3. Create and publish a test project first (see app/api/projects/MANUAL_TEST.md)

4. Have a valid transaction ID from a confirmed USDCx transfer on Stacks blockchain

## Test Scenarios

### 1. Record a Contribution

Replace `{PROJECT_ID}` with an actual project UUID from your database:

```bash
curl -X POST http://localhost:3000/api/contributions \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "{PROJECT_ID}",
    "contributorAddress": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    "amount": "1000000",
    "txId": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "blockHeight": 12345,
    "timestamp": "2024-01-15T10:30:00Z"
  }'
```

**Expected Response:** 201 Created with contribution data including `id` and `createdAt`

Save the returned `id` and `txId` for subsequent tests.

---

### 2. Try to Record Duplicate Contribution (Should Fail)

Use the same `txId` from step 1:

```bash
curl -X POST http://localhost:3000/api/contributions \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "{PROJECT_ID}",
    "contributorAddress": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    "amount": "1000000",
    "txId": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "blockHeight": 12345,
    "timestamp": "2024-01-15T10:30:00Z"
  }'
```

**Expected Response:** 409 Conflict with error message "Contribution already recorded for this transaction"

---

### 3. Record Another Contribution from Different Contributor

```bash
curl -X POST http://localhost:3000/api/contributions \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "{PROJECT_ID}",
    "contributorAddress": "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
    "amount": "2500000",
    "txId": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "blockHeight": 12346,
    "timestamp": "2024-01-15T11:00:00Z"
  }'
```

**Expected Response:** 201 Created with contribution data

---

### 4. Get Contributions for a Project

Replace `{PROJECT_ID}` with the project UUID:

```bash
curl http://localhost:3000/api/projects/{PROJECT_ID}/contributions
```

**Expected Response:** 200 OK with array of contributions for that project

---

### 5. Get Limited Number of Contributions

Replace `{PROJECT_ID}` with the project UUID:

```bash
curl "http://localhost:3000/api/projects/{PROJECT_ID}/contributions?limit=10"
```

**Expected Response:** 200 OK with up to 10 most recent contributions

---

### 6. Get Contributions by Contributor Address

```bash
curl "http://localhost:3000/api/contributions?contributorAddress=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
```

**Expected Response:** 200 OK with array of all contributions from that address

---

### 7. Get Contributions Without Filter (Should Return Empty)

```bash
curl http://localhost:3000/api/contributions
```

**Expected Response:** 200 OK with empty array `[]`

(This is by design to avoid returning all contributions)

---

### 8. Get Project Statistics

Replace `{PROJECT_ID}` with the project UUID:

```bash
curl http://localhost:3000/api/projects/{PROJECT_ID}/stats
```

**Expected Response:** 200 OK with statistics:
```json
{
  "totalRaised": "3500000",
  "contributorCount": 2,
  "averageContribution": "1750000",
  "largestContribution": "2500000"
}
```

---

### 9. Verify Project Metrics Updated

Replace `{PROJECT_ID}` with the project UUID:

```bash
curl http://localhost:3000/api/projects/{PROJECT_ID}
```

**Expected Response:** 200 OK with project showing updated `totalRaised` and `contributorCount`

The `totalRaised` should match the sum of all contributions (3500000 in this example).

---

### 10. Record Contribution to Non-Existent Project (Should Fail)

```bash
curl -X POST http://localhost:3000/api/contributions \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "00000000-0000-0000-0000-000000000000",
    "contributorAddress": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    "amount": "1000000",
    "txId": "0xdeadbeef1234567890abcdef1234567890abcdef1234567890abcdef12345678",
    "blockHeight": 12347,
    "timestamp": "2024-01-15T12:00:00Z"
  }'
```

**Expected Response:** 404 Not Found with error message "Project not found"

---

### 11. Test Multiple Contributions from Same Contributor

Record a third contribution from the first contributor:

```bash
curl -X POST http://localhost:3000/api/contributions \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "{PROJECT_ID}",
    "contributorAddress": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    "amount": "500000",
    "txId": "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
    "blockHeight": 12348,
    "timestamp": "2024-01-15T13:00:00Z"
  }'
```

**Expected Response:** 201 Created

Then verify contributor count is still 2 (distinct contributors):

```bash
curl http://localhost:3000/api/projects/{PROJECT_ID}/stats
```

**Expected Response:** `contributorCount: 2` (not 3, because same contributor)

---

### 12. Test Project Status Transition to Funded

If the project's funding goal is 5000000 (5 USDCx), record a large contribution:

```bash
curl -X POST http://localhost:3000/api/contributions \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "{PROJECT_ID}",
    "contributorAddress": "ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP",
    "amount": "5000000",
    "txId": "0x9999999999999999999999999999999999999999999999999999999999999999",
    "blockHeight": 12349,
    "timestamp": "2024-01-15T14:00:00Z"
  }'
```

Then check project status:

```bash
curl http://localhost:3000/api/projects/{PROJECT_ID}
```

**Expected Response:** Project with `status: "funded"` (if total >= goal)

---

## Verification Checklist

After running all tests, verify:

- ✅ Can record contributions with valid data
- ✅ Cannot record duplicate contributions (same txId)
- ✅ Can get contributions for a specific project
- ✅ Can filter contributions by contributor address
- ✅ Can limit number of contributions returned
- ✅ Can get aggregated statistics for a project
- ✅ Project metrics update automatically when contribution recorded
- ✅ Contributor count reflects distinct contributors
- ✅ Project status transitions to "funded" when goal reached
- ✅ Proper error handling for invalid project ID
- ✅ Proper error handling for duplicate transactions
- ✅ BigInt fields are serialized as strings
- ✅ Dates are in ISO 8601 format

## Database Trigger Verification

The `update_project_metrics()` trigger should automatically:

1. Increment `total_raised` by contribution amount
2. Recalculate `contributor_count` (distinct contributors)
3. Update `status` to "funded" if `total_raised >= funding_goal`
4. Update `updated_at` timestamp

Verify this by checking the project after each contribution:

```bash
curl http://localhost:3000/api/projects/{PROJECT_ID}
```

Compare `totalRaised` with the sum of all contribution amounts.

## Notes

- All `amount` values are in micro-USDCx (6 decimals)
- Example: "1000000" = 1 USDCx
- Transaction IDs must be unique (use different txId for each test)
- Stacks addresses must start with ST (testnet) or SP (mainnet)
- Block heights should be realistic (> 0)
- Timestamps must be in ISO 8601 format

## Test Data

Valid testnet addresses for testing:
- `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM`
- `ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG`
- `ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP`

Example transaction IDs (for testing only, not real):
- `0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`
- `0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890`
- `0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321`

## Troubleshooting

If tests fail:

1. Check that the development server is running
2. Verify database connection in `.env.local`
3. Ensure database schema is up to date (run `npm run setup-db`)
4. Verify the project exists and is active
5. Check that transaction IDs are unique
6. Ensure amounts are positive integers
7. Check server logs for detailed error messages
8. Verify that database triggers are installed correctly

## Integration Testing Flow

Complete end-to-end flow:

1. Create a project: `POST /api/projects`
2. Publish the project: `POST /api/projects/{id}/publish`
3. Verify project is active: `GET /api/projects/{id}`
4. Record a contribution: `POST /api/contributions`
5. Check project metrics updated: `GET /api/projects/{id}`
6. View contributions: `GET /api/projects/{id}/contributions`
7. Check statistics: `GET /api/projects/{id}/stats`
8. Record more contributions and verify metrics update
9. Verify project status changes to "funded" when goal reached
