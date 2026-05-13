import React, { useEffect, useState } from 'react';
import { getStandings } from '../services/sports';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

export function StandingsWidget({ leagueId, season, homeTeamId, awayTeamId }: { leagueId: number, season: number, homeTeamId: number, awayTeamId: number }) {
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStandings(leagueId, season).then(res => {
      setStandings(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [leagueId, season]);

  if (loading) return <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-brand" /></div>;
  if (!standings || standings.length === 0) return <div className="py-10 text-center text-gray-500">لا تتوفر بيانات الترتيب</div>;

  return (
    <div className="bg-[#181818] rounded-xl border border-white/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right">
          <thead className="bg-[#121212] text-gray-400 text-xs border-b border-white/5">
            <tr>
              <th className="px-4 py-3 font-medium w-8">#</th>
              <th className="px-2 py-3 font-medium text-right">الفريق</th>
              <th className="px-2 py-3 font-medium text-center">ل</th>
              <th className="px-2 py-3 font-medium text-center">ف</th>
              <th className="px-2 py-3 font-medium text-center">ت</th>
              <th className="px-2 py-3 font-medium text-center">خ</th>
              <th className="px-2 py-3 font-medium text-center hidden md:table-cell">+/-</th>
              <th className="px-4 py-3 font-bold text-center text-white">ن</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {standings.map((row: any) => {
              const isMatchTeam = row.team.id === homeTeamId || row.team.id === awayTeamId;
              
              // Colorize rank
              let rankColor = "border-transparent";
              if (row.description?.includes("Champions League")) rankColor = "border-r-blue-500";
              else if (row.description?.includes("Europa League")) rankColor = "border-r-orange-500";
              else if (row.description?.includes("Relegation")) rankColor = "border-r-red-500";
              
              return (
                <tr key={row.team.id} className={clsx(
                  "hover:bg-[#202020] transition-colors border-r-2",
                  rankColor,
                  isMatchTeam ? "bg-brand/5 border-r-brand" : ""
                )}>
                  <td className="px-4 py-3 font-bold text-gray-500">{row.rank}</td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-2">
                      <img src={row.team.logo} className="w-5 h-5 object-contain" />
                      <span className={clsx("font-bold", isMatchTeam ? "text-brand" : "text-gray-200")}>{row.team.name}</span>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center text-gray-400">{row.all?.played}</td>
                  <td className="px-2 py-3 text-center text-emerald-500">{row.all?.win}</td>
                  <td className="px-2 py-3 text-center text-gray-400">{row.all?.draw}</td>
                  <td className="px-2 py-3 text-center text-red-500">{row.all?.lose}</td>
                  <td className="px-2 py-3 text-center text-gray-400 hidden md:table-cell">{row.goalsDiff}</td>
                  <td className="px-4 py-3 text-center font-bold text-white">{row.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
