import React, { useState, useEffect } from 'react';
import { UserProfile, LessonContext } from '../types';
import { apiService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { ConnectModal } from '../components/ConnectModal';

interface StudentDirectoryPageProps {
  onNavigate: (route: string) => void;
  onOpenChat?: (conversationId?: string, lessonContext?: LessonContext) => void;
}

export const StudentDirectoryPage: React.FC<StudentDirectoryPageProps> = ({
  onNavigate,
  onOpenChat,
}) => {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedUniversity, setSelectedUniversity] = useState('All');
  const [onlineOnly, setOnlineOnly] = useState(false);

  // Connect Modal state
  const [selectedStudentToConnect, setSelectedStudentToConnect] = useState<UserProfile | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadDirectory();
  }, [searchQuery, selectedSkill, selectedLevel, selectedDepartment, selectedUniversity, onlineOnly]);

  const loadDirectory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getSkillSwapUsers({
        q: searchQuery.trim() || undefined,
        skill: selectedSkill !== 'All' ? selectedSkill : undefined,
        level: selectedLevel !== 'All' ? selectedLevel : undefined,
        department: selectedDepartment !== 'All' ? selectedDepartment : undefined,
        university: selectedUniversity !== 'All' ? selectedUniversity : undefined,
        onlineOnly: onlineOnly ? true : undefined,
      });
      setStudents(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load user directory:', err);
      setError(
        err?.message || 'Unable to load campus student directory. Please verify your connection.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyEmail = (email: string) => {
    if (!email) return;
    navigator.clipboard?.writeText(email);
    setCopyFeedback(email);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  // Extract unique departments & universities for filter dropdowns
  const departments = [
    'All',
    'Computer Science',
    'Electrical Engineering',
    'EECS',
    'Mechanical Engineering',
    'Economics',
    'Music',
    'Design & Architecture',
    'Data Science',
    'Mathematics',
  ];

  const universities = [
    'All',
    'UC Berkeley',
    'Stanford University',
    'MIT',
    'Harvard University',
    'UCLA',
  ];

  const skillLevels = ['All', 'Beginner', 'Intermediate', 'Advanced', 'Mastery'];

  const safeStudents = Array.isArray(students) ? students : [];
  const onlineCount = safeStudents.filter((s: any) => s && s.isOnline).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fadeIn">
      {/* Directory Hero Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#eaedff] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e2e7ff] text-[#3525cd] text-xs font-semibold">
            <span className="material-symbols-outlined text-[16px]">badge</span>
            <span>Verified Campus Student Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#131b2e] tracking-tight">
            SkillSwap Student Directory
          </h1>
          <p className="text-xs sm:text-sm text-[#464555] max-w-2xl leading-relaxed">
            Discover registered collegiate peers, review their teaching and learning skills,
            and connect for genuine peer knowledge exchanges and study sessions.
          </p>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-4 pt-2 text-xs font-medium text-[#464555] flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#3525cd]">group</span>
              <strong>{students.length}</strong> Registered Students
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#006c4a] animate-pulse" />
              <strong>{onlineCount}</strong> Online Now
            </span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#006c4a]">verified</span>
              Campus Verified
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('explore-skills')}
            className="px-4 py-2.5 rounded-xl border border-[#eaedff] hover:bg-[#f2f3ff] text-xs font-semibold text-[#131b2e] transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">explore</span>
            <span>Explore Skills</span>
          </button>
          <button
            onClick={() => onNavigate('my-profile-and-badges')}
            className="px-4 py-2.5 rounded-xl bg-[#3525cd] text-white text-xs font-semibold shadow-xs hover:opacity-95 transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
            <span>My Profile</span>
          </button>
        </div>
      </div>

      {copyFeedback && (
        <div className="p-3.5 rounded-2xl bg-[#82f5c1]/30 border border-[#82f5c1] text-[#00714e] text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>Copied student email address to clipboard: <strong>{copyFeedback}</strong></span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#eaedff] space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search Query */}
          <div className="lg:col-span-4 relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-[#8b8a9d]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, email, or skill..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#c7c4d8] text-xs sm:text-sm bg-white text-[#131b2e] outline-none focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b8a9d] hover:text-[#131b2e]"
                title="Clear search"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* Skill Filter */}
          <div className="lg:col-span-2">
            <input
              type="text"
              value={selectedSkill === 'All' ? '' : selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value.trim() ? e.target.value : 'All')}
              placeholder="Filter by Skill..."
              className="w-full px-3 py-2.5 rounded-xl border border-[#c7c4d8] text-xs sm:text-sm bg-white font-medium text-[#131b2e] outline-none focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20"
            />
          </div>

          {/* Skill Level Filter */}
          <div className="lg:col-span-2">
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#c7c4d8] text-xs sm:text-sm bg-white font-medium text-[#131b2e] outline-none"
            >
              {skillLevels.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl === 'All' ? 'All Skill Levels' : lvl}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div className="lg:col-span-2">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#c7c4d8] text-xs sm:text-sm bg-white font-medium text-[#131b2e] outline-none"
            >
              <option value="All">All Departments</option>
              {departments.slice(1).map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Online Presence Toggle */}
          <div className="lg:col-span-2 flex items-center justify-end sm:justify-start lg:justify-end gap-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#131b2e] select-none">
              <input
                type="checkbox"
                checked={onlineOnly}
                onChange={(e) => setOnlineOnly(e.target.checked)}
                className="w-4 h-4 rounded border-[#c7c4d8] text-[#3525cd] focus:ring-[#3525cd]"
              />
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#006c4a]" />
                Online Only
              </span>
            </label>
          </div>
        </div>

        {/* Active Filter Chips */}
        {(searchQuery || selectedSkill !== 'All' || selectedLevel !== 'All' || selectedDepartment !== 'All' || selectedUniversity !== 'All' || onlineOnly) && (
          <div className="flex items-center gap-2 pt-2 border-t border-[#eaedff] flex-wrap text-xs text-[#464555]">
            <span className="text-[11px] font-bold text-[#8b8a9d]">Active Filters:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#f2f3ff] text-[#3525cd] font-medium border border-[#eaedff]">
                Query: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:text-black">×</button>
              </span>
            )}
            {selectedSkill !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#f2f3ff] text-[#3525cd] font-medium border border-[#eaedff]">
                Skill: {selectedSkill}
                <button onClick={() => setSelectedSkill('All')} className="hover:text-black">×</button>
              </span>
            )}
            {selectedLevel !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#f2f3ff] text-[#3525cd] font-medium border border-[#eaedff]">
                Level: {selectedLevel}
                <button onClick={() => setSelectedLevel('All')} className="hover:text-black">×</button>
              </span>
            )}
            {selectedDepartment !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#f2f3ff] text-[#3525cd] font-medium border border-[#eaedff]">
                Dept: {selectedDepartment}
                <button onClick={() => setSelectedDepartment('All')} className="hover:text-black">×</button>
              </span>
            )}
            {selectedUniversity !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#f2f3ff] text-[#3525cd] font-medium border border-[#eaedff]">
                Campus: {selectedUniversity}
                <button onClick={() => setSelectedUniversity('All')} className="hover:text-black">×</button>
              </span>
            )}
            {onlineOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#d2f8e5] text-[#00714e] font-medium border border-[#82f5c1]">
                Active Online
                <button onClick={() => setOnlineOnly(false)} className="hover:text-black">×</button>
              </span>
            )}
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSkill('All');
                setSelectedLevel('All');
                setSelectedDepartment('All');
                setSelectedUniversity('All');
                setOnlineOnly(false);
              }}
              className="text-[#3525cd] hover:underline font-semibold text-[11px] ml-1"
            >
              Reset All
            </button>
          </div>
        )}
      </div>

      {/* Directory Grid / Loading / Error / Empty States */}
      {isLoading ? (
        /* Loading Skeleton */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-6 border border-[#eaedff] space-y-4 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#f2f3ff]" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-[#f2f3ff] rounded-md w-3/4" />
                  <div className="h-3 bg-[#f2f3ff] rounded-md w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-[#f2f3ff] rounded-md w-full" />
                <div className="h-3 bg-[#f2f3ff] rounded-md w-5/6" />
              </div>
              <div className="h-8 bg-[#f2f3ff] rounded-xl" />
            </div>
          ))}
        </div>
      ) : error ? (
        /* Error State */
        <div className="bg-white rounded-3xl p-10 text-center border border-red-200 space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 text-[#ba1a1a] flex items-center justify-center">
            <span className="material-symbols-outlined text-[30px]">warning</span>
          </div>
          <h3 className="text-lg font-bold text-[#131b2e]">Unable to Load Student Directory</h3>
          <p className="text-xs text-[#ba1a1a] max-w-md mx-auto">{error}</p>
          <button
            onClick={loadDirectory}
            className="px-5 py-2 rounded-xl bg-[#3525cd] text-white text-xs font-semibold hover:opacity-95"
          >
            Retry Loading Directory
          </button>
        </div>
      ) : safeStudents.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 text-center border border-[#eaedff] space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#f2f3ff] text-[#3525cd] flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px]">person_search</span>
          </div>
          <h3 className="text-lg font-bold text-[#131b2e]">
            {!searchQuery && selectedSkill === 'All' && selectedLevel === 'All' && selectedDepartment === 'All' && selectedUniversity === 'All'
              ? 'No students have joined yet. Be the first to connect!'
              : 'No Students Match Your Criteria'}
          </h3>
          <p className="text-xs text-[#464555] max-w-md mx-auto">
            {!searchQuery && selectedSkill === 'All' && selectedLevel === 'All' && selectedDepartment === 'All' && selectedUniversity === 'All'
              ? 'Be the first collegiate peer to join and exchange skills on campus.'
              : (searchQuery
                ? `No registered students match "${searchQuery}". Try searching with different keywords, department, or clearing filters.`
                : 'No students found with the current filters.')}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedSkill('All');
              setSelectedLevel('All');
              setSelectedDepartment('All');
              setSelectedUniversity('All');
              setOnlineOnly(false);
            }}
            className="px-4 py-2 rounded-xl bg-[#3525cd] text-white text-xs font-semibold hover:opacity-95"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        /* Main Directory Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {safeStudents.map((student: any) => {
            const isSelf = currentUser?.id === student.id;
            const teachingSkills = Array.isArray(student.teachingSkills) ? student.teachingSkills : [];
            const learningSkills = Array.isArray(student.learningSkills) ? student.learningSkills : [];

            return (
              <div
                key={student.id}
                className={`bg-white rounded-3xl p-6 shadow-sm border transition-all flex flex-col justify-between space-y-4 hover:shadow-md ${
                  isSelf ? 'border-[#3525cd]/40 bg-[#fafbff]' : 'border-[#eaedff] hover:border-[#3525cd]/30'
                }`}
              >
                <div className="space-y-4">
                  {/* Top Bar: Avatar, Online Status, Name, Verified */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={student.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(student.name || 'student')}`}
                          alt={student.name}
                          className="w-14 h-14 rounded-2xl object-cover ring-2 ring-[#eaedff]"
                        />
                        {/* Real Presence Indicator */}
                        <span
                          className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                            student.isOnline ? 'bg-[#006c4a]' : 'bg-[#c7c4d8]'
                          }`}
                          title={student.isOnline ? 'Online now' : 'Offline'}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-base text-[#131b2e] truncate">
                            {student.name}
                          </h3>
                          {student.isVerified && (
                            <span
                              className="material-symbols-outlined text-[16px] text-[#006c4a]"
                              title="Verified Campus Student"
                            >
                              verified
                            </span>
                          )}
                          {isSelf && (
                            <span className="px-2 py-0.5 rounded-full bg-[#e2e7ff] text-[#3525cd] text-[10px] font-bold">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#464555] truncate">
                          {student.department || 'Student'} • {student.year || "'26"}
                        </p>
                        <p className="text-[11px] text-[#8b8a9d] font-medium truncate">
                          {student.university || 'Campus'}
                        </p>
                      </div>
                    </div>

                    {/* Online status badge */}
                    <div className="shrink-0 text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          student.isOnline
                            ? 'bg-[#d2f8e5] text-[#00714e]'
                            : 'bg-[#f2f3ff] text-[#8b8a9d]'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${student.isOnline ? 'bg-[#006c4a]' : 'bg-[#8b8a9d]'}`} />
                        <span>{student.isOnline ? 'Active Now' : 'Offline'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Authorized Email Display */}
                  {student.email && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#f2f3ff] text-xs text-[#131b2e] border border-[#eaedff]">
                      <div className="flex items-center gap-2 truncate">
                        <span className="material-symbols-outlined text-[16px] text-[#3525cd]">
                          mail
                        </span>
                        <a
                          href={`mailto:${student.email}`}
                          className="font-medium text-[#3525cd] hover:underline truncate"
                          title="Send campus email"
                        >
                          {student.email}
                        </a>
                      </div>
                      <button
                        onClick={() => handleCopyEmail(student.email)}
                        className="text-[#8b8a9d] hover:text-[#3525cd] shrink-0 p-1"
                        title="Copy email address"
                      >
                        <span className="material-symbols-outlined text-[16px]">content_copy</span>
                      </button>
                    </div>
                  )}

                  {/* Bio Description */}
                  {student.bio && (
                    <p className="text-xs text-[#464555] line-clamp-2 leading-relaxed">
                      {student.bio}
                    </p>
                  )}

                  {/* Reputation / Stats pill */}
                  <div className="flex items-center justify-between text-[11px] text-[#464555] pt-1">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-[#e09100]">
                        star
                      </span>
                      <strong>{student.peerReputation || 5.0}</strong>
                      <span className="text-[#8b8a9d]">({student.reviewCount || 0} reviews)</span>
                    </span>
                    <span className="font-semibold text-[#006c4a]">
                      {student.walletBalance ?? 10} Swap Credits
                    </span>
                  </div>

                  {/* Skills Section */}
                  <div className="space-y-2 pt-1 border-t border-[#eaedff]">
                    {/* Teaches */}
                    <div>
                      <span className="text-[10px] font-bold text-[#00714e] uppercase tracking-wider block mb-1">
                        Can Teach:
                      </span>
                      {teachingSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {teachingSkills.slice(0, 3).map((ts: any) => (
                            <span
                              key={ts.id || ts.name}
                              className="px-2 py-0.5 rounded-md bg-[#d2f8e5] text-[#00714e] text-[10px] font-semibold"
                            >
                              {ts.name} {ts.level ? `(${ts.level})` : ''}
                            </span>
                          ))}
                          {teachingSkills.length > 3 && (
                            <span className="text-[10px] text-[#8b8a9d] self-center">
                              +{teachingSkills.length - 3} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#8b8a9d] italic">No skills listed yet</span>
                      )}
                    </div>

                    {/* Learning */}
                    <div>
                      <span className="text-[10px] font-bold text-[#3525cd] uppercase tracking-wider block mb-1">
                        Wants to Learn:
                      </span>
                      {learningSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {learningSkills.slice(0, 3).map((ls: any) => (
                            <span
                              key={ls.id || ls.name}
                              className="px-2 py-0.5 rounded-md bg-[#eaedff] text-[#3525cd] text-[10px] font-medium"
                            >
                              {ls.name}
                            </span>
                          ))}
                          {learningSkills.length > 3 && (
                            <span className="text-[10px] text-[#8b8a9d] self-center">
                              +{learningSkills.length - 3} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#8b8a9d] italic">Open to any peer skill</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-[#eaedff] flex items-center gap-2">
                  {!isSelf ? (
                    <>
                      <button
                        onClick={() => setSelectedStudentToConnect(student)}
                        className="flex-1 py-2.5 rounded-xl bg-[#3525cd] text-white text-xs font-semibold hover:opacity-95 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[16px]">handshake</span>
                        <span>Propose Swap</span>
                      </button>
                      <button
                        onClick={() => {
                          if (onOpenChat) {
                            onOpenChat(undefined, {
                              lessonId: '',
                              lessonTitle: `Chat with ${student.name}`,
                              skillName: teachingSkills[0]?.name || 'Peer Exchange',
                              category: student.department || 'Campus',
                            });
                          } else {
                            onNavigate('messages');
                          }
                        }}
                        className="p-2.5 rounded-xl border border-[#eaedff] text-[#464555] hover:text-[#3525cd] hover:bg-[#f2f3ff] transition-all"
                        title="Direct message peer"
                      >
                        <span className="material-symbols-outlined text-[18px]">forum</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => onNavigate('my-profile-and-badges')}
                      className="w-full py-2.5 rounded-xl bg-[#eaedff] text-[#3525cd] text-xs font-semibold hover:bg-[#e2e7ff] transition-all flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      <span>Manage Your Profile</span>
                    </button>
                  )}

                  {student.publicProfileId && (
                    <button
                      onClick={() => {
                        window.history.pushState({}, '', `/profile/public/${student.publicProfileId}`);
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }}
                      className="p-2.5 rounded-xl border border-[#eaedff] text-[#464555] hover:text-[#3525cd] hover:bg-[#f2f3ff] transition-all"
                      title="View public verified profile"
                    >
                      <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Connect Modal for Proposing Swaps */}
      {selectedStudentToConnect && (
        <ConnectModal
          isOpen={!!selectedStudentToConnect}
          targetStudent={selectedStudentToConnect}
          onClose={() => setSelectedStudentToConnect(null)}
          onSuccess={() => {
            setSelectedStudentToConnect(null);
            loadDirectory();
          }}
        />
      )}
    </div>
  );
};
