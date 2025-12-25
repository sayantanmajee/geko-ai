# GEKO-AI API Documentation

**Version:** 0.1.0  
**Last Updated:** 2025-12-23

**Base URL:** `http://localhost:3002/v1` (development)  
**Production:** `https://api.geko-ai.com/v1`

**WebSocket:** `ws://localhost:3002/ws` (for streaming)

---

## Authentication

All endpoints (except `/v1/auth/*`) require an Authorization header: 

```
Authorization: Bearer <access_token>
```

**How to get a token:**
1. Register:  `POST /v1/auth/register`
2. Login: `POST /v1/auth/login`
3. Response includes `accessToken`

**Token Format:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWlkIiwidGVuYW50SWQiOiJ0ZW5hbnQtaWQiLCJyb2xlIjoibWVtYmVyIn0.signature
```

**Expiry:** 15 minutes (use refresh endpoint to get new token)

---

## Response Format

All responses follow this format:

### Success Response

```json
{
  "ok": true,
  "data":  { ...  },
  "requestId": "uuid"
}
```

### Error Response

```json
{
  "ok": false,
  "error": "ERROR_CODE",
  "message": "Human readable message",
  "statusCode": 400,
  "requestId": "uuid"
}
```

---

## Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `INVALID_TOKEN` | 401 | JWT invalid or expired |
| `USER_NOT_FOUND` | 404 | User doesn't exist |
| `TENANT_NOT_FOUND` | 404 | Tenant doesn't exist |
| `WORKSPACE_NOT_FOUND` | 404 | Workspace doesn't exist |
| `DUPLICATE_ENTRY` | 409 | Email already exists |
| `VALIDATION_ERROR` | 400 | Invalid input |
| `QUOTA_EXCEEDED` | 429 | Rate limited or quota exceeded |
| `PERMISSION_DENIED` | 403 | Insufficient permissions |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |

---

## Auth Service Endpoints

### 1. Register (Create Tenant + User)

```http
POST /v1/auth/register

Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123",
  "tenantName": "Acme Corp"
}
```

**Response (201):**
```json
{
  "ok": true,
  "accessToken": "eyJhbGc.. .",
  "refreshToken": "eyJhbGc.. .",
  "expiresIn": 900,
  "user": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email":  "user@example.com",
    "name": null,
    "role": "owner",
    "status": "active",
    "tenantId": "660e8400-e29b-41d4-a716-446655440000",
    "createdAt": 1703251234000,
    "updatedAt": 1703251234000
  },
  "tenant": {
    "tenantId": "660e8400-e29b-41d4-a716-446655440000",
    "name": "Acme Corp",
    "plan": "free",
    "status": "active",
    "createdAt": 1703251234000,
    "updatedAt": 1703251234000
  },
  "requestId": "req-uuid"
}
```

**Validations:**
- Email must be valid format
- Password must be at least 4 characters
- Tenant name must be unique (globally)

**Errors:**
- `400` - Validation error
- `409` - Email already exists

---

### 2. Login

```http
POST /v1/auth/login

Content-Type:  application/json

{
  "email": "user@example.com",
  "password": "Password123",
  "tenantId": "optional-tenant-uuid"
}
```

**Response (200):**
```json
{
  "ok": true,
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 900,
  "user": { ... },
  "tenant": { ... },
  "requestId":  "req-uuid"
}
```

**Parameters:**
- `email` (required) - User email
- `password` (required) - User password
- `tenantId` (optional) - Specific tenant (if user is in multiple)

**Errors:**
- `401` - Invalid credentials
- `404` - User not found

---

### 3. Get Current User

```http
GET /v1/auth/me

Authorization:  Bearer <access_token>
```

**Response (200):**
```json
{
  "ok": true,
  "user":  {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "tenantId": "660e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "member",
    "status": "active",
    "createdAt":  1703251234000,
    "updatedAt": 1703251234000
  },
  "requestId": "req-uuid"
}
```

**Errors:**
- `401` - Missing or invalid token
- `404` - User not found

---

### 4. Refresh Token

```http
POST /v1/auth/refresh

Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

**Response (200):**
```json
{
  "ok": true,
  "accessToken": "eyJhbGc...",
  "expiresIn": 900,
  "requestId": "req-uuid"
}
```

**Parameters:**
- `refreshToken` (required) - Refresh token from login/register

