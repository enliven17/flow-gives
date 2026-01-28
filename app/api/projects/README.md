# Projects API Endpoints

This directory contains the API routes for managing crowdfunding projects in the StacksGives platform.

## Endpoints

### POST /api/projects

Create a new project in draft status.

**Request Body:**
```json
{
  "title": "My Project",
  "description": "A detailed description of my project (min 10 characters)",
  "fundingGoal": "10000",
  "deadline": "2025-12-31T23:59:59Z",
  "fundraiserAddress": "ST1X6Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P",
  "imageUrl": "https://example.com/image.jpg",
  "category": "Technology"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "title": "My Project",
  "description": "A detailed description of my project",
  "fundingGoal": "10000",
  "totalRaised": "0",
  "contributorCount": 0,
  "fundraiserAddress": "ST1X6Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P",
  "status": "draft",
  "deadline": "2025-12-31T23:59:59.000Z",
  "imageUrl": "https://example.com/image.jpg",
  "category": "Technology",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "percentFunded": 0,
  "timeRemaining": 31536000000,
  "isActive": false,
  "isFunded": false,
  "isExpired": false
}
```

**Error Responses:**
- `400 Bad Request` - Validation errors (missing fields, invalid values)
- `500 Internal Server Error` - Server error

**Requirements:** 2.1, 2.2, 2.3

---

### GET /api/projects

List projects with optional filters.

**Query Parameters:**
- `status` - Filter by status (comma-separated): `active`, `funded`, `expired`, `draft`, `cancelled`
- `category` - Filter by category
- `fundraiserAddress` - Filter by fundraiser wallet address
- `sortBy` - Sort order: `newest`, `mostFunded`, `endingSoon`
- `limit` - Maximum number of results (default: no limit)
- `offset` - Pagination offset (default: 0)

**Examples:**
```
GET /api/projects
GET /api/projects?status=active
GET /api/projects?status=active,funded&sortBy=mostFunded
GET /api/projects?fundraiserAddress=ST1X6Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P
GET /api/projects?limit=10&offset=20
```

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "title": "Project 1",
    "description": "Description",
    "fundingGoal": "10000",
    "totalRaised": "5000",
    "contributorCount": 10,
    "fundraiserAddress": "ST1X6Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P",
    "status": "active",
    "deadline": "2025-12-31T23:59:59.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "percentFunded": 50,
    "timeRemaining": 31536000000,
    "isActive": true,
    "isFunded": false,
    "isExpired": false
  }
]
```

**Error Responses:**
- `500 Internal Server Error` - Server error

**Requirements:** 2.5, 5.3, 5.4

---

### GET /api/projects/[id]

Get project details by ID.

**Response (200 OK):**
```json
{
  "id": "uuid",
  "title": "My Project",
  "description": "A detailed description",
  "fundingGoal": "10000",
  "totalRaised": "5000",
  "contributorCount": 10,
  "fundraiserAddress": "ST1X6Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P",
  "status": "active",
  "deadline": "2025-12-31T23:59:59.000Z",
  "imageUrl": "https://example.com/image.jpg",
  "category": "Technology",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "publishedAt": "2024-01-02T00:00:00.000Z",
  "percentFunded": 50,
  "timeRemaining": 31536000000,
  "isActive": true,
  "isFunded": false,
  "isExpired": false
}
```

**Error Responses:**
- `404 Not Found` - Project not found
- `500 Internal Server Error` - Server error

**Requirements:** 2.2, 2.6

---

### PATCH /api/projects/[id]

Update project details. Only draft projects can be updated.

**Request Body (all fields optional):**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "fundingGoal": "15000",
  "deadline": "2025-12-31T23:59:59Z",
  "imageUrl": "https://example.com/new-image.jpg",
  "category": "Updated Category"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "title": "Updated Title",
  "description": "Updated description",
  "fundingGoal": "15000",
  "totalRaised": "0",
  "contributorCount": 0,
  "fundraiserAddress": "ST1X6Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P",
  "status": "draft",
  "deadline": "2025-12-31T23:59:59.000Z",
  "imageUrl": "https://example.com/new-image.jpg",
  "category": "Updated Category",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z",
  "percentFunded": 0,
  "timeRemaining": 31536000000,
  "isActive": false,
  "isFunded": false,
  "isExpired": false
}
```

**Error Responses:**
- `400 Bad Request` - Validation errors or trying to update non-draft project
- `404 Not Found` - Project not found
- `500 Internal Server Error` - Server error

**Requirements:** 2.6

---

### POST /api/projects/[id]/publish

Publish a draft project, transitioning it to active status. All required fields must be valid.

**Request Body:** None

**Response (200 OK):**
```json
{
  "id": "uuid",
  "title": "My Project",
  "description": "A detailed description",
  "fundingGoal": "10000",
  "totalRaised": "0",
  "contributorCount": 0,
  "fundraiserAddress": "ST1X6Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P",
  "status": "active",
  "deadline": "2025-12-31T23:59:59.000Z",
  "imageUrl": "https://example.com/image.jpg",
  "category": "Technology",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z",
  "publishedAt": "2024-01-01T12:00:00.000Z",
  "percentFunded": 0,
  "timeRemaining": 31536000000,
  "isActive": true,
  "isFunded": false,
  "isExpired": false
}
```

**Error Responses:**
- `400 Bad Request` - Validation errors or project not in draft status
- `404 Not Found` - Project not found
- `500 Internal Server Error` - Server error

**Requirements:** 2.4, 2.5

---

### DELETE /api/projects/[id]

Cancel a project. Only draft projects can be cancelled.

**Request Body:** None

**Response (200 OK):**
```json
{
  "message": "Project cancelled successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Trying to cancel non-draft project
- `404 Not Found` - Project not found
- `500 Internal Server Error` - Server error

**Requirements:** 2.9

---

## Data Types

### BigInt Serialization

All `bigint` fields (fundingGoal, totalRaised) are serialized as strings in JSON responses to avoid precision loss. When sending requests, provide these values as strings.

### Date Serialization

All dates are serialized as ISO 8601 strings in UTC timezone.

### Project Status

Valid status values:
- `draft` - Project is being created, not visible publicly
- `active` - Project is published and accepting contributions
- `funded` - Project has reached its funding goal
- `expired` - Project deadline passed without reaching goal
- `cancelled` - Project was cancelled by fundraiser

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "error": "Error message describing what went wrong"
}
```

HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors, business rule violations)
- `404` - Not Found
- `500` - Internal Server Error

## Testing

The API routes delegate to the `ProjectService` which has comprehensive unit tests. To test the API routes:

1. **Unit tests**: Test the `ProjectService` directly (see `lib/services/project.service.test.ts`)
2. **Integration tests**: Use a tool like Postman or curl to test the endpoints with a running server
3. **E2E tests**: Use Playwright or similar to test the full user flow

## Implementation Notes

- All routes use Next.js 14+ App Router conventions
- Routes are implemented as route handlers in `route.ts` files
- Dynamic routes use `[id]` folder naming convention
- All business logic is delegated to the `ProjectService`
- Database operations are handled by the `ProjectRepository`
- Validation is performed at the service layer
- Error handling provides appropriate HTTP status codes and messages
