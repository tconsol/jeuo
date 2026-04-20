import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { userService } from '../../services';
import { LoadingSpinner, Avatar } from '../../components/common';

export default function EditProfile() {
  const qc = useQueryClient();
  const { data: user, isLoading } = useQuery({ queryKey: ['profile'], queryFn: () => userService.getProfile().then((r) => r.data?.data?.user || r.data?.data) });
  const [form, setForm] = useState(null);

  const mutation = useMutation({
    mutationFn: (data) => userService.updateProfile(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });

  if (isLoading) return <LoadingSpinner className="py-20" />;
  if (!form && user) {
    setForm({ name: user.name || '', bio: user.bio || '', phone: user.phone || '' });
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto px-4 py-8 pb-28">
      <Link to="/profile" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
        <FiArrowLeft size={16} /> Back to Profile
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5">
          <h1 className="text-xl font-bold text-white">Edit Profile</h1>
          <p className="text-indigo-200 text-sm mt-1">Update your personal information</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex justify-center">
            <Avatar src={user?.avatar} name={user?.name} size="xl" />
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
              <input value={form?.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your full name" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
              <textarea value={form?.bio || ''} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell us about yourself..." rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              <input value={form?.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition" />
            </div>
            <button type="submit" disabled={mutation.isPending} className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition active:scale-[0.98]">
              {mutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
            {mutation.isSuccess && <p className="text-green-600 text-sm text-center">Profile updated!</p>}
          </form>
        </div>
      </div>
    </motion.div>
  );
}
