# Firefly Backend

Production-ready Node.js backend for an English learning platform with JWT RS256 authentication, permission-based ACL, skill tracking, student management, and CEFR-level proficiency mapping. Built with Express, TypeScript, TypeORM, and PostgreSQL/SQLite.

## Tech Stack

- Node.js 20+, TypeScript 5.6+, Express 4
- TypeORM with SQLite (dev) and PostgreSQL (prod)
- Authentication: JWT RS256 with asymmetric signing, bcrypt password hashing
- Security: Helmet with CSP/HSTS, CORS with credentials, express-rate-limit, Zod strict validation
- Logging: Morgan

## Architecture

Modular structure following security-first design principles:

```
src/
├── auth/          JWT RS256 authentication, token refresh
├── users/         User management with role assignments
├── roles/         RBAC role definitions and permissions
├── permissions/   Granular resource.action permissions
├── students/      Student-specific data
├── skills/        Skill catalog and categorization
├── tracks/        Skill progression tracks
├── proficiency/   CEFR level mapping (schema only)
├── shared/        Guards, middleware, utils
│   ├── guards/permissionGuard.ts
│   ├── middlewares/rateLimiter.ts
│   └── utils/jwtService.ts
└── routes/        Route registration
```

## Security Features

- **JWT RS256**: Asymmetric token signing with RSA 2048-bit keys, 15-minute access tokens, 7-day refresh tokens
- **Permission-based ACL**: Fine-grained `resource.action` permissions (e.g., `skills.create`, `users.update`)
- **Rate Limiting**: Tiered limits - login (5/15min), register (3/hour), refresh (10/15min), general API (100/15min)
- **CSRF Protection**: CORS with credentials support, Helmet CSP with `self` directive
- **HSTS**: 1-year max-age with includeSubDomains and preload
- **Input Validation**: Zod strict mode rejects unknown fields
- **Production Error Hardening**: Stack traces hidden, safe messages only

## Getting Started

```bash
npm install
cp .env.example .env
npm run dev
```

Generate RSA key pair for JWT signing:

```bash
openssl genrsa -out auth_private.key 2048
openssl rsa -in auth_private.key -pubout -out auth_public.key
```

`NODE_ENV` drives database selection:

- `production`: PostgreSQL via `DATABASE_URL`
- any other value: SQLite file defined by `SQLITE_DB_PATH` (auto-created)

Run `docker compose up -d` to boot a managed PostgreSQL 16 instance. Schema is manually managed via `database/20251121174600_initial-schema.sql`.

## Environment Variables

| Key                  | Description                                                                           |
| -------------------- | ------------------------------------------------------------------------------------- |
| `PORT`               | HTTP port (defaults to 3000)                                                          |
| `DATABASE_URL`       | PostgreSQL connection string for production                                           |
| `SQLITE_DB_PATH`     | SQLite file used outside production                                                   |
| `JWT_PRIVATE_KEY`    | Path to RSA private key for signing (default: `auth_private.key`)                     |
| `JWT_PUBLIC_KEY`     | Path to RSA public key for verification (default: `auth_public.key`)                  |
| `JWT_ACCESS_EXPIRY`  | Access token TTL (default: `15m`)                                                     |
| `JWT_REFRESH_EXPIRY` | Refresh token TTL (default: `7d`)                                                     |
| `ALLOWED_ORIGINS`    | Comma-separated CORS origins (default: `http://localhost:3000,http://localhost:5173`) |

## NPM Scripts

| Script          | Description                       |
| --------------- | --------------------------------- |
| `npm run dev`   | Starts the server with hot reload |
| `npm run build` | Compiles TypeScript to `dist`     |
| `npm start`     | Runs the compiled server          |
| `npm run lint`  | Executes ESLint checks            |

## API Overview

Base path: `/api`

| Resource         | Endpoints                          | Authentication Required |
| ---------------- | ---------------------------------- | ----------------------- |
| Auth             | `POST /register, /login, /refresh` | No (public)             |
| Users            | `POST/GET/GET/:id/PATCH/:id`       | Yes (permissions vary)  |
| Students         | `POST/GET/GET/:id/PATCH/:id`       | Yes (permissions vary)  |
| Roles            | `POST/GET/GET/:id/PATCH/:id`       | Yes (permissions vary)  |
| Permissions      | `POST/GET/GET/:id/PATCH/:id`       | Yes (permissions vary)  |
| CEFR Levels      | `POST/GET/GET/:id/PATCH/:id`       | Yes (permissions vary)  |
| Skill Categories | `POST/GET/GET/:id/PATCH/:id`       | Yes (permissions vary)  |
| Skill Tracks     | `POST/GET/GET/:id/PATCH/:id`       | Yes (permissions vary)  |
| Skills           | `POST/GET/GET/:id/PATCH/:id`       | Yes (permissions vary)  |

Detailed request/response contracts with permission requirements live in `docs/endpoints/` and must be updated alongside any API change.

## Authentication Flow

1. **Register**: `POST /api/auth/register` with `email`, `password`, `name`
2. **Login**: `POST /api/auth/login` returns `accessToken` and `refreshToken`
3. **Authenticated Requests**: Include `Authorization: Bearer <accessToken>` header
4. **Token Refresh**: `POST /api/auth/refresh` with `refreshToken` to get new access token

## ACL System

Permissions follow `resource.action` pattern:

- `skills.create`, `skills.view`, `skills.update`, `skills.delete`
- `users.create`, `users.view`, `users.update`, `users.delete`
- `tracks.manage`, `roles.create`, `permissions.view`

Roles have N:N relations with permissions via `tb_role_permissions`. Users get roles via `tb_user_roles`. Protected routes use `requirePermission(...permissions)` guard.

## Rate Limiting

- **Login**: 5 requests per 15 minutes per IP
- **Register**: 3 requests per hour per IP
- **Token Refresh**: 10 requests per 15 minutes per IP
- **General API**: 100 requests per 15 minutes per IP

## Production Notes

- Set `NODE_ENV=production` and provide secure `DATABASE_URL`
- Ensure RSA keys exist and are not committed to version control
- Configure `ALLOWED_ORIGINS` for CORS
- Schema is managed manually; entities map to existing tables
- All endpoints validate using Zod strict mode
- Stack traces hidden in production, only safe error messages exposed
