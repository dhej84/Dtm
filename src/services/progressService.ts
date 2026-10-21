import { PROGRESS_ENDPOINTS, USE_MOCK_API } from './api/config';
import { httpClient } from './api/httpClient';
import { LessonProgress, LearningHistoryItem, StudentProgressSummary } from '../types';
import { INITIAL_LESSONS } from './mockData';
import { userService } from './userService';

const PROGRESS_KEY = 'skillswap_lesson_progress';
const NOTES_KEY = 'skillswap_lesson_notes';
const HISTORY_KEY = 'skillswap_learning_history';

function getStoredProgress(): Record<string, LessonProgress> {
  const saved = localStorage.getItem(PROGRESS_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  const initialMap: Record<string, LessonProgress> = {};
  for (const lesson of INITIAL_LESSONS) {
    initialMap[lesson.id] = {
      lessonId: lesson.id,
      progressPercent: lesson.progressPercent || 0,
      isCompleted: !!lesson.isCompleted,
      currentStepIndex: 0,
      lastAccessedAt: new Date().toISOString(),
    };
  }
  return initialMap;
}

function saveStoredProgress(map: Record<string, LessonProgress>): void {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(map));
}

function getStoredHistory(): LearningHistoryItem[] {
  const saved = localStorage.getItem(HISTORY_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  return [
    {
      id: 'hist-1',
      date: 'Yesterday, 3:45 PM',
      title: 'Distributed Systems Consensus Workshop',
      category: 'System Design',
      partner: 'David Kim (Stanford)',
      duration: '90 mins',
      creditsEarned: 2,
      status: 'completed',
    },
    {
      id: 'hist-2',
      date: '3 days ago',
      title: 'Deep Learning with PyTorch: Transformers',
      category: 'Machine Learning',
      partner: 'Alex Rivera (MIT)',
      duration: '120 mins',
      creditsEarned: 2,
      status: 'completed',
    },
    {
      id: 'hist-3',
      date: 'Last week',
      title: 'Applied Machine Learning Foundations',
      category: 'AI / Data Science',
      partner: 'Elena Rostova (Oxford)',
      duration: '60 mins',
      creditsEarned: 1,
      status: 'completed',
    },
  ];
}

function saveStoredHistory(history: LearningHistoryItem[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export const progressService = {
  /**
   * Get student's overall progress summary across lessons and skills
   */
  async getStudentProgress(): Promise<StudentProgressSummary> {
    if (!USE_MOCK_API) {
      try {
        return await httpClient.get<StudentProgressSummary>(PROGRESS_ENDPOINTS.SUMMARY);
      } catch (err) {
        console.warn('Backend progress summary failed, calculating from local store:', err);
      }
    }

    const progressMap = getStoredProgress();
    const history = getStoredHistory();
    const progressList = Object.values(progressMap);

    const lessonsStarted = progressList.filter((p) => p.progressPercent > 0).length;
    const lessonsCompleted = progressList.filter((p) => p.isCompleted).length;

    return {
      lessonsStarted,
      lessonsCompleted,
      totalHoursExchanged: 18.5,
      swapCreditsBalance: 12,
      activeSwapsCount: 3,
      history,
    };
  },

  /**
   * Start a new lesson or mark as currently active
   */
  async startLesson(lessonId: string): Promise<LessonProgress> {
    if (!USE_MOCK_API) {
      try {
        return await httpClient.post<LessonProgress>(PROGRESS_ENDPOINTS.START(lessonId), {});
      } catch (err) {
        console.warn(`Backend start lesson ${lessonId} failed, updating locally:`, err);
      }
    }

    const progressMap = getStoredProgress();
    const current = progressMap[lessonId] || {
      lessonId,
      progressPercent: 0,
      isCompleted: false,
      currentStepIndex: 0,
    };

    const updated: LessonProgress = {
      ...current,
      progressPercent: Math.max(current.progressPercent, 10),
      lastAccessedAt: new Date().toISOString(),
    };

    progressMap[lessonId] = updated;
    saveStoredProgress(progressMap);
    return updated;
  },

  /**
   * Update student's progress percentage and step index for a lesson
   */
  async updateProgress(lessonId: string, progressPercent: number, currentStepIndex?: number): Promise<LessonProgress> {
    if (!USE_MOCK_API) {
      try {
        return await httpClient.put<LessonProgress>(PROGRESS_ENDPOINTS.UPDATE(lessonId), {
          progressPercent,
          currentStepIndex,
        });
      } catch (err) {
        console.warn(`Backend update progress ${lessonId} failed, updating locally:`, err);
      }
    }

    const progressMap = getStoredProgress();
    const current = progressMap[lessonId] || {
      lessonId,
      progressPercent: 0,
      isCompleted: false,
      currentStepIndex: 0,
    };

    // RULE: Progress / video watching alone NEVER marks a lesson as completed!
    // Completion requires passing the lesson assessment with required score.
    const updated: LessonProgress = {
      ...current,
      progressPercent: Math.min(100, Math.max(0, progressPercent)),
      currentStepIndex: currentStepIndex ?? current.currentStepIndex,
      isCompleted: current.isCompleted,
      completedAt: current.completedAt,
      lastAccessedAt: new Date().toISOString(),
    };

    progressMap[lessonId] = updated;
    saveStoredProgress(progressMap);
    return updated;
  },

  /**
   * Mark a lesson as fully completed and earn swap credits
   */
  async markLessonCompleted(lessonId: string, lessonTitle?: string): Promise<{ success: boolean; creditsEarned: number }> {
    // SECURITY: Validate that the student has actually attempted and passed the assessment
    // Backend/service validation prevents frontend-only direct completion manipulation
    const profile = await userService.getProfile();
    if (!profile) {
      return {
        success: false,
        creditsEarned: 0,
      };
    }
    let hasPassed = false;
    try {
      const raw = localStorage.getItem('skillswap_assessment_attempts_v2');
      if (raw) {
        const attempts: any[] = JSON.parse(raw);
        hasPassed = attempts.some(
          (a) => a.lessonId === lessonId && a.userId === profile.id && a.passed && a.status === 'evaluated'
        );
      }
    } catch {}

    if (!hasPassed) {
      return {
        success: false,
        creditsEarned: 0,
      };
    }

    if (!USE_MOCK_API) {
      try {
        return await httpClient.post<{ success: boolean; creditsEarned: number }>(
          PROGRESS_ENDPOINTS.COMPLETE(lessonId),
          {},
        );
      } catch (err) {
        console.warn(`Backend mark lesson completed ${lessonId} failed, handling locally:`, err);
      }
    }

    // Update progress state with verified completion
    const progressMap = getStoredProgress();
    const current = progressMap[lessonId] || {
      lessonId,
      progressPercent: 100,
      isCompleted: false,
      currentStepIndex: 0,
    };
    progressMap[lessonId] = {
      ...current,
      progressPercent: 100,
      isCompleted: true,
      completedAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
    };
    saveStoredProgress(progressMap);

    // Reward credits in local profile
    await userService.updateProfile({
      walletBalance: profile.walletBalance + 1,
      hoursTaught: profile.hoursTaught + 1,
      peerReputation: Math.min(5.0, Number((profile.peerReputation + 0.05).toFixed(2))),
    });

    // Add to learning history
    const history = getStoredHistory();
    const newHistoryItem: LearningHistoryItem = {
      id: `hist-${Date.now()}`,
      date: 'Just now',
      title: lessonTitle || `Completed Lesson #${lessonId}`,
      category: 'Peer Workshop',
      partner: 'SkillSwap Peer',
      duration: '45 mins',
      creditsEarned: 1,
      status: 'completed',
    };
    saveStoredHistory([newHistoryItem, ...history]);

    return { success: true, creditsEarned: 1 };
  },

  /**
   * Get student's completed learning history timeline
   */
  async getLearningHistory(): Promise<LearningHistoryItem[]> {
    if (!USE_MOCK_API) {
      try {
        return await httpClient.get<LearningHistoryItem[]>(PROGRESS_ENDPOINTS.HISTORY);
      } catch (err) {
        console.warn('Backend history unavailable, falling back to local history:', err);
      }
    }
    return getStoredHistory();
  },

  /**
   * Save private notes for a lesson
   */
  async saveLessonNotes(lessonId: string, notes: string): Promise<string> {
    if (!USE_MOCK_API) {
      try {
        await httpClient.put(PROGRESS_ENDPOINTS.NOTES(lessonId), { notes });
      } catch (err) {
        console.warn('Backend notes save failed, saving to local storage:', err);
      }
    }

    const savedNotes = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}');
    savedNotes[lessonId] = notes;
    localStorage.setItem(NOTES_KEY, JSON.stringify(savedNotes));
    return notes;
  },

  /**
   * Get private notes for a lesson
   */
  async getLessonNotes(lessonId: string): Promise<string> {
    if (!USE_MOCK_API) {
      try {
        const response = await httpClient.get<{ notes: string }>(PROGRESS_ENDPOINTS.NOTES(lessonId));
        return response.notes;
      } catch (err) {
        // Fall back to local
      }
    }

    const savedNotes = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}');
    return savedNotes[lessonId] || '';
  },

  /**
   * Get progress record for a single lesson
   */
  async getProgress(lessonId: string): Promise<LessonProgress> {
    const progressMap = getStoredProgress();
    return progressMap[lessonId] || {
      lessonId,
      progressPercent: 0,
      isCompleted: false,
      currentStepIndex: 0,
    };
  },
};
