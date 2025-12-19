import { aiService } from '../AIService';
import { 
  lessonRepository, 
  exerciseRepository, 
  answerRepository,
  lessonChatRepository
} from '../../repositories';

export class LessonChatService {
  async startChat(userId: string): Promise<{ message: string; question_number: number }> {
    const lesson = await lessonRepository.findActiveByUser(userId);
    if (!lesson) {
      throw new Error('No active lesson.');
    }

    if (lesson.status !== 'corrected' && lesson.status !== 'chat_in_progress') {
      throw new Error(`Cannot start chat in status: ${lesson.status}. Complete correction first.`);
    }

    const existingMessages = await lessonChatRepository.findByLesson(lesson.id);
    
    if (existingMessages.length > 0) {
      const lastAssistant = await lessonChatRepository.getLastAssistantQuestion(lesson.id);
      if (lastAssistant) {
        return {
          message: lastAssistant.content,
          question_number: lastAssistant.question_number || 1
        };
      }
    }

    const exercises = await exerciseRepository.findByLessonId(lesson.id);
    const userAnswers = await answerRepository.findByUserAndExerciseIds(userId, exercises.map(e => e.id));

    const chatResponse = await aiService.generateChatQuestions({
      user_id: userId,
      day: lesson.day,
      lesson_topic: lesson.topic,
      lesson_theory: lesson.theory || '',
      exercises_summary: exercises.map((ex) => {
        const answer = userAnswers.find(a => a.exercise_id === ex.id);
        return {
          question: ex.question,
          user_answer: answer?.answer || '',
          correct_answer: ex.correct_answer || '',
          is_correct: answer?.is_correct || false
        };
      }),
      question_number: 1
    });

    await lessonChatRepository.addMessage({
      lesson_id: lesson.id,
      user_id: userId,
      role: 'assistant',
      content: chatResponse.message,
      question_number: 1,
      is_user_response: false
    });

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

    await lessonChatRepository.addMessage({
      lesson_id: lesson.id,
      user_id: userId,
      role: 'user',
      content: message,
      is_user_response: true
    });

    const { answered } = await lessonRepository.incrementChatQuestionsAnswered(lesson.id);
    const progress = await lessonRepository.getProgress(lesson.id);
    
    if (answered >= progress!.chat_questions_total) {
      await lessonRepository.updateStatus(lesson.id, 'chat_completed');
      
      const report = await generateReportFn(userId);
      
      return {
        response: `Great conversation! Your lesson is now complete. Here's a summary: You scored ${report.performance_score}% overall.`,
        question_number: answered,
        is_complete: true
      };
    }

    const nextQuestionNumber = answered + 1;
    const chatHistory = await lessonChatRepository.findByLesson(lesson.id);
    
    const chatResponse = await aiService.generateChatQuestions({
      user_id: userId,
      day: lesson.day,
      lesson_topic: lesson.topic,
      lesson_theory: lesson.theory || '',
      exercises_summary: [],
      question_number: nextQuestionNumber,
      previous_messages: chatHistory.map(m => ({ role: m.role, content: m.content }))
    });

    await lessonChatRepository.addMessage({
      lesson_id: lesson.id,
      user_id: userId,
      role: 'assistant',
      content: chatResponse.message,
      question_number: nextQuestionNumber,
      is_user_response: false
    });

    return {
      response: chatResponse.message,
      question_number: nextQuestionNumber,
      is_complete: false
    };
  }
}

export const lessonChatService = new LessonChatService();
