import { AIMessage } from './AIMessage';

export interface ConversationRequest {
  user_id: string;
  day: number;
  history: AIMessage[];
  student_message: string;
}
