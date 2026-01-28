"use client";

import React, { useEffect, useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from 'recharts';
import { PerformanceMetrics } from '../types';

interface PerformanceRadarProps {
  metrics: PerformanceMetrics | null;
  consistencyBadge?: string;
}

export const PerformanceRadar: React.FC<PerformanceRadarProps> = ({ metrics, consistencyBadge }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const safe = {
    combat: 50,
    objectives: 50,
    vision: 50,
    farming: 50,
    survival: 50,
    ...(metrics || {})
  };

  const radarData = [
    { subject: 'Combat', A: safe.combat, fullMark: 100 },
    { subject: 'Objectives', A: safe.objectives, fullMark: 100 },
    { subject: 'Vision', A: safe.vision, fullMark: 100 },
    { subject: 'Farming', A: safe.farming, fullMark: 100 },
    { subject: 'Survival', A: safe.survival, fullMark: 100 },
  ];

  if (!isMounted) {
    return <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">Loading Chart...</div>;
  }

  const averageScore = Math.round(radarData.reduce((acc, curr) => acc + curr.A, 0) / radarData.length);

  return (
    <div className="w-full h-full relative flex flex-col items-center justify-center min-h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
            <PolarGrid stroke="#222" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 'bold' }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
            name="Performance"
            dataKey="A"
            stroke="#C084FC"
            strokeWidth={3}
            fill="#C084FC"
            fillOpacity={0.5}
            isAnimationActive={true}
            animationDuration={1500}
            animationEasing="ease-out"
            />
        </RadarChart>
      </ResponsiveContainer>

      <CentralScoreOverlay averageScore={averageScore} />
      <ConsistencyBadge badge={consistencyBadge} />
    </div>
  );
};

const getGrade = (score: number) => {
    if (score >= 90) return 'S+';
    if (score >= 80) return 'S';
    if (score >= 70) return 'A';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C';
    return 'D';
};

const getRankTitle = (grade: string) => {
    switch (grade) {
        case 'S+': return 'GODLIKE';
        case 'S': return 'DEMON KING';
        case 'A': return 'WARLORD';
        case 'B': return 'GLADIATOR';
        case 'C': return 'SOLDIER';
        default: return 'MORTAL';
    }
};

const CentralScoreOverlay = ({ averageScore }: { averageScore: number }) => {
    const grade = getGrade(averageScore);
    const title = getRankTitle(grade);

    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none z-20">
            <div className="animate-slam flex flex-col items-center">
            <span className={`text-6xl font-black font-cinzel drop-shadow-[0_0_25px_rgba(192,132,252,0.6)] ${grade.includes('S') ? 'text-gold-gradient' : 'text-white'}`}>
                {grade}
            </span>
            <span className="text-[10px] font-bold tracking-[0.2em] text-purple-200 uppercase mt-1 animate-pulse">
                {title}
            </span>
            </div>
        </div>
    );
};

const ConsistencyBadge = ({ badge }: { badge?: string }) => {
    if (!badge) return null;
    const colorClass = badge === 'Rock Solid' ? 'text-blue-400' : badge === 'Coinflip' ? 'text-red-400' : 'text-gray-400';
    
    return (
        <div className="absolute bottom-2 right-2 flex flex-col items-end">
            <span className="text-[10px] text-gray-500 uppercase font-bold">Consistency</span>
            <span className={`text-xs font-black ${colorClass}`}>
                {badge}
            </span>
        </div>
    );
};
