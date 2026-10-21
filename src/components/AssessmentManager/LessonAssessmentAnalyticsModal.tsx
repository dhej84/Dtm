import React, { useState, useEffect } from 'react';
import { DetailedLessonAnalytics } from '../../types';
import { apiService } from '../../services/apiService';

interface LessonAssessmentAnalyticsModalProps {
  lessonId: string;
  lessonTitle: string;
  onClose: () => void;
}

export const LessonAssessmentAnalyticsModal: React.FC<LessonAssessmentAnalyticsModalProps> = ({
  lessonId,
  lessonTitle,
  onClose,
}) => {
  const [analytics, setAnalytics] = useState<DetailedLessonAnalytics | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'topics' | 'difficulty'>('overview');

  useEffect(() => {
    const data = apiService.getDetailedLessonAnalytics(lessonId);
    setAnalytics(data);
  }, [lessonId]);

  if (!analytics) return null;

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl border border-[#eaedff] space-y-6 animate-scaleUp my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#eaedff] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#eaedff] text-[#3525cd] flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[28px]">insights</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-xl text-[#131b2e]">
                  Assessment Performance Analytics
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#82f5c1] text-[#00714e]">
                  Instructor View
                </span>
              </div>
              <p className="text-xs text-[#464555]">
                Course: <strong className="text-[#131b2e]">{analytics.lessonTitle || lessonTitle}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#464555] hover:bg-[#f2f3ff] transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#eaedff] pb-2">
          {[
            { id: 'overview', label: 'Overview Metrics', icon: 'dashboard' },
            { id: 'questions', label: 'Question Performance', icon: 'quiz' },
            { id: 'topics', label: 'Topic Performance & Gaps', icon: 'account_tree' },
            { id: 'difficulty', label: 'Difficulty Breakdown', icon: 'stairs' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-[#3525cd] text-white shadow-xs'
                  : 'text-[#464555] hover:bg-[#f2f3ff]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ----------------------------------------------------------- */}
        {/* VIEW 1: OVERVIEW METRICS                                   */}
        {/* ----------------------------------------------------------- */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#464555]">
                  Students Attempted
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#131b2e]">
                  {analytics.studentsAttempted}
                </p>
                <span className="text-[11px] text-[#006c4a] font-semibold">
                  Unique enrolled learners
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#464555]">
                  Students Completed
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#006c4a]">
                  {analytics.studentsCompleted}
                </p>
                <span className="text-[11px] text-[#464555]">
                  Passed with 70%+ score
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#464555]">
                  Average Score
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#3525cd]">
                  {analytics.averageScore}%
                </p>
                <span className="text-[11px] text-[#464555]">
                  Across all submitted attempts
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#464555]">
                  Pass Rate
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#006c4a]">
                  {analytics.passRate}%
                </p>
                <span className="text-[11px] text-[#464555]">
                  Completed on first or retest
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#464555]">
                  Average Time
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#131b2e]">
                  {formatSeconds(analytics.averageCompletionTimeSeconds)}
                </p>
                <span className="text-[11px] text-[#464555]">
                  Time spent on assessment
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#464555]">
                  Average Attempts
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#131b2e]">
                  {analytics.averageAttempts}
                </p>
                <span className="text-[11px] text-[#464555]">
                  Attempts per student
                </span>
              </div>
            </div>

            {/* Privacy Safeguard Note */}
            <div className="p-3.5 rounded-2xl bg-[#eaedff] text-[#3525cd] text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              <span>
                <strong>Privacy Protected:</strong> Analytics are computed strictly in aggregate. Individual student passwords, authentication tokens, and private answers are never exposed.
              </span>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* VIEW 2: QUESTION PERFORMANCE (COMMON STRUGGLES)            */}
        {/* ----------------------------------------------------------- */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            <p className="text-xs text-[#464555]">
              Identify questions students commonly struggle with to improve your video lecture or add targeted practice.
            </p>

            <div className="overflow-x-auto rounded-2xl border border-[#eaedff]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f2f3ff] text-[#464555] font-bold uppercase text-[10px] tracking-wider border-b border-[#eaedff]">
                  <tr>
                    <th className="p-3">Question</th>
                    <th className="p-3">Topic</th>
                    <th className="p-3">Difficulty</th>
                    <th className="p-3 text-center">Attempts</th>
                    <th className="p-3 text-center">Correct %</th>
                    <th className="p-3 text-center">Avg Marks</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaedff]">
                  {analytics.questionPerformance.map((qp, idx) => {
                    const isStruggle = qp.correctPercentage < 65;
                    return (
                      <tr key={qp.questionId} className="hover:bg-[#faf8ff] transition-colors">
                        <td className="p-3 font-semibold text-[#131b2e] max-w-xs truncate">
                          Q{idx + 1}. {qp.questionText}
                        </td>
                        <td className="p-3 text-[#464555] font-medium">{qp.topic}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              qp.difficulty === 'easy'
                                ? 'bg-green-100 text-green-800'
                                : qp.difficulty === 'medium'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {qp.difficulty.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold text-[#131b2e]">{qp.attempts}</td>
                        <td className="p-3 text-center">
                          <span
                            className={`font-extrabold ${
                              isStruggle ? 'text-rose-600' : 'text-emerald-700'
                            }`}
                          >
                            {qp.correctPercentage}%
                          </span>
                        </td>
                        <td className="p-3 text-center font-semibold text-[#464555]">
                          {qp.averageMarks} / {qp.totalMarks}
                        </td>
                        <td className="p-3 text-center">
                          {isStruggle ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">warning</span>
                              <span>Needs Review</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              Solid Mastery
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* VIEW 3: TOPIC PERFORMANCE & LEARNING GAPS                   */}
        {/* ----------------------------------------------------------- */}
        {activeTab === 'topics' && (
          <div className="space-y-4">
            <p className="text-xs text-[#464555]">
              Subtopic breakdown across the curriculum. Topics below 65% are flagged as learning gaps.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {analytics.topicPerformance.map((tp) => (
                <div
                  key={tp.topic}
                  className={`p-4 rounded-2xl border space-y-2 ${
                    tp.isLearningGap
                      ? 'bg-rose-50/50 border-rose-200'
                      : 'bg-[#f2f3ff] border-[#eaedff]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-[#131b2e]">{tp.topic}</h4>
                    <span
                      className={`text-xs font-extrabold ${
                        tp.isLearningGap ? 'text-rose-700' : 'text-[#006c4a]'
                      }`}
                    >
                      {tp.averageScorePercentage}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-[#e0e1eb] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        tp.isLearningGap ? 'bg-rose-500' : 'bg-[#006c4a]'
                      }`}
                      style={{ width: `${tp.averageScorePercentage}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#464555] pt-1">
                    <span>{tp.attemptsCount} attempts evaluated</span>
                    {tp.isLearningGap && (
                      <span className="text-rose-700 font-bold text-[10px] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">flag</span>
                        <span>Flagged Learning Gap</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* VIEW 4: DIFFICULTY BREAKDOWN                                */}
        {/* ----------------------------------------------------------- */}
        {activeTab === 'difficulty' && (
          <div className="space-y-4">
            <p className="text-xs text-[#464555]">
              Performance distribution by question difficulty level.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {analytics.difficultyPerformance.map((dp) => (
                <div
                  key={dp.difficulty}
                  className="p-5 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] text-center space-y-2"
                >
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase inline-block ${
                      dp.difficulty === 'easy'
                        ? 'bg-green-100 text-green-800'
                        : dp.difficulty === 'medium'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {dp.difficulty}
                  </span>
                  <p className="text-3xl font-extrabold text-[#131b2e]">
                    {dp.averageScorePercentage}%
                  </p>
                  <p className="text-xs text-[#464555]">
                    Average score on {dp.difficulty} questions
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-[#eaedff] flex items-center justify-between">
          <span className="text-xs text-[#464555]">
            Refreshed in real-time from verified student submissions
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#3525cd] text-white text-xs font-bold hover:opacity-95 transition-all shadow-xs"
          >
            Close Analytics
          </button>
        </div>
      </div>
    </div>
  );
};
