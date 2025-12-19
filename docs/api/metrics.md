# Metrics API

Base path: `/api/metrics`

---

## GET `/user/:userId/weekly` 🔒

Get weekly statistics.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "lessons_completed": 5,
    "exercises_completed": 150,
    "accuracy_rate": 0.82,
    "study_time_minutes": 180,
    "skills_practiced": 12,
    "streak_days": 7
  }
}
```

---

## GET `/user/:userId/monthly` 🔒

Get monthly statistics.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "lessons_completed": 22,
    "exercises_completed": 660,
    "accuracy_rate": 0.85,
    "study_time_minutes": 720,
    "skills_mastered": 8,
    "level_progress": {
      "start": "B1",
      "current": "B2"
    }
  }
}
```

---

## GET `/user/:userId/trend` 🔒

Get progress trend over time.

**Query params:**

- `days`: Number of days (default: 30)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "accuracy_trend": [0.75, 0.78, 0.8, 0.82, 0.85],
    "lessons_per_week": [4, 5, 6, 5, 7],
    "improvement_rate": 0.13
  }
}
```

---

## GET `/user/:userId/errors` 🔒

Get error patterns analysis.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "by_type": {
      "verb_tense": 15,
      "preposition": 8,
      "article": 5
    },
    "recurring": [
      {
        "type": "verb_tense",
        "subtype": "past_simple",
        "count": 10,
        "last_occurrence": "2024-01-15"
      }
    ],
    "recent": [
      {
        "type": "preposition",
        "user_answer": "in Monday",
        "correct_answer": "on Monday",
        "date": "2024-01-15"
      }
    ]
  }
}
```

---

## GET `/user/:userId/lessons` 🔒

Get lesson history.

**Query params:**

- `limit`: Number of lessons (default: 10)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "day": 15,
      "date": "2024-01-15",
      "topic": "Business English",
      "score": 85,
      "skills_covered": ["PRESENT_PERFECT", "BUSINESS_VOCAB"]
    }
  ]
}
```

---

## GET `/user/:userId/context` 🔒

Get learning context (for AI).

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "current_level": "B1",
    "target_level": "C1",
    "skills_context": {
      "mastered": ["PRESENT_SIMPLE", "PAST_SIMPLE"],
      "learning": ["PRESENT_PERFECT", "CONDITIONALS"],
      "weak": ["SUBJUNCTIVE"],
      "recommended": ["MODAL_VERBS"]
    },
    "error_patterns": {
      "recurring": [...],
      "by_type": {...}
    }
  }
}
```

---

## GET `/user/:userId/dashboard` 🔒

Get dashboard data (aggregated metrics).

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "streak": {
      "current": 7,
      "longest": 15
    },
    "today": {
      "lessons_completed": 1,
      "exercises_done": 30,
      "sr_cards_reviewed": 12
    },
    "weekly": {
      "lessons": 5,
      "accuracy": 0.85,
      "study_time": 180
    },
    "skills": {
      "mastered": 25,
      "learning": 10,
      "weak": 3
    },
    "level": {
      "current": "B1",
      "target": "C1",
      "progress": 0.45
    }
  }
}
```
