# Development Environment Setup

## Prerequisites

1. ✅ Supabase project created
2. ✅ `.env` file with `SUPABASE_URL` and `SUPABASE_KEY`
3. ✅ Node.js installed
4. ✅ Dependencies installed (`npm install`)

## Step 1: Create Development User in Supabase

### Option A: Using Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard
2. Navigate to: **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `supabase/migrations/dev_user_setup.sql`
5. Click **Run** to execute the query
6. Verify the output shows the created user:
   ```
   id: 00000000-0000-0000-0000-000000000001
   email: dev@example.com
   role: authenticated
   ```

### Option B: Using Supabase CLI (Alternative)

If you have Supabase CLI installed:

```bash
# Connect to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run the SQL file
supabase db execute --file supabase/migrations/dev_user_setup.sql
```

### Verification

After running the SQL, verify in Supabase Dashboard:

1. Go to: **Authentication → Users**
2. You should see: `dev@example.com` with ID `00000000-0000-0000-0000-000000000001`

## Step 2: Create Database Schema (if not already done)

Run the main migration to create `sessions` and `cards` tables:

1. Go to: **SQL Editor** in Supabase Dashboard
2. Copy contents from `.ai/db-plan.md` section "7. Pełna migracja SQL"
3. Execute the migration
4. Verify tables exist: **Table Editor → sessions** and **Table Editor → cards**

## Step 3: Verify Environment Variables

Check your `.env` file contains:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
OPENROUTER_API_KEY=your-openrouter-key (for later AI features)
```

## Step 4: Start Development Server

```bash
npm run dev
```

Expected output:

```
  🚀  astro  v5.x.x started in XXms

  ┃ Local    http://localhost:4321/
  ┃ Network  use --host to expose
```

## Step 5: Test the Endpoint

Open a new terminal and run:

```bash
# Test 1: Create session with context
curl -X POST http://localhost:4321/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"context": "Test session for development"}'
```

Expected response (201):

```json
{
  "data": {
    "id": "uuid-here",
    "user_id": "00000000-0000-0000-0000-000000000001",
    "is_active": true,
    "context": "Test session for development",
    "created_at": "2024-01-26T...",
    "updated_at": "2024-01-26T..."
  }
}
```

## Step 6: Verify in Database

1. Go to Supabase Dashboard: **Table Editor → sessions**
2. You should see the newly created session with:
   - ✅ `user_id` = `00000000-0000-0000-0000-000000000001`
   - ✅ `is_active` = `true`
   - ✅ `context` matches your request
   - ✅ Timestamps are set

## Troubleshooting

### Error: "relation 'sessions' does not exist"

**Solution:** Run the database migration (Step 2)

### Error: "insert or update on table 'sessions' violates foreign key constraint"

**Solution:** Create the development user (Step 1)

### Error: "Failed to create session"

**Possible causes:**

1. Database tables not created
2. Development user not created
3. RLS policies blocking insert
4. Invalid Supabase credentials in `.env`

**Debug steps:**

1. Check server console logs for detailed error
2. Verify `.env` file has correct credentials
3. Check Supabase Dashboard logs: **Logs → Postgres Logs**
4. Temporarily disable RLS to test:
   ```sql
   ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
   ```
   (Remember to re-enable after testing!)

### Port 4321 already in use

**Solution:**

```bash
# Kill existing process
npx kill-port 4321

# Or use a different port
npm run dev -- --port 3000
```

## Quick Setup Script (Optional)

For future setups, you can save this as `setup-dev.sh`:

```bash
#!/bin/bash

echo "🚀 Setting up development environment..."
echo ""

# Check .env exists
if [ ! -f .env ]; then
  echo "❌ .env file not found!"
  echo "Create .env with SUPABASE_URL and SUPABASE_KEY"
  exit 1
fi

echo "✅ .env file found"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build project to verify no TypeScript errors
echo "🔨 Building project..."
npm run build

if [ $? -eq 0 ]; then
  echo "✅ Build successful!"
  echo ""
  echo "Next steps:"
  echo "1. Run dev user SQL in Supabase Dashboard"
  echo "2. Run database migration (if needed)"
  echo "3. Start dev server: npm run dev"
  echo "4. Test endpoint with curl (see .ai/sessions-endpoint-tests.md)"
else
  echo "❌ Build failed! Check errors above."
  exit 1
fi
```

## Next Steps

Once setup is complete, proceed to:

- 📖 [Manual Testing Guide](.ai/sessions-endpoint-tests.md)
- 📋 [Code Review Checklist](.ai/sessions-endpoint-code-review.md)
- 📝 [Implementation Plan](.ai/sessions-endpoint-implementation-plan.md)

## Notes

- **Development Only:** The DEFAULT_USER_ID approach is for development purposes only
- **TODO:** Replace with proper authentication system before production
- **Security:** Never commit real Supabase keys to version control
- **RLS:** Row Level Security policies are in place but allow operations for the dev user
