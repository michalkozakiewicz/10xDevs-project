# API Documentation & Planning

This directory contains all documentation, planning, and implementation guides for the BucketEstimate AI API.

## Quick Links

### 📋 Project Planning

- **[PRD.md](prd.md)** - Product Requirements Document
- **[Tech Stack](tech-stack.md)** - Technology choices and rationale
- **[Database Schema](db-plan.md)** - Complete database design with migrations
- **[API Plan](api-plan.md)** - Full REST API specification

### 🚀 Implementation Guides

#### POST /api/sessions (✅ Implemented)

- **[Summary](sessions-endpoint-summary.md)** - ⭐ **START HERE** - Complete overview
- **[Setup Guide](setup-dev-environment.md)** - Environment setup instructions
- **[Implementation Plan](sessions-endpoint-implementation-plan.md)** - Detailed implementation steps
- **[Testing Guide](sessions-endpoint-tests.md)** - Manual testing procedures
- **[Code Review](sessions-endpoint-code-review.md)** - Quality checklist

### 🔬 Testing

**Test Scripts (Root Directory):**

- `test-sessions-endpoint.sh` - Bash script (Linux/macOS)
- `test-sessions-endpoint.ps1` - PowerShell script (Windows)

### 📝 Database

- **[Database Plan](db-plan.md)** - Full schema with RLS policies
- **[Database Notes](db-plan-notes.md)** - Design decisions and notes
- `../supabase/migrations/dev_user_setup.sql` - Development user setup

## Current Status

### Implemented Endpoints

| Endpoint        | Method | Status   | Auth        | Documentation                           |
| --------------- | ------ | -------- | ----------- | --------------------------------------- |
| `/api/sessions` | POST   | ✅ Ready | ⚠️ Disabled | [Summary](sessions-endpoint-summary.md) |

### Pending Endpoints

See: [api-plan.md](api-plan.md) for full list

## Getting Started

### 1. First Time Setup

```bash
# Read the setup guide
cat .ai/setup-dev-environment.md

# Key steps:
# 1. Create dev user in Supabase (run SQL from supabase/migrations/dev_user_setup.sql)
# 2. Run database migrations (from db-plan.md)
# 3. Verify .env file has SUPABASE_URL and SUPABASE_KEY
# 4. Start dev server: npm run dev
```

### 2. Testing POST /api/sessions

```bash
# Windows
.\test-sessions-endpoint.ps1

# Linux/macOS
chmod +x test-sessions-endpoint.sh
./test-sessions-endpoint.sh
```

### 3. Manual Testing

```bash
curl -X POST http://localhost:4321/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"context": "Test session"}'
```

## Documentation Structure

```
.ai/
├── README.md                                    # This file
├── prd.md                                       # Product requirements
├── tech-stack.md                                # Tech stack decisions
├── db-plan.md                                   # Database schema & migrations
├── db-plan-notes.md                             # Database design notes
├── api-plan.md                                  # Complete API specification
│
├── sessions-endpoint-summary.md                 # ⭐ POST /api/sessions overview
├── sessions-endpoint-implementation-plan.md     # Implementation guide
├── setup-dev-environment.md                     # Setup instructions
├── sessions-endpoint-tests.md                   # Testing procedures
└── sessions-endpoint-code-review.md             # Code quality checklist
```

## Development Workflow

### For Implementing New Endpoints

1. **Plan:** Review specification in `api-plan.md`
2. **Design:** Create implementation plan (similar to `sessions-endpoint-implementation-plan.md`)
3. **Implement:** Follow CLAUDE.md guidelines
4. **Test:** Create test scripts and manual test guide
5. **Review:** Use code review checklist
6. **Document:** Create summary document

### For Testing Endpoints

1. **Setup:** Follow `setup-dev-environment.md`
2. **Run Tests:** Use provided test scripts
3. **Verify:** Check Supabase Dashboard
4. **Debug:** Check server logs and database logs

## Important Notes

### Authentication

⚠️ **Currently Disabled for Development**

All endpoints use `DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001'`

**TODO:** Implement comprehensive authentication system

### Environment

Development server runs on: `http://localhost:4321`

Required environment variables:

```env
SUPABASE_URL=your-project-url
SUPABASE_KEY=your-anon-key
```

### Code Guidelines

All code follows: `../CLAUDE.md`

Key points:

- Use Zod for validation
- Use `locals.supabase` (not direct import)
- Use `SupabaseClient` type from `@/db/supabase.client.ts`
- Extract logic to services
- Early returns for error conditions
- JSDoc comments for all functions

## Contributing

When implementing new features:

1. ✅ Follow CLAUDE.md guidelines
2. ✅ Create implementation plan
3. ✅ Add Zod validation schema
4. ✅ Extract business logic to services
5. ✅ Add comprehensive error handling
6. ✅ Create test scripts
7. ✅ Update documentation
8. ✅ Run code review checklist

## Support

For issues:

1. Check relevant documentation in `.ai/` folder
2. Review implementation files and comments
3. Check Supabase Dashboard logs
4. Review CLAUDE.md for coding guidelines

## Next Steps

### Immediate (Development)

- [ ] Run setup from `setup-dev-environment.md`
- [ ] Execute tests from `sessions-endpoint-tests.md`
- [ ] Verify endpoint works correctly
- [ ] Implement next endpoint from `api-plan.md`

### Short Term

- [ ] Implement GET /api/sessions
- [ ] Implement GET /api/sessions/:id
- [ ] Implement remaining session endpoints
- [ ] Add comprehensive test suite

### Long Term

- [ ] Design and implement authentication
- [ ] Implement all endpoints from API plan
- [ ] Add rate limiting
- [ ] Add monitoring and logging
- [ ] Prepare for production deployment

## Version History

### v0.1.0 - 2024-01-26

**Implemented:**

- POST /api/sessions endpoint
- Development environment setup
- Test scripts and documentation

**Status:** Ready for development testing
