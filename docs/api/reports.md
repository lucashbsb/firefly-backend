# Reports API

Base path: `/api/reports`

---

## GET `/user/:userId/latest` 🔒

Get latest daily report.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "day": 15,
    "date": "2024-01-15",
    "score": 85,
    "summary": "Excellent progress in present perfect usage.",
    "strengths": ["verb_tenses", "vocabulary"],
    "weaknesses": ["conditionals"],
    "recommendations": ["Practice third conditional"]
  }
}
```

---

## GET `/user/:userId/day/:day` 🔒

Get report for specific day.

**Params:**

- `day`: Day number (1-365)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "day": 15,
    "score": 85,
    "exercises_correct": 25,
    "exercises_total": 30,
    "skills_practiced": ["PRESENT_PERFECT", "BUSINESS_VOCAB"],
    "errors": [
      {
        "type": "verb_tense",
        "count": 3
      }
    ]
  }
}
```

---

## GET `/user/:userId/history` 🔒

Get report history.

**Query params:**

- `limit`: Number of reports (default: 10)
- `offset`: Pagination offset

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "day": 15,
      "date": "2024-01-15",
      "score": 85
    },
    {
      "day": 14,
      "date": "2024-01-14",
      "score": 78
    }
  ]
}
```

---

## POST `/user/:userId` 🔒

Create new report (AI generated).

**Body:**

```json
{
  "lesson_id": "uuid",
  "day": 15
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "day": 15,
    "score": 85,
    "summary": "...",
    "perceived_level": {
      "overall": "B1",
      "grammar": "B1",
      "vocabulary": "B2"
    },
    "ai_recommendations": [...]
  }
}
```

---

## PATCH `/user/:userId/lesson/:day` 🔒

Update lesson progress.

**Body:**

```json
{
  "score": 90,
  "completed": true
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "day": 15,
    "score": 90,
    "completed": true
  }
}
```
