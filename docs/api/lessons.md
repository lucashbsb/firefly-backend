# Lessons API

Base path: `/api/lessons`

---

## GET `/user/:userId/workflow` 🔒

Get current lesson workflow state.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "lesson_id": "uuid",
    "day": 15,
    "status": "in_progress",
    "exercises": {
      "total": 30,
      "answered": 15,
      "remaining": 15
    },
    "chat": {
      "total": 5,
      "answered": 0,
      "remaining": 5
    },
    "can_proceed": true,
    "next_action": "answer_exercises"
  }
}
```

---

## GET `/user/:userId/session` 🔒

Get current lesson session with exercises.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "lesson": {
      "id": "uuid",
      "day": 15,
      "topic": "Business English",
      "theory": "..."
    },
    "exercises": [
      {
        "index": 1,
        "type": "fill_blank",
        "question": "She ___ to the meeting yesterday.",
        "options": ["go", "went", "gone"],
        "answered": false
      }
    ]
  }
}
```

---

## POST `/user/:userId/start` 🔒

Start a new lesson.

**Body:**

```json
{
  "day": 15
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "lesson_id": "uuid",
    "day": 15,
    "topic": "Business English",
    "phase": 2,
    "level": "B1",
    "theory": "...",
    "grammar_focus": ["present_perfect"],
    "vocabulary_focus": ["business_terms"],
    "exercises": [...]
  }
}
```

---

## POST `/user/:userId/answer` 🔒

Submit answer for single exercise.

**Body:**

```json
{
  "exercise_index": 1,
  "answer": "went"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "exercises_answered": 16,
    "exercises_total": 30,
    "all_answered": false
  }
}
```

---

## POST `/user/:userId/submit` 🔒

Submit all exercises.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "status": "exercises_completed",
    "next_action": "correct_exercises"
  }
}
```

---

## POST `/user/:userId/correct` 🔒

Request AI correction for exercises.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "corrections": [
      {
        "exercise_index": 1,
        "is_correct": true,
        "user_answer": "went",
        "correct_answer": "went",
        "feedback": "Perfect!"
      },
      {
        "exercise_index": 2,
        "is_correct": false,
        "user_answer": "go",
        "correct_answer": "went",
        "error_type": "verb_tense",
        "feedback": "Use past tense for completed actions."
      }
    ],
    "score": 85,
    "status": "corrected"
  }
}
```

---

## POST `/user/:userId/chat/start` 🔒

Start conversation practice.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "chat_id": "uuid",
    "question": "Tell me about your last business meeting.",
    "context": "We are practicing business English vocabulary."
  }
}
```

---

## POST `/user/:userId/chat/answer` 🔒

Send message in conversation.

**Body:**

```json
{
  "message": "Last week I had a meeting with our sales team."
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "ai_response": "Great! What topics did you discuss?",
    "corrections": [
      {
        "original": "...",
        "corrected": "...",
        "explanation": "..."
      }
    ],
    "chat_remaining": 4
  }
}
```
