# REST API Plan

## 1. Resources

| Resource | Database Table       | Description                                       |
| -------- | -------------------- | ------------------------------------------------- |
| Sessions | `sessions`           | Estimation sessions owned by authenticated users  |
| Cards    | `cards`              | Task cards within a session for bucket estimation |
| AI       | N/A (business logic) | AI-powered estimation and embedding generation    |

## 2. Endpoints

### 2.1 Sessions

#### GET /api/sessions

List all sessions for the authenticated user.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| is_active | boolean | No | Filter by active/inactive status |
| limit | integer | No | Number of results (default: 20, max: 100) |
| offset | integer | No | Pagination offset (default: 0) |

**Response Payload (200 OK):**

```json
{
  "data": [
    {
      "id": "uuid",
      "is_active": true,
      "context": "string | null",
      "cards_count": 15,
      "created_at": "ISO8601",
      "updated_at": "ISO8601"
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 20,
    "offset": 0
  }
}
```

**Error Responses:**
| Code | Message | Description |
|------|---------|-------------|
| 401 | Unauthorized | User not authenticated |

---

#### POST /api/sessions

Create a new estimation session.

**Request Payload:**

```json
{
  "context": "string | null"
}
```

**Response Payload (201 Created):**

```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "is_active": true,
    "context": "string | null",
    "created_at": "ISO8601",
    "updated_at": "ISO8601"
  }
}
```

**Error Responses:**
| Code | Message | Description |
|------|---------|-------------|
| 401 | Unauthorized | User not authenticated |
| 400 | Bad Request | Invalid request payload |

---

#### GET /api/sessions/:id

Get session details by ID.

**Response Payload (200 OK):**

```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "is_active": true,
    "context": "string | null",
    "cards_count": 15,
    "created_at": "ISO8601",
    "updated_at": "ISO8601"
  }
}
```

**Error Responses:**
| Code | Message | Description |
|------|---------|-------------|
| 401 | Unauthorized | User not authenticated |
| 404 | Not Found | Session not found or not owned by user |

---

#### PATCH /api/sessions/:id

Update session properties.

**Request Payload:**

```json
{
  "context": "string | null",
  "is_active": false
}
```

**Response Payload (200 OK):**

```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "is_active": false,
    "context": "string | null",
    "created_at": "ISO8601",
    "updated_at": "ISO8601"
  }
}
```

**Error Responses:**
| Code | Message | Description |
|------|---------|-------------|
| 401 | Unauthorized | User not authenticated |
| 404 | Not Found | Session not found or not owned by user |
| 400 | Bad Request | Invalid request payload |

---

#### DELETE /api/sessions/:id

Delete a session and all its cards.

**Response Payload (204 No Content):**
Empty response body.

**Error Responses:**
| Code | Message | Description |
|------|---------|-------------|
| 401 | Unauthorized | User not authenticated |
| 404 | Not Found | Session not found or not owned by user |

---

#### POST /api/sessions/:id/clear

Clear session state (remove cards from buckets but preserve analytics data).

**Response Payload (200 OK):**

```json
{
  "data": {
    "id": "uuid",
    "is_active": true,
    "cards_cleared": 15,
    "message": "Session cleared successfully"
  }
}
```

**Error Responses:**
| Code | Message | Description |
|------|---------|-------------|
| 401 | Unauthorized | User not authenticated |
| 404 | Not Found | Session not found or not owned by user |

---

#### GET /api/sessions/:id/summary

Get estimation summary for the session.

**Response Payload (200 OK):**

```json
{
  "data": {
    "session_id": "uuid",
    "cards": [
      {
        "id": "uuid",
        "external_id": "TASK-123",
        "title": "Implement login feature",
        "bucket_value": 5
      }
    ],
    "statistics": {
      "total_cards": 15,
      "estimated_cards": 12,
      "unestimated_cards": 3,
      "bucket_distribution": {
        "1": 2,
        "2": 3,
        "3": 2,
        "5": 3,
        "8": 1,
        "13": 1,
        "21": 0,
        "?": 3
      }
    }
  }
}
```

