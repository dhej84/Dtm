import { AUTH_ENDPOINTS, USE_MOCK_API } from './api/config';
import { httpClient } from './api/httpClient';
import { tokenStorage } from './api/tokenStorage';
import { User, Profile } from '../types';

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  university: string;
  department: string;
  year: string;
  password?: string;
  teachSkillName?: string;
  teachSkillLevel?: string;
  learnSkillName?: string;
}

export interface AuthResponse {
  user: User;
  profile: Profile;
  token: string;
  refreshToken?: string;
}

const MOCK_CURRENT_USER_KEY = 'skillswap_current_user';
const REGISTERED_USERS_KEY = 'skillswap_registered_users';

function getRegisteredUsers(): Profile[] {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRegisteredUser(user: Profile): void {
  try {
    const list = getRegisteredUsers();
    const filtered = list.filter((u) => u.id !== user.id && u.email.toLowerCase() !== user.email.toLowerCase());
    filtered.push(user);
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Failed to save registered user:', e);
  }
}

function getMockStoredUser(): Profile | null {
  try {
    const raw = localStorage.getItem(MOCK_CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setMockStoredUser(user: Profile | null): void {
  try {
    if (user) {
      localStorage.setItem(MOCK_CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(MOCK_CURRENT_USER_KEY);
    }
  } catch (e) {
    console.warn('Failed to persist mock user:', e);
  }
}

export const authService = {
  /**
   * Authenticate a student user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    if (!USE_MOCK_API) {
      const response = await httpClient.post<any>(AUTH_ENDPOINTS.LOGIN, credentials, {
        skipAuth: true,
      });
      const token = response.token || response.data?.token;
      const refreshToken = response.refreshToken || response.data?.refreshToken;
      const user = response.user || response.data?.user || response.profile || response.data?.profile;
      const profile = response.profile || response.data?.profile || response.user || response.data?.user;

      if (token) {
        tokenStorage.setToken(token, refreshToken);
      }
      return {
        user,
        profile,
        token: token || '',
        refreshToken,
      };
    }

    // Mock Login: Validate against registered users
    const registered = getRegisteredUsers();
    const allUsers: Profile[] = registered;
    const emailQuery = credentials.email.trim().toLowerCase();

    const match = allUsers.find(
      (s) =>
        s.email.toLowerCase() === emailQuery ||
        s.name.toLowerCase() === emailQuery ||
        s.id.toLowerCase() === emailQuery
    );

    if (!match) {
      throw new Error('Invalid credentials. No campus student account matches this email or username.');
    }

    const mockToken = `mock-jwt-token-${match.id}-${Date.now()}`;
    tokenStorage.setToken(mockToken);
    setMockStoredUser(match);
    localStorage.setItem('skillswap_current_profile', JSON.stringify(match));

    return {
      user: {
        id: match.id,
        name: match.name,
        email: match.email,
        university: match.university,
        department: match.department,
        year: match.year,
        isVerified: match.isVerified,
        avatarUrl: match.avatarUrl,
      },
      profile: match,
      token: mockToken,
    };
  },

  /**
   * Register a new collegiate peer user
   */
  async signup(payload: SignupPayload): Promise<AuthResponse> {
    if (!USE_MOCK_API) {
      const response = await httpClient.post<any>(AUTH_ENDPOINTS.SIGNUP, payload, {
        skipAuth: true,
      });
      const token = response.token || response.data?.token;
      const refreshToken = response.refreshToken || response.data?.refreshToken;
      const user = response.user || response.data?.user || response.profile || response.data?.profile;
      const profile = response.profile || response.data?.profile || response.user || response.data?.user;

      if (token) {
        tokenStorage.setToken(token, refreshToken);
      }
      return {
        user,
        profile,
        token: token || '',
        refreshToken,
      };
    }

    const initials = payload.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    const newProfile: Profile = {
      id: `user-${Date.now()}`,
      name: payload.name,
      email: payload.email,
      university: payload.university || 'University Campus',
      department: payload.department || 'Student',
      year: payload.year || "'26",
      bio: `Student at ${payload.university} excited to exchange skills and mentor campus peers!`,
      location: `${payload.university}`,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(initials)}&backgroundColor=3525cd&textColor=ffffff`,
      isVerified: payload.email.endsWith('.edu'),
      rank: 'Campus Member',
      memberSince: 'Oct 2024',
      walletBalance: 10, // 10 welcome Swap Credits
      hoursTaught: 0,
      hoursLearned: 0,
      peerReputation: 5.0,
      reviewCount: 0,
      swapFulfillRate: 100,
      privacy: {
        verifiedPeersOnly: true,
        allowDirectSwaps: true,
        publicLearningHistory: true,
        maskReviews: false,
      },
      teachingSkills: payload.teachSkillName
        ? [
            {
              id: `ts-${Date.now()}`,
              name: payload.teachSkillName,
              category: 'General',
              level: (payload.teachSkillLevel as any) || 'Intermediate',
              hoursTaught: 0,
              reviewsCount: 0,
              endorsementsCount: 1,
              proficiencyPercent: 75,
              description: `Peer instruction in ${payload.teachSkillName}.`,
            },
          ]
        : [],
      learningSkills: payload.learnSkillName
        ? [
            {
              id: `ls-${Date.now()}`,
              name: payload.learnSkillName,
              category: 'General',
              currentLevel: 'Beginner',
              targetLevel: 'Advanced',
              progressPercent: 10,
              hoursPracticed: 0,
              targetDate: 'Open for Swap',
            },
          ]
        : [],
      badges: [
        {
          id: `ach-welcome-${Date.now()}`,
          title: 'Campus Pioneer',
          category: 'Teaching Mastery',
          description: 'Joined the SkillSwap collegiate network with a verified student profile.',
          icon: 'verified',
          iconBgColor: 'bg-[#82f5c1] text-[#00714e]',
          progressText: '1/1',
          fillPercent: 100,
          issuedDate: 'Oct 2024',
          levelBadge: 'Verified Member',
          endorsementsCount: 1,
          userEndorsed: false,
        },
      ],
      reviews: [],
      journey: [
        {
          id: `jm-${Date.now()}`,
          title: 'Joined SkillSwap Collegiate Network',
          description: 'Onboarded with 10 welcome Swap Credits to begin peer exchanges.',
          timeAgo: 'Just now',
          date: new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
          }),
          type: 'badge',
          creditsChange: 10,
          term: "Fall Quadrangle '24",
        },
      ],
    };

    saveRegisteredUser(newProfile);

    const mockToken = `mock-jwt-token-${newProfile.id}-${Date.now()}`;
    tokenStorage.setToken(mockToken);
    setMockStoredUser(newProfile);
    localStorage.setItem('skillswap_current_profile', JSON.stringify(newProfile));

    return {
      user: {
        id: newProfile.id,
        name: newProfile.name,
        email: newProfile.email,
        university: newProfile.university,
        department: newProfile.department,
        year: newProfile.year,
        isVerified: newProfile.isVerified,
        avatarUrl: newProfile.avatarUrl,
      },
      profile: newProfile,
      token: mockToken,
    };
  },

  /**
   * Log out student and revoke token
   */
  async logout(): Promise<void> {
    if (!USE_MOCK_API && tokenStorage.getToken()) {
      try {
        await httpClient.post(AUTH_ENDPOINTS.LOGOUT);
      } catch (e) {
        console.warn('Backend logout call failed:', e);
      }
    }
    tokenStorage.clear();
    setMockStoredUser(null);
    localStorage.removeItem('skillswap_current_profile');
    localStorage.removeItem('skillswap_current_user');
    localStorage.removeItem('skillswap_auth_token');
    localStorage.removeItem('skillswap_refresh_token');
  },

  /**
   * Retrieve current authenticated student profile
   */
  async getCurrentUser(): Promise<Profile | null> {
    if (!tokenStorage.getToken()) {
      return null;
    }
    if (!USE_MOCK_API) {
      try {
        const res = await httpClient.get<any>(AUTH_ENDPOINTS.ME);
        if (!res) return null;
        if (res.profile) return res.profile;
        if (res.id && res.name) return res;
        if (res.user) return res.user;
        if (res.data) return res.data;
        return res;
      } catch (error: any) {
        if (error?.statusCode === 401 || error?.status === 401 || error?.isUnauthorized) {
          tokenStorage.clear();
        }
        return null;
      }
    }

    return getMockStoredUser();
  },

  /**
   * Check if a valid session exists
   */
  isAuthenticated(): boolean {
    return !!tokenStorage.getToken();
  },
};
