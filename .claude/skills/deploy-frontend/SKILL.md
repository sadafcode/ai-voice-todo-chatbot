---
name: deploy-frontend
description: Deploy Next.js frontend applications to Vercel with environment configuration, TypeScript error resolution, and production optimization. Use when deploying frontends, fixing TypeScript build errors, configuring Vercel projects, setting up environment variables, or troubleshooting Next.js production builds.
---

# Frontend Deployment to Vercel

Deploy Next.js applications to Vercel with proper configuration, environment variables, and TypeScript error resolution.

## Quick Start

**Basic deployment workflow:**
1. Fix all TypeScript errors locally
2. Verify `package.json` in correct location
3. Set Vercel root directory to `frontend`
4. Add `NEXT_PUBLIC_API_URL` environment variable
5. Deploy and monitor build

## Pre-Deployment: Fix TypeScript Errors

**Test build locally:**
```bash
cd frontend
npm run build
```

**Common TypeScript fixes:**

1. **Implicit 'any' types:**
```typescript
// ✅ Good
async (email: string, password: string) => { }
```

2. **Headers type:**
```typescript
// ✅ Good
const headers: HeadersInit = {
  'Content-Type': 'application/json'
}
```

3. **Interface scope:**
Move interfaces to top-level, not inside functions.

4. **Property mismatches:**
Verify context properties match (`token` vs `authToken`)

## Critical Configuration

### Project Structure

**Required:**
- `frontend/package.json` with "next" dependency
- `frontend/next.config.ts`
- `frontend/tsconfig.json`
- `frontend/src/app/` directory

### Environment Variables

**Local (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Vercel (Dashboard):**
- Key: `NEXT_PUBLIC_API_URL`
- Value: `https://your-backend.railway.app`
- Must use `NEXT_PUBLIC_` prefix for browser access

### Vercel Settings

**Root Directory:** `frontend` (CRITICAL)
**Framework:** Next.js (auto-detected)
**Build Command:** `npm run build` (auto)
**Output Directory:** `.next` (auto)

## Common Errors & Quick Fixes

### "No Next.js version detected"
Root Directory not set to `frontend`. Fix in Project Settings → General.

### TypeScript build fails
Run `npm run build` locally, fix all errors, commit and push.

### Environment variable undefined
Add `NEXT_PUBLIC_API_URL` in Vercel dashboard. Redeploy after adding.

### CORS error when calling API
Update backend `FRONTEND_URL` to your Vercel domain. Redeploy backend.

### API calls go to localhost
`NEXT_PUBLIC_API_URL` not set or missing `NEXT_PUBLIC_` prefix.

## Testing Deployment

**Browser test:**
1. Open `https://your-app.vercel.app/`
2. Sign up with test account
3. Create task
4. Verify backend connection works

**Check console:**
- No CORS errors
- API calls use Railway URL (not localhost)
- All resources load (200 OK)

## Post-Deployment

### Update Backend CORS

**In Railway:**
- Set `FRONTEND_URL` to `https://your-app.vercel.app`
- Backend auto-redeploys

**Verify backend code includes:**
```python
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)
```

### Enable Auto-Deployments

Vercel auto-deploys on push:
- Main branch → Production
- Other branches → Preview deployments
- PRs → Preview with unique URLs

## Deployment Verification

After deployment, verify:
- ✅ Build completes successfully
- ✅ Production URL loads
- ✅ Can sign up and login
- ✅ CRUD operations work
- ✅ No console errors
- ✅ API calls reach backend

## Rollback

If deployment breaks:
1. Vercel → Deployments → Find last working
2. Click ⋮ → Promote to Production
