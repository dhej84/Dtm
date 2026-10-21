import React, { useState } from 'react';
import { AssessmentConfiguration, AssessmentQuestion } from '../../types';
import { apiService } from '../../services/apiService';

interface AssessmentPreviewModalProps {
  lessonId: string;
  lessonTitle: string;
  onClose: () => void;
}

export const AssessmentPreviewModal: React.FC<AssessmentPreviewModalProps> = ({
  lessonId,
  lessonTitle,
  onClose,
}) => {
  const { questions, config } = apiService.getPreviewAssessment(lessonId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, any>>({});
  const [codeOutputs, setCodeOutputs] = useState<Record<string, string>>({});
  const [isRunningCode, setIsRunningCode] = useState(false);

  const currentQ = questions[currentIndex] || questions[0];

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSelectOption = (qid: string, opt: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [qid]: opt }));
  };

  const handleRunCode = async (q: AssessmentQuestion) => {
    setIsRunningCode(true);
    const code = selectedAnswers[q.id] || q.starterCode || '';
    try {
      const res = await apiService.executeCodeSafe(q.codingLanguage || 'python', code, q.testCases);
      setCodeOutputs((prev) => ({ ...prev, [q.id]: res.stdout }));
    } finally {
      setIsRunningCode(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl border border-[#eaedff] space-y-6 animate-scaleUp my-8 max-h-[92vh] overflow-y-auto">
        {/* Banner: Preview Mode Notification */}
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-amber-600">
              visibility
            </span>
            <span>
              <strong>Instructor Preview Mode:</strong> Experiencing the exact assessment interface students will see. No real attempt or scores are recorded.
            </span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-amber-100 rounded-lg">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#eaedff] pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#3525cd] bg-[#eaedff] px-2.5 py-0.5 rounded-full">
              Student Simulation
            </span>
            <h3 className="font-extrabold text-lg text-[#131b2e] mt-1">{lessonTitle}</h3>
            <p className="text-xs text-[#464555]">
              Question {currentIndex + 1} of {questions.length} • {config.totalMarks} Total Marks • Passing: {config.passingPercentage}%
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-[#f2f3ff] border border-[#eaedff] text-xs font-mono font-bold text-[#3525cd] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">timer</span>
              <span>44:32 remaining</span>
            </div>

            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-[#f2f3ff] text-[#464555] text-xs font-bold hover:bg-[#eaedff]"
            >
              Exit Preview
            </button>
          </div>
        </div>

        {/* Question Card */}
        {currentQ ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[#f2f3ff] p-3 rounded-2xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-[#3525cd] text-white text-[11px] font-bold">
                  Q{currentIndex + 1}
                </span>
                <span className="text-xs font-bold text-[#131b2e] capitalize">
                  {currentQ.type.replace('_', ' ')}
                </span>
                <span className="text-xs text-[#464555]">• Topic: {currentQ.topic}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#464555]">
                <span>{currentQ.points} Marks</span>
                <span>• {currentQ.timeLimitSeconds || 90}s</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#eaedff]">
              <p className="text-sm font-bold text-[#131b2e] leading-relaxed">
                {currentQ.questionText}
              </p>
            </div>

            {/* MCQ Options */}
            {currentQ.type === 'multiple_choice' && currentQ.options && (
              <div className="space-y-2">
                {currentQ.options.map((opt, oIdx) => {
                  const isSelected = selectedAnswers[currentQ.id] === opt;
                  return (
                    <div
                      key={oIdx}
                      onClick={() => handleSelectOption(currentQ.id, opt)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                        isSelected
                          ? 'bg-[#eaedff] border-[#3525cd] text-[#3525cd] font-bold'
                          : 'bg-[#faf8ff] border-[#eaedff] hover:bg-[#f2f3ff] text-[#131b2e]'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isSelected
                            ? 'bg-[#3525cd] text-white'
                            : 'bg-white border border-[#c7c4d8] text-[#464555]'
                        }`}
                      >
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className="text-xs">{opt}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Coding Problem Playground */}
            {currentQ.type === 'coding' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#131b2e]">
                    Code Editor ({currentQ.codingLanguage || 'python'})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRunCode(currentQ)}
                    disabled={isRunningCode}
                    className="px-3.5 py-1.5 rounded-xl bg-[#006c4a] text-white text-xs font-bold hover:opacity-95 transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {isRunningCode ? 'progress_activity' : 'play_arrow'}
                    </span>
                    <span>{isRunningCode ? 'Running...' : 'Run Test Cases'}</span>
                  </button>
                </div>

                <textarea
                  rows={8}
                  value={selectedAnswers[currentQ.id] ?? (currentQ.starterCode || 'def solution():\n    pass')}
                  onChange={(e) =>
                    setSelectedAnswers({ ...selectedAnswers, [currentQ.id]: e.target.value })
                  }
                  className="w-full p-3 rounded-2xl border border-[#c7c4d8] text-xs font-mono bg-[#131b2e] text-[#eaedff] outline-none"
                />

                {codeOutputs[currentQ.id] && (
                  <div className="p-3 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] text-xs font-mono text-[#131b2e]">
                    <strong className="block text-[11px] text-[#464555] mb-1">Execution Output:</strong>
                    <pre className="whitespace-pre-wrap">{codeOutputs[currentQ.id]}</pre>
                  </div>
                )}
              </div>
            )}

            {/* Long Answer Area */}
            {currentQ.type === 'long_answer' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#131b2e]">Your Written Answer</label>
                <textarea
                  rows={6}
                  placeholder="Provide your detailed conceptual breakdown and practical reasoning here..."
                  value={selectedAnswers[currentQ.id] || ''}
                  onChange={(e) =>
                    setSelectedAnswers({ ...selectedAnswers, [currentQ.id]: e.target.value })
                  }
                  className="w-full p-3 rounded-2xl border border-[#c7c4d8] text-xs outline-none"
                />
                <span className="text-[10px] text-[#464555]">
                  Character count: {(selectedAnswers[currentQ.id] || '').length} (Auto-saved)
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-[#464555]">
            No questions available for preview. Please add questions to the bank.
          </div>
        )}

        {/* Navigation Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-[#eaedff]">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="px-4 py-2 rounded-xl bg-[#f2f3ff] text-[#464555] text-xs font-bold hover:bg-[#eaedff] disabled:opacity-30"
          >
            Previous
          </button>

          <span className="text-xs text-[#464555] font-semibold">
            {currentIndex + 1} / {questions.length}
          </span>

          <button
            type="button"
            onClick={handleNext}
            disabled={currentIndex === questions.length - 1}
            className="px-5 py-2 rounded-xl bg-[#3525cd] text-white text-xs font-bold hover:opacity-95 disabled:opacity-30"
          >
            Next Question
          </button>
        </div>
      </div>
    </div>
  );
};
