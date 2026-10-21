import { USER_ENDPOINTS, USE_MOCK_API } from './api/config';
import { httpClient } from './api/httpClient';
import { tokenStorage } from './api/tokenStorage';
import { Profile, PrivacySettings } from '../types';

const STORAGE_KEY = 'skillswap_current_profile';

function getLocalProfile(): Profile | null {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  return null;
}

function saveLocalProfile(profile: Profile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export const userService = {
  /**
   * Fetch current authenticated student's profile.
   */
  async getProfile(): Promise<Profile | null> {
    const token = tokenStorage.getToken();
    if (!token) {
      return null;
    }
    if (!USE_MOCK_API) {
      try {
        return await httpClient.get<Profile>(USER_ENDPOINTS.PROFILE);
      } catch (err: any) {
        if (err?.statusCode === 401 || err?.status === 401 || err?.isUnauthorized) {
          tokenStorage.clear();
          localStorage.removeItem(STORAGE_KEY);
          return null;
        }
        console.warn('Backend profile fetch failed, checking local session state:', err);
      }
    }
    return getLocalProfile();
  },

  /**
   * Update student profile fields
   */
  async updateProfile(updates: Partial<Profile>): Promise<Profile> {
    if (!USE_MOCK_API && tokenStorage.getToken()) {
      try {
        return await httpClient.patch<Profile>(USER_ENDPOINTS.UPDATE_PROFILE, updates);
      } catch (err) {
        console.warn('Backend update failed, persisting locally:', err);
      }
    }

    const current = getLocalProfile();
    if (!current) {
      throw new Error('Not authenticated.');
    }
    const updated: Profile = {
      ...current,
      ...updates,
      teachingSkills: updates.teachingSkills ?? current.teachingSkills,
      learningSkills: updates.learningSkills ?? current.learningSkills,
    };
    saveLocalProfile(updated);
    return updated;
  },

  /**
   * Get student details by ID (for viewing other students' profiles)
   */
  async getStudentById(id: string): Promise<Profile | null> {
    if (!USE_MOCK_API) {
      try {
        const endpoint = USER_ENDPOINTS.GET_STUDENT_BY_ID(id);
        return await httpClient.get<Profile>(endpoint);
      } catch (err) {
        console.warn(`Backend fetch for student ${id} failed, checking mock store:`, err);
      }
    }

    const current = getLocalProfile();
    if (current && current.id === id) return current;
    return null;
  },

  /**
   * Get all registered collegiate peer students from the backend database
   */
  async getAllStudents(): Promise<Profile[]> {
    try {
      const res = await httpClient.get<any>(`${USER_ENDPOINTS.ALL_STUDENTS}?includeCurrent=true`);
      if (Array.isArray(res)) return res;
      if (Array.isArray(res?.data)) return res.data;
      if (Array.isArray(res?.students)) return res.students;
      if (Array.isArray(res?.users)) return res.users;
    } catch (err) {
      console.error('Backend students fetch failed:', err);
      const current = getLocalProfile();
      return current ? [current] : [];
    }
    return [];
  },

  /**
   * Get registered SkillSwap users area with privacy-safe discovery data
   */
  async getSkillSwapUsers(filters?: {
    q?: string;
    department?: string;
    university?: string;
    skill?: string;
    level?: string;
    onlineOnly?: boolean;
    includeDemo?: boolean;
  }): Promise<Profile[]> {
    try {
      const params: Record<string, any> = {};
      if (filters?.q) params.q = filters.q;
      if (filters?.department && filters.department !== 'All') params.department = filters.department;
      if (filters?.university && filters.university !== 'All') params.university = filters.university;
      if (filters?.skill && filters.skill !== 'All') params.skill = filters.skill;
      if (filters?.level && filters.level !== 'All') params.level = filters.level;
      if (filters?.onlineOnly) params.onlineOnly = 'true';
      if (filters?.includeDemo) params.includeDemo = 'true';

      const res = await httpClient.get<any>(USER_ENDPOINTS.SKILL_SWAP, { params });
      if (Array.isArray(res)) return res;
      if (Array.isArray(res?.data)) return res.data;
      if (Array.isArray(res?.students)) return res.students;
      if (Array.isArray(res?.users)) return res.users;
    } catch (err) {
      console.warn('Backend skill-swap fetch failed, falling back to directory:', err);
      return this.getUserDirectory(filters);
    }
    return [];
  },

  /**
   * Get registered SkillSwap student directory with optional filtering
   */
  async getUserDirectory(filters?: {
    q?: string;
    department?: string;
    university?: string;
    skill?: string;
    level?: string;
    onlineOnly?: boolean;
    includeDemo?: boolean;
  }): Promise<Profile[]> {
    try {
      const params: Record<string, any> = {};
      if (filters?.q) params.q = filters.q;
      if (filters?.department && filters.department !== 'All') params.department = filters.department;
      if (filters?.university && filters.university !== 'All') params.university = filters.university;
      if (filters?.skill && filters.skill !== 'All') params.skill = filters.skill;
      if (filters?.level && filters.level !== 'All') params.level = filters.level;
      if (filters?.onlineOnly) params.onlineOnly = 'true';
      if (filters?.includeDemo) params.includeDemo = 'true';

      const res = await httpClient.get<any>(USER_ENDPOINTS.DIRECTORY, { params });
      if (Array.isArray(res)) return res;
      if (Array.isArray(res?.data)) return res.data;
      if (Array.isArray(res?.students)) return res.students;
      if (Array.isArray(res?.users)) return res.users;
    } catch (err) {
      console.error('Failed to fetch user directory:', err);
      throw err;
    }
    return [];
  },

  /**
   * Update student privacy settings
   */
  async updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<PrivacySettings> {
    if (!USE_MOCK_API) {
      try {
        return await httpClient.put<PrivacySettings>(USER_ENDPOINTS.PRIVACY_SETTINGS, settings);
      } catch (err) {
        console.warn('Backend privacy update failed, persisting locally:', err);
      }
    }

    const profile = getLocalProfile();
    if (!profile) {
      return {
        verifiedPeersOnly: true,
        allowDirectSwaps: true,
        publicLearningHistory: true,
        maskReviews: false,
        ...settings,
      };
    }
    const updatedSettings: PrivacySettings = {
      ...profile.privacy,
      ...settings,
    };
    profile.privacy = updatedSettings;
    if (settings.publicProfileEnabled !== undefined) {
      profile.publicProfileEnabled = settings.publicProfileEnabled;
    }
    saveLocalProfile(profile);
    return updatedSettings;
  },

  /**
   * Fetch a public profile by its opaque public identifier.
   * Strictly returns non-sensitive fields and respects privacy settings.
   */
  async getPublicProfile(publicProfileId: string): Promise<import('../types').PublicProfile | null> {
    try {
      const res = await fetch(`/api/v1/public-profiles/${encodeURIComponent(publicProfileId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          return json.data;
        }
      }
    } catch (err) {
      console.warn('API fetch for public profile failed, checking local store:', err);
    }

    // Local / offline fallback
    const current = getLocalProfile();
    if (current) {
      const effectivePublicId = current.publicProfileId || current.id;

      if (effectivePublicId === publicProfileId || current.id === publicProfileId) {
        const isPublicEnabled = current.privacy?.publicProfileEnabled ?? current.publicProfileEnabled ?? true;
        const isLearningPublic = current.privacy?.publicLearningHistory ?? true;

        return {
          publicProfileId: effectivePublicId,
          name: current.name,
          avatarUrl: current.avatarUrl,
          bio: current.bio,
          university: current.university,
          department: current.department,
          year: current.year,
          location: current.location,
          rank: current.rank,
          memberSince: current.memberSince,
          isVerified: current.isVerified,
          publicProfileEnabled: isPublicEnabled,
          publicLearningHistory: isLearningPublic,
          teachingSkills: current.teachingSkills.map((ts) => ({
            name: ts.name,
            category: ts.category,
            level: ts.level,
            description: ts.description,
            endorsementsCount: ts.endorsementsCount,
            hoursTaught: ts.hoursTaught,
          })),
          learningSkills: isLearningPublic
            ? current.learningSkills.map((ls) => ({
                name: ls.name,
                category: ls.category,
                level: ls.currentLevel,
                targetLevel: ls.targetLevel,
                endorsementsCount: 0,
              }))
            : [],
          achievements: isLearningPublic
            ? current.badges.map((b) => ({
                id: b.id,
                title: b.title,
                category: b.category,
                description: b.description,
                icon: b.icon,
                iconBgColor: b.iconBgColor,
                levelBadge: b.levelBadge,
              }))
            : [],
          lessonsCreated: [
            {
              id: 'lesson-1',
              title: 'Full-Stack React & Component Lifecycle Architecture',
              category: 'Computer Science',
              description: 'Master modular components, unidirectional state flow, and memory optimization.',
              difficultyLevel: 'Intermediate',
              durationMinutes: 45,
            },
            {
              id: 'lesson-3',
              title: 'Data Structures: Balanced Trees & Heaps in Python',
              category: 'Computer Science',
              description: 'Interactive coding lab implementing Red-Black trees and priority queues.',
              difficultyLevel: 'Advanced',
              durationMinutes: 60,
            },
          ],
          activitySummary: {
            hoursTaught: current.hoursTaught,
            hoursLearned: isLearningPublic ? current.hoursLearned : null,
            reviewCount: current.reviewCount,
            peerReputation: current.peerReputation,
            swapFulfillRate: current.swapFulfillRate,
            memberSince: current.memberSince,
          },
        };
      }
    }

    return null;
  },

  /**
   * Regenerate unique public profile identifier
   */
  async regeneratePublicProfileId(): Promise<string> {
    if (!USE_MOCK_API && tokenStorage.getToken()) {
      try {
        const res = await httpClient.post<{ publicProfileId: string }>(USER_ENDPOINTS.REGENERATE_PUBLIC_PROFILE);
        if (res && res.publicProfileId) {
          const profile = getLocalProfile();
          if (profile) {
            profile.publicProfileId = res.publicProfileId;
            saveLocalProfile(profile);
          }
          return res.publicProfileId;
        }
      } catch (err) {
        console.warn('API regenerate public profile failed, using local generation:', err);
      }
    }

    const profile = getLocalProfile();
    if (!profile) {
      throw new Error('Not authenticated.');
    }
    const nameSlug = (profile.name || 'student')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'student';
    const randSuffix = Math.random().toString(36).substring(2, 6);
    const newId = `${nameSlug}-${randSuffix}`;
    profile.publicProfileId = newId;
    saveLocalProfile(profile);
    return newId;
  },
};
