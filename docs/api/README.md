# API Documentation

## Base URL

```
http://localhost:4000/api
```

## Authentication

All protected routes require a valid JWT token sent via:

- **Cookie**: `access_token` (httpOnly)
- **Header**: `Authorization: Bearer <token>`

## Response Format

### Success

```json
{
  "success": true,
  "data": { ... }
}
```

### Error

```json
{
  "success": false,
  "error": "Error message",
  "errors": { "field": ["validation error"] }
}
```

## HTTP Status Codes

| Code | Meaning                        |
| ---- | ------------------------------ |
| 200  | Success                        |
| 201  | Created                        |
| 400  | Bad Request (validation error) |
| 401  | Unauthorized                   |
| 403  | Forbidden (no permission)      |
| 404  | Not Found                      |
| 409  | Conflict (duplicate)           |
| 500  | Internal Server Error          |

## Legend

- 🔒 = Requires authentication
- `PERMISSION` = Requires specific permission (RBAC)

## Endpoints

- [Auth](auth.md)
- [Users](users.md)
- [Skills](skills.md)
- [Lessons](lessons.md)
- [Reports](reports.md)
- [Spaced Repetition](sr.md)
- [AI](ai.md)
- [Metrics](metrics.md)
