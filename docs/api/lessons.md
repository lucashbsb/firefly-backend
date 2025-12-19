# Lessons API

Base path: `/api/lessons`

---

## GET `/:id` 🔒

Get complete lesson data by ID (same format as `/session`).

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "32fbaf91-bb19-429a-8cce-ba0e5bb53ffc",
    "day": 2,
    "phase": 0,
    "level": "A2",
    "topic": "present_simple",
    "theory": "## Present Simple (A2 Review)...",
    "grammar_focus": ["present_simple"],
    "vocabulary_focus": ["daily routines", "work and study", "home and family"],
    "status": "created",
    "progress": {
      "exercises_answered": 0,
      "exercises_total": 30,
      "chat_questions_answered": 0,
      "chat_questions_total": 3
    },
    "exercises": [
      {
        "id": "7d9b6597-acb3-4d1a-8587-4d5ec8385994",
        "hint": "Use the base verb with I/you/we/they.",
        "type": "fill-blank",
        "options": null,
        "question": "I ____ (work) in a small office.",
        "difficulty": 1,
        "skill_tags": ["present_simple_form"],
        "explanation": "With 'I', the present simple affirmative uses the base form: 'I work'.",
        "user_answer": null,
        "correct_answer": "work"
      }
    ],
    "corrections": null,
    "chat_messages": [],
    "report": null,
    "workflow": {
      "lesson_id": "32fbaf91-bb19-429a-8cce-ba0e5bb53ffc",
      "day": 2,
      "status": "created",
      "exercises": {
        "total": 30,
        "answered": 0,
        "remaining": 30
      },
      "chat": {
        "total": 3,
        "answered": 0,
        "remaining": 3
      },
      "can_proceed": true,
      "next_action": "answer_exercises"
    }
  }
}
```

**Response:** `404 Not Found`

```json
{
  "success": false,
  "error": "Lesson not found"
}
```

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

## GET `/user/:userId/active` 🔒

Get active (incomplete) lesson.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "day": 15,
    "topic": "Present Simple",
    "phase": 2,
    "level": "B1",
    "theory": "...",
    "exercises": [...]
  }
}
```

**Response:** `404 Not Found`

```json
{
  "success": false,
  "error": "No active lesson found"
}
```

---

## GET `/user/:userId/history?page=1&limit=20` 🔒

Get paginated lesson history with reports or lesson data.

**Query Parameters:**

- `page` (optional): Page number. Default: 1
- `limit` (optional): Items per page. Default: 20

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "day": 15,
      "topic": "Present Simple",
      "status": "completed",
      "completed": true,
      "report": {
        "performance_score": 85,
        "accuracy_rate": 80,
        "exercises_correct": 24,
        "exercises_total": 30,
        "strengths": ["present_simple", "verb_to_be"],
        "weaknesses": ["past_simple"],
        "perceived_level": {
          "grammar": "B1",
          "vocabulary": "A2",
          "overall": "B1"
        },
        "next_day_focus": ["past_simple", "irregular_verbs"]
      }
    },
    {
      "day": 14,
      "topic": "Past Tense",
      "status": "in_progress",
      "completed": false,
      "lesson": {
        "id": "uuid",
        "phase": 2,
        "level": "B1",
        "theory": "...",
        "grammar_focus": ["past_simple"],
        "vocabulary_focus": ["daily_actions"],
        "exercises_answered": 15,
        "exercises_total": 30
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
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
