// Central API & Service Exports for SkillSwap
export * from './api/config';
export * from './api/httpClient';
export * from './api/tokenStorage';

export { authService } from './authService';
export { userService } from './userService';
export { skillService } from './skillService';
export { lessonService } from './lessonService';
export { progressService } from './progressService';
export { commentService } from './commentService';
export { connectionService } from './connectionService';
export { searchService } from './searchService';
export { uploadService } from './uploadService';
export { notificationService } from './notificationService';
export { messageService } from './messageService';
export { nlpService } from './nlpService';
export { matchingService } from './matchingService';
export { assessmentService } from './assessmentService';
export { videoService } from './videoService';

import { authService } from './authService';
import { userService } from './userService';
import { skillService } from './skillService';
import { lessonService } from './lessonService';
import { progressService } from './progressService';
import { commentService } from './commentService';
import { connectionService } from './connectionService';
import { searchService } from './searchService';
import { uploadService } from './uploadService';
import { notificationService } from './notificationService';
import { messageService } from './messageService';
import { nlpService } from './nlpService';
import { matchingService } from './matchingService';
import { assessmentService } from './assessmentService';
import { videoService } from './videoService';
import { Lesson, UserProfile, PrivacySettings, LessonContext } from '../types';

/**
 * Unified apiService adapter providing backward-compatible method names
 * while routing all operations through the dedicated domain service layer.
 */
