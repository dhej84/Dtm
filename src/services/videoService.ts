import { PublicVideo } from '../types';
import { httpClient } from './api/httpClient';

export const videoService = {
  /**
   * Get all public videos from all users across the platform
   */
  async getPublicVideos(): Promise<PublicVideo[]> {
    try {
      const res = await httpClient.get<PublicVideo[]>('/videos/public');
      if (Array.isArray(res)) {
        return res;
      }
      return [];
    } catch (err) {
      console.warn('Failed to fetch public videos from backend:', err);
      return [];
    }
  },

  /**
   * Get videos created specifically by the currently logged-in user
   */
  async getMyVideos(): Promise<PublicVideo[]> {
    try {
      const res = await httpClient.get<PublicVideo[]>('/videos/my');
      if (Array.isArray(res)) {
        return res;
      }
      return [];
    } catch (err) {
      console.warn('Failed to fetch my videos from backend:', err);
      return [];
    }
  },

  /**
   * Search and filter videos across all registered users
   */
  async getVideos(params?: { skill?: string; category?: string; level?: string; q?: string }): Promise<PublicVideo[]> {
    try {
      const query = new URLSearchParams();
      if (params?.skill && params.skill !== 'All') query.set('skill', params.skill);
      if (params?.category && params.category !== 'All') query.set('category', params.category);
      if (params?.level && params.level !== 'All') query.set('level', params.level);
      if (params?.q) query.set('q', params.q);

      const url = `/videos/search${query.toString() ? `?${query.toString()}` : ''}`;
      const res = await httpClient.get<PublicVideo[]>(url);
      if (Array.isArray(res)) {
        return res;
      }
      return [];
    } catch (err) {
      console.warn('Failed to query videos from backend:', err);
      return [];
    }
  },

  /**
   * Dedicated global video discovery search across all registered users' uploads
   */
  async searchVideos(queryText: string, category?: string, level?: string): Promise<PublicVideo[]> {
    return this.getVideos({
      q: queryText,
      category: category && category !== 'All' ? category : undefined,
      level: level && level !== 'All' ? level : undefined,
    });
  },
};
