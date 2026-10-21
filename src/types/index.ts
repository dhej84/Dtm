export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Mastery';

/**
 * Core User entity returned by authentication endpoints
 */
export interface User {
  id: string;
  name: string;
  email: string;
  university: string;
  department: string;
  year: string;
  isVerified: boolean;
  avatarUrl: string;
  role?: string;
  createdAt?: string;
}

/**
 * Base Skill in the collegiate catalog
 */
export interface Skill {
  id: string;
  name: string;
  category: string;
  description?: string;
  popularLevel?: SkillLevel;
  popularity?: number;
  studentsCount?: number;
}

/**
 * Associated Skill tied to a user profile (offered to teach or sought to learn)
 */
export interface UserSkill {
  id: string;
  userId?: string;
  skillId?: string;
  name: string;
  category: string;
  level: SkillLevel;
  type: 'teach' | 'learn';
  proficiencyPercent?: number;
  hoursLogged?: number;
  endorsementsCount?: number;
  targetLevel?: SkillLevel;
  targetDate?: string;
  partnerName?: string;
  description?: string;
}

// Backward-compatible Teaching & Learning Skill structures for UI components
export interface TeachingSkill {
  id: string;
  name: string;
  category: string;
  level: SkillLevel;
  hoursTaught: number;
  reviewsCount: number;
  endorsementsCount: number;
  description?: string;
  proficiencyPercent: number;
}

export interface LearningSkill {
  id: string;
  name: string;
  category: string;
  currentLevel: SkillLevel;
  targetLevel: SkillLevel;
  progressPercent: number;
  hoursPracticed: number;
  partnerName?: string;
  targetDate?: string;
}

/**
 * Peer-validated achievement or badge
 */
export interface Achievement {
  id: string;
  title: string;
  category: 'Teaching Mastery' | 'Learning Milestones';
  description: string;
  icon: string;
  iconBgColor: string;
  progressText: string;
  fillPercent: number;
  issuedDate: string;
  levelBadge: string;
  endorsementsCount: number;
  userEndorsed?: boolean;
}

// Alias for existing component compatibility
export type Badge = Achievement;

export interface PeerReview {
  id: string;
  authorName: string;
  authorInitials: string;
  authorProgram: string;
  rating: number;
  comment: string;
  topic: string;
  date: string;
}

export interface LearningMilestone {
  id: string;
  title: string;
  description: string;
  timeAgo: string;
  date: string;
  type: 'teaching' | 'learning' | 'badge';
  creditsChange?: number;
  badgeTriggered?: string;
  partnerName?: string;
  term: string;
}

export interface PrivacySettings {
  verifiedPeersOnly: boolean;
  allowDirectSwaps: boolean;
  publicLearningHistory: boolean;
  maskReviews: boolean;
  publicProfileEnabled?: boolean;
}

/**
 * Publicly visible student profile structure for external sharing.
 * Strictly omits all private attributes (email, password, auth tokens, wallet balance,
 * internal private learning logs, connections, messages, test answers, monitoring events).
 */
export interface PublicSkillItem {
  name: string;
  category?: string;
  level: string;
  description?: string;
  endorsementsCount?: number;
  hoursTaught?: number;
}

export interface PublicAchievementItem {
  id?: string;
  title: string;
  category: string;
  description?: string;
  icon?: string;
  iconBgColor?: string;
  levelBadge?: string;
}

export interface PublicLessonItem {
  id: string;
  title: string;
  category: string;
  description: string;
  difficultyLevel?: string;
  durationMinutes?: number;
}

export interface PublicActivitySummary {
  hoursTaught?: number;
  hoursLearned?: number | null;
  reviewCount?: number;
  peerReputation?: number;
  swapFulfillRate?: number;
  memberSince?: string;
}

