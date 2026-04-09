# Skill: Next.js 14 App Router Patterns

## Server Components (default)
- All components are Server Components unless marked `'use client'`
- Fetch data directly in components with `async` functions
- Use `next/headers` for cookies/headers access

## Client Components
Add `'use client'` only when you need:
- useState, useEffect, useRef, or other hooks
- Event handlers (onClick, onChange, etc.)
- Browser APIs (localStorage, window, etc.)
- Third-party client libraries

## Data Fetching
```typescript
// Server Component — direct fetch
export default async function Page() {
  const data = await fetchData()
  return <Component data={data} />
}

// Server Action — mutations
'use server'
export async function createItem(formData: FormData) {
  const supabase = await createClient()
  // ... insert logic
  revalidatePath('/')
}
```

## Route Handlers
```typescript
// src/app/api/[resource]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('table').select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

## Error Handling
- Use `error.tsx` boundaries per route segment
- Use `loading.tsx` for Suspense fallbacks
- Use `not-found.tsx` with `notFound()` from `next/navigation`

## Metadata
```typescript
export const metadata: Metadata = {
  title: 'Page Title | GSL Apps',
  description: 'Description',
}
```