**Errors:**
- `401` - Invalid refresh token
- `401` - Token expired

---

### 5. Logout

```http
POST /v1/auth/logout

Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "ok": true,
  "message": "Logged out successfully",
  "requestId": "req-uuid"
}
```

**Note:** This is client-side logout (token is deleted locally). Server does not revoke token (JWT stateless).

---

## Workspace Service Endpoints (DAY 3+)

### 6. List Workspaces

```http
GET /v1/workspaces

Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 20) - Results per page
- `sort` (optional) - Sort by field (name, createdAt)
- `order` (optional, default: desc) - asc or desc

**Response (200):**
```json
{
  "ok": true,
  "data": [
    {
      "workspaceId": "770e8400-e29b-41d4-a716-446655440000",
      "tenantId": "660e8400-e29b-41d4-a716-446655440000",
      "name": "Sales Team",
      "description": "Sales department",
      "iconUrl": "https://...",
      "status": "active",
      "createdAt": 1703251234000,
      "updatedAt": 1703251234000
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  },
  "requestId":  "req-uuid"
}
```

---

### 7. Create Workspace

```http
POST /v1/workspaces

Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Engineering Team",
  "description": "Engineering department"
}
```

**Response (201):**
```json
{
  "ok": true,
  "data": {
    "workspaceId": "770e8400-e29b-41d4-a716-446655440000",
    "tenantId": "660e8400-e29b-41d4-a716-446655440000",
    "name": "Engineering Team",
    "description": "Engineering department",
    "status": "active",
    "createdAt": 1703251234000,
    "updatedAt": 1703251234000
  },
  "requestId":  "req-uuid"
}
```

**Validations:**
- Name must be unique within tenant
- Max 255 characters

---

### 8. Get Workspace

```http
GET /v1/workspaces/: workspaceId

Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "workspaceId": "770e8400-e29b-41d4-a716-446655440000",
    "tenantId": "660e8400-e29b-41d4-a716-446655440000",
    "name": "Engineering Team",
    "description":  "Engineering department",
    "status": "active",
    "createdAt": 1703251234000,
    "updatedAt": 1703251234000
  },
  "requestId":  "req-uuid"
}
```

---

### 9. Update Workspace

```http
PATCH /v1/workspaces/:workspaceId

Authorization:  Bearer <access_token>
Content-Type: application/json

{
  "name": "Engineering Team (Updated)",
  "description": "Updated description"
}
```

**Response (200):** Updated workspace object

---

### 10. Delete Workspace

```http
DELETE /v1/workspaces/:workspaceId

Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "ok": true,
  "message": "Workspace deleted",
  "requestId": "req-uuid"
}
```

---

### 11. Get Workspace Configuration

```http
GET /v1/workspaces/:workspaceId/config

Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "configId": "880e8400-e29b-41d4-a716-446655440000",
    "workspaceId": "770e8400-e29b-41d4-a716-446655440000",
    "enabledModels": [
      "gpt-4",
      "gpt-3.5-turbo",
      "claude-3-sonnet"
    ],
    "enabledMcps": [
      "google_search",
      "web_browsing"
    ],
    "customSettings": {
      "temperature": 0.7,
      "maxTokens": 2000
    },
    "createdAt": 1703251234000,
    "updatedAt": 1703251234000
  },
  "requestId": "req-uuid"
}
```

---

### 12. Update Workspace Configuration

```http
PATCH /v1/workspaces/:workspaceId/config

Authorization: Bearer <access_token>
Content-Type: application/json

{
  "enabledModels": ["gpt-4", "claude-3-sonnet"],
  "enabledMcps": ["google_search"],
  "customSettings": {
    "temperature": 0.8,
    "maxTokens":  4000
  }
}
```

**Response (200):** Updated config object

---

### 13. Get Workspace Quotas

```http
GET /v1/workspaces/:workspaceId/quotas

