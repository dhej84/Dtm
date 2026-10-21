import { LESSON_ENDPOINTS, USE_MOCK_API } from './api/config';
import { httpClient } from './api/httpClient';
import { Lesson, LessonFilters } from '../types';
import { uploadService, VideoUploadResult } from './uploadService';

const LESSONS_KEY = 'skillswap_lessons';

function getStoredLessons(): Lesson[] {
  const saved = localStorage.getItem(LESSONS_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // ignore
    }
  }
  return [];
}

function saveStoredLessons(lessons: Lesson[]): void {
  localStorage.setItem(LESSONS_KEY, JSON.stringify(lessons));
}

export const lessonService = {
  /**
   * Get all lessons with optional filtering
   */
  async getLessons(filters?: LessonFilters | Record<string, any>): Promise<Lesson[]> {
    if (!USE_MOCK_API) {
      try {
        const queryParams = new URLSearchParams();
        const search = filters?.query || filters?.search;
        if (search) queryParams.set('q', search);
        if (filters?.skill && filters.skill !== 'All') queryParams.set('skill', filters.skill);
        if (filters?.level && filters.level !== 'All') queryParams.set('level', filters.level);
        if (filters?.category && filters.category !== 'All') queryParams.set('category', filters.category);

        const url = `${LESSON_ENDPOINTS.LESSONS}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const res = await httpClient.get<Lesson[]>(url);
        if (Array.isArray(res)) {
          return res;
        }
      } catch (err) {
        console.warn('Backend lessons unavailable, falling back to local store:', err);
      }
    }

    let lessons = getStoredLessons();
    if (filters) {
      const q = (filters.query || filters.search || '').toLowerCase();
      if (q) {
        lessons = lessons.filter(
          (l) =>
            l.title.toLowerCase().includes(q) ||
            l.skill.toLowerCase().includes(q) ||
            l.description.toLowerCase().includes(q) ||
            l.teacherName.toLowerCase().includes(q),
        );
      }
      if (filters.skill && filters.skill !== 'All') {
        lessons = lessons.filter((l) => l.skill.toLowerCase() === filters.skill!.toLowerCase());
      }
      if (filters.level && filters.level !== 'All') {
        lessons = lessons.filter((l) => l.skillLevel === filters.level);
      }
      if (filters.category && filters.category !== 'All') {
        lessons = lessons.filter((l) => l.category === filters.category);
      }
    }
    return lessons;
  },

  /**
   * Get a single lesson by ID
   */
  async getLessonById(id: string): Promise<Lesson | null> {
    if (!USE_MOCK_API) {
      try {
        const endpoint = LESSON_ENDPOINTS.GET_BY_ID(id);
        return await httpClient.get<Lesson>(endpoint);
      } catch (err) {
        console.warn(`Backend fetch for lesson ${id} failed, checking local store:`, err);
      }
    }

    const lessons = getStoredLessons();
    return lessons.find((l) => l.id === id) || null;
  },

  /**
   * Create a new lesson (Teaching / Upload flow)
   */
  async createLesson(lessonData: Partial<Lesson>): Promise<Lesson> {
    if (!USE_MOCK_API) {
      try {
        return await httpClient.post<Lesson>(LESSON_ENDPOINTS.CREATE, lessonData);
      } catch (err) {
        console.warn('Backend lesson creation failed, creating locally:', err);
      }
    }

    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      title: lessonData.title || 'Untitled Workshop',
      skill: lessonData.skill || 'General Skill',
      category: lessonData.category || 'Computer Science',
      description: lessonData.description || '',
      skillLevel: lessonData.skillLevel || 'Intermediate',
      format: lessonData.format || 'Interactive Workshop',
      teacherId: lessonData.teacherId || '',
      teacherName: lessonData.teacherName || 'Student Peer',
      teacherAvatar:
        lessonData.teacherAvatar ||
        'https://api.dicebear.com/7.x/initials/svg?seed=SP&backgroundColor=3525cd&textColor=ffffff',
      teacherUniversity: lessonData.teacherUniversity || 'University Campus',
      teacherRating: 5.0,
      teacherReviewCount: 1,
      durationMinutes: lessonData.durationMinutes || 45,
      creditsRequired: lessonData.creditsRequired || 2,
      prerequisites: lessonData.prerequisites || 'None',
      enrolledStudentsCount: 1,
      modules: lessonData.modules || [],
      resources: lessonData.resources || [],
      comments: lessonData.comments || [],
      userNotes: '',
      isCompleted: false,
      progressPercent: 0,
      videoUrl: lessonData.videoUrl || '',
      videoFileName: lessonData.videoFileName,
      videoDuration: lessonData.videoDuration,
      videoFileSize: lessonData.videoFileSize,
      videoMimeType: lessonData.videoMimeType,
      videoStorageKey: lessonData.videoStorageKey,
      videoUploadedAt:
        lessonData.videoUploadedAt || (lessonData.videoUrl ? new Date().toISOString() : undefined),
      isPublished: lessonData.isPublished !== false,
    };

    const lessons = getStoredLessons();
    const updated = [newLesson, ...lessons];
    saveStoredLessons(updated);
    return newLesson;
  },

  /**
   * Update an existing lesson
   */
  async updateLesson(id: string, updates: Partial<Lesson>): Promise<Lesson | null> {
    if (!USE_MOCK_API) {
      try {
        return await httpClient.put<Lesson>(LESSON_ENDPOINTS.UPDATE(id), updates);
      } catch (err) {
        console.warn(`Backend update for lesson ${id} failed, falling back to local:`, err);
      }
    }

    const lessons = getStoredLessons();
    const index = lessons.findIndex((l) => l.id === id);
    if (index === -1) return null;

    lessons[index] = { ...lessons[index], ...updates };
    saveStoredLessons(lessons);
    return lessons[index];
  },

  /**
   * Delete a lesson
   */
  async deleteLesson(id: string): Promise<boolean> {
    if (!USE_MOCK_API) {
      try {
        await httpClient.delete(LESSON_ENDPOINTS.DELETE(id));
        return true;
      } catch (err) {
        console.warn(`Backend delete for lesson ${id} failed, removing locally:`, err);
      }
    }

    const lessons = getStoredLessons();
    const updated = lessons.filter((l) => l.id !== id);
    saveStoredLessons(updated);
    return true;
  },

  /**
   * Upload an authentic lesson video (works in both mock and real backend mode)
   * Supports either (lessonId, file, onProgress) or (file, lessonId, onProgress)
   */
  async uploadLessonVideo(
    arg1: string | File,
    arg2?: File | string | ((percent: number) => void),
    arg3?: (percent: number) => void
  ): Promise<VideoUploadResult> {
    return uploadService.uploadLessonVideo(arg1 as any, arg2 as any, arg3);
  },

  /**
   * Delete uploaded lesson video
   */
  async deleteLessonVideo(lessonId: string, storageKey?: string): Promise<boolean> {
    return uploadService.deleteLessonVideo(lessonId, storageKey);
  },
};

export const uploadLessonVideo = lessonService.uploadLessonVideo;
export const deleteLessonVideo = lessonService.deleteLessonVideo;

// Expose on global window object defensively to ensure compatibility with any test suites or runtime callers
if (typeof window !== 'undefined') {
  (window as any).lessonService = lessonService;
  (window as any).uploadLessonVideo = lessonService.uploadLessonVideo;
}

