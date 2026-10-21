import React, { useState, useEffect, useRef } from 'react';
import {
  AiChatMessage,
  SUPPORTED_AI_LANGUAGES,
  AI_QUICK_ACTIONS,
} from '../../types/aiChat';
import { aiChatService } from '../../services/aiChatService';
import { UserProfile, LessonContext } from '../../types';

interface AiChatPanelProps {
  currentUser: UserProfile | null;
  activeLessonContext: LessonContext | null;
  onClearLessonContext: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  isMobileDrawer?: boolean;
}

export const AiChatPanel: React.FC<AiChatPanelProps> = ({
  currentUser,
  activeLessonContext,
  onClearLessonContext,
  isOpen,
  onToggleOpen,
  isMobileDrawer = false,
}) => {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('auto');
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize session messages
  useEffect(() => {
    const loaded = aiChatService.getSessionMessages();
    setMessages(loaded);
  }, []);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Adjust textarea height automatically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!content || isStreaming) return;

    const userMessage: AiChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      lessonContext: activeLessonContext
        ? {
            lessonId: activeLessonContext.lessonId,
            lessonTitle: activeLessonContext.lessonTitle,
            moduleId: activeLessonContext.moduleId,
            moduleTitle: activeLessonContext.moduleTitle,
            skillName: activeLessonContext.skillName,
          }
        : undefined,
    };

    const assistantPlaceholderId = `asst-${Date.now()}`;
    const assistantMessage: AiChatMessage = {
      id: assistantPlaceholderId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
    };

    const updatedHistory = [...messages, userMessage, assistantMessage];
    setMessages(updatedHistory);
    setInputText('');
    setIsStreaming(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const activeLanguageLabel =
        SUPPORTED_AI_LANGUAGES.find((l) => l.code === selectedLanguage)?.label || 'Auto Detect';

      await aiChatService.streamChat(
        [...messages, userMessage],
        currentUser,
        activeLessonContext,
        activeLanguageLabel,
        (chunk) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantPlaceholderId
                ? { ...msg, content: msg.content + chunk }
                : msg
            )
          );
        },
        abortController.signal
      );

      // Finalize streaming
      setMessages((prev) => {
        const finalMessages = prev.map((msg) =>
          msg.id === assistantPlaceholderId ? { ...msg, isStreaming: false } : msg
        );
        aiChatService.saveSessionMessages(finalMessages);
        return finalMessages;
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User voluntarily stopped generation
        setMessages((prev) => {
          const finalMessages = prev.map((msg) =>
            msg.id === assistantPlaceholderId ? { ...msg, isStreaming: false } : msg
          );
          aiChatService.saveSessionMessages(finalMessages);
          return finalMessages;
        });
      } else {
        console.error('Chat stream error:', err);
        const errorMessage = err.message || 'AI Assistant is temporarily unavailable. Please try again.';
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantPlaceholderId
              ? {
                  ...msg,
                  isStreaming: false,
                  content: msg.content || errorMessage,
                  error: errorMessage,
                }
              : msg
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleRegenerate = (messageIndex: number) => {
    if (isStreaming) return;
    const prevUserMessage = messages
      .slice(0, messageIndex)
      .reverse()
      .find((m) => m.role === 'user');

    if (prevUserMessage) {
      // Remove all messages starting from the target assistant message
      const pruned = messages.slice(0, messageIndex);
      setMessages(pruned);
      handleSendMessage(prevUserMessage.content);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    aiChatService.clearSessionMessages();
    setMessages(aiChatService.getSessionMessages());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderFormattedContent = (content: string) => {
    // Simple robust markdown parser for code blocks and bold/bullet styling
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const lang = lines[0]?.trim() || 'code';
        const code = lines.slice(1).join('\n') || lines[0];

        return (
          <div key={index} className="my-2 rounded-xl overflow-hidden bg-[#131b2e] text-[#eaedff] text-xs font-mono">
            <div className="flex items-center justify-between px-3 py-1.5 bg-black/40 text-[10px] text-white/70">
              <span className="uppercase">{lang}</span>
              <button
                type="button"
                onClick={() => handleCopy(`code-${index}`, code)}
                className="hover:text-white flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {copiedId === `code-${index}` ? 'check' : 'content_copy'}
                </span>
                <span>{copiedId === `code-${index}` ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 overflow-x-auto leading-relaxed">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // Format bold text and bullet points
      return (
        <div key={index} className="space-y-1 text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap">
          {part.split('\n').map((line, lIdx) => {
            const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ') || line.trim().startsWith('• ');
            const cleanLine = isBullet ? line.replace(/^[\*\-\•]\s*/, '') : line;

            // Simple regex for bolding
            const boldParts = cleanLine.split(/(\*\*.*?\*\*)/g);

            return (
              <p key={lIdx} className={isBullet ? 'flex items-start gap-1.5 pl-1' : ''}>
                {isBullet && <span className="text-[#3525cd] font-bold shrink-0 mt-0.5">•</span>}
                <span>
                  {boldParts.map((bp, bpIdx) =>
                    bp.startsWith('**') && bp.endsWith('**') ? (
                      <strong key={bpIdx} className="font-semibold text-[#131b2e]">
                        {bp.slice(2, -2)}
                      </strong>
                    ) : (
                      bp
                    )
                  )}
                </span>
              </p>
            );
          })}
        </div>
      );
    });
  };

  return (
    <aside
      className={`flex flex-col bg-white border-l border-[#eaedff] shadow-sm transition-all duration-300 z-30 ${
        isMobileDrawer
          ? 'fixed inset-y-0 right-0 w-full max-w-md h-full z-50 shadow-2xl'
          : isOpen
          ? 'w-[360px] xl:w-[400px] 2xl:w-[440px] shrink-0 h-[calc(100vh-5rem)] sticky top-20'
          : 'w-0 overflow-hidden border-l-0'
      }`}
      aria-label="SkillSwap AI Assistant"
    >
      {/* 1. Header */}
      <div className="p-4 border-b border-[#eaedff] bg-gradient-to-r from-[#faf8ff] to-[#f2f3ff] flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#3525cd] to-[#006c4a] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-[#131b2e]">SkillSwap AI</h3>
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full bg-[#82f5c1] text-[#00714e] text-[9px] font-bold">
                  Gemini 3.8
                </span>
              </div>
              <p className="text-[10px] text-[#464555]">Multilingual Campus Tutor</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleClearHistory}
              className="p-1.5 rounded-lg text-[#8b8a9d] hover:text-[#131b2e] hover:bg-white transition-colors"
              title="Clear conversation history"
            >
              <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
            </button>
            <button
              type="button"
              onClick={onToggleOpen}
              className="p-1.5 rounded-lg text-[#8b8a9d] hover:text-[#131b2e] hover:bg-white transition-colors"
              title="Minimize Assistant"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isMobileDrawer ? 'close' : 'chevron_right'}
              </span>
            </button>
          </div>
        </div>

        {/* Language Selector & Context Pill */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {/* Language Dropdown */}
          <div className="flex items-center gap-1 text-[11px] text-[#464555] bg-white px-2.5 py-1 rounded-xl border border-[#eaedff] shadow-2xs">
            <span className="material-symbols-outlined text-[14px] text-[#3525cd]">translate</span>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-transparent text-xs font-medium text-[#131b2e] outline-none cursor-pointer"
            >
              {SUPPORTED_AI_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName} ({lang.label})
                </option>
              ))}
            </select>
          </div>

          {/* Active Lesson Context Indicator */}
          {activeLessonContext && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#e2e7ff] text-[#3525cd] text-[10px] font-semibold truncate max-w-[160px] animate-fadeIn">
              <span className="material-symbols-outlined text-[12px] shrink-0">menu_book</span>
              <span className="truncate">{activeLessonContext.moduleTitle || activeLessonContext.lessonTitle}</span>
              <button
                type="button"
                onClick={onClearLessonContext}
                className="hover:text-red-600 shrink-0 ml-0.5"
                title="Remove lesson context"
              >
                <span className="material-symbols-outlined text-[12px]">close</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#faf8ff]">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1 animate-fadeIn`}
            >
              {/* Context Tag for user message */}
              {isUser && msg.lessonContext && (
                <span className="text-[10px] text-[#8b8a9d] px-2 py-0.5 rounded-md bg-[#eaedff] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">menu_book</span>
                  <span>Context: {msg.lessonContext.moduleTitle || msg.lessonContext.lessonTitle}</span>
                </span>
              )}

              {/* Message Bubble */}
              <div
                className={`p-3.5 rounded-2xl max-w-[90%] shadow-2xs relative group ${
                  isUser
                    ? 'bg-[#3525cd] text-white rounded-tr-xs'
                    : 'bg-white text-[#131b2e] border border-[#eaedff] rounded-tl-xs'
                }`}
              >
                {/* Content */}
                {isUser ? (
                  <p className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div>
                    {renderFormattedContent(msg.content)}
                    {msg.isStreaming && (
                      <span className="inline-block w-2 h-3.5 bg-[#3525cd] ml-1 animate-pulse rounded-xs align-middle" />
                    )}
                  </div>
                )}

                {/* Assistant Footer Actions: Copy & Regenerate */}
                {!isUser && !msg.isStreaming && msg.content && (
                  <div className="flex items-center gap-2 pt-2 mt-2 border-t border-[#eaedff] text-[10px] text-[#8b8a9d]">
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="hover:text-[#3525cd] flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {copiedId === msg.id ? 'check' : 'content_copy'}
                      </span>
                      <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => handleRegenerate(index)}
                      className="hover:text-[#3525cd] flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[13px]">refresh</span>
                      <span>Regenerate</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Timestamp & Status */}
              <span className="text-[10px] text-[#8b8a9d] px-1">{msg.timestamp}</span>

              {/* Error Retry Option */}
              {msg.error && (
                <button
                  type="button"
                  onClick={() => handleRegenerate(index)}
                  className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md hover:bg-red-100 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[12px]">replay</span>
                  <span>Retry Request</span>
                </button>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Quick Actions Ribbon */}
      <div className="px-3 py-2 bg-white border-t border-[#eaedff] overflow-x-auto flex items-center gap-1.5 shrink-0 scrollbar-none">
        {AI_QUICK_ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            disabled={isStreaming}
            onClick={() => {
              const prompt = action.generatePrompt(
                activeLessonContext?.lessonTitle,
                activeLessonContext?.moduleTitle
              );
              handleSendMessage(prompt);
            }}
            className="px-2.5 py-1 rounded-full bg-[#f2f3ff] hover:bg-[#eaedff] text-[#3525cd] text-[11px] font-medium whitespace-nowrap transition-colors flex items-center gap-1 shrink-0 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[13px]">{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      {/* 4. Input & Send Box */}
      <div className="p-3 bg-white border-t border-[#eaedff] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative rounded-2xl border border-[#c7c4d8] focus-within:border-[#3525cd] focus-within:ring-2 focus-within:ring-[#3525cd]/15 transition-all bg-[#faf8ff] p-2"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedLanguage === 'ta'
                ? 'தமிழில் அல்லது ஆங்கிலத்தில் கேளுங்கள்...'
                : selectedLanguage === 'hi'
                ? 'हिन्दी या अंग्रेज़ी में पूछें...'
                : 'Ask AI anything (English, Tamil, Hindi, Tanglish)...'
            }
            className="w-full text-xs sm:text-[13px] bg-transparent outline-none resize-none max-h-28 text-[#131b2e] placeholder:text-[#8b8a9d]"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-[#8b8a9d] select-none">
              Enter to send • Shift+Enter newline
            </span>

            {isStreaming ? (
              <button
                type="button"
                onClick={handleStopGeneration}
                className="px-2.5 py-1 rounded-xl bg-red-500 text-white text-[11px] font-semibold hover:bg-red-600 transition-colors flex items-center gap-1 shadow-xs"
              >
                <span className="material-symbols-outlined text-[14px]">stop</span>
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="w-7 h-7 rounded-xl bg-[#3525cd] text-white flex items-center justify-center hover:opacity-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </aside>
  );
};
