import Avatar from '../common/Avatar';

export default function PlayerList({ players, maxDisplay = 5 }) {
  if (!players?.length) return <p className="text-sm text-gray-400">No players yet</p>;

  const visible = players.slice(0, maxDisplay);
  const remaining = players.length - maxDisplay;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {visible.map((player) => (
          <Avatar key={player._id} src={player.avatar} name={player.name} size="sm" className="ring-2 ring-white" />
        ))}
      </div>
      {remaining > 0 && (
        <span className="ml-2 text-xs text-gray-500">+{remaining} more</span>
      )}
    </div>
  );
}
