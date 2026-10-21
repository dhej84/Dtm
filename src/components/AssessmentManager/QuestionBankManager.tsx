import React, { useState, useEffect } from 'react';
import {
  AssessmentConfiguration,
  AssessmentQuestion,
  AssessmentQuestionType,
  QuestionBankItem,
} from '../../types';
import { apiService } from '../../services/apiService';

interface QuestionBankManagerProps {
  lessonId: string;
  lessonTitle: string;
  lessonSkill: string;
  lessonCategory: string;
  onClose?: () => void;
  onPreviewAssessment?: () => void;
}

export const QuestionBankManager: React.FC<QuestionBankManagerProps> = ({
  lessonId,
  lessonTitle,
  lessonSkill,
  lessonCategory,
  onClose,
  onPreviewAssessment,
}) => {
  const [activeTab, setActiveTab] = useState<'bank' | 'config' | 'ai_generate'>('bank');
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [config, setConfig] = useState<AssessmentConfiguration>(() =>
    apiService.getAssessmentConfig(lessonId)
  );

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  // Question Form State (for adding / editing)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formText, setFormText] = useState('');
  const [formType, setFormType] = useState<AssessmentQuestionType>('multiple_choice');
  const [formTopic, setFormTopic] = useState('');
  const [formDifficulty, setFormDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [formPoints, setFormPoints] = useState(5);
  const [formTimeLimit, setFormTimeLimit] = useState(90);
  const [formExplanation, setFormExplanation] = useState('');
  const [formOptions, setFormOptions] = useState<string[]>(['', '', '', '']);
  const [formCorrectIndex, setFormCorrectIndex] = useState(0);
  const [formCodingLang, setFormCodingLang] = useState('python');
  const [formStarterCode, setFormStarterCode] = useState('def solution():\n    # your code here\n    pass');
  const [formRubric, setFormRubric] = useState('');

  // AI Generation State
  const [aiCount, setAiCount] = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('mixed');
  const [aiTopic, setAiTopic] = useState(lessonSkill || 'Core Concepts');
  const [aiMarks, setAiMarks] = useState(5);
  const [aiTypes, setAiTypes] = useState<AssessmentQuestionType[]>(['multiple_choice', 'coding']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiGeneratedDrafts, setAiGeneratedDrafts] = useState<QuestionBankItem[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);

  // Toast Notice
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3000);
  };

  const loadQuestions = () => {
    const list = apiService.getQuestionBank(lessonId, false);
    setQuestions(list);
  };

  useEffect(() => {
    loadQuestions();
    setConfig(apiService.getAssessmentConfig(lessonId));
  }, [lessonId]);

  // Open Form for Adding New
  const handleOpenAddForm = () => {
    setEditingQuestionId(null);
    setFormText('');
    setFormType('multiple_choice');
    setFormTopic(lessonSkill || 'Core Principles');
    setFormDifficulty('medium');
    setFormPoints(5);
    setFormTimeLimit(90);
    setFormExplanation('');
    setFormOptions(['Option 1', 'Option 2', 'Option 3', 'Option 4']);
    setFormCorrectIndex(0);
    setFormCodingLang('python');
    setFormStarterCode('def solution():\n    # Implement here\n    pass');
    setFormRubric('');
    setIsFormOpen(true);
  };

  // Open Form for Editing
  const handleOpenEditForm = (q: QuestionBankItem) => {
    setEditingQuestionId(q.id);
    setFormText(q.questionText);
    setFormType(q.type);
    setFormTopic(q.topic);
    setFormDifficulty((q.difficulty as any) || 'medium');
    setFormPoints(q.points);
    setFormTimeLimit(q.timeLimitSeconds || (q.type === 'coding' ? 900 : 90));
    setFormExplanation(q.explanation || '');
    setFormOptions(q.options && q.options.length > 0 ? q.options : ['A', 'B', 'C', 'D']);
    const corrIdx = q.options ? q.options.findIndex((opt) => q.correctAnswers.includes(opt)) : 0;
    setFormCorrectIndex(corrIdx >= 0 ? corrIdx : 0);
    setFormCodingLang(q.codingLanguage || 'python');
    setFormStarterCode(q.starterCode || 'def solution():\n    pass');
    setFormRubric(q.rubricGuidelines || '');
    setIsFormOpen(true);
  };

  // Save Question (Create or Update)
  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formText.trim()) return;

    const correctAnswers =
      formType === 'multiple_choice'
        ? [formOptions[formCorrectIndex] || formOptions[0]]
        : formType === 'coding'
        ? ['Valid Solution']
        : ['Rubric verified'];

    const questionPayload: Omit<QuestionBankItem, 'id' | 'assessmentId' | 'lessonId'> = {
      questionText: formText.trim(),
      type: formType,
      topic: formTopic.trim() || 'General Concepts',
      difficulty: formDifficulty,
      points: formPoints,
      timeLimitSeconds: formTimeLimit,
      explanation: formExplanation.trim(),
      options: formType === 'multiple_choice' ? formOptions : undefined,
      correctAnswers,
      codingLanguage: formType === 'coding' ? formCodingLang : undefined,
      starterCode: formType === 'coding' ? formStarterCode : undefined,
      rubricGuidelines: formType === 'long_answer' ? formRubric : undefined,
      isArchived: false,
      tags: [formTopic.trim() || 'General', formDifficulty],
    };

    if (editingQuestionId) {
      apiService.updateQuestionInBank(lessonId, editingQuestionId, questionPayload);
      showToast('Question updated successfully.');
    } else {
      apiService.addQuestionToBank(lessonId, questionPayload);
      showToast('New question added to Question Bank.');
    }

    setIsFormOpen(false);
    loadQuestions();
  };

  // Duplicate Question
  const handleDuplicate = (qid: string) => {
    apiService.duplicateQuestionInBank(lessonId, qid);
    loadQuestions();
    showToast('Question duplicated.');
  };

  // Delete / Archive Question
  const handleDelete = (qid: string) => {
    apiService.deleteQuestionFromBank(lessonId, qid);
    loadQuestions();
    showToast('Question removed from active bank.');
  };

  // Save Assessment Configuration
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    apiService.saveAssessmentConfig(lessonId, config);
    showToast('Assessment configuration saved.');
  };

  // AI Question Generation Handler
  const handleGenerateAI = async () => {
    setIsGenerating(true);
    setAiError(null);
    try {
      const drafts = await apiService.generateQuestionsWithAI({
        lessonId,
        questionCount: aiCount,
        questionTypes: aiTypes,
        difficulty: aiDifficulty,
        topic: aiTopic,
        marks: aiMarks,
        customContext: `Workshop on ${lessonTitle} (${lessonSkill}). Ensure questions test practical comprehension.`,
      });
      setAiGeneratedDrafts(drafts);
    } catch (err: any) {
      setAiError(err.message || 'Failed to generate questions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Accept Single AI Draft Question
  const handleAcceptAIDraft = (draft: QuestionBankItem) => {
    apiService.addQuestionToBank(lessonId, {
      questionText: draft.questionText,
      type: draft.type,
      topic: draft.topic,
      difficulty: draft.difficulty || 'medium',
      points: draft.points,
      timeLimitSeconds: draft.timeLimitSeconds || (draft.type === 'coding' ? 900 : 90),
      options: draft.options,
      correctAnswers: draft.correctAnswers,
      explanation: draft.explanation,
      codingLanguage: draft.codingLanguage,
      starterCode: draft.starterCode,
      rubricGuidelines: draft.rubricGuidelines,
      tags: draft.tags || ['AI-Verified'],
      isArchived: false,
    });
    setAiGeneratedDrafts((prev) => prev.filter((d) => d.id !== draft.id));
    loadQuestions();
    showToast('Question accepted and added to question bank.');
  };

  // Accept All AI Drafts
  const handleAcceptAllAIDrafts = () => {
    aiGeneratedDrafts.forEach((draft) => {
      apiService.addQuestionToBank(lessonId, {
        questionText: draft.questionText,
        type: draft.type,
        topic: draft.topic,
        difficulty: draft.difficulty || 'medium',
        points: draft.points,
        timeLimitSeconds: draft.timeLimitSeconds || (draft.type === 'coding' ? 900 : 90),
        options: draft.options,
        correctAnswers: draft.correctAnswers,
        explanation: draft.explanation,
        codingLanguage: draft.codingLanguage,
        starterCode: draft.starterCode,
        rubricGuidelines: draft.rubricGuidelines,
        tags: draft.tags || ['AI-Verified'],
        isArchived: false,
      });
    });
    setAiGeneratedDrafts([]);
    loadQuestions();
    showToast(`Accepted all ${aiGeneratedDrafts.length} questions into bank!`);
  };

  // Reject Single Draft
  const handleRejectAIDraft = (id: string) => {
    setAiGeneratedDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  // Filtered Questions
  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || q.type === filterType;
    const matchesDiff = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
    return matchesSearch && matchesType && matchesDiff;
  });

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#eaedff] space-y-6 animate-fadeIn">
      {/* Toast Notice */}
      {toastNotice && (
        <div className="p-3.5 rounded-2xl bg-[#eaedff] border border-[#c5bfff] text-[#3525cd] text-xs font-bold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>{toastNotice}</span>
          </div>
          <button onClick={() => setToastNotice(null)} className="p-1">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#eaedff] pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#eaedff] text-[#3525cd] flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[28px]">quiz</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-[#131b2e] tracking-tight">
                Assessment Management & Question Bank
              </h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#82f5c1] text-[#00714e]">
                {questions.length} in Bank
              </span>
            </div>
            <p className="text-xs text-[#464555]">
              Curate a comprehensive question pool. Students receive a randomized subset of {config.questionCount} questions per attempt.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onPreviewAssessment && (
            <button
              type="button"
              onClick={onPreviewAssessment}
              className="px-4 py-2 rounded-xl bg-[#f2f3ff] text-[#3525cd] text-xs font-bold hover:bg-[#eaedff] transition-all flex items-center gap-1.5 border border-[#eaedff]"
            >
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              <span>Preview Assessment</span>
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#464555] hover:bg-[#f2f3ff] transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-[#eaedff] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('bank')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'bank'
              ? 'bg-[#3525cd] text-white shadow-xs'
              : 'text-[#464555] hover:bg-[#f2f3ff]'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">database</span>
          <span>Question Bank ({questions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'config'
              ? 'bg-[#3525cd] text-white shadow-xs'
              : 'text-[#464555] hover:bg-[#f2f3ff]'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">tune</span>
          <span>Assessment Configuration</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ai_generate')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'ai_generate'
              ? 'bg-[#3525cd] text-white shadow-xs'
              : 'text-[#464555] hover:bg-[#f2f3ff]'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
          <span>Generate with AI</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: QUESTION BANK LISTING & MANAGEMENT                     */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'bank' && (
        <div className="space-y-4">
          {/* Action Row & Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#464555] text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search questions or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#c7c4d8] text-xs outline-none focus:border-[#3525cd]"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#c7c4d8] text-xs bg-white text-[#131b2e] outline-none"
              >
                <option value="all">All Types</option>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="coding">Coding Problem</option>
                <option value="long_answer">Long Answer</option>
              </select>

              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#c7c4d8] text-xs bg-white text-[#131b2e] outline-none"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleOpenAddForm}
              className="px-4 py-2.5 rounded-xl bg-[#3525cd] text-white text-xs font-bold hover:opacity-95 transition-all flex items-center justify-center gap-1.5 shadow-xs shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>+ Add Question</span>
            </button>
          </div>

          {/* Question Count Alert if bank is smaller than config.questionCount */}
          {questions.length < config.questionCount && (
            <div className="p-3.5 rounded-2xl bg-[#fff7d6] border border-[#ffdf99] text-[#6b4700] text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">info</span>
              <span>
                Your question bank has <strong>{questions.length} questions</strong>, but the test config selects{' '}
                <strong>{config.questionCount} questions</strong>. Add at least {config.questionCount - questions.length} more questions or generate them with AI to enable full randomized selection.
              </span>
            </div>
          )}

          {/* Question List */}
          <div className="space-y-3">
            {filteredQuestions.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#f2f3ff] text-center space-y-2">
                <span className="material-symbols-outlined text-[36px] text-[#464555]">
                  inventory_2
                </span>
                <p className="text-xs font-bold text-[#131b2e]">No questions found</p>
                <p className="text-[11px] text-[#464555]">
                  Add your first question manually or use the AI generator to auto-build questions.
                </p>
              </div>
            ) : (
              filteredQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] hover:border-[#3525cd]/30 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-[#eaedff] text-[#3525cd]">
                          Q{idx + 1}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            q.type === 'coding'
                              ? 'bg-purple-100 text-purple-800'
                              : q.type === 'long_answer'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {q.type.replace('_', ' ').toUpperCase()}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            q.difficulty === 'easy'
                              ? 'bg-green-100 text-green-800'
                              : q.difficulty === 'medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {q.difficulty?.toUpperCase()}
                        </span>
                        <span className="text-[11px] font-semibold text-[#464555]">
                          Topic: <strong>{q.topic}</strong>
                        </span>
                        <span className="text-[11px] font-semibold text-[#464555]">
                          • {q.points} Marks • {q.timeLimitSeconds || 90}s
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[#131b2e] leading-relaxed">
                        {q.questionText}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditForm(q)}
                        className="px-2.5 py-1.5 rounded-xl bg-white border border-[#c7c4d8] text-xs font-bold text-[#131b2e] hover:bg-[#eaedff] hover:text-[#3525cd] transition-all flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">edit</span>
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDuplicate(q.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-white border border-[#c7c4d8] text-xs font-bold text-[#464555] hover:bg-[#eaedff] transition-all flex items-center gap-1"
                        title="Duplicate Question"
                      >
                        <span className="material-symbols-outlined text-[14px]">content_copy</span>
                        <span>Copy</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(q.id)}
                        className="p-1.5 rounded-xl text-[#ba1a1a] hover:bg-red-50 transition-all"
                        title="Remove / Archive Question"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Options Preview for MCQ */}
                  {q.type === 'multiple_choice' && q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                      {q.options.map((opt, oIdx) => {
                        const isCorrect = q.correctAnswers.includes(opt);
                        return (
                          <div
                            key={oIdx}
                            className={`p-2 rounded-xl border flex items-center gap-2 ${
                              isCorrect
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                                : 'bg-white border-[#eaedff] text-[#464555]'
                            }`}
                          >
                            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold border border-current">
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span className="truncate">{opt}</span>
                            {isCorrect && (
                              <span className="material-symbols-outlined text-[14px] text-emerald-600 ml-auto">
                                check_circle
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Explanation Preview */}
                  {q.explanation && (
                    <div className="p-2.5 rounded-xl bg-white border border-[#eaedff] text-[11px] text-[#464555] flex items-start gap-2">
                      <span className="material-symbols-outlined text-[16px] text-[#3525cd] shrink-0 mt-0.5">
                        lightbulb
                      </span>
                      <span>
                        <strong className="text-[#131b2e]">Explanation:</strong> {q.explanation}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: ASSESSMENT CONFIGURATION                               */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'config' && (
        <form onSubmit={handleSaveConfig} className="space-y-6 max-w-3xl">
          <div className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] space-y-1">
            <h3 className="font-extrabold text-sm text-[#131b2e]">Dynamic Selection Rules</h3>
            <p className="text-xs text-[#464555]">
              Configure how questions are randomized and assembled from your {questions.length}-question bank for each student attempt.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#131b2e] mb-1">
                Questions per Attempt *
              </label>
              <input
                type="number"
                min={5}
                max={50}
                value={config.questionCount}
                onChange={(e) => setConfig({ ...config, questionCount: parseInt(e.target.value) || 15 })}
                className="w-full px-3 py-2 rounded-xl border border-[#c7c4d8] text-xs outline-none focus:border-[#3525cd]"
              />
              <span className="text-[10px] text-[#464555]">Minimum 15 recommended</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#131b2e] mb-1">
                Total Assessment Marks *
              </label>
              <input
                type="number"
                min={10}
                max={200}
                value={config.totalMarks}
                onChange={(e) => setConfig({ ...config, totalMarks: parseInt(e.target.value) || 50 })}
                className="w-full px-3 py-2 rounded-xl border border-[#c7c4d8] text-xs outline-none focus:border-[#3525cd]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#131b2e] mb-1">
                Passing Percentage (%) *
              </label>
              <input
                type="number"
                min={50}
                max={100}
                value={config.passingPercentage}
                onChange={(e) => setConfig({ ...config, passingPercentage: parseInt(e.target.value) || 70 })}
                className="w-full px-3 py-2 rounded-xl border border-[#c7c4d8] text-xs outline-none focus:border-[#3525cd]"
              />
              <span className="text-[10px] text-[#464555]">Required for lesson completion</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#131b2e] mb-1">
                Overall Time Limit (Minutes)
              </label>
              <input
                type="number"
                min={10}
                max={180}
                value={config.overallTimeLimitMinutes}
                onChange={(e) => setConfig({ ...config, overallTimeLimitMinutes: parseInt(e.target.value) || 45 })}
                className="w-full px-3 py-2 rounded-xl border border-[#c7c4d8] text-xs outline-none focus:border-[#3525cd]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#131b2e] mb-1">
                Coding Question Timer (Minutes)
              </label>
              <input
                type="number"
                min={5}
                max={45}
                value={config.codingTimeLimitMinutes}
                onChange={(e) => setConfig({ ...config, codingTimeLimitMinutes: parseInt(e.target.value) || 15 })}
                className="w-full px-3 py-2 rounded-xl border border-[#c7c4d8] text-xs outline-none focus:border-[#3525cd]"
              />
              <span className="text-[10px] text-[#464555]">Default 15 minutes</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#131b2e] mb-1">
                Maximum Student Attempts
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={config.maxAttempts}
                onChange={(e) => setConfig({ ...config, maxAttempts: parseInt(e.target.value) || 3 })}
                className="w-full px-3 py-2 rounded-xl border border-[#c7c4d8] text-xs outline-none focus:border-[#3525cd]"
              />
            </div>
          </div>

          {/* Difficulty Distribution */}
          <div className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] space-y-3">
            <h4 className="font-bold text-xs text-[#131b2e]">Target Difficulty Distribution</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#006c4a] mb-1">
                  Easy % ({config.difficultyDistribution.easyPercent}%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={config.difficultyDistribution.easyPercent}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      difficultyDistribution: {
                        ...config.difficultyDistribution,
                        easyPercent: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-[#c7c4d8] text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-amber-700 mb-1">
                  Medium % ({config.difficultyDistribution.mediumPercent}%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={config.difficultyDistribution.mediumPercent}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      difficultyDistribution: {
                        ...config.difficultyDistribution,
                        mediumPercent: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-[#c7c4d8] text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-rose-700 mb-1">
                  Hard % ({config.difficultyDistribution.hardPercent}%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={config.difficultyDistribution.hardPercent}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      difficultyDistribution: {
                        ...config.difficultyDistribution,
                        hardPercent: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-[#c7c4d8] text-xs bg-white"
                />
              </div>
            </div>
          </div>

          {/* Randomization & Explanations Checkboxes */}
          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#131b2e]">
              <input
                type="checkbox"
                checked={config.randomizeQuestions}
                onChange={(e) => setConfig({ ...config, randomizeQuestions: e.target.checked })}
                className="w-4 h-4 rounded text-[#3525cd]"
              />
              <span>Randomize question selection and ordering for each student attempt</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#131b2e]">
              <input
                type="checkbox"
                checked={config.randomizeOptions}
                onChange={(e) => setConfig({ ...config, randomizeOptions: e.target.checked })}
                className="w-4 h-4 rounded text-[#3525cd]"
              />
              <span>Shuffle multiple-choice options (prevents adjacent memorization)</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#131b2e]">
              <input
                type="checkbox"
                checked={config.showExplanationsAfterSubmission}
                onChange={(e) =>
                  setConfig({ ...config, showExplanationsAfterSubmission: e.target.checked })
                }
                className="w-4 h-4 rounded text-[#3525cd]"
              />
              <span>Show question explanations on assessment result review (never revealed before submit)</span>
            </label>
          </div>

          <div className="pt-4 border-t border-[#eaedff]">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#3525cd] text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>Save Assessment Configuration</span>
            </button>
          </div>
        </form>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: GENERATE QUESTIONS WITH AI (WITH DRAFT REVIEW SCREEN)  */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'ai_generate' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-[#eaedff] border border-[#c5bfff] space-y-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#3525cd] text-[20px]">
                auto_awesome
              </span>
              <h3 className="font-extrabold text-sm text-[#131b2e]">
                AI Question Generator (Grounded in Lesson Context)
              </h3>
            </div>
            <p className="text-xs text-[#464555]">
              Generates rigorous, curriculum-aligned questions based on: <strong>{lessonTitle}</strong> ({lessonSkill} • {lessonCategory}). All generated questions appear in a review screen before being added to your Question Bank.
            </p>
          </div>

          {/* Generator Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#131b2e] mb-1">
                Question Count
              </label>
              <input
                type="number"
                min={1}
                max={15}
                value={aiCount}
                onChange={(e) => setAiCount(parseInt(e.target.value) || 5)}
                className="w-full px-3 py-2 rounded-xl border border-[#c7c4d8] text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#131b2e] mb-1">
                Target Topic / Subtopic
              </label>
              <input
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="e.g. Graph Traversals, Loops"
                className="w-full px-3 py-2 rounded-xl border border-[#c7c4d8] text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#131b2e] mb-1">
                Target Difficulty
              </label>
              <select
                value={aiDifficulty}
                onChange={(e) => setAiDifficulty(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-[#c7c4d8] text-xs bg-white text-[#131b2e]"
              >
                <option value="mixed">Mixed (Balanced)</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#131b2e] mb-1">
                Marks per Question
              </label>
              <input
                type="number"
                min={1}
                max={25}
                value={aiMarks}
                onChange={(e) => setAiMarks(parseInt(e.target.value) || 5)}
                className="w-full px-3 py-2 rounded-xl border border-[#c7c4d8] text-xs outline-none"
              />
            </div>
          </div>

          {/* Types Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#131b2e]">Question Types to Include</label>
            <div className="flex flex-wrap items-center gap-3">
              {[
                { type: 'multiple_choice', label: 'Multiple Choice' },
                { type: 'coding', label: 'Hands-on Coding' },
                { type: 'long_answer', label: 'Long Answer / Analysis' },
              ].map((item) => {
                const checked = aiTypes.includes(item.type as any);
                return (
                  <label key={item.type} className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#131b2e]">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAiTypes([...aiTypes, item.type as any]);
                        } else if (aiTypes.length > 1) {
                          setAiTypes(aiTypes.filter((t) => t !== item.type));
                        }
                      }}
                      className="w-4 h-4 rounded text-[#3525cd]"
                    />
                    <span>{item.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {aiError && (
            <div className="p-3 rounded-xl bg-red-50 text-[#ba1a1a] text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{aiError}</span>
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className="px-6 py-2.5 rounded-xl bg-[#3525cd] text-white text-xs font-bold hover:opacity-95 transition-all flex items-center gap-2 disabled:opacity-50 shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isGenerating ? 'progress_activity' : 'auto_awesome'}
              </span>
              <span>{isGenerating ? 'Generating Questions...' : 'Generate Questions with AI'}</span>
            </button>
          </div>

          {/* DRAFT REVIEW SCREEN (Teacher must Accept / Reject / Edit each generated question) */}
          {aiGeneratedDrafts.length > 0 && (
            <div className="pt-6 border-t border-[#eaedff] space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-base text-[#131b2e]">
                    Generated Questions Review Screen ({aiGeneratedDrafts.length})
                  </h4>
                  <p className="text-xs text-[#464555]">
                    Review each draft carefully. Questions will only be added to your question bank upon your approval.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAcceptAllAIDrafts}
                  className="px-4 py-2 rounded-xl bg-[#006c4a] text-white text-xs font-bold hover:opacity-95 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>Accept All ({aiGeneratedDrafts.length})</span>
                </button>
              </div>

              <div className="space-y-3">
                {aiGeneratedDrafts.map((draft, idx) => (
                  <div
                    key={draft.id}
                    className="p-4 rounded-2xl bg-white border border-[#c5bfff] shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#eaedff] text-[#3525cd]">
                            Draft {idx + 1}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                            {draft.type.toUpperCase()}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                            {draft.difficulty?.toUpperCase()}
                          </span>
                          <span className="text-[11px] font-semibold text-[#464555]">
                            Topic: {draft.topic} • {draft.points} Marks
                          </span>
                        </div>

                        <p className="text-xs font-bold text-[#131b2e] leading-relaxed">
                          {draft.questionText}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAcceptAIDraft(draft)}
                          className="px-3 py-1.5 rounded-xl bg-[#006c4a] text-white text-xs font-bold hover:opacity-95 transition-all flex items-center gap-1 shadow-xs"
                        >
                          <span className="material-symbols-outlined text-[14px]">check</span>
                          <span>Accept</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRejectAIDraft(draft.id)}
                          className="px-3 py-1.5 rounded-xl bg-[#f2f3ff] text-[#ba1a1a] text-xs font-bold hover:bg-red-50 transition-all flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>

                    {/* MCQ Options Display */}
                    {draft.options && draft.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {draft.options.map((opt, oIdx) => {
                          const isCorrect = draft.correctAnswers.includes(opt);
                          return (
                            <div
                              key={oIdx}
                              className={`p-2 rounded-xl border text-[11px] flex items-center gap-2 ${
                                isCorrect
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                                  : 'bg-[#f2f3ff] border-[#eaedff] text-[#464555]'
                              }`}
                            >
                              <span className="font-bold">{String.fromCharCode(65 + oIdx)}.</span>
                              <span className="truncate">{opt}</span>
                              {isCorrect && (
                                <span className="material-symbols-outlined text-[14px] text-emerald-600 ml-auto">
                                  check_circle
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {draft.explanation && (
                      <div className="p-2.5 rounded-xl bg-[#f2f3ff] text-[11px] text-[#464555]">
                        <strong className="text-[#131b2e]">Explanation:</strong> {draft.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT QUESTION                                    */}
      {/* ------------------------------------------------------------- */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-[#eaedff] space-y-5 animate-scaleUp my-8">
            <div className="flex items-center justify-between border-b border-[#eaedff] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3525cd] text-2xl">
                  {editingQuestionId ? 'edit_note' : 'add_circle'}
                </span>
                <h3 className="font-extrabold text-lg text-[#131b2e]">
                  {editingQuestionId ? 'Edit Assessment Question' : 'Add New Question to Bank'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-lg text-[#464555] hover:bg-[#f2f3ff]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#131b2e] mb-1">
                  Question Text / Problem Statement *
                </label>
                <textarea
                  rows={3}
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  placeholder="Enter the complete question prompt..."
                  required
                  className="w-full p-3 rounded-xl border border-[#c7c4d8] text-xs outline-none focus:border-[#3525cd]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#131b2e] mb-1">
                    Question Type
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#c7c4d8] text-xs bg-white"
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="coding">Coding Problem</option>
                    <option value="long_answer">Long Answer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#131b2e] mb-1">
                    Topic / Subtopic
                  </label>
                  <input
                    type="text"
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    placeholder="e.g. Loops, BFS"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-[#c7c4d8] text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#131b2e] mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#c7c4d8] text-xs bg-white"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#131b2e] mb-1">
                    Marks / Points
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={formPoints}
                    onChange={(e) => setFormPoints(parseInt(e.target.value) || 5)}
                    className="w-full px-3 py-2 rounded-xl border border-[#c7c4d8] text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#131b2e] mb-1">
                    Question Timer (Seconds)
                  </label>
                  <input
                    type="number"
                    min={30}
                    max={1800}
                    value={formTimeLimit}
                    onChange={(e) => setFormTimeLimit(parseInt(e.target.value) || 90)}
                    className="w-full px-3 py-2 rounded-xl border border-[#c7c4d8] text-xs outline-none"
                  />
                  <span className="text-[10px] text-[#464555]">900s (15m) recommended for coding</span>
                </div>
              </div>

              {/* MCQ Options Fields */}
              {formType === 'multiple_choice' && (
                <div className="space-y-2 p-3.5 rounded-2xl bg-[#f2f3ff] border border-[#eaedff]">
                  <label className="block text-xs font-bold text-[#131b2e]">
                    Multiple Choice Options (Select radio for correct answer)
                  </label>
                  {formOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correct_choice"
                        checked={formCorrectIndex === idx}
                        onChange={() => setFormCorrectIndex(idx)}
                        className="w-4 h-4 text-[#3525cd]"
                        title="Mark as correct answer"
                      />
                      <input
                        type="text"
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        value={opt}
                        onChange={(e) => {
                          const copy = [...formOptions];
                          copy[idx] = e.target.value;
                          setFormOptions(copy);
                        }}
                        required
                        className="flex-1 px-3 py-1.5 rounded-lg border border-[#c7c4d8] text-xs bg-white outline-none"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Coding Question Details */}
              {formType === 'coding' && (
                <div className="space-y-3 p-3.5 rounded-2xl bg-[#f2f3ff] border border-[#eaedff]">
                  <label className="block text-xs font-bold text-[#131b2e]">
                    Coding Configuration
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="text-[11px] font-semibold text-[#464555]">Language:</span>
                      <select
                        value={formCodingLang}
                        onChange={(e) => setFormCodingLang(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-[#c7c4d8] text-xs bg-white mt-1"
                      >
                        <option value="python">Python 3</option>
                        <option value="javascript">JavaScript / TypeScript</option>
                        <option value="java">Java</option>
                        <option value="sql">SQL</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-[#464555]">Starter Code:</span>
                    <textarea
                      rows={3}
                      value={formStarterCode}
                      onChange={(e) => setFormStarterCode(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-[#c7c4d8] text-xs font-mono bg-white mt-1"
                    />
                  </div>
                </div>
              )}

              {/* Long Answer Rubric */}
              {formType === 'long_answer' && (
                <div className="space-y-2 p-3.5 rounded-2xl bg-[#f2f3ff] border border-[#eaedff]">
                  <label className="block text-xs font-bold text-[#131b2e]">
                    Grading Rubric / Key Evaluation Criteria
                  </label>
                  <textarea
                    rows={2}
                    value={formRubric}
                    onChange={(e) => setFormRubric(e.target.value)}
                    placeholder="Specify criteria required for full credit (distinguishes auto-eval from manual review)"
                    className="w-full p-2.5 rounded-lg border border-[#c7c4d8] text-xs bg-white outline-none"
                  />
                </div>
              )}

              {/* Explanation Field */}
              <div>
                <label className="block text-xs font-bold text-[#131b2e] mb-1">
                  Educational Explanation (Shown to students post-submission)
                </label>
                <textarea
                  rows={2}
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  placeholder="Explain why the solution is correct and address common misconceptions..."
                  className="w-full p-2.5 rounded-xl border border-[#c7c4d8] text-xs outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaedff]">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#f2f3ff] text-[#464555] text-xs font-bold hover:bg-[#eaedff]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#3525cd] text-white text-xs font-bold hover:opacity-95 shadow-sm"
                >
                  {editingQuestionId ? 'Save Changes' : 'Add to Question Bank'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
