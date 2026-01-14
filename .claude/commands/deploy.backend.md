# Deploy Backend to Railway

You are a specialized backend deployment agent. Your task is to deploy a FastAPI Python backend to Railway.

## Your Mission

Deploy the FastAPI backend located in the `backend/` directory to Railway with proper configuration, environment variables, and database setup.

## Pre-Deployment Checklist

Before starting deployment, verify:

1. **Check Backend Structure:**
   - Read `backend/requirements.txt` - verify all dependencies are listed
   - Read `backend/main.py` - verify CORS, startup configuration
   - Read `backend/Procfile` - verify start command
   - Read `backend/runtime.txt` - verify Python version
   - Verify all route files in `backend/routes/` import correctly

2. **Test Imports Locally:**
   ```bash
   cd backend
   python -c "
   import fastapi, sqlmodel, uvicorn, jwt, bcrypt, psycopg2
   from pydantic import EmailStr
   print('All imports OK')
   "
   ```

3. **Verify Required Files Exist:**
   - `backend/Procfile` - Railway start command
   - `backend/requirements.txt` - Python dependencies
   - `backend/runtime.txt` - Python version specification
   - `backend/.railwayignore` - Files to exclude from deployment

## Deployment Steps

### Step 1: Verify Dependencies

**Critical Dependencies for FastAPI + PostgreSQL + JWT Auth:**
```
fastapi
sqlmodel
uvicorn[standard]
python-dotenv
pyjwt                # For JWT token handling (import jwt)
bcrypt               # For password hashing (import bcrypt)
psycopg2-binary      # PostgreSQL adapter
email-validator      # For Pydantic EmailStr validation
pydantic[email]      # Explicit email validation support
pytest               # Testing framework
httpx                # HTTP client for tests
```

**Common Issues:**
- ❌ `python-jose` → ✅ `pyjwt` (code uses `import jwt`)
- ❌ `passlib[bcrypt]` → ✅ `bcrypt` (code uses `import bcrypt`)
- Missing `email-validator` → Pydantic EmailStr fails

### Step 2: Verify Procfile

**Required content:**
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

**Notes:**
- `$PORT` is provided by Railway automatically
- Uses `main:app` format (file:app_instance)

### Step 3: Configure Railway

**Required Environment Variables:**

1. **DATABASE_URL** - PostgreSQL connection string
   - Option A (Railway PostgreSQL): `${{Postgres.DATABASE_URL}}` (no quotes!)
   - Option B (External DB): Full connection string
   - Format: `postgresql://user:password@host:port/database`

2. **BETTER_AUTH_SECRET** - JWT signing secret
   - Generate: `openssl rand -hex 32`
   - No quotes needed in Railway

3. **FRONTEND_URL** - Your Vercel frontend URL
   - Format: `https://your-app.vercel.app`
   - Used for CORS configuration

**Railway Settings:**
- **Root Directory:** `backend` (CRITICAL - must point to backend folder!)
- **Start Command:** Uses Procfile automatically
- **Port:** Railway auto-sets $PORT variable

### Step 4: Database Setup

**Option A: Use Railway PostgreSQL (Recommended)**
1. In Railway project, click **+ New** → **Database** → **PostgreSQL**
2. Railway auto-creates and links the database
3. Use `${{Postgres.DATABASE_URL}}` as DATABASE_URL value (no quotes!)

**Option B: Use External Database (Neon, etc.)**
1. Get connection string from your database provider
2. Paste full connection string into DATABASE_URL
3. Ensure it includes `?sslmode=require` for SSL connections

**Tables are created automatically** on first startup via SQLModel.

### Step 5: Deploy

1. **Connect to GitHub:**
   - Railway → New Project → Deploy from GitHub
   - Select your repository
   - Railway will auto-deploy on every push

2. **Monitor Deployment:**
   - Go to Deployments tab
   - Watch build logs for errors
   - Look for: "Application startup complete"
   - Verify tables are created (SQLAlchemy logs)

3. **Generate Domain:**
   - Settings → Networking → Generate Domain
   - If asked for port, enter `8000` (reference only)
   - Copy your Railway URL: `https://your-app.up.railway.app`

### Step 6: Test Deployment

**Test health endpoint:**
```bash
curl https://your-app.up.railway.app/
```

**Expected response:**
```json
{"message": "Welcome to the FastAPI Backend!"}
```

**Test authentication endpoint:**
```bash
curl -X POST https://your-app.up.railway.app/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123","name":"Test User"}'
```

Should return token and user data.

## Common Errors & Solutions

### Error: "DATABASE_URL environment variable is not set"
**Cause:** Variable not set or incorrectly formatted
**Solutions:**
1. Check variable name is exactly `DATABASE_URL`
2. Remove quotes around `${{Postgres.DATABASE_URL}}`
3. Verify PostgreSQL service is linked to backend service

### Error: "No module named 'jwt'"
**Cause:** Using wrong JWT package
**Solution:** Change `python-jose` to `pyjwt` in requirements.txt

### Error: "email-validator is not installed"
**Cause:** Missing Pydantic email dependency
**Solution:** Add `email-validator` and `pydantic[email]` to requirements.txt

### Error: "could not translate host name"
**Cause:** DATABASE_URL hostname corrupted (missing hyphens/dots)
**Solution:**
1. Delete DATABASE_URL variable
2. Re-add it carefully (no extra spaces)
3. Or use Railway's PostgreSQL instead

### Error: "Connection refused" or 502 Bad Gateway
**Cause:** Root directory not set to `backend/`
**Solution:** Settings → Root Directory → Set to `backend`

## Verification Checklist

After deployment, verify:

- ✅ Deployment status shows "Success" in Railway
- ✅ Health endpoint returns welcome message
- ✅ Database tables created (check logs for CREATE TABLE statements)
- ✅ Can create user via `/auth/signup`
- ✅ Can login via `/auth/login`
- ✅ CORS allows requests from frontend domain

## Post-Deployment

1. **Copy Railway URL** and save it
2. **Update Frontend** with backend URL:
   - In Vercel, set `NEXT_PUBLIC_API_URL` to Railway URL
   - Redeploy frontend if needed
3. **Update Railway** with frontend URL:
   - Set `FRONTEND_URL` to Vercel URL
   - Railway will auto-redeploy

## Rollback Procedure

If deployment fails:
1. Railway → Deployments → Find last working deployment
2. Click **⋮** → **Redeploy**
3. Or fix the issue and push new commit to trigger deployment

## Success Criteria

Deployment is successful when:
- ✅ Railway shows "Active" deployment
- ✅ Health check returns 200 OK
- ✅ Database connection works
- ✅ Auth endpoints functional
- ✅ Frontend can connect and authenticate

---

**Execute this deployment systematically and verify each step before proceeding to the next.**
