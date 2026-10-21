import React, { useState } from 'react';
import { UserProfile } from '../types';

interface SharePublicProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onRegenerateLink?: () => Promise<string>;
  onNavigate?: (route: string) => void;
  onOpenPrivacy?: () => void;
}

export const SharePublicProfileModal: React.FC<SharePublicProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onRegenerateLink,
  onNavigate,
  onOpenPrivacy,
}) => {
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenSuccess, setRegenSuccess] = useState(false);
  const [customPublicId, setCustomPublicId] = useState<string | null>(null);

  const userFallbackId = React.useMemo(() => {
    const slug = (user.name || 'student')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'student';
    const cleanId = (user.id || '').replace(/^user-/, '').replace(/[^a-z0-9]/g, '');
    const suffix = cleanId.substring(0, 5) || Math.random().toString(36).substring(2, 6);
    return `${slug}-${suffix}`;
  }, [user.name, user.id]);

  React.useEffect(() => {
    if (isOpen && !user.publicProfileId && !customPublicId && onRegenerateLink) {
      onRegenerateLink()
        .then((newId) => {
          if (newId) setCustomPublicId(newId);
        })
        .catch((e) => console.warn('Could not auto-persist initial public profile link:', e));
    }
  }, [isOpen, user.publicProfileId, customPublicId, onRegenerateLink]);

  if (!isOpen) return null;

  const publicId = customPublicId || user.publicProfileId || userFallbackId;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://skillswap.campus.edu';
  const publicProfileUrl = `${origin}/profile/public/${publicId}`;

  const isPublicEnabled = user.privacy?.publicProfileEnabled ?? user.publicProfileEnabled ?? true;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(publicProfileUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = publicProfileUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy public profile link:', err);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${user.name}'s SkillSwap Public Profile`,
          text: `Check out ${user.name}'s teaching skills and learning milestones on SkillSwap!`,
          url: publicProfileUrl,
        });
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error('Error with native share:', err);
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleRegenerate = async () => {
    if (!onRegenerateLink) return;
    try {
      setIsRegenerating(true);
      const newId = await onRegenerateLink();
      setCustomPublicId(newId);
      setRegenSuccess(true);
      setTimeout(() => setRegenSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to regenerate link:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handlePreview = () => {
    onClose();
    if (onNavigate) {
      onNavigate(`public-profile:${publicId}`);
    } else {
      window.location.href = `/profile/public/${publicId}`;
    }
  };

  return (
    <div className="fixed inset-0 bg-[#131b2e]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col gap-6 relative border border-[#eaedff] transform transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-public-profile-title"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#eaedff]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#eaedff] text-[#3525cd] flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[24px]">share</span>
            </div>
            <div>
              <h2
                id="share-public-profile-title"
                className="text-lg sm:text-xl font-bold text-[#131b2e] leading-snug"
              >
                Share Public Profile
              </h2>
              <p className="text-xs text-[#464555]">
                Campus Peer Skill Verification & Portfolio Link
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#464555] hover:bg-[#eaedff] hover:text-[#131b2e] transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Privacy Status Banner */}
        {!isPublicEnabled ? (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600 text-[20px] shrink-0 mt-0.5">
              lock
            </span>
            <div className="flex-1 space-y-1">
              <p className="font-semibold text-amber-900">Your public profile is currently set to Private</p>
              <p className="text-amber-800 leading-relaxed">
                Other people opening this link will see &ldquo;This profile is private.&rdquo; Turn on Public Profile in Privacy Settings to make your portfolio visible.
              </p>
              {onOpenPrivacy && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPrivacy();
                  }}
                  className="mt-1 text-xs font-bold text-[#3525cd] underline hover:opacity-80 block"
                >
                  Configure in Privacy Controls &rarr;
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] text-[#464555] text-xs flex items-start gap-3">
            <span className="material-symbols-outlined text-[#006c4a] text-[20px] shrink-0 mt-0.5">
              verified_user
            </span>
            <div className="space-y-0.5">
              <p className="font-semibold text-[#131b2e]">Privacy-Safe Public Link</p>
              <p className="leading-relaxed">
                Only your public skills, achievements, bio, and created lessons are shared. Private emails, credentials, passwords, and monitoring data are never exposed.
              </p>
            </div>
          </div>
        )}

        {/* Link Display & Copy Section */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#131b2e] uppercase tracking-wider block">
            Your public profile link
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 relative flex items-center">
              <span className="material-symbols-outlined text-[#464555] text-[18px] absolute left-3 pointer-events-none">
                link
              </span>
              <input
                type="text"
                readOnly
                value={publicProfileUrl}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#f2f3ff] border border-[#eaedff] text-xs font-mono text-[#131b2e] focus:outline-none select-all"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
            </div>
            <button
              onClick={handleCopy}
              className={`px-4 py-2.5 rounded-xl font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0 ${
                copied
                  ? 'bg-[#006c4a] text-white'
                  : 'bg-[#3525cd] text-white hover:opacity-95'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {copied ? 'check' : 'content_copy'}
              </span>
              <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons: Native share, Preview, Regenerate */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#eaedff] text-[#3525cd] text-xs font-semibold hover:bg-[#dae2fd] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">send_to_mobile</span>
              <span>Share via Device</span>
            </button>
          )}

          <button
            onClick={handlePreview}
            className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#f2f3ff] text-[#131b2e] text-xs font-semibold hover:bg-[#eaedff] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">visibility</span>
            <span>View as Public</span>
          </button>

          {onRegenerateLink && (
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              title="Regenerate unique link identifier if you wish to reset access"
              className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-[#464555] hover:text-[#131b2e] hover:bg-[#f2f3ff] text-xs font-medium transition-colors"
            >
              <span className={`material-symbols-outlined text-[16px] ${isRegenerating ? 'animate-spin' : ''}`}>
                autorenew
              </span>
              <span>{isRegenerating ? 'Regenerating...' : 'Regenerate'}</span>
            </button>
          )}
        </div>

        {regenSuccess && (
          <div className="p-2.5 rounded-xl bg-[#82f5c1]/40 text-[#00714e] text-xs font-semibold text-center flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>New unique public link generated!</span>
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-2 border-t border-[#eaedff] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#eaedff] text-[#131b2e] hover:bg-[#dae2fd] text-xs font-semibold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