export interface PublicProfile {
  publicProfileId: string;
  name: string;
  avatarUrl: string;
  bio: string;
  university?: string;
  department?: string;
  year?: string;
  location?: string;
  rank?: string;
  memberSince?: string;
  isVerified?: boolean;
  publicProfileEnabled: boolean;
  publicLearningHistory: boolean;
  teachingSkills: PublicSkillItem[];
  learningSkills: PublicSkillItem[];
  achievements: PublicAchievementItem[];
  lessonsCreated: PublicLessonItem[];
  activitySummary: PublicActivitySummary;
}

/**
 * Full student profile combining credentials, metrics, and skill matrix
 */
export interface Profile {
  id: string;
  publicProfileId?: string;
  publicProfileEnabled?: boolean;
  name: string;
  email: string;
  university: string;
  department: string;
  year: string;
  bio: string;
  location: string;
  avatarUrl: string;
  isVerified: boolean;
  rank: string;
  memberSince: string;
  walletBalance: number;
  hoursTaught: number;
  hoursLearned: number;
  peerReputation: number;
  reviewCount: number;
  swapFulfillRate: number;
  privacy: PrivacySettings;
  teachingSkills: TeachingSkill[];
  learningSkills: LearningSkill[];
  badges: Achievement[];
  reviews: PeerReview[];
  journey: LearningMilestone[];
}

// Alias for existing component compatibility
export type UserProfile = Profile;

export interface LessonModule {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  description: string;
  contentSnippet?: string;
  videoUrl?: string;
}

/**
 * Comment / Discussion thread item on lessons
 */
export interface Comment {
  id: string;
  lessonId?: string;
  authorId?: string;
  authorName: string;
  authorAvatar: string;
  authorProgram: string;
  timestamp: string;
  text: string;
  likes: number;
  isLiked?: boolean;
}

// Alias for existing component compatibility
export type LessonComment = Comment;

export interface LessonResource {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'code' | 'slides' | 'link';
}

/**
 * Peer workshop or 1-on-1 tutoring lesson
 */
export interface Lesson {
  id: string;
  title: string;
  skill: string;
  category: string;
  description: string;
  skillLevel: SkillLevel;
  format: 'Interactive Workshop' | '1:1 Tutoring' | 'Code Walkthrough' | 'Practice Lab';
  teacherId: string;
  teacherName: string;
  teacherAvatar: string;
  teacherUniversity: string;
  teacherRating: number;
  teacherReviewCount: number;
  durationMinutes: number;
  creditsRequired: number;
  prerequisites: string;
  enrolledStudentsCount: number;
  modules: LessonModule[];
  resources: LessonResource[];
  comments: Comment[];
  userNotes?: string;
  isCompleted?: boolean;
  progressPercent?: number;
  videoUrl?: string;
  videoFileName?: string;
  videoDuration?: string;
  videoFileSize?: number;
  videoMimeType?: string;
  videoStorageKey?: string;
  videoUploadedAt?: string;
  isPublished?: boolean;
}

export interface LessonVideoMetadata {
  id: string;
  lessonId: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  duration?: string;
  storageKey: string;
  storageUrl: string;
  uploadedBy: string;
  createdAt: string;
}

export interface PublicVideo {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  creatorPublicProfileId?: string;
  lessonId?: string;
  skill: string;
  level: string;
  videoUrl: string;
  fileName?: string;
  fileSize?: number;
  duration?: string;
  isPublic: boolean;
  visibility?: 'public' | 'private';
  createdAt: string;
}

/**
 * Lesson progress record for a specific user
 */
export interface LessonProgress {
  lessonId: string;
  userId?: string;
  progressPercent: number;
  completedModuleIds?: string[];
  isCompleted: boolean;
  userNotes?: string;
  currentStepIndex?: number;
  completedAt?: string;
  lastAccessedAt?: string;
  updatedAt?: string;
}

export interface LearningHistoryItem {
  id: string;
  date: string;
  title: string;
  category: string;
  partner: string;
  duration: string;
  creditsEarned: number;
  status: 'completed' | 'in_progress';
}

