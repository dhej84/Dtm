import { CONNECTION_ENDPOINTS, USE_MOCK_API } from './api/config';
import { httpClient } from './api/httpClient';
import { Connection, StudentMatch, UserProfile } from '../types';
import { userService } from './userService';

const CONNECTIONS_KEY = 'skillswap_connections_list';

function getStoredConnections(): Connection[] {
  const saved = localStorage.getItem(CONNECTIONS_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  return [];
}

function saveStoredConnections(data: Connection[]): void {
  localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(data));
}

export const connectionService = {
  /**
   * Get all active or pending connections for the student
   */
  async getConnections(): Promise<Connection[]> {
    if (!USE_MOCK_API) {
      try {
        return await httpClient.get<Connection[]>(CONNECTION_ENDPOINTS.CONNECTIONS);
      } catch (err) {
        console.warn('Backend connections failed, falling back to local connections:', err);
      }
    }
    return getStoredConnections();
  },

  /**
   * Get recommended students based on complementary skills
   */
  async getRecommendedStudents(): Promise<StudentMatch[]> {
    if (!USE_MOCK_API) {
      try {
        return await httpClient.get<StudentMatch[]>(CONNECTION_ENDPOINTS.RECOMMENDED);
      } catch (err) {
        console.warn('Backend recommendations failed, computing from local student database:', err);
      }
    }

    const profile = await userService.getProfile();
    if (!profile) return [];
    const connections = getStoredConnections();

    let candidateStudents: UserProfile[] = [];
    try {
      const live = await userService.getAllStudents();
      if (Array.isArray(live)) {
        candidateStudents = live.filter((s) => s.id !== profile.id);
      }
    } catch {}

    // Match criteria: finds students who teach what current user wants to learn, or vice versa
    const learnSkillNames = new Set(profile.learningSkills.map((s) => s.name.toLowerCase()));
    const teachSkillNames = new Set(profile.teachingSkills.map((s) => s.name.toLowerCase()));

    const recommendations: StudentMatch[] = candidateStudents.map((student) => {
      const matchTeach = student.teachingSkills.some((s) =>
        Array.from(learnSkillNames).some((wanted) => s.name.toLowerCase().includes(wanted) || wanted.includes(s.name.toLowerCase())),
      );
      const matchLearn = student.learningSkills.some((s) =>
        Array.from(teachSkillNames).some((offered) => s.name.toLowerCase().includes(offered) || offered.includes(s.name.toLowerCase())),
      );

      let matchScore = 75;
      if (matchTeach && matchLearn) matchScore = 98;
      else if (matchTeach || matchLearn) matchScore = 88;

      const connection = connections.find((c) => c.toUserId === student.id || c.fromUserId === student.id);
      const connectionStatus = connection ? (connection.status === 'accepted' ? 'connected' : connection.status === 'pending' ? 'pending' : 'none') : 'none';

      return {
        student,
        matchScore,
        mutualSkills: student.teachingSkills.map((s) => s.name).slice(0, 3),
        connectionStatus,
      };
    });

    return recommendations.sort((a, b) => b.matchScore - a.matchScore);
  },

  /**
   * Send a peer connection or swap request
   */
  async sendConnectionRequest(
    targetStudentId: string,
    skillOffered: string,
    skillRequested: string,
    message?: string,
  ): Promise<Connection> {
    if (!USE_MOCK_API) {
      try {
        return await httpClient.post<Connection>(CONNECTION_ENDPOINTS.SEND_REQUEST, {
          targetStudentId,
          skillOffered,
          skillRequested,
          message,
        });
      } catch (err) {
        console.warn('Backend connection request failed, adding locally:', err);
      }
    }

    const currentProfile = await userService.getProfile();
    if (!currentProfile) {
      throw new Error('Not authenticated.');
    }
    let partner: any = null;
    try {
      partner = await userService.getStudentById(targetStudentId);
    } catch {}
    const newConnection: Connection = {
      id: `conn-${Date.now()}`,
      fromUserId: currentProfile.id,
      fromUserName: currentProfile.name,
      fromUserAvatar: currentProfile.avatarUrl,
      fromUserProgram: `${currentProfile.department} • ${currentProfile.university}`,
      toUserId: targetStudentId,
      toUserName: partner?.name || 'Fellow Student',
      toUserAvatar: partner?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      toUserProgram: `${partner?.department || 'Student'} • ${partner?.university || 'University'}`,
      teachSkill: skillOffered,
      learnSkill: skillRequested,
      message: message || `Hey ${partner?.name || 'there'}! I'd love to swap skills with you.`,
      status: 'pending',
      createdAt: 'Just now',
      direction: 'outgoing',
    };

    const current = getStoredConnections();
    const updated = [newConnection, ...current.filter((c) => !(c.toUserId === targetStudentId && c.fromUserId === currentProfile.id))];
    saveStoredConnections(updated);
    return newConnection;
  },

  /**
   * Accept an incoming connection request
   */
  async acceptRequest(connectionId: string): Promise<Connection | null> {
    if (!USE_MOCK_API) {
      try {
        return await httpClient.post<Connection>(CONNECTION_ENDPOINTS.ACCEPT(connectionId), {});
      } catch (err) {
        console.warn(`Backend accept request failed, accepting locally:`, err);
      }
    }

    const connections = getStoredConnections();
    const target = connections.find((c) => c.id === connectionId);
    if (!target) return null;

    target.status = 'accepted';
    saveStoredConnections([...connections]);

    // Give completion swap bonus to current user
    const profile = await userService.getProfile();
    if (profile) {
      await userService.updateProfile({
        walletBalance: profile.walletBalance + 1,
        peerReputation: Math.min(5.0, Number((profile.peerReputation + 0.02).toFixed(2))),
      });
    }

    return target;
  },

  /**
   * Reject an incoming connection request
   */
  async rejectRequest(connectionId: string): Promise<boolean> {
    if (!USE_MOCK_API) {
      try {
        await httpClient.post(CONNECTION_ENDPOINTS.REJECT(connectionId), {});
        return true;
      } catch (err) {
        console.warn(`Backend reject request failed, rejecting locally:`, err);
      }
    }

    const connections = getStoredConnections();
    const target = connections.find((c) => c.id === connectionId);
    if (target) {
      target.status = 'declined';
      saveStoredConnections([...connections]);
    }
    return true;
  },
};
