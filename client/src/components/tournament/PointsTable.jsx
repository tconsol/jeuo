export default function PointsTable({ standings }) {
  if (!standings?.length) return <p className="text-sm text-gray-400 py-4">Standings not available yet.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-200">
            <th className="pb-2 pr-4">#</th>
            <th className="pb-2 pr-4">Team</th>
            <th className="pb-2 pr-4 text-center">P</th>
            <th className="pb-2 pr-4 text-center">W</th>
            <th className="pb-2 pr-4 text-center">L</th>
            <th className="pb-2 pr-4 text-center">D</th>
            <th className="pb-2 text-center">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((team, i) => (
            <tr key={team._id || i} className="border-b border-gray-50">
              <td className="py-2 pr-4 text-gray-500">{i + 1}</td>
              <td className="py-2 pr-4 font-medium text-gray-900">{team.name}</td>
              <td className="py-2 pr-4 text-center">{team.played || 0}</td>
              <td className="py-2 pr-4 text-center text-green-600">{team.won || 0}</td>
              <td className="py-2 pr-4 text-center text-red-600">{team.lost || 0}</td>
              <td className="py-2 pr-4 text-center">{team.drawn || 0}</td>
              <td className="py-2 text-center font-semibold">{team.points || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
