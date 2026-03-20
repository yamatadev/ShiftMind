import { useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { useChatContext } from '../../contexts/ChatContext';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import ChatInput from './ChatInput';

export default function AriaPanel() {
  const { messages, isOpen, isLoading, sendMessage, toggleOpen } = useChatContext();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <aside
      className="fixed top-0 right-0 h-full w-80 bg-surface border-l border-border flex flex-col z-40 transition-transform duration-300 ease-in-out"
      style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-heading font-semibold text-text-primary">Aria</h2>
          <span className="flex items-center gap-1 text-[10px] text-text-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Online
          </span>
        </div>
        <button
          onClick={toggleOpen}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors text-text-secondary"
        >
          <X size={16} />
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <img src="/aria-avatar.png" alt="Aria" className="w-10 h-10 rounded-full object-cover mb-3" />
            <p className="text-sm text-text-secondary">
              Hi! I'm Aria, your scheduling assistant. How can I help?
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </aside>
  );
}
