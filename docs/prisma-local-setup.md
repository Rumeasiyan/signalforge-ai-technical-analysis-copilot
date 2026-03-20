# Prisma Local Setup

This project uses Prisma v7 with the PostgreSQL driver adapter and a local Postgres database.

## Database

Expected local database name:

```text
starterkit-nextjs-clerk
```

Expected connection string:

```env
DATABASE_URL="postgres://rumeasiyan@localhost:5432/starterkit-nextjs-clerk"
```

Update the username if your local Postgres user is different.

## Install dependencies

If Prisma packages are not installed yet:

```bash
npm install @prisma/adapter-pg @prisma/client dotenv pg uuid
npm install -D prisma tsx
```

## Prisma files

Relevant files in this repo:

```text
prisma/schema.prisma
prisma.config.ts
lib/prisma.ts
scripts/test-database.ts
```

## Commands

Generate the Prisma client:

```bash
npm run db:generate
```

Push the schema to the local database:

```bash
npm run db:push
```

Test the database connection:

```bash
npm run db:test
```

Open Prisma Studio:

```bash
npm run db:studio
```

Run lint after changes:

```bash
npm run lint
```

## Typical workflow

1. Update `prisma/schema.prisma`
2. Run:

```bash
npm run db:generate
npm run db:push
```

3. Verify with:

```bash
npm run db:test
```

## Notes

- The Prisma client is generated to `app/generated/prisma`
- `lib/prisma.ts` imports from `../app/generated/prisma/client`
- The test script creates and deletes a temporary user record
- This setup uses local Postgres, not Prisma cloud Postgres
