# Table Top

Nuxt 4 (SPA) + tRPC + Prisma 7 / PostgreSQL. Design docs live in [.docs/](.docs/).

## Local setup

### 1. Node

The version is pinned in `.nvmrc`:

```bash
nvm install && nvm use
corepack enable && corepack prepare pnpm@10.33.0 --activate
pnpm install
```

### 2. Database

Local Postgres runs via `docker-compose.yml` on host port **5434** (5432/5433 are
often taken by other projects):

```bash
docker compose up -d
```

### 3. Environment

```bash
cp .env.example .env
```

Then fill it in:

- `DATABASE_URL` / `DIRECT_URL` — `postgresql://tabletop:tabletop@localhost:5434/tabletop`
  for the compose setup above. They differ only when the database sits behind a
  connection pooler (Supabase), where `DIRECT_URL` must bypass the pooler for migrations.
- `NUXT_JWT_SECRET` — any long random string, e.g. `openssl rand -base64 48`.
- `NUXT_GOOGLE_*` — see below.

### 4. Google OAuth

Google is the only sign-in path, so the app is unusable without it.

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services →
   Credentials → Create OAuth client ID → **Web application**.
2. Authorized redirect URI: `http://localhost:3000/auth/google/callback`
3. Copy the client ID/secret into `NUXT_GOOGLE_CLIENT_ID` / `NUXT_GOOGLE_CLIENT_SECRET`.
4. While the consent screen is in **Testing**, add your own address under Test users.

A `users` row is created automatically on first successful sign-in.

### 5. Migrate and run

```bash
pnpm prisma migrate deploy
pnpm prisma generate
pnpm dev            # http://localhost:3000
```

## Common commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Dev server on :3000 |
| `pnpm build` / `pnpm preview` | Production build and preview |
| `pnpm lint` / `pnpm lint:fix` | ESLint |
| `pnpm test:typecheck` | `vue-tsc --noEmit` |
| `pnpm prisma migrate dev --name <name>` | Create a new migration |
| `pnpm prisma migrate reset` | Drop and rebuild the local database |
| `pnpm prisma studio` | Browse data |

## Notes

- `postinstall` runs only `nuxt prepare`, not `prisma generate`. After a Prisma upgrade
  or a fresh install, run `pnpm prisma generate`, or typecheck fails on every
  `@prisma/client` import.
