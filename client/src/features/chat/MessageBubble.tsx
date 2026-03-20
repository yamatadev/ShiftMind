import type { ChatMessage } from '../../types';

function AriaAvatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shrink-0">
      <span className="text-xs font-semibold text-white leading-none">A</span>
    </div>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%]">
          <p className="text-[10px] text-text-secondary mb-1 text-right">You</p>
          <div className="bg-primary text-white rounded-2xl rounded-tr-sm px-3 py-2">
            <p className="text-sm leading-relaxed">{message.content}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <AriaAvatar />
      <div className="max-w-[85%]">
        <p className="text-[10px] text-text-secondary mb-1">Aria</p>
        <div className="bg-gray-100 text-text-primary rounded-2xl rounded-tl-sm px-3 py-2">
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
      </div>
    </div>
  );
}

export { AriaAvatar };
