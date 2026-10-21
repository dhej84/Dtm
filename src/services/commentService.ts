import { COMMENT_ENDPOINTS, USE_MOCK_API } from './api/config';
import { httpClient } from './api/httpClient';
import { Comment } from '../types';
import { userService } from './userService';

const COMMENTS_KEY = 'skillswap_comments_store';

function getStoredComments(): Record<string, Comment[]> {
  const saved = localStorage.getItem(COMMENTS_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  return {
    'lesson-1': [
      {
        id: 'c1',
        lessonId: 'lesson-1',
        authorName: 'Marcus Vance',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        authorProgram: 'CS • Cal',
        text: 'Maya explains Raft replication clearer than any of our CS162 lectures! The diagrams on leader election made the term state transitions crystal clear.',
        timestamp: '2 hours ago',
        likes: 6,
      },
      {
        id: 'c2',
        lessonId: 'lesson-1',
        authorName: 'Chloe Bennett',
        authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        authorProgram: 'CS • Stanford',
        text: 'Loved the hands-on lab. We caught a tricky partition race condition in step 3 together. Highly recommend swapping with Maya.',
        timestamp: 'Yesterday',
        likes: 4,
      },
    ],
  };
}

function saveStoredComments(data: Record<string, Comment[]>): void {
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(data));
}

export const commentService = {
  /**
   * Get all comments/feedback for a lesson or target entity
   */
  async getComments(lessonId: string): Promise<Comment[]> {
    if (!USE_MOCK_API) {
      try {
        return await httpClient.get<Comment[]>(COMMENT_ENDPOINTS.GET_BY_LESSON(lessonId));
      } catch (err) {
        console.warn(`Backend comments for lesson ${lessonId} failed, loading locally:`, err);
      }
    }

    const store = getStoredComments();
    return store[lessonId] || [];
  },

  /**
   * Post a new comment or review
   */
  async addComment(lessonId: string, text: string, rating: number = 5): Promise<Comment> {
    if (!USE_MOCK_API) {
      try {
        return await httpClient.post<Comment>(COMMENT_ENDPOINTS.POST_COMMENT(lessonId), {
          text,
          rating,
        });
      } catch (err) {
        console.warn(`Backend comment post failed, persisting locally:`, err);
      }
    }

    const profile = await userService.getProfile();
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      lessonId,
      authorId: profile?.id || 'anonymous',
      authorName: profile?.name || 'Campus Student',
      authorAvatar: profile?.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=CS',
      authorProgram: profile ? `${profile.department} • ${profile.university}` : 'Campus Student',
      text,
      timestamp: 'Just now',
      likes: 0,
      isLiked: false,
    };

    const store = getStoredComments();
    const existing = store[lessonId] || [];
    store[lessonId] = [newComment, ...existing];
    saveStoredComments(store);

    return newComment;
  },

  /**
   * Delete a comment by ID
   */
  async deleteComment(commentId: string, lessonId: string): Promise<boolean> {
    if (!USE_MOCK_API) {
      try {
        await httpClient.delete(COMMENT_ENDPOINTS.DELETE(commentId));
        return true;
      } catch (err) {
        console.warn(`Backend comment delete failed, deleting locally:`, err);
      }
    }

    const store = getStoredComments();
    if (store[lessonId]) {
      store[lessonId] = store[lessonId].filter((c) => c.id !== commentId);
      saveStoredComments(store);
    }
    return true;
  },
};
