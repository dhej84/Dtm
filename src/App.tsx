import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { NotificationsModal } from './components/NotificationsModal';
import { ProfilePage } from './pages/ProfilePage';
import { ExplorePage } from './pages/ExplorePage';
import { LessonRoomPage } from './pages/LessonRoomPage';
import { DashboardPage } from './pages/DashboardPage';
import { TeachingStudioPage } from './pages/TeachingStudioPage';
import { ConnectionsPage } from './pages/ConnectionsPage';
import { MessagesPage } from './pages/MessagesPage';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { PublicProfilePage } from './pages/PublicProfilePage';
import { StudentDirectoryPage } from './pages/StudentDirectoryPage';
import { AiChatPanel } from './components/AiAssistant/AiChatPanel';
import { AiFloatingTrigger } from './components/AiAssistant/AiFloatingTrigger';
import { ErrorBoundary } from './components/ErrorBoundary';
import { tokenStorage } from './services/api/tokenStorage';
import { apiService } from './services/apiService';
import { NotificationItem, Lesson, LessonContext } from './types';

const AUTHENTICATED_ROUTES = new Set([
  'dashboard',
  'explore-skills',
  'directory',
  'lesson-room',
  'teaching-studio',
  'connections',
  'messages',
  'my-profile-and-badges',
]);

