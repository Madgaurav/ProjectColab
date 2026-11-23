# ProjectCollab

A college-first platform for finding project teammates and building meaningful work together.

## Structure

```
frontend/   React and Vite application
backend/    Express API and PostgreSQL schema
```

## Database setup

Yes. PostgreSQL is required to persist students, profiles, projects, roles, skills, and team membership.

1. Install PostgreSQL locally, or create a free hosted PostgreSQL database through a provider such as Neon or Supabase.
2. Create a local database:

   ```bash
   createdb projectcollab
   ```

3. Copy `backend/.env.example` to `backend/.env`, then set `DATABASE_URL` and a long random `JWT_SECRET`.
4. Apply the full schema for a new database:

   ```bash
   psql "$DATABASE_URL" -f backend/db/schema.sql
   ```

   If you already applied earlier modules, apply only the new migration files in `backend/db/migrations/` in order.

## Run locally

Open two terminals:

```bash
cd backend && npm install && npm run dev
```

```bash
cd frontend && npm install && npm run dev
```

The frontend runs at `http://localhost:5173` and securely proxies `/api` requests to the backend on port `4000`.

For local development, email-verification and password-reset tokens are logged by the API. Configure a transactional email provider before production.
