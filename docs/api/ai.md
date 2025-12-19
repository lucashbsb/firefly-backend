# AI API

Base path: `/api/ai`

---

## GET `/user/:userId/settings` 🔒

Get user AI settings.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "provider": "openai",
    "model": "gpt-4o-mini",
    "temperature": 0.7,
    "max_tokens": 2000,
    "has_custom_key": false
  }
}
```

---

## PATCH `/user/:userId/settings` 🔒

Update AI settings.

**Body:**

```json
{
  "provider": "anthropic",
  "model": "claude-3-sonnet",
  "temperature": 0.8,
  "max_tokens": 3000,
  "api_key": "sk-ant-..."
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "provider": "anthropic",
    "model": "claude-3-sonnet",
    "temperature": 0.8,
    "max_tokens": 3000,
    "has_custom_key": true
  }
}
```

---

## POST `/user/:userId/lesson` 🔒

Generate lesson via AI.

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
    "topic": "Business Communication",
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

## POST `/user/:userId/correct` 🔒

Correct answers via AI.

**Body:**

```json
{
  "exercises": [
    {
      "question": "She ___ to work yesterday.",
      "user_answer": "go",
      "correct_answer": "went"
    }
  ]
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "corrections": [
      {
        "is_correct": false,
        "user_answer": "go",
        "correct_answer": "went",
        "error_type": "verb_tense",
        "feedback": "Use past tense for actions completed in the past."
      }
    ]
  }
}
```

---

## POST `/user/:userId/chat` 🔒

Chat with AI tutor.

**Body:**

```json
{
  "message": "How do I use present perfect?",
  "history": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi! How can I help you today?" }
  ]
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "response": "Present perfect is used for...",
    "corrections": [],
    "suggestions": ["Try using it in a sentence."]
  }
}
```

---

## POST `/user/:userId/report` 🔒

Generate report via AI.

**Body:**

```json
{
  "day": 15,
  "lesson_id": "uuid"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "summary": "Excellent progress today!",
    "score": 85,
    "perceived_level": {
      "overall": "B1",
      "grammar": "B1",
      "vocabulary": "B2"
    },
    "strengths": ["verb_tenses"],
    "weaknesses": ["conditionals"],
    "recommendations": [...]
  }
}
```

---

## POST `/user/:userId/completion` 🔒

Raw AI completion.

**Body:**

```json
{
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "Explain conditionals in English." }
  ],
  "temperature": 0.7,
  "max_tokens": 1000,
  "json_mode": false
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "content": "Conditionals in English are...",
    "model": "gpt-4o-mini",
    "provider": "openai",
    "usage": {
      "prompt_tokens": 50,
      "completion_tokens": 200,
      "total_tokens": 250
    }
  }
}
```
