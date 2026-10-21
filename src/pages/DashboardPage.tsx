import React, { useState, useEffect } from 'react';
import { UserProfile, Lesson, MentorRecommendation, LessonRecommendation, LessonContext, AssessmentAttempt } from '../types';
import { apiService } from '../services/apiService';
import { assessmentService } from '../services/assessmentService';

interface DashboardPageProps {
  user: UserProfile;
  lessons: Lesson[];
  onNavigate: (route: string) => void;
  onSelectLesson: (lessonId: string) => void;
  onOpenChat?: (conversationId?: string, lessonContext?: LessonContext) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  lessons,
  onNavigate,
  onSelectLesson,
  onOpenChat,
}) => {
  const [topMentor, setTopMentor] = useState<MentorRecommendation | null>(null);
  const [topLesson, setTopLesson] = useState<LessonRecommendation | null>(null);
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
  const [recLoading, setRecLoading] = useState<boolean>(true);
  const [recError, setRecError] = useState<string | null>(null);

  // Defensive profile data fallback ensuring missing or partial fields never crash rendering
  const safeUser = user || ({} as Partial<UserProfile>);
  const userId = safeUser.id || '';
  const userName = safeUser.name || 'Student';
  const firstName = userName.split(' ')[0] || 'Student';
  const learningSkills = Array.isArray(safeUser.learningSkills) ? safeUser.learningSkills : [];
  const badges = Array.isArray(safeUser.badges) ? safeUser.badges : [];
  const journey = Array.isArray(safeUser.journey) ? safeUser.journey : [];
  const safeLessons = Array.isArray(lessons) ? lessons : [];
  const walletBalance = typeof safeUser.walletBalance === 'number' ? safeUser.walletBalance : 10;
  const hoursTaught = typeof safeUser.hoursTaught === 'number' ? safeUser.hoursTaught : 0;
  const hoursLearned = typeof safeUser.hoursLearned === 'number' ? safeUser.hoursLearned : 0;

  useEffect(() => {
    if (userId) {
      loadRecommendations();
      loadAttempts();
    }
  }, [userId]);

  const loadAttempts = () => {
    if (!userId) return;
    try {
      const all = assessmentService.getAllAttempts();
      const safeAll = Array.isArray(all) ? all : [];
      const userAttempts = safeAll.filter((a) => a && a.userId === userId);
      setAttempts(
        userAttempts.sort((a, b) => {
          const tB = b?.startTime ? new Date(b.startTime).getTime() : 0;
          const tA = a?.startTime ? new Date(a.startTime).getTime() : 0;
          return tB - tA;
        })
      );
    } catch (e) {
      console.warn('Failed to load assessment attempts:', e);
    }
  };

  const loadRecommendations = async () => {
    if (!userId) return;
    setRecLoading(true);
    setRecError(null);
    try {
      const [mentors, recLessons] = await Promise.all([
        apiService.getRecommendedMentors(userId),
        apiService.getRecommendedLessons(userId),
      ]);
      if (Array.isArray(mentors) && mentors.length > 0) {
        setTopMentor(mentors[0]);
      } else {
        setTopMentor(null);
      }
      if (Array.isArray(recLessons) && recLessons.length > 0) {
        setTopLesson(recLessons[0]);
      } else {
        setTopLesson(null);
      }
    } catch (err: any) {
      console.error('Failed to load dashboard recommendations:', err);
      setRecError('Unable to load peer recommendations right now.');
    } finally {
      setRecLoading(false);
    }
  };

  const completedLessons = safeLessons.filter((l) => l && l.isCompleted);
  const inProgressLessons = safeLessons.filter((l) => l && !l.isCompleted && (l.progressPercent || 0) > 0);
  const activeLesson = inProgressLessons[0] || safeLessons[0] || null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#eaedff] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#eaedff] via-[#82f5c1]/20 to-[#ffdcc3]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#006c4a] animate-pulse"></span>
              <span className="text-xs font-bold text-[#006c4a] uppercase tracking-wider">
                Fall Quadrangle '24 Active Term
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#131b2e] tracking-tight">
              Welcome back, {firstName}!
            </h1>
            <p className="text-xs sm:text-sm text-[#464555] max-w-xl leading-relaxed">
              Track your student peer learning momentum, exchange hours, verified campus badges,
              and ongoing skill swaps.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('explore-skills')}
              className="px-4 py-2.5 rounded-xl bg-[#3525cd] text-white text-xs font-semibold shadow-xs hover:opacity-95 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              <span>Find Peer Mentors</span>
            </button>
            <button
              onClick={() => onNavigate('teaching-studio')}
              className="px-4 py-2.5 rounded-xl bg-[#eaedff] text-[#3525cd] text-xs font-semibold hover:bg-[#dae2fd] transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Host Workshop</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-[#eaedff]">
          <div className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#82f5c1] text-[#00714e] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">bolt</span>
            </div>
            <div>
              <span className="text-xs text-[#464555] block">Wallet Balance</span>
              <span className="text-xl font-bold text-[#131b2e]">{walletBalance}</span>
              <span className="text-[11px] text-[#00714e] block font-semibold">+3 this term</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#eaedff] text-[#3525cd] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">co_present</span>
            </div>
            <div>
              <span className="text-xs text-[#464555] block">Hours Taught</span>
              <span className="text-xl font-bold text-[#131b2e]">{hoursTaught}h</span>
              <span className="text-[11px] text-[#3525cd] block font-semibold">Verified instruction</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#ffdcc3] text-[#703a00] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">local_library</span>
            </div>
            <div>
              <span className="text-xs text-[#464555] block">Hours Learned</span>
              <span className="text-xl font-bold text-[#131b2e]">{hoursLearned}h</span>
              <span className="text-[11px] text-[#703a00] block font-semibold">{learningSkills.length} active skills</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#82f5c1] text-[#00714e] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">task_alt</span>
            </div>
            <div>
              <span className="text-xs text-[#464555] block">Lessons Finished</span>
              <span className="text-xl font-bold text-[#131b2e]">
                {completedLessons.length} / {safeLessons.length}
              </span>
              <span className="text-[11px] text-[#00714e] block font-semibold">100% Fulfill</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Split: Active Lesson + Skill Progress Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Active Lesson & Skill Matrix (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Lesson In Progress Card */}
          {activeLesson && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#eaedff] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#3525cd]">
                  Resume Active Lesson
                </span>
                <span className="text-xs font-bold text-[#006c4a]">
                  {activeLesson.progressPercent || 50}% Complete
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#131b2e]">{activeLesson.title || 'Campus Workshop'}</h3>
                <p className="text-xs text-[#464555] mt-1 line-clamp-2">
                  {activeLesson.description || 'Hands-on interactive peer lesson.'}
                </p>
              </div>

              <div className="w-full bg-[#dae2fd] h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#3525cd] to-[#006c4a] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, activeLesson.progressPercent || 50))}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between text-xs text-[#464555] pt-1">
                <div className="flex items-center gap-2">
                  <img
                    src={activeLesson.teacherAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(activeLesson.teacherName || 'Instructor')}`}
                    alt={activeLesson.teacherName || 'Teacher'}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span>Taught by {activeLesson.teacherName || 'Peer Instructor'}</span>
                </div>
                <button
                  onClick={() => {
                    if (activeLesson.id) onSelectLesson(activeLesson.id);
                    onNavigate('lesson-room');
                  }}
                  className="px-4 py-1.5 rounded-xl bg-[#3525cd] text-white text-xs font-semibold hover:opacity-95 transition-all flex items-center gap-1"
                >
                  <span>Continue</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* Section: Your Learning Recommendations Spotlight */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#eaedff] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3525cd] text-[20px]">
                  auto_awesome
                </span>
                <h3 className="font-bold text-base text-[#131b2e]">
                  Your Learning Recommendations
                </h3>
              </div>
              <button
                onClick={() => onNavigate('explore-skills')}
                className="text-xs font-semibold text-[#3525cd] hover:underline"
              >
                View All Recommendations →
              </button>
            </div>

            {recLoading ? (
              <div className="p-8 rounded-2xl bg-[#faf8ff] border border-[#eaedff] flex items-center justify-center gap-2 text-xs text-[#464555]">
                <span className="material-symbols-outlined animate-spin text-[18px] text-[#3525cd]">progress_activity</span>
                <span>Calculating smart peer matches & curriculum steps...</span>
              </div>
            ) : recError ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-xs text-amber-800">
                <span>{recError}</span>
                <button
                  onClick={loadRecommendations}
                  className="px-3 py-1 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700"
                >
                  Retry
                </button>
              </div>
            ) : (!topMentor && !topLesson) ? (
              <div className="p-6 rounded-2xl bg-[#faf8ff] border border-[#eaedff] text-center text-xs text-[#464555] space-y-2">
                <p>Add skills you want to learn to unlock personalized recommendations from peer mentors.</p>
                <button
                  onClick={() => onNavigate('explore-skills')}
                  className="px-4 py-2 rounded-xl bg-[#3525cd] text-white font-semibold hover:opacity-95 inline-flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">explore</span>
                  <span>Explore Campus Skills</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Top Recommended Mentor */}
                {topMentor && topMentor.mentor ? (
                  <div className="p-4 rounded-2xl bg-[#faf8ff] border border-[#eaedff] space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#3525cd] uppercase tracking-wider">
                          Recommended Mentor
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#82f5c1] text-[#00714e]">
                          {topMentor.matchScore}% Match
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <img
                          src={topMentor.mentor.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(topMentor.mentor.name || 'Mentor')}`}
                          alt={topMentor.mentor.name || 'Mentor'}
                          className="w-9 h-9 rounded-xl object-cover ring-1 ring-[#eaedff]"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-[#131b2e] truncate">
                            {topMentor.mentor.name || 'Peer Mentor'}
                          </h4>
                          <p className="text-[10px] text-[#464555] truncate">
                            {topMentor.mentor.department || 'Student'}
                          </p>
                        </div>
                      </div>

                      <p className="text-[11px] text-[#464555] line-clamp-2">
                        {topMentor.reasons?.[0] || 'Matches your target learning topics.'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#eaedff]">
                      {topMentor.connectionStatus === 'connected' ? (
                        <button
                          onClick={() => {
                            if (onOpenChat) onOpenChat(topMentor.conversationId);
                            else onNavigate('messages');
                          }}
                          className="w-full py-1.5 rounded-xl bg-[#3525cd] text-white text-xs font-semibold hover:opacity-95 flex items-center justify-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">forum</span>
                          <span>Message</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onNavigate('explore-skills')}
                          className="w-full py-1.5 rounded-xl bg-[#eaedff] text-[#3525cd] text-xs font-semibold hover:bg-[#dae2fd] flex items-center justify-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">handshake</span>
                          <span>Connect</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Top Recommended Lesson */}
                {topLesson && topLesson.lesson ? (
                  <div className="p-4 rounded-2xl bg-[#faf8ff] border border-[#eaedff] space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#006c4a] uppercase tracking-wider">
                          Next Lesson to Learn
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#d2f8e5] text-[#00714e]">
                          {topLesson.matchScore}% Match
                        </span>
                      </div>

                      <h4 className="font-bold text-xs text-[#131b2e] line-clamp-1">
                        {topLesson.lesson.title || 'Workshop'}
                      </h4>

                      <p className="text-[11px] text-[#464555] line-clamp-2">
                        {topLesson.reasons?.[0] || topLesson.lesson.description || 'Recommended campus workshop.'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#eaedff]">
                      <button
                        onClick={() => {
                          if (topLesson.lesson?.id) onSelectLesson(topLesson.lesson.id);
                          onNavigate('lesson-room');
                        }}
                        className="w-full py-1.5 rounded-xl bg-[#3525cd] text-white text-xs font-semibold hover:opacity-95 flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">play_circle</span>
                        <span>Start Workshop</span>
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Learning Skills Matrix */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#eaedff] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#131b2e]">Learning Progress Matrix</h3>
                <p className="text-xs text-[#464555]">Active peer topics you are mastering</p>
              </div>
              <button
                onClick={() => onNavigate('my-profile-and-badges')}
                className="text-xs font-semibold text-[#3525cd] hover:underline"
              >
                Manage Skills →
              </button>
            </div>

            <div className="space-y-4">
              {learningSkills.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#f2f3ff] text-center text-xs text-[#464555] space-y-2">
                  <span className="material-symbols-outlined text-[24px] text-[#3525cd] block mx-auto">school</span>
                  <p className="font-semibold text-[#131b2e]">No learning skills added yet</p>
                  <p className="text-[11px]">Select skills from the campus marketplace to track your mastery progress.</p>
                  <button
                    onClick={() => onNavigate('explore-skills')}
                    className="mt-2 px-3.5 py-1.5 rounded-xl bg-[#3525cd] text-white text-xs font-semibold hover:opacity-95 inline-flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    <span>Browse Skills</span>
                  </button>
                </div>
              ) : (
                learningSkills.map((skill) => (
                  <div key={skill.id || skill.name} className="p-4 rounded-2xl bg-[#f2f3ff] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs sm:text-sm text-[#131b2e]">{skill.name}</span>
                      <span className="text-xs font-bold text-[#006c4a]">{skill.progressPercent ?? 0}%</span>
                    </div>
                    <div className="w-full bg-[#eaedff] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#3525cd] h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, skill.progressPercent ?? 0))}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#464555]">
                      <span>Current: {skill.currentLevel || 'Beginner'} → Goal: {skill.targetLevel || 'Advanced'}</span>
                      <span>Partner: {skill.partnerName || 'Peer Mentor'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Verified Campus Badges & History (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Badges Spotlight */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#eaedff] space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#131b2e]">Verified Campus Badges</h3>
                <p className="text-xs text-[#464555]">Peer endorsed milestones (no certificates)</p>
              </div>
              <button
                onClick={() => onNavigate('my-profile-and-badges')}
                className="text-xs font-semibold text-[#3525cd] hover:underline"
              >
                View All ({badges.length}) →
              </button>
            </div>

            {badges.length === 0 ? (
              <div className="p-5 rounded-2xl bg-[#f2f3ff] text-center text-xs text-[#464555] space-y-1.5">
                <div className="w-10 h-10 rounded-xl bg-[#eaedff] text-[#3525cd] flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-[22px]">military_tech</span>
                </div>
                <h4 className="font-bold text-xs text-[#131b2e]">No Badges Earned Yet</h4>
                <p className="text-[11px]">
                  Host workshops or exchange lessons with fellow students to earn verified campus peer endorsements!
                </p>
                <button
                  onClick={() => onNavigate('teaching-studio')}
                  className="mt-1 px-3 py-1 rounded-xl bg-[#eaedff] text-[#3525cd] text-[11px] font-semibold hover:bg-[#dae2fd]"
                >
                  Host a Workshop
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {badges.slice(0, 4).map((badge) => (
                  <div
                    key={badge.id || badge.title}
                    onClick={() => onNavigate('my-profile-and-badges')}
                    className="p-3.5 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] hover:bg-[#eaedff] cursor-pointer transition-colors space-y-2 text-center"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl ${
                        badge.iconBgColor || 'bg-[#82f5c1] text-[#00714e]'
                      } flex items-center justify-center mx-auto`}
                    >
                      <span className="material-symbols-outlined text-[20px] material-symbols-fill">
                        {badge.icon || 'military_tech'}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-[#131b2e] truncate">{badge.title}</h4>
                    <span className="text-[10px] text-[#006c4a] block font-semibold">
                      {badge.endorsementsCount || 1} endorsements
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Learning Activity Feed */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#eaedff] space-y-4">
            <h3 className="font-bold text-base text-[#131b2e]">Recent Learning Activity</h3>
            <div className="space-y-3">
              {journey.length === 0 ? (
                <div className="p-4 rounded-2xl bg-[#f2f3ff] text-center text-xs text-[#464555]">
                  No recent activity recorded yet. Connect with a peer student or take an interactive lesson to build your momentum!
                </div>
              ) : (
                journey.slice(0, 3).map((item) => (
                  <div
                    key={item.id || item.title}
                    className="p-3.5 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#131b2e] truncate">{item.title}</span>
                      <span className="text-[10px] text-[#464555] shrink-0">{item.timeAgo || 'Recent'}</span>
                    </div>
                    <p className="text-[#464555] text-[11px] leading-relaxed">{item.description}</p>
                    {item.creditsChange && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[#82f5c1] text-[#00714e] text-[10px] font-bold">
                        +{item.creditsChange} Credits
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Lesson Assessments & Verification Results */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#eaedff] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#131b2e]">Lesson Assessment Results</h3>
                <p className="text-xs text-[#464555]">Verified checkpoint attempts and scores</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#eaedff] text-[#3525cd]">
                15+ Q Checkpoints
              </span>
            </div>

            <div className="space-y-3">
              {attempts.length === 0 ? (
                <div className="p-4 rounded-2xl bg-[#f2f3ff] text-center text-xs text-[#464555]">
                  No lesson assessments attempted yet. Open an enrolled lesson to take the 15-question checkpoint test!
                </div>
              ) : (
                attempts.slice(0, 4).map((att) => {
                  const lesson = safeLessons.find((l) => l && l.id === att.lessonId);
                  const lessonName = lesson?.title || att.lessonId;
                  const attDate = att.startTime ? new Date(att.startTime) : null;
                  const dateStr = attDate && !isNaN(attDate.getTime())
                    ? attDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Recent';

                  return (
                    <div
                      key={att.id}
                      onClick={() => {
                        if (att.lessonId) onSelectLesson(att.lessonId);
                        onNavigate('lesson-room');
                      }}
                      className="p-3.5 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] hover:bg-[#eaedff] cursor-pointer transition-colors space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[#131b2e] truncate">{lessonName}</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full shrink-0 text-[10px] ${
                            att.passed
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {att.passed ? '✓ Passed' : 'Needs Retest'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#464555]">
                        <span>
                          Score: <strong>{att.score ?? 0} / {att.totalPoints ?? 15}</strong> ({att.percentage ?? 0}%)
                        </span>
                        <span>Attempt #{att.attemptNumber || 1} • {dateStr}</span>
                      </div>

                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[#006c4a] font-semibold">
                          Status: {att.passed ? 'Verified Completed ✓' : 'Assessment Incomplete'}
                        </span>
                        <span className="text-[#3525cd] font-semibold hover:underline">
                          View in Lesson →
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
