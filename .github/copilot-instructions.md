# Copilot Instructions - English Teacher Backend

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (raw SQL via `pg`)
- **Authentication**: JWT (jsonwebtoken)
- **AI Providers**: OpenAI, Anthropic, Grok
- **Logging**: Pino

## Prohibitions

- **NO comments in code**
- **NO ORM** (use raw SQL queries)
- **NO business logic in Controllers**
- **NO database calls in Services** (use Repositories)
- **NO multiple exports per file** (1 type/class/interface per file)
- **NO inline SQL in Services**
- **NO try-catch in Controllers** (use global error handler)

## Architecture Rules

### Layer Responsibilities

```
Request → Route → Controller → Service → Repository → Database
                     ↓
              Validation (DTO)
```

| Layer          | Responsibility                                            |
| -------------- | --------------------------------------------------------- |
| **Route**      | HTTP method binding, middleware attachment                |
| **Controller** | Request/Response handling, DTO validation, call Service   |
| **Service**    | Business logic, orchestration, call multiple Repositories |
| **Repository** | Database access, raw SQL queries                          |
| **DTO**        | Data transfer objects, input/output typing                |
| **Validation** | Input validation rules                                    |
| **Entity**     | Database table representation                             |

### Golden Rules

1. **Controller NEVER calls Repository directly**
2. **Service NEVER executes raw SQL** (delegate to Repository)
3. **Repository NEVER contains business logic**
4. **1 file = 1 export** (class, interface, or type)
5. **Large Services must be split** (max ~200 lines per Service)
6. **DTOs for input, Entities for database**

## Folder Structure

```
src/
├── app.ts                  # Express app configuration
├── server.ts               # Server bootstrap
├── config/
│   └── index.ts            # Environment configuration
├── controllers/
│   ├── index.ts            # Re-exports all controllers
│   └── AuthController.ts   # 1 controller per domain
├── services/
│   ├── index.ts            # Re-exports all services
│   ├── AuthService.ts      # Business logic
│   └── ai/                 # Split complex services into folders
│       ├── OpenAIProvider.ts
│       ├── AnthropicProvider.ts
│       └── index.ts
├── repositories/
│   ├── index.ts            # Re-exports all repositories
│   ├── base/
│   │   └── BaseRepository.ts
│   └── UserRepository.ts   # 1 repository per entity
├── models/
│   └── entities/           # Database entities (1 per file)
│       ├── User.ts
│       ├── Role.ts
│       └── index.ts
├── dto/
│   ├── index.ts            # Re-exports all DTOs
│   └── auth/               # DTOs grouped by domain
│       ├── LoginDTO.ts
│       ├── RegisterDTO.ts
│       └── index.ts
├── validations/
│   ├── BaseValidation.ts   # Validation base class
│   └── AuthValidation.ts   # 1 validation per domain
├── middlewares/
│   ├── auth.ts             # Authentication middleware
│   ├── errorHandler.ts     # Global error handler
│   └── index.ts
├── routes/
│   ├── index.ts            # Route aggregator
│   └── authRoutes.ts       # 1 route file per domain
├── database/
│   ├── db.ts               # Database connection pool
│   ├── postgres.ts         # PostgreSQL client
│   └── migrations/         # SQL migration files
├── lib/
│   └── logger.ts           # Pino logger
├── types/
│   └── express.d.ts        # Express type extensions
└── utils/                  # Pure utility functions
```

## Naming Conventions

| Type       | Convention              | Example             |
| ---------- | ----------------------- | ------------------- |
| Controller | PascalCase + Controller | `AuthController.ts` |
| Service    | PascalCase + Service    | `AuthService.ts`    |
| Repository | PascalCase + Repository | `UserRepository.ts` |
| DTO        | PascalCase + DTO        | `LoginDTO.ts`       |
| Entity     | PascalCase              | `User.ts`           |
| Validation | PascalCase + Validation | `AuthValidation.ts` |
| Route      | camelCase + Routes      | `authRoutes.ts`     |
| Middleware | camelCase               | `errorHandler.ts`   |

