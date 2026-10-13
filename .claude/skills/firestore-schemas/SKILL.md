---
title: Firestore-schemas
description: Firestore type conventions and patterns for TypeScript projects. Use when: (1) Creating new Firestore document types, (2) Defining collection schemas, (3) Implementing serialization/converters, (4) Setting up type-safe Firestore queries, or (5) Working with Firestore timestamps and type patterns.
---

# File Location

All types in `types/firestore/` — one file per entity (lowercase, singular), with barrel export in `index.ts`.

# Naming Conventions

- **Document:** `{Entity}` — uses `Date `for date fields
- **Create Input:** `Create{Entity}Input` — excludes `id`
- **Update Input:** `Update{Entity}Input` — all fields optional, no `createdAt`
- **Converter:** `{entityConverter}`

# Type Patterns Examples

```typescript
// types/firestore/heist.ts
import { FieldValue } from "firebase/firestore"

// Document — what you read from Firestore (after conversion)
export interface Heist {
  id: string
  createdAt: Date

  // ...other custom fields
}

// Create Input — what you pass to addDoc
export interface CreateHeistInput {
  createdAt: FieldValue // serverTimestamp()

  // ...other custom fields
}

// Update Input — partial fields for updateDoc (no createdAt)
export interface UpdateHeistInput {
  // ...all custom fields (all optional)
}
```

# Converter Pattern

```typescript
import { DocumentData, QueryDocumentSnapshot } from "firebase/firestore"

export const heistConverter = {
  toFirestore: (data: Partial<Heist>): DocumentData => data,

  fromFirestore: (snapshot: QueryDocumentSnapshot): Heist =>
    ({
      id: snapshot.id,
      ...snapshot.data(),
      createdAt: snapshot.data().createdAt?.toDate(),

      // convert any custom Timestamp fields to Dates
      deadline: snapshot.data().deadline?.toDate(),
    }) as Heist,
}

// Usage
const ref = collection(db, COLLECTIONS.HEISTS).withConverter(heistConverter)
```

**Note:** Converters work with `addDoc` and `setDoc`, NOT `updateDoc`.

# Barrel Export

```typescript
// types/firestore/index.ts
export * from "./heist"
export * from "./user"

export const COLLECTIONS = {
  HEISTS: "heists",
  USERS: "users",
} as const
```
