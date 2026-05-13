import { prisma } from '../lib/prisma';
import { RiotService, PLATFORM_MAP } from './RiotService';
import { LeaderboardService } from './LeaderboardService';

export const LeagueService = {
    /**
     * Updates the leaderboard for a specific region by fetching Challenger, Grandmaster, and Master leagues.
     * This is a heavy operation and should be called via a background job or cron.
     */
    updateLeaderboard: async (region: string = 'EUW1') => {
        const startTime = new Date();
        const platform = PLATFORM_MAP[region] || 'euw1'; 
        const queue = 'RANKED_SOLO_5x5';

        console.log(`[LeagueService] Starting leaderboard update for ${region} (Platform: ${platform})...`);

        // 1. Fetch Top Tiers
        try {
            const challenger = await RiotService.getChallengerLeague(platform, queue);
            await LeagueService.processLeagueEntries(region, 'CHALLENGER', challenger.entries);
            console.log(`[LeagueService] Processed ${challenger.entries.length} Challenger entries.`);

            const grandmaster = await RiotService.getGrandmasterLeague(platform, queue);
            await LeagueService.processLeagueEntries(region, 'GRANDMASTER', grandmaster.entries);
            console.log(`[LeagueService] Processed ${grandmaster.entries.length} Grandmaster entries.`);

            const master = await RiotService.getMasterLeague(platform, queue);
            await LeagueService.processLeagueEntries(region, 'MASTER', master.entries);
            console.log(`[LeagueService] Processed ${master.entries.length} Master entries.`);

            // 2. CLEANUP: Remove players who are no longer in Master+ (Stale data from old patch/run)
            console.log(`[LeagueService] Cleaning up stale leaderboard entries for ${region}...`);
            const deleted = await prisma.summonerRank.deleteMany({
                where: {
                    queueType: queue,
                    tier: { in: ['CHALLENGER', 'GRANDMASTER', 'MASTER'] },
                    updatedAt: { lt: startTime }
                }
            });
            console.log(`[LeagueService] Cleanup complete. Removed ${deleted.count} stale entries.`);

        } catch (error) {
            console.error('[LeagueService] Error updating leaderboard:', error);
            throw error;
        }
    },

    /**
     * Processes a batch of league entries.
     * Resolves PUUIDs and updates the database.
     */
    processLeagueEntries: async (region: string, tier: string, entries: any[]) => {
        console.log(`[LeagueService] Processing ${entries.length} ${tier} entries...`);

        // Process in chunks to avoid overwhelming the DB or API
        const CHUNK_SIZE = 100; // 100 entries per chunk
        for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
            const chunk = entries.slice(i, i + CHUNK_SIZE);
            await LeagueService.processBatch(region, tier, chunk);
            console.log(`[LeagueService] Processed batch ${Math.min(i + CHUNK_SIZE, entries.length)}/${entries.length}`);
        }
    },

    processBatch: async (region: string, tier: string, entries: any[]) => {
        const platform = 'euw1'; // Map region to platform

        if (entries.length > 0) {
            // Debug log removed
        }

        // Filter out invalid entries (must have puuid)
        const validEntries = entries.filter((e: any) => e && e.puuid);
        if (validEntries.length < entries.length) {
            console.warn(`[LeagueService] Filtered out ${entries.length - validEntries.length} invalid entries (missing puuid).`);
        }

        const puuids = validEntries.map((e: any) => e.puuid);

        // 1. Find existing summoners in DB to avoid re-fetching
        const existingSummoners = await prisma.summoner.findMany({
            where: { puuid: { in: puuids } }
        });
        const existingMap = new Map(existingSummoners.map(s => [s.puuid, s]));

        // 2. Identify missing or incomplete summoners
        const missingEntries = validEntries.filter((e: any) => {
            const existing = existingMap.get(e.puuid);
            if (!existing) return true; // Missing
            if (existing.gameName && (existing.gameName.includes('Unknown') || existing.gameName.startsWith('UNKNOWN'))) return true; // Incomplete
            return false;
        });

        // 3. Fetch & Upsert Missing Summoners (Concurrent)
        if (missingEntries.length > 0) {
            console.log(`[LeagueService] Fetching ${missingEntries.length} missing summoners...`);

            await RiotService.mapWithConcurrency(missingEntries, 5, async (entry: any) => {
                try {
                    // Fetch Summoner Data (Level, Icon)
                    const riotSummoner = await RiotService.fetchSummonerByPuuid(entry.puuid, platform);

                    // Fetch Account Data (Riot ID) - EUW maps to 'europe'
                    const regionRouting = 'europe';
                    const riotAccount = await RiotService.fetchAccountByPuuid(entry.puuid, regionRouting);

                    const performUpsert = async () => {
                        return await prisma.summoner.upsert({
                            where: { puuid: entry.puuid },
                            update: {
                                summonerId: riotSummoner.id,
                                accountId: riotSummoner.accountId,
                                profileIconId: riotSummoner.profileIconId,
                                summonerLevel: riotSummoner.summonerLevel,
                                gameName: riotAccount.gameName || entry.summonerName || 'Unknown',
                                tagLine: riotAccount.tagLine || region,
                                updatedAt: new Date()
                            },
                            create: {
                                puuid: entry.puuid,
                                summonerId: riotSummoner.id,
                                accountId: riotSummoner.accountId,
                                gameName: riotAccount.gameName || entry.summonerName || 'Unknown',
                                tagLine: riotAccount.tagLine || region,
                                profileIconId: riotSummoner.profileIconId,
                                summonerLevel: riotSummoner.summonerLevel,
                            }
                        });
                    };

                    let saved;
                    try {
                        saved = await performUpsert();
                    } catch (err: any) {
                        if (err.code === 'P2002' && err.meta?.target?.includes('gameName')) {
                            // Name conflict: Someone else in our DB has this name.
                            // We need to find them and "rename" them to free up the name.
                            const conflictingSummoner = await prisma.summoner.findUnique({
                                where: {
                                    gameName_tagLine: {
                                        gameName: riotAccount.gameName || entry.summonerName || 'Unknown',
                                        tagLine: riotAccount.tagLine || region
                                    }
                                }
                            });

                            if (conflictingSummoner && conflictingSummoner.puuid !== entry.puuid) {
                                console.log(`[LeagueService] Resolving name conflict: Moving name from ${conflictingSummoner.puuid} to ${entry.puuid}`);
                                await prisma.summoner.update({
                                    where: { puuid: conflictingSummoner.puuid },
                                    data: {
                                        gameName: `OLD_${conflictingSummoner.gameName}`,
                                        tagLine: `OLD_${conflictingSummoner.tagLine}`
                                    }
                                });
                                // Retry the upsert
                                saved = await performUpsert();
                            } else {
                                throw err;
                            }
                        } else {
                            throw err;
                        }
                    }
                    if (saved) existingMap.set(entry.puuid, saved);
                } catch (err) {
                    console.error(`[LeagueService] Failed to fetch/save summoner ${entry.puuid}:`, err);
                }
            });
        }

        // 4. Update Ranks (Concurrent DB Upserts)
        await RiotService.mapWithConcurrency(validEntries, 20, async (entry: any) => {
            const summoner = existingMap.get(entry.puuid);
            if (!summoner) return; // Skip if fetch failed

            try {
                const rankValue = LeaderboardService.calculateRankValue(tier, entry.rank, entry.leaguePoints);

                await prisma.summonerRank.upsert({
                    where: {
                        summonerPuuid_queueType: {
                            summonerPuuid: summoner.puuid,
                            queueType: 'RANKED_SOLO_5x5',
                        }
                    },
                    update: {
                        tier: tier,
                        rank: entry.rank,
                        leaguePoints: entry.leaguePoints,
                        wins: entry.wins,
                        losses: entry.losses,
                        rankValue: rankValue,
                        updatedAt: new Date()
                    },
                    create: {
                        summonerPuuid: summoner.puuid,
                        queueType: 'RANKED_SOLO_5x5',
                        tier: tier,
                        rank: entry.rank,
                        leaguePoints: entry.leaguePoints,
                        wins: entry.wins,
                        losses: entry.losses,
                        rankValue: rankValue,
                    }
                });
            } catch (err) {
                console.error(`[LeagueService] Failed to update rank for ${entry.summonerName}:`, err);
            }
        });
    }
};