export interface StudentProgressSummary {
  lessonsStarted: number;
  lessonsCompleted: number;
  totalHoursExchanged: number;
  swapCreditsBalance: number;
  activeSwapsCount: number;
  history: LearningHistoryItem[];
}

/**
 * Peer swap proposal / connection entity
 */
export interface Connection {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string;
  fromUserProgram: string;
  toUserId: string;
  toUserName: string;
  toUserAvatar: string;
  toUserProgram: string;
  teachSkill: string;
  learnSkill: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  createdAt: string;
  direction: 'incoming' | 'outgoing';
}

// Alias for existing component compatibility
export type SwapConnection = Connection;

export interface StudentMatch {
  student: Profile;
  matchScore: number;
  mutualSkills: string[];
  connectionStatus: 'none' | 'pending' | 'connected';
}

export interface LessonFilters {
  query?: string;
  search?: string;
  skill?: string;
  level?: string;
  category?: string;
}

export interface SearchFilters {
  query?: string;
  type?: 'all' | 'students' | 'lessons';
  skill?: string;
  level?: string;
  category?: string;
}

/**
 * Search and Filter Results schema
 */
export interface SearchResult {
  query: string;
  totalCount: number;
  students: Profile[];
  lessons: Lesson[];
  skills: Skill[];
}

export interface UploadResponse {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'swap_request' | 'badge_earned' | 'review_received' | 'lesson_update';
  actionUrl?: string;
}

export interface AccessibilityOptions {
  fontSize: 'normal' | 'medium' | 'large';
  highContrast: boolean;
  reducedMotion: boolean;
}

/**
 * Generic API Response and Error payloads for REST communication
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  statusCode: number;
}

export interface ApiErrorPayload {
  message: string;
  statusCode: number;
  code?: string;
  details?: Record<string, any>;
}

/**
 * =======================================================
 * MENTOR ↔ LEARNER MESSAGING & NLP TYPES
 * =======================================================
 */

export type MessageStatus = 'SENDING' | 'SENT' | 'DELIVERED' | 'READ';

export interface LessonContext {
  lessonId: string;
  lessonTitle: string;
  moduleId?: string;
  moduleTitle?: string;
  progressPercent?: number;
  skillName?: string;
  category?: string;
}

export type SupportedLanguage =
  | 'English'
  | 'Tamil'
  | 'Tanglish'
  | 'Hindi'
  | 'Telugu'
  | 'Kannada'
  | 'Malayalam'
  | 'Bengali'
  | 'Marathi';

export type MessageIntent =
  | 'concept_clarification'
  | 'debugging'
  | 'practice_request'
  | 'resource_request'
  | 'schedule_swap'
  | 'feedback'
  | 'general';

export interface LanguageDetectionResult {
  detectedLanguage: SupportedLanguage;
  confidence: number;
  intent: MessageIntent;
  topic?: string;
  englishTranslation?: string;
  isCodeMixed: boolean;
  explanationNotes?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  recipientId?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  status: MessageStatus;
  referencedLesson?: LessonContext;
  languageInfo?: LanguageDetectionResult;
  retrying?: boolean;
  failed?: boolean;
}

export interface Conversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  participant1Name: string;
  participant1Avatar: string;
  participant1Program?: string;
  participant1Role: 'mentor' | 'learner' | 'peer';
  participant2Name: string;
  participant2Avatar: string;
  participant2Program?: string;
  participant2Role: 'mentor' | 'learner' | 'peer';
  lastMessage?: ChatMessage;
  lastMessageAt: string;
  unreadCountUser1: number;
  unreadCountUser2: number;
  activeLessonContext?: LessonContext;
  isBlocked?: boolean;
  blockedByUserId?: string;
  connectionId?: string;
  createdAt: string;
}

export interface ConversationSummary {
  conversation: Conversation;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string;
  partnerProgram: string;
  partnerRole: 'mentor' | 'learner' | 'peer';
  unreadCount: number;
  lastMessageSnippet: string;
  lastMessageTimestamp: string;
  lastMessageStatus?: MessageStatus;
  isOnline: boolean;
}

