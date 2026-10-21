import React, { useState } from 'react';
import { UserProfile } from '../types';
import { apiService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetStudent: UserProfile | null;
  onSuccess?: () => void;
}

export const ConnectModal: React.FC<ConnectModalProps> = ({
  isOpen,
  onClose,
  targetStudent,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const [selectedLearnSkill, setSelectedLearnSkill] = useState('');
  const [selectedTeachSkill, setSelectedTeachSkill] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Initialize defaults when modal opens
  React.useEffect(() => {
    if (targetStudent && targetStudent.teachingSkills?.length > 0) {
      setSelectedLearnSkill(targetStudent.teachingSkills[0].name);
    }
    if (currentUser && currentUser.teachingSkills?.length > 0) {
      setSelectedTeachSkill(currentUser.teachingSkills[0].name);
    }
    setMessage(
      `Hey ${targetStudent?.name?.split(' ')[0] || 'there'}! I'd love to learn from your experience and share what I know in return. Are you free for an initial 45-minute peer session this week?`
    );
    setSubmitted(false);
  }, [targetStudent, currentUser, isOpen]);

  if (!isOpen || !targetStudent) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiService.sendSwapRequest({
        toUserId: targetStudent.id,
        teachSkill: selectedTeachSkill || 'Peer Mentoring',
        learnSkill: selectedLearnSkill || 'Skill Development',
        message,
      });
      setSubmitted(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Failed to send request:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#131b2e]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-[#eaedff]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#eaedff] flex items-center justify-between bg-[#faf8ff]">
          <div className="flex items-center gap-3">
            <img
              src={targetStudent.avatarUrl}
              alt={targetStudent.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-[#006c4a]"
            />
            <div>
              <h3 className="font-bold text-base text-[#131b2e] leading-snug">
                Propose Skill Swap with {targetStudent.name}
              </h3>
              <p className="text-xs text-[#464555]">
                {targetStudent.department} • {targetStudent.university}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#464555] hover:bg-[#eaedff] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-[#82f5c1] text-[#00714e] flex items-center justify-center mx-auto shadow-sm">
              <span className="material-symbols-outlined text-[32px]">check_circle</span>
            </div>
            <h4 className="font-bold text-lg text-[#131b2e]">Swap Proposal Sent!</h4>
            <p className="text-xs text-[#464555] max-w-sm mx-auto">
              We notified {targetStudent.name}. Once accepted, you both earn credits and can schedule your session in the Lesson Room.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
            {/* Barter Pair Grid */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#f2f3ff] rounded-2xl border border-[#eaedff]">
              <div>
                <span className="font-bold text-[#006c4a] block mb-1">
                  1. You Want to Learn:
                </span>
                <select
                  value={selectedLearnSkill}
                  onChange={(e) => setSelectedLearnSkill(e.target.value)}
                  className="w-full p-2 rounded-xl bg-white border border-[#c7c4d8] font-medium text-[#131b2e] text-xs outline-none"
                >
                  {targetStudent.teachingSkills.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.level})
                    </option>
                  ))}
                  <option value="General Campus Mentoring">General Campus Mentoring</option>
                </select>
              </div>

              <div>
                <span className="font-bold text-[#3525cd] block mb-1">
                  2. You Can Teach Back:
                </span>
                <select
                  value={selectedTeachSkill}
                  onChange={(e) => setSelectedTeachSkill(e.target.value)}
                  className="w-full p-2 rounded-xl bg-white border border-[#c7c4d8] font-medium text-[#131b2e] text-xs outline-none"
                >
                  {currentUser?.teachingSkills?.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.level})
                    </option>
                  )) || <option value="Python Tutoring">Python Tutoring</option>}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#131b2e] mb-1">
                Personalized Note & Proposed Quad Meeting Time
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                required
                className="w-full p-3 rounded-xl border border-[#c7c4d8] outline-none text-xs focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20"
              />
            </div>

            <div className="p-3 rounded-xl bg-[#82f5c1]/20 text-[#00714e] flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              <span>100% Free Peer-to-Peer Student Guarantee applies to this swap proposal.</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#eaedff]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#eaedff] text-[#464555] font-semibold hover:bg-[#e2e7ff] transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-[#3525cd] text-white font-semibold shadow-sm hover:opacity-95 transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
                <span>{isSubmitting ? 'Sending Proposal...' : 'Send Swap Proposal'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
