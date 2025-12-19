# Spaced Repetition Flow

Implementation of the SM-2 algorithm for spaced repetition.

## Sequence Diagram

```
 User                    Controller              SRService                Cards
  │                          │                      │                       │
  │ GET /sr/cards            │                      │                       │
  ├─────────────────────────>│                      │                       │
  │                          │ getCardsForReview()  │                       │
  │                          ├─────────────────────>│                       │
  │                          │                      │ Query due cards       │
  │                          │                      │ (next_review <= today)│
  │                          │                      ├──────────────────────>│
  │                          │                      │<──────────────────────│
  │                          │<─────────────────────│                       │
  │ Cards due for review     │                      │                       │
  │<─────────────────────────│                      │                       │
  │                          │                      │                       │
  │ POST /sr/cards/:id/review│                      │                       │
  │ { quality: 0-5 }         │                      │                       │
  ├─────────────────────────>│                      │                       │
  │                          │ reviewCard()         │                       │
  │                          ├─────────────────────>│                       │
  │                          │                      │                       │
  │                          │                      │ calculateNextReview() │
  │                          │                      ├──────┐                │
  │                          │                      │      │ SM-2 Algorithm │
  │                          │                      │<─────┘                │
  │                          │                      │                       │
  │                          │                      │ Update card state     │
  │                          │                      │ Create review log     │
  │                          │                      ├──────────────────────>│
  │                          │<─────────────────────│                       │
  │ Next review state        │                      │                       │
  │<─────────────────────────│                      │                       │
```

## SM-2 Algorithm

```typescript
calculateNextReview(quality: number, cardState: SRCardState): NextReviewState {
  let { ease_factor, interval_days, repetitions } = cardState;

  if (quality < 3) {
    // Failed: reset to learning
    repetitions = 0;
    interval_days = 1;
  } else {
    // Success: increase interval
    interval_days = this.calculateNewInterval(repetitions, interval_days, ease_factor);
    repetitions += 1;
  }

  // Update ease factor
  ease_factor = this.calculateNewEaseFactor(ease_factor, quality);

  return {
    ease_factor: Math.round(ease_factor * 100) / 100,
    interval_days,
    repetitions,
    next_review_date: this.calculateNextReviewDate(interval_days),
    status: quality < 3 ? 'learning' : 'review'
  };
}
```

## Interval Calculation

```typescript
calculateNewInterval(reps: number, interval: number, ease: number): number {
  if (reps === 0) return 1;      // First review: 1 day
  if (reps === 1) return 6;      // Second review: 6 days
  return Math.round(interval * ease);  // Subsequent: interval * ease
}
```

## Ease Factor Calculation

```typescript
calculateNewEaseFactor(currentEase: number, quality: number): number {
  const newEase = currentEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  return Math.max(newEase, 1.3);  // Minimum ease: 1.3
}
```

## Quality Scale

| Value | Meaning                         | Effect                         |
| ----- | ------------------------------- | ------------------------------ |
| 0     | Complete blackout               | Reset to learning              |
| 1     | Wrong, recognized after answer  | Reset to learning              |
| 2     | Wrong, easy recall after answer | Reset to learning              |
| 3     | Correct with serious difficulty | Continue, decrease ease        |
| 4     | Correct with hesitation         | Continue, slight ease decrease |
| 5     | Perfect response                | Continue, increase ease        |

## Card States

```
   ┌─────────┐
   │   NEW   │
   └────┬────┘
        │ First review
        ▼
  ┌──────────┐
  │ LEARNING │◄──────┐
  └────┬─────┘       │
       │             │ quality < 3
       │ quality >= 3│
       ▼             │
   ┌────────┐        │
   │ REVIEW ├────────┘
   └────────┘
```

## Card State Interface

```typescript
interface SRCardState {
  card_id: string;
  user_id: string;
  ease_factor: number; // Default: 2.5
  interval_days: number; // Days until next review
  repetitions: number; // Successful review count
  next_review_date: string;
  status: "new" | "learning" | "review";
}
```

## Next Review State

```typescript
interface NextReviewState {
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_date: string;
  status: "learning" | "review";
}
```

## Auto Card Creation

Cards can be auto-created from:

1. **Lesson Errors**: `POST /sr/user/:id/cards/from-errors`
2. **Vocabulary**: `POST /sr/user/:id/cards/from-vocabulary`

```typescript
async createCardsFromErrors(
  userId: string,
  lessonId: string,
  errors: Array<{ incorrect: string; correct: string; context?: string }>
): Promise<string[]> {
  const cards: string[] = [];

  for (const error of errors) {
    const cardId = await this.createCard(userId, {
      card_type: 'error_correction',
      front: error.incorrect,
      back: error.correct,
      context: error.context,
      source_type: 'lesson',
      source_id: lessonId
    });
    cards.push(cardId);
  }

  return cards;
}
```
