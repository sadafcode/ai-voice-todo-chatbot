---
description: Create a new Next.js component with TypeScript following project patterns
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding. Expected format: `<component_name> <type> <description>`

Example: `TaskCard client Component to display a single task item`

## Reusable Component Intelligence

This skill creates a new Next.js 14 component following the project's established patterns for:
- TypeScript with strict typing
- Client/Server component patterns
- API integration with authentication
- Tailwind CSS styling
- Proper error handling and loading states

### Step 1: Parse Requirements

From user input, extract:
- **Component name**: e.g., "TaskCard", "LoginForm"
- **Component type**: "client", "server", or "page"
- **Description**: What the component does
- **Parent context**: Determine where it belongs (app/, components/, lib/)

### Step 2: Determine Component Pattern

**Pattern A: Client Component** (`'use client'`)
- Interactive UI with state
- Event handlers (onClick, onChange, etc.)
- Uses React hooks (useState, useEffect, etc.)
- API calls from client side

**Pattern B: Server Component** (default)
- Static rendering
- No interactivity
- Server-side data fetching
- SEO-friendly

**Pattern C: Page Component** (`app/.../page.tsx`)
- Route component
- Can be client or server
- Handles routing params
- May include metadata export

### Step 3: Read Existing Patterns

**REQUIRED**: Check if similar components exist:
- Look in `frontend/app/**/*.tsx` for page patterns
- Look in `frontend/components/**/*.tsx` for component patterns
- Check `frontend/lib/api.ts` if it exists for API client patterns

### Step 4: Generate Component Code

**For Client Component:**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface <ComponentName>Props {
  // Define props with types
}

export default function <ComponentName>({ ...props }: <ComponentName>Props) {
  const [data, setData] = useState<DataType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // API integration example
  const fetchData = async () => {
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/...`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        if (response.status === 401) {
          // Redirect to login
          router.push('/login')
          return
        }
        throw new Error('Request failed')
      }

      const data = await response.json()
      setData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return <div className="animate-pulse">Loading...</div>
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    )
  }

  return (
    <div className="...">
      {/* Component JSX */}
    </div>
  )
}
```

**For Server Component:**

```typescript
import { headers } from 'next/headers'

interface <ComponentName>Props {
  // Define props with types
}

async function fetchData() {
  // Server-side data fetching
  const response = await fetch(`${process.env.API_URL}/api/...`, {
    cache: 'no-store' // or 'force-cache'
  })

  if (!response.ok) {
    throw new Error('Failed to fetch data')
  }

  return response.json()
}

export default async function <ComponentName>({ ...props }: <ComponentName>Props) {
  const data = await fetchData()

  return (
    <div className="...">
      {/* Component JSX */}
    </div>
  )
}
```

**For Page Component:**

```typescript
'use client' // if interactive

import { Metadata } from 'next'

// Server component can export metadata
export const metadata: Metadata = {
  title: '<Page Title>',
  description: '<Page Description>',
}

export default function <PageName>() {
  return (
    <main className="min-h-screen p-8">
      {/* Page content */}
    </main>
  )
}
```

### Step 5: Determine File Location

**Components:**
- Shared/reusable → `frontend/components/<ComponentName>.tsx`
- Feature-specific → `frontend/components/<feature>/<ComponentName>.tsx`

**Pages:**
- Route page → `frontend/app/<route>/page.tsx`
- Layout → `frontend/app/<route>/layout.tsx`
- Loading state → `frontend/app/<route>/loading.tsx`
- Error state → `frontend/app/<route>/error.tsx`

### Step 6: Generate Types

Create TypeScript interfaces/types in the same file or in `frontend/types/`:

```typescript
// types/api.ts
export interface User {
  id: string
  email: string
  name: string
  created_at: string
}

export interface Task {
  id: number
  title: string
  description: string | null
  completed: boolean
  created_at: string
  updated_at: string
  user_id: string
}
```

### Step 7: Tailwind CSS Classes

Follow project styling patterns:
- Container: `max-w-md`, `max-w-4xl`, etc.
- Cards: `bg-white`, `rounded-lg`, `shadow-md`, `p-6`
- Buttons: `bg-blue-600`, `hover:bg-blue-700`, `text-white`, `px-4`, `py-2`, `rounded`
- Forms: `border`, `border-gray-300`, `rounded-md`, `focus:ring-blue-500`
- Text: `text-gray-700`, `text-sm`, `font-medium`

### Step 8: Summary

Report what was created:
- Component name and type (client/server/page)
- File location
- Props interface
- Key functionality
- Styling approach
- Dependencies required

---

**Pattern Checklist:**
- [ ] TypeScript types for all props and state
- [ ] Proper use of 'use client' directive
- [ ] Error and loading states
- [ ] Authentication checks (if needed)
- [ ] Responsive design with Tailwind
- [ ] Semantic HTML elements
- [ ] Accessible (aria labels, keyboard nav)
- [ ] Environment variables for API URLs
