# Lesson Workflow

The lesson flow is a state machine with defined transitions.

## States

| Status                | Description                         |
| --------------------- | ----------------------------------- |
| `created`             | Lesson generated, waiting exercises |
| `in_progress`         | User answering exercises            |
| `exercises_completed` | All exercises answered              |
| `corrected`           | AI correction completed             |
| `chat_in_progress`    | Conversation practice               |
| `chat_completed`      | Conversation finished               |
| `completed`           | Lesson fully completed              |

## State Diagram

```
   ┌──────────┐
   │  START   │
   └────┬─────┘
        │ POST /lessons/start
        ▼
   ┌──────────┐
   │ created  │
   └────┬─────┘
        │ POST /lessons/answer
        ▼
┌───────────────┐
│  in_progress  │◄──────┐
└───────┬───────┘       │
        │               │ more exercises
        │ all answered  │
        ▼               │
┌───────────────────┐   │
│exercises_completed├───┘
└───────┬───────────┘
        │ POST /lessons/correct
        ▼
   ┌───────────┐
   │ corrected │
   └────┬──────┘
        │ POST /lessons/chat/start
        ▼
┌──────────────────┐
│ chat_in_progress │◄──────┐
└───────┬──────────┘       │
        │                  │ more questions
        │ all answered     │
        ▼                  │
  ┌────────────────┐       │
  │ chat_completed ├───────┘
  └───────┬────────┘
          │ POST /reports
          ▼
     ┌───────────┐
     │ completed │
     └───────────┘
```

## Sequence Diagram

```
 User                    Controller              Service                    AI
  │                          │                      │                       │
  │ POST /lessons/start      │                      │                       │
  ├─────────────────────────>│                      │                       │
  │                          │ startLesson()        │                       │
  │                          ├─────────────────────>│                       │
  │                          │                      │ Check active lesson   │
  │                          │                      ├──────┐                │
  │                          │                      │      │                │
  │                          │                      │<─────┘                │
  │                          │                      │                       │
  │                          │                      │ generateLesson()      │
  │                          │                      ├──────────────────────>│
  │                          │                      │                       │
  │                          │                      │ Lesson + Exercises    │
  │                          │                      │<──────────────────────│
  │                          │                      │                       │
  │                          │                      │ Save to DB            │
  │                          │                      ├──────┐                │
  │                          │                      │      │                │
  │                          │ LessonResponse       │<─────┘                │
  │                          │<─────────────────────│                       │
  │ 200 OK + Lesson          │                      │                       │
  │<─────────────────────────│                      │                       │
  │                          │                      │                       │
  │ POST /lessons/answer     │                      │                       │
  │ (repeat for each)        │                      │                       │
  ├─────────────────────────>│                      │                       │
  │                          │ answerExercise()     │                       │
  │                          ├─────────────────────>│                       │
  │                          │                      │ Save answer           │
  │                          │                      │ Update progress       │
  │                          │<─────────────────────│                       │
  │<─────────────────────────│                      │                       │
  │                          │                      │                       │
  │ POST /lessons/correct    │                      │                       │
  ├─────────────────────────>│                      │                       │
  │                          │ correctExercises()   │                       │
  │                          ├─────────────────────>│                       │
  │                          │                      │ correctAnswers()      │
  │                          │                      ├──────────────────────>│
  │                          │                      │ Corrections           │
  │                          │                      │<──────────────────────│
  │                          │                      │                       │
  │                          │                      │ Update metrics        │
  │                          │                      │ Log errors            │
  │                          │<─────────────────────│                       │
  │<─────────────────────────│                      │                       │
  │                          │                      │                       │
  │ POST /lessons/chat/start │                      │                       │
  ├─────────────────────────>│                      │                       │
  │                          │ startChat()          │                       │
  │                          ├─────────────────────>│                       │
  │                          │                      │ Generate questions    │
  │                          │<─────────────────────│                       │
  │<─────────────────────────│                      │                       │
  │                          │                      │                       │
  │ POST /lessons/chat/answer│                      │                       │
  │ (repeat for each)        │                      │                       │
  ├─────────────────────────>│                      │                       │
  │                          │ answerChat()         │                       │
  │                          ├─────────────────────>│                       │
  │                          │                      │ chat()                │
  │                          │                      ├──────────────────────>│
  │                          │                      │<──────────────────────│
  │                          │<─────────────────────│                       │
  │<─────────────────────────│                      │                       │
```

## Next Action Logic

```typescript
switch (status) {
  case "created":
    return "answer_exercises";
  case "in_progress":
    return exercisesRemaining > 0 ? "answer_exercises" : "submit_exercises";
  case "exercises_completed":
    return "correct_exercises";
  case "corrected":
    return "start_chat";
  case "chat_in_progress":
    return chatRemaining > 0 ? "answer_chat" : "finish_chat";
  case "chat_completed":
    return "generate_report";
  case "completed":
    return "start_new_lesson";
}
```

## Workflow State Response

```typescript
interface LessonWorkflowState {
  lesson_id: string;
  day: number;
  status: LessonStatus;
  exercises: {
    total: number;
    answered: number;
    remaining: number;
  };
  chat: {
    total: number;
    answered: number;
    remaining: number;
  };
  can_proceed: boolean;
  next_action: string;
}
```
