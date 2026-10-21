/**
 * Centralized API configuration.
 *
 * IMPORTANT:
 * Endpoint paths and backend base URL are defined centrally here so they can
 * easily be adjusted when the backend engineering team finalizes the OpenAPI / REST spec.
 */

export const API_BASE_URL: string = '/api/v1';

// Strictly false so all users, videos, lessons, and messaging use the shared backend/database
export const USE_MOCK_API: boolean = false;

export const AUTH_ENDPOINTS = {
  SIGNUP: '/auth/signup',
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  REFRESH_TOKEN: '/auth/refresh',
} as const;

export const USER_ENDPOINTS = {
  PROFILE: '/users/profile',
  STUDENT_BY_ID: (id: string) => `/users/students/${id}`,
  GET_STUDENT_BY_ID: (id: string) => `/users/students/${id}`,
  ALL_STUDENTS: '/users/students',
  SKILL_SWAP: '/users/skill-swap',
  DIRECTORY: '/users/directory',
  UPDATE_PROFILE: '/users/profile',
  PRIVACY_SETTINGS: '/users/profile/privacy',
  UPDATE_PRIVACY: '/users/profile/privacy',
  ENDORSE_BADGE: (badgeId: string) => `/users/badges/${badgeId}/endorse`,
  PUBLIC_PROFILE: (id: string) => `/public-profiles/${id}`,
  REGENERATE_PUBLIC_PROFILE: '/public-profiles/regenerate',
} as const;

export const SKILL_ENDPOINTS = {
  AVAILABLE: '/skills',
  AVAILABLE_SKILLS: '/skills',
  TEACHING_SKILLS: '/skills/teaching',
  ADD_TEACHING_SKILL: '/skills/teaching',
  REMOVE_TEACHING_SKILL: (id: string) => `/skills/teaching/${id}`,
  LEARNING_SKILLS: '/skills/learning',
  ADD_LEARNING_SKILL: '/skills/learning',
  REMOVE_LEARNING_SKILL: (id: string) => `/skills/learning/${id}`,
  UPDATE_LEVEL: (id: string) => `/skills/${id}/level`,
  UPDATE_SKILL_LEVEL: (id: string) => `/skills/${id}/level`,
  ENDORSE_BADGE: (badgeId: string) => `/skills/badges/${badgeId}/endorse`,
} as const;

export const LESSON_ENDPOINTS = {
  LIST: '/lessons',
  LESSONS: '/lessons',
  BY_ID: (id: string) => `/lessons/${id}`,
  GET_BY_ID: (id: string) => `/lessons/${id}`,
  CREATE: '/lessons',
  UPDATE: (id: string) => `/lessons/${id}`,
  DELETE: (id: string) => `/lessons/${id}`,
  RESOURCES: (id: string) => `/lessons/${id}/resources`,
  VIDEO: (id: string) => `/lessons/${id}/video`,
  DELETE_VIDEO: (id: string) => `/lessons/${id}/video`,
} as const;

export const PROGRESS_ENDPOINTS = {
  SUMMARY: '/progress/summary',
  STUDENT_PROGRESS: (studentId?: string) =>
    studentId ? `/progress/students/${studentId}` : '/progress/me',
  START: (lessonId: string) => `/progress/lessons/${lessonId}/start`,
  START_LESSON: (lessonId: string) => `/progress/lessons/${lessonId}/start`,
  UPDATE: (lessonId: string) => `/progress/lessons/${lessonId}`,
  UPDATE_MODULE_PROGRESS: (lessonId: string, moduleId: string) =>
    `/progress/lessons/${lessonId}/modules/${moduleId}`,
  COMPLETE: (lessonId: string) => `/progress/lessons/${lessonId}/complete`,
  COMPLETE_LESSON: (lessonId: string) => `/progress/lessons/${lessonId}/complete`,
  HISTORY: '/progress/history',
  LEARNING_HISTORY: '/progress/history',
  NOTES: (lessonId: string) => `/progress/lessons/${lessonId}/notes`,
  UPDATE_NOTES: (lessonId: string) => `/progress/lessons/${lessonId}/notes`,
} as const;

