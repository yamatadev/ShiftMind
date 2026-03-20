import { createContext, useContext, type ReactNode } from 'react';
import { useChat } from '../hooks/useChat';
import type { ChatMessage } from '../types';

interface ChatContextValue {
  messages: ChatMessage[];
  isOpen: boolean;
  isLoading: boolean;
  sendMessage: (text: string) => Promise<void>;
  toggleOpen: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

interface ChatProviderProps {
  children: ReactNode;
  scheduleRefetch: () => Promise<void>;
}

export function ChatProvider({ children, scheduleRefetch }: ChatProviderProps) {
  const chat = useChat({ onAction: scheduleRefetch });

  return (
    <ChatContext.Provider
      value={{
        messages: chat.messages,
        isOpen: chat.isOpen,
        isLoading: chat.isLoading,
        sendMessage: chat.sendMessage,
        toggleOpen: chat.toggleOpen,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider');
  return ctx;
}
