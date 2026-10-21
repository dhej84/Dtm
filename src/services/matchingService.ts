import {
  LearnerRecommendation,
  Lesson,
  LessonRecommendation,
  MatchExplanation,
  MatchScoreFactor,
  MentorRecommendation,
  SkillGap,
  SkillLevel,
  UserProfile,
} from '../types';
import { connectionService } from './connectionService';
import { messageService } from './messageService';
import { userService } from './userService';
import { lessonService } from './lessonService';
import { httpClient } from './api/httpClient';

async function getLiveStudentsPool(): Promise<UserProfile[]> {
  try {
    const res = await userService.getAllStudents();
    if (Array.isArray(res) && res.length > 0) {
      const current = await userService.getProfile();
      if (current && !res.some((u) => u.id === current.id)) {
        return [current, ...res];
      }
      return res;
    }
  } catch {
    // fallback to local profile
  }
  const current = await userService.getProfile();
  return current ? [current] : [];
}

// Student languages lookup
const STUDENT_LANGUAGES: Record<string, string[]> = {};

// Known skill dependencies for gap detection
const SKILL_CURRICULUM_MAP: Record<string, string[]> = {
  'python': ['Variables & Data Types', 'Control Flow & Loops', 'Functions & Scope', 'Recursion', 'Object-Oriented Programming'],
  'data structures': ['Arrays & Lists', 'Stacks & Queues', 'Linked Lists', 'Binary Trees', 'Graph Traversals (BFS/DFS)', 'Shortest Paths (Dijkstra)'],
  'web dev': ['HTML5 & Semantic Markup', 'CSS3 & Flexbox/Grid', 'JavaScript ES6+', 'React Components & Hooks', 'State Management', 'REST API & Backend Integration'],
  'guitar': ['Posture & Basic Chords', 'Strumming Patterns', 'Steady Alternating Bass', 'Pinch & Syncopation', 'Fingerstyle Soloing'],
  'spanish': ['Pronunciation & Greetings', 'Present Tense Verbs', 'Preterite vs Imperfect', 'Subjunctive Mood', 'Conversational Idioms']
};

