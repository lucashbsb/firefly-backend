# Authentication Flow

JWT-based authentication with RBAC (Role-Based Access Control).

## Login Flow

```
 Client                  Controller              Service                  DB
   │                          │                      │                     │
   │ POST /auth/login         │                      │                     │
   │ { email, password }      │                      │                     │
   ├─────────────────────────>│                      │                     │
   │                          │                      │                     │
   │                          │ validateLogin()      │                     │
   │                          ├──────┐               │                     │
   │                          │      │ Validation    │                     │
   │                          │<─────┘               │                     │
   │                          │                      │                     │
   │                          │ validatePassword()   │                     │
   │                          ├─────────────────────>│                     │
   │                          │                      │ findByEmail()       │
   │                          │                      ├────────────────────>│
   │                          │                      │<────────────────────│
   │                          │                      │                     │
   │                          │                      │ bcrypt.compare()    │
   │                          │                      ├──────┐              │
   │                          │                      │<─────┘              │
   │                          │<─────────────────────│                     │
   │                          │                      │                     │
   │                          │ getUserWithPermissions()                   │
   │                          ├─────────────────────>│                     │
   │                          │                      │ Query roles +       │
   │                          │                      │ permissions         │
   │                          │<─────────────────────│                     │
   │                          │                      │                     │
   │                          │ generateTokens()     │                     │
   │                          ├──────┐               │                     │
   │                          │      │ JWT sign      │                     │
   │                          │<─────┘               │                     │
   │                          │                      │                     │
   │                          │ setTokenCookies()    │                     │
   │                          ├──────┐               │                     │
   │                          │<─────┘               │                     │
   │                          │                      │                     │
   │ Set-Cookie: access_token │                      │                     │
   │ Set-Cookie: refresh_token│                      │                     │
   │ { user, tokens }         │                      │                     │
   │<─────────────────────────│                      │                     │
```

## Token Refresh Flow

```
 Client                    Controller
   │                          │
   │ POST /auth/refresh       │
   │ { refreshToken }         │
   ├─────────────────────────>│
   │                          │
   │                          │ jwt.verify(refreshToken)
   │                          │ Check type === 'refresh'
   │                          │ Find user
   │                          │ Generate new tokens
   │                          │
   │ New access + refresh     │
   │<─────────────────────────│
```

## JWT Tokens

| Token         | Expiry | Purpose              |
| ------------- | ------ | -------------------- |
| Access Token  | 1 day  | API authentication   |
| Refresh Token | 7 days | Get new access token |

```typescript
const accessToken = jwt.sign({ userId, email }, config.jwt.secret, {
  expiresIn: "1d",
});

const refreshToken = jwt.sign(
  { userId, email, type: "refresh" },
  config.jwt.secret,
  { expiresIn: "7d" }
);
```

## Cookie Configuration

```typescript
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.nodeEnv === "production",
  sameSite: "lax",
  path: "/",
};
```

## RBAC Middleware Flow

```
 Request                 authenticate            requirePermission        Next
   │                          │                        │                   │
   │ Authorization: Bearer... │                        │                   │
   ├─────────────────────────>│                        │                   │
   │                          │                        │                   │
   │                          │ jwt.verify(token)      │                   │
   │                          ├──────┐                 │                   │
   │                          │<─────┘                 │                   │
   │                          │                        │                   │
   │                          │ getUserWithPermissions()                   │
   │                          ├──────────────────────────────┐             │
   │                          │<─────────────────────────────┘             │
   │                          │                        │                   │
   │                          │ req.user = { id, email,│                   │
   │                          │   roles, permissions } │                   │
   │                          ├──────┐                 │                   │
   │                          │<─────┘                 │                   │
   │                          │                        │                   │
   │                          │ next()                 │                   │
   │                          ├───────────────────────>│                   │
   │                          │                        │                   │
   │                          │                        │ Check permission  │
   │                          │                        │ in req.user       │
   │                          │                        ├──────┐            │
   │                          │                        │<─────┘            │
   │                          │                        │                   │
   │                          │                        │ next()            │
   │                          │                        ├──────────────────>│
```

## Permission Hierarchy

```
Admin
  └── All permissions

Teacher
  ├── LESSON_*
  ├── REPORT_*
  └── USER_VIEW

Student
  ├── LESSON_VIEW
  ├── LESSON_SUBMIT
  ├── REPORT_VIEW
  └── SR_*
```

## Authenticated Request Interface

```typescript
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: string[];
    permissions: string[];
  };
}
```

## Middleware Usage

```typescript
router.get("/protected", authenticate, handler);

router.get("/admin", authenticate, requirePermission("USER_LIST"), handler);

router.get("/user/:userId", authenticate, requireOwnership(), handler);
```
