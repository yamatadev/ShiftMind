import { fetchApi } from './client';
import type { ChatMessage, ChatResponse } from '../types';

export function sendChatMessage(
  message: string,
  conversationHistory: ChatMessage[]
): Promise<ChatResponse> {
  return fetchApi<ChatResponse>('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message, conversationHistory }),
  });
}
