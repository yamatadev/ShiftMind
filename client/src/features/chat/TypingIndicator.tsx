import { AriaAvatar } from './MessageBubble';

export default function TypingIndicator() {
  return (
    <div className="flex gap-2">
      <AriaAvatar />
      <div>
        <p className="text-[10px] text-text-secondary mb-1">Aria</p>
        <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-text-secondary" style={{ animationDelay: '0ms' }} />
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-text-secondary" style={{ animationDelay: '150ms' }} />
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-text-secondary" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
