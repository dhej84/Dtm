import {
  ChatMessage,
  Conversation,
  ConversationSummary,
  LessonContext,
  MessageReport,
  MessageStatus,
  UserProfile,
} from '../types';
import { nlpService } from './nlpService';
import { userService } from './userService';
import { httpClient } from './api/httpClient';
import { CONVERSATION_ENDPOINTS, MESSAGE_ENDPOINTS, USE_MOCK_API } from './api/config';
import { tokenStorage } from './api/tokenStorage';

const CONVERSATIONS_STORAGE_KEY = 'skillswap_conversations_v1';
const MESSAGES_STORAGE_KEY = 'skillswap_messages_v1';
const BLOCKED_USERS_STORAGE_KEY = 'skillswap_blocked_users_v1';
const REPORTS_STORAGE_KEY = 'skillswap_reports_v1';

const SEED_CONVERSATIONS: Conversation[] = [];
const SEED_MESSAGES: Record<string, ChatMessage[]> = {};

export const messageService = {
  /**
   * Initializes local storage stores if not already populated
   */
  initStorage() {
    if (!localStorage.getItem(CONVERSATIONS_STORAGE_KEY)) {
      localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(SEED_CONVERSATIONS));
    }
    if (!localStorage.getItem(MESSAGES_STORAGE_KEY)) {
      localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(SEED_MESSAGES));
    }
    if (!localStorage.getItem(BLOCKED_USERS_STORAGE_KEY)) {
      localStorage.setItem(BLOCKED_USERS_STORAGE_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(REPORTS_STORAGE_KEY)) {
      localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify([]));
    }
  },

  getRawConversations(): Conversation[] {
    this.initStorage();
    try {
      return JSON.parse(localStorage.getItem(CONVERSATIONS_STORAGE_KEY) || '[]');
    } catch {
      return SEED_CONVERSATIONS;
    }
  },

  saveConversations(conversations: Conversation[]) {
    localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
  },

  getRawMessages(): Record<string, ChatMessage[]> {
    this.initStorage();
    try {
      return JSON.parse(localStorage.getItem(MESSAGES_STORAGE_KEY) || '{}');
    } catch {
      return SEED_MESSAGES;
    }
  },

  saveMessages(messagesMap: Record<string, ChatMessage[]>) {
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messagesMap));
  },

  getBlockedUserIds(currentUserId: string): string[] {
    this.initStorage();
    try {
      const blocked: { blockerUserId: string; blockedUserId: string }[] =
        JSON.parse(localStorage.getItem(BLOCKED_USERS_STORAGE_KEY) || '[]');
      return blocked
        .filter((b) => b.blockerUserId === currentUserId)
        .map((b) => b.blockedUserId);
    } catch {
      return [];
    }
  },

  /**
   * Returns all conversations for the given user formatted as summaries
   */
  async getConversations(currentUserId: string): Promise<ConversationSummary[]> {
    if (!USE_MOCK_API && tokenStorage.getToken()) {
      try {
        const summaries = await httpClient.get<ConversationSummary[]>(CONVERSATION_ENDPOINTS.LIST);
        if (Array.isArray(summaries)) {
          const rawConvs = summaries.map((s) => s.conversation).filter(Boolean);
          if (rawConvs.length > 0) {
            this.saveConversations(rawConvs);
          }
          return summaries;
        }
      } catch (err) {
        console.warn('Backend conversations fetch failed, checking local store:', err);
      }
    }

    const rawConvs = this.getRawConversations();
    const rawMessages = this.getRawMessages();
    const blockedIds = this.getBlockedUserIds(currentUserId);

    // Filter conversations where current user is a participant and not blocked
    const userConvs = rawConvs.filter(
      (c) =>
        (c.participant1Id === currentUserId || c.participant2Id === currentUserId) &&
        !blockedIds.includes(c.participant1Id === currentUserId ? c.participant2Id : c.participant1Id)
    );

    const summaries: ConversationSummary[] = userConvs.map((conv) => {
      const isUser1 = conv.participant1Id === currentUserId;
      const partnerId = isUser1 ? conv.participant2Id : conv.participant1Id;
      const partnerName = isUser1 ? conv.participant2Name : conv.participant1Name;
      const partnerAvatar = isUser1 ? conv.participant2Avatar : conv.participant1Avatar;
      const partnerProgram = (isUser1 ? conv.participant2Program : conv.participant1Program) || 'Campus Peer';
      const partnerRole = isUser1 ? conv.participant2Role : conv.participant1Role;
      const unreadCount = isUser1 ? conv.unreadCountUser1 : conv.unreadCountUser2;

      const msgs = rawMessages[conv.id] || [];
      const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : conv.lastMessage;

      return {
        conversation: conv,
        partnerId,
        partnerName,
        partnerAvatar,
        partnerProgram,
        partnerRole,
        unreadCount,
        lastMessageSnippet: lastMsg ? lastMsg.content : 'Started connection',
        lastMessageTimestamp: lastMsg ? lastMsg.createdAt : conv.lastMessageAt,
        lastMessageStatus: lastMsg?.status,
        isOnline: true,
      };
    });

    return summaries.sort((a, b) => {
      // Sort unread first, then by recent
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (b.unreadCount > 0 && a.unreadCount === 0) return 1;
      return 0;
    });
  },

  /**
   * Retrieves messages for a specific conversation and marks unread as READ
   */
  async getMessages(conversationId: string, currentUserId: string): Promise<ChatMessage[]> {
    if (!USE_MOCK_API && tokenStorage.getToken()) {
      try {
        const backendMsgs = await httpClient.get<ChatMessage[]>(CONVERSATION_ENDPOINTS.MESSAGES(conversationId));
        if (Array.isArray(backendMsgs)) {
          const rawMessages = this.getRawMessages();
          rawMessages[conversationId] = backendMsgs;
          this.saveMessages(rawMessages);
          return backendMsgs;
        }
      } catch (err) {
        console.warn('Backend messages fetch failed, checking local store:', err);
      }
    }

    const rawMessages = this.getRawMessages();
    const msgs = rawMessages[conversationId] || [];

    // Mark any messages sent to current user as READ
    let stateChanged = false;
    for (const msg of msgs) {
      if (msg.senderId !== currentUserId && msg.status !== 'READ') {
        msg.status = 'READ';
        stateChanged = true;
      }
    }

    if (stateChanged) {
      rawMessages[conversationId] = msgs;
      this.saveMessages(rawMessages);

      // Reset unread count on conversation
      const rawConvs = this.getRawConversations();
      const targetConv = rawConvs.find((c) => c.id === conversationId);
      if (targetConv) {
        if (targetConv.participant1Id === currentUserId) {
          targetConv.unreadCountUser1 = 0;
        } else {
          targetConv.unreadCountUser2 = 0;
        }
        this.saveConversations(rawConvs);
      }
    }

    return msgs;
  },

  /**
   * Sends a message, triggers NLP analysis, and handles delivery state transitions
   */
  async sendMessage(
    conversationId: string,
    content: string,
    senderId: string,
    referencedLesson?: LessonContext
  ): Promise<ChatMessage> {
    const trimmed = content.trim();
    if (!trimmed) {
      throw new Error('Message content cannot be empty.');
    }
    if (trimmed.length > 1000) {
      throw new Error('Message exceeds 1000 characters limit.');
    }

    const languageInfo = nlpService.detectLanguageAndIntent(trimmed, referencedLesson);

    if (!USE_MOCK_API && tokenStorage.getToken()) {
      try {
        const sent = await httpClient.post<ChatMessage>(MESSAGE_ENDPOINTS.SEND, {
          conversationId,
          content: trimmed,
          referencedLesson,
          languageInfo,
        });
        if (sent && sent.id) {
          if (!sent.languageInfo && languageInfo) {
            sent.languageInfo = languageInfo;
          }
          // Sync into local messages cache
          const rawMessages = this.getRawMessages();
          const list = rawMessages[conversationId] || [];
          if (!list.some((m) => m.id === sent.id)) {
            list.push(sent);
          }
          rawMessages[conversationId] = list;
          this.saveMessages(rawMessages);

          // Update local conversation lastMessage
          const rawConvs = this.getRawConversations();
          const conv = rawConvs.find((c) => c.id === conversationId);
          if (conv) {
            conv.lastMessage = sent;
            conv.lastMessageAt = 'Just now';
            this.saveConversations(rawConvs);
          }
          return sent;
        }
      } catch (err: any) {
        console.error('Backend sendMessage call failed:', err);
        throw new Error(err.message || 'Failed to send message to backend database.');
      }
    }

    const rawConvs = this.getRawConversations();
    const conv = rawConvs.find((c) => c.id === conversationId);
    if (!conv) {
      throw new Error('Conversation not found.');
    }

    const isUser1 = conv.participant1Id === senderId;
    const recipientId = isUser1 ? conv.participant2Id : conv.participant1Id;
    const senderName = isUser1 ? conv.participant1Name : conv.participant2Name;
    const senderAvatar = isUser1 ? conv.participant1Avatar : conv.participant2Avatar;

    // Check if blocked
    const blockedList = this.getBlockedUserIds(senderId);
    if (blockedList.includes(recipientId)) {
      throw new Error('You cannot message this user because one of you has blocked communication.');
    }

    // Run NLP engine for language detection, code-mixing detection, and intent classification
    const localLanguageInfo = languageInfo || nlpService.detectLanguageAndIntent(trimmed, referencedLesson || conv.activeLessonContext);

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      conversationId,
      senderId,
      senderName,
      senderAvatar,
      recipientId,
      content: trimmed,
      createdAt: 'Just now',
      status: 'SENT',
      referencedLesson: referencedLesson || conv.activeLessonContext,
      languageInfo: localLanguageInfo,
    };

    // Save message
    const rawMessages = this.getRawMessages();
    const list = rawMessages[conversationId] || [];
    list.push(newMsg);
    rawMessages[conversationId] = list;
    this.saveMessages(rawMessages);

    // Update conversation metadata
    conv.lastMessage = newMsg;
    conv.lastMessageAt = 'Just now';
    if (referencedLesson) {
      conv.activeLessonContext = referencedLesson;
    }
    if (isUser1) {
      conv.unreadCountUser2 += 1;
    } else {
      conv.unreadCountUser1 += 1;
    }
    this.saveConversations(rawConvs);

    // Realistic delivery state progression: SENT -> DELIVERED
    setTimeout(() => {
      const currentMsgs = this.getRawMessages();
      const targetList = currentMsgs[conversationId];
      if (targetList) {
        const targetMsg = targetList.find((m) => m.id === newMsg.id);
        if (targetMsg && targetMsg.status === 'SENT') {
          targetMsg.status = 'DELIVERED';
          this.saveMessages(currentMsgs);
        }
      }
    }, 1200);

    return newMsg;
  },

  /**
   * Starts or retrieves a conversation between two users, attaching learning context
   */
  async startOrGetConversation(
    currentUserId: string,
    targetUserId: string,
    lessonContext?: LessonContext
  ): Promise<Conversation> {
    if (!USE_MOCK_API && tokenStorage.getToken()) {
      try {
        const conv = await httpClient.post<Conversation>(CONVERSATION_ENDPOINTS.START, {
          targetUserId,
          lessonContext,
        });
        if (conv && conv.id) {
          const rawConvs = this.getRawConversations();
          const idx = rawConvs.findIndex((c) => c.id === conv.id);
          if (idx >= 0) {
            rawConvs[idx] = conv;
          } else {
            rawConvs.unshift(conv);
          }
          this.saveConversations(rawConvs);
          return conv;
        }
      } catch (err) {
        console.warn('Backend startOrGetConversation failed, checking local store:', err);
      }
    }

    const rawConvs = this.getRawConversations();
    let conv = rawConvs.find(
      (c) =>
        (c.participant1Id === currentUserId && c.participant2Id === targetUserId) ||
        (c.participant1Id === targetUserId && c.participant2Id === currentUserId)
    );

    const selfProfile = JSON.parse(localStorage.getItem('skillswap_current_profile') || '{}');

    if (!conv) {
      conv = {
        id: `conv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        participant1Id: currentUserId,
        participant2Id: targetUserId,
        participant1Name: selfProfile.name || 'Campus Peer',
        participant1Avatar: selfProfile.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(selfProfile.name || 'Peer')}&backgroundColor=3525cd&textColor=ffffff`,
        participant1Role: 'learner',
        participant2Name: 'Campus Peer',
        participant2Avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(targetUserId)}&backgroundColor=006c4a&textColor=ffffff`,
        participant2Program: 'Student',
        participant2Role: 'mentor',
        lastMessageAt: 'Just now',
        unreadCountUser1: 0,
        unreadCountUser2: 0,
        activeLessonContext: lessonContext,
        createdAt: 'Just now',
      };
      rawConvs.unshift(conv);
    } else if (lessonContext) {
      conv.activeLessonContext = lessonContext;
    }

    this.saveConversations(rawConvs);
    return conv;
  },

  /**
   * Blocks a user
   */
  async blockUser(currentUserId: string, targetUserId: string, targetUserName: string): Promise<void> {
    this.initStorage();
    const blocked = JSON.parse(localStorage.getItem(BLOCKED_USERS_STORAGE_KEY) || '[]');
    blocked.push({
      id: `block-${Date.now()}`,
      blockerUserId: currentUserId,
      blockedUserId: targetUserId,
      blockedUserName: targetUserName,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(BLOCKED_USERS_STORAGE_KEY, JSON.stringify(blocked));
  },

  /**
   * Reports a user or message for review
   */
  async reportUser(report: Omit<MessageReport, 'id' | 'createdAt'>): Promise<void> {
    this.initStorage();
    const reports = JSON.parse(localStorage.getItem(REPORTS_STORAGE_KEY) || '[]');
    reports.push({
      ...report,
      id: `report-${Date.now()}`,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
  },

  /**
   * Global message and conversation search
   */
  async searchMessages(
    currentUserId: string,
    query: string
  ): Promise<{ conversation: Conversation; message: ChatMessage }[]> {
    const rawConvs = this.getRawConversations();
    const rawMessages = this.getRawMessages();
    const term = query.trim().toLowerCase();
    if (!term) return [];

    const results: { conversation: Conversation; message: ChatMessage }[] = [];

    const userConvs = rawConvs.filter(
      (c) => c.participant1Id === currentUserId || c.participant2Id === currentUserId
    );

    for (const conv of userConvs) {
      const msgs = rawMessages[conv.id] || [];
      for (const msg of msgs) {
        if (
          msg.content.toLowerCase().includes(term) ||
          msg.referencedLesson?.lessonTitle.toLowerCase().includes(term) ||
          msg.referencedLesson?.skillName?.toLowerCase().includes(term) ||
          msg.languageInfo?.topic?.toLowerCase().includes(term)
        ) {
          results.push({ conversation: conv, message: msg });
        }
      }
    }

    return results;
  }
};
