# Manual Testing Guide for Projects API

This guide provides curl commands to manually test all the project API endpoints.

## Prerequisites

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Ensure the database is set up and running (see DATABASE_SETUP.md)

## Test Scenarios

### 1. Create a Draft Project

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Crowdfunding Project",
    "description": "This is a test project for the StacksGives platform with a detailed description",
    "fundingGoal": "100000000",
    "deadline": "2025-12-31T23:59:59Z",
    "fundraiserAddress": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    "imageUrl": "https://example.com/project-image.jpg",
    "category": "Technology"
  }'
```

**Expected Response:** 201 Created with project data including `id` and `status: "draft"`

Save the returned `id` for subsequent tests.

---

### 2. List All Projects

```bash
curl http://localhost:3000/api/projects
```

**Expected Response:** 200 OK with array of projects (may be empty initially)

---

### 3. List Active Projects Only

```bash
curl http://localhost:3000/api/projects?status=active
```

**Expected Response:** 200 OK with array of active projects (should be empty if no projects published yet)

---

### 4. Get Project by ID

Replace `{PROJECT_ID}` with the ID from step 1:

```bash
curl http://localhost:3000/api/projects/{PROJECT_ID}
```

**Expected Response:** 200 OK with project details

---

### 5. Update Draft Project

Replace `{PROJECT_ID}` with the ID from step 1:

```bash
curl -X PATCH http://localhost:3000/api/projects/{PROJECT_ID} \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Test Project",
    "fundingGoal": "150000000"
  }'
```

**Expected Response:** 200 OK with updated project data

---

### 6. Publish Project

Replace `{PROJECT_ID}` with the ID from step 1:

```bash
curl -X POST http://localhost:3000/api/projects/{PROJECT_ID}/publish
```

**Expected Response:** 200 OK with project data showing `status: "active"` and `publishedAt` timestamp

---

### 7. Try to Update Published Project (Should Fail)

Replace `{PROJECT_ID}` with the ID from step 1:

```bash
curl -X PATCH http://localhost:3000/api/projects/{PROJECT_ID} \
  -H "Content-Type: application/json" \
  -d '{
    "title": "This Should Fail"
  }'
```

**Expected Response:** 400 Bad Request with error message "Only draft projects can be updated"

---

### 8. List Active Projects (Should Include Published Project)

```bash
curl http://localhost:3000/api/projects?status=active
```

**Expected Response:** 200 OK with array containing the published project

---

### 9. Create Another Draft Project for Cancellation Test

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Project to Cancel",
    "description": "This project will be cancelled for testing purposes",
    "fundingGoal": "50000000",
    "deadline": "2025-06-30T23:59:59Z",
    "fundraiserAddress": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
  }'
```

**Expected Response:** 201 Created with project data

Save the returned `id` for the next test.

---

### 10. Cancel Draft Project

Replace `{PROJECT_ID}` with the ID from step 9:

```bash
curl -X DELETE http://localhost:3000/api/projects/{PROJECT_ID}
```

**Expected Response:** 200 OK with message "Project cancelled successfully"

---

### 11. Try to Cancel Published Project (Should Fail)

Replace `{PROJECT_ID}` with the ID from step 1 (the published project):

```bash
curl -X DELETE http://localhost:3000/api/projects/{PROJECT_ID}
```

**Expected Response:** 400 Bad Request with error message "Only draft projects can be cancelled"

---

### 12. Test Filtering by Fundraiser Address

```bash
curl "http://localhost:3000/api/projects?fundraiserAddress=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
```

**Expected Response:** 200 OK with array of projects from that fundraiser

---

### 13. Test Sorting by Most Funded

```bash
curl "http://localhost:3000/api/projects?sortBy=mostFunded&status=active"
```

**Expected Response:** 200 OK with projects sorted by totalRaised descending

---

### 14. Test Pagination

```bash
curl "http://localhost:3000/api/projects?limit=5&offset=0"
```

**Expected Response:** 200 OK with up to 5 projects

---

### 15. Test Invalid Project ID (404)

```bash
curl http://localhost:3000/api/projects/00000000-0000-0000-0000-000000000000
```

**Expected Response:** 404 Not Found with error message "Project not found"

---

### 16. Test Validation Errors

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "title": "",
    "description": "Short",
    "fundingGoal": "0",
    "deadline": "2020-01-01T00:00:00Z",
    "fundraiserAddress": "INVALID"
  }'
```

**Expected Response:** 400 Bad Request with validation error messages

---

## Verification Checklist

After running all tests, verify:

- ✅ Can create draft projects
- ✅ Can list projects with various filters
- ✅ Can get individual project details
- ✅ Can update draft projects
- ✅ Can publish draft projects
- ✅ Cannot update published projects
- ✅ Can cancel draft projects
- ✅ Cannot cancel published projects
- ✅ Proper error handling for invalid inputs
- ✅ Proper error handling for not found resources
- ✅ BigInt fields are serialized as strings
- ✅ Dates are in ISO 8601 format
- ✅ Status transitions work correctly

## Notes

- All `fundingGoal` and `totalRaised` values are in micro-USDCx (6 decimals)
- Example: "100000000" = 100 USDCx
- Dates must be in ISO 8601 format
- Stacks addresses must start with ST (testnet) or SP (mainnet)
- The test address `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM` is a valid testnet address

## Troubleshooting

If tests fail:

1. Check that the development server is running
2. Verify database connection in `.env.local`
3. Ensure database schema is up to date (run `npm run setup-db`)
4. Check server logs for detailed error messages
5. Verify that Supabase is accessible
