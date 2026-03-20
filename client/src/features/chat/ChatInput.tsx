import { useState, type KeyboardEvent } from 'react';
import { ArrowUp } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="p-3 border-t border-border flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask Aria..."
        disabled={disabled}
        className="flex-1 text-sm bg-gray-50 rounded-full px-4 py-2 outline-none border border-border focus:border-primary transition-colors disabled:opacity-50"
      />
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shrink-0 hover:bg-primary-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ArrowUp size={16} />
      </button>
    </div>
  );
}
