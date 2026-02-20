# El Tafouk Books Platform

Next.js 16 + TypeScript + Tailwind v4 storefront with locale routing (`/ar`, `/en`) and Prisma backend APIs.

## Setup

1. Install dependencies

```bash
npm install
```

2. Configure environment

Copy `.env.example` to `.env` and fill values:

- `DATABASE_URL`: Neon pooled URL (host contains `-pooler.`) for app runtime.
- `DIRECT_URL`: Neon direct URL for Prisma migrations.
- `ADMIN_JWT_SECRET`: secret used to sign admin JWT cookies.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`: seeded SUPER_ADMIN account.
- `CLOUDINARY_*`: required for admin image uploads.
- `UPSTASH_*`: optional rate limit backing store.
- `DATA_SOURCE=remote`: routes frontend book reads through API.

3. Prisma

```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

The seed script upserts books from `lib/data.ts` and seeds one SUPER_ADMIN from `ADMIN_EMAIL` + `ADMIN_PASSWORD`.

4. Run app

```bash
npm run dev
```

## Admin Auth

- `POST /api/admin/auth/login` with `{ email, password }`
- `POST /api/admin/auth/logout`
- `GET /api/admin/auth/me`

Session is stored in an `httpOnly` JWT cookie.

## Role Permissions

- `SUPER_ADMIN`: full access + can delete books
- `ADMIN`: manage books/orders (no delete)
- `EDITOR`: stock-only updates

## Admin APIs

- `GET /api/admin/stats`
- `GET /api/admin/stats/revenue?range=7d|30d|12m`
- `GET /api/admin/inventory/alerts`
- `GET /api/admin/books`
- `POST /api/admin/books`
- `PATCH /api/admin/books/:id`
- `DELETE /api/admin/books/:id` (SUPER_ADMIN only)
- `GET /api/admin/orders`
- `PATCH /api/admin/orders/:orderId` (ADMIN/SUPER_ADMIN)
- `POST /api/admin/upload` (Cloudinary image upload)

## Quality

```bash
npm run lint
npm run build
```
