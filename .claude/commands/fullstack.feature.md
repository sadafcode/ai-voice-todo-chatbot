---
description: Implement a complete full-stack feature (database model + backend API + frontend UI)
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding. Expected format: `<feature_name> <description>`

Example: `task-categories Add categories to tasks for organization`

## Reusable Full-Stack Feature Intelligence

This skill implements a complete feature across the entire stack following the Spec-Driven Development methodology:
1. **Database Model** (SQLModel)
2. **Backend API** (FastAPI endpoints)
3. **Frontend UI** (Next.js components)
4. **Integration** (Connect frontend to backend)

### Execution Flow

This follows the `/sp.specify` → `/sp.plan` → `/sp.tasks` → `/sp.implement` workflow.

### Step 1: Feature Analysis

Parse the feature requirements:
- **Feature name**: e.g., "task-categories"
- **Core entity**: e.g., "Category"
- **Relationships**: How it relates to existing models
- **User stories**: What users need to do
- **API operations**: CRUD operations needed

### Step 2: Run Spec-Driven Workflow

**2A: Create Specification**

Run `/sp.specify <feature-name>` or manually create `specs/<feature-name>/spec.md`:

```markdown
# Feature Specification: <Feature Name>

## Overview
<Brief description>

## User Stories
- As a <user>, I want to <action> so that <benefit>

## Acceptance Criteria
- [ ] <Criterion 1>
- [ ] <Criterion 2>

## Out of Scope
- <What's not included>

## Dependencies
- <Required features or services>
```

**2B: Create Architectural Plan**

Run `/sp.plan <feature-name>` or manually create `specs/<feature-name>/plan.md`:

Include:
- Database schema changes
- API endpoints specification
- Frontend components needed
- Integration points
- Security considerations

**2C: Create Task Breakdown**

Run `/sp.tasks <feature-name>` or manually create `specs/<feature-name>/tasks.md`:

Break down into:
1. Database migration/model
2. Backend endpoints
3. Frontend components
4. Integration
5. Testing

### Step 3: Database Model Implementation

**Read existing models first:**
- `backend/models.py`

**Create new model following patterns:**

```python
from typing import Optional
from datetime import datetime, timezone
from sqlmodel import Field, SQLModel, Relationship

class <Entity>(SQLModel, table=True):
    __tablename__ = "<entities>" # type: ignore

    id: Optional[int] = Field(default=None, primary_key=True)
    <field>: <type> = Field(<constraints>)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relationships
    user_id: str = Field(foreign_key="users.id")
    user: Optional[User] = Relationship(back_populates="<entities>")
```

**Update related models:**
Add relationship back-references to existing models.

### Step 4: Backend API Implementation

Use the `/fullstack.api` skill for each endpoint or manually create following patterns from `backend/routes/tasks.py`.

**Create endpoints:**
- POST `/api/{user_id}/<entities>` - Create
- GET `/api/{user_id}/<entities>` - List
- GET `/api/{user_id}/<entities}/{id}` - Get
- PUT `/api/{user_id}/<entities}/{id}` - Update
- DELETE `/api/{user_id}/<entities}/{id}` - Delete

**Create file**: `backend/routes/<entities>.py`

**Register router** in `backend/main.py`:
```python
from backend.routes.<entities> import router as <entities>_router
app.include_router(<entities>_router)
```

### Step 5: Frontend Implementation

Use the `/fullstack.component` skill for each component or manually create.

**A. Create API Client Functions**

In `frontend/lib/api.ts` (create if doesn't exist):

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function get<Entities>(userId: string, token: string) {
  const response = await fetch(`${API_URL}/api/${userId}/<entities>`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) throw new Error('Failed to fetch')
  return response.json()
}

export async function create<Entity>(userId: string, token: string, data: any) {
  const response = await fetch(`${API_URL}/api/${userId}/<entities>`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) throw new Error('Failed to create')
  return response.json()
}
```

**B. Create Components**

Create these components:
1. `<Entity>Form` - Create/edit form (client component)
2. `<Entity>Item` - Display single item (client component)
3. `<Entity>List` - List all items (client component)

**C. Create/Update Page**

Update or create page at `frontend/app/tasks/page.tsx` or create new route.

### Step 6: Environment Setup

Ensure environment variables are set:

**Backend** (`.env`):
```bash
DATABASE_URL=<connection-string>
BETTER_AUTH_SECRET=<secret-key>
```

**Frontend** (`.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Step 7: Testing

**A. Test Backend**

```bash
# Test create
curl -X POST http://localhost:8000/api/<user_id>/<entities> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"field": "value"}'

# Test list
curl -X GET http://localhost:8000/api/<user_id>/<entities> \
  -H "Authorization: Bearer <token>"
```

**B. Test Frontend**

1. Start backend: `cd backend && uvicorn main:app --reload`
2. Start frontend: `cd frontend && npm run dev`
3. Navigate to feature page
4. Test all CRUD operations

### Step 8: Integration Verification

Verify end-to-end flow:
1. User authentication works
2. Create operation persists to database
3. List displays created items
4. Update modifies existing items
5. Delete removes items
6. Authorization checks prevent unauthorized access

### Step 9: Documentation

Update project documentation:
- Add feature to `specs/overview.md`
- Document API endpoints in `specs/api/rest-endpoints.md`
- Update database schema in `specs/database/schema.md`

### Step 10: Summary

Report completed work:
- Feature name and description
- Database changes made
- Backend endpoints created
- Frontend components created
- Files modified/created
- Test commands provided
- Next steps or improvements

---

**Full-Stack Checklist:**
- [ ] Database model created with relationships
- [ ] All CRUD endpoints implemented
- [ ] Authentication and authorization in place
- [ ] Frontend components created
- [ ] API client functions implemented
- [ ] Components integrated with API
- [ ] Error handling on both ends
- [ ] Loading states in UI
- [ ] Environment variables configured
- [ ] Manual testing completed
- [ ] Documentation updated
