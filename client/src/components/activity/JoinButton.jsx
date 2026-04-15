import { useState } from 'react';

export default function JoinButton({ activityId, isJoined, isFull, onJoin, onLeave }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      if (isJoined) await onLeave(activityId);
      else await onJoin(activityId);
    } finally {
      setLoading(false);
    }
  };

  if (isFull && !isJoined) {
    return <button disabled className="w-full py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-400">Full</button>;
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
        isJoined
          ? 'bg-red-50 text-red-600 hover:bg-red-100'
          : 'bg-indigo-600 text-white hover:bg-indigo-700'
      } disabled:opacity-50`}
    >
      {loading ? 'Please wait…' : isJoined ? 'Leave' : 'Join Activity'}
    </button>
  );
}
