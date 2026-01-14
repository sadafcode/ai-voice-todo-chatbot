---
name: deploy-backend
description: Deploy Python FastAPI backend applications to Railway with PostgreSQL database, environment configuration, and production optimization. Use when deploying backend services, troubleshooting Railway deployments, fixing dependency issues, configuring databases, or setting up production environments for FastAPI/Python applications.
---

# Backend Deployment to Railway

Deploy FastAPI Python applications to Railway with proper configuration, database setup, and error resolution.

## Quick Start

**Basic deployment workflow:**
1. Verify dependencies in `requirements.txt`
2. Configure `Procfile` with start command
3. Set Railway root directory to `backend`
4. Add environment variables (DATABASE_URL, secrets)
5. Deploy and monitor logs

## Critical Configuration

### Requirements.txt Dependencies

**Common FastAPI + Auth + PostgreSQL stack:**
```
fastapi
sqlmodel
uvicorn[standard]
python-dotenv
pyjwt                # For 'import jwt'
bcrypt               # For 'import bcrypt'
psycopg2-binary      # PostgreSQL
email-validator      # For Pydantic EmailStr
pydantic[email]
```

**Common errors:**
- `python-jose` → Wrong, use `pyjwt`
- `passlib[bcrypt]` → Wrong, use `bcrypt`
- Missing `email-validator` → Pydantic EmailStr fails

### Procfile

```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

Railway provides `$PORT` automatically.

### Railway Settings

**Root Directory:** `backend` (CRITICAL - must point to backend folder)

**Environment Variables:**
- `DATABASE_URL`: PostgreSQL connection (use `${{Postgres.DATABASE_URL}}` without quotes)
- Auth secrets: No quotes needed in Railway
- `FRONTEND_URL`: For CORS configuration

## Common Errors & Quick Fixes

### "DATABASE_URL not set"
- Check variable name is exactly `DATABASE_URL`
- Remove quotes around `${{Postgres.DATABASE_URL}}`
- Verify PostgreSQL service linked

### "No module named 'jwt'"
Change `python-jose` to `pyjwt` in requirements.txt

### "email-validator not installed"
Add both `email-validator` and `pydantic[email]`

### "could not translate host name"
DATABASE_URL corrupted (missing hyphens/dots). Delete and re-add carefully, or use Railway PostgreSQL.

### 502 Bad Gateway
Root directory not set to `backend/`. Fix in Settings.

## Database Setup

**Option A: Railway PostgreSQL (Recommended)**
1. Add PostgreSQL service to project
2. Link to backend service
3. Use `${{Postgres.DATABASE_URL}}` (no quotes!)

**Option B: External Database**
Paste full connection string including `?sslmode=require`

Tables auto-create on startup via SQLModel.

## Testing Deployment

```bash
# Health check
curl https://your-app.up.railway.app/

# Expected: {"message": "Welcome to the FastAPI Backend!"}

# Test auth
curl -X POST https://your-app.up.railway.app/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test1234","name":"Test"}'
```

## Deployment Verification

After deployment, check logs for:
- ✅ "Application startup complete"
- ✅ CREATE TABLE statements (database initialization)
- ✅ Health endpoint responds
- ✅ No import errors
- ✅ Database connection successful

## Rollback

If deployment fails:
1. Railway → Deployments → Find last working
2. Click ⋮ → Redeploy
