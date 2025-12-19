# Auth API

Base path: `/api/auth`

---

## POST `/register`

Register a new user.

**Body:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "native_language": "pt-BR",
  "target_level": "B1"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "...", "name": "..." },
    "accessToken": "jwt...",
    "refreshToken": "jwt..."
  }
}
```

---

## POST `/login`

Authenticate user.

**Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "...",
      "name": "...",
      "roles": ["student"],
      "permissions": ["LESSON_VIEW", "REPORT_VIEW"]
    },
    "accessToken": "jwt...",
    "refreshToken": "jwt..."
  }
}
```

---

## POST `/logout`

Clear authentication cookies.

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## POST `/refresh`

Refresh access token.

**Body:**

```json
{
  "refreshToken": "jwt..."
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "accessToken": "jwt...",
    "refreshToken": "jwt..."
  }
}
```

---

## GET `/me` 🔒

Get authenticated user info.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "...",
    "name": "...",
    "current_level": "B1",
    "target_level": "C1",
    "roles": ["student"],
    "permissions": ["LESSON_VIEW"]
  }
}
```