## Code Patterns

### Entity Pattern

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  password_hash?: string;
  native_language: string;
  target_level: string;
  current_level: string;
  created_at: Date;
  updated_at: Date;
}
```

### DTO Pattern

```typescript
export interface LoginDTO {
  email: string;
  password: string;
}
```

### Repository Pattern

```typescript
import { BaseRepository } from "./base";
import { User } from "../models/entities";

export class UserRepository extends BaseRepository<User> {
  protected tableName = "users";

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.query<User>(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    return result.rows[0] || null;
  }
}

export const userRepository = new UserRepository();
```

### Service Pattern

```typescript
import { userRepository } from "../repositories";
import { CreateUserDTO } from "../dto";

export class UserService {
  async findByEmail(email: string) {
    return userRepository.findByEmail(email);
  }

  async create(data: CreateUserDTO) {
    const hash = await bcrypt.hash(data.password, 10);
    return userRepository.create({ ...data, password_hash: hash });
  }
}

export const userService = new UserService();
```

### Controller Pattern

```typescript
import { Request, Response } from "express";
import { userService } from "../services";
import { authValidation } from "../validations";

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    const validation = authValidation.validateLogin(req.body);

    if (!validation.isValid) {
      res.status(400).json({ success: false, errors: validation.toResponse() });
      return;
    }

    const user = await userService.validatePassword(
      req.body.email,
      req.body.password
    );

    if (!user) {
      res.status(401).json({ success: false, error: "Invalid credentials" });
      return;
    }

    res.json({ success: true, data: { user } });
  }
}

export const authController = new AuthController();
```

### Route Pattern

```typescript
import { Router } from "express";
import { authController } from "../controllers";
import { authenticate } from "../middlewares";

const router = Router();

router.post("/login", (req, res) => authController.login(req, res));
router.get("/me", authenticate, (req, res) => authController.me(req, res));

export default router;
```

### Validation Pattern

```typescript
import { BaseValidation } from "./BaseValidation";
import { ValidationResult } from "./ValidationResult";
import { LoginDTO } from "../dto";

export class AuthValidation extends BaseValidation {
  validateLogin(data: LoginDTO): ValidationResult {
    this.reset();

    if (this.required("email", data.email)) {
      this.isEmail("email", data.email);
    }

    this.required("password", data.password);

    return this.getResult();
  }
}

export const authValidation = new AuthValidation();
```

## Splitting Large Services

When a Service exceeds ~200 lines, split by subdomain:

```
src/services/
├── AIService.ts            # Orchestrator (delegates to providers)
└── ai/
    ├── BaseProvider.ts     # Abstract provider
    ├── OpenAIProvider.ts   # OpenAI implementation
    ├── AnthropicProvider.ts
    ├── GrokProvider.ts
    └── index.ts            # Re-exports
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "errors": { "field": ["error1", "error2"] }
}
```

## Authentication

1. **JWT Tokens**: Access token (1d) + Refresh token (7d)
2. **Cookie Storage**: httpOnly cookies for security
3. **Header Support**: Bearer token in Authorization header
4. **RBAC**: Role-based access control via permissions

## Environment Variables

```env
PORT=4000
NODE_ENV=development
DATABASE_URL=postgres://localhost:5432/english_teacher
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GROK_API_KEY=xai-...
```

## Import Order

1. External packages
2. Config
3. Types/Interfaces
4. Services
5. Repositories
6. DTOs
7. Utils

## API Base Path

All routes are prefixed with `/api`:

- Auth: `/api/auth`
- Users: `/api/users`
- Skills: `/api/skills`
- Lessons: `/api/lessons`
- Reports: `/api/reports`
- SR (Spaced Repetition): `/api/sr`
- AI: `/api/ai`
- Metrics: `/api/metrics`
