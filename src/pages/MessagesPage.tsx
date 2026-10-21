import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ChatMessage,
  ConversationSummary,
  Lesson,
  LessonContext,
  MessageStatus,
} from '../types';
import { messageService } from '../services/messageService';
import { nlpService } from '../services/nlpService';
import { apiService } from '../services/apiService';

interface MessagesPageProps {
  onNavigate: (route: string) => void;
  initialConversationId?: string;
  initialLessonContext?: LessonContext;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({
  onNavigate,
  initialConversationId,
  initialLessonContext,
}) => {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'mentors' | 'learners'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [activeLessonContext, setActiveLessonContext] = useState<LessonContext | undefined>(
    initialLessonContext
  );
  const [availableLessons, setAvailableLessons] = useState<Lesson[]>([]);
  const [isContextPickerOpen, setIsContextPickerOpen] = useState(false);
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, boolean>>({});
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Offensive or inappropriate content');
  const [reportDetails, setReportDetails] = useState('');
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [candidatePeers, setCandidatePeers] = useState<any[]>([]);
  const [peerSearchQuery, setPeerSearchQuery] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load conversations and peers on mount
  useEffect(() => {
    loadConversations();
    loadLessons();
    loadCandidatePeers();
  }, [currentUser?.id]);

  // Handle initial conversation ID or initial lesson context
  useEffect(() => {
    if (initialConversationId && conversations.length > 0) {
      const match = conversations.find((c) => c.conversation.id === initialConversationId);
      if (match) {
        setActiveConversationId(match.conversation.id);
      }
    } else if (conversations.length > 0 && !activeConversationId) {
      setActiveConversationId(conversations[0].conversation.id);
    }
  }, [initialConversationId, conversations]);

  // Load messages and poll periodically for real-time delivery
  useEffect(() => {
    if (!activeConversationId || !currentUser?.id) return;
    loadMessages(activeConversationId);

    const interval = setInterval(() => {
      messageService
        .getMessages(activeConversationId, currentUser.id)
        .then((latest) => {
          if (Array.isArray(latest)) {
            setMessages((prev) => {
              if (
                latest.length !== prev.length ||
                (latest.length > 0 && prev.length > 0 && latest[latest.length - 1]?.id !== prev[prev.length - 1]?.id)
              ) {
                return latest;
              }
              return prev;
            });
          }
        })
        .catch(() => {});
    }, 4000);

    return () => clearInterval(interval);
  }, [activeConversationId, currentUser?.id]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadCandidatePeers = async () => {
    try {
      const students = await apiService.getAllStudents();
      if (Array.isArray(students)) {
        setCandidatePeers(students.filter((s: any) => s.id !== currentUser?.id));
      }
    } catch (e) {
      console.warn('Could not load candidate peers for new chat:', e);
    }
  };

  const loadConversations = async () => {
    if (!currentUser?.id) return;
    try {
      setIsLoading(true);
      const convs = await messageService.getConversations(currentUser.id);
      setConversations(convs);

      if (convs.length > 0 && !activeConversationId) {
        setActiveConversationId(convs[0].conversation.id);
        if (convs[0].conversation.activeLessonContext) {
          setActiveLessonContext(convs[0].conversation.activeLessonContext);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChatWithPeer = async (peer: any) => {
    if (!currentUser?.id) return;
    try {
      setIsLoading(true);
      const conv = await messageService.startOrGetConversation(currentUser.id, peer.id);
      const updatedConvs = await messageService.getConversations(currentUser.id);
      setConversations(updatedConvs);
      setActiveConversationId(conv.id);
      setIsNewChatModalOpen(false);
      showToast(`Conversation ready with ${peer.name || 'peer'}!`);
    } catch (err: any) {
      showToast(err.message || 'Could not start conversation.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadLessons = async () => {
    try {
      const list = await apiService.getLessons();
      setAvailableLessons(list);
    } catch (err) {
      console.error('Failed to load lessons for context:', err);
    }
  };

  const loadMessages = async (convId: string) => {
    if (!currentUser?.id) return;
    try {
      const msgs = await messageService.getMessages(convId, currentUser.id);
      setMessages(msgs);

      // Check if conversation has an active learning context
      const conv = conversations.find((c) => c.conversation.id === convId);
      if (conv?.conversation.activeLessonContext && !initialLessonContext) {
        setActiveLessonContext(conv.conversation.activeLessonContext);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, customContent?: string) => {
    if (e) e.preventDefault();
    const textToSend = (customContent || inputText).trim();
    if (!textToSend || !activeConversationId || !currentUser?.id || isSending) return;

    setIsSending(true);
    try {
      const newMsg = await messageService.sendMessage(
        activeConversationId,
        textToSend,
        currentUser.id,
        activeLessonContext
      );

      setMessages((prev) => [...prev, newMsg]);
      setInputText('');

      // Refresh conversations list to update snippet & timestamps
      const updatedConvs = await messageService.getConversations(currentUser.id);
      setConversations(updatedConvs);

      // Simulate realistic delivery progression: SENT -> DELIVERED
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) => (m.id === newMsg.id ? { ...m, status: 'DELIVERED' } : m))
        );
      }, 1000);
    } catch (err: any) {
      showToast(err.message || 'Failed to send message. Please retry.');
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleSelectConversation = (convId: string) => {
    setActiveConversationId(convId);
    const target = conversations.find((c) => c.conversation.id === convId);
    if (target?.conversation.activeLessonContext) {
      setActiveLessonContext(target.conversation.activeLessonContext);
    }
  };

  const toggleTranslation = (messageId: string) => {
    setTranslatedMessages((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  const handleBlockUser = async () => {
    if (!currentUser?.id || !activeConversation) return;
    try {
      await messageService.blockUser(
        currentUser.id,
        activeConversation.partnerId,
        activeConversation.partnerName
      );
      setBlockModalOpen(false);
      showToast(`Blocked ${activeConversation.partnerName}. Conversation hidden.`);
      await loadConversations();
      setActiveConversationId(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to block user.');
    }
  };

  const handleReportUser = async () => {
    if (!currentUser?.id || !activeConversation) return;
    try {
      await messageService.reportUser({
        reporterUserId: currentUser.id,
        reportedUserId: activeConversation.partnerId,
        conversationId: activeConversation.conversation.id,
        reason: reportReason,
        details: reportDetails,
      });
      setReportModalOpen(false);
      setReportDetails('');
      showToast(`Report submitted. Our campus safety team will review this.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to submit report.');
    }
  };

  const handleAttachLesson = (lesson: Lesson) => {
    const firstModule = lesson.modules && lesson.modules.length > 0 ? lesson.modules[0] : undefined;
    setActiveLessonContext({
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      moduleId: firstModule?.id,
      moduleTitle: firstModule?.title,
      progressPercent: lesson.progressPercent || 0,
      skillName: lesson.skill,
      category: lesson.category,
    });
    setIsContextPickerOpen(false);
    showToast(`Attached lesson context: ${lesson.title}`);
  };

  const activeConversation = conversations.find(
    (c) => c.conversation.id === activeConversationId
  );

  // Filter conversations by query and tabs
  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      c.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessageSnippet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.partnerProgram.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'mentors') return c.partnerRole === 'mentor';
    if (activeTab === 'learners') return c.partnerRole === 'learner';
    return true;
  });

  // Get suggested message starters
  const suggestedStarters = nlpService.getSuggestedStarters(
    activeLessonContext,
    activeConversation?.partnerRole === 'mentor' ? 'learner' : 'mentor'
  );

  // Status icon component
  const renderStatus = (status: MessageStatus) => {
    switch (status) {
      case 'SENDING':
        return <span className="material-symbols-outlined text-[13px] animate-spin text-[#8b8a9d]">progress_activity</span>;
      case 'SENT':
        return <span className="material-symbols-outlined text-[14px] text-white/70" title="Sent">done</span>;
      case 'DELIVERED':
        return <span className="material-symbols-outlined text-[14px] text-white/90" title="Delivered">done_all</span>;
      case 'READ':
        return <span className="material-symbols-outlined text-[14px] text-[#82f5c1]" title="Read by peer">done_all</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#131b2e] text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl border border-white/10 flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[#82f5c1] text-[18px]">verified</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Split Layout */}
      <div className="bg-white rounded-3xl shadow-sm border border-[#eaedff] overflow-hidden flex flex-col md:flex-row h-[calc(100vh-140px)] min-h-[580px]">
        {/* LEFT PANE: Conversation List */}
        <div className="w-full md:w-80 lg:w-96 border-r border-[#eaedff] flex flex-col bg-[#fbfbfe]">
          {/* List Header */}
          <div className="p-4 sm:p-5 border-b border-[#eaedff] space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3525cd] text-[22px]">forum</span>
                <h1 className="font-extrabold text-lg text-[#131b2e]">Peer Messages</h1>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-[#e2e7ff] text-[#3525cd] text-[11px] font-bold">
                  {conversations.length} Active
                </span>
                <button
                  onClick={() => setIsNewChatModalOpen(true)}
                  className="px-2.5 py-1 rounded-xl bg-[#3525cd] text-white text-xs font-semibold hover:opacity-95 transition-all flex items-center gap-1 shadow-xs"
                  title="Start a new message with a campus peer or mentor"
                >
                  <span className="material-symbols-outlined text-[15px]">edit_square</span>
                  <span>New</span>
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#8b8a9d] text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search peers or message text..."
                className="w-full pl-9 pr-4 py-2 bg-[#f2f3ff] rounded-xl text-xs text-[#131b2e] placeholder-[#8b8a9d] focus:outline-none focus:ring-2 focus:ring-[#3525cd]/20 transition-all border border-transparent focus:border-[#3525cd]/40"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-[#8b8a9d] hover:text-[#131b2e]"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-[#f2f3ff] rounded-xl">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all text-center ${
                  activeTab === 'all'
                    ? 'bg-white text-[#3525cd] shadow-xs'
                    : 'text-[#464555] hover:text-[#131b2e]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('mentors')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all text-center ${
                  activeTab === 'mentors'
                    ? 'bg-white text-[#3525cd] shadow-xs'
                    : 'text-[#464555] hover:text-[#131b2e]'
                }`}
              >
                Mentors
              </button>
              <button
                onClick={() => setActiveTab('learners')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all text-center ${
                  activeTab === 'learners'
                    ? 'bg-white text-[#3525cd] shadow-xs'
                    : 'text-[#464555] hover:text-[#131b2e]'
                }`}
              >
                Learners
              </button>
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#f2f3ff]">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-[#8b8a9d] space-y-2">
                <span className="material-symbols-outlined text-[28px] animate-spin text-[#3525cd]">
                  progress_activity
                </span>
                <p>Loading conversations...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8b8a9d] space-y-3">
                <span className="material-symbols-outlined text-[36px] text-[#c4c7c5]">
                  chat_bubble_outline
                </span>
                <p className="font-semibold text-[#131b2e]">No conversations found</p>
                <p>Start a conversation with a campus peer or explore mentors to swap skills.</p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
                  <button
                    onClick={() => setIsNewChatModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-[#3525cd] text-white text-xs font-semibold hover:opacity-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit_square</span>
                    <span>Start New Message</span>
                  </button>
                  <button
                    onClick={() => onNavigate('connections')}
                    className="px-4 py-2 rounded-xl bg-[#f2f3ff] text-[#131b2e] text-xs font-semibold hover:bg-[#eaedff] transition-all"
                  >
                    View Connections
                  </button>
                </div>
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isActive = c.conversation.id === activeConversationId;
                return (
                  <button
                    key={c.conversation.id}
                    onClick={() => handleSelectConversation(c.conversation.id)}
                    className={`w-full p-4 text-left flex items-start gap-3 transition-all ${
                      isActive
                        ? 'bg-[#eef0ff] border-l-4 border-[#3525cd]'
                        : 'hover:bg-[#f6f7ff] border-l-4 border-transparent'
                    }`}
                  >
                    {/* Avatar with Availability Indicator */}
                    <div className="relative shrink-0">
                      <img
                        src={c.partnerAvatar}
                        alt={c.partnerName}
                        className="w-11 h-11 rounded-2xl object-cover ring-2 ring-white shadow-xs"
                      />
                      {c.isOnline && (
                        <span
                          className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#006c4a] ring-2 ring-white"
                          title="Online & Available"
                        />
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-bold text-xs text-[#131b2e] truncate">
                          {c.partnerName}
                        </span>
                        <span className="text-[10px] text-[#8b8a9d] shrink-0 font-medium">
                          {c.lastMessageTimestamp}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md uppercase tracking-wider ${
                            c.partnerRole === 'mentor'
                              ? 'bg-[#e2e7ff] text-[#3525cd]'
                              : 'bg-[#d2f8e5] text-[#00714e]'
                          }`}
                        >
                          {c.partnerRole}
                        </span>
                        <span className="text-[10px] text-[#464555] truncate">
                          {c.partnerProgram}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-[#464555] truncate font-normal">
                          {c.lastMessageSnippet}
                        </p>
                        {c.unreadCount > 0 && (
                          <span className="shrink-0 min-w-4 h-4 px-1 rounded-full bg-[#ba1a1a] text-white text-[10px] font-bold flex items-center justify-center">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: Active Chat Conversation */}
        {activeConversation ? (
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {/* Chat Top Header */}
            <div className="p-4 border-b border-[#eaedff] flex items-center justify-between bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={activeConversation.partnerAvatar}
                    alt={activeConversation.partnerName}
                    className="w-10 h-10 rounded-2xl object-cover ring-2 ring-[#eaedff]"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#006c4a] ring-2 ring-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-sm text-[#131b2e]">
                      {activeConversation.partnerName}
                    </h2>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        activeConversation.partnerRole === 'mentor'
                          ? 'bg-[#e2e7ff] text-[#3525cd]'
                          : 'bg-[#d2f8e5] text-[#00714e]'
                      }`}
                    >
                      {activeConversation.partnerRole === 'mentor' ? 'Peer Mentor' : 'Learner'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#464555]">
                    {activeConversation.partnerProgram} • Online & Active in Term
                  </p>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsContextPickerOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-[#f2f3ff] text-[#3525cd] hover:bg-[#e2e7ff] text-xs font-semibold transition-all flex items-center gap-1.5"
                  title="Attach or reference a lesson"
                >
                  <span className="material-symbols-outlined text-[16px]">menu_book</span>
                  <span className="hidden sm:inline">Attach Lesson</span>
                </button>

                <button
                  onClick={() => setReportModalOpen(true)}
                  className="p-2 rounded-xl text-[#8b8a9d] hover:text-[#ba1a1a] hover:bg-[#fff0f0] transition-all"
                  title="Report user or issue"
                >
                  <span className="material-symbols-outlined text-[18px]">flag</span>
                </button>

                <button
                  onClick={() => setBlockModalOpen(true)}
                  className="p-2 rounded-xl text-[#8b8a9d] hover:text-[#ba1a1a] hover:bg-[#fff0f0] transition-all"
                  title="Block this user"
                >
                  <span className="material-symbols-outlined text-[18px]">block</span>
                </button>
              </div>
            </div>

            {/* Active Learning Context Banner (Context Awareness) */}
            {activeLessonContext && (
              <div className="px-4 py-2.5 bg-[#f5f6ff] border-b border-[#eaedff] flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-[#3525cd] text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[14px]">school</span>
                  </span>
                  <div className="truncate">
                    <span className="font-semibold text-[#131b2e]">
                      {activeLessonContext.lessonTitle}
                    </span>
                    {activeLessonContext.moduleTitle && (
                      <span className="text-[#464555] font-normal">
                        {' '}
                        • {activeLessonContext.moduleTitle}
                      </span>
                    )}
                    {activeLessonContext.progressPercent !== undefined && (
                      <span className="ml-2 font-bold text-[#006c4a]">
                        ({activeLessonContext.progressPercent}% Completed)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      if (activeLessonContext.lessonId) {
                        onNavigate('lesson-room');
                      }
                    }}
                    className="text-[11px] font-semibold text-[#3525cd] hover:underline"
                  >
                    Open Lesson
                  </button>
                  <button
                    onClick={() => setActiveLessonContext(undefined)}
                    className="text-[#8b8a9d] hover:text-[#131b2e]"
                    title="Dismiss Context Banner"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              </div>
            )}

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#fbfbfe]">
              {/* Privacy / Security Notice */}
              <div className="max-w-md mx-auto p-3 rounded-2xl bg-[#eaedff]/60 border border-[#eaedff] text-center text-[11px] text-[#464555] space-y-1">
                <div className="flex items-center justify-center gap-1 font-semibold text-[#3525cd]">
                  <span className="material-symbols-outlined text-[14px]">lock</span>
                  <span>End-to-End Peer Privacy Enforced</span>
                </div>
                <p>
                  Messages are private between you and {activeConversation.partnerName}. Phone
                  numbers and emails are kept masked by default.
                </p>
              </div>

              {/* Message Bubbles */}
              {messages.map((msg, idx) => {
                const isMine = msg.senderId === currentUser?.id;
                const isTranslated = !!translatedMessages[msg.id];
                const showTranslationButton =
                  msg.languageInfo &&
                  msg.languageInfo.englishTranslation &&
                  msg.languageInfo.detectedLanguage !== 'English';

                return (
                  <div
                    key={msg.id || idx}
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} space-y-1.5`}
                  >
                    {/* Referenced Lesson Context Card if present on message */}
                    {msg.referencedLesson && (
                      <div
                        className={`p-2.5 rounded-xl border text-xs max-w-sm flex items-center gap-2 ${
                          isMine
                            ? 'bg-[#eef0ff] border-[#3525cd]/30 text-[#131b2e]'
                            : 'bg-white border-[#eaedff] text-[#131b2e]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px] text-[#3525cd]">
                          auto_stories
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold truncate text-[11px]">
                            {msg.referencedLesson.lessonTitle}
                          </p>
                          {msg.referencedLesson.moduleTitle && (
                            <p className="text-[10px] text-[#464555] truncate">
                              {msg.referencedLesson.moduleTitle}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Bubble Content */}
                    <div
                      className={`max-w-md sm:max-w-lg px-4 py-3 text-xs leading-relaxed shadow-xs transition-all ${
                        isMine
                          ? 'bg-[#3525cd] text-white rounded-2xl rounded-tr-xs'
                          : 'bg-white text-[#131b2e] border border-[#eaedff] rounded-2xl rounded-tl-xs'
                      }`}
                    >
                      {/* Original text is always preserved */}
                      <p className="whitespace-pre-wrap font-medium">{msg.content}</p>

                      {/* On-demand translation toggle */}
                      {isTranslated && msg.languageInfo?.englishTranslation && (
                        <div
                          className={`mt-2 pt-2 border-t text-[11px] ${
                            isMine
                              ? 'border-white/20 text-[#82f5c1]'
                              : 'border-[#f2f3ff] text-[#006c4a]'
                          }`}
                        >
                          <span className="font-bold">Translation ({msg.languageInfo.detectedLanguage}): </span>
                          <span>{msg.languageInfo.englishTranslation}</span>
                        </div>
                      )}
                    </div>

                    {/* Message Footnotes: Language badge, translate button, timestamp, status */}
                    <div className="flex items-center gap-2 text-[10px] text-[#8b8a9d] px-1 font-medium">
                      {/* Language / Tanglish badge if non-English detected */}
                      {msg.languageInfo && msg.languageInfo.detectedLanguage !== 'English' && (
                        <span className="px-1.5 py-0.2 rounded-md bg-[#eaedff] text-[#3525cd] font-bold text-[9px]">
                          {msg.languageInfo.detectedLanguage}
                        </span>
                      )}

                      {/* Optional Translation assistance pill */}
                      {showTranslationButton && (
                        <button
                          onClick={() => toggleTranslation(msg.id)}
                          className="text-[#3525cd] hover:underline font-semibold text-[10px]"
                        >
                          {isTranslated ? 'Hide Translation' : 'Translate to English'}
                        </button>
                      )}

                      <span>{msg.createdAt}</span>

                      {/* Status tick for my messages */}
                      {isMine && renderStatus(msg.status)}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Context-Aware Message Starters */}
            {suggestedStarters.length > 0 && (
              <div className="px-4 py-2 border-t border-[#eaedff] bg-white flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[10px] font-bold text-[#8b8a9d] uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] text-[#3525cd]">
                    lightbulb
                  </span>
                  <span>Suggestions:</span>
                </span>
                {suggestedStarters.map((starter, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(undefined, starter)}
                    className="px-3 py-1 rounded-full bg-[#f2f3ff] text-[#3525cd] hover:bg-[#e2e7ff] text-[11px] font-semibold shrink-0 transition-all border border-[#eaedff]"
                  >
                    “{starter}”
                  </button>
                ))}
              </div>
            )}

            {/* Message Composer Input Area */}
            <div className="p-4 border-t border-[#eaedff] bg-white">
              <form onSubmit={handleSendMessage} className="space-y-2">
                <div className="relative rounded-2xl bg-[#f2f3ff] border border-[#eaedff] focus-within:border-[#3525cd] focus-within:bg-white transition-all p-2 flex flex-col">
                  <textarea
                    ref={inputRef}
                    rows={2}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={`Message ${activeConversation.partnerName} in English, Tanglish, Tamil, Hindi, Telugu... (Press Enter to send)`}
                    className="w-full bg-transparent resize-none text-xs text-[#131b2e] placeholder-[#8b8a9d] focus:outline-none p-1"
                    maxLength={1000}
                  />

                  {/* Composer Footer Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-black/5 mt-1 text-[11px] text-[#8b8a9d]">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsContextPickerOpen(true)}
                        className="hover:text-[#3525cd] flex items-center gap-1 font-medium transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">bookmark_add</span>
                        <span>{activeLessonContext ? 'Change Context' : 'Add Lesson Context'}</span>
                      </button>

                      <span className="text-[10px]">
                        {inputText.length} / 1000
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={!inputText.trim() || isSending}
                      className={`px-4 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                        inputText.trim() && !isSending
                          ? 'bg-[#3525cd] text-white shadow-xs hover:opacity-95'
                          : 'bg-[#eaedff] text-[#8b8a9d] cursor-not-allowed'
                      }`}
                    >
                      <span>Send</span>
                      <span className="material-symbols-outlined text-[15px]">send</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-[#f2f3ff] text-[#3525cd] flex items-center justify-center">
              <span className="material-symbols-outlined text-[32px]">chat</span>
            </div>
            <h3 className="font-extrabold text-lg text-[#131b2e]">Select a Conversation</h3>
            <p className="text-xs text-[#464555] max-w-sm">
              Choose a connected mentor or learner from the list on the left to review lesson questions
              and chat.
            </p>
          </div>
        )}
      </div>

      {/* MODAL 1: Lesson Context Picker */}
      {isContextPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#eaedff]">
            <div className="flex items-center justify-between border-b border-[#eaedff] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3525cd] text-[20px]">menu_book</span>
                <h3 className="font-bold text-base text-[#131b2e]">Attach Lesson to Chat</h3>
              </div>
              <button
                onClick={() => setIsContextPickerOpen(false)}
                className="text-[#8b8a9d] hover:text-[#131b2e]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="text-xs text-[#464555]">
              Select a workshop or module you want to discuss with your mentor. Your progress will be
              helpfully referenced.
            </p>

            <div className="max-h-72 overflow-y-auto divide-y divide-[#f2f3ff] space-y-1">
              {availableLessons.map((l) => (
                <div
                  key={l.id}
                  onClick={() => handleAttachLesson(l)}
                  className="p-3 rounded-2xl hover:bg-[#f2f3ff] cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="min-w-0 pr-3">
                    <p className="font-bold text-xs text-[#131b2e] truncate">{l.title}</p>
                    <p className="text-[11px] text-[#464555]">
                      {l.skill} • {l.skillLevel}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#e2e7ff] text-[#3525cd] text-[10px] font-bold shrink-0">
                    Attach
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Report User Modal */}
      {reportModalOpen && activeConversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#eaedff]">
            <div className="flex items-center gap-2 text-[#ba1a1a]">
              <span className="material-symbols-outlined text-[22px]">flag</span>
              <h3 className="font-bold text-base text-[#131b2e]">
                Report {activeConversation.partnerName}
              </h3>
            </div>
            <p className="text-xs text-[#464555]">
              Campus moderators will review flagged conversations according to SkillSwap Honor Code.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#131b2e] block mb-1">Reason</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full p-2.5 bg-[#f2f3ff] rounded-xl border border-[#eaedff] text-xs font-medium"
                >
                  <option>Offensive or inappropriate content</option>
                  <option>Spam or unapproved commercial solicitation</option>
                  <option>Harassment or pressure to share personal info</option>
                  <option>Academic dishonesty or cheating</option>
                  <option>Other collegiate violation</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#131b2e] block mb-1">Additional details</label>
                <textarea
                  rows={3}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Provide context on what happened..."
                  className="w-full p-2.5 bg-[#f2f3ff] rounded-xl border border-[#eaedff] text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eaedff]">
              <button
                onClick={() => setReportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#464555] hover:bg-[#f2f3ff]"
              >
                Cancel
              </button>
              <button
                onClick={handleReportUser}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#ba1a1a] text-white hover:opacity-95"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Block User Modal */}
      {blockModalOpen && activeConversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#eaedff]">
            <div className="flex items-center gap-2 text-[#ba1a1a]">
              <span className="material-symbols-outlined text-[22px]">block</span>
              <h3 className="font-bold text-base text-[#131b2e]">
                Block {activeConversation.partnerName}?
              </h3>
            </div>
            <p className="text-xs text-[#464555] leading-relaxed">
              They will no longer be able to message you, propose swaps, or see your learning progress.
              You can unblock them at any time in your Privacy Settings.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eaedff]">
              <button
                onClick={() => setBlockModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#464555] hover:bg-[#f2f3ff]"
              >
                Cancel
              </button>
              <button
                onClick={handleBlockUser}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#ba1a1a] text-white hover:opacity-95"
              >
                Block User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Start New Chat with Campus Peer */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#eaedff] max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#eaedff]">
              <div className="flex items-center gap-2 text-[#3525cd]">
                <span className="material-symbols-outlined text-[24px]">rate_review</span>
                <h3 className="font-extrabold text-lg text-[#131b2e]">
                  Start New Message
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsNewChatModalOpen(false);
                  setPeerSearchQuery('');
                }}
                className="p-1 rounded-full text-[#8b8a9d] hover:text-[#131b2e] hover:bg-[#f2f3ff]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="text-xs text-[#464555]">
              Select a fellow campus peer or mentor to initiate a skill-swap conversation.
            </p>

            {/* Peer Search Input */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#8b8a9d] text-[18px]">
                search
              </span>
              <input
                type="text"
                value={peerSearchQuery}
                onChange={(e) => setPeerSearchQuery(e.target.value)}
                placeholder="Search peers by name, department, or skill..."
                className="w-full pl-9 pr-4 py-2 bg-[#f2f3ff] rounded-xl text-xs text-[#131b2e] placeholder-[#8b8a9d] focus:outline-none focus:ring-2 focus:ring-[#3525cd]/20 transition-all border border-transparent focus:border-[#3525cd]/40"
              />
              {peerSearchQuery && (
                <button
                  onClick={() => setPeerSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-[#8b8a9d] hover:text-[#131b2e]"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {/* Candidate Peers List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#f2f3ff] pr-1 space-y-2 max-h-[360px]">
              {candidatePeers
                .filter((p) => {
                  if (!peerSearchQuery.trim()) return true;
                  const q = peerSearchQuery.toLowerCase();
                  return (
                    p.name?.toLowerCase().includes(q) ||
                    p.department?.toLowerCase().includes(q) ||
                    p.university?.toLowerCase().includes(q) ||
                    (p.teachingSkills &&
                      p.teachingSkills.some((ts: any) => ts.name?.toLowerCase().includes(q)))
                  );
                })
                .map((peer) => (
                  <div
                    key={peer.id}
                    className="p-3 rounded-2xl hover:bg-[#f6f7ff] transition-all flex items-center justify-between gap-3 border border-transparent hover:border-[#eaedff]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={peer.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(peer.name || 'Peer')}`}
                        alt={peer.name}
                        className="w-10 h-10 rounded-2xl object-cover ring-2 ring-[#eaedff] shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-[#131b2e] truncate">{peer.name}</span>
                          {peer.isVerified && (
                            <span className="material-symbols-outlined text-[14px] text-[#006c4a]" title=".edu Verified">
                              verified
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#464555] truncate">
                          {peer.department || 'Student'} • {peer.university || 'Campus'}
                        </p>
                        {peer.teachingSkills && peer.teachingSkills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {peer.teachingSkills.slice(0, 2).map((ts: any, i: number) => (
                              <span key={i} className="px-1.5 py-0.5 rounded-md bg-[#e2e7ff] text-[#3525cd] text-[10px] font-medium">
                                {ts.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartChatWithPeer(peer)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#3525cd] text-white text-xs font-semibold hover:opacity-95 transition-all flex items-center gap-1 shrink-0 shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[15px]">send</span>
                      <span>Chat</span>
                    </button>
                  </div>
                ))}
              {candidatePeers.length === 0 && (
                <div className="p-6 text-center text-xs text-[#8b8a9d]">
                  No other students found in network.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#eaedff] flex justify-end">
              <button
                onClick={() => {
                  setIsNewChatModalOpen(false);
                  setPeerSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#464555] hover:bg-[#f2f3ff]"
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
