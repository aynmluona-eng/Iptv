import React, { useEffect, useState } from 'react';
import { getTopScorers } from '../services/sports';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

export function TopScorersWidget({ leagueId, season }: { leagueId: number, season: number }) {
  const [scorers, setScorers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTopScorers(leagueId, season).then(res => {
      setScorers(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [leagueId, season]);

  if (loading) return <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-brand" /></div>;
  if (!scorers || scorers.length === 0) return <div className="py-10 text-center text-gray-500">لا تتوفر إحصاءات الهدافين</div>;

  return (
    <div className="bg-[#181818] rounded-xl border border-white/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right">
          <thead className="bg-[#121212] text-gray-400 text-xs border-b border-white/5">
            <tr>
              <th className="px-4 py-3 font-medium w-8">#</th>
              <th className="px-2 py-3 font-medium text-right">اللاعب</th>
              <th className="px-2 py-3 font-medium text-right">الفريق</th>
              <th className="px-4 py-3 font-bold text-center text-white">أهداف</th>
              <th className="px-4 py-3 font-medium text-center text-gray-400 hidden xs:table-cell">صناعة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {scorers.slice(0, 15).map((row: any, index: number) => {
              const p = row.player;
              const stats = row.statistics[0];
              
              return (
                <tr key={p.id} className="hover:bg-[#202020] transition-colors">
                  <td className="px-4 py-3 font-bold text-gray-500">{index + 1}</td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.photo} className="w-8 h-8 rounded-full object-cover bg-black" />
                      <div>
                         <span className="font-bold text-gray-200 block">{p.name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-2">
                      <img src={stats.team.logo} className="w-4 h-4 object-contain" />
                      <span className="text-gray-400 text-xs">{stats.team.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-brand text-lg">{stats.goals.total}</td>
                  <td className="px-4 py-3 text-center font-medium text-gray-400 hidden xs:table-cell">{stats.goals.assists || 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
