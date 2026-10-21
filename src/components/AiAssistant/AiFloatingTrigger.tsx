import React from 'react';

interface AiFloatingTriggerProps {
  onClick: () => void;
  isOpen: boolean;
}

export const AiFloatingTrigger: React.FC<AiFloatingTriggerProps> = ({ onClick, isOpen }) => {
  if (isOpen) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 px-4 py-3 rounded-full bg-gradient-to-r from-[#3525cd] to-[#006c4a] text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group animate-bounce-subtle"
      aria-label="Open SkillSwap AI Assistant"
    >
      <div className="relative">
        <span className="material-symbols-outlined text-[22px] group-hover:rotate-12 transition-transform">
          auto_awesome
        </span>
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#82f5c1] ring-2 ring-white"></span>
      </div>
      <div className="flex flex-col text-left">
        <span className="text-xs font-bold leading-tight">SkillSwap AI</span>
        <span className="text-[9px] text-[#82f5c1] font-semibold">Multilingual Assistant</span>
      </div>
    </button>
  );
};