**Error Responses:**
| Code | Message | Description |
|------|---------|-------------|
| 401 | Unauthorized | User not authenticated |
| 404 | Not Found | Session not found or not owned by user |

---

### 2.2 Cards

#### GET /api/sessions/:sessionId/cards

List all cards in a session.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| bucket_value | integer | No | Filter by bucket value (0, 1, 2, 3, 5, 8, 13, 21, null) |

**Response Payload (200 OK):**

```json
{
  "data": [
    {
      "id": "uuid",
      "session_id": "uuid",
      "external_id": "TASK-123",
      "title": "Implement login feature",
      "description": "Full description here...",
      "bucket_value": 5,
      "has_embedding": true,
      "created_at": "ISO8601",
      "updated_at": "ISO8601"
    }
  ]
}
```

**Error Responses:**
| Code | Message | Description |
|------|---------|-------------|
| 401 | Unauthorized | User not authenticated |
| 404 | Not Found | Session not found or not owned by user |

---

#### POST /api/sessions/:sessionId/cards

Create a single card manually.

**Request Payload:**

```json
{
  "external_id": "TASK-123",
  "title": "Implement login feature",
  "description": "Optional description"
}
```

**Response Payload (201 Created):**

```json
{
  "data": {
    "id": "uuid",
    "session_id": "uuid",
    "external_id": "TASK-123",
    "title": "Implement login feature",
    "description": "Optional description",
    "bucket_value": null,
    "has_embedding": false,
    "created_at": "ISO8601",
    "updated_at": "ISO8601"
  }
}
```

**Error Responses:**
| Code | Message | Description |
|------|---------|-------------|
| 401 | Unauthorized | User not authenticated |
| 404 | Not Found | Session not found or not owned by user |
| 400 | Bad Request | Missing required fields (external_id, title) |
| 409 | Conflict | Card with this external_id already exists in session |
| 422 | Unprocessable Entity | Session has reached 50 cards limit |

---

#### POST /api/sessions/:sessionId/cards/import

Import multiple cards from CSV data.

**Request Payload:**

```json
{
  "csv_content": "id,title,description\nTASK-1,Login feature,Implement OAuth\nTASK-2,Dashboard,Create main dashboard"
}
```

**Response Payload (200 OK):**

```json
{
  "data": {
    "imported": 2,
    "failed": 1,
    "errors": [
      {
        "row": 3,
        "external_id": "TASK-3",
        "error": "Missing required field: title"
      }
    ],
    "cards": [
      {
        "id": "uuid",
        "external_id": "TASK-1",
        "title": "Login feature"
      },
      {
        "id": "uuid",
        "external_id": "TASK-2",
        "title": "Dashboard"
      }
    ]
  }
}
```

**Error Responses:**
| Code | Message | Description |
|------|---------|-------------|
| 401 | Unauthorized | User not authenticated |
| 404 | Not Found | Session not found or not owned by user |
| 400 | Bad Request | Invalid CSV format or missing required columns |
| 422 | Unprocessable Entity | Import would exceed 50 cards limit |

---

#### GET /api/sessions/:sessionId/cards/:id

Get single card details.

**Response Payload (200 OK):**

```json
{
  "data": {
    "id": "uuid",
    "session_id": "uuid",
    "external_id": "TASK-123",
    "title": "Implement login feature",
    "description": "Full description here...",
    "bucket_value": 5,
    "has_embedding": true,
    "created_at": "ISO8601",
    "updated_at": "ISO8601"
  }
}
```

**Error Responses:**
| Code | Message | Description |
|------|---------|-------------|
| 401 | Unauthorized | User not authenticated |
| 404 | Not Found | Card not found or session not owned by user |

---

#### PATCH /api/sessions/:sessionId/cards/:id

Update a single card.

**Request Payload:**

