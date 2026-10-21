import React, { useState, useEffect } from 'react';
import { PrivacySettings } from '../types';

interface PrivacyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  privacy: PrivacySettings;
  onSave: (newPrivacy: PrivacySettings) => Promise<void>;
}

export const PrivacyDrawer: React.FC<PrivacyDrawerProps> = ({
  isOpen,
  onClose,
  privacy,
  onSave,
}) => {
  const [formData, setFormData] = useState<PrivacySettings>(privacy);
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setFormData(privacy);
  }, [privacy, isOpen]);

  if (!isOpen) return null;

  const handleToggle = (key: keyof PrivacySettings) => {
    setFormData((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 bg-[#131b2e]/40 backdrop-blur-sm z-50 flex justify-end animate-fadeIn">
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto transform transition-transform"
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-controls-title"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#eaedff]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#eaedff] text-[#3525cd]">
                <span className="material-symbols-outlined text-[22px]">admin_panel_settings</span>
              </div>
              <div>
                <h3
                  id="privacy-controls-title"
                  className="text-lg font-bold text-[#131b2e] leading-snug"
                >
                  Privacy & Safety Controls
                </h3>
                <p className="text-xs text-[#464555]">Member Credentialing & Peer Access</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-[#464555] hover:bg-[#eaedff] hover:text-[#131b2e] transition-colors"
              aria-label="Close Privacy Drawer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-[#f2f3ff] text-[#464555] text-xs flex items-start gap-2.5 leading-relaxed">
            <span className="material-symbols-outlined text-[#006c4a] text-[20px] shrink-0 mt-0.5">
              lock
            </span>
            <span>
              Your university email is always hidden. Students only see your verified campus handle
              and department credentials.
            </span>
          </div>

          {/* Toggle Controls */}
          <div className="space-y-4">
            {/* Setting: Public Profile */}
            <div
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  publicProfileEnabled: !(prev.publicProfileEnabled ?? true),
                }));
              }}
              className="flex items-start justify-between gap-4 p-3 rounded-2xl hover:bg-[#f2f3ff] cursor-pointer transition-colors border border-[#eaedff] bg-white"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#131b2e] block">
                    Public Profile
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    (formData.publicProfileEnabled ?? true)
                      ? 'bg-[#82f5c1]/50 text-[#00714e]'
                      : 'bg-[#eaedff] text-[#464555]'
                  }`}>
                    {(formData.publicProfileEnabled ?? true) ? 'ON' : 'OFF'}
                  </span>
                </div>
                <p className="text-xs text-[#464555] leading-relaxed">
                  Allow other people to view the information you've chosen to make public through your SkillSwap profile link.
                </p>
              </div>
              <div
                className={`relative inline-flex items-center shrink-0 mt-1 w-11 h-6 rounded-full p-0.5 transition-colors ${
                  (formData.publicProfileEnabled ?? true) ? 'bg-[#006c4a]' : 'bg-[#c7c4d8]'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    (formData.publicProfileEnabled ?? true) ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>

            {/* Toggle 1: Verified Peers Only */}
            <div
              onClick={() => handleToggle('verifiedPeersOnly')}
              className="flex items-start justify-between gap-4 p-3 rounded-2xl hover:bg-[#f2f3ff] cursor-pointer transition-colors"
            >
              <div className="space-y-0.5">
                <span className="text-sm font-bold text-[#131b2e] block">
                  Verified Peers Only
                </span>
                <p className="text-xs text-[#464555]">
                  Show profile and badge roster solely to verified campus peers (.edu verified).
                </p>
              </div>
              <div
                className={`relative inline-flex items-center shrink-0 mt-1 w-11 h-6 rounded-full p-0.5 transition-colors ${
                  formData.verifiedPeersOnly ? 'bg-[#006c4a]' : 'bg-[#c7c4d8]'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    formData.verifiedPeersOnly ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>

            {/* Toggle 2: Allow Direct Swaps */}
            <div
              onClick={() => handleToggle('allowDirectSwaps')}
              className="flex items-start justify-between gap-4 p-3 rounded-2xl hover:bg-[#f2f3ff] cursor-pointer transition-colors"
            >
              <div className="space-y-0.5">
                <span className="text-sm font-bold text-[#131b2e] block">
                  Allow Direct Swap Requests
                </span>
                <p className="text-xs text-[#464555]">
                  Receive 1-on-1 swap proposals without prior Quadrangle group matches.
                </p>
              </div>
              <div
                className={`relative inline-flex items-center shrink-0 mt-1 w-11 h-6 rounded-full p-0.5 transition-colors ${
                  formData.allowDirectSwaps ? 'bg-[#006c4a]' : 'bg-[#c7c4d8]'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    formData.allowDirectSwaps ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>

            {/* Toggle 3: Public Learning History */}
            <div
              onClick={() => handleToggle('publicLearningHistory')}
              className="flex items-start justify-between gap-4 p-3 rounded-2xl hover:bg-[#f2f3ff] cursor-pointer transition-colors"
            >
              <div className="space-y-0.5">
                <span className="text-sm font-bold text-[#131b2e] block">
                  Public Learning History
                </span>
                <p className="text-xs text-[#464555]">
                  Display learning journey timeline and diagnostic skill badges on public profile.
                </p>
              </div>
              <div
                className={`relative inline-flex items-center shrink-0 mt-1 w-11 h-6 rounded-full p-0.5 transition-colors ${
                  formData.publicLearningHistory ? 'bg-[#006c4a]' : 'bg-[#c7c4d8]'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    formData.publicLearningHistory ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>

            {/* Toggle 4: Anonymous Peer Reviews */}
            <div
              onClick={() => handleToggle('maskReviews')}
              className="flex items-start justify-between gap-4 p-3 rounded-2xl hover:bg-[#f2f3ff] cursor-pointer transition-colors"
            >
              <div className="space-y-0.5">
                <span className="text-sm font-bold text-[#131b2e] block">
                  Mask First Names on Reviews
                </span>
                <p className="text-xs text-[#464555]">
                  Show student initials instead of full collegiate display name on written testimonials.
                </p>
              </div>
              <div
                className={`relative inline-flex items-center shrink-0 mt-1 w-11 h-6 rounded-full p-0.5 transition-colors ${
                  formData.maskReviews ? 'bg-[#006c4a]' : 'bg-[#c7c4d8]'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    formData.maskReviews ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 space-y-3">
          {savedNotice && (
            <div className="p-2.5 rounded-xl bg-[#82f5c1]/30 text-[#00714e] text-xs font-semibold text-center flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              Preferences saved successfully
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-3 rounded-xl bg-[#3525cd] text-white text-sm font-semibold shadow-sm hover:opacity-95 transition-all text-center flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <span>Saving...</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>Save Preferences</span>
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#eaedff] text-[#464555] hover:text-[#131b2e] text-sm font-medium transition-all text-center"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
