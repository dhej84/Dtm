import React, { useState, useEffect } from 'react';
import { UserProfile, PrivacySettings, StudentAssessmentStats } from '../types';
import { apiService } from '../services/apiService';
import { EditProfileModal } from '../components/EditProfileModal';
import { PrivacyDrawer } from '../components/PrivacyDrawer';
import { SharePublicProfileModal } from '../components/SharePublicProfileModal';

interface ProfilePageProps {
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => Promise<void>;
  onNavigate: (route: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  onUpdateUser,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'badges' | 'skills' | 'journey' | 'reviews' | 'assessments'>('badges');
  const [assessmentStats, setAssessmentStats] = useState<StudentAssessmentStats | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPrivacyDrawerOpen, setIsPrivacyDrawerOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copyNotice, setCopyNotice] = useState(false);

  const handleShareProfile = () => {
    setIsShareModalOpen(true);
  };

  const handleRegeneratePublicLink = async (): Promise<string> => {
    const newId = await apiService.regeneratePublicProfileId();
    if (newId) {
      await onUpdateUser({ publicProfileId: newId });
      return newId;
    }
    const userFallbackId = `${(user.name || 'student').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${user.id ? user.id.replace(/^user-/, '').replace(/[^a-z0-9]/g, '').substring(0, 5) : 'share'}`;
    return user.publicProfileId || userFallbackId;
  };

  const handleEndorse = async (badgeId: string) => {
    const updated = await apiService.endorseBadge(badgeId);
    await onUpdateUser(updated);
  };

  const handleSavePrivacy = async (newPrivacy: PrivacySettings) => {
    const updated = await apiService.updatePrivacySettings(newPrivacy);
    await onUpdateUser(updated);
  };

  useEffect(() => {
    try {
      const stats = apiService.getStudentPerformanceStats(user.id);
      setAssessmentStats(stats);
    } catch (e) {
      console.error('Failed to load assessment stats:', e);
    }
  }, [user.id]);

  const teachingBadges = user.badges.filter((b) => b.category === 'Teaching Mastery');
  const learningBadges = user.badges.filter((b) => b.category === 'Learning Milestones');