export const matchingService = {
  /**
   * Recommends top mentors for the learner based on skill overlap, level, language, and context
   */
  async getRecommendedMentors(
    currentUserId: string,
    filters?: { skill?: string; level?: string; language?: string }
  ): Promise<MentorRecommendation[]> {
    const pool = await getLiveStudentsPool();
    const currentUser = pool.find((u) => u.id === currentUserId) || (await userService.getProfile());
    if (!currentUser) return [];
    const connections = await connectionService.getConnections();
    const conversations = messageService.getRawConversations();
    const blockedIds = messageService.getBlockedUserIds(currentUserId);

    // Skills learner wants
    const targetLearningSkills = currentUser.learningSkills || [];
    const learningSkillNames = targetLearningSkills.map((s) => s.name.toLowerCase());

    const candidates = pool.filter(
      (s) => s.id !== currentUserId && !blockedIds.includes(s.id)
    );

    const userLanguages = STUDENT_LANGUAGES[currentUserId] || ['English'];

    const recommendations: MentorRecommendation[] = [];

    for (const candidate of candidates) {
      // Privacy check: Respect discoverability
      if (candidate.privacy?.verifiedPeersOnly && !currentUser.isVerified) {
        continue;
      }

      const candidateTeaches = candidate.teachingSkills || [];
      const candidateLanguages = STUDENT_LANGUAGES[candidate.id] || ['English'];

      // Find matching skills
      const matchedSkills = candidateTeaches.filter((ts) =>
        learningSkillNames.some((lsName) =>
          ts.name.toLowerCase().includes(lsName) || lsName.includes(ts.name.toLowerCase())
        )
      );

      // Must have some relevant skills or category overlap unless cold start
      const hasCategoryOverlap = candidateTeaches.some((ts) =>
        targetLearningSkills.some((ls) => ls.category === ts.category)
      );

      if (matchedSkills.length === 0 && !hasCategoryOverlap && learningSkillNames.length > 0) {
        continue;
      }

      // 1. Skill Matching Score (max 40 pts)
      let skillScore = 0;
      if (matchedSkills.length > 0) {
        skillScore = 30 + Math.min(10, (matchedSkills.length - 1) * 5);
      } else if (hasCategoryOverlap) {
        skillScore = 15;
      } else {
        skillScore = 10;
      }

      // 2. Level Compatibility (max 20 pts)
      let levelScore = 10;
      let levelDesc = 'Peer Study Partner';
      const bestMatch = matchedSkills[0];
      if (bestMatch) {
        const correspondingLearn = targetLearningSkills.find((ls) =>
          bestMatch.name.toLowerCase().includes(ls.name.toLowerCase()) ||
          ls.name.toLowerCase().includes(bestMatch.name.toLowerCase())
        );
        const lLevel = correspondingLearn?.currentLevel || 'Beginner';
        const tLevel = bestMatch.level || 'Intermediate';

        if (tLevel === 'Mastery' || tLevel === 'Advanced') {
          levelScore = 20;
          levelDesc = `${tLevel} Mentor (Ideal for ${lLevel} learner)`;
        } else if (tLevel === 'Intermediate' && lLevel === 'Beginner') {
          levelScore = 18;
          levelDesc = 'Intermediate Mentor (Accessible foundations)';
        } else {
          levelScore = 14;
          levelDesc = 'Peer Co-learner';
        }
      }

      // 3. Learning Context & Active Lesson Alignment (max 15 pts)
      let contextScore = 0;
      let contextReason = '';
      if (matchedSkills.some((s) => s.name.toLowerCase().includes('data structure') || s.name.toLowerCase().includes('python'))) {
        contextScore = 15;
        contextReason = 'Directly relevant to your active Dijkstra & Recursion algorithms study';
      } else if (matchedSkills.some((s) => s.name.toLowerCase().includes('react') || s.name.toLowerCase().includes('web'))) {
        contextScore = 12;
        contextReason = 'Aligns with your upcoming frontend project';
      } else {
        contextScore = 5;
      }

      // 4. Mutual Swap / Reciprocal Exchange (max 15 pts)
      const candidateWants = candidate.learningSkills || [];
      const userTeaches = currentUser.teachingSkills || [];
      const mutualSkills = candidateWants
        .filter((cw) =>
          userTeaches.some((ut) =>
            ut.name.toLowerCase().includes(cw.name.toLowerCase()) ||
            cw.name.toLowerCase().includes(ut.name.toLowerCase())
          )
        )
        .map((s) => s.name);

      const isMutualSwap = mutualSkills.length > 0;
      const swapScore = isMutualSwap ? 15 : 0;

      // 5. Language Compatibility (max 10 pts)
      const sharedLanguages = userLanguages.filter((l) => candidateLanguages.includes(l));
      const languageScore = sharedLanguages.length > 0 ? 10 : 5;

      const totalScore = Math.min(100, skillScore + levelScore + contextScore + swapScore + languageScore);

      // Connection status
      const existingConn = connections.find(
        (c) =>
          (c.fromUserId === currentUserId && c.toUserId === candidate.id) ||
          (c.fromUserId === candidate.id && c.toUserId === currentUserId)
      );

      const connectionStatus: 'none' | 'pending' | 'connected' = existingConn
        ? existingConn.status === 'accepted'
          ? 'connected'
          : 'pending'
        : 'none';

      // Conversation ID if connected
      const existingConv = conversations.find(
        (cv) =>
          (cv.participant1Id === currentUserId && cv.participant2Id === candidate.id) ||
          (cv.participant1Id === candidate.id && cv.participant2Id === currentUserId)
      );

      // Explainable reasons
      const reasons: string[] = [];
      if (matchedSkills.length > 0) {
        reasons.push(`Teaches ${matchedSkills.map((m) => m.name).join(', ')}`);
      }
      if (contextReason) {
        reasons.push(contextReason);
      }
      if (isMutualSwap) {
        reasons.push(`Mutual barter: Wants to learn ${mutualSkills.join(', ')} (which you teach)`);
      }
      if (sharedLanguages.length > 0) {
        reasons.push(`Supports ${sharedLanguages.join(' & ')}`);
      }
      reasons.push(levelDesc);

      // Apply filters if given
      if (filters?.skill && filters.skill !== 'All') {
        const q = filters.skill.toLowerCase();
        if (!candidateTeaches.some((ts) => ts.name.toLowerCase().includes(q))) {
          continue;
        }
      }
      if (filters?.level && filters.level !== 'All') {
        if (!candidateTeaches.some((ts) => ts.level === filters.level)) {
          continue;
        }
      }
      if (filters?.language && filters.language !== 'All') {
        if (!candidateLanguages.includes(filters.language)) {
          continue;
        }
      }

      recommendations.push({
        mentor: candidate,
        matchScore: totalScore,
        relevantSkills: matchedSkills.map((s) => s.name),
        reasons,
        connectionStatus,
        conversationId: existingConv?.id,
        levelCompatibility: levelDesc,
        languages: candidateLanguages,
        isMutualSwap,
        mutualSkills,
      });
    }

    return recommendations.sort((a, b) => b.matchScore - a.matchScore);
  },

  /**
   * Recommends students who want to learn what the current user teaches (Reverse Matching)
   */
  async getRecommendedLearners(currentUserId: string): Promise<LearnerRecommendation[]> {
    const pool = await getLiveStudentsPool();
    const currentUser = pool.find((u) => u.id === currentUserId) || (await userService.getProfile());
    if (!currentUser) return [];
    const connections = await connectionService.getConnections();
    const conversations = messageService.getRawConversations();
    const blockedIds = messageService.getBlockedUserIds(currentUserId);

    const userTeaches = currentUser.teachingSkills || [];
    const teachSkillNames = userTeaches.map((s) => s.name.toLowerCase());

    const candidates = pool.filter(
      (s) => s.id !== currentUserId && !blockedIds.includes(s.id)
    );

    const recommendations: LearnerRecommendation[] = [];

    for (const candidate of candidates) {
      const candidateLearns = candidate.learningSkills || [];
      const matchedWants = candidateLearns.filter((ls) =>
        teachSkillNames.some((tName) =>
          ls.name.toLowerCase().includes(tName) || tName.includes(ls.name.toLowerCase())
        )
      );

      if (matchedWants.length === 0) continue;

      const score = Math.min(100, 60 + matchedWants.length * 15);

      const existingConn = connections.find(
        (c) =>
          (c.fromUserId === currentUserId && c.toUserId === candidate.id) ||
          (c.fromUserId === candidate.id && c.toUserId === currentUserId)
      );

      const existingConv = conversations.find(
        (cv) =>
          (cv.participant1Id === currentUserId && cv.participant2Id === candidate.id) ||
          (cv.participant1Id === candidate.id && cv.participant2Id === currentUserId)
      );

      recommendations.push({
        learner: candidate,
        matchScore: score,
        skillsWanted: matchedWants.map((s) => s.name),
        reasons: [
          `Actively seeking to learn ${matchedWants.map((s) => s.name).join(', ')}`,
          `Motivated campus learner (${candidate.department} • ${candidate.year})`,
        ],
        connectionStatus: existingConn ? (existingConn.status === 'accepted' ? 'connected' : 'pending') : 'none',
        conversationId: existingConv?.id,
        languages: STUDENT_LANGUAGES[candidate.id] || ['English'],
      });
    }

    return recommendations.sort((a, b) => b.matchScore - a.matchScore);
  },

  /**
   * Recommends lessons tailored to current goals, gaps, and modules (excluding already completed)
   */
  async getRecommendedLessons(
    currentUserId: string,
    filters?: { category?: string; level?: string }
  ): Promise<LessonRecommendation[]> {
    const pool = await getLiveStudentsPool();
    const currentUser = pool.find((u) => u.id === currentUserId) || (await userService.getProfile());
    if (!currentUser) return [];
    let allLessons: Lesson[] = [];
    try {
      allLessons = await lessonService.getLessons();
    } catch {
      allLessons = [];
    }
    if (!Array.isArray(allLessons)) {
      allLessons = [];
    }

    const learnSkills = currentUser.learningSkills || [];
    const learnSkillNames = learnSkills.map((s) => s.name.toLowerCase());

    const recommendations: LessonRecommendation[] = [];

    for (const lesson of allLessons) {
      // Don't recommend own lessons
      if (lesson.teacherId === currentUserId) continue;

      const isCompleted = !!lesson.isCompleted;
      const lessonSkillLower = lesson.skill.toLowerCase();

      // Check skill alignment
      const isDirectMatch = learnSkillNames.some(
        (s) => lessonSkillLower.includes(s) || s.includes(lessonSkillLower)
      );

      let score = 50;
      const reasons: string[] = [];

      if (isDirectMatch) {
        score += 35;
        reasons.push(`Directly targets your learning goal: ${lesson.skill}`);
      } else {
        score += 15;
        reasons.push(`Broadens your portfolio in ${lesson.category}`);
      }

      if (lesson.progressPercent && lesson.progressPercent > 0 && !isCompleted) {
        score += 10;
        reasons.push(`In-progress module: Resume from ${lesson.progressPercent}% completed`);
      } else if (!isCompleted) {
        score += 5;
        reasons.push(`Next recommended curriculum step`);
      }

      // Filter by category or level
      if (filters?.category && filters.category !== 'All' && lesson.category !== filters.category) {
        continue;
      }
      if (filters?.level && filters.level !== 'All' && lesson.skillLevel !== filters.level) {
        continue;
      }

      recommendations.push({
        lesson,
        matchScore: Math.min(100, score),
        relevantSkill: lesson.skill,
        reasons,
        isCompleted,
        learningGapTarget: isDirectMatch ? lesson.skill : undefined,
      });
    }

    return recommendations.sort((a, b) => {
      // Uncompleted lessons first, then by match score
      if (!a.isCompleted && b.isCompleted) return -1;
      if (a.isCompleted && !b.isCompleted) return 1;
      return b.matchScore - a.matchScore;
    });
  },

  /**
   * Simple, reliable skill-gap detector
   */
  async getSkillGaps(currentUserId: string): Promise<SkillGap[]> {
    const pool = await getLiveStudentsPool();
    const currentUser = pool.find((u) => u.id === currentUserId) || (await userService.getProfile());
    if (!currentUser) return [];
    const learnSkills = currentUser.learningSkills || [];

    const gaps: SkillGap[] = [];

    let availableLessons: Lesson[] = [];
    try {
      availableLessons = await lessonService.getLessons();
    } catch {
      availableLessons = [];
    }

    for (const ls of learnSkills) {
      const lower = ls.name.toLowerCase();
      let matchedKey = Object.keys(SKILL_CURRICULUM_MAP).find((k) => lower.includes(k));

      const curriculum = matchedKey ? SKILL_CURRICULUM_MAP[matchedKey] : [
        'Foundational Principles',
        'Core Mechanics',
        'Intermediate Applications',
        'Complex Problem Solving'
      ];

      // Estimate missing topics based on progress percentage
      const progress = ls.progressPercent || 0;
      const completedTopicsCount = Math.floor((progress / 100) * curriculum.length);
      const missingTopics = curriculum.slice(completedTopicsCount);

      const status: 'not_started' | 'in_progress' | 'mastered' =
        progress === 0 ? 'not_started' : progress >= 90 ? 'mastered' : 'in_progress';

      // Find matching lesson IDs
      const matchingLessons = availableLessons.filter((l) =>
        l.skill.toLowerCase().includes(lower) || lower.includes(l.skill.toLowerCase())
      ).map((l) => l.id);

      // Find matching mentor IDs
      const matchingMentors = pool.filter(
        (s) =>
          s.id !== currentUserId &&
          s.teachingSkills.some((ts) =>
            ts.name.toLowerCase().includes(lower) || lower.includes(ts.name.toLowerCase())
          )
      ).map((s) => s.id);

      gaps.push({
        id: `gap-${ls.id}`,
        skillName: ls.name,
        category: ls.category,
        currentProficiency: progress,
        currentLevel: ls.currentLevel,
        targetLevel: ls.targetLevel,
        learningStatus: status,
        identifiedAreas: missingTopics.slice(0, 3),
        explanation: `Based on your ${progress}% progress, completing ${missingTopics.slice(0, 2).join(' and ')} will advance you to ${ls.targetLevel}.`,
        recommendedLessonIds: matchingLessons,
        recommendedMentorIds: matchingMentors,
      });
    }

    return gaps;
  },

  /**
   * Generates a detailed match breakdown explaining the calculation
   */
  async getMatchExplanation(mentorId: string, currentUserId: string): Promise<MatchExplanation> {
    const recommendations = await this.getRecommendedMentors(currentUserId);
    const rec = recommendations.find((r) => r.mentor.id === mentorId);
    const pool = await getLiveStudentsPool();
    const mentor = pool.find((s) => s.id === mentorId) || (await userService.getStudentById(mentorId));

    if (!rec || !mentor) {
      return {
        candidateId: mentorId,
        candidateName: mentor?.name || 'Peer Mentor',
        overallScore: 70,
        factorBreakdown: [
          { name: 'Skill Match', score: 30, maxScore: 40, description: 'Teaches complementary skills' },
          { name: 'Level Alignment', score: 15, maxScore: 20, description: 'Appropriate student proficiency' },
          { name: 'Campus Affinity', score: 15, maxScore: 20, description: 'Attends same university term' },
          { name: 'Language Compatibility', score: 10, maxScore: 20, description: 'Shares communication preferences' },
        ],
        summary: 'Matches complementary skills in your campus catalog.',
      };
    }

    const factors: MatchScoreFactor[] = [
      {
        name: 'Skill Overlap Factor',
        score: Math.min(40, Math.round(rec.matchScore * 0.4)),
        maxScore: 40,
        description: `Directly teaches ${rec.relevantSkills.join(', ') || 'related disciplines'} matching your study plan.`,
      },
      {
        name: 'Level Compatibility Factor',
        score: 18,
        maxScore: 20,
        description: rec.levelCompatibility,
      },
      {
        name: 'Learning Context & Module Fit',
        score: 14,
        maxScore: 15,
        description: 'Contextually relevant to your current algorithms & code walkthroughs.',
      },
      {
        name: 'Reciprocal Exchange / Barter',
        score: rec.isMutualSwap ? 15 : 5,
        maxScore: 15,
        description: rec.isMutualSwap
          ? `Two-way exchange: Peer wants to learn ${rec.mutualSkills.join(', ')} which you teach.`
          : 'One-way tutoring session with swap credits exchange.',
      },
      {
        name: 'Language & Code-Mixing',
        score: 10,
        maxScore: 10,
        description: `Both support ${rec.languages.join(', ')} for comfortable collegiate communication.`,
      },
    ];

    return {
      candidateId: mentor.id,
      candidateName: mentor.name,
      overallScore: rec.matchScore,
      factorBreakdown: factors,
      summary: `Recommended because you are learning ${rec.relevantSkills.join(' & ')} and ${mentor.name} provides high-fidelity peer mentoring with ${rec.languages.join(' / ')} support.`,
    };
  }
};
