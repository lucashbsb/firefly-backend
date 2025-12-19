# Adaptive Learning Flow

Building learning context for personalized AI-generated lessons.

## Context Building Flow

```
 AIService              AdaptiveLearning            Repositories
     │                        │                          │
     │ buildLearningContext() │                          │
     ├───────────────────────>│                          │
     │                        │                          │
     │                        │ Parallel queries         │
     │                        ├─────────────────────────>│
     │                        │                          │
     │                        │ ┌────────────────────────┤
     │                        │ │ userSkillRepository    │
     │                        │ │ recentErrors           │
     │                        │ │ recurringErrors        │
     │                        │ │ errorsByType           │
     │                        │ │ recentLessons          │
     │                        │ │ weeklyMetrics          │
     │                        │ │ lastReport             │
     │                        │ │ streak                 │
     │                        │ └────────────────────────┤
     │                        │                          │
     │                        │<─────────────────────────│
     │                        │                          │
     │                        │ Categorize skills        │
     │                        ├──────┐                   │
     │                        │      │ mastered (≥80%)   │
     │                        │      │ learning (40-79%) │
     │                        │      │ weak (<40%)       │
     │                        │      │ not_started       │
     │                        │<─────┘                   │
     │                        │                          │
     │                        │ Calculate recommendations│
     │                        ├──────┐                   │
     │                        │      │                   │
     │                        │<─────┘                   │
     │                        │                          │
     │ LearningContext        │                          │
     │<───────────────────────│                          │
```

## Context Structure

```typescript
interface LearningContext {
  user_id: string;
  current_day: number;
  current_level: string;
  target_level: string;
  previous_report: Report;

  skills_context: {
    mastered: string[]; // ≥80% mastery
    learning: string[]; // 40-79% mastery
    weak: string[]; // <40% mastery
    not_started: string[]; // Never practiced
    recommended: string[]; // Priority skills
  };

  error_patterns: {
    recurring: Error[]; // Frequent mistakes
    recent: Error[]; // Last 7 days
    by_type: Record<string, number>;
  };

  recent_lessons: Lesson[];

  metrics: {
    weekly: WeeklyStats;
    accuracy_trend: number[];
    streak: number;
  };

  curriculum_skills: Skill[];
}
```

## Skill Categorization

```typescript
const mastered = userSkills
  .filter((s) => s.mastery_level >= 80)
  .map((s) => s.skill_id);

const learning = userSkills
  .filter((s) => s.mastery_level >= 40 && s.mastery_level < 80)
  .map((s) => s.skill_id);

const weak = userSkills
  .filter((s) => s.mastery_level > 0 && s.mastery_level < 40)
  .map((s) => s.skill_id);

const notStarted = curriculumSkills
  .filter((s) => !practiceSkillCodes.includes(s.code))
  .map((s) => s.code);
```

## Skill Mastery Levels

```
  0%                    40%                   80%                  100%
   │                     │                     │                     │
   ├─────────────────────┼─────────────────────┼─────────────────────┤
   │       WEAK          │      LEARNING       │      MASTERED       │
   │    (priority)       │    (continue)       │     (maintain)      │
   └─────────────────────┴─────────────────────┴─────────────────────┘
```

## Recommendation Algorithm

```typescript
calculateRecommendedSkills(
  curriculumSkills: SkillData[],
  practicedCodes: string[],
  weakSkillIds: string[],
  lastReport: Report
): string[] {
  const recommendations: string[] = [];

  // 1. Weak skills (highest priority)
  recommendations.push(...weakSkillIds);

  // 2. Skills from last report recommendations
  if (lastReport?.ai_recommendations) {
    recommendations.push(...lastReport.ai_recommendations);
  }

  // 3. Not started skills (by curriculum order)
  const notStarted = curriculumSkills
    .filter(s => !practicedCodes.includes(s.code))
    .map(s => s.code);

  recommendations.push(...notStarted);

  return [...new Set(recommendations)].slice(0, 10);
}
```

## Error Pattern Analysis

```typescript
interface ErrorPatterns {
  recurring: Array<{
    type: string;
    subtype: string;
    count: number;
    last_occurrence: string;
  }>;

  recent: Array<{
    type: string;
    user_answer: string;
    correct_answer: string;
    date: string;
  }>;

  by_type: Record<string, number>;
}
```

## Error Categories

| Category      | Examples                           |
| ------------- | ---------------------------------- |
| `grammar`     | Verb tense, subject-verb agreement |
| `vocabulary`  | Wrong word choice, spelling        |
| `syntax`      | Word order, sentence structure     |
| `punctuation` | Missing/wrong punctuation          |
| `spelling`    | Typos, common misspellings         |

## How Context is Used

The `LearningContext` is sent to the AI for:

1. **Lesson Generation**: Personalized exercises based on weak skills
2. **Difficulty Adjustment**: Match exercises to current level
3. **Content Selection**: Avoid repetition, focus on gaps
4. **Report Generation**: Comprehensive progress analysis
