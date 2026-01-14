# Architectural Plan: Task CRUD Operations

## Technology Decisions

### Backend
- **Framework:** FastAPI
- **ORM:** SQLModel
- **Database:** Neon Serverless PostgreSQL

### Database Schema
The `tasks` table schema will be based on `specs/database/schema.md`:
```sql
### tasks
- id: integer (primary key)
- user_id: string (foreign key -> users.id)
- title: string (not null)
- description: text (nullable)
- completed: boolean (default false)
- created_at: timestamp
- updated_at: timestamp
```
The `users` table schema (managed by Better Auth) is also a dependency:
```sql
### users (managed by Better Auth)
- id: string (primary key)
- email: string (unique)
- name: string
- created_at: timestamp
```

## API Endpoints
The backend will implement the following RESTful API endpoints for task management as defined in `specs/api/rest-endpoints.md`:

### GET /api/{user_id}/tasks
List all tasks for a specific user.

### POST /api/{user_id}/tasks
Create a new task for a specific user.

### GET /api/{user_id}/tasks/{id}
Get details for a specific task belonging to a user.

### PUT /api/{user_id}/tasks/{id}
Update a specific task belonging to a user.

### DELETE /api/{user_id}/tasks/{id}
Delete a specific task belonging to a user.

### PATCH /api/{user_id}/tasks/{id}/complete
Toggle the completion status of a specific task belonging to a user.

## Security Considerations
- Task ownership enforced: All task-related operations will strictly require a valid JWT token, and the `user_id` extracted from this token will be used to ensure users can only access/modify their own tasks.
- Input validation: All incoming data for task creation/update will be validated using Pydantic models.

## Non-Functional Requirements
- CRUD operations response time: p95 latency for all task CRUD operations should be less than 100ms.
- Concurrency: The API should support at least 100 concurrent users without significant performance degradation.

## Architectural Decisions

### Decision 1: Task ID Generation
**Options:**
1.  Auto-increment integer (database default)
2.  UUID (backend generated)

**Choice:** Auto-increment integer (database default)
**Rationale:** This approach is simpler to implement and manage for the initial phase, leveraging the database's native capabilities for unique ID generation. It offers good performance characteristics for a single-node database.
**Tradeoffs:** Integer IDs are less globally unique than UUIDs, which could be a consideration in highly distributed systems or if merging data from multiple sources becomes a requirement in later phases. For the current scope, this is not a concern.

### Decision 2: Soft vs Hard Delete
**Options:**
1.  Hard delete (remove task record from DB)
2.  Soft delete (mark task as `deleted=True` in DB)

**Choice:** Hard delete
**Rationale:** For the basic CRUD functionality required in this phase, a hard delete offers the simplest implementation. It avoids the added complexity of filtering "deleted" items from all queries and managing restoration logic.
**Tradeoffs:** Deleted data cannot be recovered, and a historical audit trail of deleted tasks is not maintained. These are not explicit requirements for Phase II but could be reconsidered in future phases.

## Frontend Integration
- **API Calls:** The frontend will make API calls to the defined task endpoints, including the `Authorization: Bearer <token>` header with the authenticated user's JWT.
- **User Context:** The frontend will be responsible for obtaining the authenticated `user_id` (from the JWT) and including it in the API request paths (e.g., `/api/{user_id}/tasks`).
- **Data Display:** The frontend will display tasks retrieved from the API, supporting filtering by status as defined in the `GET /api/{user_id}/tasks` endpoint.

## Migration Plan
1.  Ensure the `users` table exists and is populated (a prerequisite from the authentication feature).
2.  Implement the `tasks` SQLModel.
3.  Execute database migrations to create the `tasks` table with a foreign key constraint linking `user_id` to `users.id`.
4.  Add appropriate database indexes to `tasks.user_id` and `tasks.completed` columns for efficient querying.