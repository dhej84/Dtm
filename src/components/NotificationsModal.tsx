import React from 'react';
import { NotificationItem } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigate: (route: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onNavigate,
}) => {
  if (!isOpen) return null;

  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  return (
    <div className="fixed inset-0 bg-[#131b2e]/40 backdrop-blur-xs z-50 flex items-start justify-end p-4 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-[#eaedff] mt-16 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#eaedff] flex items-center justify-between bg-[#faf8ff]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#3525cd]">
              notifications
            </span>
            <h3 className="font-bold text-sm text-[#131b2e]">Campus Alerts & Swaps</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onMarkAllRead}
              className="text-[11px] font-semibold text-[#3525cd] hover:underline"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-[#464555] hover:bg-[#eaedff]"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* List */}
        <div className="divide-y divide-[#eaedff] overflow-y-auto flex-1">
          {safeNotifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#464555]">
              No active campus notifications right now.
            </div>
          ) : (
            safeNotifications.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onMarkRead(item.id);
                  if (item.type === 'swap_request') onNavigate('connections');
                  else if (item.type === 'badge_earned') onNavigate('my-profile-and-badges');
                  onClose();
                }}
                className={`p-4 hover:bg-[#f2f3ff] cursor-pointer transition-colors flex items-start gap-3 ${
                  !item.read ? 'bg-[#eaedff]/40' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    item.type === 'swap_request'
                      ? 'bg-[#82f5c1] text-[#00714e]'
                      : item.type === 'badge_earned'
                      ? 'bg-[#4f46e5] text-white'
                      : 'bg-[#ffdcc3] text-[#703a00]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {item.type === 'swap_request'
                      ? 'sync_alt'
                      : item.type === 'badge_earned'
                      ? 'workspace_premium'
                      : 'info'}
                  </span>
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#131b2e]">{item.title}</span>
                    <span className="text-[10px] text-[#464555]">{item.timestamp}</span>
                  </div>
                  <p className="text-xs text-[#464555] leading-relaxed">{item.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
