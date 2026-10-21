import React, { useState, useEffect, useRef } from 'react';
import { Lesson, SkillLevel } from '../types';
import { apiService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { QuestionBankManager } from '../components/AssessmentManager/QuestionBankManager';
import { LessonAssessmentAnalyticsModal } from '../components/AssessmentManager/LessonAssessmentAnalyticsModal';
import { AssessmentPreviewModal } from '../components/AssessmentManager/AssessmentPreviewModal';

interface TeachingStudioPageProps {
  onNavigate: (route: string) => void;
  onSelectLesson: (lessonId: string) => void;
}

export const TeachingStudioPage: React.FC<TeachingStudioPageProps> = ({
  onNavigate,
  onSelectLesson,
}) => {
  const { currentUser, refreshUser } = useAuth();
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [myLessons, setMyLessons] = useState<Lesson[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  // Assessment & Analytics Modal States
  const [manageAssessmentLesson, setManageAssessmentLesson] = useState<{ id: string; title: string; skill: string; category: string } | null>(null);
  const [analyticsLessonId, setAnalyticsLessonId] = useState<string | null>(null);
  const [analyticsLessonTitle, setAnalyticsLessonTitle] = useState<string>('');
  const [previewLessonId, setPreviewLessonId] = useState<string | null>(null);
  const [previewLessonTitle, setPreviewLessonTitle] = useState<string>('');
  const [showInlineAssessmentManager, setShowInlineAssessmentManager] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [skill, setSkill] = useState('');
  const [category, setCategory] = useState('Computer Science');
  const [description, setDescription] = useState('');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('Intermediate');
  const [format, setFormat] = useState<'Interactive Workshop' | '1:1 Tutoring' | 'Code Walkthrough' | 'Practice Lab'>('Interactive Workshop');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [creditsRequired, setCreditsRequired] = useState(2);
  const [prerequisites, setPrerequisites] = useState('');

  // Video State
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFileName, setVideoFileName] = useState('');
  const [videoDuration, setVideoDuration] = useState('');
  const [videoFileSize, setVideoFileSize] = useState<number>(0);
  const [videoStorageKey, setVideoStorageKey] = useState('');
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [videoUploadSuccess, setVideoUploadSuccess] = useState(false);
  const [videoUploadError, setVideoUploadError] = useState<string | null>(null);

  // Preview player internal states
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [previewDuration, setPreviewDuration] = useState(0);
  const [previewVolume, setPreviewVolume] = useState(0.85);
  const [previewMuted, setPreviewMuted] = useState(false);
  const [previewSpeed, setPreviewSpeed] = useState(1);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  // Quick Replace Video Modal for dashboard cards
  const [replaceTargetLesson, setReplaceTargetLesson] = useState<Lesson | null>(null);
  const [isReplacingInModal, setIsReplacingInModal] = useState(false);
  const [replaceProgress, setReplaceProgress] = useState(0);
  const [replaceError, setReplaceError] = useState<string | null>(null);

  // Quick Video Preview Modal for dashboard cards
  const [previewModalLesson, setPreviewModalLesson] = useState<Lesson | null>(null);

  // Syllabus outline modules builder
  const [modules, setModules] = useState<Array<{ id: string; title: string; duration: string; completed: boolean; description: string }>>([
    {
      id: 'mod-1',
      title: 'Foundational Principles & Setup',
      duration: '15 min',
      completed: false,
      description: 'Environment walkthrough and fundamental syntax/rules.',
    },
    {
      id: 'mod-2',
      title: 'Hands-on Practice & Problem Walkthrough',
      duration: '20 min',
      completed: false,
      description: 'Live interactive problem solving and step-by-step guidance.',
    },
    {
      id: 'mod-3',
      title: 'Wrap-up, Code Review & Q&A',
      duration: '10 min',
      completed: false,
      description: 'Peer feedback, next practice drills, and verification.',
    },
  ]);

  // File upload simulation state
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ id: string; name: string; size: string; type: 'pdf' | 'code' | 'slides' | 'link' }>>([
    { id: 'f-1', name: 'Course_Syllabus.pdf', size: '1.1 MB', type: 'pdf' },
  ]);
  const [isUploading, setIsUploading] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [saveDraftNotice, setSaveDraftNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadLessonsData();
  }, [currentUser]);

  const loadLessonsData = async () => {
    try {
      const all = await apiService.getLessons();
      setAllLessons(all);
      const mine = currentUser?.id
        ? all.filter((l) => l.teacherId === currentUser.id || (currentUser.name && l.teacherName === currentUser.name))
        : [];
      setMyLessons(mine);
    } catch (err) {
      console.error('Failed to load lessons in Teaching Studio:', err);
    }
  };

  const handleAddModule = () => {
    const newMod = {
      id: `mod-${Date.now()}`,
      title: 'New Session Topic',
      duration: '15 min',
      completed: false,
      description: 'Details and exercises for this segment.',
    };
    setModules([...modules, newMod]);
  };

  const handleUpdateModule = (id: string, field: 'title' | 'duration' | 'description', value: string) => {
    setModules(modules.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const handleRemoveModule = (id: string) => {
    setModules(modules.filter((m) => m.id !== id));
  };

  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setTimeout(() => {
      const file = files[0];
      const newFile = {
        id: `f-${Date.now()}`,
        name: file.name,
        size: `${Math.round(file.size / 1024)} KB`,
        type: (file.name.endsWith('.pdf') ? 'pdf' : file.name.endsWith('.py') || file.name.endsWith('.ts') ? 'code' : 'slides') as any,
      };
      setUploadedFiles((prev) => [...prev, newFile]);
      setIsUploading(false);
    }, 800);
  };

  // Video File Selection & Real Upload Handler
  const handleVideoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    // 1. Validation: File Type
    const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    const validExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isVideo = validTypes.includes(file.type) || validExtensions.includes(extension);

    if (!isVideo) {
      setVideoUploadError('Invalid format. Please select an authentic video file (MP4, WebM, or MOV).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 2. Validation: File Size (Large video support up to 2GB)
    const MAX_SIZE = 2 * 1024 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setVideoUploadError('File size exceeds the 2GB maximum limit. Please select a compressed video.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setVideoUploadError(null);
    setIsVideoUploading(true);
    setVideoUploadProgress(0);
    setVideoUploadSuccess(false);

    try {
      const result = await apiService.uploadLessonVideo(
        file,
        editingLessonId || undefined,
        (percent) => {
          setVideoUploadProgress(percent);
        }
      );

      setVideoUrl(result.videoUrl);
      setVideoFileName(result.fileName);
      setVideoDuration(result.duration || '00:00');
      setVideoFileSize(result.fileSize);
      setVideoStorageKey(result.storageKey);
      setVideoUploadSuccess(true);
      await loadLessonsData();
    } catch (err: any) {
      console.error('Video upload failed:', err);
      setVideoUploadError(err.message || 'Failed to upload video. Please try again.');
    } finally {
      setIsVideoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Replace Video Handler
  const handleTriggerReplaceVideo = () => {
    fileInputRef.current?.click();
  };

  // Remove Video Handler
  const handleRemoveVideo = async () => {
    try {
      if (editingLessonId && videoStorageKey) {
        await apiService.deleteLessonVideo(editingLessonId, videoStorageKey);
      }
      setVideoUrl('');
      setVideoFileName('');
      setVideoDuration('');
      setVideoFileSize(0);
      setVideoStorageKey('');
      setVideoUploadSuccess(false);
      setVideoUploadError(null);
      if (previewVideoRef.current) {
        previewVideoRef.current.pause();
      }
    } catch (err: any) {
      console.warn('Could not delete video from server:', err);
    }
  };

  // Dashboard Card: Replace Video Modal Submission
  const handleModalVideoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!replaceTargetLesson) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    // Validation
    const validExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isVideo = file.type.startsWith('video/') || validExtensions.includes(extension);

    if (!isVideo) {
      setReplaceError('Please select a valid video file (MP4, WebM, or MOV).');
      return;
    }

    if (file.size > 2 * 1024 * 1024 * 1024) {
      setReplaceError('File size exceeds the 2GB maximum limit.');
      return;
    }

    setReplaceError(null);
    setIsReplacingInModal(true);
    setReplaceProgress(0);

    try {
      const result = await apiService.uploadLessonVideo(file, replaceTargetLesson.id, (p) => {
        setReplaceProgress(p);
      });

      // Update the lesson with new video info while preserving all curriculum modules & details
      await apiService.updateLesson(replaceTargetLesson.id, {
        videoUrl: result.videoUrl,
        videoFileName: result.fileName,
        videoDuration: result.duration,
        videoFileSize: result.fileSize,
        videoStorageKey: result.storageKey,
      });

      await loadLessonsData();
      setTimeout(() => {
        setIsReplacingInModal(false);
        setReplaceTargetLesson(null);
      }, 700);
    } catch (err: any) {
      console.error('Modal replace failed:', err);
      setReplaceError(err.message || 'Video replacement failed.');
      setIsReplacingInModal(false);
    }
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLessonId(lesson.id);
    setTitle(lesson.title);
    setSkill(lesson.skill);
    setCategory(lesson.category);
    setDescription(lesson.description);
    setSkillLevel(lesson.skillLevel);
    setFormat(lesson.format);
    setDurationMinutes(lesson.durationMinutes);
    setCreditsRequired(lesson.creditsRequired);
    setPrerequisites(lesson.prerequisites || '');
    setModules(lesson.modules || []);
    setUploadedFiles(lesson.resources || []);
    setVideoUrl(lesson.videoUrl || '');
    setVideoFileName(lesson.videoFileName || (lesson.videoUrl ? 'Lesson Workshop Video' : ''));
    setVideoDuration(lesson.videoDuration || '');
    setVideoFileSize(lesson.videoFileSize || 0);
    setVideoStorageKey(lesson.videoStorageKey || '');
    setVideoUploadSuccess(!!lesson.videoUrl);
    setVideoUploadError(null);
    setIsCreating(true);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleDeleteLesson = async (lessonId: string) => {
    await apiService.deleteLesson(lessonId);
    await loadLessonsData();
  };

  const handleResetForm = () => {
    setEditingLessonId(null);
    setTitle('');
    setSkill('');
    setCategory('Computer Science');
    setDescription('');
    setSkillLevel('Intermediate');
    setFormat('Interactive Workshop');
    setDurationMinutes(45);
    setCreditsRequired(2);
    setPrerequisites('');
    setVideoUrl('');
    setVideoFileName('');
    setVideoDuration('');
    setVideoFileSize(0);
    setVideoStorageKey('');
    setVideoUploadSuccess(false);
    setVideoUploadError(null);
    setIsCreating(false);
  };

  const handleSaveDraft = async () => {
    if (!title.trim() || !skill.trim()) {
      alert('Please provide at least a Lesson Title and Skill to save a draft.');
      return;
    }
    try {
      const payload: Partial<Lesson> = {
        title: `${title} (Draft)`,
        skill,
        category,
        description,
        skillLevel,
        format,
        durationMinutes,
        creditsRequired,
        prerequisites: prerequisites || 'None',
        modules,
        resources: uploadedFiles,
        videoUrl,
        videoFileName,
        videoDuration,
        videoFileSize,
        videoStorageKey,
        isPublished: false,
      };

      if (editingLessonId) {
        await apiService.updateLesson(editingLessonId, payload);
      } else {
        await apiService.createLesson(payload);
      }

      setSaveDraftNotice('Draft saved successfully! You can resume editing anytime.');
      await loadLessonsData();
      setTimeout(() => setSaveDraftNotice(null), 4000);
    } catch (err) {
      console.error('Failed to save draft:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !skill.trim()) return;

    try {
      let resultLessonId = '';

      const payload: Partial<Lesson> = {
        title,
        skill,
        category,
        description,
        skillLevel,
        format,
        durationMinutes,
        creditsRequired,
        prerequisites: prerequisites || 'None',
        modules,
        resources: uploadedFiles,
        videoUrl,
        videoFileName,
        videoDuration,
        videoFileSize,
        videoStorageKey,
        isPublished: true,
      };

      if (editingLessonId) {
        const updated = await apiService.updateLesson(editingLessonId, payload);
        resultLessonId = updated ? updated.id : editingLessonId;
      } else {
        const created = await apiService.createLesson(payload);
        resultLessonId = created.id;
      }

      setPublishSuccess(true);
      await refreshUser();
      await loadLessonsData();

      setTimeout(() => {
        setPublishSuccess(false);
        handleResetForm();
        onSelectLesson(resultLessonId);
        onNavigate('lesson-room');
      }, 1200);
    } catch (err) {
      console.error('Failed to save lesson:', err);
    }
  };

  // Helper formatting for file size
  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Helper formatting for time
  const formatSeconds = (sec: number): string => {
    if (isNaN(sec) || sec < 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fadeIn">
      {/* Studio Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#eaedff] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#82f5c1] text-[#00714e] text-xs font-semibold">
            <span className="material-symbols-outlined text-[16px]">school</span>
            <span>Quad Teaching & Mentorship Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#131b2e] tracking-tight">
            Share What You Know
          </h1>
          <p className="text-xs sm:text-sm text-[#464555] max-w-xl leading-relaxed">
            Create peer workshops, upload authentic video recordings, earn campus Swap Credits, and build
            verified teaching endorsements from fellow university students.
          </p>
        </div>

        <button
          onClick={() => {
            if (isCreating) {
              handleResetForm();
            } else {
              setIsCreating(true);
            }
          }}
          className="px-5 py-2.5 rounded-xl bg-[#3525cd] text-white text-xs font-semibold shadow-xs hover:opacity-95 transition-all flex items-center gap-2 shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">
            {isCreating ? 'close' : 'add'}
          </span>
          <span>{isCreating ? 'Cancel Creation' : '+ Create Lesson'}</span>
        </button>
      </div>

      {/* Save Draft Notification Banner */}
      {saveDraftNotice && (
        <div className="p-4 rounded-2xl bg-[#eaedff] border border-[#c5bfff] text-[#3525cd] text-xs font-bold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">save</span>
            <span>{saveDraftNotice}</span>
          </div>
          <button onClick={() => setSaveDraftNotice(null)} className="p-1">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* CREATE LESSON FORM */}
      {isCreating && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#eaedff] space-y-6"
        >
          <div className="flex items-center justify-between border-b border-[#eaedff] pb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#3525cd] text-2xl">
                {editingLessonId ? 'edit_note' : 'add_circle'}
              </span>
              <h2 className="font-extrabold text-xl text-[#131b2e]">
                {editingLessonId ? 'Edit Lesson Workshop' : 'Create Lesson'}
              </h2>
            </div>
            <span className="text-xs text-[#464555] font-medium">
              * Required fields to publish on campus
            </span>
          </div>

          {/* Title & Skill */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#131b2e] mb-1">
                Lesson Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Graph Traversals: BFS, DFS & Dijkstra"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#c7c4d8] text-xs sm:text-sm outline-none focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#131b2e] mb-1">
                Skill / Topic *
              </label>
              <input
                type="text"
                placeholder="e.g. Python, SQL, React, Spanish, Acoustic Guitar"
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#c7c4d8] text-xs sm:text-sm outline-none focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#131b2e] mb-1">
              Description & Learning Objectives *
            </label>
            <textarea
              rows={3}
              placeholder="What will peers understand, build, or practice during this session?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full p-3.5 rounded-xl border border-[#c7c4d8] text-xs sm:text-sm outline-none focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20"
            />
          </div>

          {/* Category, Level, Format, Credits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#131b2e] mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#c7c4d8] text-xs bg-white text-[#131b2e] outline-none focus:border-[#3525cd]"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Software Engineering">Software Engineering</option>
                <option value="Mathematics & Science">Mathematics & Science</option>
                <option value="Languages">Languages</option>
                <option value="Music & Arts">Music & Arts</option>
                <option value="Design & UX">Design & UX</option>
                <option value="Business & Writing">Business & Writing</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#131b2e] mb-1">
                Level
              </label>
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
                className="w-full px-3 py-2 rounded-xl border border-[#c7c4d8] text-xs bg-white text-[#131b2e] outline-none focus:border-[#3525cd]"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Mastery">Mastery</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#131b2e] mb-1">
                Session Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-[#c7c4d8] text-xs bg-white text-[#131b2e] outline-none focus:border-[#3525cd]"
              >
                <option value="Interactive Workshop">Interactive Workshop</option>
                <option value="1:1 Tutoring">1:1 Tutoring</option>
                <option value="Code Walkthrough">Code Walkthrough</option>
                <option value="Practice Lab">Practice Lab</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#131b2e] mb-1">
                Credits Required
              </label>
              <select
                value={creditsRequired}
                onChange={(e) => setCreditsRequired(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl border border-[#c7c4d8] text-xs bg-white text-[#131b2e] outline-none focus:border-[#3525cd]"
              >
                <option value={1}>1 Credit</option>
                <option value={2}>2 Credits</option>
                <option value={3}>3 Credits</option>
                <option value={4}>4 Credits</option>
              </select>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 🎥 LESSON VIDEO UPLOAD & REAL HTML5 PREVIEW                   */}
          {/* ============================================================== */}
          <div className="space-y-4 pt-4 border-t border-[#eaedff]">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[22px] text-[#3525cd]">
                    videocam
                  </span>
                  <h3 className="font-bold text-base text-[#131b2e]">🎥 LESSON VIDEO</h3>
                </div>
                <p className="text-xs text-[#464555] mt-0.5">
                  Upload an authentic video recording for your lesson. Learners in the Lesson Room will watch
                  this exact video through the full-featured HTML5 player.
                </p>
              </div>

              {videoUrl && (
                <span className="px-2.5 py-1 rounded-full bg-[#82f5c1] text-[#00714e] text-xs font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">check_circle</span>
                  <span>Video Ready</span>
                </span>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.mov"
              onChange={handleVideoFileSelect}
              className="hidden"
            />

            {/* ERROR NOTICE */}
            {videoUploadError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-[#ba1a1a] text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span>{videoUploadError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setVideoUploadError(null)}
                  className="p-1 hover:bg-red-100 rounded-lg"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            )}

            {/* Uploading Progress State */}
            {isVideoUploading && (
              <div className="p-6 rounded-2xl bg-[#eaedff] border border-[#c5bfff] space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between text-xs font-bold text-[#3525cd]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-[18px]">
                      progress_activity
                    </span>
                    <span>Uploading lesson video...</span>
                  </div>
                  <span>{videoUploadProgress}%</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3 bg-[#dae2fd] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#3525cd] to-[#006c4a] rounded-full transition-all duration-200"
                    style={{ width: `${videoUploadProgress}%` }}
                  ></div>
                </div>

                <p className="text-[11px] text-[#464555]">
                  Validating video streams, probing codec duration, and storing securely in lesson storage...
                </p>
              </div>
            )}

            {/* Video Upload Box (shown if no video yet, or replaced) */}
            {!videoUrl && !isVideoUploading && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#c7c4d8] rounded-2xl p-8 text-center hover:border-[#3525cd] hover:bg-[#faf8ff] transition-all cursor-pointer group flex flex-col items-center justify-center space-y-3 min-h-[180px]"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#eaedff] text-[#3525cd] group-hover:scale-105 transition-transform flex items-center justify-center">
                  <span className="material-symbols-outlined text-[32px]">upload_file</span>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-bold text-[#131b2e]">Upload your lesson video</p>
                  <p className="text-xs text-[#464555]">
                    Drag and drop your video file here, or click to browse
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2 rounded-xl bg-[#3525cd] text-white text-xs font-semibold shadow-xs group-hover:opacity-95 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">folder_open</span>
                  <span>[ 📁 Upload Video ]</span>
                </button>

                <div className="flex items-center gap-3 text-[11px] text-[#464555] pt-1">
                  <span className="px-2 py-0.5 rounded-md bg-[#f2f3ff] font-medium">MP4</span>
                  <span className="px-2 py-0.5 rounded-md bg-[#f2f3ff] font-medium">WebM</span>
                  <span className="px-2 py-0.5 rounded-md bg-[#f2f3ff] font-medium">MOV</span>
                  <span>• Large files supported (up to 2GB)</span>
                </div>
              </div>
            )}

            {/* REAL VIDEO PREVIEW (shown once uploaded) */}
            {videoUrl && !isVideoUploading && (
              <div className="p-5 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#006c4a] text-[20px]">
                      check_circle
                    </span>
                    <span className="text-xs font-bold text-[#006c4a]">
                      ✓ Video uploaded successfully
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[#464555]">
                    {videoDuration && (
                      <span className="font-semibold px-2.5 py-1 bg-white rounded-lg border border-[#eaedff]">
                        ⏱ Duration: {videoDuration}
                      </span>
                    )}
                    {videoFileSize > 0 && (
                      <span className="px-2.5 py-1 bg-white rounded-lg border border-[#eaedff]">
                        📦 {formatBytes(videoFileSize)}
                      </span>
                    )}
                  </div>
                </div>

                {/* PLAYABLE HTML5 PREVIEW PLAYER */}
                <div className="rounded-2xl overflow-hidden bg-black border border-[#131b2e] shadow-lg relative group">
                  <video
                    ref={previewVideoRef}
                    src={videoUrl}
                    onTimeUpdate={() => {
                      if (previewVideoRef.current) {
                        setPreviewTime(previewVideoRef.current.currentTime);
                      }
                    }}
                    onLoadedMetadata={() => {
                      if (previewVideoRef.current) {
                        setPreviewDuration(previewVideoRef.current.duration);
                        if (!videoDuration && previewVideoRef.current.duration > 0) {
                          setVideoDuration(formatSeconds(previewVideoRef.current.duration));
                        }
                      }
                    }}
                    onPlay={() => setPreviewPlaying(true)}
                    onPause={() => setPreviewPlaying(false)}
                    className="w-full aspect-video max-h-[380px] object-contain mx-auto"
                  />

                  {/* Top Bar Preview Watermark */}
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 pointer-events-none">
                    <span className="material-symbols-outlined text-red-500 text-[16px]">
                      play_circle
                    </span>
                    <span>▶ Uploaded Video Preview</span>
                    <span className="text-slate-400 font-normal truncate max-w-[200px]">
                      • {videoFileName || 'workshop_video.mp4'}
                    </span>
                  </div>

                  {/* Playable Video Controls Overlay */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 space-y-2">
                    {/* Scrub Progress Bar */}
                    <div
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const pos = (e.clientX - rect.left) / rect.width;
                        if (previewVideoRef.current && previewDuration > 0) {
                          previewVideoRef.current.currentTime = pos * previewDuration;
                        }
                      }}
                      className="w-full h-1.5 bg-white/20 hover:h-2.5 transition-all rounded-full cursor-pointer relative"
                    >
                      <div
                        className="h-full bg-gradient-to-r from-[#3525cd] to-[#82f5c1] rounded-full relative"
                        style={{
                          width: `${previewDuration > 0 ? (previewTime / previewDuration) * 100 : 0}%`,
                        }}
                      >
                        <span className="absolute right-0 -top-1 w-3.5 h-3.5 rounded-full bg-white shadow-md"></span>
                      </div>
                    </div>

                    {/* Bottom controls row */}
                    <div className="flex items-center justify-between text-white text-xs pt-1">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (previewVideoRef.current) {
                              if (previewPlaying) {
                                previewVideoRef.current.pause();
                              } else {
                                previewVideoRef.current.play();
                              }
                            }
                          }}
                          className="p-1 hover:text-[#82f5c1] transition-colors flex items-center"
                        >
                          <span className="material-symbols-outlined text-[24px]">
                            {previewPlaying ? 'pause' : 'play_arrow'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (previewVideoRef.current) {
                              previewVideoRef.current.muted = !previewMuted;
                              setPreviewMuted(!previewMuted);
                            }
                          }}
                          className="p-1 hover:text-[#82f5c1] transition-colors"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {previewMuted ? 'volume_off' : 'volume_up'}
                          </span>
                        </button>

                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={previewMuted ? 0 : previewVolume}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setPreviewVolume(val);
                            setPreviewMuted(false);
                            if (previewVideoRef.current) {
                              previewVideoRef.current.volume = val;
                              previewVideoRef.current.muted = false;
                            }
                          }}
                          className="w-16 accent-[#3525cd] cursor-pointer"
                        />

                        <span className="text-slate-300 font-mono text-[11px]">
                          {formatSeconds(previewTime)} / {formatSeconds(previewDuration || 0)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Playback Speed selector */}
                        <select
                          value={previewSpeed}
                          onChange={(e) => {
                            const spd = parseFloat(e.target.value);
                            setPreviewSpeed(spd);
                            if (previewVideoRef.current) {
                              previewVideoRef.current.playbackRate = spd;
                            }
                          }}
                          className="bg-white/10 text-white text-[11px] rounded-lg px-2 py-0.5 outline-none border border-white/20"
                        >
                          <option value="0.75" className="text-black">0.75x</option>
                          <option value="1" className="text-black">1.0x</option>
                          <option value="1.25" className="text-black">1.25x</option>
                          <option value="1.5" className="text-black">1.5x</option>
                          <option value="2" className="text-black">2.0x</option>
                        </select>

                        {/* Fullscreen toggle */}
                        <button
                          type="button"
                          onClick={() => {
                            if (previewVideoRef.current) {
                              if (previewVideoRef.current.requestFullscreen) {
                                previewVideoRef.current.requestFullscreen();
                              }
                            }
                          }}
                          className="p-1 hover:text-[#82f5c1] transition-colors"
                          title="Fullscreen"
                        >
                          <span className="material-symbols-outlined text-[20px]">fullscreen</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Video Actions: Replace & Delete */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2 text-xs text-[#464555]">
                    <span className="material-symbols-outlined text-[16px] text-[#3525cd]">
                      verified
                    </span>
                    <span>
                      Original file: <strong className="text-[#131b2e]">{videoFileName || 'lesson_video.mp4'}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTriggerReplaceVideo}
                      className="px-3.5 py-1.5 rounded-xl bg-white border border-[#c7c4d8] text-xs font-semibold text-[#131b2e] hover:bg-[#eaedff] hover:text-[#3525cd] transition-all flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">change_circle</span>
                      <span>[ Replace Video ]</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRemoveVideo}
                      className="px-3 py-1.5 rounded-xl bg-white border border-red-200 text-xs font-semibold text-[#ba1a1a] hover:bg-red-50 transition-all flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      <span>[ Remove Video ]</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Curriculum Syllabus Modules Builder */}
          <div className="space-y-4 pt-4 border-t border-[#eaedff]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#131b2e]">Syllabus Modules Breakdown</h3>
                <p className="text-xs text-[#464555]">
                  Break your session into structured milestones.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddModule}
                className="px-3 py-1.5 rounded-xl bg-[#eaedff] text-[#3525cd] text-xs font-semibold hover:bg-[#dae2fd]"
              >
                + Add Module
              </button>
            </div>

            <div className="space-y-3">
              {modules.map((m, idx) => (
                <div
                  key={m.id}
                  className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-xs text-[#3525cd]">Module {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveModule(m.id)}
                      className="text-[#ba1a1a] hover:bg-[#ffdad6] p-1 rounded-lg"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <input
                      type="text"
                      placeholder="Module Title"
                      value={m.title}
                      onChange={(e) => handleUpdateModule(m.id, 'title', e.target.value)}
                      className="sm:col-span-3 px-3 py-1.5 rounded-lg border border-[#c7c4d8] text-xs outline-none bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Duration (e.g. 15 min)"
                      value={m.duration}
                      onChange={(e) => handleUpdateModule(m.id, 'duration', e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-[#c7c4d8] text-xs outline-none bg-white"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Brief description of what will be covered..."
                    value={m.description}
                    onChange={(e) => handleUpdateModule(m.id, 'description', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#c7c4d8] text-xs outline-none bg-white"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* File/Media Upload Interface */}
          <div className="space-y-4 pt-4 border-t border-[#eaedff]">
            <div>
              <h3 className="font-bold text-sm text-[#131b2e]">Upload Lesson Materials & Code</h3>
              <p className="text-xs text-[#464555]">
                Attach starter files, slides, PDF guides, or problem sets for students.
              </p>
            </div>

            <div className="border-2 border-dashed border-[#c7c4d8] rounded-2xl p-6 text-center hover:bg-[#faf8ff] transition-colors relative">
              <input
                type="file"
                onChange={handleSimulateUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="space-y-2 pointer-events-none">
                <span className="material-symbols-outlined text-[36px] text-[#3525cd]">
                  cloud_upload
                </span>
                <p className="text-xs font-semibold text-[#131b2e]">
                  {isUploading ? 'Uploading file...' : 'Drop files here or click to browse'}
                </p>
                <p className="text-[11px] text-[#464555]">
                  Supports PDF, slides (.key/.pptx), code files (.py, .ts, .java), max 25MB
                </p>
              </div>
            </div>

            {/* Uploaded Files List */}
            <div className="space-y-2">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#f2f3ff] border border-[#eaedff]"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span className="material-symbols-outlined text-[18px] text-[#3525cd]">
                      attachment
                    </span>
                    <span className="font-semibold text-[#131b2e]">{file.name}</span>
                    <span className="text-[#464555]">({file.size})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setUploadedFiles(uploadedFiles.filter((f) => f.id !== file.id))
                    }
                    className="text-[#ba1a1a] hover:bg-[#ffdad6] p-1 rounded-lg"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Assessment & Question Bank Management Section */}
          <div className="space-y-4 pt-4 border-t border-[#eaedff]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#f2f3ff] p-4 rounded-2xl border border-[#eaedff]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#eaedff] text-[#3525cd] flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[24px]">quiz</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#131b2e]">
                    Lesson Assessment & Question Bank
                  </h3>
                  <p className="text-xs text-[#464555]">
                    Configure randomized 15+ question checkpoints, generate questions with AI, and set passing criteria.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowInlineAssessmentManager(!showInlineAssessmentManager)}
                  className="px-3.5 py-2 rounded-xl bg-[#3525cd] text-white text-xs font-bold hover:opacity-95 transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {showInlineAssessmentManager ? 'expand_less' : 'tune'}
                  </span>
                  <span>{showInlineAssessmentManager ? 'Hide Question Bank' : 'Manage Question Bank'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPreviewLessonId(editingLessonId || 'lesson-1');
                    setPreviewLessonTitle(title || 'Lesson Assessment');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white border border-[#c7c4d8] text-xs font-bold text-[#131b2e] hover:bg-[#eaedff] hover:text-[#3525cd] transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  <span>Preview Assessment</span>
                </button>
              </div>
            </div>

            {/* Inline Question Bank & Assessment Manager */}
            {showInlineAssessmentManager && (
              <div className="pt-2 animate-fadeIn">
                <QuestionBankManager
                  lessonId={editingLessonId || 'lesson-1'}
                  lessonTitle={title || 'New Workshop Lesson'}
                  lessonSkill={skill || 'Computer Science'}
                  lessonCategory={category || 'Computer Science'}
                  onClose={() => setShowInlineAssessmentManager(false)}
                  onPreviewAssessment={() => {
                    setPreviewLessonId(editingLessonId || 'lesson-1');
                    setPreviewLessonTitle(title || 'Lesson Assessment');
                  }}
                />
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-[#eaedff] flex flex-col sm:flex-row items-center justify-between gap-4">
            {publishSuccess ? (
              <div className="flex items-center gap-2 text-xs font-bold text-[#006c4a]">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>Workshop published! Opening exact uploaded video in Lesson Room...</span>
              </div>
            ) : (
              <span className="text-xs text-[#464555]">
                {videoUrl ? '✓ Video attached and ready for learners' : 'Note: You can attach or replace video anytime'}
              </span>
            )}

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#eaedff] text-[#3525cd] font-semibold text-xs hover:bg-[#dae2fd] transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">bookmark_border</span>
                <span>[Save Draft]</span>
              </button>

              <button
                type="submit"
                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-[#3525cd] text-white font-semibold text-xs shadow-xs hover:opacity-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {editingLessonId ? 'save' : 'publish'}
                </span>
                <span>{editingLessonId ? 'Save Changes' : '[Publish Lesson]'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* List of Shared Campus & My Teaching Offerings */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#131b2e] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#3525cd]">video_library</span>
              <span>{activeTab === 'all' ? 'All Public Teaching & Workshop Offerings' : 'My Active Teaching Offerings'}</span>
            </h2>
            <p className="text-xs text-[#464555] mt-0.5">
              {activeTab === 'all'
                ? 'All shared public workshops and videos uploaded by SkillSwap peer tutors across campus.'
                : 'Manage your workshop recordings, replace video content, or view student progress.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter Tabs: All Public vs My Offerings */}
            <div className="flex items-center bg-[#f2f3ff] p-1 rounded-xl border border-[#eaedff]">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'all'
                    ? 'bg-[#3525cd] text-white shadow-xs'
                    : 'text-[#464555] hover:text-[#131b2e]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">public</span>
                <span>All Public Videos ({allLessons.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('mine')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'mine'
                    ? 'bg-[#3525cd] text-white shadow-xs'
                    : 'text-[#464555] hover:text-[#131b2e]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">person</span>
                <span>My Videos ({myLessons.length})</span>
              </button>
            </div>

            <span className="text-xs text-[#464555] font-semibold whitespace-nowrap">
              {(activeTab === 'all' ? allLessons : myLessons).length}{' '}
              {(activeTab === 'all' ? allLessons : myLessons).length === 1 ? 'workshop listed' : 'workshops listed'}
            </span>
          </div>
        </div>

        {(activeTab === 'all' ? allLessons : myLessons).length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#eaedff] space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#f2f3ff] text-[#3525cd] flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[32px]">video_library</span>
            </div>
            <h3 className="text-base font-bold text-[#131b2e]">
              {activeTab === 'mine' ? 'No personal workshops listed yet' : 'No public workshops available'}
            </h3>
            <p className="text-xs text-[#464555] max-w-md mx-auto">
              {activeTab === 'mine'
                ? 'You have not uploaded any personal workshop recordings yet. Switch to "All Public Videos" to explore campus recordings, or click "Host Workshop" above.'
                : 'No public workshop recordings found in the campus catalog.'}
            </p>
            {activeTab === 'mine' && (
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className="px-5 py-2.5 rounded-xl bg-[#3525cd] text-white text-xs font-semibold hover:opacity-95 transition-all inline-flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">public</span>
                <span>View All Public Videos ({allLessons.length})</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(activeTab === 'all' ? allLessons : myLessons).map((lesson) => (
              <div
              key={lesson.id}
              className="bg-white rounded-3xl p-6 shadow-sm border border-[#eaedff] flex flex-col justify-between hover:shadow-md transition-all space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-[#82f5c1] text-[#00714e] text-[11px] font-bold">
                    {lesson.format}
                  </span>
                  <span className="text-xs font-bold text-[#3525cd]">
                    {lesson.creditsRequired} Credits
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-[#131b2e] leading-snug">{lesson.title}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[#464555]">
                    <span className="font-semibold text-[#3525cd]">{lesson.skill}</span>
                    <span>•</span>
                    <span>{lesson.skillLevel}</span>
                  </div>
                </div>

                {/* Creator / Uploader badge with link to creator's public profile */}
                <div className="flex items-center justify-between text-xs bg-[#f8f9ff] p-2.5 rounded-2xl border border-[#eaedff]">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={lesson.teacherAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={lesson.teacherName}
                      className="w-6 h-6 rounded-full object-cover shrink-0"
                    />
                    <div className="truncate text-xs">
                      <span className="text-[#464555]">Uploaded by: </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const targetPublicId = (lesson as any).teacherPublicProfileId || lesson.teacherId;
                          if (targetPublicId) {
                            onNavigate(`public-profile:${targetPublicId}`);
                          }
                        }}
                        className="text-[#3525cd] font-bold hover:underline focus:outline-none"
                        title={`View ${lesson.teacherName}'s Public Profile`}
                      >
                        {lesson.teacherName || 'Student Peer'}
                      </button>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-[#006c4a] bg-[#82f5c1]/30 px-2 py-0.5 rounded-full shrink-0">
                    {lesson.teacherUniversity || 'UC Berkeley'}
                  </span>
                </div>

                <p className="text-xs text-[#464555] line-clamp-2 leading-relaxed">
                  {lesson.description}
                </p>

                {/* 🎥 Video Status Indicator */}
                <div className="p-3 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-[#3525cd]">
                      videocam
                    </span>
                    <span className="font-semibold text-[#131b2e]">
                      {lesson.videoUrl ? '🎥 Video: Uploaded ✓' : '🎥 Video: Not uploaded'}
                    </span>
                  </div>

                  {lesson.videoDuration ? (
                    <span className="text-[11px] font-mono text-[#464555] bg-white px-2 py-0.5 rounded-md border border-[#eaedff]">
                      Duration: {lesson.videoDuration}
                    </span>
                  ) : lesson.videoUrl ? (
                    <span className="text-[11px] font-mono text-[#006c4a] bg-white px-2 py-0.5 rounded-md border border-[#eaedff]">
                      Ready
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-medium">
                      Missing
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-[#464555] pt-1">
                  <span>{lesson.durationMinutes} min session</span>
                  <span>{lesson.modules?.length || 0} modules</span>
                  <span className="text-[#006c4a] font-bold">
                    {lesson.enrolledStudentsCount || 0} enrolled
                  </span>
                </div>
              </div>

              {/* Action Buttons: Preview, Quick Watch, Replace Video, Edit, Delete */}
              <div className="pt-2 border-t border-[#f2f3ff] flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onSelectLesson(lesson.id);
                      onNavigate('lesson-room');
                    }}
                    className="flex-1 py-2 rounded-xl bg-[#3525cd] text-white text-xs font-semibold hover:opacity-95 transition-all flex items-center justify-center gap-1 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">play_circle</span>
                    <span>[Preview / Open Room]</span>
                  </button>

                  {lesson.videoUrl && (
                    <button
                      onClick={() => setPreviewModalLesson(lesson)}
                      className="px-3 py-2 rounded-xl bg-[#f2f3ff] text-[#3525cd] text-xs font-semibold hover:bg-[#eaedff] transition-all flex items-center gap-1"
                      title="Quick preview video modal"
                    >
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                      <span>Watch</span>
                    </button>
                  )}

                  {(currentUser?.id === lesson.teacherId || currentUser?.name === lesson.teacherName) && (
                    <button
                      onClick={() => {
                        setReplaceTargetLesson(lesson);
                        setReplaceError(null);
                      }}
                      className="px-3 py-2 rounded-xl bg-[#eaedff] text-[#3525cd] text-xs font-semibold hover:bg-[#dae2fd] transition-all flex items-center gap-1"
                      title="Replace lesson video file"
                    >
                      <span className="material-symbols-outlined text-[16px]">change_circle</span>
                      <span>Replace</span>
                    </button>
                  )}
                </div>

                {(currentUser?.id === lesson.teacherId || currentUser?.name === lesson.teacherName) && (
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEditLesson(lesson)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#464555] hover:text-[#3525cd] hover:bg-[#eaedff] transition-all flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      <span>[Edit Lesson]</span>
                    </button>

                    <button
                      onClick={() => handleDeleteLesson(lesson.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#ba1a1a] hover:bg-[#ffdad6] transition-all flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      <span>[Delete]</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* REPLACE VIDEO MODAL */}
      {replaceTargetLesson && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-[#eaedff] space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#eaedff] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3525cd] text-2xl">
                  change_circle
                </span>
                <h3 className="font-extrabold text-lg text-[#131b2e]">Replace Lesson Video</h3>
              </div>
              <button
                onClick={() => setReplaceTargetLesson(null)}
                className="p-1 rounded-lg text-[#464555] hover:bg-[#f2f3ff]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-[#464555]">Lesson:</p>
              <h4 className="font-bold text-sm text-[#131b2e]">{replaceTargetLesson.title}</h4>
              <p className="text-xs text-[#464555]">
                Replacing the video will update the video player in the Lesson Room immediately while preserving all
                curriculum modules, learner notes, and lesson details.
              </p>
            </div>

            <input
              ref={modalFileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.mov"
              onChange={handleModalVideoFileSelect}
              className="hidden"
            />

            {replaceError && (
              <div className="p-3 rounded-xl bg-red-50 text-[#ba1a1a] text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{replaceError}</span>
              </div>
            )}

            {isReplacingInModal ? (
              <div className="p-6 rounded-2xl bg-[#eaedff] border border-[#c5bfff] space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#3525cd]">
                  <span>Uploading replacement video...</span>
                  <span>{replaceProgress}%</span>
                </div>
                <div className="w-full h-3 bg-[#dae2fd] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#3525cd] to-[#006c4a] rounded-full transition-all duration-200"
                    style={{ width: `${replaceProgress}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-[#464555]">
                  Linking new video to lesson and updating the Lesson Room player...
                </p>
              </div>
            ) : (
              <div
                onClick={() => modalFileInputRef.current?.click()}
                className="border-2 border-dashed border-[#c7c4d8] rounded-2xl p-6 text-center hover:border-[#3525cd] hover:bg-[#faf8ff] transition-all cursor-pointer flex flex-col items-center justify-center space-y-2"
              >
                <span className="material-symbols-outlined text-[36px] text-[#3525cd]">
                  video_file
                </span>
                <p className="text-xs font-bold text-[#131b2e]">Select New Video File</p>
                <p className="text-[11px] text-[#464555]">MP4, WebM, or MOV up to 2GB</p>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-[#3525cd] text-white text-xs font-semibold"
                >
                  Choose File
                </button>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaedff]">
              <button
                type="button"
                onClick={() => setReplaceTargetLesson(null)}
                className="px-4 py-2 rounded-xl bg-[#f2f3ff] text-[#464555] text-xs font-semibold hover:bg-[#eaedff]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK VIDEO PREVIEW MODAL */}
      {previewModalLesson && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#eaedff] space-y-4 p-6 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#eaedff] pb-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-[#3525cd] text-2xl shrink-0">play_circle</span>
                <h3 className="font-extrabold text-lg text-[#131b2e] truncate">{previewModalLesson.title}</h3>
              </div>
              <button
                onClick={() => setPreviewModalLesson(null)}
                className="p-1 rounded-lg text-[#464555] hover:bg-[#f2f3ff]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-inner">
              <video
                src={previewModalLesson.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-[#464555] pt-1">
              <div className="flex items-center gap-2">
                <img
                  src={previewModalLesson.teacherAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={previewModalLesson.teacherName}
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span>Uploaded by <strong className="text-[#131b2e]">{previewModalLesson.teacherName}</strong></span>
              </div>
              <button
                onClick={() => {
                  const id = previewModalLesson.id;
                  setPreviewModalLesson(null);
                  onSelectLesson(id);
                  onNavigate('lesson-room');
                }}
                className="px-4 py-2 rounded-xl bg-[#3525cd] text-white text-xs font-semibold hover:opacity-95 transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                <span>Open in Lesson Room</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
