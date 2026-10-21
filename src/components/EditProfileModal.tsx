import React, { useState } from 'react';
import { UserProfile, TeachingSkill, LearningSkill, SkillLevel } from '../types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onSave: (updated: Partial<UserProfile>) => Promise<void>;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
}) => {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);
  const [location, setLocation] = useState(user.location);
  const [department, setDepartment] = useState(user.department);
  const [year, setYear] = useState(user.year);
  const [teachingSkills, setTeachingSkills] = useState<TeachingSkill[]>(user.teachingSkills || []);
  const [learningSkills, setLearningSkills] = useState<LearningSkill[]>(user.learningSkills || []);

  // New skill input states
  const [newTeachSkillName, setNewTeachSkillName] = useState('');
  const [newTeachSkillCategory, setNewTeachSkillCategory] = useState('Computer Science');
  const [newTeachSkillLevel, setNewTeachSkillLevel] = useState<SkillLevel>('Intermediate');

  const [newLearnSkillName, setNewLearnSkillName] = useState('');
  const [newLearnSkillCategory, setNewLearnSkillCategory] = useState('Languages');
  const [newLearnSkillLevel, setNewLearnSkillLevel] = useState<SkillLevel>('Beginner');
  const [newLearnSkillTarget, setNewLearnSkillTarget] = useState<SkillLevel>('Intermediate');

  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleAddTeachSkill = () => {
    if (!newTeachSkillName.trim()) return;
    const newSkill: TeachingSkill = {
      id: `ts-${Date.now()}`,
      name: newTeachSkillName.trim(),
      category: newTeachSkillCategory,
      level: newTeachSkillLevel,
      hoursTaught: 0,
      reviewsCount: 0,
      endorsementsCount: 1,
      proficiencyPercent:
        newTeachSkillLevel === 'Mastery'
          ? 95
          : newTeachSkillLevel === 'Advanced'
          ? 85
          : newTeachSkillLevel === 'Intermediate'
          ? 70
          : 50,
    };
    setTeachingSkills([...teachingSkills, newSkill]);
    setNewTeachSkillName('');
  };

  const handleRemoveTeachSkill = (id: string) => {
    setTeachingSkills(teachingSkills.filter((s) => s.id !== id));
  };

  const handleAddLearnSkill = () => {
    if (!newLearnSkillName.trim()) return;
    const newSkill: LearningSkill = {
      id: `ls-${Date.now()}`,
      name: newLearnSkillName.trim(),
      category: newLearnSkillCategory,
      currentLevel: newLearnSkillLevel,
      targetLevel: newLearnSkillTarget,
      progressPercent: 20,
      hoursPracticed: 0,
      targetDate: 'Open for Swap',
    };
    setLearningSkills([...learningSkills, newSkill]);
    setNewLearnSkillName('');
  };

  const handleRemoveLearnSkill = (id: string) => {
    setLearningSkills(learningSkills.filter((s) => s.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave({
      name,
      bio,
      location,
      department,
      year,
      teachingSkills,
      learningSkills,
    });
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#131b2e]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-[#eaedff]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#eaedff] flex items-center justify-between bg-[#faf8ff]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#4f46e5] text-white">
              <span className="material-symbols-outlined text-[20px]">edit</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#131b2e]">Edit Student Profile & Skills</h2>
              <p className="text-xs text-[#464555]">Update your collegiate credentials and skill swap matrix</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#464555] hover:bg-[#eaedff] hover:text-[#131b2e] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="font-bold text-[#131b2e] text-xs uppercase tracking-wider text-[#3525cd]">
              Basic Student Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#131b2e] mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-[#c7c4d8] text-xs focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#131b2e] mb-1">Campus Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#c7c4d8] text-xs focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#131b2e] mb-1">Major / Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#c7c4d8] text-xs focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#131b2e] mb-1">Graduation Year</label>
                <input
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#c7c4d8] text-xs focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#131b2e] mb-1">Bio & Campus Interests</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2 rounded-xl border border-[#c7c4d8] text-xs focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20 outline-none"
              />
            </div>
          </div>

          {/* Section: Skills I Can Teach */}
          <div className="space-y-4 pt-4 border-t border-[#eaedff]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#006c4a] text-xs uppercase tracking-wider">
                  Skills I Can Teach (Offers)
                </h3>
                <p className="text-xs text-[#464555]">Your peer offerings with verified skill levels</p>
              </div>
              <span className="text-xs font-semibold text-[#006c4a] bg-[#82f5c1]/30 px-2 py-0.5 rounded-full">
                {teachingSkills.length} active
              </span>
            </div>

            {/* List of current teaching skills */}
            <div className="space-y-2">
              {teachingSkills.map((skill) => (
                <div
                  key={skill.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#f2f3ff] border border-[#eaedff]"
                >
                  <div>
                    <span className="font-bold text-[#131b2e] block text-xs">{skill.name}</span>
                    <span className="text-[11px] text-[#464555]">
                      {skill.category} • <strong className="text-[#006c4a]">{skill.level}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveTeachSkill(skill.id)}
                    className="p-1 rounded-lg text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors"
                    title="Remove skill"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Add new teaching skill */}
            <div className="p-3 bg-[#faf8ff] rounded-2xl border border-dashed border-[#c7c4d8] space-y-3">
              <span className="text-xs font-bold text-[#131b2e] block">+ Add Teaching Skill</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="e.g. Python, SQL, Guitar, Spanish"
                  value={newTeachSkillName}
                  onChange={(e) => setNewTeachSkillName(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-[#c7c4d8] text-xs outline-none bg-white"
                />
                <select
                  value={newTeachSkillCategory}
                  onChange={(e) => setNewTeachSkillCategory(e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-[#c7c4d8] text-xs outline-none bg-white"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Languages">Languages</option>
                  <option value="Music & Arts">Music & Arts</option>
                  <option value="Design & UX">Design & UX</option>
                  <option value="Mathematics & Science">Mathematics & Science</option>
                  <option value="Business & Writing">Business & Writing</option>
                </select>
                <select
                  value={newTeachSkillLevel}
                  onChange={(e) => setNewTeachSkillLevel(e.target.value as SkillLevel)}
                  className="px-2 py-1.5 rounded-lg border border-[#c7c4d8] text-xs outline-none bg-white"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Mastery">Mastery Level</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleAddTeachSkill}
                className="px-3 py-1.5 rounded-lg bg-[#006c4a] text-white text-xs font-semibold hover:opacity-90 transition-all"
              >
                Add Skill
              </button>
            </div>
          </div>

          {/* Section: Skills I Want to Learn */}
          <div className="space-y-4 pt-4 border-t border-[#eaedff]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#3525cd] text-xs uppercase tracking-wider">
                  Skills I Want to Learn (Requests)
                </h3>
                <p className="text-xs text-[#464555]">Target skills you want to exchange peer mentorship for</p>
              </div>
              <span className="text-xs font-semibold text-[#3525cd] bg-[#eaedff] px-2 py-0.5 rounded-full">
                {learningSkills.length} goals
              </span>
            </div>

            {/* List of current learning skills */}
            <div className="space-y-2">
              {learningSkills.map((skill) => (
                <div
                  key={skill.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#f2f3ff] border border-[#eaedff]"
                >
                  <div>
                    <span className="font-bold text-[#131b2e] block text-xs">{skill.name}</span>
                    <span className="text-[11px] text-[#464555]">
                      {skill.category} • Current:{' '}
                      <strong className="text-[#3525cd]">{skill.currentLevel}</strong> → Target:{' '}
                      <strong className="text-[#006c4a]">{skill.targetLevel}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveLearnSkill(skill.id)}
                    className="p-1 rounded-lg text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors"
                    title="Remove skill"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Add new learning skill */}
            <div className="p-3 bg-[#faf8ff] rounded-2xl border border-dashed border-[#c7c4d8] space-y-3">
              <span className="text-xs font-bold text-[#131b2e] block">+ Add Learning Goal</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="e.g. Machine Learning, Figma"
                  value={newLearnSkillName}
                  onChange={(e) => setNewLearnSkillName(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-[#c7c4d8] text-xs outline-none bg-white"
                />
                <select
                  value={newLearnSkillCategory}
                  onChange={(e) => setNewLearnSkillCategory(e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-[#c7c4d8] text-xs outline-none bg-white"
                >
                  <option value="Languages">Languages</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Music & Arts">Music & Arts</option>
                  <option value="Design & UX">Design & UX</option>
                  <option value="Mathematics & Science">Mathematics & Science</option>
                  <option value="Business & Writing">Business & Writing</option>
                </select>
                <select
                  value={newLearnSkillLevel}
                  onChange={(e) => setNewLearnSkillLevel(e.target.value as SkillLevel)}
                  className="px-2 py-1.5 rounded-lg border border-[#c7c4d8] text-xs outline-none bg-white"
                >
                  <option value="Beginner">Current: Beginner</option>
                  <option value="Intermediate">Current: Intermediate</option>
                  <option value="Advanced">Current: Advanced</option>
                </select>
                <select
                  value={newLearnSkillTarget}
                  onChange={(e) => setNewLearnSkillTarget(e.target.value as SkillLevel)}
                  className="px-2 py-1.5 rounded-lg border border-[#c7c4d8] text-xs outline-none bg-white"
                >
                  <option value="Intermediate">Target: Intermediate</option>
                  <option value="Advanced">Target: Advanced</option>
                  <option value="Mastery">Target: Mastery</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleAddLearnSkill}
                className="px-3 py-1.5 rounded-lg bg-[#3525cd] text-white text-xs font-semibold hover:opacity-90 transition-all"
              >
                Add Goal
              </button>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-4 border-t border-[#eaedff] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#eaedff] text-[#464555] font-semibold text-xs hover:bg-[#e2e7ff] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-[#3525cd] text-white font-semibold text-xs shadow-sm hover:opacity-95 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">check</span>
              <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
