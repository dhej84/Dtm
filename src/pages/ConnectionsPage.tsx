import React, { useState, useEffect } from 'react';
import { SwapConnection, UserProfile, LessonContext } from '../types';
import { apiService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { ConnectModal } from '../components/ConnectModal';

interface ConnectionsPageProps {
  onNavigate: (route: string) => void;
  onSelectLesson: (lessonId: string) => void;
  onOpenChat?: (conversationId?: string, lessonContext?: LessonContext) => void;
}

export const ConnectionsPage: React.FC<ConnectionsPageProps> = ({
  onNavigate,
  onSelectLesson,
  onOpenChat,
}) => {
  const { currentUser, refreshUser } = useAuth();
  const [connections, setConnections] = useState<SwapConnection[]>([]);
  const [allStudents, setAllStudents] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'connected' | 'pending' | 'recommended'>('connected');
  const [selectedStudentToConnect, setSelectedStudentToConnect] = useState<UserProfile | null>(null);
  const [scheduleNotice, setScheduleNotice] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [conns, students] = await Promise.all([
      apiService.getConnections(),
      apiService.getAllStudents(),
    ]);
    const safeConns = Array.isArray(conns) ? conns : [];
    const safeStudents = Array.isArray(students) ? students : [];
    setConnections(safeConns);
    setAllStudents(safeStudents.filter((s) => s.id !== currentUser?.id));
  };

  const handleRespond = async (connectionId: string, accept: boolean) => {
    await apiService.respondConnection(connectionId, accept);
    await loadData();
    await refreshUser();
  };

  const handleScheduleSession = (partnerName: string) => {
    setScheduleNotice(`Peer session invitation sent to ${partnerName} for Thursday @ Moffitt Library!`);
    setTimeout(() => setScheduleNotice(null), 3500);
  };

  const safeConnectionList = Array.isArray(connections) ? connections : [];
  const safeStudentList = Array.isArray(allStudents) ? allStudents : [];

  const connectedList = safeConnectionList.filter((c) => c.status === 'accepted');
  const pendingIncoming = safeConnectionList.filter((c) => c.status === 'pending' && c.direction === 'incoming');
  const pendingOutgoing = safeConnectionList.filter((c) => c.status === 'pending' && c.direction === 'outgoing');

  // Compute recommended matches: students who teach skills in currentUser's learningSkills
  const learningSkillNames = currentUser?.learningSkills?.map((ls) => ls.name.toLowerCase()) || [];
  const recommendedStudents = safeStudentList.filter((s) =>
    Array.isArray(s?.teachingSkills) &&
    s.teachingSkills.some((ts) =>
      learningSkillNames.some((wanted) => ts?.name?.toLowerCase().includes(wanted) || wanted.includes(ts?.name?.toLowerCase()))
    )
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#eaedff] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#82f5c1] text-[#00714e] text-xs font-semibold">
            <span className="material-symbols-outlined text-[16px]">handshake</span>
            <span>Peer Barter & Mentorship Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#131b2e] tracking-tight">
            Campus Peer Connections
          </h1>
          <p className="text-xs sm:text-sm text-[#464555] max-w-xl leading-relaxed">
            Manage your verified 1-on-1 swap proposals, review incoming requests, and connect with
            campus peers based on complementary skills.
          </p>
        </div>

        <button
          onClick={() => onNavigate('explore-skills')}
          className="px-5 py-2.5 rounded-xl bg-[#3525cd] text-white text-xs font-semibold shadow-xs hover:opacity-95 transition-all flex items-center gap-2 shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">search</span>
          <span>Find More Students</span>
        </button>
      </div>

      {scheduleNotice && (
        <div className="p-4 rounded-2xl bg-[#82f5c1]/30 border border-[#82f5c1] text-[#00714e] text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <span className="material-symbols-outlined text-[20px]">event_available</span>
          <span>{scheduleNotice}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#eaedff] pb-3">
        <button
          onClick={() => setActiveTab('connected')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'connected'
              ? 'bg-[#3525cd] text-white shadow-xs'
              : 'text-[#464555] hover:bg-[#f2f3ff]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>Connected Partners ({connectedList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'pending'
              ? 'bg-[#3525cd] text-white shadow-xs'
              : 'text-[#464555] hover:bg-[#f2f3ff]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">pending_actions</span>
          <span>
            Pending Proposals ({pendingIncoming.length + pendingOutgoing.length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('recommended')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'recommended'
              ? 'bg-[#3525cd] text-white shadow-xs'
              : 'text-[#464555] hover:bg-[#f2f3ff]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
          <span>Skill Match Recommendations ({recommendedStudents.length})</span>
        </button>
      </div>

      {/* TAB: CONNECTED PEERS */}
      {activeTab === 'connected' && (
        <div className="space-y-4">
          {connectedList.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-xs text-[#464555] border border-[#eaedff]">
              No active connected partners yet. Check your pending requests or explore peer mentors!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {connectedList.map((conn) => {
                const isIncoming = conn.direction === 'incoming';
                const partnerName = isIncoming ? conn.fromUserName : conn.toUserName;
                const partnerAvatar = isIncoming ? conn.fromUserAvatar : conn.toUserAvatar;
                const partnerProgram = isIncoming ? conn.fromUserProgram : conn.toUserProgram;

                return (
                  <div
                    key={conn.id}
                    className="bg-white rounded-3xl p-6 shadow-sm border border-[#eaedff] flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={partnerAvatar}
                            alt={partnerName}
                            className="w-12 h-12 rounded-2xl object-cover ring-2 ring-[#006c4a]"
                          />
                          <div>
                            <h3 className="font-bold text-base text-[#131b2e]">{partnerName}</h3>
                            <p className="text-xs text-[#464555]">{partnerProgram}</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-[#82f5c1] text-[#00714e] text-[11px] font-bold">
                          Active Partner
                        </span>
                      </div>

                      {/* Barter Pair Chip */}
                      <div className="p-3 bg-[#f2f3ff] rounded-2xl border border-[#eaedff] text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[#00714e] font-semibold">He/She Teaches:</span>
                          <span className="font-bold text-[#131b2e]">{conn.teachSkill}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#3525cd] font-semibold">You Teach:</span>
                          <span className="font-bold text-[#131b2e]">{conn.learnSkill}</span>
                        </div>
                      </div>

                      <p className="text-xs text-[#464555] italic">“{conn.message}”</p>
                    </div>

                    <div className="pt-3 border-t border-[#f2f3ff] flex flex-wrap gap-2">
                      <button
                        onClick={async () => {
                          if (currentUser?.id) {
                            const partnerId = isIncoming ? conn.fromUserId : conn.toUserId;
                            const conv = await apiService.startOrGetConversation(currentUser.id, partnerId);
                            if (onOpenChat) {
                              onOpenChat(conv.id);
                            } else {
                              onNavigate('messages');
                            }
                          }
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-[#3525cd] text-white text-xs font-semibold hover:opacity-95 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[16px]">forum</span>
                        <span>Chat with Partner</span>
                      </button>
                      <button
                        onClick={() => handleScheduleSession(partnerName)}
                        className="py-2.5 px-3 rounded-xl bg-[#f2f3ff] text-[#131b2e] text-xs font-semibold hover:bg-[#eaedff] transition-all flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                        <span>Schedule</span>
                      </button>
                      <button
                        onClick={() => {
                          onSelectLesson('lesson-1');
                          onNavigate('lesson-room');
                        }}
                        className="px-3 py-2.5 rounded-xl bg-[#eaedff] text-[#3525cd] text-xs font-semibold hover:bg-[#dae2fd] transition-all flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">play_circle</span>
                        <span>Room</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: PENDING REQUESTS */}
      {activeTab === 'pending' && (
        <div className="space-y-6">
          {/* Incoming */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-[#131b2e] uppercase tracking-wider">
              Incoming Swap Proposals ({pendingIncoming.length})
            </h3>
            {pendingIncoming.length === 0 ? (
              <p className="text-xs text-[#464555] bg-white p-6 rounded-2xl border border-[#eaedff]">
                No pending incoming proposals.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingIncoming.map((conn) => (
                  <div
                    key={conn.id}
                    className="bg-white rounded-3xl p-6 shadow-sm border border-[#eaedff] space-y-4"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={conn.fromUserAvatar}
                        alt={conn.fromUserName}
                        className="w-12 h-12 rounded-2xl object-cover"
                      />
                      <div>
                        <h4 className="font-bold text-sm text-[#131b2e]">{conn.fromUserName}</h4>
                        <p className="text-xs text-[#464555]">{conn.fromUserProgram}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-[#f2f3ff] rounded-2xl text-xs space-y-1">
                      <div>
                        <span className="text-[#00714e] font-semibold">Proposes to Teach: </span>
                        <strong className="text-[#131b2e]">{conn.teachSkill}</strong>
                      </div>
                      <div>
                        <span className="text-[#3525cd] font-semibold">Wants in Exchange: </span>
                        <strong className="text-[#131b2e]">{conn.learnSkill}</strong>
                      </div>
                    </div>

                    <p className="text-xs text-[#464555] italic">“{conn.message}”</p>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleRespond(conn.id, true)}
                        className="flex-1 py-2 rounded-xl bg-[#006c4a] text-white text-xs font-semibold hover:opacity-95 flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">check</span>
                        <span>Accept Swap (+1 Credit)</span>
                      </button>
                      <button
                        onClick={() => handleRespond(conn.id, false)}
                        className="px-4 py-2 rounded-xl bg-[#eaedff] text-[#464555] text-xs font-semibold hover:bg-[#dae2fd]"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing */}
          <div className="space-y-3 pt-4 border-t border-[#eaedff]">
            <h3 className="font-bold text-sm text-[#131b2e] uppercase tracking-wider">
              Outgoing Swap Proposals ({pendingOutgoing.length})
            </h3>
            {pendingOutgoing.length === 0 ? (
              <p className="text-xs text-[#464555] bg-white p-6 rounded-2xl border border-[#eaedff]">
                No pending outgoing proposals. Browse the explore page to propose a swap!
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingOutgoing.map((conn) => (
                  <div
                    key={conn.id}
                    className="bg-white rounded-3xl p-6 shadow-sm border border-[#eaedff] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#131b2e]">
                        Sent to {conn.toUserName}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#ffdcc3] text-[#703a00] text-[10px] font-bold">
                        Awaiting Response
                      </span>
                    </div>
                    <p className="text-xs text-[#464555]">
                      Offered: <strong>{conn.teachSkill}</strong> ⇄ Requested:{' '}
                      <strong>{conn.learnSkill}</strong>
                    </p>
                    <p className="text-xs text-[#464555] italic">“{conn.message}”</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: RECOMMENDED MATCHES */}
      {activeTab === 'recommended' && (
        <div className="space-y-4">
          <p className="text-xs text-[#464555]">
            These peers teach skills matching your learning goals:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedStudents.map((student) => (
              <div
                key={student.id}
                className="bg-white rounded-3xl p-6 shadow-sm border border-[#eaedff] flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={student.avatarUrl}
                      alt={student.name}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white shadow"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-[#131b2e]">{student.name}</h4>
                      <p className="text-xs text-[#464555]">{student.department}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#006c4a] uppercase tracking-wider block">
                      Matches What You Seek:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {student.teachingSkills.map((ts) => (
                        <span
                          key={ts.id}
                          className="px-2 py-0.5 rounded-full bg-[#82f5c1]/30 text-[#00714e] text-xs font-semibold"
                        >
                          {ts.name} ({ts.level})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedStudentToConnect(student)}
                  className="w-full py-2.5 rounded-xl bg-[#3525cd] text-white text-xs font-semibold hover:opacity-95 shadow-xs flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                  <span>Propose Skill Swap</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connect Modal */}
      <ConnectModal
        isOpen={!!selectedStudentToConnect}
        onClose={() => setSelectedStudentToConnect(null)}
        targetStudent={selectedStudentToConnect}
        onSuccess={() => loadData()}
      />
    </div>
  );
};
