import { SKILL_ENDPOINTS, USE_MOCK_API } from './api/config';
import { httpClient } from './api/httpClient';
import { Skill, SkillLevel, TeachingSkill, LearningSkill, Profile } from '../types';
import { POPULAR_SKILLS } from './mockData';
import { userService } from './userService';

const SKILLS_KEY = 'skillswap_available_skills';

function getStoredSkills(): Skill[] {
  const saved = localStorage.getItem(SKILLS_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  return POPULAR_SKILLS;
}

export const skillService = {
  /**
   * Get all skills available in the platform catalog
   */
  async getAvailableSkills(): Promise<Skill[]> {
    if (!USE_MOCK_API) {
      try {
        return await httpClient.get<Skill[]>(SKILL_ENDPOINTS.AVAILABLE_SKILLS);
      } catch (err) {
        console.warn('Backend skill catalog unavailable, falling back to mock catalog:', err);
      }
    }
    return getStoredSkills();
  },

  /**
   * Add a teaching skill to current user's profile
   */
  async addTeachingSkill(skill: { name: string; level: SkillLevel; category?: string }): Promise<TeachingSkill[]> {
    if (!USE_MOCK_API) {
      try {
        return await httpClient.post<TeachingSkill[]>(SKILL_ENDPOINTS.TEACHING_SKILLS, skill);
      } catch (err) {
        console.warn('Backend add teaching skill failed, falling back to local:', err);
      }
    }

    const profile = await userService.getProfile();
    if (!profile) throw new Error('Not authenticated.');
    const existing = profile.teachingSkills.find((s) => s.name.toLowerCase() === skill.name.toLowerCase());
    let updated: TeachingSkill[];
    if (existing) {
      updated = profile.teachingSkills.map((s) =>
        s.name.toLowerCase() === skill.name.toLowerCase() ? { ...s, level: skill.level } : s,
      );
    } else {
      const newSkill: TeachingSkill = {
        id: `ts-${Date.now()}`,
        name: skill.name,
        category: skill.category || 'General',
        level: skill.level,
        hoursTaught: 0,
        reviewsCount: 0,
        endorsementsCount: 1,
        proficiencyPercent: 75,
        description: 'Ready to exchange knowledge with fellow university students.',
      };
      updated = [...profile.teachingSkills, newSkill];
    }
    await userService.updateProfile({ teachingSkills: updated });
    return updated;
  },

  /**
   * Remove a teaching skill from current user's profile
   */
  async removeTeachingSkill(skillIdOrName: string): Promise<TeachingSkill[]> {
    if (!USE_MOCK_API) {
      try {
        return await httpClient.delete<TeachingSkill[]>(SKILL_ENDPOINTS.REMOVE_TEACHING_SKILL(skillIdOrName));
      } catch (err) {
        console.warn('Backend remove teaching skill failed, falling back to local:', err);
      }
    }

    const profile = await userService.getProfile();
    if (!profile) throw new Error('Not authenticated.');
    const updated = profile.teachingSkills.filter(
      (s) => s.id !== skillIdOrName && s.name.toLowerCase() !== skillIdOrName.toLowerCase(),
    );
    await userService.updateProfile({ teachingSkills: updated });
    return updated;
  },

  /**
   * Add a learning skill to current user's profile
   */
  async addLearningSkill(skill: { name: string; targetLevel: SkillLevel; category?: string }): Promise<LearningSkill[]> {
    if (!USE_MOCK_API) {
      try {
        return await httpClient.post<LearningSkill[]>(SKILL_ENDPOINTS.LEARNING_SKILLS, skill);
      } catch (err) {
        console.warn('Backend add learning skill failed, falling back to local:', err);
      }
    }

    const profile = await userService.getProfile();
    if (!profile) throw new Error('Not authenticated.');
    const existing = profile.learningSkills.find((s) => s.name.toLowerCase() === skill.name.toLowerCase());
    let updated: LearningSkill[];
    if (existing) {
      updated = profile.learningSkills.map((s) =>
        s.name.toLowerCase() === skill.name.toLowerCase() ? { ...s, targetLevel: skill.targetLevel } : s,
      );
    } else {
      const newSkill: LearningSkill = {
        id: `ls-${Date.now()}`,
        name: skill.name,
        category: skill.category || 'General',
        currentLevel: 'Beginner',
        targetLevel: skill.targetLevel,
        progressPercent: 10,
        hoursPracticed: 0,
        targetDate: 'Dec 2024',
      };
      updated = [...profile.learningSkills, newSkill];
    }
    await userService.updateProfile({ learningSkills: updated });
    return updated;
  },

  /**
   * Remove a learning skill from current user's profile
   */
  async removeLearningSkill(skillIdOrName: string): Promise<LearningSkill[]> {
    if (!USE_MOCK_API) {
      try {
        return await httpClient.delete<LearningSkill[]>(SKILL_ENDPOINTS.REMOVE_LEARNING_SKILL(skillIdOrName));
      } catch (err) {
        console.warn('Backend remove learning skill failed, falling back to local:', err);
      }
    }

    const profile = await userService.getProfile();
    if (!profile) throw new Error('Not authenticated.');
    const updated = profile.learningSkills.filter(
      (s) => s.id !== skillIdOrName && s.name.toLowerCase() !== skillIdOrName.toLowerCase(),
    );
    await userService.updateProfile({ learningSkills: updated });
    return updated;
  },

  /**
   * Update proficiency level for a teaching or learning skill
   */
  async updateSkillLevel(skillId: string, level: SkillLevel, type: 'teach' | 'learn'): Promise<TeachingSkill | LearningSkill> {
    if (!USE_MOCK_API) {
      try {
        return await httpClient.patch<TeachingSkill | LearningSkill>(SKILL_ENDPOINTS.UPDATE_LEVEL(skillId), { level, type });
      } catch (err) {
        console.warn('Backend update skill level failed, falling back to local:', err);
      }
    }

    const profile = await userService.getProfile();
    if (!profile) throw new Error('Not authenticated.');
    if (type === 'teach') {
      const updated = profile.teachingSkills.map((s) => (s.id === skillId ? { ...s, level } : s));
      await userService.updateProfile({ teachingSkills: updated });
      return updated.find((s) => s.id === skillId)!;
    } else {
      const updated = profile.learningSkills.map((s) => (s.id === skillId ? { ...s, targetLevel: level } : s));
      await userService.updateProfile({ learningSkills: updated });
      return updated.find((s) => s.id === skillId)!;
    }
  },

  /**
   * Endorse a student's badge or skill
   */
  async endorseBadge(badgeId: string): Promise<Profile> {
    if (!USE_MOCK_API) {
      try {
        return await httpClient.post<Profile>(SKILL_ENDPOINTS.ENDORSE_BADGE(badgeId), {});
      } catch (err) {
        console.warn('Backend endorse badge failed, updating locally:', err);
      }
    }

    const profile = await userService.getProfile();
    if (!profile) throw new Error('Not authenticated.');
    const updatedBadges = profile.badges.map((b) => {
      if (b.id === badgeId) {
        return {
          ...b,
          endorsementsCount: (b.endorsementsCount || 0) + 1,
          userEndorsed: true,
        };
      }
      return b;
    });

    const updatedProfile = await userService.updateProfile({
      badges: updatedBadges,
      peerReputation: Math.min(5.0, Number((profile.peerReputation + 0.02).toFixed(2))),
    });

    return updatedProfile;
  },
};
