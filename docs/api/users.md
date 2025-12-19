# Users API

Base path: `/api/users`

---

## GET `/` 🔒 `USER_LIST`

List all users (admin only).

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "current_level": "B1",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

## POST `/`

Create user (public, same as register).

**Body:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

---

## GET `/:id` 🔒

Get user by ID.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "current_level": "B1",
    "target_level": "C1"
  }
}
```

---

## GET `/:id/streak` 🔒

Get user study streak.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "current_streak": 5,
    "longest_streak": 12,
    "last_study_date": "2024-01-15"
  }
}
```

---

## POST `/:id/streak` 🔒

Update user streak after study session.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "current_streak": 6,
    "longest_streak": 12
  }
}
```

---

## GET `/:id/progress` 🔒

Get user learning progress overview.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "total_lessons": 15,
    "completed_lessons": 12,
    "accuracy_rate": 0.85,
    "skills_mastered": 25
  }
}
```

---

## GET `/:id/history` 🔒

Get user learning history.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "day": 15,
      "date": "2024-01-15",
      "score": 85,
      "skills_practiced": ["PRESENT_PERFECT", "CONDITIONALS"]
    }
  ]
}
```

---

## GET `/:id/habits` 🔒

Get user study habits analysis.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "preferred_time": "morning",
    "average_session_duration": 25,
    "most_active_day": "monday"
  }
}
```

---

## PATCH `/:id/level` 🔒

Update user level.

**Body:**

```json
{
  "level": "B2"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "current_level": "B2"
  }
}
```
