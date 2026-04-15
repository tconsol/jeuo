import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../services';
import { LoadingSpinner, Avatar } from '../../components/common';

export default function EditProfile() {
  const qc = useQueryClient();
  const { data: user, isLoading } = useQuery({ queryKey: ['profile'], queryFn: () => userService.getProfile().then((r) => r.data.data) });
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
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Edit Profile</h1>
      <div className="flex justify-center">
        <Avatar src={user?.avatar} name={user?.name} size="xl" />
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input value={form?.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" />
        <textarea value={form?.bio || ''} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Bio" rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none" />
        <input value={form?.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" />
        <button type="submit" disabled={mutation.isPending} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50">
          {mutation.isPending ? 'Saving…' : 'Save Changes'}
        </button>
        {mutation.isSuccess && <p className="text-green-600 text-sm text-center">Profile updated!</p>}
      </form>
    </div>
  );
}
