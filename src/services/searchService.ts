import { SEARCH_ENDPOINTS, USE_MOCK_API } from './api/config';
import { httpClient } from './api/httpClient';
import { SearchFilters, SearchResult, Profile, Lesson } from '../types';
import { userService } from './userService';
import { lessonService } from './lessonService';

export const searchService = {
  /**
   * Unified search endpoint for both students and lessons with filters
   */
  async search(filters: SearchFilters): Promise<SearchResult> {
    if (!USE_MOCK_API) {
      try {
        const queryParams = new URLSearchParams();
        if (filters.query) queryParams.set('q', filters.query);
        if (filters.type) queryParams.set('type', filters.type);
        if (filters.skill && filters.skill !== 'All') queryParams.set('skill', filters.skill);
        if (filters.level && filters.level !== 'All') queryParams.set('level', filters.level);
        if (filters.category && filters.category !== 'All') queryParams.set('category', filters.category);

        const url = `${SEARCH_ENDPOINTS.SEARCH}?${queryParams.toString()}`;
        return await httpClient.get<SearchResult>(url);
      } catch (err) {
        console.warn('Backend search failed, executing local in-memory search:', err);
      }
    }

    const [students, lessons] = await Promise.all([
      this.searchStudents(filters),
      this.searchLessons(filters),
    ]);

    return {
      query: filters.query || '',
      students: filters.type === 'lessons' ? [] : students,
      lessons: filters.type === 'students' ? [] : lessons,
      skills: [],
      totalCount: (filters.type === 'lessons' ? 0 : students.length) + (filters.type === 'students' ? 0 : lessons.length),
    };
  },

  /**
   * Search student peer profiles specifically
   */
  async searchStudents(filters: SearchFilters): Promise<Profile[]> {
    if (!USE_MOCK_API) {
      try {
        const queryParams = new URLSearchParams();
        if (filters.query) queryParams.set('q', filters.query);
        if (filters.skill && filters.skill !== 'All') queryParams.set('skill', filters.skill);
        if (filters.level && filters.level !== 'All') queryParams.set('level', filters.level);

        const url = `${SEARCH_ENDPOINTS.STUDENTS}?${queryParams.toString()}`;
        const res = await httpClient.get<Profile[]>(url);
        if (Array.isArray(res)) {
          return res;
        }
      } catch (err) {
        console.warn('Backend student search failed, falling back to cached profile store:', err);
      }
    }

    const allLive = await userService.getAllStudents();
    let pool: Profile[] = allLive;

    if (filters.query) {
      const q = filters.query.toLowerCase();
      pool = pool.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q) ||
          s.university.toLowerCase().includes(q) ||
          s.teachingSkills.some((sk) => sk.name.toLowerCase().includes(q)) ||
          s.learningSkills.some((sk) => sk.name.toLowerCase().includes(q)),
      );
    }

    if (filters.skill && filters.skill !== 'All') {
      const targetSkill = filters.skill.toLowerCase();
      pool = pool.filter(
        (s) =>
          s.teachingSkills.some((sk) => sk.name.toLowerCase() === targetSkill) ||
          s.learningSkills.some((sk) => sk.name.toLowerCase() === targetSkill),
      );
    }

    if (filters.level && filters.level !== 'All') {
      pool = pool.filter((s) => s.teachingSkills.some((sk) => sk.level === filters.level));
    }

    return pool;
  },

  /**
   * Search lessons specifically
   */
  async searchLessons(filters: SearchFilters): Promise<Lesson[]> {
    if (!USE_MOCK_API && filters.type === 'lessons') {
      try {
        const queryParams = new URLSearchParams();
        if (filters.query) queryParams.set('q', filters.query);
        if (filters.skill && filters.skill !== 'All') queryParams.set('skill', filters.skill);
        if (filters.level && filters.level !== 'All') queryParams.set('level', filters.level);
        if (filters.category && filters.category !== 'All') queryParams.set('category', filters.category);

        const url = `${SEARCH_ENDPOINTS.LESSONS}?${queryParams.toString()}`;
        return await httpClient.get<Lesson[]>(url);
      } catch (err) {
        console.warn('Backend lesson search failed, falling back to local lessons:', err);
      }
    }

    return lessonService.getLessons({
      query: filters.query,
      skill: filters.skill,
      level: filters.level,
      category: filters.category,
    });
  },
};