function getRouteInfoFromPath(path: string): { route: string; publicProfileId?: string } {
  const cleanPath = path.toLowerCase().trim().replace(/\/+$/, '');
  if (cleanPath.startsWith('/profile/public/')) {
    const id = path.replace(/^\/profile\/public\//i, '').split('/')[0];
    return { route: 'public-profile', publicProfileId: id };
  }
  if (cleanPath.startsWith('/u/')) {
    const id = path.replace(/^\/u\//i, '').split('/')[0];
    return { route: 'public-profile', publicProfileId: id };
  }
  if (cleanPath === '/dashboard') return { route: 'dashboard' };
  if (cleanPath === '/explore' || cleanPath === '/explore-skills') return { route: 'explore-skills' };
  if (cleanPath === '/directory' || cleanPath === '/students' || cleanPath === '/users') return { route: 'directory' };
  if (cleanPath === '/lesson-room' || cleanPath === '/lesson' || cleanPath === '/lessons') return { route: 'lesson-room' };
  if (cleanPath === '/teaching' || cleanPath === '/teaching-studio') return { route: 'teaching-studio' };
  if (cleanPath === '/connections' || cleanPath === '/peers') return { route: 'connections' };
  if (cleanPath === '/messages' || cleanPath === '/chat') return { route: 'messages' };
  if (cleanPath === '/profile' || cleanPath === '/my-profile-and-badges') return { route: 'my-profile-and-badges' };
  if (cleanPath === '/landing' || cleanPath === '/overview') return { route: 'landing' };
  if (cleanPath === '/auth' || cleanPath === '/login' || cleanPath === '/signup') return { route: 'auth' };
  return { route: 'default' };
}

function MainLayout() {
  const { currentUser, isLoading, updateProfile } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const { route } = getRouteInfoFromPath(window.location.pathname);
      return route === 'default' ? 'dashboard' : route;
    }
    return 'dashboard';
  });
  const [viewingPublicProfileId, setViewingPublicProfileId] = useState<string>('');
  const [activeLessonId, setActiveLessonId] = useState<string>('lesson-1');
  const [chatConversationId, setChatConversationId] = useState<string | undefined>();
  const [chatLessonContext, setChatLessonContext] = useState<LessonContext | undefined>();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(true);
  const [activeAiLessonContext, setActiveAiLessonContext] = useState<LessonContext | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadGlobalData();
    } else {
      setLessons([]);
      setNotifications([]);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isLoading) return;

    const handleUrlRoute = () => {
      const path = window.location.pathname;
      const { route, publicProfileId } = getRouteInfoFromPath(path);

      if (publicProfileId) {
        setViewingPublicProfileId(publicProfileId);
      }

      if (!currentUser) {
        // Logged-out state: only allow public routes; protect authenticated routes
        if (route === 'public-profile' || route === 'landing') {
          setCurrentRoute(route);
        } else {
          // Direct URL protection: redirect any protected or default URL to /auth
          setCurrentRoute('auth');
          if (path !== '/auth' && path !== '/login' && path !== '/signup') {
            window.history.replaceState({}, '', '/auth');
          }
        }
      } else {
        // Authenticated state: route to requested page, or default to dashboard
        if (route === 'default' || route === 'auth') {
          setCurrentRoute('dashboard');
          window.history.replaceState({}, '', '/dashboard');
        } else {
          setCurrentRoute(route);
        }
      }
    };

    handleUrlRoute();

    window.addEventListener('popstate', handleUrlRoute);
    return () => window.removeEventListener('popstate', handleUrlRoute);
  }, [currentUser, isLoading]);

  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const loadGlobalData = async () => {
    setIsGlobalLoading(true);
    setGlobalError(null);
    try {
      const [lessonsResult, notifsResult] = await Promise.allSettled([
        apiService.getLessons(),
        apiService.getNotifications(),
      ]);

      if (lessonsResult.status === 'fulfilled') {
        setLessons(Array.isArray(lessonsResult.value) ? lessonsResult.value : []);
      } else {
        console.warn('Could not load lessons from API:', lessonsResult.reason);
      }

      if (notifsResult.status === 'fulfilled') {
        setNotifications(Array.isArray(notifsResult.value) ? notifsResult.value : []);
      } else {
        console.warn('Could not load notifications from API:', notifsResult.reason);
      }
    } catch (err: any) {
      console.error('Error loading global data:', err);
      setGlobalError('Failed to refresh campus data.');
    } finally {
      setIsGlobalLoading(false);
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      const updated = await apiService.markNotificationRead(id);
      if (Array.isArray(updated)) {
        setNotifications(updated);
      }
    } catch (e) {
      console.warn('Failed to mark notification read:', e);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      const updated = await apiService.markAllNotificationsRead();
      if (Array.isArray(updated)) {
        setNotifications(updated);
      }
    } catch (e) {
      console.warn('Failed to mark all notifications read:', e);
    }
  };

  const handleNavigate = (route: string) => {
    // Session-aware route protection: verify both state and tokenStorage
    const hasSession = !!currentUser || !!tokenStorage.getToken();
    if (!hasSession && AUTHENTICATED_ROUTES.has(route)) {
      setCurrentRoute('auth');
      window.history.pushState({}, '', '/auth');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (route.startsWith('public-profile:')) {
      const id = route.split(':')[1];
      setViewingPublicProfileId(id);
      setCurrentRoute('public-profile');
      window.history.pushState({}, '', `/profile/public/${id}`);
    } else {
      setCurrentRoute(route);
      const urlMap: Record<string, string> = {
        dashboard: '/dashboard',
        'explore-skills': '/explore',
        'lesson-room': '/lesson-room',
        'teaching-studio': '/teaching',
        connections: '/connections',
        messages: '/messages',
        'my-profile-and-badges': '/profile',
        landing: '/landing',
        auth: '/auth',
        'public-profile': viewingPublicProfileId ? `/profile/public/${viewingPublicProfileId}` : '/dashboard',
      };
      const path = urlMap[route] || '/';
      window.history.pushState({}, '', path);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenChat = (conversationId?: string, lessonContext?: LessonContext) => {
    setChatConversationId(conversationId);
    setChatLessonContext(lessonContext);
    handleNavigate('messages');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#3525cd] to-[#4f46e5] text-white flex items-center justify-center shadow-lg animate-pulse">
            <span className="material-symbols-outlined text-[28px]">swap_calls</span>
          </div>
          <span className="text-sm font-bold text-[#131b2e]">Loading SkillSwap Campus Hub...</span>
        </div>
      </div>
    );
  }

  // LOGGED-OUT STATE: Show only public/login experience; authenticated navbar is completely hidden
  if (!currentUser) {
    if (currentRoute === 'public-profile') {
      return (
        <div className="min-h-screen flex flex-col bg-[#faf8ff] text-[#131b2e]">
          <PublicProfilePage
            publicProfileId={viewingPublicProfileId}
            onNavigate={handleNavigate}
            onSelectLesson={(id) => {
              setActiveLessonId(id);
              handleNavigate('auth');
            }}
          />
          <Footer onNavigate={handleNavigate} />
        </div>
      );
    }

    if (currentRoute === 'landing') {
      return (
        <div className="min-h-screen flex flex-col bg-[#faf8ff] text-[#131b2e]">
          <LandingPage
            onNavigate={handleNavigate}
            onSelectLesson={(id) => {
              setActiveLessonId(id);
              handleNavigate('auth');
            }}
          />
          <Footer onNavigate={handleNavigate} />
        </div>
      );
    }

    // Default logged-out view: Login page with public elements only
    return (
      <div className="min-h-screen flex flex-col bg-[#faf8ff] text-[#131b2e]">
        <main className="flex-1 py-10">
          <AuthPage onNavigate={handleNavigate} />
        </main>
        <Footer onNavigate={handleNavigate} />
      </div>
    );
  }

  // Breadcrumb route names
  const routeNames: Record<string, string> = {
    landing: 'Campus Overview',
    dashboard: 'Progress Dashboard',
    'explore-skills': 'Explore Skills & Mentors',
    'lesson-room': 'Active Lesson Room',
    'teaching-studio': 'Teaching Studio & Upload',
    connections: 'Peer Connections & Swaps',
    messages: 'Mentor & Learner Messaging',
    'my-profile-and-badges': 'Peer Skill Marketplace (My Profile & Badges)',
    'public-profile': 'Public Student Profile',
    auth: 'Campus Credentialing & Access',
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8ff] text-[#131b2e]">
      {/* Top Header */}
      <ErrorBoundary fallbackTitle="Campus Navigation Bar">
        <Header
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
          notifications={notifications}
          onOpenNotifications={() => setNotificationsOpen(true)}
          isAiOpen={isAiPanelOpen}
          onToggleAiAssistant={() => setIsAiPanelOpen(!isAiPanelOpen)}
        />
      </ErrorBoundary>

      {/* Main Full-Stack Layout: App on Left, AI Assistant Panel on Right */}
      <div className="pt-20 flex-1 flex flex-row relative min-h-[calc(100vh-5rem)]">
        {/* Main Application Column */}
        <div className="flex-1 min-w-0 flex flex-col bg-[#faf8ff]">
          {/* Collegiate Subheader / Breadcrumbs */}
          <div className="bg-[#f2f3ff] border-b border-[#eaedff]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[#464555]">
                <button
                  onClick={() => handleNavigate('dashboard')}
                  className="hover:text-[#131b2e] transition-colors flex items-center gap-1 font-medium"
                >
                  <span className="material-symbols-outlined text-[16px]">school</span>
                  <span>Campus Hub</span>
                </button>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-[#131b2e] font-semibold">{routeNames[currentRoute] || 'Marketplace'}</span>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#006c4a] animate-pulse"></span>
                <span className="text-xs font-semibold text-[#464555]">
                  Active Term: Fall Quadrangle '24
                </span>
              </div>
            </div>
          </div>

          {/* Global Data Load Error Notice with Retry */}
          {globalError && (
            <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-2 flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-amber-700">info</span>
                <span>{globalError}</span>
              </div>
              <button
                onClick={loadGlobalData}
                className="px-2.5 py-1 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 text-xs flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">refresh</span>
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Dynamic Route Switching */}
          <main className="flex-1 bg-[#faf8ff]">
            <ErrorBoundary fallbackTitle="SkillSwap Campus Hub Error">
            {currentRoute === 'landing' && (
              <LandingPage
                onNavigate={handleNavigate}
                onSelectLesson={(id) => {
                  setActiveLessonId(id);
                  handleNavigate('lesson-room');
                }}
              />
            )}

            {currentRoute === 'my-profile-and-badges' && (
              <ProfilePage
                user={currentUser}
                onUpdateUser={async (updated) => {
                  await updateProfile(updated);
                }}
                onNavigate={handleNavigate}
              />
            )}

            {currentRoute === 'public-profile' && (
              <PublicProfilePage
                publicProfileId={viewingPublicProfileId || currentUser.publicProfileId || ''}
                onNavigate={handleNavigate}
                onSelectLesson={(id) => {
                  setActiveLessonId(id);
                  handleNavigate('lesson-room');
                }}
              />
            )}

            {currentRoute === 'explore-skills' && (
              <ExplorePage
                onNavigate={handleNavigate}
                onSelectLesson={(id) => {
                  setActiveLessonId(id);
                  handleNavigate('lesson-room');
                }}
                onOpenChat={handleOpenChat}
              />
            )}

            {currentRoute === 'directory' && (
              <StudentDirectoryPage
                onNavigate={handleNavigate}
                onOpenChat={handleOpenChat}
              />
            )}

            {currentRoute === 'lesson-room' && (
              <LessonRoomPage
                activeLessonId={activeLessonId}
                onNavigate={handleNavigate}
                onOpenChat={handleOpenChat}
                onAskAi={(ctx) => {
                  setActiveAiLessonContext(ctx);
                  setIsAiPanelOpen(true);
                }}
              />
            )}

            {(currentRoute === 'dashboard' || !['landing', 'my-profile-and-badges', 'public-profile', 'explore-skills', 'directory', 'lesson-room', 'teaching-studio', 'connections', 'messages', 'auth'].includes(currentRoute)) && (
              <ErrorBoundary fallbackTitle="Dashboard Display Error">
                {currentUser ? (
                  <DashboardPage
                    user={currentUser}
                    lessons={lessons}
                    onNavigate={handleNavigate}
                    onSelectLesson={(id) => {
                      setActiveLessonId(id);
                      handleNavigate('lesson-room');
                    }}
                    onOpenChat={handleOpenChat}
                  />
                ) : (
                  <div className="max-w-xl mx-auto my-12 p-8 text-center bg-white rounded-3xl border border-[#eaedff] space-y-3">
                    <span className="material-symbols-outlined animate-spin text-[28px] text-[#3525cd]">progress_activity</span>
                    <p className="text-sm font-semibold text-[#131b2e]">Loading your dashboard...</p>
                  </div>
                )}
              </ErrorBoundary>
            )}

            {currentRoute === 'teaching-studio' && (
              <TeachingStudioPage
                onNavigate={handleNavigate}
                onSelectLesson={(id) => {
                  setActiveLessonId(id);
                  handleNavigate('lesson-room');
                }}
              />
            )}

            {currentRoute === 'connections' && (
              <ConnectionsPage
                onNavigate={handleNavigate}
                onSelectLesson={(id) => {
                  setActiveLessonId(id);
                  handleNavigate('lesson-room');
                }}
                onOpenChat={handleOpenChat}
              />
            )}

            {currentRoute === 'messages' && (
              <MessagesPage
                onNavigate={handleNavigate}
                initialConversationId={chatConversationId}
                initialLessonContext={chatLessonContext}
              />
            )}

            {currentRoute === 'auth' && (
              <AuthPage onNavigate={handleNavigate} />
            )}
            </ErrorBoundary>
          </main>

          {/* Campus Footer */}
          <Footer onNavigate={handleNavigate} />
        </div>

        {/* Dedicated Right-Side AI Assistant Column (Desktop) */}
        <div className="hidden lg:block">
          <ErrorBoundary fallbackTitle="AI Assistant Panel Error">
            <AiChatPanel
              currentUser={currentUser}
              activeLessonContext={activeAiLessonContext}
              onClearLessonContext={() => setActiveAiLessonContext(null)}
              isOpen={isAiPanelOpen}
              onToggleOpen={() => setIsAiPanelOpen(!isAiPanelOpen)}
            />
          </ErrorBoundary>
        </div>

        {/* Mobile / Tablet Full-Height Drawer */}
        {isAiPanelOpen && (
          <div className="block lg:hidden">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 animate-fadeIn"
              onClick={() => setIsAiPanelOpen(false)}
            />
            <ErrorBoundary fallbackTitle="AI Assistant Panel Error">
              <AiChatPanel
                currentUser={currentUser}
                activeLessonContext={activeAiLessonContext}
                onClearLessonContext={() => setActiveAiLessonContext(null)}
                isOpen={isAiPanelOpen}
                onToggleOpen={() => setIsAiPanelOpen(false)}
                isMobileDrawer={true}
              />
            </ErrorBoundary>
          </div>
        )}
      </div>

      {/* Floating Trigger button when AI panel is collapsed */}
      <AiFloatingTrigger
        isOpen={isAiPanelOpen}
        onClick={() => setIsAiPanelOpen(true)}
      />

      {/* Notifications Drawer */}
      <NotificationsModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkNotificationRead}
        onMarkAllRead={handleMarkAllNotificationsRead}
        onNavigate={handleNavigate}
      />
    </div>
  );
}

export default function App() {
  return (
    <AccessibilityProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </AccessibilityProvider>
  );
}