Authorization:  Bearer <access_token>
```

**Response (200):**
```json
{
  "ok": true,
  "data":  {
    "quotaId": "990e8400-e29b-41d4-a716-446655440000",
    "workspaceId": "770e8400-e29b-41d4-a716-446655440000",
    "tokensLimit": 1000000,
    "tokensUsed": 45000,
    "requestsLimit": 1000,
    "requestsUsed": 120,
    "filesLimit": 100,
    "filesUsed":  5,
    "resetAt": "2024-01-31T23:59:59Z",
    "createdAt": 1703251234000,
    "updatedAt": 1703251234000
  },
  "requestId": "req-uuid"
}
```

---

## Chat Service Endpoints (DAY 4+)

### 14. Send Message (WebSocket)

```javascript
// Connect
const ws = new WebSocket('ws://localhost:3002/ws/chat/conversationId', {
  headers: {
    'Authorization': 'Bearer <access_token>'
  }
});

// Send message
ws.send(JSON. stringify({
  type: 'message',
  message: 'What is 2 + 2?',
  model: 'gpt-4',
  mcps: ['google_search']
}));

// Listen for responses
ws.onmessage = (event) => {
  const data = JSON.parse(event. data);
  
  if (data.type === 'chunk') {
    // Streaming chunk
    console.log(data.content);
  } else if (data.type === 'done') {
    // Complete
    console.log('Message done');
  } else if (data.type === 'error') {
    // Error
    console.error(data.error);
  }
};

// Close
ws.close();
```

**Message Format:**
```json
{
  "type": "message",
  "message": "User message",
  "model": "gpt-4",
  "mcps": ["google_search"],
  "temperature": 0.7,
  "maxTokens": 2000
}
```

**Response Chunks:**
```json
{
  "type": "chunk",
  "content": "Streamed text.. .",
  "tokenCount": 10
}
```

**Completion:**
```json
{
  "type": "done",
  "totalTokens": 150,
  "totalCost": 0.0045
}
```

---

## Examples

### Example 1: Register and Login

```bash
# Register
curl -X POST http://localhost:3002/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "SecurePass123",
    "tenantName": "Acme Corp"
  }'

# Save the accessToken from response
TOKEN="eyJhbGc..."

# Get profile
curl -X GET http://localhost:3002/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Example 2: Create Workspace

```bash
TOKEN="eyJhbGc..."

curl -X POST http://localhost:3002/v1/workspaces \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type:  application/json" \
  -d '{
    "name": "Sales Team",
    "description": "Sales department workspace"
  }'
```

### Example 3: Update Workspace Config

```bash
TOKEN="eyJhbGc..."
WORKSPACE_ID="770e8400-e29b-41d4-a716-446655440000"

curl -X PATCH http://localhost:3002/v1/workspaces/$WORKSPACE_ID/config \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enabledModels": ["gpt-4", "claude-3-sonnet"],
    "enabledMcps": ["google_search"]
  }'
```

---

## Rate Limiting

**Limits per IP:**
- 100 requests per minute
- 1000 requests per hour

**Limits per authenticated user:**
- 1000 requests per minute
- 10000 requests per hour

**Workspace quotas:**
- Token limit: configurable per workspace
- Request limit: configurable per workspace

**Headers (in response):**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1703251294
```

**When limit exceeded:**
```json
{
  "ok": false,
  "error":  "QUOTA_EXCEEDED",
  "message": "Rate limit exceeded.  Try again in 60 seconds.",
  "statusCode": 429
}
```

---

## Pagination

List endpoints support pagination: 

```http
GET /v1/workspaces?page=2&limit=10&sort=name&order=asc
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20, max: 100)
- `sort` - Field to sort by (default: createdAt)
- `order` - asc or desc (default: desc)

**Response:**
```json
{
  "ok": true,
  "data": [ ... ],
  "pagination": {
    "page": 2,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

---

## Filtering (Future)

Will support filtering: 

```http
GET /v1/workspaces?status=active&search=Sales
```

---

## Webhooks (Future)

Will send webhooks for:
- `user.created` - New user registered
- `workspace.created` - New workspace created
- `chat.started` - Conversation started
- `quota.exceeded` - Quota limit reached

Subscribe at: `POST /v1/webhooks/subscribe`

---

## Changelog

### v0.1.0 (Current - DAY 2)
- Auth endpoints (register, login, refresh, me, logout)

### v0.2.0 (DAY 3)
- Workspace endpoints
- Configuration endpoints
- Quota endpoints

### v0.3.0 (DAY 4)
- Chat endpoint (WebSocket)
- Message streaming
- Agent execution

### v1.0.0 (Week 4)
- All features complete
- Webhooks
- Advanced filtering

---

**Version:** 0.1.0  
**Last Updated:** 2025-12-23