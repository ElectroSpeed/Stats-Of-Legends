import React from 'react';
import { Metadata } from 'next';
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable';
import { LeaderboardMeBar } from '@/components/leaderboard/LeaderboardMeBar';
import Hero from '@/components/global/Hero';
import { Trophy } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Leaderboard - Stats Of Legends',
  description: 'Top League of Legends players in EUW. View rankings, winrates, and stats.',
};

export default function LeaderboardPage() {
  const region = 'EUW1';
  const tier = 'ALL';
  const mePuuid = '';

  return (
    <div>
      {/* Header */}
      <Hero
          badgeText={`${region} RANKINGS`}
          title="Leaderboard"
          description={`The best players in ${region}. Rise to the top and become a Legend.`}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4">

        {/* Filters (Placeholder) */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          {['ALL', 'CHALLENGER', 'GRANDMASTER', 'MASTER'].map(t => (
            <button
              key={t}
              className={`px-6 py-2 rounded-full text-xs font-bold tracking-widest transition-all
                        ${t === tier ? 'bg-lol-gold text-black' : ' border border-white/10 text-gray-400 hover:text-white hover:border-white/30'}
                    `}
            >
              {t}
            </button>
          ))}
        </div>

        <LeaderboardTable region={region} tier={tier} mePuuid={mePuuid} />
      </div>

      {/* Sticky Me Bar (Only if logged in / puuid available) */}
      {mePuuid && <LeaderboardMeBar region={region} puuid={mePuuid} />}
    </div>
  );
}