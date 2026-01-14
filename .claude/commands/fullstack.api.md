---
description: Create a new authenticated API endpoint with FastAPI following project patterns
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding. Expected format: `<endpoint_name> <method> <description>`

Example: `get-user-profile GET Retrieve authenticated user profile`

## Reusable API Endpoint Intelligence

This skill creates a new FastAPI endpoint following the project's established patterns for:
- Authentication with JWT (Better Auth)
- User-scoped data access
- Pydantic validation models
- Proper error handling
- Database session management

### Step 1: Parse Requirements

From user input, extract:
- **Endpoint name**: e.g., "get-user-profile"
- **HTTP method**: GET, POST, PUT, PATCH, DELETE
- **Description**: What the endpoint does
- **Resource type**: Determine from context (User, Task, etc.)

### Step 2: Determine Endpoint Pattern

Based on method and resource:

**Pattern A: GET (read operations)**
- No request body
- Returns response model
- Requires user authentication
- Filters by user_id from token

**Pattern B: POST (create operations)**
- Requires Create request model
- Returns response model with 201 status
- Validates ownership
- Creates resource in database

**Pattern C: PUT/PATCH (update operations)**
- Requires Update request model (optional fields)
- Returns updated response model
- Validates resource exists and belongs to user
- Updates updated_at timestamp

**Pattern D: DELETE (delete operations)**
- No request body
- Returns 204 No Content
- Validates resource exists and belongs to user
- Performs hard delete

### Step 3: Read Existing Patterns

**REQUIRED**: Read the following files to understand patterns:
- `backend/routes/auth.py` - For auth patterns
- `backend/routes/tasks.py` - For CRUD patterns
- `backend/models.py` - For available models
- `backend/auth.py` - For authentication decorator

### Step 4: Generate Endpoint Code

Create code following this structure:

```python
from fastapi import APIRouter, HTTPException, Depends, Path
from sqlmodel import Session, select
from typing import Optional
from pydantic import BaseModel, field_validator
from datetime import datetime, timezone

from backend.db import get_session
from backend.models import <Model>
from backend.auth import get_current_user

# Request/Response Models
class <Resource>Create(BaseModel):
    # ... fields with validation

    @field_validator('<field>')
    @classmethod
    def validate_<field>(cls, v):
        # ... validation logic
        return v

class <Resource>Read(BaseModel):
    # ... fields (no sensitive data)
    pass

# Endpoint
@router.<method>("/api/{user_id}/<resource>", response_model=<Resource>Read)
def <endpoint_name>(
    user_id: str = Path(..., description="The ID of the user"),
    session: Session = Depends(get_session),
    current_user_id: str = Depends(get_current_user)
):
    # Authorization check
    if user_id != current_user_id:
        raise HTTPException(
            status_code=403,
            detail="Cannot access <resource> for another user"
        )

    # Business logic
    # ...

    return result
```

### Step 5: Add to Router

Determine which router file to add to:
- Auth operations → `backend/routes/auth.py`
- Task operations → `backend/routes/tasks.py`
- New resource → Create `backend/routes/<resource>s.py`

### Step 6: Register Router (if new file)

If creating a new router file, add to `backend/main.py`:

```python
from backend.routes.<resource>s import router as <resource>s_router
app.include_router(<resource>s_router)
```

### Step 7: Generate Tests

Create manual test commands using curl:

```bash
# Test the new endpoint
curl -X <METHOD> http://127.0.0.1:8000/api/<user_id>/<resource> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

### Step 8: Summary

Report what was created:
- Endpoint path and method
- Request/Response models
- Validation rules applied
- File location
- Test commands

---

**Pattern Checklist:**
- [ ] Uses `get_current_user` for authentication
- [ ] Validates `user_id` matches authenticated user
- [ ] Includes `@field_validator` for input validation
- [ ] Returns appropriate status codes (200, 201, 204, 403, 404)
- [ ] Handles database session correctly
- [ ] No sensitive data in responses
- [ ] Follows RESTful conventions
- [ ] Error messages are clear and actionable
