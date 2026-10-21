import React, { useState, useEffect, useRef } from 'react';
import {
  Assessment,
  AssessmentAttempt,
  AssessmentIntegrityEvent,
  AssessmentQuestion,
  LessonContext,
} from '../types';
import { assessmentService } from '../services/assessmentService';

interface ModuleAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: string;
  moduleTitle: string;
  lessonId: string;
  lessonTitle: string;
  userId: string;
  onAssessmentCompleted?: (attempt: AssessmentAttempt) => void;
  onAskMentor?: (context: LessonContext) => void;
}

export const ModuleAssessmentModal: React.FC<ModuleAssessmentModalProps> = ({
  isOpen,
  onClose,
  moduleId,
  moduleTitle,
  lessonId,
  lessonTitle,
  userId,
  onAssessmentCompleted,
  onAskMentor,
}) => {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<AssessmentAttempt | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string | string[]>>({});
  const [step, setStep] = useState<'intro' | 'active' | 'result'>('intro');
  const [secondsRemaining, setSecondsRemaining] = useState(600);
  const [integrityNotice, setIntegrityNotice] = useState<string | null>(null);
  const [integrityEventsList, setIntegrityEventsList] = useState<AssessmentIntegrityEvent[]>([]);

  const blurTimestampRef = useRef<number | null>(null);
  const lastActivityTimestampRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load assessment when opened
  useEffect(() => {
    if (isOpen) {
      const found = assessmentService.getAssessmentByModuleId(moduleId);
      setAssessment(found);
      setStep('intro');
      setSelectedAnswers({});
      setCurrentQuestionIndex(0);
      setIntegrityNotice(null);
      setIntegrityEventsList([]);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen, moduleId]);

  // Setup transparent integrity listeners when assessment is active
  useEffect(() => {
    if (step !== 'active' || !currentAttempt) return;

    // Countdown Timer
    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 1. Tab Switch / Page Visibility Listener
    const handleVisibilityChange = () => {
      if (document.hidden) {
        blurTimestampRef.current = Date.now();
        logEvent('tab_switch', 'Student switched browser tab or minimized window');
      } else {
        const duration = blurTimestampRef.current
          ? Math.round((Date.now() - blurTimestampRef.current) / 1000)
          : undefined;
        logEvent('returned_focus', `Returned to assessment tab after ${duration || 0} seconds`, duration);
        blurTimestampRef.current = null;
      }
    };

    // 2. Window Blur / Focus Listener
    const handleWindowBlur = () => {
      if (!blurTimestampRef.current) {
        blurTimestampRef.current = Date.now();
        logEvent('focus_loss', 'Assessment browser window lost focus');
      }
    };

    const handleWindowFocus = () => {
      if (blurTimestampRef.current) {
        const duration = Math.round((Date.now() - blurTimestampRef.current) / 1000);
        logEvent('returned_focus', `Window focus regained after ${duration} seconds`, duration);
        blurTimestampRef.current = null;
      }
    };

    // 3. Network Disconnection Listener
    const handleOffline = () => {
      logEvent('network_loss', 'Temporary network disconnection detected');
    };

    // 4. Inactivity Tracker
    const handleUserActivity = () => {
      lastActivityTimestampRef.current = Date.now();
    };

    const inactivityInterval = setInterval(() => {
      const elapsed = Date.now() - lastActivityTimestampRef.current;
      if (elapsed > 75000) { // 75 seconds without interaction
        logEvent('inactivity', 'Assessment idle for over 75 seconds without interaction', Math.round(elapsed / 1000));
        lastActivityTimestampRef.current = Date.now(); // reset to avoid duplicate alerts
      }
    }, 15000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clearInterval(inactivityInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
    };
  }, [step, currentAttempt]);

  const logEvent = (type: any, desc: string, duration?: number) => {
    if (!currentAttempt) return;
    const evt = assessmentService.recordIntegrityEvent(currentAttempt.id, type, desc, duration);
    setIntegrityEventsList((prev) => [...prev, evt]);
    setIntegrityNotice(desc);
    setTimeout(() => setIntegrityNotice(null), 4000);
  };

  const handleStart = () => {
    if (!assessment) return;
    try {
      const attempt = assessmentService.startAttempt(assessment.id, userId);
      setCurrentAttempt(attempt);
      setSecondsRemaining(assessment.timeLimitMinutes * 60);
      setStep('active');
    } catch (err: any) {
      setIntegrityNotice(err.message || 'Unable to start assessment');
    }
  };

  const handleAnswerSelect = (questionId: string, answer: string, isMulti: boolean = false) => {
    if (!currentAttempt) return;

    if (isMulti) {
      const current = (selectedAnswers[questionId] as string[]) || [];
      const updated = current.includes(answer)
        ? current.filter((a) => a !== answer)
        : [...current, answer];
      setSelectedAnswers({ ...selectedAnswers, [questionId]: updated });
      assessmentService.saveAnswer(currentAttempt.id, questionId, updated);
    } else {
      setSelectedAnswers({ ...selectedAnswers, [questionId]: answer });
      assessmentService.saveAnswer(currentAttempt.id, questionId, answer);
    }
  };

  const handleAutoSubmit = () => {
    if (!currentAttempt) return;
    handleSubmit();
  };

  const handleSubmit = async () => {
    if (!currentAttempt) return;
    const evaluated = await assessmentService.submitAttempt(currentAttempt.id);
    setCurrentAttempt(evaluated);
    setStep('result');
    if (onAssessmentCompleted) {
      onAssessmentCompleted(evaluated);
    }
  };

  const handleAskMentorHelp = () => {
    if (!currentAttempt) return;
    const context: LessonContext = {
      lessonId,
      lessonTitle,
      moduleId,
      moduleTitle,
      progressPercent: currentAttempt.percentage,
      skillName: currentAttempt.weakestTopic || 'Checkpoint Evaluation',
      category: 'Computer Science',
    };
    onClose();
    if (onAskMentor) {
      onAskMentor(context);
    }
  };

  if (!isOpen || !assessment) return null;

  const questions = assessment.questions || [];
  const currentQ = questions[currentQuestionIndex];
  const progressPercent = questions.length > 0 ? Math.round(((currentQuestionIndex + 1) / questions.length) * 100) : 0;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeString = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#eaedff] flex flex-col max-h-[90vh] overflow-y-auto">
        {/* STEP 1: PRE-START & INTEGRITY DISCLOSURE */}
        {step === 'intro' && (
          <div className="space-y-6">
            <div className="flex items-start justify-between border-b border-[#eaedff] pb-4">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-full bg-[#eaedff] text-[#3525cd] text-[10px] font-bold">
                  Module Assessment Checkpoint
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#131b2e]">
                  {assessment.title}
                </h2>
                <p className="text-xs text-[#464555]">
                  {lessonTitle} • {moduleTitle}
                </p>
              </div>
              <button onClick={onClose} className="text-[#8b8a9d] hover:text-[#131b2e]">
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <p className="text-xs sm:text-sm text-[#464555] leading-relaxed">
              {assessment.description}
            </p>

            {/* Assessment Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-[#f2f3ff] rounded-2xl border border-[#eaedff] text-center">
              <div>
                <span className="text-[10px] text-[#464555] block font-semibold">Questions</span>
                <span className="text-base font-bold text-[#131b2e]">{questions.length}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#464555] block font-semibold">Time Limit</span>
                <span className="text-base font-bold text-[#131b2e]">{assessment.timeLimitMinutes} min</span>
              </div>
              <div>
                <span className="text-[10px] text-[#464555] block font-semibold">Pass Threshold</span>
                <span className="text-base font-bold text-[#006c4a]">{assessment.passingScorePercent}%</span>
              </div>
            </div>

            {/* Assessment Integrity & Transparency Disclosure */}
            <div className="p-4 rounded-2xl bg-[#faf8ff] border border-[#ffdcc3] space-y-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#703a00]">
                  verified_user
                </span>
                <h4 className="font-bold text-xs text-[#703a00]">
                  Transparent Assessment Integrity Notice
                </h4>
              </div>
              <p className="text-[11px] text-[#464555] leading-relaxed">
                SkillSwap uses transparent integrity tracking rather than invasive surveillance.
                Technical focus shifts (such as leaving this tab, window blur, or network drops) are
                logged as technical events for instructor review.
              </p>
              <div className="flex flex-wrap gap-2 text-[10px] text-[#703a00] font-semibold pt-1">
                <span>✓ No hidden camera or mic access</span>
                <span>•</span>
                <span>✓ Events are technical notices, not automatic penalties</span>
                <span>•</span>
                <span>✓ Full privacy protection</span>
              </div>
            </div>

            {assessment.isExternalGoogleForm ? (
              <div className="space-y-3">
                <a
                  href={assessment.googleFormUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-2xl bg-[#3525cd] text-white text-xs font-bold hover:opacity-95 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                  <span>Open Instructor Google Form Assessment</span>
                </a>
                <button
                  onClick={() => {
                    assessmentService.recordGoogleFormCompletion(assessment.id, userId);
                    onClose();
                  }}
                  className="w-full py-2.5 rounded-2xl bg-[#f2f3ff] text-[#131b2e] text-xs font-semibold hover:bg-[#eaedff]"
                >
                  I Have Completed the Google Form
                </button>
              </div>
            ) : (
              <div className="pt-2 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-2xl bg-[#f2f3ff] text-[#464555] text-xs font-semibold hover:bg-[#eaedff] transition-all"
                >
                  Review Module Material First
                </button>
                <button
                  onClick={handleStart}
                  className="flex-1 py-3 rounded-2xl bg-[#3525cd] text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">play_circle</span>
                  <span>Begin Module Assessment</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: ACTIVE ASSESSMENT (One question at a time) */}
        {step === 'active' && currentQ && (
          <div className="space-y-6">
            {/* Real-time Integrity Notification Toast */}
            {integrityNotice && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-xs font-medium flex items-center gap-2 animate-fadeIn">
                <span className="material-symbols-outlined text-[18px] text-amber-600">
                  visibility
                </span>
                <span>Integrity Event Noticed: {integrityNotice}</span>
              </div>
            )}

            {/* Active Header & Timer */}
            <div className="flex items-center justify-between border-b border-[#eaedff] pb-4">
              <div>
                <span className="text-[10px] font-bold text-[#8b8a9d] uppercase tracking-wider block">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span className="text-xs font-bold text-[#3525cd]">{currentQ.topic}</span>
              </div>

              {/* Timer & Integrity Badge */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f2f3ff] text-[#131b2e] text-xs font-mono font-bold">
                  <span className="material-symbols-outlined text-[16px] text-[#3525cd]">timer</span>
                  <span>{timeString}</span>
                </div>
                <div
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#006c4a]"
                  title="Integrity monitor active (non-invasive)"
                >
                  <span className="w-2 h-2 rounded-full bg-[#006c4a] animate-pulse"></span>
                  <span>Integrity Active</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#eaedff] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#3525cd] h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Question Text */}
            <div className="space-y-3">
              <h3 className="font-bold text-base sm:text-lg text-[#131b2e] leading-snug">
                {currentQ.questionText}
              </h3>
              {currentQ.type === 'multiple_answer' && (
                <span className="text-[11px] text-[#703a00] bg-[#ffdcc3]/50 px-2 py-0.5 rounded-md font-semibold">
                  Multiple answers apply. Select all that fit.
                </span>
              )}
            </div>

            {/* Answer Options */}
            <div className="space-y-2.5">
              {currentQ.options?.map((option, idx) => {
                const isSelected =
                  currentQ.type === 'multiple_answer'
                    ? ((selectedAnswers[currentQ.id] as string[]) || []).includes(option)
                    : selectedAnswers[currentQ.id] === option;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      handleAnswerSelect(
                        currentQ.id,
                        option,
                        currentQ.type === 'multiple_answer'
                      )
                    }
                    className={`w-full p-4 rounded-2xl text-left text-xs sm:text-sm font-medium transition-all border flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#eaedff] border-[#3525cd] text-[#3525cd] shadow-xs'
                        : 'bg-[#faf8ff] border-[#eaedff] text-[#131b2e] hover:bg-[#f2f3ff]'
                    }`}
                  >
                    <span>{option}</span>
                    <span
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border-[#3525cd] bg-[#3525cd] text-white'
                          : 'border-[#c7c4d8]'
                      }`}
                    >
                      {isSelected && (
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      )}
                    </span>
                  </button>
                );
              })}

              {currentQ.type === 'short_answer' && (
                <input
                  type="text"
                  placeholder="Type your brief answer here..."
                  value={(selectedAnswers[currentQ.id] as string) || ''}
                  onChange={(e) => handleAnswerSelect(currentQ.id, e.target.value, false)}
                  className="w-full p-4 rounded-2xl border border-[#c7c4d8] text-sm bg-white focus:border-[#3525cd] outline-none"
                />
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="pt-4 border-t border-[#eaedff] flex items-center justify-between">
              <button
                type="button"
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#464555] hover:bg-[#f2f3ff] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {currentQuestionIndex < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                  className="px-5 py-2.5 rounded-xl bg-[#3525cd] text-white text-xs font-bold hover:opacity-95 transition-all flex items-center gap-1.5"
                >
                  <span>Next Question</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-6 py-2.5 rounded-xl bg-[#006c4a] text-white text-xs font-bold hover:opacity-95 transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">task_alt</span>
                  <span>Submit Assessment</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: RESULTS & LEARNING GAP FEEDBACK */}
        {step === 'result' && currentAttempt && (
          <div className="space-y-6">
            <div className="text-center space-y-2 border-b border-[#eaedff] pb-6">
              <div
                className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto text-2xl ${
                  currentAttempt.passed
                    ? 'bg-[#82f5c1] text-[#00714e]'
                    : 'bg-[#ffdcc3] text-[#703a00]'
                }`}
              >
                <span className="material-symbols-outlined text-[36px]">
                  {currentAttempt.passed ? 'celebration' : 'menu_book'}
                </span>
              </div>

              <h2 className="text-2xl font-extrabold text-[#131b2e]">
                {currentAttempt.passed ? 'Assessment Passed!' : 'Review & Practice Recommended'}
              </h2>

              <p className="text-xs text-[#464555] max-w-md mx-auto">
                {currentAttempt.feedback}
              </p>

              {/* Score pill */}
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#f2f3ff] mt-2">
                <span className="text-xs text-[#464555] font-semibold">Your Score:</span>
                <span className="text-xl font-black text-[#131b2e]">{currentAttempt.percentage}%</span>
                <span className="text-xs text-[#464555]">
                  ({currentAttempt.score}/{currentAttempt.totalPoints} pts)
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                    currentAttempt.passed
                      ? 'bg-[#82f5c1] text-[#00714e]'
                      : 'bg-[#ffdcc3] text-[#703a00]'
                  }`}
                >
                  {currentAttempt.passed ? 'PASSED ✓' : 'NEEDS REVISION'}
                </span>
              </div>
            </div>

            {/* Topics Needing Revision */}
            {currentAttempt.topicsToRevise.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#faf8ff] border border-[#eaedff] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#703a00] block">
                  Identified Revision Topics:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentAttempt.topicsToRevise.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#ffdcc3] text-[#131b2e] text-xs font-medium"
                    >
                      • {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Transparent Integrity Log Review */}
            {currentAttempt.integrityEvents.length > 0 && (
              <div className="p-3 bg-[#f2f3ff] rounded-2xl border border-[#eaedff] text-xs space-y-1">
                <span className="text-[10px] font-bold text-[#8b8a9d] uppercase">
                  Logged Integrity Events ({currentAttempt.integrityEvents.length}):
                </span>
                <div className="max-h-24 overflow-y-auto space-y-1">
                  {currentAttempt.integrityEvents.map((evt, idx) => (
                    <div key={idx} className="text-[11px] text-[#464555] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3525cd]"></span>
                      <span>{evt.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Question Review */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              <h4 className="font-bold text-xs text-[#131b2e] uppercase tracking-wider">
                Question Breakdown & Explanations
              </h4>
              {questions.map((q, idx) => {
                const uAns = currentAttempt.answers[q.id];
                const isCorrect =
                  q.type === 'multiple_choice' || q.type === 'true_false'
                    ? q.correctAnswers.includes(uAns as string)
                    : false;

                return (
                  <div
                    key={q.id}
                    className="p-3.5 rounded-2xl border border-[#eaedff] bg-white text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#131b2e]">
                        Q{idx + 1}. {q.questionText}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isCorrect
                            ? 'bg-[#82f5c1] text-[#00714e]'
                            : 'bg-[#ffdcc3] text-[#703a00]'
                        }`}
                      >
                        {isCorrect ? 'Correct ✓' : 'Incorrect ✗'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#464555] leading-relaxed">
                      <span className="font-semibold text-[#131b2e]">Explanation:</span> {q.explanation}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-[#eaedff] flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={handleAskMentorHelp}
                className="w-full sm:flex-1 py-3 rounded-2xl bg-[#eaedff] text-[#3525cd] text-xs font-bold hover:bg-[#dae2fd] transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">forum</span>
                <span>Ask Mentor for Help</span>
              </button>

              {!currentAttempt.passed && (
                <button
                  type="button"
                  onClick={handleStart}
                  className="w-full sm:flex-1 py-3 rounded-2xl bg-[#f2f3ff] text-[#131b2e] text-xs font-bold hover:bg-[#eaedff] transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                  <span>Retry Assessment</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:flex-1 py-3 rounded-2xl bg-[#3525cd] text-white text-xs font-bold hover:opacity-95 transition-all"
              >
                Continue Learning
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