```json
{
  "title": "Updated title",
  "description": "Updated description",
  "bucket_value": 8
}
```

**Response Payload (200 OK):**

```json
{
  "data": {
    "id": "uuid",
    "session_id": "uuid",
    "external_id": "TASK-123",
    "title": "Updated title",
    "description": "Updated description",
    "bucket_value": 8,
    "has_embedding": true,
    "created_at": "ISO8601",
    "updated_at": "ISO8601"
  }
}
```

**Error Responses:**
| Code | Message | Description |
|------|---------|-------------|
| 401 | Unauthorized | User not authenticated |
| 404 | Not Found | Card not found or session not owned by user |
| 400 | Bad Request | Invalid bucket_value |

---

#### DELETE /api/sessions/:sessionId/cards/:id

Delete a single card.

**Response Payload (204 No Content):**
Empty response body.

**Error Responses:**
| Code | Message | Description |
|------|---------|-------------|
| 401 | Unauthorized | User not authenticated |
| 404 | Not Found | Card not found or session not owned by user |

---

#### PATCH /api/sessions/:sessionId/cards

Batch update multiple cards (for drag-and-drop operations).

**Request Payload:**

```json
{
  "cards": [
    {
      "id": "uuid-1",
      "bucket_value": 5
    },
    {
      "id": "uuid-2",
      "bucket_value": 8
    }
  ]
}
```

**Response Payload (200 OK):**

```json
{
  "data": {
    "updated": 2,
    "cards": [
      {
        "id": "uuid-1",
        "bucket_value": 5
      },
      {
        "id": "uuid-2",
        "bucket_value": 8
      }
    ]
  }
}
```

**Error Responses:**
| Code | Message | Description |
|------|---------|-------------|
| 401 | Unauthorized | User not authenticated |
| 404 | Not Found | Session or one of the cards not found |
| 400 | Bad Request | Invalid bucket_value or malformed request |

---

### 2.3 AI Endpoints

#### POST /api/sessions/:sessionId/ai/estimate

Run AI estimation on all cards in the session using Claude (model configurable via OPENROUTER_MODEL env).

The AI analyzes each card's title and description (plus optional session context) and assigns a bucket value from the Fibonacci sequence: 1, 2, 3, 5, 8, 13, 21.

**Request Payload:**

No request body required.

**Response Payload (200 OK):**

```json
{
  "data": {
    "estimated_cards": 15,
    "cards": [
      {
        "id": "uuid",
        "external_id": "TASK-123",
        "title": "Implement login feature",
        "bucket_value": 5
      }
    ]
  }
}
```

**Note:** The response contains only cards that were successfully estimated and updated in the database.

**Error Responses:**
| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid session ID format or no cards in session |
| 401 | Unauthorized | User not authenticated |
| 404 | Not Found | Session not found or not owned by user |
| 502 | Bad Gateway | Failed to parse AI response |
| 503 | Service Unavailable | AI service temporarily unavailable |

---

#### POST /api/sessions/:sessionId/cards/:id/embedding

Generate embedding for a single card.

**Response Payload (200 OK):**

```json
{
  "data": {
    "id": "uuid",
    "has_embedding": true,
    "message": "Embedding generated successfully"
  }
}
```

**Error Responses:**
| Code | Message | Description |
|------|---------|-------------|
| 401 | Unauthorized | User not authenticated |
| 404 | Not Found | Card not found or session not owned by user |
| 503 | Service Unavailable | Embedding service temporarily unavailable |

---

#### POST /api/sessions/:sessionId/cards/embeddings

Generate embeddings for all cards without embeddings.

**Response Payload (200 OK):**

```json
{
  "data": {
    "processed": 10,
    "skipped": 5,
    "failed": 0
  }
}
```

**Error Responses:**
| Code | Message | Description |
|------|---------|-------------|
| 401 | Unauthorized | User not authenticated |
| 404 | Not Found | Session not found or not owned by user |
| 503 | Service Unavailable | Embedding service temporarily unavailable |