export interface MessageReport {
  id: string;
  reporterUserId: string;
  reportedUserId: string;
  messageId?: string;
  conversationId: string;
  reason: string;
  details?: string;
  createdAt: string;
}

export interface BlockedUser {
  id: string;
  blockerUserId: string;
  blockedUserId: string;
  blockedUserName: string;
  createdAt: string;
}

/**
 * =======================================================
 * MATCHING & RECOMMENDATION ENGINE TYPES
 * =======================================================
 */

export interface MentorRecommendation {
  mentor: UserProfile;
  matchScore: number;
  relevantSkills: string[];
  reasons: string[];
  connectionStatus: 'none' | 'pending' | 'connected';
  conversationId?: string;
  levelCompatibility: string;
  languages: string[];
  isMutualSwap: boolean;
  mutualSkills: string[];
}

export interface LearnerRecommendation {
  learner: UserProfile;
  matchScore: number;
  skillsWanted: string[];
  reasons: string[];
  connectionStatus: 'none' | 'pending' | 'connected';
  conversationId?: string;
  languages: string[];
}

export interface LessonRecommendation {
  lesson: Lesson;
  matchScore: number;
  relevantSkill: string;
  reasons: string[];
  isCompleted: boolean;
  learningGapTarget?: string;
}

export interface SkillGap {
  id: string;
  skillName: string;
  category: string;
  currentProficiency: number;
  currentLevel: SkillLevel;
  targetLevel: SkillLevel;
  learningStatus: 'not_started' | 'in_progress' | 'mastered';
  identifiedAreas: string[];
  explanation: string;
  recommendedLessonIds: string[];
  recommendedMentorIds: string[];
}

export interface MatchScoreFactor {
  name: string;
  score: number;
  maxScore: number;
  description: string;
}

export interface MatchExplanation {
  candidateId: string;
  candidateName: string;
  overallScore: number;
  factorBreakdown: MatchScoreFactor[];
  summary: string;
}

/**
 * =======================================================
 * MODULE ASSESSMENT & INTEGRITY TYPES
 * =======================================================
 */

export type AssessmentQuestionType =
  | 'multiple_choice'
  | 'multiple_answer'
  | 'true_false'
  | 'short_answer'
  | 'coding'
  | 'long_answer';

export interface CodingTestCase {
  input: string;
  expectedOutput: string;
  isSample?: boolean;
}

export interface AssessmentQuestion {
  id: string;
  assessmentId: string;
  questionText: string;
  type: AssessmentQuestionType;
  options?: string[];
  correctAnswers: string[];
  explanation: string;
  topic: string;
  points: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  timeLimitSeconds?: number; // e.g. 60-90s for objective, 900s (15 min) for coding, 300s for long answer
  // Coding question specific fields
  codingLanguage?: string;
  problemStatement?: string;
  inputDescription?: string;
  outputDescription?: string;
  constraints?: string;
  starterCode?: string;
  testCases?: CodingTestCase[];
  // Long answer / scenario specific fields
  rubricGuidelines?: string;
  sampleAnswer?: string;
  evaluationType?: 'auto' | 'manual_review' | 'hybrid';
}

export type IntegrityEventType =
  | 'tab_switch'
  | 'focus_loss'
  | 'fullscreen_exit'
  | 'network_loss'
  | 'inactivity'
  | 'returned_focus'
  | 'page_reload'
  | 'timer_expired';

export interface AssessmentIntegrityEvent {
  id: string;
  attemptId: string;
  eventType: IntegrityEventType;
  timestamp: string;
  description: string;
  durationSeconds?: number;
}

