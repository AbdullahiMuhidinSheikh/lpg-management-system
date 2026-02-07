# Changes Made to Fix Prisma + Supabase Connection

**Date**: February 6, 2026  
**Author**: Debugging session  

---

## Problem Summary

The original project had several issues preventing it from connecting to a Supabase PostgreSQL database and running successfully.

---

## Changes Made

### 1. Fixed SQLite ↔ PostgreSQL Migration Mismatch

**Problem**: The `prisma/migrations/` folder contained a `migration_lock.toml` with `provider = "sqlite"` and SQL using SQLite syntax (`AUTOINCREMENT`, `DATETIME`, `REAL`), but `schema.prisma` declared `provider = "postgresql"`.

**Fix**: Deleted the entire `prisma/migrations/` directory. Used `npx prisma db push` to sync the schema directly to Supabase instead, since `prisma migrate dev` requires a non-pgbouncer direct connection which was blocked by an IPv6 network issue.

**Files affected**:
- `prisma/migrations/` — deleted entirely

---

### 2. Fixed `Product.name` Missing `@unique` Constraint

**Problem**: The seed script uses `prisma.product.upsert({ where: { name: ... } })` but `Product.name` had no `@unique` constraint, causing the upsert to fail.

**Fix**: Added `@unique` to `Product.name` in `schema.prisma`.

**File**: `prisma/schema.prisma`
```diff
- name      String
+ name      String      @unique
```

---

### 3. Updated `.env.example` for Supabase

**Problem**: The `.env.example` had generic PostgreSQL placeholders that didn't match the Supabase connection string format.

**Fix**: Updated with proper Supabase Supavisor connection string templates per [official docs](https://supabase.com/docs/guides/database/prisma).

**File**: `.env.example`
- `DATABASE_URL` → Supavisor **transaction pooler** (port `6543`, with `?pgbouncer=true`)
- `DIRECT_URL` → Supavisor **session pooler** (port `5432`, no pgbouncer flag)

---

### 4. Created `.env` File

**Problem**: No `.env` file existed — the app would crash immediately with no `DATABASE_URL`.

**Fix**: Created `.env` from the template with actual Supabase credentials.

**File**: `.env` (created, gitignored)

---

### 5. Removed `directUrl` Dependency on Direct DB Host

**Problem**: The direct database host (`db.PROJECT-REF.supabase.co:5432`) was unreachable from the local network (IPv6 routing issue). Only the pooler hosts were accessible.

**Fix**: Pointed `DIRECT_URL` to the Supavisor **session pooler** on port `5432` instead of the direct host. This works for `prisma db push` and runtime queries.

**Connection strings used**:
- `DATABASE_URL` → `postgresql://postgres.REF:PASS@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
- `DIRECT_URL` → `postgresql://postgres.REF:PASS@aws-1-eu-west-1.pooler.supabase.com:5432/postgres`

---

### 6. Fixed Seed Script (ts-node → plain JS)

**Problem**: The seed command `node --loader ts-node/esm prisma/seed.ts` crashed on Node.js 22 with `ERR_REQUIRE_CYCLE_MODULE` due to ESM loader deprecation.

**Fix**: Created `prisma/seed.js` — a plain CommonJS version of the seed script that works with any Node.js version. Updated `package.json` seed command.

**Files affected**:
- `prisma/seed.js` — created (replaces `seed.ts` for execution)
- `package.json` → `"prisma": { "seed": "node prisma/seed.js" }`

---

### 7. URL-Encoded Special Characters in Password

**Problem**: The database password contained `#` which is a URL fragment delimiter. Prisma silently truncated the password, causing auth failures.

**Fix**: Replaced `#` with `%23` in both `DATABASE_URL` and `DIRECT_URL`.

---

### 8. Added `test-connection.js`

**Purpose**: A standalone Node.js script to verify database connectivity independent of the Next.js app.

**File**: `test-connection.js` (can be deleted after debugging)

---

## Setup Commands (What We Ran)

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Push schema to Supabase (creates all 12 tables)
npx prisma db push

# 4. Seed database with sample data
npx prisma db seed

# 5. Start development server
npm run dev
```

---

## Network Note

The **direct database connection** (`db.PROJECT-REF.supabase.co:5432`) is unreachable from this network due to IPv6 routing. All connections go through the **Supavisor pooler** instead:
- Port `6543` = transaction mode (pgbouncer) — used for app runtime
- Port `5432` = session mode — used for migrations/schema push

If you move to a network with IPv4 direct access, you can update `DIRECT_URL` to `db.PROJECT-REF.supabase.co:5432` for better migration support.