  return (
    <div className="flex flex-col w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full space-y-8">
        {/* Profile Hero Surface */}
        <div className="relative bg-white rounded-3xl p-6 sm:p-8 shadow-sm overflow-hidden border border-[#eaedff]">
          {/* Decorative ambient gradient backdrop ring */}
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br from-[#e2dfff] via-[#dae2fd] to-[#82f5c1] opacity-40 blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-start justify-between gap-8">
            {/* Identity left column */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative">
                <img
                  alt={`${user.name} Portrait`}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover shadow-md ring-4 ring-white"
                  src={user.avatarUrl}
                />
                {user.isVerified && (
                  <span
                    className="absolute -bottom-2 -right-2 bg-[#006c4a] text-white p-1.5 rounded-xl shadow flex items-center justify-center"
                    title="Active on Campus & .edu Verified"
                  >
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#131b2e] tracking-tight">
                    {user.name}
                  </h1>
                  {user.isVerified && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#82f5c1] text-[#00714e] text-xs font-semibold">
                      <span className="material-symbols-outlined text-[16px]">school</span>
                      <span>{user.university} Student (Verified .edu)</span>
                    </div>
                  )}
                </div>

                <p className="text-sm sm:text-base text-[#464555] max-w-xl leading-relaxed">
                  {user.bio}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-[#464555] text-xs pt-1">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-[#3525cd]">
                      location_on
                    </span>{' '}
                    {user.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-[#006c4a]">
                      calendar_today
                    </span>{' '}
                    Member since {user.memberSince}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-[#703a00]">
                      military_tech
                    </span>{' '}
                    Rank: {user.rank}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick actions right column */}
            <div className="flex flex-wrap lg:flex-col gap-2.5 shrink-0 self-stretch sm:self-auto justify-end">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#3525cd] text-white font-semibold text-xs shadow-sm hover:opacity-95 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                <span>Edit Profile</span>
              </button>
              <button
                onClick={handleShareProfile}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#eaedff] text-[#3525cd] font-semibold text-xs hover:bg-[#dae2fd] transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">share</span>
                <span>Share Public Profile</span>
              </button>
              <button
                onClick={() => setIsPrivacyDrawerOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#f2f3ff] text-[#464555] hover:text-[#131b2e] font-semibold text-xs transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">lock_person</span>
                <span>Privacy Controls</span>
              </button>
            </div>
          </div>

          {/* Key Platform Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-8 pt-6 bg-[#f2f3ff]/70 rounded-2xl p-4 border border-[#eaedff]">
            <div className="flex flex-col items-start px-3 py-2">
              <span className="text-xs text-[#464555]">Wallet Balance</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="material-symbols-outlined text-[#006c4a] text-[22px]">bolt</span>
                <span className="text-xl font-bold text-[#131b2e]">{user.walletBalance}</span>
                <span className="text-[11px] text-[#464555]">Credits</span>
              </div>
            </div>

            <div className="flex flex-col items-start px-3 py-2">
              <span className="text-xs text-[#464555]">Teaching Impact</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="material-symbols-outlined text-[#3525cd] text-[22px]">
                  co_present
                </span>
                <span className="text-xl font-bold text-[#131b2e]">{user.hoursTaught}</span>
                <span className="text-[11px] text-[#464555]">Hours Taught</span>
              </div>
            </div>

            <div className="flex flex-col items-start px-3 py-2">
              <span className="text-xs text-[#464555]">Acquired Skills</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="material-symbols-outlined text-[#703a00] text-[22px]">
                  local_library
                </span>
                <span className="text-xl font-bold text-[#131b2e]">{user.hoursLearned}</span>
                <span className="text-[11px] text-[#464555]">Hours Learned</span>
              </div>
            </div>

            <div className="flex flex-col items-start px-3 py-2">
              <span className="text-xs text-[#464555]">Peer Reputation</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="material-symbols-outlined text-amber-500 text-[22px] material-symbols-fill">
                  star
                </span>
                <span className="text-xl font-bold text-[#131b2e]">{user.peerReputation}</span>
                <span className="text-[11px] text-[#464555]">({user.reviewCount} Reviews)</span>
              </div>
            </div>

            <div className="col-span-2 md:col-span-1 flex flex-col items-start px-3 py-2">
              <span className="text-xs text-[#464555]">Swap Reliability</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="material-symbols-outlined text-[#006c4a] text-[22px]">
                  verified_user
                </span>
                <span className="text-xl font-bold text-[#006c4a]">{user.swapFulfillRate}%</span>
                <span className="text-[11px] text-[#464555]">Fulfill Rate</span>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1" id="profileTabs">
          <button
            onClick={() => setActiveTab('badges')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'badges'
                ? 'bg-[#3525cd] text-white shadow-sm'
                : 'bg-[#f2f3ff] text-[#464555] hover:text-[#131b2e]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
            Badges & Endorsements
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'skills'
                ? 'bg-[#3525cd] text-white shadow-sm'
                : 'bg-[#f2f3ff] text-[#464555] hover:text-[#131b2e]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">sync_alt</span>
            Skills Matrix
          </button>
          <button
            onClick={() => setActiveTab('journey')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'journey'
                ? 'bg-[#3525cd] text-white shadow-sm'
                : 'bg-[#f2f3ff] text-[#464555] hover:text-[#131b2e]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">trending_up</span>
            Learning Journey
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'reviews'
                ? 'bg-[#3525cd] text-white shadow-sm'
                : 'bg-[#f2f3ff] text-[#464555] hover:text-[#131b2e]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">reviews</span>
            Reviews & Feedback
          </button>
          <button
            onClick={() => setActiveTab('assessments')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'assessments'
                ? 'bg-[#3525cd] text-white shadow-sm'
                : 'bg-[#f2f3ff] text-[#464555] hover:text-[#131b2e]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">insights</span>
            Assessment Insights
          </button>
          <button
            onClick={() => setIsPrivacyDrawerOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#f2f3ff] text-[#464555] hover:text-[#131b2e] transition-all flex items-center gap-2 ml-auto shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">security</span>
            Privacy Controls
          </button>
        </div>

        {/* TAB 5: ASSESSMENT INSIGHTS & PERFORMANCE */}
        {activeTab === 'assessments' && (
          <div className="space-y-8 animate-fadeIn">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-[#eaedff] shadow-sm space-y-1">
                <span className="text-xs text-[#464555] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#3525cd]">verified</span>
                  Checkpoints Passed
                </span>
                <p className="text-2xl font-black text-[#131b2e]">
                  {assessmentStats?.assessmentsCompleted ?? 0}
                </p>
                <span className="text-[11px] text-[#006c4a] font-semibold">15-Question Verified</span>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-[#eaedff] shadow-sm space-y-1">
                <span className="text-xs text-[#464555] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#006c4a]">monitoring</span>
                  Average Score
                </span>
                <p className="text-2xl font-black text-[#131b2e]">
                  {assessmentStats?.averageScore ?? 0}%
                </p>
                <span className="text-[11px] text-[#464555]">Passing Threshold 70%</span>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-[#eaedff] shadow-sm space-y-1">
                <span className="text-xs text-[#464555] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-amber-500">trophy</span>
                  Best Checkpoint
                </span>
                <p className="text-2xl font-black text-[#131b2e]">
                  {assessmentStats?.bestScore ?? 0}%
                </p>
                <span className="text-[11px] text-amber-600 font-semibold">Top Score Recorded</span>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-[#eaedff] shadow-sm space-y-1">
                <span className="text-xs text-[#464555] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#703a00]">school</span>
                  Lessons Completed
                </span>
                <p className="text-2xl font-black text-[#131b2e]">
                  {assessmentStats?.lessonsCompleted ?? 0}
                </p>
                <span className="text-[11px] text-[#006c4a] font-semibold">Assessment Validated</span>
              </div>
            </div>

            {/* Topic Proficiency & Identified Learning Gaps */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Topic Proficiency Breakdown */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#eaedff] space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#131b2e] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-[#3525cd]">bar_chart</span>
                      Topic Proficiency Matrix
                    </h3>
                    <p className="text-xs text-[#464555]">Mastery levels derived from assessment attempts</p>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#f2f3ff] text-[#3525cd] font-semibold">
                    Live Telemetry
                  </span>
                </div>

                <div className="space-y-4">
                  {assessmentStats?.topicProficiency && Object.keys(assessmentStats.topicProficiency).length > 0 ? (
                    Object.entries(assessmentStats.topicProficiency).map(([topic, score]) => (
                      <div key={topic} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#131b2e]">{topic}</span>
                          <span className={`font-bold ${score >= 80 ? 'text-[#006c4a]' : score >= 70 ? 'text-[#3525cd]' : 'text-amber-600'}`}>
                            {score}% {score >= 80 ? '• Mastered' : score >= 70 ? '• Proficient' : '• Revision Needed'}
                          </span>
                        </div>
                        <div className="w-full bg-[#f2f3ff] h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              score >= 80 ? 'bg-[#006c4a]' : score >= 70 ? 'bg-[#3525cd]' : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, score)}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 rounded-2xl bg-[#f2f3ff] text-center text-xs text-[#464555]">
                      No topic assessments completed yet. Take lesson checkpoint tests to generate your mastery matrix!
                    </div>
                  )}
                </div>
              </div>

              {/* Identified Learning Gaps & Actionable Revision */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#eaedff] space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#131b2e] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-amber-600">psychology</span>
                      Identified Learning Gaps
                    </h3>
                    <p className="text-xs text-[#464555]">Curated topics recommended for revision</p>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-semibold">
                    AI Diagnostic
                  </span>
                </div>

                <div className="space-y-3">
                  {assessmentStats?.identifiedGaps && assessmentStats.identifiedGaps.length > 0 ? (
                    assessmentStats.identifiedGaps.map((gap, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-start justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <span className="material-symbols-outlined text-[20px] text-amber-600 mt-0.5">
                            warning
                          </span>
                          <div>
                            <h4 className="text-xs font-bold text-[#131b2e]">{gap}</h4>
                            <p className="text-[11px] text-[#464555] mt-0.5">
                              Missed in recent checkpoint attempt. Revisit video lecture and retry the assessment questions.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => onNavigate('explore-skills')}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-[10px] font-bold shrink-0 hover:bg-amber-700 transition-colors"
                        >
                          Revise Topic
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 rounded-2xl bg-[#82f5c1]/20 border border-[#82f5c1]/40 text-center space-y-2">
                      <span className="material-symbols-outlined text-[28px] text-[#006c4a]">check_circle</span>
                      <p className="text-xs font-bold text-[#00714e]">No critical learning gaps detected!</p>
                      <p className="text-[11px] text-[#464555]">
                        You're meeting or exceeding passing standards on all attempted lesson checkpoints.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Score Progression & Historical Performance */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#eaedff] space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#131b2e] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-[#006c4a]">trending_up</span>
                    Score Progression Over Time
                  </h3>
                  <p className="text-xs text-[#464555]">Chronological trend of verified assessment attempts</p>
                </div>
              </div>

              {assessmentStats?.scoreProgression && assessmentStats.scoreProgression.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {assessmentStats.scoreProgression.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] space-y-2 relative"
                    >
                      <div className="flex items-center justify-between text-xs text-[#464555]">
                        <span>{item.date}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white font-bold text-[#3525cd]">
                          Attempt #{idx + 1}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-[#131b2e] line-clamp-1">{item.lessonTitle}</h4>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black text-[#131b2e]">{item.scorePercentage}%</span>
                        <span className={`text-[10px] font-bold ${item.scorePercentage >= 70 ? 'text-[#006c4a]' : 'text-amber-600'}`}>
                          {item.scorePercentage >= 70 ? 'Passed' : 'Needs Retake'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-[#f2f3ff] text-center text-xs text-[#464555]">
                  No score progression data yet. Start an assessment in the Lesson Room!
                </div>
              )}
            </div>

            {/* Recent Assessment Attempts Log */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#eaedff] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#131b2e]">Recent Assessment Attempts</h3>
                <span className="text-xs text-[#464555]">Pass requirement: 70%</span>
              </div>

              <div className="space-y-3">
                {assessmentStats?.recentResults && assessmentStats.recentResults.length > 0 ? (
                  assessmentStats.recentResults.map((res, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              res.passed ? 'bg-[#006c4a]' : 'bg-amber-500'
                            }`}
                          />
                          <h4 className="text-xs font-bold text-[#131b2e]">{res.lessonTitle}</h4>
                        </div>
                        <p className="text-[11px] text-[#464555]">
                          Completed on {res.date} • Raw Score: {res.score} points
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-[#131b2e] block">
                            {res.percentage}%
                          </span>
                          <span
                            className={`text-[10px] font-bold ${
                              res.passed ? 'text-[#006c4a]' : 'text-amber-600'
                            }`}
                          >
                            {res.passed ? 'PASSED ✓' : 'FAILED'}
                          </span>
                        </div>
                        <button
                          onClick={() => onNavigate('lesson-room')}
                          className="px-3 py-1.5 rounded-xl bg-white border border-[#dae2fd] text-xs font-semibold text-[#3525cd] hover:bg-[#eaedff] transition-colors"
                        >
                          Open Lesson
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 rounded-2xl bg-[#f2f3ff] text-center text-xs text-[#464555]">
                    No attempts recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'badges' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Peer Validation Philosophy Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#82f5c1]/30 flex items-start gap-4 border border-[#82f5c1]/50">
              <div className="p-2.5 rounded-xl bg-[#006c4a] text-white shrink-0">
                <span className="material-symbols-outlined text-[24px]">verified</span>
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#131b2e]">
                  Collegiate Peer Validation Architecture
                </h2>
                <p className="text-xs text-[#00714e] mt-0.5 leading-relaxed">
                  Earned through peer reviews, completed practice challenges, and active learning
                  milestones — not corporate certificates. Built with authentic campus accountability.
                </p>
              </div>
            </div>

            {/* CATEGORY 1: Teaching Mastery */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#006c4a]"></span>
                  <h3 className="text-lg font-bold text-[#131b2e]">Category: Teaching Mastery</h3>
                </div>
                <span className="text-xs font-medium text-[#464555] bg-[#eaedff] px-3 py-1 rounded-full">
                  {teachingBadges.length} Validated Badges
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {teachingBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-[#eaedff] flex flex-col justify-between relative group hover:shadow-md transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div
                          className={`w-14 h-14 rounded-2xl ${
                            badge.iconBgColor || 'bg-[#82f5c1] text-[#00714e]'
                          } flex items-center justify-center shadow-sm`}
                        >
                          <span className="material-symbols-outlined text-[32px] material-symbols-fill">
                            {badge.icon}
                          </span>
                        </div>
                        {/* Circular Progress Ring */}
                        <div className="relative w-12 h-12 flex items-center justify-center">
                          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-[#dae2fd]"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3.5"
                            />
                            <path
                              className={
                                badge.id === 'b-1'
                                  ? 'text-[#006c4a]'
                                  : badge.id === 'b-2'
                                  ? 'text-[#3525cd]'
                                  : 'text-[#703a00]'
                              }
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="currentColor"
                              strokeDasharray={`${badge.fillPercent}, 100`}
                              strokeLinecap="round"
                              strokeWidth="3.5"
                            />
                          </svg>
                          <span className="absolute text-[11px] text-[#131b2e] font-bold">
                            {badge.progressText}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-[#131b2e]">{badge.title}</h4>
                        <p className="text-xs text-[#464555] mt-1 leading-relaxed">
                          {badge.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 space-y-2 border-t border-[#f2f3ff]">
                      <div className="flex items-center justify-between text-xs text-[#464555]">
                        <span>Issued: {badge.issuedDate}</span>
                        <span className="font-bold text-[#006c4a]">{badge.levelBadge}</span>
                      </div>
                      <button
                        onClick={() => handleEndorse(badge.id)}
                        className={`w-full flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg transition-all ${
                          badge.userEndorsed
                            ? 'bg-[#82f5c1]/30 text-[#00714e] font-bold'
                            : 'bg-[#f2f3ff] text-[#131b2e] hover:bg-[#eaedff]'
                        }`}
                        title="Click to endorse this peer badge"
                      >
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-[#006c4a]">
                            groups
                          </span>
                          <span>Peer Endorsed by {badge.endorsementsCount} students</span>
                        </span>
                        <span className="text-[10px] text-[#3525cd] underline">
                          {badge.userEndorsed ? 'Endorsed ✓' : '+ Endorse'}
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CATEGORY 2: Learning Milestones */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3525cd]"></span>
                  <h3 className="text-lg font-bold text-[#131b2e]">Category: Learning Milestones</h3>
                </div>
                <span className="text-xs font-medium text-[#464555] bg-[#eaedff] px-3 py-1 rounded-full">
                  {learningBadges.length} Validated Badges
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {learningBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-[#eaedff] flex flex-col justify-between relative group hover:shadow-md transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div
                          className={`w-14 h-14 rounded-2xl ${
                            badge.iconBgColor || 'bg-[#eaedff] text-[#3525cd]'
                          } flex items-center justify-center shadow-sm`}
                        >
                          <span className="material-symbols-outlined text-[32px] material-symbols-fill">
                            {badge.icon}
                          </span>
                        </div>
                        {/* Circular Progress Ring */}
                        <div className="relative w-12 h-12 flex items-center justify-center">
                          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-[#dae2fd]"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3.5"
                            />
                            <path
                              className="text-[#3525cd]"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="currentColor"
                              strokeDasharray={`${badge.fillPercent}, 100`}
                              strokeLinecap="round"
                              strokeWidth="3.5"
                            />
                          </svg>
                          <span className="absolute text-[11px] text-[#131b2e] font-bold">
                            {badge.progressText}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-[#131b2e]">{badge.title}</h4>
                        <p className="text-xs text-[#464555] mt-1 leading-relaxed">
                          {badge.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 space-y-2 border-t border-[#f2f3ff]">
                      <div className="flex items-center justify-between text-xs text-[#464555]">
                        <span>Issued: {badge.issuedDate}</span>
                        <span className="font-bold text-[#3525cd]">{badge.levelBadge}</span>
                      </div>
                      <button
                        onClick={() => handleEndorse(badge.id)}
                        className={`w-full flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg transition-all ${
                          badge.userEndorsed
                            ? 'bg-[#82f5c1]/30 text-[#00714e] font-bold'
                            : 'bg-[#f2f3ff] text-[#131b2e] hover:bg-[#eaedff]'
                        }`}
                        title="Click to endorse this peer badge"
                      >
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-[#3525cd]">
                            groups
                          </span>
                          <span>Peer Endorsed by {badge.endorsementsCount} students</span>
                        </span>
                        <span className="text-[10px] text-[#3525cd] underline">
                          {badge.userEndorsed ? 'Endorsed ✓' : '+ Endorse'}
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SKILLS MATRIX */}
        {activeTab === 'skills' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Skills Offered Matrix */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#eaedff] space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#82f5c1] text-[#00714e]">
                      <span className="material-symbols-outlined text-[22px]">school</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#131b2e]">Skills Maya Teaches</h3>
                      <span className="text-xs text-[#464555]">
                        Validated through {user.hoursTaught} student teaching sessions
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="px-2.5 py-1 rounded-full bg-[#82f5c1] text-[#00714e] text-xs font-semibold hover:opacity-90"
                  >
                    + Add Skill
                  </button>
                </div>

                <div className="space-y-4">
                  {user.teachingSkills.map((skill) => (
                    <div
                      key={skill.id}
                      className="p-4 rounded-2xl bg-[#f2f3ff]/70 border border-[#eaedff] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs sm:text-sm text-[#131b2e]">
                          {skill.name}
                        </span>
                        <span className="text-xs text-[#006c4a] font-bold">{skill.level}</span>
                      </div>
                      <div className="w-full bg-[#dae2fd] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#006c4a] h-full rounded-full transition-all duration-500"
                          style={{ width: `${skill.proficiencyPercent}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-[#464555] text-xs">
                        <span>
                          {skill.hoursTaught} hours taught • {skill.reviewsCount} reviews
                        </span>
                        <span className="font-semibold text-[#131b2e]">
                          {skill.endorsementsCount} peer endorsements
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills Learning Matrix */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#eaedff] space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#e2dfff] text-[#3323cc]">
                      <span className="material-symbols-outlined text-[22px]">psychology</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#131b2e]">Skills Maya Is Learning</h3>
                      <span className="text-xs text-[#464555]">
                        Active peer swaps & practice goals
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="px-2.5 py-1 rounded-full bg-[#eaedff] text-[#3525cd] text-xs font-semibold hover:opacity-90"
                  >
                    + Add Goal
                  </button>
                </div>

                <div className="space-y-4">
                  {user.learningSkills.map((skill) => (
                    <div
                      key={skill.id}
                      className="p-4 rounded-2xl bg-[#f2f3ff]/70 border border-[#eaedff] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs sm:text-sm text-[#131b2e]">
                          {skill.name}
                        </span>
                        <span className="text-xs text-[#3525cd] font-bold">
                          {skill.progressPercent}% to Goal
                        </span>
                      </div>
                      <div className="w-full bg-[#dae2fd] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#3525cd] h-full rounded-full transition-all duration-500"
                          style={{ width: `${skill.progressPercent}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-[#464555] text-xs">
                        <span>
                          {skill.hoursPracticed} hours practiced • Partner: {skill.partnerName}
                        </span>
                        <span className="font-semibold text-[#131b2e]">
                          Target: {skill.targetDate}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LEARNING JOURNEY TIMELINE */}
        {activeTab === 'journey' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#eaedff]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-lg font-bold text-[#131b2e]">
                    Learning & Teaching Milestones
                  </h3>
                  <p className="text-xs text-[#464555]">
                    Chronological progression of skills shared, received, and verified on campus.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#464555]">Term:</span>
                  <span className="px-3 py-1 bg-[#eaedff] text-[#3525cd] rounded-lg text-xs font-semibold">
                    Fall Quadrangle 2024
                  </span>
                </div>
              </div>

              {/* Timeline items */}
              <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#dae2fd]">
                {user.journey.map((item, idx) => (
                  <div key={item.id} className="relative">
                    <span
                      className={`absolute -left-6 sm:-left-8 top-1 w-5 h-5 rounded-full ${
                        idx === 0
                          ? 'bg-[#006c4a]'
                          : idx === 1
                          ? 'bg-[#3525cd]'
                          : 'bg-[#ffdcc3]'
                      } ring-4 ring-white flex items-center justify-center`}
                    >
                      <span className="w-2 h-2 rounded-full bg-white"></span>
                    </span>
                    <div className="bg-[#f2f3ff] rounded-2xl p-4 sm:p-5 space-y-2 border border-[#eaedff]">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-sm text-[#131b2e]">{item.title}</span>
                        <span className="text-xs text-[#464555]">{item.timeAgo}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#464555] leading-relaxed">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        {item.creditsChange && (
                          <span className="px-2.5 py-0.5 rounded-full bg-[#82f5c1] text-[#00714e] text-xs font-semibold">
                            +{item.creditsChange} Swap Credits Earned
                          </span>
                        )}
                        {item.partnerName && (
                          <span className="text-xs text-[#464555]">
                            Partner: {item.partnerName}
                          </span>
                        )}
                        {item.badgeTriggered && (
                          <span className="px-2.5 py-0.5 rounded-full bg-[#eaedff] text-[#3525cd] text-xs font-semibold">
                            Triggered: {item.badgeTriggered}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: REVIEWS & FEEDBACK */}
        {activeTab === 'reviews' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#eaedff]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[#131b2e]">
                    Verified Peer Testimonials ({user.reviewCount})
                  </h3>
                  <p className="text-xs text-[#464555]">
                    Reviews can only be posted after both students confirm a completed swap session.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#131b2e]">
                      {user.peerReputation}
                    </span>
                    <span className="text-xs text-[#464555]"> / 5.0 rating</span>
                  </div>
                  <div className="flex text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className="material-symbols-outlined text-[20px] material-symbols-fill"
                      >
                        star
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reviews Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {user.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-5 rounded-2xl bg-[#f2f3ff] flex flex-col justify-between space-y-4 border border-[#eaedff]"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#82f5c1] text-[#00714e] flex items-center justify-center font-bold text-xs">
                            {user.privacy.maskReviews ? rev.authorInitials : rev.authorInitials}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-[#131b2e]">
                              {user.privacy.maskReviews
                                ? `${rev.authorInitials}.`
                                : rev.authorName}
                            </h4>
                            <span className="text-[11px] text-[#464555]">{rev.authorProgram}</span>
                          </div>
                        </div>
                        <div className="flex text-amber-500">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span
                              key={s}
                              className="material-symbols-outlined text-[16px] material-symbols-fill"
                            >
                              star
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-[#131b2e] italic leading-relaxed">
                        “{rev.comment}”
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 text-[#464555] text-xs">
                      <span className="bg-[#eaedff] px-2 py-0.5 rounded-full text-[#006c4a] font-medium text-[11px]">
                        Topic: {rev.topic}
                      </span>
                      <span>{rev.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user}
        onSave={async (updated) => {
          await onUpdateUser(updated);
        }}
      />

      {/* Privacy Drawer */}
      <PrivacyDrawer
        isOpen={isPrivacyDrawerOpen}
        onClose={() => setIsPrivacyDrawerOpen(false)}
        privacy={user.privacy}
        onSave={handleSavePrivacy}
      />

      {/* Share Public Profile Modal */}
      <SharePublicProfileModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        user={user}
        onRegenerateLink={handleRegeneratePublicLink}
        onNavigate={onNavigate}
        onOpenPrivacy={() => {
          setIsShareModalOpen(false);
          setIsPrivacyDrawerOpen(true);
        }}
      />
    </div>
  );
};