export interface Assessment {
  id: string;
  lessonId: string;
  moduleId?: string;
  moduleTitle?: string;
  lessonTitle: string;
  title: string;
  description: string;
  timeLimitMinutes: number;
  passingScorePercent: number;
  maxAttempts: number;
  cooldownMinutes?: number;
  questions: AssessmentQuestion[];
  isExternalGoogleForm?: boolean;
  googleFormUrl?: string;
  createdAt: string;
}

export interface AssessmentAttempt {
  id: string;
  assessmentId: string;
  lessonId: string;
  moduleId?: string;
  userId: string;
  attemptNumber: number;
  status: 'not_attempted' | 'in_progress' | 'submitted' | 'evaluated';
  selectedQuestionIds: string[]; // Selected subset of questions for this specific attempt
  currentQuestionIndex?: number;
  currentQuestionStartedAt?: string;
  answers: Record<string, string | string[]>;
  markedForReview?: string[];
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  codingMarks?: number;
  longAnswerMarks?: number;
  pendingReviewCount?: number;
  isPendingEvaluation?: boolean;
  warningsCount?: number;
  startTime: string;
  endTime?: string;
  timeTakenSeconds?: number;
  integrityEvents: AssessmentIntegrityEvent[];
  feedback: string;
  topicsToRevise: string[];
  weakestTopic?: string;
}

export interface AssessmentSummary {
  assessment: Assessment;
  bestAttempt?: AssessmentAttempt;
  attemptsCount: number;
  canAttempt: boolean;
  isUnlocked: boolean;
}

export interface LessonAssessmentAnalytics {
  lessonId: string;
  lessonTitle: string;
  studentsAttempted: number;
  completionRate: number;
  averageScore: number;
  passRate: number;
  commonWeakTopics: { topic: string; missRate: number }[];
}

export interface AssessmentConfiguration {
  id?: string;
  lessonId: string;
  questionCount: number;
  totalMarks: number;
  passingPercentage: number;
  maxAttempts: number;
  overallTimeLimitMinutes: number;
  codingTimeLimitMinutes: number;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  difficultyDistribution: {
    easyPercent: number;
    mediumPercent: number;
    hardPercent: number;
  };
  topicDistribution?: Record<string, number>;
  showExplanationsAfterSubmission: boolean;
}

export interface QuestionBankItem extends AssessmentQuestion {
  lessonId?: string;
  isArchived?: boolean;
  tags?: string[];
}

export interface QuestionAnalytics {
  questionId: string;
  questionText: string;
  attempts: number;
  correctPercentage: number;
  incorrectPercentage: number;
  averageMarks: number;
  totalMarks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

export interface TopicAnalytics {
  topic: string;
  averageScorePercentage: number;
  attemptsCount: number;
  isLearningGap: boolean;
}

export interface DifficultyAnalytics {
  difficulty: 'easy' | 'medium' | 'hard';
  averageScorePercentage: number;
  attemptsCount: number;
}

export interface DetailedLessonAnalytics {
  lessonId: string;
  lessonTitle: string;
  studentsAttempted: number;
  studentsCompleted: number;
  averageScore: number;
  passRate: number;
  averageCompletionTimeSeconds: number;
  averageAttempts: number;
  questionPerformance: QuestionAnalytics[];
  topicPerformance: TopicAnalytics[];
  difficultyPerformance: DifficultyAnalytics[];
}

export interface StudentAssessmentStats {
  assessmentsCompleted: number;
  averageScore: number;
  bestScore: number;
  lessonsCompleted: number;
  recentResults: {
    lessonId: string;
    lessonTitle: string;
    score: number;
    percentage: number;
    date: string;
    passed: boolean;
  }[];
  scoreProgression: {
    date: string;
    scorePercentage: number;
    lessonTitle: string;
  }[];
  topicProficiency: Record<string, number>;
  identifiedGaps: string[];
}

export interface AIGenerateQuestionsRequest {
  lessonId: string;
  questionCount: number;
  questionTypes: AssessmentQuestionType[];
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  topic?: string;
  marks?: number;
  customContext?: string;
}