---

## 3. Authentication and Authorization

### 3.1 Authentication Mechanism

The API uses **Supabase Auth** with the following flow:

1. **Magic Link Authentication**: Users receive a one-time login link via email
2. **Session Tokens**: After authentication, Supabase provides JWT tokens
3. **Token Transmission**: Tokens are sent via `Authorization: Bearer <token>` header or cookies

### 3.2 Implementation Details

```typescript
// Middleware extracts user from Supabase client
const {
  data: { user },
  error,
} = await supabase.auth.getUser();

if (!user) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
}
```

### 3.3 Authorization

- **Row Level Security (RLS)**: PostgreSQL RLS policies enforce data isolation
- **Session Ownership**: Users can only access sessions where `user_id = auth.uid()`
- **Card Access**: Cards are accessible only through sessions owned by the user

### 3.4 Security Headers

All API responses include:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'
```

---

## 4. Validation and Business Logic

### 4.1 Session Validation

| Field     | Validation Rules                       |
| --------- | -------------------------------------- |
| context   | Optional, string, max 10000 characters |
| is_active | Boolean                                |

### 4.2 Card Validation

| Field        | Validation Rules                                            |
| ------------ | ----------------------------------------------------------- |
| external_id  | Required, string, max 255 characters, unique within session |
| title        | Required, string, max 500 characters                        |
| description  | Optional, string, max 10000 characters                      |
| bucket_value | Optional, must be one of: null, 0, 1, 2, 3, 5, 8, 13, 21    |

### 4.3 CSV Import Validation

| Rule       | Description                                              |
| ---------- | -------------------------------------------------------- |
| Format     | Must have columns: id, title, description (in order)     |
| Headers    | First row must be header row                             |
| Required   | id and title columns cannot be empty                     |
| Limit      | Total cards after import cannot exceed 50                |
| Duplicates | Rows with duplicate external_id within file are rejected |

### 4.4 Business Logic Implementation

#### Session Cards Limit

```typescript
// Before creating/importing cards
const { count } = await supabase.from("cards").select("*", { count: "exact", head: true }).eq("session_id", sessionId);

if (count + newCardsCount > 50) {
  return new Response(JSON.stringify({ error: "Session card limit (50) exceeded" }), { status: 422 });
}
```

#### Bucket Value Validation

```typescript
const VALID_BUCKET_VALUES = [null, 0, 1, 2, 3, 5, 8, 13, 21];

const bucketSchema = z
  .number()
  .nullable()
  .refine((val) => VALID_BUCKET_VALUES.includes(val), { message: "Invalid bucket value" });
```

#### AI Estimation Flow

1. Validate session exists and belongs to user
2. Check `confirm_override` flag is true
3. Fetch all cards with their content
4. Call Openrouter.ai with cards data and optional context
5. Parse AI response and map to bucket values
6. Batch update all cards with new bucket_value
7. Return updated cards with confidence scores

#### Embedding Generation Flow

1. Validate card exists and belongs to user's session
2. Concatenate title and description for embedding
3. Call text-embedding-3-small via Openrouter.ai
4. Store 1536-dimension vector in cards.embedding
5. Update has_embedding flag

#### Session Clear Logic

```typescript
// Clear session preserves embedding data for analytics
await supabase.from("cards").update({ bucket_value: null }).eq("session_id", sessionId);
```

### 4.5 Error Response Format

All error responses follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error message",
    "details": [
      {
        "field": "bucket_value",
        "message": "Must be one of: null, 0, 1, 2, 3, 5, 8, 13, 21"
      }
    ]
  }
}
```

### 4.6 Rate Limiting

| Endpoint Category    | Limit                        |
| -------------------- | ---------------------------- |
| Standard API         | 100 requests/minute per user |
| AI Estimation        | 10 requests/hour per user    |
| Embedding Generation | 50 requests/hour per user    |

Rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```
