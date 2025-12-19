# Reports API

## Overview

Reports are generated automatically at the end of each lesson (after chat completion) and provide comprehensive analysis of student performance.

## Endpoints

### Get Current Report

Generates or retrieves the report for the active lesson.

```
GET /api/lessons/user/:userId/report
```

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": { ... }
}
```

---

### Regenerate Report

Re-runs the AI analysis on a completed lesson to generate an updated report with the latest prompt improvements.

```
POST /api/lessons/user/:userId/report/regenerate
```

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**

```json
{
  "day": 5
}
```

| Field | Type    | Required | Description                                        |
| ----- | ------- | -------- | -------------------------------------------------- |
| day   | integer | Yes      | The lesson day number to regenerate the report for |

**Response:**

```json
{
  "success": true,
  "data": {
    "performance_score": 62,
    "accuracy_rate": 63,
    "exercises_correct": 19,
    "exercises_partially_correct": 2,
    "exercises_wrong": 8,
    "exercises_blank": 1,
    "exercises_total": 30,

    "strengths": [
      "Solid understanding of verb 'to be' in present tense (am/is/are) - 100% accuracy",
      "Present simple conjugation with third person -s/-es/-ies is correct (works, studies)",
      "Subject vs object pronouns correctly identified (me vs I, He vs Him)"
    ],
    "weaknesses": [
      "CRITICAL: Spelling errors on common words (siblings, around, colleagues, fluently)",
      "CRITICAL: Not capitalizing 'English' - repeated 3 times across exercises and conversation",
      "Article sound rule: Uses 'an' before consonant sounds ('an university' instead of 'a university')"
    ],

    "recurring_errors": [
      {
        "error": "Spelling 'siblings' as 'sibilings'",
        "occurrences": 2,
        "exercises": [23, 28],
        "examples": ["sibilings", "sibilings"]
      },
      {
        "error": "Not capitalizing 'English'",
        "occurrences": 3,
        "exercises": [22, "conversation"],
        "examples": ["english", "english", "english"]
      }
    ],
    "error_breakdown": {
      "spelling": 6,
      "capitalization": 3,
      "articles": 2,
      "grammar": 2
    },

    "skill_scores": {
      "verb_to_be_present": 100,
      "verb_to_be_past": 100,
      "present_simple_affirmative": 100,
      "present_simple_questions": 50,
      "articles_a_an": 50,
      "spelling": 40
    },
    "skill_analysis": [
      {
        "skill": "verb_to_be_present",
        "total": 5,
        "correct": 5,
        "partial": 0,
        "wrong": 0,
        "accuracy": 100,
        "status": "mastered",
        "example_errors": []
      },
      {
        "skill": "spelling",
        "total": 10,
        "correct": 4,
        "partial": 0,
        "wrong": 6,
        "accuracy": 40,
        "status": "struggling",
        "example_errors": [
          "sibilings instead of siblings",
          "colleages instead of colleagues"
        ]
      }
    ],

    "exercise_type_analysis": [
      {
        "type": "fill-blank",
        "total": 10,
        "correct": 9,
        "partial": 0,
        "wrong": 1,
        "accuracy": 90
      },
      {
        "type": "translation-pt-en",
        "total": 8,
        "correct": 5,
        "partial": 1,
        "wrong": 2,
        "accuracy": 62
      }
    ],

    "difficulty_analysis": {
      "easy": { "total": 10, "correct": 10, "accuracy": 100 },
      "medium": { "total": 10, "correct": 7, "accuracy": 70 },
      "hard": { "total": 10, "correct": 2, "accuracy": 20 }
    },

    "conversation_notes": "Student understands basic question-answer format but makes consistent errors in written responses. Vocabulary is limited - uses simple words like 'cool' instead of more descriptive alternatives. Shows a pattern of rushing through answers without proofreading.",

    "next_day_focus": [
      "Intensive spelling drill on commonly misspelled words (siblings, colleagues, around)",
      "Article sound rules - a vs an based on pronunciation, not spelling",
      "Present simple vs present continuous distinction",
      "Capitalization rules for languages and nationalities",
      "Proofreading practice - finding errors before submitting"
    ],
    "homework": [
      "Write the word 'siblings' correctly 10 times",
      "Write the word 'colleagues' correctly 10 times",
      "Write 5 sentences using 'a' before words that START with vowels but SOUND like consonants: university, European, uniform",
      "Write 5 sentences about your daily routine using present simple (I work, I study - NOT 'I'm work')",
      "Write a paragraph (50 words minimum) about your family, correctly using: siblings, English, ordinal numbers"
    ],

    "perceived_level": {
      "overall": "B1",
      "overall_description": "Intermediate - Lower End",
      "skills": {
        "grammar_knowledge": {
          "level": "B1",
          "evidence": "Knows the rules (to be, present simple, pronouns)"
        },
        "grammar_application": {
          "level": "A2-B1",
          "evidence": "Some execution errors under pressure"
        },
        "vocabulary_recognition": {
          "level": "B1+",
          "evidence": "Understands complex words"
        },
        "vocabulary_production": {
          "level": "A2",
          "evidence": "Spelling disasters (sibilings, colleages)"
        },
        "writing_accuracy": {
          "level": "A2",
          "evidence": "Capitalization errors, sloppy output"
        },
        "conversation": {
          "level": "B1",
          "evidence": "'I'm work' instead of 'I work' - basic structure errors"
        }
      },
      "passive_level": "B1+/B2",
      "active_level": "A2/B1",
      "gap_analysis": "You have B1+ passive level (reading, listening) but A2-B1 active level (writing, speaking). True fluency = when passive and active levels match.",
      "prediction": "If you complete exercises daily, read corrections carefully, and practice conversation responses out loud, in 365 days you'll be C1 with professional fluency."
    },

    "motivational_note": "Day 1 score of 62% is a starting point, not a ceiling. Your foundations with verb 'to be' and basic present simple are solid. The main issues are carelessness and spelling - both fixable with discipline. Slow down. Proofread. Don't make the same mistake twice. Day 2 will target every weakness exposed today."
  }
}
```

**Error Responses:**

| Status | Error                                                 | Description                            |
| ------ | ----------------------------------------------------- | -------------------------------------- |
| 400    | `day is required`                                     | Missing day parameter in request body  |
| 404    | `Lesson for day X not found`                          | No lesson exists for the specified day |
| 400    | `Cannot regenerate report: lesson has no corrections` | Lesson has not been corrected yet      |

---

## Report Fields Reference

### Performance Metrics

| Field                       | Type    | Description                               |
| --------------------------- | ------- | ----------------------------------------- |
| performance_score           | integer | (correct + partial×0.5) / total × 100     |
| accuracy_rate               | integer | correct / answered × 100 (excludes blank) |
| exercises_correct           | integer | Count of fully correct answers            |
| exercises_partially_correct | integer | Count of partially correct answers        |
| exercises_wrong             | integer | Count of wrong answers                    |
| exercises_blank             | integer | Count of unanswered exercises             |
| exercises_total             | integer | Total exercises in lesson                 |

### Error Analysis

| Field            | Type   | Description                                          |
| ---------------- | ------ | ---------------------------------------------------- |
| recurring_errors | array  | Errors that appear 2+ times with exercise references |
| error_breakdown  | object | Count by error type (grammar, spelling, etc.)        |

### Recurring Error Object

| Field       | Type    | Description                                        |
| ----------- | ------- | -------------------------------------------------- |
| error       | string  | Description of the recurring error pattern         |
| occurrences | integer | Number of times this error occurred                |
| exercises   | array   | Exercise numbers or locations where error occurred |
| examples    | array   | Actual examples of the error                       |

### Skill Analysis

| Field          | Type   | Description                             |
| -------------- | ------ | --------------------------------------- |
| skill_scores   | object | Percentage accuracy per skill           |
| skill_analysis | array  | Detailed analysis with status per skill |

### Skill Status Values

| Status     | Accuracy Range |
| ---------- | -------------- |
| mastered   | 90%+           |
| developing | 70-89%         |
| needs_work | 50-69%         |
| struggling | <50%           |

### Level Assessment

| Field                               | Type   | Description                           |
| ----------------------------------- | ------ | ------------------------------------- |
| perceived_level.overall             | string | Overall CEFR level (A1-C2)            |
| perceived_level.overall_description | string | Human-readable level description      |
| perceived_level.skills              | object | Individual skill levels with evidence |
| perceived_level.passive_level       | string | Comprehension ability level           |
| perceived_level.active_level        | string | Production ability level              |
| perceived_level.gap_analysis        | string | Analysis of passive vs active gap     |
| perceived_level.prediction          | string | Prediction for improvement            |

### Recommendations

| Field              | Type   | Description                            |
| ------------------ | ------ | -------------------------------------- |
| next_day_focus     | array  | 3-5 priority skills for tomorrow       |
| homework           | array  | Specific writing exercises to practice |
| conversation_notes | string | Analysis of conversational English     |
| motivational_note  | string | Personalized, specific encouragement   |

---

## Data Flow

```
Lesson Completed → Pre-process Data → AI Analysis → Report Saved
```

### Pre-processing

Before sending to AI, the backend:

1. **Computes stats**: correct, partial, wrong, blank counts
2. **Builds skill breakdown**: accuracy per skill tag
3. **Builds type breakdown**: accuracy per exercise type
4. **Builds difficulty breakdown**: accuracy per difficulty level
5. **Compiles error breakdown**: count per error type
6. **Formats wrong answers**: compact format with all details
7. **Formats conversation**: teacher/student exchange format

This pre-processing reduces token usage and ensures accurate metrics.
