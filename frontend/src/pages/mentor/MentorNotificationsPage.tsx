// =============================================================================
// File: frontend/src/pages/mentor/MentorNotificationsPage.tsx
// Purpose: Notifications inbox page for mentor evaluation alerts
// =============================================================================

import React, { useState, useEffect } from 'react';
import type { Notification } from '../../services/notification.service';
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead
} from '../../services/notification.service';
import { NotificationsTable } from '../../components/admin/NotificationsTable';
import { CheckSquare, AlertCircle, Info } from 'lucide-react';

export const MentorNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInbox = async () => {
    try {
      setLoading(true);
      const res = await getNotifications({ page, limit });

      setNotifications(res.data ?? []);
      setTotal(res.pagination.total);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch notifications. Verify database connectivity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchInbox();
  }, [page]);

  const handleMarkSingleRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      void fetchInbox();
      // Force trigger topbar badge recount by dispatching a custom storage event
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error(err);
      alert('Failed to mark notification as read.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      void fetchInbox();
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error(err);
      alert('Failed to mark all notifications as read.');
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">System Notifications</h1>
          <p className="text-sm text-slate-400 mt-1">
            Review alerts generated from internship status adjustments and report reviews.
          </p>
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-4.5 py-3 rounded-xl bg-slate-905 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition-colors focus:outline-none"
          >
            <CheckSquare className="h-4.5 w-4.5 text-indigo-400" />
            Mark All Read
          </button>
        )}
      </div>

      {/* Main Inbox table / loader */}
      {error ? (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900/30 text-rose-300 text-sm flex gap-2">
          <AlertCircle className="h-5 w-5 text-rose-400" />
          <span>{error}</span>
        </div>
      ) : loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-slate-100">
          <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-xs font-medium text-slate-400">Loading inbox messages...</p>
        </div>
      ) : (
        <NotificationsTable
          notifications={notifications}
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onMarkRead={handleMarkSingleRead}
        />
      )}

      {/* Context note */}
      <div className="p-4.5 rounded-xl bg-slate-900 border border-slate-850 flex items-start gap-3">
        <Info className="h-4.5 w-4.5 text-indigo-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400 leading-relaxed">
          System notifications are logged in the database and linked to specific action entities. Actionable items like daily logs review requests are automatically cleared or updated when their reviewed status transforms.
        </p>
      </div>

    </div>
  );
};
export default MentorNotificationsPage;
