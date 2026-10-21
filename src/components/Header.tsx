import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { NotificationItem } from '../types';

interface HeaderProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  notifications: NotificationItem[];
  onOpenNotifications: () => void;
  isAiOpen?: boolean;
  onToggleAiAssistant?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRoute,
  onNavigate,
  notifications,
  onOpenNotifications,
  isAiOpen,
  onToggleAiAssistant,
}) => {
  const { currentUser, logout } = useAuth();
  const { highContrast, toggleHighContrast, reducedMotion, toggleReducedMotion, fontSize, setFontSize } = useAccessibility();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [a11yMenuOpen, setA11yMenuOpen] = useState(false);

  // The authenticated navigation bar must NOT appear when the user is logged out
  if (!currentUser) {
    return null;
  }

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifications.filter((n) => !n.read).length;

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'explore-skills', label: 'Explore Skills' },
    { id: 'directory', label: 'Student Directory' },
    { id: 'lesson-room', label: 'Lesson Room' },
    { id: 'teaching-studio', label: 'Teaching Studio' },
    { id: 'connections', label: 'Connections' },
    { id: 'messages', label: 'Messages' },
    { id: 'my-profile-and-badges', label: 'My Profile & Badges' },
  ];

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-[#ffffff]/95 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-[#eaedff]">
      <div className="h-20 max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Logo & Campus Beta badge */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => handleNavClick('landing')}
            className="flex items-center gap-2.5 text-left focus:outline-none"
            aria-label="SkillSwap Home"
          >
            {/* Custom geometric logo matching Stitch */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#3525cd] to-[#4f46e5] flex items-center justify-center text-white shadow-sm font-black text-lg">
              <span className="material-symbols-outlined text-[20px]">swap_calls</span>
            </div>
            <span className="font-bold text-[22px] tracking-tight text-[#131b2e]">
              SkillSwap
            </span>
          </button>
          <span className="px-2.5 py-0.5 rounded-full bg-[#e2e7ff] text-[#3525cd] text-[11px] font-bold uppercase tracking-wider hidden sm:inline-block">
            Campus Beta
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 p-1 bg-[#f2f3ff] rounded-xl">
          {navLinks.map((link) => {
            const isActive = currentRoute === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all ${
                  isActive
                    ? 'bg-[#4f46e5] text-white shadow-sm'
                    : 'text-[#464555] hover:text-[#131b2e] hover:bg-[#eaedff]'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right Action Icons & Profile */}
        <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
          {/* Swap Credits Counter (Authenticated Users Only) */}
          {currentUser && (
            <button
              onClick={() => handleNavClick('my-profile-and-badges')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#82f5c1] text-[#00714e] shadow-sm hover:brightness-95 transition-all text-left"
              title="Wallet Balance: Click to view earnings"
            >
              <span className="material-symbols-outlined text-[18px]">bolt</span>
              <span className="text-[13px] font-bold">
                {currentUser.walletBalance ?? 0} Swap Credits
              </span>
            </button>
          )}

          {/* Accessibility Quick Menu */}
          <div className="relative">
            <button
              onClick={() => setA11yMenuOpen(!a11yMenuOpen)}
              className="p-2 rounded-full text-[#464555] hover:bg-[#eaedff] hover:text-[#131b2e] transition-colors"
              title="Accessibility Settings"
              aria-label="Accessibility Settings"
            >
              <span className="material-symbols-outlined text-[20px]">accessibility</span>
            </button>

            {a11yMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#c7c4d8]/40 p-4 z-50 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#eaedff]">
                  <span className="font-bold text-sm text-[#131b2e]">Accessibility</span>
                  <button
                    onClick={() => setA11yMenuOpen(false)}
                    className="text-[#464555] hover:text-[#131b2e]"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#464555]">High Contrast</span>
                  <button
                    onClick={toggleHighContrast}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                      highContrast ? 'bg-[#3525cd]' : 'bg-[#c7c4d8]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        highContrast ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#464555]">Reduced Motion</span>
                  <button
                    onClick={toggleReducedMotion}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                      reducedMotion ? 'bg-[#3525cd]' : 'bg-[#c7c4d8]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        reducedMotion ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <span className="text-xs font-semibold text-[#464555] block mb-1.5">
                    Text Size
                  </span>
                  <div className="grid grid-cols-3 gap-1 bg-[#f2f3ff] p-1 rounded-lg">
                    {(['normal', 'medium', 'large'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => setFontSize(size)}
                        className={`text-xs py-1 rounded capitalize font-medium ${
                          fontSize === size
                            ? 'bg-[#3525cd] text-white shadow-xs'
                            : 'text-[#464555] hover:text-[#131b2e]'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SkillSwap AI Assistant Button */}
          {onToggleAiAssistant && (
            <button
              onClick={onToggleAiAssistant}
              className={`relative px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                isAiOpen
                  ? 'bg-gradient-to-r from-[#3525cd] to-[#006c4a] text-white shadow-xs'
                  : 'bg-[#f2f3ff] text-[#3525cd] hover:bg-[#eaedff]'
              }`}
              type="button"
              aria-label="SkillSwap AI Assistant"
              title="SkillSwap AI Assistant (Multilingual)"
            >
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              <span className="text-xs font-bold hidden md:inline-block">AI Tutor</span>
            </button>
          )}

          {/* Peer Messages Button */}
          <button
            onClick={() => handleNavClick('messages')}
            className={`relative p-2 rounded-full transition-colors ${
              currentRoute === 'messages'
                ? 'bg-[#e2e7ff] text-[#3525cd]'
                : 'text-[#464555] hover:bg-[#eaedff] hover:text-[#131b2e]'
            }`}
            type="button"
            aria-label="Peer Messages"
            title="Peer Messages & Mentors"
          >
            <span className="material-symbols-outlined text-[22px]">forum</span>
          </button>

          {/* Notifications Bell (Authenticated Users Only) */}
          {currentUser && (
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-full text-[#464555] hover:bg-[#eaedff] hover:text-[#131b2e] transition-colors"
              type="button"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#ba1a1a] text-white text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          {/* User Profile Avatar & Name OR Login/Signup Actions */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 pl-1 sm:pl-2 text-left focus:outline-none"
                aria-label="User Profile Menu"
              >
                <div className="relative">
                  <img
                    alt={currentUser.name || 'Student'}
                    className="w-9 h-9 rounded-full object-cover shadow-sm ring-2 ring-white"
                    src={
                      currentUser.avatarUrl ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name || 'Student')}&backgroundColor=3525cd&textColor=ffffff`
                    }
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#006c4a] ring-2 ring-white"></span>
                </div>
                <div className="hidden md:flex flex-col">
                  <span className="text-[13px] text-[#131b2e] leading-tight font-semibold flex items-center gap-1">
                    {currentUser.name || 'Student'}
                    <span className="material-symbols-outlined text-[14px] text-[#464555]">
                      expand_more
                    </span>
                  </span>
                  <span className="text-[11px] text-[#464555] leading-none mt-0.5">
                    {currentUser.department || 'Student'} {currentUser.year || ''}
                  </span>
                </div>
              </button>

              {/* Profile Dropdown */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#c7c4d8]/40 p-2 z-50 space-y-1">
                  <div className="p-3 border-b border-[#eaedff]">
                    <p className="font-bold text-sm text-[#131b2e]">{currentUser.name || 'Student'}</p>
                    <p className="text-xs text-[#464555]">{currentUser.email || ''}</p>
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#82f5c1]/30 text-[#00714e] text-[10px] font-semibold">
                      <span className="material-symbols-outlined text-[12px]">verified</span>
                      <span>.edu Verified Student</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      handleNavClick('my-profile-and-badges');
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-[#131b2e] hover:bg-[#f2f3ff] rounded-xl flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px] text-[#3525cd]">
                      person
                    </span>
                    My Profile & Badges
                  </button>

                  <button
                    onClick={() => {
                      handleNavClick('connections');
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-[#131b2e] hover:bg-[#f2f3ff] rounded-xl flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px] text-[#006c4a]">
                      group
                    </span>
                    My Peer Connections
                  </button>

                  <div className="pt-2 border-t border-[#eaedff]">
                    <button
                      onClick={async () => {
                        await logout();
                        handleNavClick('auth');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded-xl flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">logout</span>
                      Sign Out / Switch Account
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleNavClick('auth')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#3525cd] hover:bg-[#eaedff] transition-all"
              >
                Log In
              </button>
              <button
                onClick={() => handleNavClick('auth')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#3525cd] text-white hover:bg-[#2b1ea8] shadow-sm transition-all"
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-[#464555] hover:bg-[#eaedff] hover:text-[#131b2e]"
            aria-label="Toggle Navigation"
          >
            <span className="material-symbols-outlined text-[24px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-[#eaedff] px-6 py-4 space-y-2 shadow-lg animate-fadeIn">
          {navLinks.map((link) => {
            const isActive = currentRoute === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#4f46e5] text-white shadow-sm'
                    : 'text-[#464555] hover:bg-[#f2f3ff] hover:text-[#131b2e]'
                }`}
              >
                {link.label}
              </button>
            );
          })}
          <div className="pt-2 border-t border-[#eaedff] flex items-center justify-between">
            <button
              onClick={() => handleNavClick('landing')}
              className="text-xs font-semibold text-[#3525cd] hover:underline"
            >
              Back to Overview
            </button>
            {currentUser ? (
              <button
                onClick={async () => {
                  await logout();
                  handleNavClick('auth');
                }}
                className="text-xs font-semibold text-[#ba1a1a] hover:underline"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => handleNavClick('auth')}
                className="text-xs font-bold text-[#3525cd] hover:underline"
              >
                Log In / Register
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
