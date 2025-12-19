# Spaced Repetition API

Base path: `/api/sr`

---

## GET `/user/:userId/cards` 🔒

Get cards due for review.

**Query params:**

- `limit`: Max cards to return (default: 20)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "card_type": "vocabulary",
      "front": "What is the past of 'go'?",
      "back": "went",
      "context": "Irregular verb",
      "due_date": "2024-01-15T10:00:00Z",
      "interval_days": 1,
      "ease_factor": 2.5,
      "status": "review"
    }
  ]
}
```

---

## POST `/user/:userId/cards` 🔒

Create new SR card.

**Body:**

```json
{
  "card_type": "vocabulary",
  "front": "ubiquitous",
  "back": "present everywhere",
  "context": "Technology is ubiquitous in modern life.",
  "skill_tags": ["vocabulary", "advanced"]
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "card_type": "vocabulary",
    "front": "ubiquitous",
    "back": "present everywhere"
  }
}
```

---

## POST `/user/:userId/cards/:cardId/review` 🔒

Submit review for card.

**Body:**

```json
{
  "quality": 4
}
```

Quality scale:
| Value | Meaning |
|-------|---------|
| 0 | Complete blackout |
| 1 | Wrong, recognized after seeing answer |
| 2 | Wrong, easy to recall after seeing answer |
| 3 | Correct with serious difficulty |
| 4 | Correct with some hesitation |
| 5 | Perfect response |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "ease_factor": 2.6,
    "interval_days": 6,
    "repetitions": 2,
    "next_review_date": "2024-01-21",
    "status": "review"
  }
}
```

---

## GET `/user/:userId/stats` 🔒

Get SR statistics.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "total_cards": 150,
    "new_cards": 10,
    "learning_cards": 25,
    "review_cards": 115,
    "due_today": 12,
    "reviewed_today": 8
  }
}
```

---

## POST `/user/:userId/cards/from-errors` 🔒

Auto-create cards from lesson errors.

**Body:**

```json
{
  "lesson_id": "uuid"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "cards_created": 5,
    "card_ids": ["uuid1", "uuid2", "uuid3", "uuid4", "uuid5"]
  }
}
```

---

## POST `/user/:userId/cards/from-vocabulary` 🔒

Auto-create cards from vocabulary learned.

**Body:**

```json
{
  "lesson_id": "uuid"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "cards_created": 10,
    "card_ids": [...]
  }
}
```
