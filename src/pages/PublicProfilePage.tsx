import React, { useEffect, useState } from 'react';
import { PublicProfile } from '../types';
import { apiService } from '../services/apiService';

interface PublicProfilePageProps {
  publicProfileId: string;
  onNavigate: (route: string) => void;
  onSelectLesson?: (lessonId: string) => void;
}

export const PublicProfilePage: React.FC<PublicProfilePageProps> = ({
  publicProfileId,
  onNavigate,
  onSelectLesson,
}) => {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function loadPublicProfile() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiService.getPublicProfile(publicProfileId);
        if (!isMounted) return;

        if (!data || data.publicProfileEnabled === false) {
          setProfile(null);
          setError('This profile is private.');
        } else {
          setProfile(data);
        }
      } catch (err) {
        if (!isMounted) return;
        setProfile(null);
        setError('This profile is private.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (publicProfileId) {
      loadPublicProfile();
    } else {
      setLoading(false);
      setError('This profile is private.');
    }

    return () => {
      isMounted = false;
    };
  }, [publicProfileId]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = window.location.href;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share && profile) {
      try {
        await navigator.share({
          title: `${profile.name}'s SkillSwap Profile`,
          text: `Check out ${profile.name}'s verified skills on SkillSwap!`,
          url: window.location.href,
        });
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#3525cd]/20 border-t-[#3525cd] animate-spin mb-4" />
        <p className="text-sm font-semibold text-[#464555]">
          Loading student public profile...
        </p>
      </div>
    );
  }

  // 2. Private or Not Found State
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 shadow-lg border border-[#eaedff] text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-[#eaedff] text-[#3525cd] mx-auto flex items-center justify-center shadow-inner">
            <span className="material-symbols-outlined text-[42px]">lock</span>
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-[#f2f3ff] text-[#464555] text-xs font-bold tracking-wider uppercase">
              SkillSwap Profile
            </span>
            <h1 className="text-2xl font-black text-[#131b2e] tracking-tight">
              This profile is private.
            </h1>
            <p className="text-xs sm:text-sm text-[#464555] leading-relaxed">
              The user has disabled public profile sharing, or this link is no longer active.
              SkillSwap protects student privacy and never discloses unshared information.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => onNavigate('explore')}
              className="px-6 py-3 rounded-xl bg-[#3525cd] text-white text-xs font-bold hover:opacity-95 transition-all shadow-sm"
            >
              Browse Public Skills
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-6 py-3 rounded-xl bg-[#f2f3ff] text-[#131b2e] text-xs font-bold hover:bg-[#eaedff] transition-all"
            >
              Go to Home
            </button>
          </div>

          <div className="pt-4 border-t border-[#eaedff] text-[11px] text-[#464555] flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-[#006c4a] text-[16px]">verified_user</span>
            <span>SkillSwap Student Data Protection Standard</span>
          </div>
        </div>
      </div>
    );
  }

  // 3. Public Profile Display
  const isLearningVisible = profile.publicLearningHistory && profile.learningSkills && profile.learningSkills.length > 0;
  const hasAchievements = profile.publicLearningHistory && profile.achievements && profile.achievements.length > 0;
  const hasLessons = profile.lessonsCreated && profile.lessonsCreated.length > 0;

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col">
      {/* Top Banner Navigation */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#eaedff]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('explore')}
              className="flex items-center gap-2 group text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#3525cd] to-[#4f46e5] flex items-center justify-center text-white shadow-sm">
                <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
              </div>
              <div>
                <span className="text-sm font-black text-[#131b2e] tracking-tight block">SkillSwap</span>
                <span className="text-[10px] text-[#464555] font-semibold block">Campus Exchange</span>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNativeShare}
              className="px-3.5 py-2 rounded-xl bg-[#eaedff] text-[#3525cd] text-xs font-bold hover:bg-[#dae2fd] transition-all flex items-center gap-1.5"
              title="Share this student's public profile"
            >
              <span className="material-symbols-outlined text-[16px]">
                {copySuccess ? 'check' : 'share'}
              </span>
              <span>{copySuccess ? 'Copied!' : 'Share Profile'}</span>
            </button>

            <button
              onClick={() => onNavigate('auth')}
              className="px-4 py-2 rounded-xl bg-[#3525cd] text-white text-xs font-bold hover:opacity-95 transition-all shadow-sm flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">login</span>
              <span>Join SkillSwap</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Public Profile Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full flex-1 space-y-6">
        {/* Profile Card Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#eaedff] relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-gradient-to-br from-[#e2dfff] via-[#dae2fd] to-[#82f5c1] opacity-35 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6">
            {/* Profile Picture */}
            <div className="relative shrink-0">
              <img
                src={profile.avatarUrl}
                alt={`${profile.name} Profile`}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover shadow-md ring-4 ring-white"
                onError={(e) => {
                  (e.target as HTMLElement).setAttribute(
                    'src',
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
                  );
                }}
              />
              {profile.isVerified && (
                <span
                  className="absolute -bottom-2 -right-2 bg-[#006c4a] text-white p-1.5 rounded-xl shadow flex items-center justify-center"
                  title="Verified Campus Student (.edu verified)"
                >
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                </span>
              )}
            </div>

            {/* Profile Info */}
            <div className="space-y-3 flex-1 min-w-0">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#eaedff] text-[#3525cd] text-[11px] font-extrabold uppercase tracking-wide">
                    SkillSwap Profile
                  </span>
                  {profile.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#82f5c1] text-[#00714e] text-xs font-semibold">
                      <span className="material-symbols-outlined text-[14px]">school</span>
                      <span>Verified Student</span>
                    </span>
                  )}
                  {profile.rank && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#ffdcc3] text-[#703a00] text-xs font-semibold">
                      {profile.rank}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#131b2e] tracking-tight">
                  {profile.name}
                </h1>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-xs sm:text-sm text-[#464555] leading-relaxed max-w-2xl">
                  {profile.bio}
                </p>
              )}

              {/* University & Campus Metadata */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-[#464555] text-xs pt-1">
                {profile.university && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-[#3525cd]">
                      account_balance
                    </span>
                    <span>{profile.university}</span>
                    {profile.year && <span className="text-[#006c4a] font-semibold">({profile.year})</span>}
                  </span>
                )}
                {profile.department && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-[#006c4a]">
                      biotech
                    </span>
                    <span>{profile.department}</span>
                  </span>
                )}
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-[#703a00]">
                      location_on
                    </span>
                    <span>{profile.location}</span>
                  </span>
                )}
                {profile.memberSince && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-[#464555]">
                      calendar_today
                    </span>
                    <span>Member since {profile.memberSince}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Section: Teaching & Learning */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* TEACHING SECTION */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#eaedff] flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#eaedff]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#c5bfff]/30 text-[#3525cd] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">co_present</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#131b2e]">Teaching</h2>
                  <span className="text-[11px] text-[#464555]">Skills available for peer swap</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#eaedff] text-[#3525cd] text-xs font-bold">
                {profile.teachingSkills.length}
              </span>
            </div>

            {profile.teachingSkills.length === 0 ? (
              <p className="text-xs text-[#464555] italic py-4">No teaching skills listed yet.</p>
            ) : (
              <div className="space-y-3 flex-1">
                {profile.teachingSkills.map((skill, index) => (
                  <div
                    key={index}
                    className="p-3.5 rounded-2xl bg-[#f8f9ff] border border-[#eaedff] hover:border-[#c5bfff] transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-[#131b2e]">{skill.name}</span>
                          <span className="px-2 py-0.5 rounded-md bg-[#82f5c1]/50 text-[#00714e] text-[10px] font-bold">
                            {skill.level}
                          </span>
                        </div>
                        {skill.description && (
                          <p className="text-xs text-[#464555] leading-relaxed">
                            {skill.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-[#eaedff]/60 flex items-center justify-between text-[11px] text-[#464555]">
                      {skill.category && (
                        <span className="font-semibold text-[#3525cd]">{skill.category}</span>
                      )}
                      <div className="flex items-center gap-3 ml-auto">
                        {skill.endorsementsCount !== undefined && skill.endorsementsCount > 0 && (
                          <span className="flex items-center gap-1 text-amber-600 font-semibold">
                            <span className="material-symbols-outlined text-[14px]">thumb_up</span>
                            {skill.endorsementsCount} endorsements
                          </span>
                        )}
                        {skill.hoursTaught !== undefined && skill.hoursTaught > 0 && (
                          <span className="flex items-center gap-1 text-[#006c4a] font-semibold">
                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                            {skill.hoursTaught} hrs taught
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* LEARNING SECTION */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#eaedff] flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#eaedff]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#82f5c1]/30 text-[#00714e] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">local_library</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#131b2e]">Learning</h2>
                  <span className="text-[11px] text-[#464555]">Skills student wants to acquire</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#82f5c1] text-[#00714e] text-xs font-bold">
                {isLearningVisible ? profile.learningSkills.length : 'Hidden'}
              </span>
            </div>

            {!profile.publicLearningHistory ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#f8f9ff] rounded-2xl border border-dashed border-[#eaedff]">
                <span className="material-symbols-outlined text-[#464555] text-[28px] mb-2">lock</span>
                <p className="text-xs font-semibold text-[#464555]">
                  Learning history is set to private by the student.
                </p>
              </div>
            ) : profile.learningSkills.length === 0 ? (
              <p className="text-xs text-[#464555] italic py-4">No learning goals listed yet.</p>
            ) : (
              <div className="space-y-3 flex-1">
                {profile.learningSkills.map((skill, index) => (
                  <div
                    key={index}
                    className="p-3.5 rounded-2xl bg-[#f8f9ff] border border-[#eaedff] hover:border-[#82f5c1] transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-[#131b2e]">{skill.name}</span>
                          <span className="px-2 py-0.5 rounded-md bg-[#eaedff] text-[#3525cd] text-[10px] font-bold">
                            {skill.level}
                          </span>
                        </div>
                        {skill.description && (
                          <p className="text-xs text-[#464555] leading-relaxed">
                            {skill.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-[#eaedff]/60 flex items-center justify-between text-[11px] text-[#464555]">
                      {skill.category && (
                        <span className="font-semibold text-[#00714e]">{skill.category}</span>
                      )}
                      {(skill as any).targetLevel && (
                        <span className="text-xs font-semibold text-[#3525cd]">
                          Target: {(skill as any).targetLevel}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SKILLS / ACHIEVEMENTS */}
        {hasAchievements && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#eaedff]">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#eaedff]">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">military_tech</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-[#131b2e]">Skills & Achievements</h2>
                <span className="text-[11px] text-[#464555]">Verified campus badges and milestones</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {profile.achievements.map((ach) => (
                <div
                  key={ach.id || ach.title}
                  className="p-3.5 rounded-2xl bg-[#f8f9ff] border border-[#eaedff] flex items-start gap-3 hover:shadow-xs transition-all"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      ach.iconBgColor || 'bg-[#c5bfff] text-[#4d2db7]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {ach.icon || 'military_tech'}
                    </span>
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <h3 className="text-xs font-bold text-[#131b2e] truncate">{ach.title}</h3>
                    <p className="text-[11px] text-[#464555] line-clamp-2 leading-relaxed">
                      {ach.description}
                    </p>
                    {ach.levelBadge && (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-white text-[10px] font-bold text-[#3525cd] border border-[#eaedff] mt-1">
                        {ach.levelBadge}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LESSONS CREATED */}
        {hasLessons && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#eaedff]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#eaedff]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#ffdcc3] text-[#703a00] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">school</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#131b2e]">Lessons Created</h2>
                  <span className="text-[11px] text-[#464555]">Peer lessons curated and taught by this student</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#ffdcc3] text-[#703a00] text-xs font-bold">
                {profile.lessonsCreated.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profile.lessonsCreated.map((lesson) => (
                <div
                  key={lesson.id}
                  className="p-4 rounded-2xl bg-[#f8f9ff] border border-[#eaedff] flex flex-col justify-between hover:border-[#3525cd] transition-all group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-[#eaedff] text-[#3525cd] text-[10px] font-bold">
                        {lesson.category}
                      </span>
                      {lesson.durationMinutes && (
                        <span className="text-[11px] text-[#464555] flex items-center gap-1 font-semibold">
                          <span className="material-symbols-outlined text-[13px]">timer</span>
                          {lesson.durationMinutes} min
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-[#131b2e] group-hover:text-[#3525cd] transition-colors">
                      {lesson.title}
                    </h3>
                    <p className="text-xs text-[#464555] line-clamp-2 leading-relaxed">
                      {lesson.description}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-[#eaedff] flex items-center justify-between">
                    <span className="text-[11px] text-[#464555] font-semibold">
                      {lesson.difficultyLevel || 'All Levels'}
                    </span>
                    <button
                      onClick={() => {
                        if (onSelectLesson) {
                          onSelectLesson(lesson.id);
                        } else {
                          onNavigate('explore');
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#3525cd] text-white text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1 shadow-xs"
                    >
                      <span>Explore Lesson</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SKILLSWAP ACTIVITY SUMMARY */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#eaedff]">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#eaedff]">
            <div className="w-8 h-8 rounded-xl bg-[#82f5c1]/30 text-[#00714e] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">monitoring</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-[#131b2e]">SkillSwap Activity Summary</h2>
              <span className="text-[11px] text-[#464555]">Verified platform participation and exchange reliability</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#f8f9ff] border border-[#eaedff] flex flex-col">
              <span className="text-xs text-[#464555]">Hours Taught</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="material-symbols-outlined text-[#3525cd] text-[20px]">co_present</span>
                <span className="text-lg font-bold text-[#131b2e]">
                  {profile.activitySummary?.hoursTaught ?? 0}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#f8f9ff] border border-[#eaedff] flex flex-col">
              <span className="text-xs text-[#464555]">Hours Learned</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="material-symbols-outlined text-[#006c4a] text-[20px]">local_library</span>
                <span className="text-lg font-bold text-[#131b2e]">
                  {profile.activitySummary?.hoursLearned !== null && profile.activitySummary?.hoursLearned !== undefined
                    ? profile.activitySummary.hoursLearned
                    : 'Private'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#f8f9ff] border border-[#eaedff] flex flex-col">
              <span className="text-xs text-[#464555]">Peer Reputation</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="material-symbols-outlined text-amber-500 text-[20px]">star</span>
                <span className="text-lg font-bold text-[#131b2e]">
                  {profile.activitySummary?.peerReputation ?? '5.0'}
                </span>
                <span className="text-[10px] text-[#464555]">
                  ({profile.activitySummary?.reviewCount ?? 0})
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#f8f9ff] border border-[#eaedff] flex flex-col">
              <span className="text-xs text-[#464555]">Swap Reliability</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="material-symbols-outlined text-[#006c4a] text-[20px]">verified</span>
                <span className="text-lg font-bold text-[#006c4a]">
                  {profile.activitySummary?.swapFulfillRate ?? 100}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Safe Campus Exchange Notice & CTA */}
        <div className="bg-gradient-to-r from-[#eaedff] via-white to-[#82f5c1]/20 rounded-3xl p-6 sm:p-8 border border-[#eaedff] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1 text-[#00714e] text-xs font-bold mb-1">
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
              <span>Encrypted & Privacy Protected</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#131b2e]">
              Want to swap skills with {profile.name}?
            </h3>
            <p className="text-xs text-[#464555] max-w-lg">
              Sign up on SkillSwap using your university email to request a 1-on-1 peer exchange,
              access course materials, and earn verified skill endorsements.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <button
              onClick={() => onNavigate('auth')}
              className="px-5 py-3 rounded-xl bg-[#3525cd] text-white text-xs font-bold hover:opacity-95 transition-all shadow-sm flex items-center gap-2"
            >
              <span>Connect on SkillSwap</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
