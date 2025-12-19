# Skills API

Base path: `/api/skills`

---

## GET `/` 🔒

List all available skills.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "PRESENT_SIMPLE",
      "name": "Present Simple",
      "category": "grammar",
      "level": "A1"
    }
  ]
}
```

---

## GET `/user/:userId` 🔒

Get user's skill progress.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "skill_id": "uuid",
      "skill_code": "PRESENT_SIMPLE",
      "mastery_level": 85,
      "times_practiced": 12,
      "last_practiced": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

## GET `/user/:userId/mastered` 🔒

Get skills user has mastered (≥80% mastery).

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "skill_id": "uuid",
      "skill_code": "PRESENT_SIMPLE",
      "mastery_level": 92
    }
  ]
}
```

---

## GET `/user/:userId/weak` 🔒

Get skills user struggles with (<40% mastery).

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "skill_id": "uuid",
      "skill_code": "SUBJUNCTIVE",
      "mastery_level": 25,
      "error_count": 8
    }
  ]
}
```

---

## GET `/user/:userId/categories` 🔒

Get skills organized by category.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "grammar": [{ "code": "PRESENT_SIMPLE", "mastery": 85 }],
    "vocabulary": [{ "code": "BUSINESS_VOCAB", "mastery": 60 }]
  }
}
```

---

## POST `/user/:userId/track` 🔒

Track skill practice.

**Body:**

```json
{
  "skill_id": "uuid",
  "correct": true,
  "exercise_type": "fill_blank"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "skill_id": "uuid",
    "new_mastery": 87
  }
}
```
