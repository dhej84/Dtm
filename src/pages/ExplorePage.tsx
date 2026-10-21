import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  Lesson,
  MentorRecommendation,
  LessonRecommendation,
  SkillGap,
  MatchExplanation,
  LessonContext,
  PublicVideo,
} from '../types';
import { apiService } from '../services/apiService';
import { ConnectModal } from '../components/ConnectModal';
import { useAuth } from '../context/AuthContext';

interface ExplorePageProps {
  onNavigate: (route: string) => void;
  onSelectLesson: (lessonId: string) => void;
  onOpenChat?: (conversationId?: string, lessonContext?: LessonContext) => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({
  onNavigate,
  onSelectLesson,
  onOpenChat,
}) => {
  const { currentUser } = useAuth();
  const [activeView, setActiveView] = useState<'recommended' | 'students' | 'lessons' | 'videos'>('recommended');
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [videos, setVideos] = useState<PublicVideo[]>([]);
  const [recommendedMentors, setRecommendedMentors] = useState<MentorRecommendation[]>([]);
  const [recommendedLessons, setRecommendedLessons] = useState<LessonRecommendation[]>([]);
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);
  const [selectedExplanation, setSelectedExplanation] = useState<MatchExplanation | null>(null);
  const [playingVideo, setPlayingVideo] = useState<PublicVideo | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Connect Modal state
  const [connectStudent, setConnectStudent] = useState<UserProfile | null>(null);

  const categories = [
    'All',
    'Computer Science',
    'Languages',
    'Music & Arts',
    'Design & UX',
    'Mathematics & Science',
    'Business & Writing',
  ];

  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced', 'Mastery'];
  const languages = ['All', 'English', 'Tamil', 'Tanglish', 'Hindi', 'Telugu', 'Spanish', 'French', 'Bengali'];

  useEffect(() => {
    loadData();
  }, [searchQuery, selectedCategory, selectedLevel, selectedLanguage]);

  const loadData = async () => {
    setIsLoading(true);
    setSearchError(null);
    try {
      const userId = currentUser?.id || '';
      const [allStudents, allLessons, allVideos, recMentors, recLessons, gaps] = await Promise.all([
        apiService.getAllStudents(),
        apiService.getLessons({
          search: searchQuery,
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          level: selectedLevel !== 'All' ? selectedLevel : undefined,
        }),
        apiService.searchVideos(
          searchQuery,
          selectedCategory !== 'All' ? selectedCategory : undefined,
          selectedLevel !== 'All' ? selectedLevel : undefined
        ),
        userId
          ? apiService.getRecommendedMentors(userId, {
              skill: selectedCategory !== 'All' ? selectedCategory : undefined,
              level: selectedLevel !== 'All' ? selectedLevel : undefined,
              language: selectedLanguage !== 'All' ? selectedLanguage : undefined,
            })
          : Promise.resolve([]),
        userId
          ? apiService.getRecommendedLessons(userId, {
              category: selectedCategory !== 'All' ? selectedCategory : undefined,
              level: selectedLevel !== 'All' ? selectedLevel : undefined,
            })
          : Promise.resolve([]),
        userId ? apiService.getSkillGaps(userId) : Promise.resolve([]),
      ]);

      // Filter students client-side for catalog view
      let filteredStudents = allStudents;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filteredStudents = filteredStudents.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.department.toLowerCase().includes(q) ||
            s.university.toLowerCase().includes(q) ||
            s.teachingSkills.some((ts) => ts.name.toLowerCase().includes(q)) ||
            s.learningSkills.some((ls) => ls.name.toLowerCase().includes(q))
        );
      }

      if (selectedCategory !== 'All') {
        filteredStudents = filteredStudents.filter(
          (s) =>
            s.teachingSkills.some((ts) => ts.category === selectedCategory) ||
            s.learningSkills.some((ls) => ls.category === selectedCategory)
        );
      }

      if (selectedLevel !== 'All') {
        filteredStudents = filteredStudents.filter((s) =>
          s.teachingSkills.some((ts) => ts.level === selectedLevel)
        );
      }

