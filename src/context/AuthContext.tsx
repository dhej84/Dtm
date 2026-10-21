import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Profile, UserProfile } from '../types';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { tokenStorage } from '../services/api/tokenStorage';

interface AuthContextType {
  currentUser: UserProfile | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string; code?: string }>;
  signup: (userData: {
    name: string;
    email: string;
    password?: string;
    university: string;
    department: string;
    year: string;
    teachSkillName: string;
    teachSkillLevel: string;
    learnSkillName: string;
  }) => Promise<{ success: boolean; error?: string; code?: string }>;
  logout: () => Promise<void>;
  switchDemoUser: (userId: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserProfile>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeProfile(p: any): UserProfile | null {
  if (!p) return null;
  return {
    ...p,
    id: p.id || '',
    name: p.name || 'Student',
    email: p.email || '',
    university: p.university || 'UC Berkeley',
    department: p.department || 'Student',
    year: p.year || "'26",
    bio: p.bio || '',
    location: p.location || 'Campus',
    avatarUrl: p.avatarUrl || '',
    isVerified: p.isVerified !== undefined ? p.isVerified : (p.email?.endsWith('.edu') || false),
    rank: p.rank || 'Active Member',
    memberSince: p.memberSince || 'Oct 2024',
    walletBalance: typeof p.walletBalance === 'number' ? p.walletBalance : 10,
    hoursTaught: typeof p.hoursTaught === 'number' ? p.hoursTaught : 0,
    hoursLearned: typeof p.hoursLearned === 'number' ? p.hoursLearned : 0,
    peerReputation: typeof p.peerReputation === 'number' ? p.peerReputation : 5.0,
    reviewCount: typeof p.reviewCount === 'number' ? p.reviewCount : 0,
    swapFulfillRate: typeof p.swapFulfillRate === 'number' ? p.swapFulfillRate : 100,
    privacy: p.privacy || {
      verifiedPeersOnly: true,
      allowDirectSwaps: true,
      publicLearningHistory: true,
      maskReviews: false,
    },
    teachingSkills: Array.isArray(p.teachingSkills) ? p.teachingSkills : [],
    learningSkills: Array.isArray(p.learningSkills) ? p.learningSkills : [],
    badges: Array.isArray(p.badges) ? p.badges : [],
    reviews: Array.isArray(p.reviews) ? p.reviews : [],
    journey: Array.isArray(p.journey) ? p.journey : [],
  };
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadUser = async () => {
    try {
      const token = tokenStorage.getToken();
      if (!token) {
        localStorage.removeItem('skillswap_current_profile');
        localStorage.removeItem('skillswap_current_user');
        setUser(null);
        setCurrentUser(null);
        setIsLoading(false);
        return;
      }

      const activeUser = await authService.getCurrentUser();
      if (!activeUser) {
        tokenStorage.clear();
        localStorage.removeItem('skillswap_current_profile');
        localStorage.removeItem('skillswap_current_user');
        setUser(null);
        setCurrentUser(null);
        setIsLoading(false);
        return;
      }

      setUser(activeUser);
      const profile = await userService.getProfile();
      const normalized = normalizeProfile(profile || (activeUser as any));
      setCurrentUser(normalized);
      if (normalized) {
        localStorage.setItem('skillswap_current_profile', JSON.stringify(normalized));
      }
    } catch (e) {
      console.error('Failed to load user session:', e);
      tokenStorage.clear();
      localStorage.removeItem('skillswap_current_profile');
      localStorage.removeItem('skillswap_current_user');
      setUser(null);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const authResult = await authService.login({ email, password: password || '' });
      setUser(authResult.user);

      // Attempt to load full profile from backend, falling back to auth payload profile
      let userProfile = authResult.profile;
      try {
        const fetchedProfile = await userService.getProfile();
        if (fetchedProfile) {
          userProfile = fetchedProfile;
        }
      } catch (profileErr) {
        console.warn('[AuthContext] Could not fetch remote profile after login, using auth payload:', profileErr);
      }

      const normalized = normalizeProfile(userProfile || authResult.user);
      setCurrentUser(normalized);
      if (normalized) {
        localStorage.setItem('skillswap_current_profile', JSON.stringify(normalized));
      }
      return { success: true };
    } catch (err: any) {
      console.error('[AuthContext] Login failed:', err?.message || err);
      return {
        success: false,
        error: err?.message || 'Invalid email or password. Please verify your credentials.',
      };
    }
  };

  const signup = async (userData: {
    name: string;
    email: string;
    password?: string;
    university: string;
    department: string;
    year: string;
    teachSkillName: string;
    teachSkillLevel: string;
    learnSkillName: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const authResult = await authService.signup({
        name: userData.name,
        email: userData.email,
        password: userData.password || '',
        university: userData.university,
        department: userData.department,
        year: userData.year,
        teachSkillName: userData.teachSkillName,
        teachSkillLevel: userData.teachSkillLevel as any,
        learnSkillName: userData.learnSkillName,
      });

      setUser(authResult.user);

      let userProfile = authResult.profile;
      try {
        const fetchedProfile = await userService.getProfile();
        if (fetchedProfile) {
          userProfile = fetchedProfile;
        }
      } catch (profileErr) {
        console.warn('[AuthContext] Could not fetch remote profile after signup, using auth payload:', profileErr);
      }

      const normalized = normalizeProfile(userProfile || authResult.user);
      setCurrentUser(normalized);
      if (normalized) {
        localStorage.setItem('skillswap_current_profile', JSON.stringify(normalized));
      }
      return { success: true };
    } catch (err: any) {
      console.error('[AuthContext] Signup failed:', err?.message || err);
      return { success: false, error: err?.message || 'Registration failed. Please check your information.' };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      setUser(null);
      setCurrentUser(null);
      setIsLoading(false);
    }
  };

  const switchDemoUser = async (_userId: string) => {
    console.warn('[AuthContext] Demo accounts are disabled. Please use genuine registered accounts to authenticate.');
  };

  const refreshUser = async () => {
    if (!tokenStorage.getToken()) {
      setUser(null);
      setCurrentUser(null);
      return;
    }
    const profile = await userService.getProfile();
    if (profile) {
      setCurrentUser(normalizeProfile(profile));
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<UserProfile> => {
    const updated = await userService.updateProfile(updates);
    const normalized = normalizeProfile(updated) || updated;
    setCurrentUser(normalized);
    return normalized;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        user,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        signup,
        logout,
        switchDemoUser,
        refreshUser,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
