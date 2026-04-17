import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationSocket } from '../lib/socket';
import api from '../lib/api';

const TYPE_STYLES = {
  booking_confirmed:  { bg: 'bg-emerald-50', icon: '📅', color: 'text-emerald-600' },
  booking_cancelled:  { bg: 'bg-red-50',     icon: '❌', color: 'text-red-500' },
  match_result:       { bg: 'bg-amber-50',   icon: '🏆', color: 'text-amber-600' },
  tournament_update:  { bg: 'bg-violet-50',  icon: '🏟️', color: 'text-violet-600' },
  activity_reminder:  { bg: 'bg-blue-50',    icon: '⏰', color: 'text-blue-600' },
  payment:            { bg: 'bg-green-50',   icon: '💳', color: 'text-green-600' },
  default:            { bg: 'bg-gray-50',    icon: '🔔', color: 'text-gray-500' },
};

export default function Notifications() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data),
  });

  const markReadMut = useMutation({
    mutationFn: (id) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMut = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  useEffect(() => {
    notificationSocket.connect();
    const onNew = () => queryClient.invalidateQueries({ queryKey: ['notifications'] });
    notificationSocket.on('notification:new', onNew);
    return () => {
      notificationSocket.off('notification:new', onNew);
    };
  }, [queryClient]);

  const notifications = data?.notifications || [];
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Notifications</h1>
          {unread > 0 ? (
            <p className="text-sm text-primary-600 font-medium mt-0.5">{unread} unread</p>
          ) : (
            <p className="text-sm text-gray-500 mt-0.5">All caught up</p>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={() => markAllMut.mutate()}
            disabled={markAllMut.isPending}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors disabled:opacity-50 px-3 py-1.5 rounded-xl hover:bg-primary-50"
          >
            Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="bg-white rounded-2xl shadow-card border border-gray-100 animate-pulse h-20" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
            🔔
          </div>
          <h3 className="text-xl font-semibold text-gray-900">No notifications</h3>
          <p className="text-gray-500 mt-2">You're all caught up!</p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-2">
            {notifications.map((n, i) => {
              const style = TYPE_STYLES[n.type] || TYPE_STYLES.default;
              return (
                <motion.div
                  key={n._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => !n.read && markReadMut.mutate(n._id)}
                  className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-200 hover:shadow-card ${
                    n.read
                      ? 'bg-white border-gray-100 opacity-60'
                      : 'bg-white border-primary-100 shadow-sm border-l-[3px] border-l-primary-400'
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl ${style.bg} flex items-center justify-center flex-shrink-0 text-lg`}>
                    {style.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 leading-snug">{n.message}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-gray-400">
                        {n.createdAt ? new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                      {n.type && (
                        <span className="text-xs text-gray-400 capitalize">{n.type.replace(/_/g, ' ')}</span>
                      )}
                    </div>
                  </div>

                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}

