import { useState, useEffect } from 'react';
import { SummonerProfile, Match, HeatmapDay, DetailedChampionStats, Teammate } from '@/types';

export function useSummonerData(region: string, summonerName: string) {
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [profile, setProfile] = useState<SummonerProfile | null>(null);
    const [matches, setMatches] = useState<Match[]>([]);
    const [heatmap, setHeatmap] = useState<HeatmapDay[]>([]);
    const [champions, setChampions] = useState<DetailedChampionStats[]>([]);
    const [teammates, setTeammates] = useState<Teammate[]>([]);
    const [performance, setPerformance] = useState<any>(null);
    const [lpHistory, setLpHistory] = useState<any[]>([]);
    const [version, setVersion] = useState<string>('15.24.1');

    async function loadData(isUpdate = false, isPolling = false) {
        if (isUpdate) setUpdating(true);
        else if (!isPolling) setLoading(true);

        setUpdateError(null);
        
        try {
            const realData = await fetchSummonerData(region, summonerName, isUpdate);
            
            if (realData) {
                setProfile(realData.profile as SummonerProfile);
                setMatches(realData.matches as Match[]);
                setHeatmap(realData.heatmap as HeatmapDay[]);
                setChampions(realData.champions as DetailedChampionStats[]);
                setTeammates(realData.teammates as Teammate[]);
                setLpHistory(realData.lpHistory || []);
                setPerformance(realData.performance || null);
                if (realData.version) setVersion(realData.version);

                return (realData.matches as Match[]).length;
            }
        } catch (e: any) {
            console.error('Failed to fetch summoner', e);
            if (e.message === 'RIOT_FORBIDDEN') {
                setUpdateError('Impossible de mettre à jour les données : accès Riot API refusé (403).');
            } else if (e.message !== 'Fetch failed') { // Specific error handling already done in helper or generic fallback
                 setUpdateError('Échec de la mise à jour des données du joueur.');
            }

            if (!isUpdate && !isPolling) {
                setProfile(null);
                setMatches([]);
                setHeatmap([]);
                setChampions([]);
                setTeammates([]);
            }
            return 0;
        } finally {
            setLoading(false);
            if (!isPolling) setUpdating(false);
        }
    }
    
    return {
        loading,
        updating,
        updateError,
        profile,
        matches,
        heatmap,
        champions,
        teammates,
        performance,
        lpHistory,
        version,
        updateData
    };
}

async function fetchSummonerData(r: string, sName: string, forceUpdate: boolean) {
    const nameParam = decodeURIComponent(sName);
    let name = nameParam;
    let tag = r;

    if (nameParam.includes('-')) {
        [name, tag] = nameParam.split('-');
    }

    const url = new URL(`/api/summoner`, window.location.origin);
    url.searchParams.append('region', r);
    url.searchParams.append('name', name);
    url.searchParams.append('tag', tag);
    if (forceUpdate) {
        url.searchParams.append('force', 'true');
    }

    const res = await fetch(url.toString());

    if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        if (errJson?.error === 'RIOT_FORBIDDEN') {
            throw new Error('RIOT_FORBIDDEN');
        }
        throw new Error('Fetch failed');
    }

    return await res.json();
}
