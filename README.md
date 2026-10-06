# VISION PRO

VISION PRO is a mobile-first Algerian spare-parts storefront backed by a
separately deployable Express API and PostgreSQL database. The frontend talks
to the API only over JSON/REST. Product compatibility is a relational
product-to-phone-model relation; the storefront never guesses compatibility.

## Requirements

- Node.js 22.12 or newer
- PostgreSQL 15 or newer, with permission to enable `pg_trgm`

## Local development

Install the workspace packages and configure both the API database and the
frontend's API URL:

```powershell
npm install
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item .env.example .env
```

Set `DATABASE_URL` in `apps/api/.env`. For admin access, set `JWT_SECRET` to a
random secret of at least 32 characters and configure `ADMIN_EMAIL` and
`ADMIN_PASSWORD_HASH`. Generate the hash locally with:

```powershell
npm run admin:hash --workspace @vision-pro/api -- "a-long-admin-password"
```

Put the printed bcrypt hash in `ADMIN_PASSWORD_HASH`, then create the database,
apply its schema, seed the initial catalog, and launch both services:

```powershell
npm run db:generate --workspace @vision-pro/api
npm run db:deploy --workspace @vision-pro/api
npm run db:seed --workspace @vision-pro/api
npm run dev
```

The storefront runs at `http://localhost:5173`; the API runs at
`http://localhost:5000`. The seed creates 14 bilingual categories, 9 popular
brands, phone models, sample repair parts, and example customer reviews.

If PostgreSQL is unavailable, run `npm run dev:demo` to use a temporary,
read-only sample catalog. Product and search pages work in this mode, while
orders and administration return HTTP 503. The normal `npm run dev` command
continues to use PostgreSQL.

## Build and deployment

`npm run build` type-checks and creates the standalone static SPA in `dist/`.
Deploy that directory to any static host and set `VITE_API_URL` at build time.
Build the API separately with `npm run build:api`; deploy `apps/api` as a Node
service, set its environment variables, and apply migrations with
`npm run db:deploy --workspace @vision-pro/api`.

Set `FRONTEND_ORIGIN` on the API to the exact deployed frontend origin. Never
expose `DATABASE_URL`, `JWT_SECRET`, the admin password hash, or database
credentials to the browser.

## Tests

```powershell
npm test
npm run lint
```
