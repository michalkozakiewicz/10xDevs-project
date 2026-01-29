# POST /api/sessions - Manual Testing Guide (Development Mode)

## Prerequisites

1. **Add development user to database:**

   Run this SQL in Supabase SQL Editor:

   ```sql
   -- Insert development user into auth.users table
   -- This bypasses normal authentication for development purposes
   INSERT INTO auth.users (
     id,
     email,
     encrypted_password,
     email_confirmed_at,
     created_at,
     updated_at,
     raw_app_meta_data,
     raw_user_meta_data,
     is_super_admin,
     role
   ) VALUES (
     '00000000-0000-0000-0000-000000000001',
     'dev@example.com',
     crypt('dev-password-123', gen_salt('bf')),
     now(),
     now(),
     now(),
     '{"provider":"email","providers":["email"]}',
     '{}',
     false,
     'authenticated'
   )
   ON CONFLICT (id) DO NOTHING;
   ```

2. **Start the development server:**

   ```bash
   npm run dev
   ```

3. **Ensure Supabase is configured:**
   - `.env` file with `SUPABASE_URL` and `SUPABASE_KEY`

## Important Notes

- **NO AUTHENTICATION REQUIRED** - Auth is disabled for development
- All sessions will be created with `user_id: '00000000-0000-0000-0000-000000000001'`
- TODO: Authentication will be implemented later

## Test Scenarios

### Test 1: Success - Create session with context (201 Created)

```bash
curl -X POST http://localhost:4321/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"context": "E-commerce platform using React and Node.js"}'
```

**Expected Response (201):**

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "00000000-0000-0000-0000-000000000001",
    "is_active": true,
    "context": "E-commerce platform using React and Node.js",
    "created_at": "2024-01-26T18:00:00.000Z",
    "updated_at": "2024-01-26T18:00:00.000Z"
  }
}
```

### Test 2: Success - Create session with null context (201 Created)

```bash
curl -X POST http://localhost:4321/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"context": null}'
```

**Expected Response (201):**

```json
{
  "data": {
    "id": "...",
    "user_id": "00000000-0000-0000-0000-000000000001",
    "is_active": true,
    "context": null,
    "created_at": "...",
    "updated_at": "..."
  }
}
```

### Test 3: Success - Create session with empty body (201 Created)

```bash
curl -X POST http://localhost:4321/api/sessions \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response (201):**

- Status: 201
- Response: Session object with `context: null` and `user_id: '00000000-0000-0000-0000-000000000001'`

### Test 4: Error - Invalid payload type (400 Bad Request)

```bash
curl -X POST http://localhost:4321/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"context": 123}'
```

**Expected Response (400):**

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid request payload",
  "details": [
    {
      "field": "context",
      "message": "Expected string, received number"
    }
  ]
}
```

### Test 5: Error - Invalid payload with array (400 Bad Request)

```bash
curl -X POST http://localhost:4321/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"context": ["invalid", "array"]}'
```

**Expected Response (400):**

- Status: 400
- Response: Validation error with details

### Test 6: Error - Invalid payload with boolean (400 Bad Request)

```bash
curl -X POST http://localhost:4321/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"context": true}'
```

**Expected Response (400):**

- Status: 400
- Response: Validation error indicating context must be string or null

## Database Verification

After each successful test (201 response), verify in Supabase Dashboard:

1. Navigate to: **Table Editor → sessions**
2. Check that a new record exists with:
   - ✅ `id` matches the response
   - ✅ `user_id` = `'00000000-0000-0000-0000-000000000001'` (DEFAULT_USER_ID)
   - ✅ `is_active` = `true`
   - ✅ `context` matches the sent value (or `null`)
   - ✅ `created_at` and `updated_at` are set correctly

## RLS Policy Verification (Optional - for later when auth is implemented)

Currently RLS policies will allow all operations for the default development user.

When authentication is implemented:

1. Multiple users will have different `user_id` values
2. RLS policies will ensure users can only access their own sessions
3. The `user_id` will come from `auth.uid()` instead of `DEFAULT_USER_ID`

## Quick Test Script (Bash)

Save this as `test-sessions-endpoint.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:4321"

echo "========================================="
echo "Testing POST /api/sessions endpoint"
echo "Development Mode (No Auth Required)"
echo "========================================="
echo ""

echo "Test 1: Create session with context"
curl -s -X POST "$BASE_URL/api/sessions" \
  -H "Content-Type: application/json" \
  -d '{"context": "Test context with meaningful description"}' | jq
echo ""
echo "---"
echo ""

echo "Test 2: Create session with null context"
curl -s -X POST "$BASE_URL/api/sessions" \
  -H "Content-Type: application/json" \
  -d '{"context": null}' | jq
echo ""
echo "---"
echo ""

echo "Test 3: Create session without context (empty body)"
curl -s -X POST "$BASE_URL/api/sessions" \
  -H "Content-Type: application/json" \
  -d '{}' | jq
echo ""
echo "---"
echo ""

echo "Test 4: Invalid payload - context as number"
curl -s -X POST "$BASE_URL/api/sessions" \
  -H "Content-Type: application/json" \
  -d '{"context": 123}' | jq
echo ""
echo "---"
echo ""

echo "Test 5: Invalid payload - context as array"
curl -s -X POST "$BASE_URL/api/sessions" \
  -H "Content-Type: application/json" \
  -d '{"context": ["test"]}' | jq
echo ""
echo "---"
echo ""

echo "========================================="
echo "All tests completed!"
echo "Check Supabase Dashboard to verify data"
echo "========================================="
```

**Usage:**

```bash
chmod +x test-sessions-endpoint.sh
./test-sessions-endpoint.sh
```

**Requirements:**

- `jq` installed for JSON formatting: `sudo apt-get install jq` (Linux) or `brew install jq` (macOS)
- Development server running on `http://localhost:4321`

## Windows PowerShell Version

Save this as `test-sessions-endpoint.ps1`:

```powershell
$baseUrl = "http://localhost:4321"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Testing POST /api/sessions endpoint" -ForegroundColor Cyan
Write-Host "Development Mode (No Auth Required)" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Test 1: Create session with context" -ForegroundColor Yellow
Invoke-RestMethod -Uri "$baseUrl/api/sessions" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"context": "Test context"}' | ConvertTo-Json
Write-Host ""

Write-Host "Test 2: Create session with null context" -ForegroundColor Yellow
Invoke-RestMethod -Uri "$baseUrl/api/sessions" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"context": null}' | ConvertTo-Json
Write-Host ""

Write-Host "Test 3: Create session without context" -ForegroundColor Yellow
Invoke-RestMethod -Uri "$baseUrl/api/sessions" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{}' | ConvertTo-Json
Write-Host ""

Write-Host "Test 4: Invalid payload" -ForegroundColor Yellow
try {
  Invoke-RestMethod -Uri "$baseUrl/api/sessions" `
    -Method Post `
    -ContentType "application/json" `
    -Body '{"context": 123}'
} catch {
  $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json
}
Write-Host ""

Write-Host "=========================================" -ForegroundColor Green
Write-Host "All tests completed!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
```

**Usage:**

```powershell
.\test-sessions-endpoint.ps1
```

## Notes

- **No authentication headers required** - this is intentional for development
- All sessions will have the same `user_id` (DEFAULT_USER_ID)
- When real authentication is implemented, this will change
- Check server console logs for any errors or warnings during testing
- Use Supabase Dashboard to verify database records after each test
