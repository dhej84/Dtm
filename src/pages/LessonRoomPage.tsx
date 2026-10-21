import React, { useState, useEffect } from 'react';
import { Lesson, LessonContext } from '../types';
import { apiService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { IntegratedLessonAssessment } from '../components/IntegratedLessonAssessment';
import { LessonVideoPlayer } from '../components/LessonVideoPlayer';
import { assessmentService } from '../services/assessmentService';

interface LessonRoomPageProps {
  activeLessonId?: string;
  onNavigate: (route: string) => void;
  onOpenChat?: (conversationId?: string, lessonContext?: LessonContext) => void;
  onAskAi?: (lessonContext: LessonContext) => void;
}

export const LessonRoomPage: React.FC<LessonRoomPageProps> = ({
  activeLessonId,
  onNavigate,
  onOpenChat,
  onAskAi,
}) => {
  const { currentUser, refreshUser } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'notes' | 'comments' | 'resources'>('content');
  const [activeModuleId, setActiveModuleId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  const [assessingModuleId, setAssessingModuleId] = useState<string>('');
  const [assessmentScoreMap, setAssessmentScoreMap] = useState<Record<string, number>>({});

  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [assessmentNotice, setAssessmentNotice] = useState<string | null>(null);
  const currentUserId = currentUser?.id || '';

  useEffect(() => {
    loadLessons();
  }, [activeLessonId]);

  const loadLessons = async () => {
    try {
      const all = await apiService.getLessons();
      setLessons(all);

      const target = all.find((l) => l.id === activeLessonId) || all[0];
      if (target) {
        setCurrentLesson(target);
        setNotes(target.userNotes || '');
        if (target.modules && target.modules.length > 0) {
          setActiveModuleId(target.modules[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load lessons:', err);
    }
  };

  const handleSelectLesson = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setNotes(lesson.userNotes || '');
    if (lesson.modules && lesson.modules.length > 0) {
      setActiveModuleId(lesson.modules[0].id);
    }
  };

  const handleToggleModule = async (moduleId: string) => {
    if (!currentLesson) return;
    try {
      const updated = await apiService.toggleModuleComplete(currentLesson.id, moduleId);
      
      // Enforce: watching video / modules alone must NOT mark lesson completed
      const latestAttempt = assessmentService.getLatestAttempt(currentLesson.id, currentUserId);
      const isPassed = latestAttempt?.passed === true;
      const safeUpdated = {
        ...updated,
        isCompleted: isPassed,
      };

      setCurrentLesson(safeUpdated);
      setLessons(lessons.map((l) => (l.id === safeUpdated.id ? safeUpdated : l)));
      if (isPassed && updated.isCompleted) {
        setIsCompletedModalOpen(true);
        await refreshUser();
      }
    } catch (err) {
      console.error('Failed to toggle module:', err);
    }
  };

  const handleMarkComplete = async () => {
    if (!currentLesson) return;
    const latestAttempt = assessmentService.getLatestAttempt(currentLesson.id, currentUserId);
    if (!latestAttempt || !latestAttempt.passed) {
      const el = document.getElementById('lesson-assessment-section');
      el?.scrollIntoView({ behavior: 'smooth' });
      setAssessmentNotice('Assessment Required: Complete and submit the 15-question lesson assessment below with 70%+ score to finish this lesson.');
      setTimeout(() => setAssessmentNotice(null), 6000);
      return;
    }
    try {
      const updated = await apiService.markLessonComplete(currentLesson.id);
      setCurrentLesson(updated);
      setLessons(lessons.map((l) => (l.id === updated.id ? updated : l)));
      setIsCompletedModalOpen(true);
      await refreshUser();
    } catch (err) {
      console.error('Failed to mark complete:', err);
    }
  };

  const handleSaveNotes = async () => {
    if (!currentLesson) return;
    setIsSavingNotes(true);
    try {
      const updated = await apiService.updateLessonNotes(currentLesson.id, notes);
      setCurrentLesson(updated);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLesson || !commentText.trim()) return;
    try {
      const updated = await apiService.addLessonComment(currentLesson.id, commentText);
      setCurrentLesson(updated);
      setCommentText('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!currentLesson) return;
    try {
      const updated = await apiService.toggleLikeComment(currentLesson.id, commentId);
      setCurrentLesson(updated);
    } catch (err) {
      console.error('Failed to like comment:', err);
    }
  };

  const handleAskMentor = () => {
    if (!currentLesson) return;
    const activeModule = currentLesson.modules?.find((m) => m.id === activeModuleId);
    const context: LessonContext = {
      lessonId: currentLesson.id,
      lessonTitle: currentLesson.title,
      moduleId: activeModule?.id,
      moduleTitle: activeModule?.title,
      progressPercent: currentLesson.progressPercent || 0,
      skillName: currentLesson.skill,
      category: currentLesson.category,
    };
    if (onOpenChat) {
      onOpenChat(undefined, context);
    } else {
      onNavigate('messages');
    }
  };

  const handleAskAiAboutLesson = () => {
    if (!currentLesson) return;
    const activeModule = currentLesson.modules?.find((m) => m.id === activeModuleId);
    const context: LessonContext = {
      lessonId: currentLesson.id,
      lessonTitle: currentLesson.title,
      moduleId: activeModule?.id,
      moduleTitle: activeModule?.title,
      progressPercent: currentLesson.progressPercent || 0,
      skillName: currentLesson.skill,
      category: currentLesson.category,
    };
    if (onAskAi) {
      onAskAi(context);
    }
  };

  const handleOpenAssessment = (moduleId: string) => {
    setAssessingModuleId(moduleId);
    setIsAssessmentOpen(true);
  };

  if (!currentLesson) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 text-center text-[#464555]">
        Loading lesson room...
      </div>
    );
  }

  const activeModule = currentLesson.modules.find((m) => m.id === activeModuleId) || currentLesson.modules[0];
  const completedCount = currentLesson.modules.filter((m) => m.completed).length;
  const progressPercent = currentLesson.progressPercent ?? Math.round((completedCount / currentLesson.modules.length) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fadeIn">
      {/* Top Banner & Switcher */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#eaedff] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#82f5c1] text-[#00714e] text-xs font-bold">
              {currentLesson.format}
            </span>
            <span className="px-3 py-1 rounded-full bg-[#eaedff] text-[#3525cd] text-xs font-bold">
              {currentLesson.category}
            </span>
            <span className="text-xs text-[#464555] font-semibold">
              Level: {currentLesson.skillLevel}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#131b2e] tracking-tight">
            {currentLesson.title}
          </h1>

          <p className="text-xs sm:text-sm text-[#464555] leading-relaxed">
            {currentLesson.description}
          </p>
        </div>

        {/* Lesson Switcher Dropdown & Ask Mentor / AI */}
        <div className="shrink-0 space-y-2">
          <div className="flex flex-col sm:flex-row md:flex-col gap-2">
            <button
              onClick={handleAskAiAboutLesson}
              className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#ffdcc3] to-[#82f5c1] text-[#131b2e] text-xs font-bold shadow-xs hover:opacity-95 transition-all flex items-center justify-center gap-2 border border-[#eaedff]"
            >
              <span className="material-symbols-outlined text-[18px] text-[#3525cd]">auto_awesome</span>
              <span>Ask AI about this Lesson</span>
            </button>

            <button
              onClick={handleAskMentor}
              className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#3525cd] to-[#4f46e5] text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">support_agent</span>
              <span>Ask Mentor with Context</span>
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#464555] uppercase tracking-wider mb-1">
              Select a Lesson
            </label>
            <select
              value={currentLesson.id}
              onChange={(e) => {
                const selected = lessons.find((l) => l.id === e.target.value);
                if (selected) handleSelectLesson(selected);
              }}
              className="w-full md:w-80 px-3 py-2 rounded-xl border border-[#c7c4d8] text-xs font-medium bg-white text-[#131b2e] outline-none shadow-xs truncate"
            >
              {lessons.map((l) => (
                <option key={l.id} value={l.id} title={`${l.title} — ${l.skill} — taught by ${l.teacherName || 'Peer'}`}>
                  {l.title} — {l.skill} — taught by {l.teacherName || 'Peer'}{l.skillLevel ? ` (${l.skillLevel})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Assessment Notice Banner */}
      {assessmentNotice && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-3 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-600 text-2xl">assignment_late</span>
            <p className="text-xs sm:text-sm font-semibold">{assessmentNotice}</p>
          </div>
          <button
            onClick={() => setAssessmentNotice(null)}
            className="p-1 rounded-lg text-amber-600 hover:bg-amber-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Main Grid: Left player / content, Right teacher & syllabus */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Player & Tabs (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Real Playable Lesson Video Player */}
          <LessonVideoPlayer
            videoUrl={activeModule?.videoUrl || currentLesson.videoUrl}
            lessonTitle={currentLesson.title}
            moduleTitle={activeModule?.title}
            lessonId={currentLesson.id}
            moduleId={activeModule?.id}
            isTopicCompleted={activeModule?.completed}
            onCompleteTopic={() => handleToggleModule(activeModule.id)}
            onVideoProgress={(progress) => {
              if (progress.isCompleted && !activeModule.completed) {
                handleToggleModule(activeModule.id);
              }
            }}
            onVideoEnded={() => {
              if (!activeModule.completed) {
                handleToggleModule(activeModule.id);
              }
            }}
          />

          {/* Active Topic Banner & Assessment Quick Jump */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-[#eaedff] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-3 h-3 rounded-full shrink-0 ${
                  activeModule.completed ? 'bg-[#006c4a]' : 'bg-amber-500 animate-pulse'
                }`}
              />
              <div>
                <span className="text-xs font-bold text-[#131b2e] block">
                  {activeModule.title}
                </span>
                <span className="text-[11px] text-[#464555]">
                  {activeModule.completed ? 'Topic video completed' : 'Watching lesson video'} • Duration: {activeModule.duration || '15 min'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleToggleModule(activeModule.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeModule.completed
                    ? 'bg-[#006c4a] text-white'
                    : 'bg-[#eaedff] text-[#3525cd] hover:bg-[#dae2fd]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {activeModule.completed ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                <span>{activeModule.completed ? 'Topic Watched ✓' : 'Mark Watched'}</span>
              </button>

              {activeModule.completed ? (
                <button
                  onClick={() => {
                    const el = document.getElementById('lesson-assessment-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#ffdcc3] to-[#ffb686] text-[#703a00] text-xs font-bold flex items-center gap-1.5 hover:opacity-95 transition-all shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">quiz</span>
                  <span>Take Assessment Below</span>
                </button>
              ) : (
                <span
                  className="text-[11px] text-[#464555] hidden sm:flex items-center gap-1"
                  title="Watch topic video to unlock assessment"
                >
                  <span className="material-symbols-outlined text-[14px]">lock</span>
                  <span>Assessment below unlocks after video</span>
                </span>
              )}
            </div>
          </div>

          {/* Interactive Navigation Tabs for Lesson */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#eaedff] space-y-6">
            <div className="flex items-center gap-2 border-b border-[#eaedff] pb-3 overflow-x-auto">
              <button
                onClick={() => setActiveTab('content')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'content'
                    ? 'bg-[#3525cd] text-white shadow-xs'
                    : 'text-[#464555] hover:bg-[#f2f3ff]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">overview</span>
                <span>Overview & Prerequisites</span>
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'notes'
                    ? 'bg-[#3525cd] text-white shadow-xs'
                    : 'text-[#464555] hover:bg-[#f2f3ff]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">edit_note</span>
                <span>Student Notes</span>
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'comments'
                    ? 'bg-[#3525cd] text-white shadow-xs'
                    : 'text-[#464555] hover:bg-[#f2f3ff]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">forum</span>
                <span>Q&A Discussion ({currentLesson.comments.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('resources')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'resources'
                    ? 'bg-[#3525cd] text-white shadow-xs'
                    : 'text-[#464555] hover:bg-[#f2f3ff]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">attachment</span>
                <span>Resources ({currentLesson.resources.length})</span>
              </button>
            </div>

            {/* TAB: CONTENT & PREREQUISITES */}
            {activeTab === 'content' && (
              <div className="space-y-4 text-xs sm:text-sm">
                <div>
                  <h4 className="font-bold text-[#131b2e] mb-1">Prerequisite Knowledge</h4>
                  <p className="text-[#464555] bg-[#f2f3ff] p-3 rounded-xl border border-[#eaedff]">
                    {currentLesson.prerequisites}
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-[#131b2e] mb-1">What You Will Master</h4>
                  <ul className="space-y-1.5 list-disc list-inside text-[#464555]">
                    {currentLesson.modules.map((m) => (
                      <li key={m.id}>
                        <strong className="text-[#131b2e]">{m.title}</strong>: {m.description}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* TAB: STUDENT NOTES */}
            {activeTab === 'notes' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#131b2e]">Your Personal Lesson Notes</span>
                  <span className="text-[11px] text-[#464555]">Saved locally to your campus profile</span>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Jot down formulas, code snippets, vocabulary, and questions for your peer mentor..."
                  rows={6}
                  className="w-full p-4 rounded-2xl border border-[#c7c4d8] text-xs sm:text-sm outline-none focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="px-4 py-2 rounded-xl bg-[#3525cd] text-white font-semibold text-xs shadow-xs hover:opacity-95 transition-all flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    <span>{isSavingNotes ? 'Saving...' : 'Save Notes'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB: COMMENTS & Q&A */}
            {activeTab === 'comments' && (
              <div className="space-y-5">
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask a question or share a tip with fellow students..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-[#c7c4d8] text-xs outline-none focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-[#3525cd] text-white text-xs font-semibold shadow-xs hover:opacity-95"
                  >
                    Post Question
                  </button>
                </form>

                <div className="space-y-3">
                  {currentLesson.comments.length === 0 ? (
                    <p className="text-xs text-[#464555] text-center py-4">
                      No questions yet. Be the first to start the discussion!
                    </p>
                  ) : (
                    currentLesson.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="p-4 rounded-2xl bg-[#f2f3ff] space-y-2 border border-[#eaedff]"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={comment.authorAvatar}
                              alt={comment.authorName}
                              className="w-7 h-7 rounded-full object-cover"
                            />
                            <div>
                              <span className="font-bold text-xs text-[#131b2e]">
                                {comment.authorName}
                              </span>
                              <span className="text-[10px] text-[#464555] ml-2">
                                {comment.authorProgram} • {comment.timestamp}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleLikeComment(comment.id)}
                            className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg transition-all ${
                              comment.isLiked
                                ? 'bg-[#3525cd] text-white'
                                : 'text-[#464555] hover:bg-[#eaedff]'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[14px]">thumb_up</span>
                            <span>{comment.likes}</span>
                          </button>
                        </div>
                        <p className="text-xs text-[#131b2e] leading-relaxed">{comment.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB: RESOURCES */}
            {activeTab === 'resources' && (
              <div className="space-y-3">
                {downloadNotice && (
                  <div className="p-3 rounded-xl bg-[#82f5c1]/30 border border-[#82f5c1] text-[#00714e] text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                    <span className="material-symbols-outlined text-[18px]">download_done</span>
                    <span>{downloadNotice}</span>
                  </div>
                )}
                {currentLesson.resources.map((res) => (
                  <div
                    key={res.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-[#f2f3ff] border border-[#eaedff]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-[#eaedff] text-[#3525cd]">
                        <span className="material-symbols-outlined text-[20px]">
                          {res.type === 'pdf'
                            ? 'picture_as_pdf'
                            : res.type === 'code'
                            ? 'code'
                            : 'file_present'}
                        </span>
                      </div>
                      <div>
                        <span className="font-bold text-xs text-[#131b2e] block">{res.name}</span>
                        <span className="text-[10px] text-[#464555]">{res.size}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setDownloadNotice(`Downloading peer resource: ${res.name}`);
                        setTimeout(() => setDownloadNotice(null), 3000);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white border border-[#c7c4d8] text-xs font-semibold text-[#131b2e] hover:bg-[#eaedff] flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">download</span>
                      <span>Download</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* INTEGRATED LESSON ASSESSMENT: DIRECTLY BELOW VIDEO & LESSON CONTENT */}
          <IntegratedLessonAssessment
            lessonId={currentLesson.id}
            lessonTitle={currentLesson.title}
            userId={currentUserId}
            isUnlocked={completedCount > 0 || (currentLesson.progressPercent || 0) >= 20}
            onLessonCompleted={() => {
              setIsCompletedModalOpen(true);
              loadLessons();
              refreshUser();
            }}
            isTeacherView={Boolean(currentUserId && currentLesson.teacherId === currentUserId)}
          />
        </div>

        {/* Right Column: Teacher Profile, Syllabus & Completion Card (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Progress Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#eaedff] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#464555]">
                Lesson Progress
              </span>
              <span className="text-xs font-bold text-[#006c4a]">{progressPercent}%</span>
            </div>

            <div className="w-full bg-[#dae2fd] h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#3525cd] to-[#006c4a] h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-xs text-[#464555]">
              <span>
                {completedCount} of {currentLesson.modules.length} modules completed
              </span>
              {currentLesson.isCompleted && (
                <span className="text-[#006c4a] font-bold">Verified ✓</span>
              )}
            </div>

            {/* Assessment requirement indicator */}
            {(() => {
              const latestAttempt = assessmentService.getLatestAttempt(currentLesson.id, currentUserId);
              const isPassed = latestAttempt?.passed === true;
              const isInProg = latestAttempt?.status === 'in_progress';
              return (
                <div className="flex items-center justify-between text-xs border-t border-[#eaedff] pt-2">
                  <span className="text-[#464555]">Assessment:</span>
                  <span
                    className={`font-bold ${
                      isPassed
                        ? 'text-[#006c4a]'
                        : isInProg
                        ? 'text-amber-600'
                        : 'text-amber-700'
                    }`}
                  >
                    {isPassed
                      ? `Passed (${latestAttempt.percentage}%) ✓`
                      : isInProg
                      ? 'Incomplete'
                      : 'Pending (15+ Qs)'}
                  </span>
                </div>
              );
            })()}

            <button
              onClick={handleMarkComplete}
              className={`w-full py-3 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 ${
                currentLesson.isCompleted || assessmentService.getLatestAttempt(currentLesson.id, currentUserId)?.passed
                  ? 'bg-[#82f5c1] text-[#00714e]'
                  : 'bg-[#3525cd] text-white hover:opacity-95'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {currentLesson.isCompleted || assessmentService.getLatestAttempt(currentLesson.id, currentUserId)?.passed
                  ? 'check_circle'
                  : 'assignment'}
              </span>
              <span>
                {currentLesson.isCompleted || assessmentService.getLatestAttempt(currentLesson.id, currentUserId)?.passed
                  ? 'Lesson Completed (+1 Credit Added)'
                  : 'Take Assessment to Complete'}
              </span>
            </button>
          </div>

          {/* Teacher Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#eaedff] space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#464555] block">
              Peer Mentor Info
            </span>

            <div className="flex items-center gap-3">
              <img
                src={currentLesson.teacherAvatar}
                alt={currentLesson.teacherName}
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white shadow"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-[#131b2e] truncate">
                  {currentLesson.teacherName}
                </h4>
                <p className="text-xs text-[#464555] truncate">{currentLesson.teacherUniversity}</p>
                <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold mt-0.5">
                  <span>★ {currentLesson.teacherRating}</span>
                  <span className="text-[#464555] text-[11px] font-normal">
                    ({currentLesson.teacherReviewCount} reviews)
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => onNavigate('connections')}
                className="flex-1 py-2 rounded-xl bg-[#eaedff] text-[#3525cd] text-xs font-semibold hover:bg-[#dae2fd] transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">chat</span>
                <span>Message Mentor</span>
              </button>
              <button
                onClick={() => onNavigate('my-profile-and-badges')}
                className="px-3 py-2 rounded-xl bg-[#f2f3ff] text-[#464555] hover:text-[#131b2e] text-xs font-semibold"
                title="View Mentor Profile"
              >
                <span className="material-symbols-outlined text-[16px]">badge</span>
              </button>
            </div>
          </div>

          {/* Interactive Syllabus Modules Outline */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#eaedff] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#464555]">
                Syllabus Outline
              </span>
              <span className="text-[11px] text-[#464555]">
                {currentLesson.modules.length} topics
              </span>
            </div>

            <div className="space-y-2">
              {currentLesson.modules.map((module, idx) => {
                const isActive = module.id === activeModuleId;
                return (
                  <div
                    key={module.id}
                    onClick={() => setActiveModuleId(module.id)}
                    className={`p-3 rounded-2xl cursor-pointer transition-all border flex items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-[#eaedff] border-[#3525cd] text-[#3525cd]'
                        : 'bg-[#f2f3ff] border-transparent text-[#131b2e] hover:bg-[#e2e7ff]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleModule(module.id);
                        }}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          module.completed
                            ? 'bg-[#006c4a] text-white'
                            : 'bg-white border border-[#c7c4d8] text-transparent hover:border-[#006c4a]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">check</span>
                      </button>
                      <div className="truncate">
                        <span className="font-semibold text-xs block truncate">
                          {idx + 1}. {module.title}
                        </span>
                        <span className="text-[10px] text-[#464555]">{module.duration}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {module.completed && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const el = document.getElementById('lesson-assessment-section');
                            el?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all bg-[#ffdcc3] text-[#703a00] hover:bg-[#ffb686]"
                          title="Take Lesson Assessment"
                        >
                          <span className="material-symbols-outlined text-[12px]">quiz</span>
                          <span>Assessment</span>
                        </button>
                      )}
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-[#3525cd] shrink-0"></span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Celebratory Completion Modal */}
      {isCompletedModalOpen && (
        <div className="fixed inset-0 bg-[#131b2e]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center space-y-4 shadow-2xl border border-[#eaedff]">
            <div className="w-16 h-16 rounded-full bg-[#82f5c1] text-[#00714e] flex items-center justify-center mx-auto shadow-md">
              <span className="material-symbols-outlined text-[36px]">workspace_premium</span>
            </div>
            <h3 className="font-bold text-xl text-[#131b2e]">Lesson Completed!</h3>
            <p className="text-xs text-[#464555] leading-relaxed">
              Congratulations! You finished{' '}
              <strong className="text-[#131b2e]">{currentLesson.title}</strong>. 1 Swap Credit has
              been added to your collegiate wallet, and your progress has been logged to your
              Learning Journey!
            </p>
            <div className="p-3 bg-[#f2f3ff] rounded-2xl text-xs font-semibold text-[#00714e] flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">bolt</span>
              <span>+1 Credit Added to Wallet</span>
            </div>
            <div className="pt-2 flex gap-3">
              <button
                onClick={() => {
                  setIsCompletedModalOpen(false);
                  onNavigate('my-profile-and-badges');
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#3525cd] text-white text-xs font-bold hover:opacity-95 shadow-xs"
              >
                View Updated Badges
              </button>
              <button
                onClick={() => setIsCompletedModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-[#eaedff] text-[#464555] text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
