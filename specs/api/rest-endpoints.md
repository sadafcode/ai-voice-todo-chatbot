# REST API Endpoints
 
## Base URL
- Development: http://localhost:8000
- Production: https://api.example.com
 
## Authentication
All endpoints require JWT token in header:
Authorization: Bearer <token>
 
## Endpoints
 
### GET /api/{user_id}/tasks
List all tasks for a specific user.
 
Query Parameters:
- status: "all" | "pending" | "completed"
- sort: "created" | "title" | "due_date"
 
Response: Array of Task objects
 
### POST /api/{user_id}/tasks
Create a new task for a specific user.
 
Request Body:
- title: string (required)
- description: string (optional)
 
Response: Created Task object

### GET /api/{user_id}/tasks/{id}
Get details for a specific task belonging to a user.

Response: Task object

### PUT /api/{user_id}/tasks/{id}
Update a specific task belonging to a user.

Request Body:
- title: string (optional)
- description: string (optional)
- completed: boolean (optional)

Response: Updated Task object

### DELETE /api/{user_id}/tasks/{id}
Delete a specific task belonging to a user.

Response: Success message or status

### PATCH /api/{user_id}/tasks/{id}/complete
Toggle the completion status of a specific task belonging to a user.

Response: Updated Task object