export const apiService = {
  // User Profile
  getCurrentUser: () => userService.getProfile(),
  updateCurrentUser: (updates: Partial<UserProfile>) => userService.updateProfile(updates),
  getStudentById: (id: string) => userService.getStudentById(id),
  getAllStudents: () => userService.getAllStudents(),
  getSkillSwapUsers: (filters?: any) => userService.getSkillSwapUsers(filters),
  getUserDirectory: (filters?: any) => userService.getUserDirectory(filters),
  getPublicProfile: (publicProfileId: string) => userService.getPublicProfile(publicProfileId),
  regeneratePublicProfileId: () => userService.regeneratePublicProfileId(),
  updatePrivacySettings: async (settings: Partial<PrivacySettings>): Promise<UserProfile> => {
    const updatedPrivacy = await userService.updatePrivacySettings(settings);
    return userService.updateProfile({ privacy: updatedPrivacy, publicProfileEnabled: updatedPrivacy.publicProfileEnabled });
  },

  // Skills
  endorseBadge: (badgeId: string) => skillService.endorseBadge(badgeId),
  updateTeachingSkills: (skills: any) => userService.updateProfile({ teachingSkills: skills }),
  updateLearningSkills: (skills: any) => userService.updateProfile({ learningSkills: skills }),

  // Lessons
  getLessons: (filters?: any) => lessonService.getLessons(filters),
  getLessonById: (id: string) => lessonService.getLessonById(id),
  createLesson: (data: any) => lessonService.createLesson(data),
  updateLesson: (id: string, updates: Partial<Lesson>) => lessonService.updateLesson(id, updates),
  deleteLesson: (id: string) => lessonService.deleteLesson(id),

  // Public & Shared Videos
  getPublicVideos: () => videoService.getPublicVideos(),
  getMyVideos: () => videoService.getMyVideos(),
  getVideos: (params?: any) => videoService.getVideos(params),
  searchVideos: (queryText: string, category?: string, level?: string) =>
    videoService.searchVideos(queryText, category, level),
  markLessonComplete: async (lessonId: string): Promise<Lesson> => {
    await progressService.markLessonCompleted(lessonId);
    const lesson = await lessonService.getLessonById(lessonId);
    if (lesson) {
      lesson.isCompleted = true;
      lesson.progressPercent = 100;
      await lessonService.updateLesson(lessonId, { isCompleted: true, progressPercent: 100 });
      return lesson;
    }
    throw new Error(`Lesson ${lessonId} not found`);
  },
  toggleModuleComplete: async (lessonId: string, moduleId: string): Promise<Lesson> => {
    const lesson = await lessonService.getLessonById(lessonId);
    if (!lesson) throw new Error(`Lesson ${lessonId} not found`);

    const updatedModules = lesson.modules.map((m) =>
      m.id === moduleId ? { ...m, completed: !m.completed } : m,
    );
    const completedCount = updatedModules.filter((m) => m.completed).length;
    const progressPercent = Math.round((completedCount / updatedModules.length) * 100);
    const isCompleted = progressPercent === 100;

    await progressService.updateProgress(lessonId, progressPercent);
    const updated = await lessonService.updateLesson(lessonId, {
      modules: updatedModules,
      progressPercent,
      isCompleted,
    });
    return updated || lesson;
  },

  // Progress & Notes
  completeLesson: (lessonId: string, title?: string) => progressService.markLessonCompleted(lessonId, title),
  getStudentProgress: () => progressService.getStudentProgress(),
  updateLessonNotes: async (lessonId: string, notes: string): Promise<Lesson> => {
    await progressService.saveLessonNotes(lessonId, notes);
    const updated = await lessonService.updateLesson(lessonId, { userNotes: notes });
    return updated!;
  },
  getLessonNotes: (lessonId: string) => progressService.getLessonNotes(lessonId),

  // Comments
  getComments: (lessonId: string) => commentService.getComments(lessonId),
  addLessonComment: async (lessonId: string, text: string): Promise<Lesson> => {
    const newComment = await commentService.addComment(lessonId, text);
    const lesson = await lessonService.getLessonById(lessonId);
    if (lesson) {
      const updatedComments = [newComment as any, ...(lesson.comments || [])];
      await lessonService.updateLesson(lessonId, { comments: updatedComments });
      lesson.comments = updatedComments;
      return lesson;
    }
    throw new Error(`Lesson ${lessonId} not found`);
  },
  addComment: (lessonId: string, text: string, rating?: number) => commentService.addComment(lessonId, text, rating),
  toggleLikeComment: async (lessonId: string, commentId: string): Promise<Lesson> => {
    const lesson = await lessonService.getLessonById(lessonId);
    if (!lesson) throw new Error(`Lesson ${lessonId} not found`);

    const updatedComments = (lesson.comments || []).map((c) => {
      if (c.id === commentId) {
        const isLiked = !c.isLiked;
        return {
          ...c,
          isLiked,
          likes: isLiked ? c.likes + 1 : Math.max(0, c.likes - 1),
        };
      }
      return c;
    });

    const updated = await lessonService.updateLesson(lessonId, { comments: updatedComments });
    return updated || lesson;
  },

  // Connections & Swaps
  getConnections: () => connectionService.getConnections(),
  getRecommendedStudents: () => connectionService.getRecommendedStudents(),
  sendSwapRequest: async (payload: { toUserId: string; teachSkill: string; learnSkill: string; message: string }) => {
    return connectionService.sendConnectionRequest(
      payload.toUserId,
      payload.teachSkill,
      payload.learnSkill,
      payload.message,
    );
  },
  sendConnectionRequest: (partnerId: string, skillOffered: string, skillRequested: string, msg?: string) =>
    connectionService.sendConnectionRequest(partnerId, skillOffered, skillRequested, msg),
  respondConnection: async (connectionId: string, accept: boolean) => {
    if (accept) {
      return connectionService.acceptRequest(connectionId);
    } else {
      return connectionService.rejectRequest(connectionId);
    }
  },
  acceptConnectionRequest: (connId: string) => connectionService.acceptRequest(connId),
  rejectConnectionRequest: (connId: string) => connectionService.rejectRequest(connId),

  // Search & Upload
  searchStudents: (filters: any) => searchService.searchStudents(filters),
  uploadMedia: (file: File, onProgress?: (p: number) => void) => uploadService.uploadMedia(file, onProgress),
  uploadLessonVideo: (
    arg1: File | string,
    arg2?: string | File | ((percent: number) => void),
    arg3?: (percent: number) => void
  ) => uploadService.uploadLessonVideo(arg1 as any, arg2 as any, arg3),
  deleteLessonVideo: (lessonId: string, storageKey?: string) =>
    uploadService.deleteLessonVideo(lessonId, storageKey),

  // Notifications
  getNotifications: () => notificationService.getNotifications(),
  markNotificationRead: (id: string) => notificationService.markNotificationRead(id),
  markAllNotificationsRead: () => notificationService.markAllNotificationsRead(),

  // Messaging & Chat
  getConversations: (userId: string) => messageService.getConversations(userId),
  getMessages: (conversationId: string, userId: string) => messageService.getMessages(conversationId, userId),
  sendMessage: (conversationId: string, content: string, senderId: string, context?: LessonContext) =>
    messageService.sendMessage(conversationId, content, senderId, context),
  startOrGetConversation: (userId: string, targetId: string, context?: LessonContext) =>
    messageService.startOrGetConversation(userId, targetId, context),
  blockUser: (userId: string, targetId: string, targetName: string) =>
    messageService.blockUser(userId, targetId, targetName),
  reportUser: (report: any) => messageService.reportUser(report),
  searchMessages: (userId: string, query: string) => messageService.searchMessages(userId, query),

  // Recommendations & Matching Engine
  getRecommendedMentors: (userId: string, filters?: any) => matchingService.getRecommendedMentors(userId, filters),
  getRecommendedLearners: (userId: string) => matchingService.getRecommendedLearners(userId),
  getRecommendedLessons: (userId: string, filters?: any) => matchingService.getRecommendedLessons(userId, filters),
  getSkillGaps: (userId: string) => matchingService.getSkillGaps(userId),
  getMatchExplanation: (mentorId: string, userId: string) => matchingService.getMatchExplanation(mentorId, userId),

  // Module Assessment & Integrity
  getAssessmentByModuleId: (moduleId: string) => assessmentService.getAssessmentByModuleId(moduleId),
  getAssessmentSummary: (moduleId: string, userId: string, isCompleted: boolean) =>
    assessmentService.getAssessmentSummary(moduleId, userId, isCompleted),
  startAssessmentAttempt: (assessmentId: string, userId: string) =>
    assessmentService.startAttempt(assessmentId, userId),
  saveAssessmentAnswer: (attemptId: string, questionId: string, answer: any) =>
    assessmentService.saveAnswer(attemptId, questionId, answer),
  submitAssessmentAttempt: (attemptId: string) => assessmentService.submitAttempt(attemptId),
  recordIntegrityEvent: (attemptId: string, type: any, desc: string, duration?: number) =>
    assessmentService.recordIntegrityEvent(attemptId, type, desc, duration),
  linkGoogleForm: (moduleId: string, url: string, title?: string) =>
    assessmentService.linkGoogleForm(moduleId, url, title),

  // Advanced Question Bank & Assessment Configuration
  getQuestionBank: (lessonId: string, includeArchived?: boolean) =>
    assessmentService.getQuestionBank(lessonId, includeArchived),
  addQuestionToBank: (lessonId: string, question: any) =>
    assessmentService.addQuestionToBank(lessonId, question),
  updateQuestionInBank: (lessonId: string, questionId: string, updates: any) =>
    assessmentService.updateQuestionInBank(lessonId, questionId, updates),
  deleteQuestionFromBank: (lessonId: string, questionId: string) =>
    assessmentService.deleteQuestionFromBank(lessonId, questionId),
  duplicateQuestionInBank: (lessonId: string, questionId: string) =>
    assessmentService.duplicateQuestionInBank(lessonId, questionId),
  getAssessmentConfig: (lessonId: string) =>
    assessmentService.getAssessmentConfig(lessonId),
  saveAssessmentConfig: (lessonId: string, config: any) =>
    assessmentService.saveAssessmentConfig(lessonId, config),
  getPreviewAssessment: (lessonId: string) =>
    assessmentService.getPreviewAssessment(lessonId),
  generateQuestionsWithAI: (params: any) =>
    assessmentService.generateQuestionsWithAI(params),
  getDetailedLessonAnalytics: (lessonId: string) =>
    assessmentService.getDetailedLessonAnalytics(lessonId),
  getStudentPerformanceStats: (userId: string) =>
    assessmentService.getStudentPerformanceStats(userId),
  executeCodeSafe: (language: string, code: string, testCases?: any[]) =>
    assessmentService.executeCodeSafe(language, code, testCases),
};

export const uploadLessonVideo = apiService.uploadLessonVideo;
export const deleteLessonVideo = apiService.deleteLessonVideo;

// Expose on global window object defensively
if (typeof window !== 'undefined') {
  (window as any).apiService = apiService;
  (window as any).uploadLessonVideo = apiService.uploadLessonVideo;
}