export const COMMENT_ENDPOINTS = {
  LIST: (lessonId: string) => `/lessons/${lessonId}/comments`,
  GET_BY_LESSON: (lessonId: string) => `/lessons/${lessonId}/comments`,
  ADD: (lessonId: string) => `/lessons/${lessonId}/comments`,
  POST_COMMENT: (lessonId: string) => `/lessons/${lessonId}/comments`,
  DELETE: (commentId: string) => `/comments/${commentId}`,
  TOGGLE_LIKE: (lessonId: string, commentId: string) =>
    `/lessons/${lessonId}/comments/${commentId}/like`,
} as const;

export const CONNECTION_ENDPOINTS = {
  LIST: '/connections',
  CONNECTIONS: '/connections',
  RECOMMENDED: '/connections/recommended',
  SEND_REQUEST: '/connections/requests',
  ACCEPT: (connectionId: string) => `/connections/requests/${connectionId}/accept`,
  ACCEPT_REQUEST: (connectionId: string) => `/connections/requests/${connectionId}/accept`,
  REJECT: (connectionId: string) => `/connections/requests/${connectionId}/reject`,
  REJECT_REQUEST: (connectionId: string) => `/connections/requests/${connectionId}/reject`,
} as const;

export const SEARCH_ENDPOINTS = {
  SEARCH: '/search',
  UNIFIED: '/search',
  STUDENTS: '/search/students',
  LESSONS: '/search/lessons',
  BY_SKILL: '/search/skills',
  VIDEOS: '/videos/search',
} as const;

export const UPLOAD_ENDPOINTS = {
  MEDIA: '/uploads/lesson-media',
  AVATAR: '/uploads/avatar',
  LESSON_MEDIA: '/uploads/lesson-media',
  LESSON_VIDEO: '/uploads/lesson-video',
  LESSON_ATTACHMENT: (lessonId: string) => `/uploads/lessons/${lessonId}/attachments`,
  DELETE_MEDIA: (mediaId: string) => `/uploads/media/${mediaId}`,
  VIDEO_STREAM: (fileName: string) => `/videos/${fileName}`,
} as const;

export const NOTIFICATION_ENDPOINTS = {
  LIST: '/notifications',
  MARK_READ: (id: string) => `/notifications/${id}/read`,
  MARK_ALL_READ: '/notifications/read-all',
} as const;

export const CONVERSATION_ENDPOINTS = {
  LIST: '/conversations',
  MESSAGES: (convId: string) => `/conversations/${convId}/messages`,
  START: '/conversations/start',
} as const;

export const MESSAGE_ENDPOINTS = {
  SEND: '/messages',
  BLOCK: '/messages/block',
  UNBLOCK: '/messages/block',
  REPORT: '/messages/report',
} as const;

export const RECOMMENDATION_ENDPOINTS = {
  MENTORS: '/recommendations/mentors',
  LEARNERS: '/recommendations/learners',
  LESSONS: '/recommendations/lessons',
  SKILL_GAPS: '/recommendations/skill-gaps',
  EXPLANATION: (candidateId: string) => `/recommendations/explanation/${candidateId}`,
} as const;

export const ASSESSMENT_ENDPOINTS = {
  BY_MODULE: (moduleId: string) => `/assessments/module/${moduleId}`,
  START: (assessmentId: string) => `/assessments/${assessmentId}/start`,
  SAVE_ANSWER: (attemptId: string) => `/assessments/attempts/${attemptId}/answers`,
  SUBMIT: (attemptId: string) => `/assessments/attempts/${attemptId}/submit`,
  INTEGRITY_EVENT: (attemptId: string) => `/assessments/attempts/${attemptId}/integrity-event`,
  GOOGLE_FORM: '/assessments/google-form',
} as const;