      setStudents(filteredStudents);
      setLessons(allLessons);
      setVideos(allVideos);
      setRecommendedMentors(recMentors);
      setRecommendedLessons(recLessons);
      setSkillGaps(gaps);
    } catch (err: any) {
      console.error('Failed to load explore data:', err);
      setSearchError(err?.message || 'Failed to search across campus network.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenExplanation = async (mentorId: string) => {
    const userId = currentUser?.id || '';
    if (!userId) return;
    const explanation = await apiService.getMatchExplanation(mentorId, userId);
    setSelectedExplanation(explanation);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fadeIn">
      {/* Hero Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#eaedff] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#eaedff] to-[#82f5c1]/30 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#82f5c1] text-[#00714e] text-xs font-semibold">
            <span className="material-symbols-outlined text-[16px]">school</span>
            <span>Quadrangle Campus Marketplace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#131b2e] tracking-tight">
            Explore Peer Mentors & Lessons
          </h1>
          <p className="text-xs sm:text-sm text-[#464555] leading-relaxed">
            Personalized, transparent recommendations grounded in what you are actively learning.
            Find mentors who complement your syllabus, fill skill gaps, and speak your language.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-6 pt-6 border-t border-[#eaedff] grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-4 relative">
            <span className="material-symbols-outlined absolute left-3.5 top-3 text-[#464555] text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search across all peer videos, skills, topics, mentors (Python, Spanish, Celery...)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim().length > 0 && activeView === 'recommended') {
                  setActiveView('videos');
                }
              }}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-[#c7c4d8] text-xs sm:text-sm bg-white focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-[#464555] hover:text-[#131b2e]"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>

          {/* Level Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#c7c4d8] text-xs sm:text-sm bg-white font-medium text-[#131b2e] outline-none"
            >
              <option value="All">All Levels</option>
              {levels.slice(1).map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          {/* Language Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#c7c4d8] text-xs sm:text-sm bg-white font-medium text-[#131b2e] outline-none"
            >
              <option value="All">All Languages</option>
              {languages.slice(1).map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* 4-Way View Switcher */}
          <div className="md:col-span-4 flex items-center bg-[#f2f3ff] p-1 rounded-xl">
            <button
              onClick={() => setActiveView('recommended')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                activeView === 'recommended'
                  ? 'bg-[#3525cd] text-white shadow-xs'
                  : 'text-[#464555] hover:text-[#131b2e]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
              <span>For You</span>
            </button>
            <button
              onClick={() => setActiveView('videos')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                activeView === 'videos'
                  ? 'bg-[#3525cd] text-white shadow-xs'
                  : 'text-[#464555] hover:text-[#131b2e]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">smart_display</span>
              <span>Videos ({videos.length})</span>
            </button>
            <button
              onClick={() => setActiveView('students')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                activeView === 'students'
                  ? 'bg-[#3525cd] text-white shadow-xs'
                  : 'text-[#464555] hover:text-[#131b2e]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">groups</span>
              <span>Directory ({students.length})</span>
            </button>
            <button
              onClick={() => setActiveView('lessons')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                activeView === 'lessons'
                  ? 'bg-[#3525cd] text-white shadow-xs'
                  : 'text-[#464555] hover:text-[#131b2e]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">menu_book</span>
              <span>Workshops</span>
            </button>
          </div>
        </div>

        {/* Search Active Status Banner if searching */}
        {searchQuery && (
          <div className="mt-3 flex items-center justify-between text-xs bg-[#eef0ff] text-[#3525cd] px-3.5 py-1.5 rounded-xl border border-[#eaedff]">
            <div className="flex items-center gap-1.5 font-medium">
              <span className="material-symbols-outlined text-[16px]">travel_explore</span>
              <span>
                Searching all registered users for: <strong className="font-bold">"{searchQuery}"</strong> ({videos.length} videos, {students.length} mentors, {lessons.length} workshops)
              </span>
            </div>
            <button
              onClick={() => setSearchQuery('')}
              className="font-bold hover:underline text-[11px]"
            >
              Reset Search
            </button>
          </div>
        )}

        {searchError && (
          <div className="mt-3 p-3 rounded-xl bg-red-50 text-[#ba1a1a] border border-red-200 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">warning</span>
            <span>{searchError}</span>
          </div>
        )}

        {/* Categories Chip Row */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#006c4a] text-white shadow-xs'
                  : 'bg-[#f2f3ff] text-[#464555] hover:bg-[#eaedff]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Results Content Area */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-[#464555] bg-white rounded-3xl border border-[#eaedff] space-y-2">
          <span className="material-symbols-outlined text-[32px] animate-spin text-[#3525cd]">
            progress_activity
          </span>
          <p>Analyzing learning journey and computing matches...</p>
        </div>
      ) : activeView === 'recommended' ? (
        /* RECOMMENDATION VIEW: Gaps + Mentors + Lessons */
        <div className="space-y-8">
          {/* SECTION 1: Identified Learning Gaps / Focus Areas */}
          {skillGaps.length > 0 && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#eaedff] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-[#ffdcc3] text-[#703a00] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">explore</span>
                  </span>
                  <div>
                    <h2 className="font-bold text-base text-[#131b2e]">
                      Your Learning Focus Areas & Curriculum Gaps
                    </h2>
                    <p className="text-xs text-[#464555]">
                      Transparent comparison of skills you want vs your current progress.
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#f2f3ff] text-[#3525cd]">
                  {skillGaps.length} Target Areas
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {skillGaps.map((gap) => (
                  <div
                    key={gap.id}
                    className="p-4 rounded-2xl bg-[#faf8ff] border border-[#eaedff] space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[#131b2e]">{gap.skillName}</span>
                        <span className="text-[11px] font-bold text-[#006c4a]">
                          {gap.currentProficiency}% Progress
                        </span>
                      </div>

                      <div className="w-full bg-[#eaedff] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#006c4a] h-full rounded-full transition-all duration-500"
                          style={{ width: `${gap.currentProficiency}%` }}
                        />
                      </div>

                      <p className="text-[11px] text-[#464555] leading-relaxed">{gap.explanation}</p>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b8a9d]">
                          Next topics to master:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {gap.identifiedAreas.map((area, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-[#eaedff] text-[#131b2e] font-medium"
                            >
                              • {area}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#eaedff] flex items-center justify-between text-xs">
                      <span className="text-[11px] text-[#464555]">
                        Goal: <span className="font-semibold text-[#131b2e]">{gap.targetLevel}</span>
                      </span>
                      <button
                        onClick={() => {
                          if (gap.recommendedLessonIds.length > 0) {
                            onSelectLesson(gap.recommendedLessonIds[0]);
                            onNavigate('lesson-room');
                          } else {
                            setActiveView('lessons');
                          }
                        }}
                        className="text-[11px] font-bold text-[#3525cd] hover:underline flex items-center gap-1"
                      >
                        <span>Find Lessons</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 2: Recommended Mentors for You */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#131b2e] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#3525cd]">verified</span>
                  <span>Top Recommended Mentors for Your Journey</span>
                </h2>
                <p className="text-xs text-[#464555]">
                  Calculated from skill alignment, active module fit, level compatibility, and language comfort.
                </p>
              </div>
              <span className="text-xs font-semibold text-[#464555]">
                {recommendedMentors.length} matches found
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedMentors.map((rec) => {
                const mentor = rec.mentor;
                return (
                  <div
                    key={mentor.id}
                    className="bg-white rounded-3xl p-6 shadow-sm border border-[#eaedff] flex flex-col justify-between hover:shadow-md hover:border-[#3525cd]/40 transition-all space-y-4"
                  >
                    <div className="space-y-4">
                      {/* Top Bar: Mentor Info & Match Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={mentor.avatarUrl}
                            alt={mentor.name}
                            className="w-12 h-12 rounded-2xl object-cover ring-2 ring-[#eaedff]"
                          />
                          <div>
                            <h3 className="font-bold text-sm text-[#131b2e]">{mentor.name}</h3>
                            <p className="text-[11px] text-[#464555]">
                              {mentor.department} • {mentor.year}
                            </p>
                          </div>
                        </div>

                        {/* Match Score Badge */}
                        <div className="text-right shrink-0">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#82f5c1] text-[#00714e] text-xs font-bold shadow-xs">
                            <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                            <span>{rec.matchScore}% Match</span>
                          </span>
                        </div>
                      </div>

                      {/* Explainable Reasons */}
                      <div className="p-3 bg-[#f2f3ff] rounded-2xl border border-[#eaedff] space-y-1.5 text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#3525cd] block">
                          Why Recommended:
                        </span>
                        {rec.reasons.slice(0, 3).map((r, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-[#131b2e]">
                            <span className="material-symbols-outlined text-[15px] text-[#00714e] shrink-0 mt-0.5">
                              check_circle
                            </span>
                            <span className="text-[11px] leading-tight">{r}</span>
                          </div>
                        ))}
                      </div>

                      {/* Languages supported */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-[#8b8a9d] font-semibold">Languages:</span>
                        {rec.languages.map((lang) => (
                          <span
                            key={lang}
                            className="px-2 py-0.5 rounded-md bg-[#eaedff] text-[#3525cd] text-[10px] font-bold"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Card Actions: Message (if connected) or Connect (if not) */}
                    <div className="pt-3 border-t border-[#eaedff] flex items-center gap-2">
                      {rec.connectionStatus === 'connected' ? (
                        <button
                          onClick={() => {
                            if (onOpenChat) {
                              onOpenChat(rec.conversationId);
                            } else {
                              onNavigate('messages');
                            }
                          }}
                          className="flex-1 py-2 rounded-xl bg-[#3525cd] text-white text-xs font-semibold hover:opacity-95 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <span className="material-symbols-outlined text-[16px]">forum</span>
                          <span>Message Mentor</span>
                        </button>
                      ) : rec.connectionStatus === 'pending' ? (
                        <button
                          disabled
                          className="flex-1 py-2 rounded-xl bg-[#eaedff] text-[#8b8a9d] text-xs font-semibold cursor-not-allowed flex items-center justify-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[16px]">pending</span>
                          <span>Request Pending</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setConnectStudent(mentor)}
                          className="flex-1 py-2 rounded-xl bg-[#3525cd] text-white text-xs font-semibold hover:opacity-95 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <span className="material-symbols-outlined text-[16px]">handshake</span>
                          <span>Connect</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenExplanation(mentor.id)}
                        className="p-2 rounded-xl border border-[#eaedff] text-[#464555] hover:text-[#3525cd] hover:bg-[#f2f3ff] transition-all"
                        title="View transparent score breakdown"
                      >
                        <span className="material-symbols-outlined text-[18px]">info</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: Recommended Lessons for You */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#131b2e] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#3525cd]">menu_book</span>
                  <span>Recommended Workshops & Lessons</span>
                </h2>
                <p className="text-xs text-[#464555]">
                  Curated workshops that advance your active goals and fill detected gaps.
                </p>
              </div>
              <button
                onClick={() => setActiveView('lessons')}
                className="text-xs font-bold text-[#3525cd] hover:underline"
              >
                Browse All Workshops →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedLessons.map((rec) => {
                const lesson = rec.lesson;
                return (
                  <div
                    key={lesson.id}
                    className="bg-white rounded-3xl p-6 shadow-sm border border-[#eaedff] flex flex-col justify-between hover:shadow-md transition-all space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#e2e7ff] text-[#3525cd] text-[11px] font-bold">
                          {lesson.category}
                        </span>
                        <span className="text-[11px] font-bold text-[#006c4a]">
                          {rec.matchScore}% Match
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-[#131b2e] leading-snug">
                        {lesson.title}
                      </h3>

                      <div className="p-2.5 rounded-xl bg-[#f2f3ff] border border-[#eaedff] text-[11px] text-[#131b2e] space-y-1">
                        {rec.reasons.map((r, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px] text-[#00714e]">
                              check_circle
                            </span>
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs text-[#464555] pt-1">
                        <span>Level: {lesson.skillLevel}</span>
                        <span>{lesson.durationMinutes} min</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#eaedff]">
                      <button
                        onClick={() => {
                          onSelectLesson(lesson.id);
                          onNavigate('lesson-room');
                        }}
                        className="w-full py-2.5 rounded-xl bg-[#3525cd] text-white text-xs font-semibold hover:opacity-95 transition-all flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">play_circle</span>
                        <span>Start Workshop</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : activeView === 'videos' ? (
        /* ALL REGISTERED USERS VIDEOS CATALOG */
        videos.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#eaedff] space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#f2f3ff] text-[#3525cd] flex items-center justify-center">
              <span className="material-symbols-outlined text-[32px]">smart_display</span>
            </div>
            <h3 className="font-bold text-base text-[#131b2e]">No videos found</h3>
            <p className="text-xs text-[#464555] max-w-md mx-auto">
              {searchQuery
                ? `No uploaded peer videos match "${searchQuery}". Try searching by another skill, category, or creator.`
                : 'No uploaded peer videos are available in this filter.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 rounded-xl bg-[#3525cd] text-white text-xs font-semibold hover:opacity-95"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#131b2e] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#3525cd]">smart_display</span>
                  <span>Peer Video Library ({videos.length} shared videos)</span>
                </h2>
                <p className="text-xs text-[#464555]">
                  Search across verified student recordings, lecture demonstrations, and workshops uploaded by all peers.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((vid) => (
                <div
                  key={vid.id}
                  className="bg-white rounded-3xl p-5 shadow-sm border border-[#eaedff] flex flex-col justify-between hover:shadow-md hover:border-[#3525cd]/40 transition-all space-y-4 group"
                >
                  <div className="space-y-3">
                    {/* Video Header Thumbnail / Preview Box */}
                    <div
                      onClick={() => setPlayingVideo(vid)}
                      className="relative w-full h-44 bg-[#131b2e] rounded-2xl overflow-hidden cursor-pointer group-hover:brightness-95 transition-all flex items-center justify-center border border-[#eaedff]"
                    >
                      <video
                        src={vid.videoUrl}
                        className="w-full h-full object-cover pointer-events-none opacity-80"
                        preload="metadata"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
                      
                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-[#3525cd]/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <span className="material-symbols-outlined text-[28px]">play_arrow</span>
                        </div>
                      </div>

                      {/* Video Duration Tag */}
                      {vid.duration && (
                        <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 text-white text-[11px] font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">timer</span>
                          <span>{vid.duration}</span>
                        </div>
                      )}

                      {/* Skill / Category Tag */}
                      <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-[#3525cd] text-[10px] font-bold shadow-xs">
                        {vid.skill || 'General'}
                      </div>
                    </div>

                    {/* Metadata & Title */}
                    <div>
                      <h3
                        onClick={() => setPlayingVideo(vid)}
                        className="font-bold text-sm text-[#131b2e] line-clamp-2 cursor-pointer hover:text-[#3525cd] transition-colors"
                      >
                        {vid.title}
                      </h3>
                      {vid.description && (
                        <p className="text-xs text-[#464555] line-clamp-2 mt-1">
                          {vid.description}
                        </p>
                      )}
                    </div>

                    {/* Creator Info */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <div className="flex items-center gap-2">
                        {vid.creatorAvatar ? (
                          <img
                            src={vid.creatorAvatar}
                            alt={vid.creatorName}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-[#eaedff] text-[#3525cd] flex items-center justify-center font-bold text-[10px]">
                            {vid.creatorName?.charAt(0) || 'P'}
                          </div>
                        )}
                        <span className="text-[#131b2e] font-semibold text-[11px] truncate max-w-[120px]">
                          {vid.creatorName || 'Peer Tutor'}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-[#f2f3ff] text-[#464555] text-[10px] font-medium">
                        {vid.level || 'All Levels'}
                      </span>
                    </div>
                  </div>

                  {/* Actions: Play in Modal or Jump to Workshop */}
                  <div className="pt-3 border-t border-[#eaedff] flex items-center gap-2">
                    <button
                      onClick={() => setPlayingVideo(vid)}
                      className="flex-1 py-2 rounded-xl bg-[#3525cd] text-white text-xs font-semibold hover:opacity-95 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">play_circle</span>
                      <span>Watch Video</span>
                    </button>
                    {vid.lessonId && (
                      <button
                        onClick={() => {
                          onSelectLesson(vid.lessonId!);
                          onNavigate('lesson-room');
                        }}
                        className="p-2 rounded-xl border border-[#eaedff] text-[#464555] hover:text-[#3525cd] hover:bg-[#f2f3ff] transition-all"
                        title="Open interactive workshop room"
                      >
                        <span className="material-symbols-outlined text-[18px]">menu_book</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ) : activeView === 'students' ? (
        /* ALL STUDENTS CATALOG */
        students.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#eaedff] space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#f2f3ff] text-[#3525cd] flex items-center justify-center">
              <span className="material-symbols-outlined text-[32px]">groups</span>
            </div>
            <h3 className="font-bold text-base text-[#131b2e]">No students found</h3>
            <p className="text-xs text-[#464555]">
              {searchQuery ? `No students matched "${searchQuery}".` : 'Try clearing your search or category filters.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 rounded-xl bg-[#3525cd] text-white text-xs font-semibold hover:opacity-95"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student: any) => {
              const teachingSkills = Array.isArray(student.teachingSkills) ? student.teachingSkills : [];
              const learningSkills = Array.isArray(student.learningSkills) ? student.learningSkills : [];

              return (
                <div
                  key={student.id}
                  className="bg-white rounded-3xl p-6 shadow-sm border border-[#eaedff] flex flex-col justify-between hover:shadow-md hover:border-[#3525cd]/30 transition-all space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header info */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={student.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(student.name || 'student')}`}
                            alt={student.name}
                            className="w-13 h-13 rounded-2xl object-cover ring-2 ring-[#eaedff]"
                          />
                          <span
                            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                              student.isOnline ? 'bg-[#006c4a]' : 'bg-[#c7c4d8]'
                            }`}
                            title={student.isOnline ? 'Online now' : 'Offline'}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-bold text-base text-[#131b2e] truncate">{student.name}</h3>
                            {student.isVerified && (
                              <span className="material-symbols-outlined text-[15px] text-[#006c4a]" title="Campus Verified">
                                verified
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#464555] truncate">
                            {student.department || 'Student'} • {student.year || "'26"}
                          </p>
                          <p className="text-[11px] text-[#8b8a9d] truncate">
                            {student.university || 'Campus'}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          student.isOnline ? 'bg-[#d2f8e5] text-[#00714e]' : 'bg-[#f2f3ff] text-[#8b8a9d]'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${student.isOnline ? 'bg-[#006c4a]' : 'bg-[#8b8a9d]'}`} />
                        <span>{student.isOnline ? 'Online' : 'Offline'}</span>
                      </span>
                    </div>

                    {/* Authorized Email */}
                    {student.email && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#f2f3ff] rounded-xl text-[11px] text-[#3525cd] truncate">
                        <span className="material-symbols-outlined text-[14px]">mail</span>
                        <a href={`mailto:${student.email}`} className="truncate hover:underline font-medium">
                          {student.email}
                        </a>
                      </div>
                    )}

                    {/* Bio */}
                    {student.bio && (
                      <p className="text-xs text-[#464555] line-clamp-2 leading-relaxed">
                        {student.bio}
                      </p>
                    )}

                    {/* Teaching Skills */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#00714e] uppercase">Teaches:</span>
                      <div className="flex flex-wrap gap-1">
                        {teachingSkills.slice(0, 3).map((ts: any) => (
                          <span
                            key={ts.id || ts.name}
                            className="px-2 py-0.5 rounded-md bg-[#d2f8e5] text-[#00714e] text-[10px] font-semibold"
                          >
                            {ts.name}
                          </span>
                        ))}
                        {teachingSkills.length > 3 && (
                          <span className="text-[10px] text-[#8b8a9d] self-center">
                            +{teachingSkills.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Learning Skills */}
                    {learningSkills.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-[#3525cd] uppercase">Wants to Learn:</span>
                        <div className="flex flex-wrap gap-1">
                          {learningSkills.slice(0, 2).map((ls: any) => (
                            <span
                              key={ls.id || ls.name}
                              className="px-2 py-0.5 rounded-md bg-[#eaedff] text-[#3525cd] text-[10px] font-medium"
                            >
                              {ls.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-[#eaedff] flex items-center gap-2">
                    <button
                      onClick={() => setConnectStudent(student)}
                      className="flex-1 py-2 rounded-xl bg-[#3525cd] text-white text-xs font-semibold hover:opacity-95 transition-all shadow-xs flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">handshake</span>
                      <span>Propose Swap</span>
                    </button>
                    {onOpenChat && (
                      <button
                        onClick={() =>
                          onOpenChat(undefined, {
                            lessonId: '',
                            lessonTitle: `Chat with ${student.name}`,
                            skillName: teachingSkills[0]?.name || 'Peer Exchange',
                            category: student.department || 'Campus',
                          })
                        }
                        className="p-2 rounded-xl border border-[#eaedff] text-[#464555] hover:text-[#3525cd] hover:bg-[#f2f3ff] transition-all"
                        title="Direct message peer"
                      >
                        <span className="material-symbols-outlined text-[18px]">forum</span>
                      </button>
                    )}
                    {student.publicProfileId && (
                      <button
                        onClick={() => {
                          window.history.pushState({}, '', `/profile/public/${student.publicProfileId}`);
                          window.dispatchEvent(new PopStateEvent('popstate'));
                        }}
                        className="p-2 rounded-xl border border-[#eaedff] text-[#464555] hover:text-[#3525cd] hover:bg-[#f2f3ff] transition-all"
                        title="View verified public profile"
                      >
                        <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* ALL WORKSHOPS CATALOG */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="bg-white rounded-3xl p-6 shadow-sm border border-[#eaedff] flex flex-col justify-between hover:shadow-md transition-all space-y-4"
            >
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#3525cd]">{lesson.category}</span>
                <h3 className="font-bold text-base text-[#131b2e]">{lesson.title}</h3>
                <p className="text-xs text-[#464555] line-clamp-2">{lesson.description}</p>
              </div>

              <button
                onClick={() => {
                  onSelectLesson(lesson.id);
                  onNavigate('lesson-room');
                }}
                className="w-full py-2 rounded-xl bg-[#3525cd] text-white text-xs font-semibold hover:opacity-95"
              >
                View Workshop
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: Transparent Match Explanation Breakdown */}
      {selectedExplanation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#eaedff]">
            <div className="flex items-center justify-between border-b border-[#eaedff] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3525cd] text-[20px]">
                  insights
                </span>
                <h3 className="font-bold text-base text-[#131b2e]">
                  Match Score Breakdown: {selectedExplanation.candidateName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedExplanation(null)}
                className="text-[#8b8a9d] hover:text-[#131b2e]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-3 bg-[#f2f3ff] rounded-2xl border border-[#eaedff] flex items-center justify-between">
              <div>
                <span className="text-xs text-[#464555] block">Total Match Compatibility</span>
                <p className="text-xs font-medium text-[#131b2e] mt-0.5">
                  {selectedExplanation.summary}
                </p>
              </div>
              <span className="text-xl font-extrabold text-[#3525cd] px-3 py-1 bg-white rounded-xl shadow-xs">
                {selectedExplanation.overallScore}%
              </span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {selectedExplanation.factorBreakdown.map((f, i) => (
                <div key={i} className="p-3 rounded-xl border border-[#eaedff] text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#131b2e]">{f.name}</span>
                    <span className="font-bold text-[#006c4a]">
                      +{f.score} / {f.maxScore} pts
                    </span>
                  </div>
                  <p className="text-[11px] text-[#464555]">{f.description}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedExplanation(null)}
              className="w-full py-2.5 rounded-xl bg-[#3525cd] text-white text-xs font-semibold hover:opacity-95"
            >
              Close Breakdown
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: Connect Proposal Modal */}
      {connectStudent && (
        <ConnectModal
          isOpen={!!connectStudent}
          onClose={() => setConnectStudent(null)}
          targetStudent={connectStudent}
          onSuccess={async () => {
            setConnectStudent(null);
            await loadData();
          }}
        />
      )}

      {/* MODAL 3: Global Video Player Modal with Range Streaming Support */}
      {playingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 sm:p-6 animate-fadeIn">
          <div className="bg-[#131b2e] text-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-white/10 flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/10 bg-[#1e293b]">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#3525cd] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">smart_display</span>
                </span>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white truncate max-w-md">
                    {playingVideo.title}
                  </h3>
                  <p className="text-[11px] text-[#c7c4d8]">
                    Uploaded by {playingVideo.creatorName} • {playingVideo.skill} • {playingVideo.level}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setPlayingVideo(null)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                title="Close video"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Video Player Box */}
            <div className="relative bg-black aspect-video flex items-center justify-center">
              <video
                src={playingVideo.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
                playsInline
              />
            </div>

            {/* Modal Footer / Quick Actions */}
            <div className="p-4 sm:p-5 bg-[#1a2333] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t border-white/10">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-[#82f5c1] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">verified</span>
                  <span>Streaming from SkillSwap Durable Video Storage</span>
                </span>
                {playingVideo.duration && (
                  <span className="text-[11px] text-[#c7c4d8]">
                    Duration: {playingVideo.duration} • Shared with collegiate network
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {playingVideo.lessonId && (
                  <button
                    onClick={() => {
                      const lessonId = playingVideo.lessonId!;
                      setPlayingVideo(null);
                      onSelectLesson(lessonId);
                      onNavigate('lesson-room');
                    }}
                    className="px-4 py-2 rounded-xl bg-[#3525cd] hover:bg-[#4338ca] text-white font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">menu_book</span>
                    <span>Open in Workshop Room</span>
                  </button>
                )}
                <button
                  onClick={() => setPlayingVideo(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
