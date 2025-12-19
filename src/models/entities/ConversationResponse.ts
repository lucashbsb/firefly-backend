export interface ConversationResponse {
  response: string;
  corrections?: string[];
  should_continue: boolean;
}
