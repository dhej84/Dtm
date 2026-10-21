import { AiChatMessage } from '../types/aiChat';
import { UserProfile, LessonContext } from '../types';

const SESSION_CHAT_KEY = 'skillswap_ai_session_chat_v1';

export const aiChatService = {
  /**
   * Retrieves messages from current session storage
   */
  getSessionMessages(): AiChatMessage[] {
    try {
      const saved = sessionStorage.getItem(SESSION_CHAT_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'msg-welcome',
        role: 'assistant',
        content: `👋 **Vanakkam & Welcome to SkillSwap AI!**\n\nI am your campus peer-learning assistant. Ask me anything about your lessons, coding concepts, or what to learn next.\n\n*Feel free to ask in English, தமிழ் (Tamil), हिन्दी (Hindi), తెలుగు (Telugu), ಕನ್ನಡ, മലയാളം, বাংলা, or colloquial mixed phrases like "Python learn panna best way enna?"*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  },

  /**
   * Saves messages to session storage
   */
  saveSessionMessages(messages: AiChatMessage[]): void {
    try {
      sessionStorage.setItem(SESSION_CHAT_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  },

  /**
   * Clears session chat history
   */
  clearSessionMessages(): void {
    sessionStorage.removeItem(SESSION_CHAT_KEY);
  },

  /**
   * Progressive streaming request to backend Gemini SSE endpoint
   */
  async streamChat(
    messages: AiChatMessage[],
    user: UserProfile | null,
    lessonContext: LessonContext | null,
    languagePreference: string,
    onChunk: (chunkText: string) => void,
    signal?: AbortSignal
  ): Promise<string> {
    // Non-sensitive user profile context
    const userContext = user
      ? {
          name: user.name,
          university: user.university,
          department: user.department,
          year: user.year,
          walletBalance: user.walletBalance,
          learningSkills: user.learningSkills?.map((s) => ({
            name: s.name,
            level: s.currentLevel,
            progress: s.progressPercent,
          })),
          teachingSkills: user.teachingSkills?.map((s) => ({
            name: s.name,
            level: s.level,
          })),
        }
      : null;

    const payload = {
      messages: messages
        .filter((m) => m.id !== 'msg-welcome' && m.content && m.content.trim().length > 0)
        .map((m) => ({
          role: m.role,
          content: m.content,
        })),
      userContext,
      lessonContext: lessonContext
        ? {
            lessonId: lessonContext.lessonId,
            lessonTitle: lessonContext.lessonTitle,
            moduleId: lessonContext.moduleId,
            moduleTitle: lessonContext.moduleTitle,
            skillName: lessonContext.skillName,
            category: lessonContext.category,
            progressPercent: lessonContext.progressPercent,
          }
        : null,
      languagePreference,
    };

    let fullText = '';

    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;

        const dataStr = trimmed.replace(/^data:\s*/, '');
        if (dataStr === '[DONE]') {
          return fullText;
        }

        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.error) {
            throw new Error(parsed.error);
          }
          if (parsed.text) {
            fullText += parsed.text;
            onChunk(parsed.text);
          }
        } catch (e: any) {
          if (e.message && e.message !== 'Unexpected end of JSON input') {
            throw e;
          }
        }
      }
    }

    return fullText;
  },
};
