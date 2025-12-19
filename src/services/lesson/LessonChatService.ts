import { aiService } from '../AIService';
import { lessonRepository } from '../../repositories';
import { LessonChatMessage } from '../../models/entities';

export class LessonChatService {
  async startChat(userId: string): Promise<{ message: string; question_number: number }> {
    const lesson = await lessonRepository.findActiveByUser(userId);
    if (!lesson) {
      throw new Error('No active lesson.');
    }

    if (lesson.status !== 'corrected' && lesson.status !== 'chat_in_progress') {
      throw new Error(`Cannot start chat in status: ${lesson.status}. Complete correction first.`);
    }

    const existingMessages = lesson.chat_messages || [];
    
    if (existingMessages.length > 0) {
      const lastAssistant = existingMessages
        .filter(m => m.role === 'assistant')
        .pop();
      
      if (lastAssistant) {
        const questionNumber = existingMessages.filter(m => m.role === 'assistant').length;
        return {
          message: lastAssistant.content,
          question_number: questionNumber
        };
      }
    }

    const exercises = lesson.exercises_data || [];
    const corrections = lesson.corrections?.corrections || [];

    const chatResponse = await aiService.generateChatQuestions({
      user_id: userId,
      day: lesson.day,
      lesson_topic: lesson.topic,
      lesson_theory: lesson.theory || '',
      exercises_summary: exercises.map((ex) => {
        const correction = corrections.find(c => c.exercise_id === ex.id);
        return {
          question: ex.question,
          user_answer: ex.user_answer || '',
          correct_answer: ex.correct_answer || '',
          is_correct: correction?.is_correct || false
        };
      }),
      question_number: 1
    });

    const newMessage: LessonChatMessage = {
      role: 'assistant',
      content: chatResponse.message,
      created_at: new Date().toISOString()
    };

    await lessonRepository.addChatMessage(lesson.id, newMessage);
    await lessonRepository.updateStatus(lesson.id, 'chat_in_progress');

    return {
      message: chatResponse.message,
      question_number: 1
    };
  }

  async answerChat(
    userId: string, 
    message: string,
    generateReportFn: (userId: string) => Promise<{ performance_score: number }>
  ): Promise<{
    response: string;
    question_number: number;
    is_complete: boolean;
  }> {
    const lesson = await lessonRepository.findActiveByUser(userId);
    if (!lesson) {
      throw new Error('No active lesson.');
    }

    if (lesson.status !== 'chat_in_progress') {
      throw new Error(`Cannot answer chat in status: ${lesson.status}.`);
    }

    const userMessage: LessonChatMessage = {
      role: 'user',
      content: message,
      created_at: new Date().toISOString()
    };

    await lessonRepository.addChatMessage(lesson.id, userMessage);

    const { answered } = await lessonRepository.incrementChatQuestionsAnswered(lesson.id);
    const progress = await lessonRepository.getProgress(lesson.id);
    
    if (answered >= progress!.chat_questions_total) {
      await lessonRepository.updateStatus(lesson.id, 'chat_completed');
      
      const report = await generateReportFn(userId);
      
      return {
        response: `Great conversation! Your lesson is now complete. Your score: ${report.performance_score}%.`,
        question_number: answered,
        is_complete: true
      };
    }

    const nextQuestionNumber = answered + 1;
    const updatedLesson = await lessonRepository.findActiveByUser(userId);
    const chatHistory = updatedLesson?.chat_messages || [];
    
    const chatResponse = await aiService.generateChatQuestions({
      user_id: userId,
      day: lesson.day,
      lesson_topic: lesson.topic,
      lesson_theory: lesson.theory || '',
      exercises_summary: [],
      question_number: nextQuestionNumber,
      previous_messages: chatHistory.map(m => ({ role: m.role, content: m.content }))
    });

    const assistantMessage: LessonChatMessage = {
      role: 'assistant',
      content: chatResponse.message,
      created_at: new Date().toISOString()
    };

    await lessonRepository.addChatMessage(lesson.id, assistantMessage);

    return {
      response: chatResponse.message,
      question_number: nextQuestionNumber,
      is_complete: false
    };
  }
}

export const lessonChatService = new LessonChatService();
