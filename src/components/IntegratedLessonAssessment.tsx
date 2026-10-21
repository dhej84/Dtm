import React, { useState, useEffect, useRef } from 'react';
import {
  Assessment,
  AssessmentAttempt,
  AssessmentIntegrityEvent,
  AssessmentQuestion,
  LessonAssessmentAnalytics,
} from '../types';
import { assessmentService } from '../services/assessmentService';

interface IntegratedLessonAssessmentProps {
  lessonId: string;
  lessonTitle: string;
  userId: string;
  isUnlocked: boolean; // True when student has watched/progressed in the lesson content
  onLessonCompleted?: () => void;
  isTeacherView?: boolean;
}

export const IntegratedLessonAssessment: React.FC<IntegratedLessonAssessmentProps> = ({
  lessonId,
  lessonTitle,
  userId,
  isUnlocked,
  onLessonCompleted,
  isTeacherView = false,
}) => {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [activeAttempt, setActiveAttempt] = useState<AssessmentAttempt | null>(null);
  const [currentQuestions, setCurrentQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string | string[]>>({});
  const [markedForReview, setMarkedForReview] = useState<string[]>([]);
  
  // View states: 'overview' | 'testing' | 'result' | 'review' | 'analytics' | 'history'
  const [viewState, setViewState] = useState<'overview' | 'testing' | 'result' | 'review' | 'analytics' | 'history'>('overview');
  
  // Timers
  const [questionSecondsRemaining, setQuestionSecondsRemaining] = useState<number>(90);
  const [overallSecondsRemaining, setOverallSecondsRemaining] = useState<number>(2700); // 45 min
  
  // Coding runner & language state
  const [codeOutputs, setCodeOutputs] = useState<Record<string, string>>({});
  const [selectedCodingLang, setSelectedCodingLang] = useState('python');
  const [isRunningCode, setIsRunningCode] = useState(false);
  
  // Pre-submit review modal state
  const [showPreSubmitModal, setShowPreSubmitModal] = useState(false);

  // Integrity tracking
  const [integrityEvents, setIntegrityEvents] = useState<AssessmentIntegrityEvent[]>([]);
  const [integrityNotice, setIntegrityNotice] = useState<string | null>(null);
  const [warningsCount, setWarningsCount] = useState(0);
  
  // Attempt history
  const [historyAttempts, setHistoryAttempts] = useState<AssessmentAttempt[]>([]);

  // Teacher analytics
  const [analytics, setAnalytics] = useState<LessonAssessmentAnalytics | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reviewQuestions, setReviewQuestions] = useState<AssessmentQuestion[]>([]);
  
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const overallTimerRef = useRef<NodeJS.Timeout | null>(null);
  const blurTimestampRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load lesson assessment, existing active attempt, and attempt history
  useEffect(() => {
    const assess = assessmentService.getLessonAssessment(lessonId);
    setAssessment(assess);
    setAnalytics(assessmentService.getTeacherAnalytics(lessonId));

    const history = assessmentService.getAttemptHistory(lessonId, userId);
    setHistoryAttempts(history);

    const existingActive = assessmentService.getActiveAttempt(lessonId, userId);
    if (existingActive) {
      // Re-hydrate in-progress attempt with sanitized questions
      setActiveAttempt(existingActive);
      setSelectedAnswers(existingActive.answers || {});
      setMarkedForReview(existingActive.markedForReview || []);
      const questions = existingActive.selectedQuestionIds
        .map((qid) => assess.questions.find((q) => q.id === qid))
        .filter((q): q is AssessmentQuestion => !!q)
        .map(({ correctAnswers, explanation, ...rest }) => ({
          ...rest,
          correctAnswers: [],
          explanation: '',
        }));
      setCurrentQuestions(questions);
      const qIndex = existingActive.currentQuestionIndex || 0;
      setCurrentQuestionIndex(qIndex);

      const warnCount = (existingActive.integrityEvents || []).filter(
        (e) => e.eventType === 'tab_switch' || e.eventType === 'focus_loss'
      ).length;
      setWarningsCount(warnCount);

      // Compute elapsed overall time so browser refresh CANNOT reset timer
      const elapsedOverall = Math.floor((Date.now() - new Date(existingActive.startTime).getTime()) / 1000);
      const totalAllowed = (assess.timeLimitMinutes || 45) * 60;
      const remainingOverall = Math.max(0, totalAllowed - elapsedOverall);
      setOverallSecondsRemaining(remainingOverall);

      // Compute elapsed question time so browser refresh CANNOT reset question timer
      const qStart = existingActive.currentQuestionStartedAt
        ? new Date(existingActive.currentQuestionStartedAt).getTime()
        : Date.now();
      const elapsedQ = Math.floor((Date.now() - qStart) / 1000);
      const currentQ = questions[qIndex];
      const qLimit = currentQ?.timeLimitSeconds || (currentQ?.type === 'coding' ? 900 : 90);
      setQuestionSecondsRemaining(Math.max(0, qLimit - elapsedQ));

      if (remainingOverall <= 0) {
        handleSubmitFinal();
        return;
      }
      setViewState('testing');
    } else {
      // Check if previous completed attempt exists
      const latest = assessmentService.getLatestAttempt(lessonId, userId);
      if (latest && latest.status === 'evaluated') {
        setActiveAttempt(latest);
        const questions = latest.selectedQuestionIds
          .map((qid) => assess.questions.find((q) => q.id === qid))
          .filter((q): q is AssessmentQuestion => !!q);
        setCurrentQuestions(questions.length > 0 ? questions : assess.questions.slice(0, 15));
        setViewState('result');
      } else {
        setViewState('overview');
      }
    }
  }, [lessonId, userId]);

  // Load review questions with correct answers only after submission
  useEffect(() => {
    if (viewState === 'review' && activeAttempt) {
      try {
        const rev = assessmentService.getReviewQuestions(activeAttempt.id, userId);
        setReviewQuestions(rev);
      } catch (err) {
        console.error('Failed to load review questions:', err);
      }
    }
  }, [viewState, activeAttempt?.id, userId]);

  // Overall and Question-level Timers during testing
  useEffect(() => {
    if (viewState !== 'testing' || !activeAttempt) return;

    // Question countdown timer
    questionTimerRef.current = setInterval(() => {
      setQuestionSecondsRemaining((prev) => {
        if (prev <= 1) {
          logIntegrityEvent('timer_expired', `Timer expired on Question ${currentQuestionIndex + 1}`);
          handleNextQuestion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Overall assessment countdown timer
    overallTimerRef.current = setInterval(() => {
      setOverallSecondsRemaining((prev) => {
        if (prev <= 1) {
          logIntegrityEvent('timer_expired', 'Overall assessment time limit expired');
          handleSubmitFinal();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
      if (overallTimerRef.current) clearInterval(overallTimerRef.current);
    };
  }, [viewState, currentQuestionIndex, currentQuestions.length]);

  // Setup transparent integrity listeners during active testing
  useEffect(() => {
    if (viewState !== 'testing' || !activeAttempt) return;

    // 1. Tab / Window Visibility Change
    const handleVisibility = () => {
      if (document.hidden) {
        blurTimestampRef.current = Date.now();
        logIntegrityEvent('tab_switch', 'Switched away from assessment tab or minimized browser window');
      } else {
        const duration = blurTimestampRef.current
          ? Math.round((Date.now() - blurTimestampRef.current) / 1000)
          : undefined;
        logIntegrityEvent('returned_focus', `Returned to assessment tab after ${duration || 0}s`, duration);
        blurTimestampRef.current = null;
      }
    };

    // 2. Window Blur / Focus Loss
    const handleBlur = () => {
      if (!blurTimestampRef.current) {
        blurTimestampRef.current = Date.now();
        logIntegrityEvent('focus_loss', 'Browser window lost focus');
      }
    };

    // 3. Fullscreen Exit
    const handleFullscreen = () => {
      if (!document.fullscreenElement) {
        logIntegrityEvent('fullscreen_exit', 'Exited fullscreen assessment mode');
      }
    };

    // 4. Beforeunload Navigation Warning
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      logIntegrityEvent('page_reload', 'Attempted page reload or external navigation during active assessment');
      e.returnValue = 'You have an active assessment in progress. Are you sure you want to leave?';
      return e.returnValue;
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreen);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreen);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [viewState, activeAttempt?.id]);

  const logIntegrityEvent = (type: any, desc: string, duration?: number) => {
    if (!activeAttempt) return;
    const evt = assessmentService.recordMonitoringEvent(activeAttempt.id, type, desc, duration);
    setIntegrityEvents((prev) => [...prev, evt]);
    if (type === 'tab_switch' || type === 'focus_loss') {
      setWarningsCount((prev) => prev + 1);
      setIntegrityNotice('Please remain on the assessment page while completing your test.');
    } else {
      setIntegrityNotice(desc);
    }
    setTimeout(() => setIntegrityNotice(null), 5000);
  };

  // Start new assessment test
  const handleStartTest = () => {
    try {
      const { attempt, questions } = assessmentService.startAssessment(lessonId, userId);
      setActiveAttempt(attempt);
      setCurrentQuestions(questions);
      setSelectedAnswers({});
      setMarkedForReview([]);
      setCurrentQuestionIndex(0);
      setWarningsCount(0);
      setViewState('testing');
      setOverallSecondsRemaining(45 * 60);

      // Smooth scroll to assessment card
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err: any) {
      setIntegrityNotice(err.message || 'Could not start assessment');
    }
  };

  // Answer selection
  const handleSelectOption = (questionId: string, option: string) => {
    if (!activeAttempt) return;
    const updated = { ...selectedAnswers, [questionId]: option };
    setSelectedAnswers(updated);
    assessmentService.saveAnswer(activeAttempt.id, questionId, option);
  };

  const handleToggleMultiSelect = (questionId: string, option: string) => {
    if (!activeAttempt) return;
    const current = (selectedAnswers[questionId] as string[]) || [];
    const exists = current.includes(option);
    const updated = exists ? current.filter((o) => o !== option) : [...current, option];
    const newAnswers = { ...selectedAnswers, [questionId]: updated };
    setSelectedAnswers(newAnswers);
    assessmentService.saveAnswer(activeAttempt.id, questionId, updated);
  };

  const handleTextAnswerChange = (questionId: string, value: string) => {
    if (!activeAttempt) return;
    const updated = { ...selectedAnswers, [questionId]: value };
    setSelectedAnswers(updated);
    assessmentService.saveAnswer(activeAttempt.id, questionId, value);
  };

  const handleToggleReview = () => {
    if (!activeAttempt) return;
    const currentQ = currentQuestions[currentQuestionIndex];
    if (!currentQ) return;
    const isMarked = assessmentService.toggleMarkForReview(activeAttempt.id, currentQ.id);
    setMarkedForReview((prev) =>
      isMarked ? [...prev, currentQ.id] : prev.filter((id) => id !== currentQ.id)
    );
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < currentQuestions.length - 1) {
      const nextIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIdx);
      if (activeAttempt) {
        assessmentService.updateQuestionIndex(activeAttempt.id, nextIdx, userId);
        const nextQ = currentQuestions[nextIdx];
        setQuestionSecondsRemaining(nextQ?.timeLimitSeconds || (nextQ?.type === 'coding' ? 900 : 90));
      }
    } else {
      // Last question reached - open pre-submit review dialog
      setShowPreSubmitModal(true);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevIdx = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIdx);
      if (activeAttempt) {
        assessmentService.updateQuestionIndex(activeAttempt.id, prevIdx, userId);
        const prevQ = currentQuestions[prevIdx];
        setQuestionSecondsRemaining(prevQ?.timeLimitSeconds || (prevQ?.type === 'coding' ? 900 : 90));
      }
    }
  };

  const handleJumpToQuestion = (index: number) => {
    if (index >= 0 && index < currentQuestions.length) {
      setCurrentQuestionIndex(index);
      if (activeAttempt) {
        assessmentService.updateQuestionIndex(activeAttempt.id, index, userId);
        const targetQ = currentQuestions[index];
        setQuestionSecondsRemaining(targetQ?.timeLimitSeconds || (targetQ?.type === 'coding' ? 900 : 90));
      }
      setShowPreSubmitModal(false);
    }
  };

  // Run code safely in sandbox abstraction for coding questions
  const handleRunCode = async (question: AssessmentQuestion) => {
    const code = (selectedAnswers[question.id] as string) || question.starterCode || '';
    if (!code.trim()) {
      setCodeOutputs((prev) => ({ ...prev, [question.id]: 'Please write code to test.' }));
      return;
    }
    setIsRunningCode(true);
    try {
      const res = await assessmentService.executeCodeSafe(selectedCodingLang, code, question.testCases);
      setCodeOutputs((prev) => ({
        ...prev,
        [question.id]: res.stdout,
      }));
    } finally {
      setIsRunningCode(false);
    }
  };

  // Submit test and evaluate authoritatively
  const handleSubmitFinal = async () => {
    if (!activeAttempt) return;
    setShowPreSubmitModal(false);

    if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    if (overallTimerRef.current) clearInterval(overallTimerRef.current);

    try {
      const evaluated = await assessmentService.submitAssessment(activeAttempt.id);
      setActiveAttempt(evaluated);
      setViewState('result');

      const history = assessmentService.getAttemptHistory(lessonId, userId);
      setHistoryAttempts(history);

      if (evaluated.passed && onLessonCompleted) {
        onLessonCompleted();
      }

      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      console.error('Error submitting assessment:', e);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQ = currentQuestions[currentQuestionIndex];
  const answeredCount = Object.keys(selectedAnswers).filter(
    (k) => selectedAnswers[k] && selectedAnswers[k].toString().trim().length > 0
  ).length;

  return (
    <div
      ref={containerRef}
      id="lesson-assessment-section"
      className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#eaedff] space-y-6 transition-all"
    >
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#eaedff] pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#eaedff] text-[#3525cd] flex items-center justify-center font-bold shadow-xs">
            <span className="material-symbols-outlined text-[28px]">quiz</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-[#131b2e] tracking-tight">
                Lesson Assessment
              </h2>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#82f5c1] text-[#00714e]">
                15+ Questions
              </span>
            </div>
            <p className="text-xs text-[#464555]">
              Complete this assessment to finish the lesson.
            </p>
          </div>
        </div>

        {/* View mode buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {(viewState === 'result' || viewState === 'review') && (
            <button
              onClick={() => setViewState((prev) => (prev === 'review' ? 'result' : 'review'))}
              className="px-3 py-1.5 rounded-xl border border-[#3525cd] text-[#3525cd] text-xs font-bold hover:bg-[#eaedff] transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              <span>{viewState === 'review' ? 'View Result Card' : 'Review Answers'}</span>
            </button>
          )}

          <button
            onClick={() => setViewState(viewState === 'analytics' ? 'overview' : 'analytics')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewState === 'analytics'
                ? 'bg-[#3525cd] text-white'
                : 'bg-[#f2f3ff] text-[#464555] hover:text-[#131b2e]'
            }`}
            title="Peer Mentor Analytics"
          >
            <span className="material-symbols-outlined text-[16px]">analytics</span>
            <span>Mentor Analytics</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. OVERVIEW STATE: Before starting                            */}
      {/* ------------------------------------------------------------- */}
      {viewState === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#464555] block">
                Number of Questions
              </span>
              <span className="text-xl font-extrabold text-[#131b2e]">15+ Questions</span>
              <span className="text-[11px] text-[#464555] block">
                Lesson-specific concepts, code interpretation & practical problem solving
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#464555] block">
                Assessment Status
              </span>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  activeAttempt?.passed
                    ? 'bg-[#006c4a]'
                    : activeAttempt
                    ? 'bg-amber-500'
                    : 'bg-[#3525cd]'
                }`}></span>
                <span className={`text-base font-bold ${
                  activeAttempt?.passed
                    ? 'text-[#006c4a]'
                    : activeAttempt
                    ? 'text-amber-600'
                    : 'text-[#3525cd]'
                }`}>
                  {activeAttempt?.passed ? 'Passed / Completed' : activeAttempt ? 'Attempt Incomplete' : 'Ready to Start'}
                </span>
              </div>
              <span className="text-[11px] text-[#464555] block">
                {activeAttempt?.passed ? 'Requirements satisfied' : 'Required to complete lesson'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#464555] block">
                Pass Threshold
              </span>
              <span className="text-xl font-extrabold text-[#006c4a]">
                {assessment?.passingScorePercent || 70}% Required
              </span>
              <span className="text-[11px] text-[#464555] block">
                Lesson remains incomplete until passed
              </span>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-5 rounded-2xl bg-[#faf8ff] border border-[#eaedff] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#131b2e] flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#3525cd]">menu_book</span>
              <span>Instructions & Assessment Guidelines</span>
            </h3>
            <ul className="text-xs text-[#464555] space-y-1.5 list-disc list-inside leading-relaxed">
              <li>
                <strong>Minimum 15 Questions:</strong> Tailored specifically to this lesson's video and curriculum.
              </li>
              <li>
                <strong>Different Questions per Student:</strong> Questions are selected dynamically from the lesson question bank.
              </li>
              <li>
                <strong>Question Timers:</strong> Individual timers per question (e.g. 60–90 seconds for MCQs, and a 15-minute dedicated timer for programming tasks). Timers persist across browser refresh.
              </li>
              <li>
                <strong>Question Types:</strong> Multiple choice, multiple select, true/false, coding problems, and analytical long-answer questions.
              </li>
              <li>
                <strong>Lesson Completion Rule:</strong> Watching the video alone will NOT complete the lesson. You must submit and pass this assessment with 70%+ score.
              </li>
            </ul>
          </div>

          {/* Transparent Monitoring Disclosure Notice */}
          <div className="p-4 rounded-2xl bg-[#fff9ea] border border-[#ffe082] flex items-start gap-3">
            <span className="material-symbols-outlined text-[22px] text-amber-700 shrink-0 mt-0.5">
              security
            </span>
            <div className="text-xs text-amber-900 leading-relaxed">
              <strong className="block font-bold mb-0.5">
                Transparent Assessment Integrity:
              </strong>
              During the active assessment, browser-level events (such as leaving the assessment tab/window, returning focus, or browser navigation) are recorded to maintain integrity. SkillSwap never reads other tabs, accesses local files, or records screens/microphones secretly.
            </div>
          </div>

          {/* Start Assessment Call-to-action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#eaedff]">
            <div className="text-xs text-[#464555]">
              <span className="text-[#006c4a] font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                Ready when you are. Ensure a stable environment before starting.
              </span>
            </div>

            <button
              onClick={handleStartTest}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-xs font-bold shadow-md flex items-center justify-center gap-2 bg-[#3525cd] text-white hover:bg-[#2718b5] hover:scale-[1.02] cursor-pointer transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">play_arrow</span>
              <span>Start Assessment</span>
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. ACTIVE TEST STATE: Assessment Inside the Lesson            */}
      {/* ------------------------------------------------------------- */}
      {viewState === 'testing' && currentQ && (
        <div className="space-y-6">
          {/* Integrity alert toast if triggered */}
          {integrityNotice && (
            <div className="p-3 rounded-2xl bg-amber-100 border border-amber-300 text-amber-800 text-xs font-medium flex items-center gap-2 animate-fadeIn">
              <span className="material-symbols-outlined text-[18px]">info</span>
              <span>Integrity event recorded: {integrityNotice}</span>
            </div>
          )}

          {/* Test Control Header: Question X of 15, Timers, Review toggle */}
          <div className="p-4 rounded-2xl bg-[#131b2e] text-white flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-xl bg-white/10 font-mono text-xs font-bold text-[#82f5c1]">
                Question {currentQuestionIndex + 1} of {currentQuestions.length}
              </span>
              <span className="text-xs text-white/70 hidden sm:inline">
                {currentQ.topic} • {currentQ.points} Points
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Question timer */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-xs font-mono">
                <span className="material-symbols-outlined text-[16px] text-amber-400">timer</span>
                <span>Question: {formatTimer(questionSecondsRemaining)}</span>
              </div>

              {/* Overall timer */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-xs font-mono">
                <span className="material-symbols-outlined text-[16px] text-[#82f5c1]">schedule</span>
                <span>Total: {formatTimer(overallSecondsRemaining)}</span>
              </div>

              {/* Fullscreen Toggle */}
              <button
                onClick={toggleFullscreen}
                className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 transition-all"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
                </span>
                <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Focus'}</span>
              </button>

              {/* Mark for review */}
              <button
                onClick={handleToggleReview}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                  markedForReview.includes(currentQ.id)
                    ? 'bg-amber-400 text-amber-950 font-bold'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">bookmark</span>
                <span>{markedForReview.includes(currentQ.id) ? 'Marked' : 'Review'}</span>
              </button>
            </div>
          </div>

          {/* Question Text and Interactive Input Body */}
          <div className="p-6 rounded-2xl bg-[#faf8ff] border border-[#eaedff] space-y-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-[#eaedff] text-[#3525cd] text-[10px] font-bold uppercase tracking-wider">
                  {currentQ.type.replace('_', ' ')}
                </span>
                {currentQ.difficulty && (
                  <span className="px-2 py-0.5 rounded-md bg-[#f2f3ff] text-[#464555] text-[10px] font-semibold">
                    {currentQ.difficulty}
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#131b2e] leading-relaxed whitespace-pre-wrap">
                {currentQ.questionText}
              </h3>
            </div>

            {/* A. MCQ & True/False (Single Select) */}
            {(currentQ.type === 'multiple_choice' || currentQ.type === 'true_false') && (
              <div className="space-y-2.5">
                {currentQ.options?.map((option, idx) => {
                  const isSelected = selectedAnswers[currentQ.id] === option;
                  return (
                    <label
                      key={idx}
                      onClick={() => handleSelectOption(currentQ.id, option)}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#eaedff] border-[#3525cd] text-[#3525cd] shadow-xs'
                          : 'bg-white border-[#c7c4d8] text-[#131b2e] hover:bg-[#f2f3ff]'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${currentQ.id}`}
                        checked={isSelected}
                        onChange={() => handleSelectOption(currentQ.id, option)}
                        className="mt-1 w-4 h-4 text-[#3525cd] focus:ring-[#3525cd]"
                      />
                      <span className="text-xs sm:text-sm font-medium leading-relaxed">{option}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* B. Multiple Answer (Checkboxes) */}
            {currentQ.type === 'multiple_answer' && (
              <div className="space-y-2.5">
                <span className="text-[11px] text-[#464555] block font-semibold italic">
                  Select all matching options:
                </span>
                {currentQ.options?.map((option, idx) => {
                  const currentSelected = (selectedAnswers[currentQ.id] as string[]) || [];
                  const isSelected = currentSelected.includes(option);
                  return (
                    <label
                      key={idx}
                      onClick={() => handleToggleMultiSelect(currentQ.id, option)}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#eaedff] border-[#3525cd] text-[#3525cd] shadow-xs'
                          : 'bg-white border-[#c7c4d8] text-[#131b2e] hover:bg-[#f2f3ff]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleMultiSelect(currentQ.id, option)}
                        className="mt-1 w-4 h-4 rounded text-[#3525cd] focus:ring-[#3525cd]"
                      />
                      <span className="text-xs sm:text-sm font-medium leading-relaxed">{option}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* C. Hands-on Coding Question with 15-Minute Timer & Test Cases */}
            {currentQ.type === 'coding' && (
              <div className="space-y-4">
                <div className="p-3 bg-[#e2e7ff] rounded-xl text-xs text-[#283044] space-y-1">
                  <strong>Constraints & Notes:</strong> {currentQ.constraints || 'O(V + E) complexity target'}
                  <div className="font-mono text-[11px] text-[#3525cd]">
                    15-Minute Dedicated Coding Problem Timer Active
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#464555]">Python Solution Editor:</span>
                    <button
                      onClick={() => handleRunCode(currentQ)}
                      className="px-3 py-1.5 rounded-xl bg-[#006c4a] text-white text-xs font-bold hover:opacity-95 flex items-center gap-1.5 shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                      <span>Run Test Cases</span>
                    </button>
                  </div>

                  <textarea
                    value={(selectedAnswers[currentQ.id] as string) ?? currentQ.starterCode ?? ''}
                    onChange={(e) => handleTextAnswerChange(currentQ.id, e.target.value)}
                    rows={12}
                    className="w-full p-4 rounded-2xl bg-[#131b2e] text-[#82f5c1] font-mono text-xs outline-none focus:ring-2 focus:ring-[#3525cd]"
                    placeholder="Write your code solution here..."
                  />
                </div>

                {codeOutputs[currentQ.id] && (
                  <pre className="p-3 rounded-xl bg-black/80 text-[#82f5c1] text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                    {codeOutputs[currentQ.id]}
                  </pre>
                )}
              </div>
            )}

            {/* D. Long Answer / Application Scenario */}
            {currentQ.type === 'long_answer' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-[#464555]">
                  <span>Write your analytical explanation below:</span>
                  <span>
                    Words:{' '}
                    {((selectedAnswers[currentQ.id] as string) || '')
                      .trim()
                      .split(/\s+/)
                      .filter(Boolean).length}
                  </span>
                </div>
                <textarea
                  value={(selectedAnswers[currentQ.id] as string) || ''}
                  onChange={(e) => handleTextAnswerChange(currentQ.id, e.target.value)}
                  rows={6}
                  placeholder="Provide structured reasoning with clear examples and trade-offs..."
                  className="w-full p-4 rounded-2xl border border-[#c7c4d8] text-xs sm:text-sm outline-none focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20"
                />
              </div>
            )}
          </div>

          {/* Question Navigator (Numbered pills) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#464555]">
              <span className="font-bold">Question Navigator</span>
              <span>
                {answeredCount} of {currentQuestions.length} answered
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {currentQuestions.map((q, idx) => {
                const isCurrent = idx === currentQuestionIndex;
                const isAnswered =
                  selectedAnswers[q.id] &&
                  selectedAnswers[q.id].toString().trim().length > 0;
                const isMarked = markedForReview.includes(q.id);

                return (
                  <button
                    key={q.id}
                    onClick={() => handleJumpToQuestion(idx)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center relative ${
                      isCurrent
                        ? 'ring-2 ring-[#3525cd] ring-offset-2 bg-[#3525cd] text-white shadow-xs'
                        : isMarked
                        ? 'bg-amber-400 text-amber-950 font-bold'
                        : isAnswered
                        ? 'bg-[#82f5c1] text-[#00714e]'
                        : 'bg-[#f2f3ff] text-[#464555] hover:bg-[#e2e7ff]'
                    }`}
                    title={`Question ${idx + 1}: ${isAnswered ? 'Answered' : 'Unanswered'}${isMarked ? ' (Marked for Review)' : ''}`}
                  >
                    {idx + 1}
                    {isMarked && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-600"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Buttons: Previous, Next, Submit */}
          <div className="flex items-center justify-between pt-4 border-t border-[#eaedff]">
            <button
              onClick={handlePrevQuestion}
              disabled={currentQuestionIndex === 0}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentQuestionIndex === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-[#f2f3ff] text-[#131b2e] hover:bg-[#e2e7ff]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-3">
              {currentQuestionIndex < currentQuestions.length - 1 ? (
                <button
                  onClick={handleNextQuestion}
                  className="px-6 py-2.5 rounded-xl bg-[#3525cd] text-white text-xs font-bold hover:bg-[#2718b5] transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <span>Next Question</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowPreSubmitModal(true)}
                  className="px-6 py-2.5 rounded-xl bg-[#006c4a] text-white text-xs font-bold hover:opacity-95 transition-all flex items-center gap-1.5 shadow-md"
                >
                  <span className="material-symbols-outlined text-[18px]">task_alt</span>
                  <span>SUBMIT ASSESSMENT</span>
                </button>
              )}
            </div>
          </div>

          {/* Pre-submit Review Modal */}
          {showPreSubmitModal && (
            <div className="p-5 rounded-2xl bg-white border border-[#3525cd]/20 shadow-xl space-y-4 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#eaedff] text-[#3525cd] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">rate_review</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#131b2e]">Ready to Submit Assessment?</h4>
                  <p className="text-xs text-[#464555]">
                    You have answered {answeredCount} of {currentQuestions.length} questions.
                  </p>
                </div>
              </div>

              {answeredCount < currentQuestions.length && (
                <div className="p-3 rounded-xl bg-[#fff7d6] text-[#6b4700] text-xs font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">warning</span>
                  <span>
                    You have {currentQuestions.length - answeredCount} unanswered question(s). Unanswered questions will receive 0 marks.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPreSubmitModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#c6c5d6] text-[#464555] font-bold text-xs hover:bg-[#f2f3ff] transition-all"
                >
                  Review Questions
                </button>
                <button
                  type="button"
                  onClick={handleSubmitFinal}
                  className="px-5 py-2 rounded-xl bg-[#006c4a] text-white font-bold text-xs hover:opacity-95 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>Confirm & Finalize</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. RESULT STATE: Directly Underneath the Lesson Content      */}
      {/* ------------------------------------------------------------- */}
      {viewState === 'result' && activeAttempt && (
        <div className="space-y-6 animate-fadeIn">
          {/* Main Score Card */}
          <div
            className={`p-6 sm:p-8 rounded-3xl text-center space-y-4 border ${
              activeAttempt.passed
                ? 'bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7] border-[#86efac]'
                : 'bg-gradient-to-br from-[#fff7ed] to-[#ffedd5] border-[#fdba74]'
            }`}
          >
            <div
              className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-md ${
                activeAttempt.passed
                  ? 'bg-[#006c4a] text-white'
                  : 'bg-amber-600 text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[36px]">
                {activeAttempt.passed ? 'check_circle' : 'replay'}
              </span>
            </div>

            <div className="space-y-1">
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  activeAttempt.passed ? 'text-[#006c4a]' : 'text-amber-800'
                }`}
              >
                {activeAttempt.passed ? '✓ PASSED' : '✕ NEEDS RETEST'}
              </span>
              <h3 className="text-3xl sm:text-4xl font-black text-[#131b2e]">
                {activeAttempt.percentage}%
              </h3>
              <p className="text-xs text-[#464555]">
                Score: {activeAttempt.score} / {activeAttempt.totalPoints} points
              </p>
            </div>

            {/* 3 Breakdown Badges */}
            <div className="flex items-center justify-center gap-4 text-xs font-semibold pt-2">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                ✓ {activeAttempt.correctCount} Correct
              </span>
              <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800">
                ✕ {activeAttempt.incorrectCount} Incorrect
              </span>
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                ○ {activeAttempt.unansweredCount} Unanswered
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#464555] max-w-lg mx-auto leading-relaxed pt-2">
              {activeAttempt.feedback}
            </p>
          </div>

          {/* Action Buttons: Review Answers, Retake Test, Continue Learning */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#eaedff]">
            <button
              onClick={() => setViewState('review')}
              className="px-5 py-2.5 rounded-xl border border-[#3525cd] text-[#3525cd] text-xs font-bold hover:bg-[#eaedff] transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              <span>Review Detailed Explanations</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleStartTest}
                className="px-5 py-2.5 rounded-xl bg-[#eaedff] text-[#3525cd] text-xs font-bold hover:bg-[#dae2fd] transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                <span>Retake Test (New Questions)</span>
              </button>

              {activeAttempt.passed && (
                <button
                  onClick={() => {
                    const el = document.getElementById('lesson-assessment-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#006c4a] text-white text-xs font-bold hover:opacity-95 shadow-xs flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>Lesson Verified ✓</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. REVIEW STATE: Detailed Question-by-Question Breakdown      */}
      {/* ------------------------------------------------------------- */}
      {viewState === 'review' && activeAttempt && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#131b2e]">Question Breakdown & Explanations</h3>
            <button
              onClick={() => setViewState('result')}
              className="text-xs text-[#3525cd] font-semibold hover:underline"
            >
              ← Back to Result Summary
            </button>
          </div>

          <div className="space-y-4">
            {(reviewQuestions.length > 0 ? reviewQuestions : currentQuestions).map((q, idx) => {
              const userAns = activeAttempt.answers[q.id];
              const isCorrect =
                userAns !== undefined &&
                ((typeof userAns === 'string' && q.correctAnswers.includes(userAns)) ||
                  (Array.isArray(userAns) &&
                    userAns.length === q.correctAnswers.length &&
                    userAns.every((a) => q.correctAnswers.includes(a))));

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-2xl border space-y-2.5 ${
                    isCorrect
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-rose-50/50 border-rose-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs text-[#131b2e]">
                      Q{idx + 1}. {q.questionText}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        isCorrect
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isCorrect ? 'Correct' : 'Needs Review'}
                    </span>
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="text-[#464555]">
                      <strong>Your Answer:</strong>{' '}
                      <span className={isCorrect ? 'text-emerald-700' : 'text-rose-700 font-semibold'}>
                        {Array.isArray(userAns)
                          ? userAns.join(', ') || 'None selected'
                          : userAns || 'None submitted'}
                      </span>
                    </div>

                    {!isCorrect && (
                      <div className="text-[#006c4a]">
                        <strong>Correct Answer:</strong> {q.correctAnswers.join('; ')}
                      </div>
                    )}

                    <p className="text-[11px] text-[#464555] bg-white/80 p-2.5 rounded-xl border border-black/5 mt-1 leading-relaxed">
                      💡 <strong>Explanation:</strong> {q.explanation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setViewState('result')}
              className="px-4 py-2 rounded-xl bg-[#3525cd] text-white text-xs font-bold"
            >
              Back to Score Card
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. INSTRUCTOR / PEER MENTOR ANALYTICS VIEW                    */}
      {/* ------------------------------------------------------------- */}
      {viewState === 'analytics' && analytics && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#131b2e]">
              Peer Mentor Assessment Analytics: {lessonTitle}
            </h3>
            <button
              onClick={() => setViewState('overview')}
              className="text-xs text-[#3525cd] font-semibold hover:underline"
            >
              ← Back to Assessment
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#f2f3ff] text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#464555]">Students Attempted</span>
              <span className="text-xl font-bold text-[#131b2e] block">{analytics.studentsAttempted}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#f2f3ff] text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#464555]">Completion Rate</span>
              <span className="text-xl font-bold text-[#006c4a] block">{analytics.completionRate}%</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#f2f3ff] text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#464555]">Average Score</span>
              <span className="text-xl font-bold text-[#3525cd] block">{analytics.averageScore}%</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#f2f3ff] text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#464555]">Pass Rate</span>
              <span className="text-xl font-bold text-emerald-700 block">{analytics.passRate}%</span>
            </div>
          </div>

          {/* Common Weak Topics */}
          <div className="p-4 rounded-2xl bg-[#faf8ff] border border-[#eaedff] space-y-3">
            <h4 className="font-bold text-xs text-[#131b2e]">Common Student Weak Topics</h4>
            <div className="space-y-2">
              {analytics.commonWeakTopics.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-white border border-[#eaedff]">
                  <span className="font-medium text-[#131b2e]">{item.topic}</span>
                  <span className="font-mono text-rose-600 font-bold">{item.missRate}% Miss Rate</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
