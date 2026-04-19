# Phase 3 — Pattern map (PATTERNS.md)

**Phase:** 3 — Admin session management  
**Purpose:** Closest analogs in repo for new/modified files.

---

## Target files (planned)

| File | Role | Closest analog |
|------|------|----------------|
| `src/collections/Livestreams/index.ts` | Collection `admin` config | `src/collections/Posts/index.ts` — `admin.preview`, `admin.livePreview`, `defaultColumns` |
| `src/utilities/generatePreviewPath.ts` | Anti-pattern reference | **Do not** mirror for viewer — compare only |
| New: `src/utilities/*livestream*Viewer*.ts` | Path + absolute URL | `getServerSideURL` from `src/utilities/getURL.ts` |
| New: `src/components/Livestream*/*` | Admin Cell / UI field | Payload docs pattern: `admin.components.Cell`; project: any existing `components` under `src/components` referenced from collections |

---

## Code excerpts (references)

**Posts preview wiring (pattern only — URLs differ):**

```61:77:src/collections/Posts/index.ts
  admin: {
    defaultColumns: ['title', 'slug', 'updatedAt'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'posts',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'posts',
        req,
      }),
```

**Server-side base URL:**

```3:10:src/utilities/getURL.ts
export const getServerSideURL = () => {
  return (
    process.env.NEXT_PUBLIC_SERVER_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000')
  )
}
```

**Current Livestreams admin (extension point):**

```7:11:src/collections/Livestreams/index.ts
export const Livestreams: CollectionConfig<'livestreams'> = {
  slug: 'livestreams',
  admin: {
    defaultColumns: ['title', 'slug', 'status', 'updatedAt'],
    useAsTitle: 'title',
  },
```

---

## PATTERN MAPPING COMPLETE
