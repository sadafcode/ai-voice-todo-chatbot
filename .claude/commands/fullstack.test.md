---
description: Generate comprehensive tests for backend and frontend code
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding. Expected format: `<test_type> <target> <description>`

Example: `backend auth Test authentication endpoints`
Example: `frontend TaskCard Test task card component rendering`

## Reusable Testing Intelligence

This skill generates tests following testing best practices for:
- **Backend**: pytest with FastAPI TestClient
- **Frontend**: Jest + React Testing Library
- **Integration**: End-to-end API tests
- **Coverage**: Ensure >80% code coverage

### Step 1: Determine Test Type

From user input, identify:
- **Backend API test**: Testing FastAPI endpoints
- **Backend unit test**: Testing utility functions, models
- **Frontend component test**: Testing React components
- **Frontend integration test**: Testing user flows
- **E2E test**: Full stack workflow testing

### Step 2: Read Target Code

**For Backend:**
- Read the route file or module to test
- Understand dependencies and database models
- Check authentication requirements

**For Frontend:**
- Read the component file
- Understand props and state
- Identify user interactions

### Step 3: Generate Backend Tests

**Setup test environment** (`backend/conftest.py`):

```python
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, SQLModel
from sqlmodel.pool import StaticPool

from backend.main import app
from backend.db import get_session

# Test database setup
@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()
```

**Test file** (`backend/tests/test_<module>.py`):

```python
from fastapi.testclient import TestClient
from sqlmodel import Session
import pytest

def test_<endpoint_name>_success(client: TestClient, session: Session):
    """Test successful <operation>"""
    # Arrange: Setup test data
    # ... create test user, get auth token

    # Act: Make API request
    response = client.post(
        "/api/user_123/endpoint",
        json={"field": "value"},
        headers={"Authorization": f"Bearer {token}"}
    )

    # Assert: Verify response
    assert response.status_code == 200
    data = response.json()
    assert data["field"] == "value"

def test_<endpoint_name>_unauthorized(client: TestClient):
    """Test unauthorized access"""
    response = client.post(
        "/api/user_123/endpoint",
        json={"field": "value"}
    )
    assert response.status_code == 401

def test_<endpoint_name>_wrong_user(client: TestClient, session: Session):
    """Test accessing another user's resources"""
    # ... create user_1, get token for user_1

    response = client.post(
        "/api/user_2/endpoint",  # Different user
        json={"field": "value"},
        headers={"Authorization": f"Bearer {user_1_token}"}
    )
    assert response.status_code == 403

def test_<endpoint_name>_validation_error(client: TestClient, session: Session):
    """Test invalid input validation"""
    # ... get auth token

    response = client.post(
        "/api/user_123/endpoint",
        json={"field": ""},  # Invalid empty value
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 422  # Validation error
```

**Test patterns to cover:**
1. ✅ Success case
2. ❌ Unauthorized (no token)
3. ❌ Forbidden (wrong user)
4. ❌ Not found (resource doesn't exist)
5. ❌ Validation errors (invalid input)
6. ❌ Database errors (constraint violations)

### Step 4: Generate Frontend Tests

**Test file** (`frontend/__tests__/<Component>.test.tsx`):

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import <ComponentName> from '@/components/<ComponentName>'

// Mock fetch
global.fetch = jest.fn()

describe('<ComponentName>', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()
  })

  it('renders component with props', () => {
    // Arrange
    const props = { ... }

    // Act
    render(<<ComponentName> {...props} />)

    // Assert
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })

  it('handles user interaction', async () => {
    // Arrange
    render(<<ComponentName> />)
    const button = screen.getByRole('button', { name: 'Click Me' })

    // Act
    fireEvent.click(button)

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Result')).toBeInTheDocument()
    })
  })

  it('fetches data on mount', async () => {
    // Arrange
    const mockData = { ... }
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    })

    // Act
    render(<<ComponentName> />)

    // Assert
    await waitFor(() => {
      expect(screen.getByText(mockData.field)).toBeInTheDocument()
    })
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': expect.stringContaining('Bearer'),
        }),
      })
    )
  })

  it('displays loading state', () => {
    // Arrange & Act
    render(<<ComponentName> />)

    // Assert
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('displays error state', async () => {
    // Arrange
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('API Error')
    )

    // Act
    render(<<ComponentName> />)

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })

  it('handles form submission', async () => {
    // Arrange
    const handleSubmit = jest.fn()
    render(<<ComponentName> onSubmit={handleSubmit} />)

    // Act
    const input = screen.getByLabelText('Field Name')
    fireEvent.change(input, { target: { value: 'test value' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

    // Assert
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ field: 'test value' })
      )
    })
  })
})
```

**Frontend test patterns:**
1. ✅ Component renders correctly
2. ✅ Props are displayed
3. ✅ User interactions work
4. ✅ API calls are made correctly
5. ✅ Loading states display
6. ✅ Error states display
7. ✅ Form validation works

### Step 5: Generate Integration Tests

**Test full workflows:**

```python
def test_full_task_workflow(client: TestClient, session: Session):
    """Test complete task creation and management flow"""
    # 1. Register user
    signup_response = client.post("/auth/signup", json={
        "email": "test@example.com",
        "password": "password123",
        "name": "Test User"
    })
    assert signup_response.status_code == 200
    token = signup_response.json()["token"]
    user_id = signup_response.json()["user"]["id"]

    # 2. Create task
    create_response = client.post(
        f"/api/{user_id}/tasks",
        json={"title": "Test Task", "description": "Test"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert create_response.status_code == 201
    task_id = create_response.json()["id"]

    # 3. List tasks
    list_response = client.get(
        f"/api/{user_id}/tasks",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1

    # 4. Update task
    update_response = client.put(
        f"/api/{user_id}/tasks/{task_id}",
        json={"completed": True},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert update_response.status_code == 200
    assert update_response.json()["completed"] is True

    # 5. Delete task
    delete_response = client.delete(
        f"/api/{user_id}/tasks/{task_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert delete_response.status_code == 204
```

### Step 6: Run Tests

**Backend:**
```bash
cd backend
pytest -v
pytest --cov=. --cov-report=html  # With coverage
```

**Frontend:**
```bash
cd frontend
npm test
npm test -- --coverage  # With coverage
```

### Step 7: Summary

Report test coverage:
- Test file location
- Number of test cases
- Coverage percentage
- Patterns tested (auth, validation, errors, etc.)
- Commands to run tests

---

**Testing Checklist:**
- [ ] Happy path tested
- [ ] Error cases covered
- [ ] Authentication tested
- [ ] Authorization tested
- [ ] Validation tested
- [ ] Edge cases covered
- [ ] Mocks used appropriately
- [ ] Tests are independent
- [ ] Tests are repeatable
- [ ] >80% code coverage
