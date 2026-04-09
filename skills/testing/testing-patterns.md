# Skill: Testing Patterns

## Strategy
- `npm run build` is the first line of defense (catches type errors + broken imports)
- Integration tests for API routes and page rendering
- Unit tests for utility functions and complex logic
- E2E only for critical user flows

## Vitest Setup
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: { environment: 'jsdom' },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
})
```

## Test Patterns
```typescript
import { describe, it, expect } from 'vitest'

describe('formatCurrency', () => {
  it('formats EUR correctly', () => {
    expect(formatCurrency(1234.56)).toBe('1.234,56 €')
  })
})
```

## API Route Testing
```typescript
import { GET } from '@/app/api/items/route'

it('returns 200 with items', async () => {
  const request = new Request('http://localhost/api/items')
  const response = await GET(request)
  expect(response.status).toBe(200)
})
```
