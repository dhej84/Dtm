import { LessonContext } from './index';

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  error?: string;
  lessonContext?: {
    lessonId: string;
    lessonTitle: string;
    moduleId?: string;
    moduleTitle?: string;
    skillName?: string;
  };
}

export interface AiLanguageOption {
  code: string;
  label: string;
  nativeName: string;
  direction?: 'ltr' | 'rtl';
}

export const SUPPORTED_AI_LANGUAGES: AiLanguageOption[] = [
  { code: 'auto', label: 'Auto Detect', nativeName: 'Auto Detect' },
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'ta', label: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'te', label: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'kn', label: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'bn', label: 'Bengali', nativeName: 'বাংলা' },
  { code: 'mr', label: 'Marathi', nativeName: 'मराठी' },
  { code: 'gu', label: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'pa', label: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'or', label: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'as', label: 'Assamese', nativeName: 'অসমীয়া' },
  { code: 'ur', label: 'Urdu', nativeName: 'اردو', direction: 'rtl' },
];

export interface AiQuickAction {
  id: string;
  label: string;
  icon: string;
  generatePrompt: (lessonTitle?: string, moduleTitle?: string) => string;
}

export const AI_QUICK_ACTIONS: AiQuickAction[] = [
  {
    id: 'explain',
    label: 'Explain this',
    icon: 'school',
    generatePrompt: (lesson, mod) =>
      mod || lesson
        ? `Can you explain the key concepts in "${mod || lesson}" simply with a real-world example?`
        : 'Can you explain this programming concept simply with an everyday analogy?',
  },
  {
    id: 'summarize',
    label: 'Summarize',
    icon: 'summarize',
    generatePrompt: (lesson, mod) =>
      mod || lesson
        ? `Please give a concise 3-bullet summary of "${mod || lesson}".`
        : 'Please summarize the main takeaways in 3 concise bullet points.',
  },
  {
    id: 'example',
    label: 'Give an example',
    icon: 'code',
    generatePrompt: (lesson, mod) =>
      mod || lesson
        ? `Show me a clean, practical code example demonstrating "${mod || lesson}".`
        : 'Can you show me a clear, commented code example of this?',
  },
  {
    id: 'quiz',
    label: 'Quiz me',
    icon: 'quiz',
    generatePrompt: (lesson, mod) =>
      mod || lesson
        ? `Test my understanding of "${mod || lesson}" with 2 short conceptual questions.`
        : 'Quiz me with 2 quick practice questions on this topic.',
  },
  {
    id: 'simplify',
    label: 'Simplify',
    icon: 'sentiment_satisfied',
    generatePrompt: () => 'Can you explain this like I am a beginner with no prior background?',
  },
  {
    id: 'practice',
    label: 'Practice questions',
    icon: 'assignment',
    generatePrompt: (lesson, mod) =>
      mod || lesson
        ? `Give me 2 hands-on coding practice challenges based on "${mod || lesson}".`
        : 'Provide 2 hands-on coding exercises to reinforce this concept.',
  },
];
