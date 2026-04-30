# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Auth**: express-session + bcrypt (no external auth provider)
- **Frontend**: React + Vite + TailwindCSS + React Query

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### secure-auth (React + Vite frontend, preview path: /)
A full-featured secure authentication system with:
- Login with account lockout after 3 failed attempts
- User registration with role selection (admin/user)
- Role-based access control (RBAC)
- Admin control panel: user management, audit logs, system stats
- User dashboard: profile and session info
- Full audit logging (login, logout, failed attempts, account lock, unlock, register)
- bcrypt password hashing (12 salt rounds)
- Session-based auth via express-session

### api-server (Express 5 backend, preview path: /api)
REST API with routes:
- POST /api/auth/register
- POST /api/auth/login (with lockout logic)
- POST /api/auth/logout
- GET /api/auth/me
- GET /api/admin/users (admin only)
- POST /api/admin/users/:id/unlock (admin only)
- GET /api/admin/logs (admin only)
- GET /api/admin/stats (admin only)

## Database Schema

### users
- id, username (unique), password_hash, role (admin|user), failed_attempts, is_locked, created_at

### audit_logs
- id, user_id (FK), username, action, ip_address, details, created_at

## Demo Accounts
- admin / admin123 (role: admin)
- bob / bob123 (role: user)
- alice / alice123 (role: user, LOCKED after 3 failed attempts)
