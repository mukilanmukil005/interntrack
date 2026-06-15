// =============================================================================
// File: frontend/src/components/admin/NotificationsTable.tsx
// Purpose: Display notifications table with pagination and read-action triggers
// =============================================================================

import React from 'react';
import type { Notification } from '../../services/notification.service';
import { Check, MailOpen, AlertCircle, FileSpreadsheet, Key, CheckSquare, ArrowLeft, ArrowRight } from 'lucide-react';

interface NotificationsTableProps {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onMarkRead: (notificationId: string) => void;
}

export const NotificationsTable: React.FC<NotificationsTableProps> = ({
  notifications,
  total,
  page,
  limit,
  onPageChange,
  onMarkRead,
}) => {
  const totalPages = Math.ceil(total / limit) || 1;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'REPORT_APPROVED':
      case 'CERTIFICATE_READY':
        return (
          <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
            <CheckSquare className="h-4.5 w-4.5" />
          </div>
        );
      case 'REPORT_REJECTED':
      case 'COMPLETION_ALERT':
        return (
          <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400">
            <AlertCircle className="h-4.5 w-4.5" />
          </div>
        );
      case 'MENTOR_ASSIGNED':
        return (
          <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
            <Key className="h-4.5 w-4.5" />
          </div>
        );
      default:
        return (
          <div className="p-2 bg-slate-800 rounded-xl border border-slate-700 text-slate-400">
            <FileSpreadsheet className="h-4.5 w-4.5" />
          </div>
        );
    }
  };

  const formatTimestamp = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col justify-between min-h-[350px]">
      
      {/* Scrollable Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-850 bg-slate-900/55 text-[10px] font-bold uppercase tracking-wider text-slate-450">
              <th className="px-6 py-4 w-12"></th>
              <th className="px-6 py-4">Message Details</th>
              <th className="px-6 py-4">Received At</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850/50 text-sm">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <tr 
                  key={notification.id} 
                  className={`hover:bg-slate-900/50 transition-colors ${
                    !notification.isRead ? 'bg-indigo-500/[0.015]' : ''
                  }`}
                >
                  {/* Icon column */}
                  <td className="px-6 py-4">
                    {getNotificationIcon(notification.type)}
                  </td>

                  {/* Title & Message */}
                  <td className="px-6 py-4">
                    <div>
                      <div className={`text-slate-200 ${!notification.isRead ? 'font-bold' : 'font-medium'}`}>
                        {notification.title}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {notification.message}
                      </div>
                    </div>
                  </td>

                  {/* Received Time */}
                  <td className="px-6 py-4 text-slate-450 text-xs font-semibold whitespace-nowrap">
                    {formatTimestamp(notification.createdAt)}
                  </td>

                  {/* IsRead Status badge */}
                  <td className="px-6 py-4">
                    {notification.isRead ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        <MailOpen className="h-3 w-3" />
                        Read
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-950/40 text-indigo-400 border border-indigo-900/30">
                        Unread
                      </span>
                    )}
                  </td>

                  {/* Actions Column */}
                  <td className="px-6 py-4 text-right">
                    {!notification.isRead && (
                      <button
                        onClick={() => onMarkRead(notification.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all focus:outline-none"
                        title="Mark as Read"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Mark Read
                      </button>
                    )}
                  </td>

                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-12 text-slate-500">
                  Inbox is empty. All caught up!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-850 flex items-center justify-between gap-4 text-xs font-semibold text-slate-400 bg-slate-900/30">
        <span>
          Showing page <span className="text-slate-200">{page}</span> of <span className="text-slate-200">{totalPages}</span>
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:hover:border-slate-800 rounded-lg text-slate-350 disabled:cursor-not-allowed transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Prev
          </button>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:hover:border-slate-800 rounded-lg text-slate-350 disabled:cursor-not-allowed transition-all"
          >
            Next
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
};
export default NotificationsTable;
