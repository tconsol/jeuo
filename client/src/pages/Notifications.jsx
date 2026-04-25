import { useEffect } from 'react';
import { FiCalendar, FiXCircle, FiAward, FiZap, FiClock, FiCreditCard, FiBell, FiCheckCircle } from 'react-icons/fi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationSocket } from '../lib/socket';
import api from '../lib/api';

const TYPE_CONFIG = {
  booking_confirmed:  { icon: FiCalendar,    bg: 'bg-emerald-50', color: 'text-emerald-600', label: 'Booking' },
  booking_cancelled:  { icon: FiXCircle,     bg: 'bg-red-50',     color: 'text-red-500',     label: 'Booking' },
  match_result:       { icon: FiAward,       bg: 'bg-amber-50',   color: 'text-amber-600',   label: 'Match'   },
  tournament_update:  { icon: FiZap,         bg: 'bg-violet-50',  color: 'text-violet-600',  label: 'Tournament' },
  activity_reminder:  { icon: FiClock,       bg: 'bg-blue-50',    color: 'text-blue-600',    label: 'Activity' },
  payment:            { icon: FiCreditCard,  bg: 'bg-green-50',   color: 'text-green-600',   label: 'Payment' },
  default:            { icon: FiBell,        bg: 'bg-gray-50',    color: 'text-gray-500',    label: 'General' },
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function Notifications() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data.data?.notifications || r.data.data || []),
  });

  const markReadMut = useMutation({
    mutationFn: (id) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  const markAllMut = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  useEffect(() => {
    notificationSocket.connect();
    const onNew = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    };
    notificationSocket.on('notification:new', onNew);
    return () => { notificationSocket.off('notification:new', onNew); };
  }, [queryClient]);

  const notifications = data || [];
  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 pb-24">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Notifications</h1>
          <p className={`text-xs mt-0.5 font-medium ${unread > 0 ? 'text-indigo-600' : 'text-gray-400'}`}>
            {unread > 0 ? `${unread} unread` : 'All caught up'}
          </p>
        </div>
        {unread > 0 && (
          <button onClick={() => markAllMut.mutate()} disabled={markAllMut.isPending}
            className="flex items-center gap-1.5 text-xs text-indigo-600 font-bold hover:text-indigo-700 px-3 py-2 rounded-xl hover:bg-indigo-50 transition disabled:opacity-50">
            <FiCheckCircle size={13} /> Mark all read
          </button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      )}

      {/* Empty */}
      {!isLoading && notifications.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
            <FiBell size={28} className="text-gray-200" />
          </div>
          <p className="text-sm font-bold text-gray-600">No notifications</p>
          <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
        </div>
      )}

      {/* List */}
      {!isLoading && notifications.length > 0 && (
        <AnimatePresence>
          <div className="space-y-2">
            {notifications.map((n, i) => {
              const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.default;
              const Icon = cfg.icon;
              return (
                <motion.div key={n._id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => !n.isRead && markReadMut.mutate(n._id)}
                  className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                    n.isRead
                      ? 'bg-white border-gray-100 opacity-70'
                      : 'bg-white border-indigo-100 shadow-sm border-l-4 border-l-indigo-500'
                  }`}>

                  <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={18} className={cfg.color} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 leading-snug font-medium">
                      {n.body || n.message || n.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      <span className="text-[10px] text-gray-400">{timeAgo(n.createdAt)}</span>
                    </div>
                  </div>

                  {!n.isRead && (
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1 flex-shrink-0" />
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
