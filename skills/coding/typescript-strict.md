# Skill: TypeScript Strict Patterns

## Rules
- `strict: true` in tsconfig — no exceptions
- Never use `any` — use `unknown` + type guards instead
- Never use `as` type assertions unless interfacing with untyped libs (and add a comment)
- Prefer `interface` for object shapes, `type` for unions/intersections

## Common Patterns

### Type Guards
```typescript
function isApiError(error: unknown): error is { message: string; code: number } {
  return typeof error === 'object' && error !== null && 'message' in error
}
```

### Discriminated Unions
```typescript
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string }
```

### Zod Validation (preferred for form/API input)
```typescript
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  amount: z.number().positive(),
})

type FormData = z.infer<typeof schema>
```

### Supabase Types
Generate types from Supabase:
```bash
npx supabase gen types typescript --project-id kwjgfljzdgpfyqknakmy > src/types/database.ts
```
