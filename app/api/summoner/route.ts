import { NextRequest, NextResponse } from 'next/server';
import { PLATFORM_MAP } from '../../../services/RiotService';
import { SummonerService, QUEUE_SOLO, QUEUE_FLEX } from '../../../services/SummonerService';

import { MatchHistoryService } from '../../../services/MatchHistoryService';
import { AggregationService } from '../../../services/AggregationService';
import { DataDragonService } from '../../../services/DataDragonService';
import { SummonerProfile } from '../../../types';

function isValidRegion(region: string): region is keyof typeof PLATFORM_MAP {
  return Object.prototype.hasOwnProperty.call(PLATFORM_MAP, region);
}

const MAX_NAME_LENGTH = 16;

function isValidNamePart(value: string): boolean {
  if (!value) return false;
  if (value.length > MAX_NAME_LENGTH) return false;
  return /^[A-Za-z0-9 _.-]+$/.test(value);
}

export async function GET(req: NextRequest) {
  const meta: any = { endpointsCalled: [], errors: [], debugSnapshots: [] };

  try {
    const url = new URL(req.url);
    const rawName = url.searchParams.get('name') || '';
    const rawTag = url.searchParams.get('tag') || '';
    const rawRegion = (url.searchParams.get('region') || 'EUW').toUpperCase();
    const forceUpdate = url.searchParams.get('force') === 'true';

    if (!rawName) return NextResponse.json({ error: 'name is required' }, { status: 400 });
    if (!isValidRegion(rawRegion)) return NextResponse.json({ error: 'Invalid region' }, { status: 400 });
    if (!isValidNamePart(rawName) || (rawTag && !isValidNamePart(rawTag))) {
      return NextResponse.json({ error: 'Invalid summoner name or tag' }, { status: 400 });
    }

    const name = rawName.trim();
    const tag = (rawTag || rawRegion).trim();
    const region = rawRegion;

    // 1. Get or Update Summoner
    let dbSummoner = await SummonerService.getOrUpdateSummoner(name, tag, region, forceUpdate);

    if (!dbSummoner) {
      return NextResponse.json({ error: 'Summoner not found' }, { status: 404 });
    }

    const puuid = dbSummoner.puuid;

    // 2. Cooldown & AutoRefresh Logic
    let shouldUpdateMatches = false;
    let cooldownError = false;
    let minutesLeft = 0;

    const lastFetch = dbSummoner.lastMatchFetch ? new Date(dbSummoner.lastMatchFetch).getTime() : 0;
    const now = Date.now();
    const isCacheExpired = !dbSummoner.lastMatchFetch || (now - lastFetch > 10 * 60 * 1000); // 10 minutes

    if (forceUpdate) {
      if (isCacheExpired) {
        shouldUpdateMatches = true;
      } else {
        cooldownError = true;
        minutesLeft = Math.ceil((10 * 60 * 1000 - (now - lastFetch)) / 60000);
      }
    } else {
      // Auto-Refresh (OP.GG Style) when looking at older profile
      // Instead of holding the page load hostage, we tell the frontend to visually trigger an "Update" button press!
      if (isCacheExpired) {
        meta.needsAutoRefresh = true;
      }
    }

    if (cooldownError) {
      return NextResponse.json({ error: 'COOLDOWN', minutesLeft }, { status: 429 });
    }

    if (shouldUpdateMatches) {
      // Wait for match update to finish to avoid Vercel Lambda killing the Prisma connection
      try {
        await MatchHistoryService.updateMatches(puuid, region, dbSummoner, forceUpdate);
        
        // RE-FETCH dbSummoner to inject the fresh timestamps into the frontend payload
        const refreshedSummoner = await SummonerService.getOrUpdateSummoner(name, tag, region, false);
        if (refreshedSummoner) {
            dbSummoner = refreshedSummoner;
        }
      } catch (err) {
        console.error('Match update failed', err);
      }
    }

    // 3. Get Matches for Display
    const matches = await MatchHistoryService.getMatchesForDisplay(puuid);

    // 4. Aggregations
    const latestVersion = await DataDragonService.getLatestPatch();
    const { champions, heatmap, teammates, lpHistory, performance } = AggregationService.calculateAggregations(matches, dbSummoner, latestVersion);

    const profile: SummonerProfile = {
      name: dbSummoner.gameName,
      tag: dbSummoner.tagLine,
      level: dbSummoner.summonerLevel,
      profileIconId: dbSummoner.profileIconId,
      ranks: {
        solo: {
          tier: dbSummoner.ranks.find(r => r.queueType === QUEUE_SOLO)?.tier || 'UNRANKED',
          rank: dbSummoner.ranks.find(r => r.queueType === QUEUE_SOLO)?.rank || '',
          lp: dbSummoner.ranks.find(r => r.queueType === QUEUE_SOLO)?.leaguePoints || 0,
          wins: dbSummoner.ranks.find(r => r.queueType === QUEUE_SOLO)?.wins || 0,
          losses: dbSummoner.ranks.find(r => r.queueType === QUEUE_SOLO)?.losses || 0,
        },
        flex: {
          tier: dbSummoner.ranks.find(r => r.queueType === QUEUE_FLEX)?.tier || 'UNRANKED',
          rank: dbSummoner.ranks.find(r => r.queueType === QUEUE_FLEX)?.rank || '',
          lp: dbSummoner.ranks.find(r => r.queueType === QUEUE_FLEX)?.leaguePoints || 0,
          wins: dbSummoner.ranks.find(r => r.queueType === QUEUE_FLEX)?.wins || 0,
          losses: dbSummoner.ranks.find(r => r.queueType === QUEUE_FLEX)?.losses || 0,
        },
      },
      pastRanks: [],
      ladderRank: 0,
      topPercent: 0,
      lastUpdated: dbSummoner.updatedAt.getTime(),
      consistencyBadge: (performance as any).consistencyBadge
    };

    return NextResponse.json({
      profile,
      matches,
      champions,
      heatmap,
      teammates,
      lpHistory,
      performance,
      meta,
      version: latestVersion
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=300'
      }
    });

  } catch (e) {
    console.error('[summoner] fatal error', e);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
