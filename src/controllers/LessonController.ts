import { Request, Response } from 'express';
import { lessonService } from '../services';
import { lessonRepository } from '../repositories';

export class LessonController {
  async getLessonById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const lesson = await lessonRepository.findById(id);

    if (!lesson) {
      res.status(404).json({ success: false, error: 'Lesson not found' });
      return;
    }

    const exercises = lesson.exercises_data || [];
    const correctionsArray = lesson.corrections?.corrections || [];
    const chatMessages = lesson.chat_messages || [];
    const report = lesson.report || null;

    const exercisesAnswered = exercises.filter((e: any) => e.user_answer).length;
    const chatQuestionsAnswered = chatMessages.filter((m: any) => m.role === 'user').length;
    const totalChatQuestions = 3;

    const response = {
      id: lesson.id,
      day: lesson.day,
      phase: lesson.phase,
      level: lesson.level,
      topic: lesson.topic,
      theory: lesson.theory,
      grammar_focus: lesson.grammar_focus,
      vocabulary_focus: lesson.vocabulary_focus,
      status: lesson.status,
      progress: {
        exercises_answered: exercisesAnswered,
        exercises_total: exercises.length,
        chat_questions_answered: chatQuestionsAnswered,
        chat_questions_total: totalChatQuestions
      },
      exercises: exercises,
      corrections: correctionsArray.length > 0 ? correctionsArray : null,
      chat_messages: chatMessages,
      report: report,
      workflow: {
        lesson_id: lesson.id,
        day: lesson.day,
        status: lesson.status,
        exercises: {
          total: exercises.length,
          answered: exercisesAnswered,
          remaining: exercises.length - exercisesAnswered
        },
        chat: {
          total: totalChatQuestions,
          answered: chatQuestionsAnswered,
          remaining: totalChatQuestions - chatQuestionsAnswered
        },
        can_proceed: true,
        next_action: lesson.status === 'completed' ? 'view_report' : 
                     lesson.status === 'chat_completed' ? 'generate_report' :
                     lesson.status === 'corrected' ? 'start_chat' :
                     lesson.status === 'exercises_completed' ? 'correct_exercises' :
                     exercisesAnswered >= exercises.length ? 'submit_exercises' :
                     'answer_exercises'
      }
    };

    res.json({ success: true, data: response });
  }

  async getActive(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const lesson = await lessonRepository.findActiveByUser(userId);

    if (!lesson) {
      res.status(404).json({ success: false, error: 'No active lesson found' });
      return;
    }

    const data = await lessonService.getLessonData(userId, lesson.id);
    res.json({ success: true, data });
  }

  async getWorkflowState(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const state = await lessonService.getWorkflowState(userId);

    if (!state) {
      res.json({ 
        success: true, 
        data: { 
          has_active_lesson: false, 
          next_action: 'start_lesson' 
        } 
      });
      return;
    }

    res.json({ success: true, data: { has_active_lesson: true, ...state } });
  }

  async startLesson(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const lesson = await lessonService.startLesson(userId);
    const state = await lessonService.getWorkflowState(userId);

    res.json({ 
      success: true, 
      data: { 
        lesson,
        workflow: state
      } 
    });
  }

  async answerExercise(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const { exercise_id, exercise_index, answer } = req.body;

    if ((!exercise_id && exercise_index === undefined) || !answer) {
      res.status(400).json({ 
        success: false, 
        error: 'exercise_id (or exercise_index) and answer are required' 
      });
      return;
    }

    const result = await lessonService.answerExercise(userId, exercise_id, answer, exercise_index);
    const state = await lessonService.getWorkflowState(userId);

    res.json({ 
      success: true, 
      data: { 
        ...result,
        workflow: state
      } 
    });
  }

  async submitExercises(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const { answers } = req.body;

    if (answers && Array.isArray(answers)) {
      await lessonService.resetLessonFlow(userId);
      for (const item of answers) {
        if (item.exercise_id && item.answer) {
          await lessonService.answerExercise(userId, item.exercise_id, item.answer);
        }
      }
    }

    const result = await lessonService.submitExercises(userId);
    const state = await lessonService.getWorkflowState(userId);

    res.json({ 
      success: true, 
      data: { 
        ...result,
        workflow: state
      } 
    });
  }

  async correctExercises(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const corrections = await lessonService.correctExercises(userId);
    const state = await lessonService.getWorkflowState(userId);

    res.json({ 
      success: true, 
      data: { 
        corrections,
        workflow: state
      } 
    });
  }

  async startChat(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const chat = await lessonService.startChat(userId);
    const state = await lessonService.getWorkflowState(userId);

    res.json({ 
      success: true, 
      data: { 
        ...chat,
        workflow: state
      } 
    });
  }

  async answerChat(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const { message } = req.body;

    if (!message) {
      res.status(400).json({ 
        success: false, 
        error: 'message is required' 
      });
      return;
    }

    const result = await lessonService.answerChat(userId, message);
    const lesson = await lessonRepository.findLastCompletedByUser(userId);
    const state = lesson ? await lessonService.getWorkflowState(userId, lesson.id) : await lessonService.getWorkflowState(userId);

    res.json({ 
      success: true, 
      data: { 
        ...result,
        workflow: state
      } 
    });
  }

  async getSession(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const day = parseInt(req.query.day as string);

    if (!day) {
      res.status(400).json({ success: false, error: 'day is required' });
      return;
    }

    const session = await lessonService.getSession(userId, day);
    const state = await lessonService.getWorkflowState(userId);

    if (!session) {
      res.status(404).json({ success: false, error: 'No session found for this day' });
      return;
    }

    res.json({ 
      success: true, 
      data: { 
        ...session,
        workflow: state
      } 
    });
  }

  async getReport(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const report = await lessonService.generateReport(userId);

    res.json({ success: true, data: report });
  }

  async regenerateReport(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const { day } = req.body;

    if (!day) {
      res.status(400).json({ success: false, error: 'day is required' });
      return;
    }

    const report = await lessonService.regenerateReport(userId, parseInt(day));
    res.json({ success: true, data: report });
  }

  async getHistory(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await lessonService.getHistory(userId, page, limit);

    res.json({ success: true, ...result });
  }
}

export const lessonController = new LessonController();
