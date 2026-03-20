import { useState, useCallback } from 'react';
import { sendChatMessage } from '../api/chat';
import type { ChatMessage } from '../types';

interface UseChatOptions {
  onAction?: () => void;
}

export function useChat({ onAction }: UseChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (text: string) => {
    const userMessage: ChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await sendChatMessage(text, [...messages, userMessage]);
      const assistantMessage: ChatMessage = { role: 'assistant', content: response.reply };
      setMessages(prev => [...prev, assistantMessage]);

      if (response.actions.length > 0 && onAction) {
        onAction();
      }
    } catch (err) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [messages, onAction]);

  const toggleOpen = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return { messages, isOpen, isLoading, sendMessage, toggleOpen };
}
