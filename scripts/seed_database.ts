/**
 * ------------------------------------------------------------------
 * DATABASE SEEDING SCRIPT
 * ------------------------------------------------------------------
 * 
 * This script populates the database with match data by:
 * 1. Fetching random players from specific Tiers/Divisions.
 * 2. Downloading their recent matches.
 * 3. Processing matches to update Champion, Matchup, and Duo statistics.
 * 4. Tracking scanned players in the database to avoid redundancy.
 * 
 * USAGE EXAMPLES:
 * 
 * 1. Default run (EUW1, All Tiers, 3 Threads):
 *    npx ts-node scripts/seed_database.ts
 * 
 * 2. Specific Region and Tier:
 *    npx ts-node scripts/seed_database.ts --region=NA1 --tier=GOLD
 * 
 * 3. High Performance (5 Threads):
 *    npx ts-node scripts/seed_database.ts --concurrency=5
 * 
 * 4. Target by Players (e.g., 50 players per tier):
 *    npx ts-node scripts/seed_database.ts --players=50 --matches=100
 * 
 * ------------------------------------------------------------------
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load .env and .env.local
const envPath = path.join(__dirname, '../.env');
const envLocalPath = path.join(__dirname, '../.env.local');

if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
if (fs.existsSync(envLocalPath)) dotenv.config({ path: envLocalPath, override: true });

// Suppress RiotService logs to keep progress bar clean
process.env.SUPPRESS_RIOT_LOGS = 'true';

import { PrismaClient } from '@prisma/client';
import { MatchProcessor } from '../services/MatchProcessor';
import { MatchHistoryService } from '../services/MatchHistoryService';
import { fetchMatchIds, riotFetchRaw, REGION_ROUTING, PLATFORM_MAP, mapWithConcurrency } from '../services/RiotService';
import { CURRENT_PATCH } from '../constants/config';

// Check API Key
if (!process.env.RIOT_API_KEY) {
    console.error("❌ ERROR: RIOT_API_KEY is missing from .env or .env.local");
    process.exit(1);
} else {
    console.log("✅ API Key loaded: " + process.env.RIOT_API_KEY.substring(0, 5) + "...");
}

// Initialize Prisma
const prisma = new PrismaClient();

// --- CONFIGURATION & DEFAULTS ---
const DEFAULTS = {
    REGION: 'EUW1',
    TIER: 'ALL',        // 'ALL' or specific tier (e.g., 'GOLD')
    CONCURRENCY: '3',   // Number of parallel match requests
    MATCHES_PER_PLAYER: '100',
    TARGET_MATCHES_PER_TIER: '5000',
    PLAYERS_PER_TIER: '0' // Default 0 means use TARGET_MATCHES_PER_TIER
};

// --- CLI ARGUMENT PARSING ---
const args = process.argv.slice(2);
const getArg = (key: string, def: string) => {
    const arg = args.find(a => a.startsWith(`--${key}=`));
    return arg ? arg.split('=')[1] : def;
};

const CONFIG = {
    REGION: getArg('region', DEFAULTS.REGION),
    TIER: getArg('tier', DEFAULTS.TIER),
    CONCURRENCY: Number.parseInt(getArg('concurrency', DEFAULTS.CONCURRENCY)),
    MATCHES_PER_PLAYER: Number.parseInt(getArg('matches', DEFAULTS.MATCHES_PER_PLAYER)),
    TARGET_MATCHES_PER_TIER: Number.parseInt(getArg('target', DEFAULTS.TARGET_MATCHES_PER_TIER)),
    PLAYERS_PER_TIER: Number.parseInt(getArg('players', DEFAULTS.PLAYERS_PER_TIER)),
    // Derived
    ROUTING: REGION_ROUTING[getArg('region', DEFAULTS.REGION)] || 'europe',
    QUEUE: 'RANKED_SOLO_5x5'
};

// Determine Mode
const MODE = CONFIG.PLAYERS_PER_TIER > 0 ? 'PLAYERS' : 'MATCHES';
const TARGET_PER_TIER = MODE === 'PLAYERS' ? CONFIG.PLAYERS_PER_TIER : CONFIG.TARGET_MATCHES_PER_TIER;

const TIERS = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];
const DIVISIONS = ['I', 'II', 'III', 'IV'];

console.log(`
---------------------------------------
🚀 STARTING SEEDING SCRIPT
---------------------------------------
Region      : ${CONFIG.REGION}
Routing     : ${CONFIG.ROUTING}
Target Tier : ${CONFIG.TIER}
Concurrency : ${CONFIG.CONCURRENCY} threads
Matches/User: ${CONFIG.MATCHES_PER_PLAYER}
Mode        : ${MODE}
Target      : ${TARGET_PER_TIER} ${MODE === 'PLAYERS' ? 'Players' : 'Matches'} / Tier
---------------------------------------
`);

// Helper to delay execution (Rate Limiting)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- GLOBAL PROGRESS STATE ---
let GLOBAL_PROCESSED = 0; // Can be players or matches depending on mode
let TOTAL_TARGET_GLOBAL = 0;
let GLOBAL_START_TIME = 0;

// Shared State for Ticker
const CurrentProgress = {
    tier: '',
    tierCurrent: 0,
    tierTotal: 0,
    active: false
};

// --- PROGRESS BAR HELPER ---
function updateProgressBar(tier: string, tierCurrent: number, tierTotal: number) {
    const width = 20;

    // Tier Progress
    const tierPct = Math.min(1, tierCurrent / tierTotal);
    const tierPctStr = Math.round(tierPct * 100) + '%';

    // Global Progress
    const globalPct = Math.min(1, GLOBAL_PROCESSED / TOTAL_TARGET_GLOBAL);
    const filled = Math.round(width * globalPct);
    const empty = width - filled;
    const bar = '▓'.repeat(filled) + '░'.repeat(empty);
    const globalPctStr = Math.round(globalPct * 100) + '%';

    // Speed & ETA
    const elapsedSeconds = (Date.now() - GLOBAL_START_TIME) / 1000;
    const speed = elapsedSeconds > 1 ? (GLOBAL_PROCESSED / elapsedSeconds) : 0;
    const speedStr = speed.toFixed(1); // 1 decimal place

    let etaStr = "--:--:--";
    if (speed > 0) {
        const remaining = TOTAL_TARGET_GLOBAL - GLOBAL_PROCESSED;
        const remainingSeconds = remaining / speed;
        const h = Math.floor(remainingSeconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((remainingSeconds % 3600) / 60).toString().padStart(2, '0');
        const s = Math.floor(remainingSeconds % 60).toString().padStart(2, '0');
        etaStr = `${h}:${m}:${s}`;
    }

    // Elapsed Time
    const eH = Math.floor(elapsedSeconds / 3600).toString().padStart(2, '0');
    const eM = Math.floor((elapsedSeconds % 3600) / 60).toString().padStart(2, '0');
    const eS = Math.floor(elapsedSeconds % 60).toString().padStart(2, '0');
    const elapsedStr = `${eH}:${eM}:${eS}`;

    const unit = MODE === 'PLAYERS' ? 'Players' : 'Matches';
    const unitShort = MODE === 'PLAYERS' ? 'p/s' : 'm/s';

    // Clear line and write
    // Format: [EUW1] GOLD: 45% | TOTAL: ▓▓▓░░░░░░░ 12% | 12/50 Players | ETA: 04:20:00 | Time: 00:01:30 | 0.5 p/s
    process.stdout.write(`\r[${CONFIG.REGION}] ${tier.padEnd(10)}: ${tierPctStr.padEnd(4)} | TOTAL: ${bar} ${globalPctStr.padEnd(4)} | ${tierCurrent}/${tierTotal} ${unit} | ETA: ${etaStr} | Time: ${elapsedStr} | ${speedStr} ${unitShort}  `);
}

function startProgressTicker() {
    CurrentProgress.active = true;
    const interval = setInterval(() => {
        if (CurrentProgress.active) {
            updateProgressBar(CurrentProgress.tier, CurrentProgress.tierCurrent, CurrentProgress.tierTotal);
        } else {
            clearInterval(interval);
        }
    }, 1000);
}

async function checkConnectivity() {
    console.log(`\n🔌 Checking connectivity to Riot API (${CONFIG.REGION})...`);
    const platform = PLATFORM_MAP[CONFIG.REGION] || CONFIG.REGION.toLowerCase();
    const url = `https://${platform}.api.riotgames.com/lol/status/v4/platform-data`;

    try {
        const res = await riotFetchRaw(url);
        if (res.ok) {
            console.log(`✅ Connectivity confirmed!`);
            return true;
        } else {
            console.error(`❌ Connectivity check failed: ${res.status}`);
            return false;
        }
    } catch (e) {
        console.error(`❌ Connectivity check error: ${e}`);
        return false;
    }
}

async function fetchRandomPlayers(tier: string, division: string, count: number, page: number = 1) {
    const platform = PLATFORM_MAP[CONFIG.REGION] || CONFIG.REGION.toLowerCase();
    const url = getLeagueUrl(platform, tier, division, page);

    if (!url) return [];

    return await executeFetchWithRetries(url, tier, division, page, count);
}

function getLeagueUrl(platform: string, tier: string, division: string, page: number): string | null {
    if (['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(tier)) {
        if (page > 1) return null;
        return `https://${platform}.api.riotgames.com/lol/league/v4/${tier.toLowerCase()}leagues/by-queue/${CONFIG.QUEUE}`;
    }
    return `https://${platform}.api.riotgames.com/lol/league/v4/entries/${CONFIG.QUEUE}/${tier}/${division}?page=${page}`;
}

async function executeFetchWithRetries(url: string, tier: string, division: string, page: number, count: number) {
    const maxRetries = 3;
    let attempt = 1;
    let rateLimitRetries = 0;

    while (attempt <= maxRetries) {
        const result = await attemptFetch(url, tier, division);
        
        if (result.success) {
            return parseAndShufflePlayers(result.body || '[]', count);
        }

        if (result.rateLimited) {
            if (rateLimitRetries >= 10) return [];
            await delay(120000);
            rateLimitRetries++;
            continue;
        }

        if (result.shouldRetry) {
            await delay(5000);
            attempt++;
            continue;
        }

        break;
    }
    return [];
}

async function attemptFetch(url: string, tier: string, division: string) {
    try {
        const res = await riotFetchRaw(url);
        if (res.ok) return { success: true, body: res.body };
        if (res.status === 429) {
            console.warn(`\n⏳ Rate Limit Exceeded (429) for ${tier} ${division}. Waiting 120s...`);
            return { rateLimited: true };
        }
        if (res.status >= 500 && res.status < 600) {
            console.warn(`\n⚠️ Riot API Error ${res.status} Retrying...`);
            return { shouldRetry: true };
        }
        console.error(`\n❌ Failed to fetch players: ${res.status}`);
        return { success: false };
    } catch (e) {
        console.error(`\n❌ Error fetching players: ${e}`);
        return { shouldRetry: true };
    }
}
}

function parseAndShufflePlayers(body: string, count: number) {
    const data = JSON.parse(body);
    const entries = Array.isArray(data) ? data : data.entries;
    return entries.sort(() => 0.5 - Math.random()).slice(0, count);
}

async function processPlayer(entry: any, tier: string, limit: number, onMatchProcessed: () => void) {
    // API now provides PUUID directly in league-exp-v4, but league-v4 might NOT always have it populated for all regions/endpoints immediately?
    // Actually, league-v4 entries DTO usually has summonerId, and sometimes puuid.
    // If puuid is missing, we must fetch it via summonerId.

    let puuid = entry.puuid;
    let summonerData: any = null;
    let accountData: any = null;

    // 1. Fetch Summoner Data (for profileIcon, level, etc.)
    try {
        const platform = PLATFORM_MAP[CONFIG.REGION] || CONFIG.REGION.toLowerCase();
        // If we have PUUID, use it (more reliable), else use SummonerId
        const sumUrl = puuid
            ? `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`
            : `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/${entry.summonerId}`;

        const sRes = await riotFetchRaw(sumUrl);
        if (sRes.ok) {
            summonerData = JSON.parse(sRes.body || '{}');
            puuid = summonerData.puuid;
        }
    } catch (e) {
        // console.warn("Failed to fetch Summoner Data:", e);
    }

    if (!puuid || !summonerData) return 0;

    // 2. Fetch Account Data (for gameName, tagLine)
    try {
        const accountUrl = `https://${CONFIG.ROUTING}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuid}`;
        const aRes = await riotFetchRaw(accountUrl);
        if (aRes.ok) {
            accountData = JSON.parse(aRes.body || '{}');
        }
    } catch (e) {
        // console.warn("Failed to fetch Account Data:", e);
    }

    // Fallback if Account Fetch fails (use PUUID segment to ensure uniqueness)
    const gameName = accountData?.gameName || summonerData.name || entry.summonerName || 'Unknown';
    const tagLine = accountData?.tagLine || puuid.substring(0, 5);

    // UPSERT SUMMONER
    try {
        await prisma.summoner.upsert({
            where: { puuid: puuid },
            create: {
                puuid: puuid,
                summonerId: summonerData.id,
                accountId: summonerData.accountId,
                gameName: gameName,
                tagLine: tagLine,
                profileIconId: summonerData.profileIconId,
                summonerLevel: summonerData.summonerLevel,
                revisionDate: BigInt(summonerData.revisionDate),
                lastMatchFetch: new Date(),
            },
            update: {
                summonerId: summonerData.id,
                accountId: summonerData.accountId,
                gameName: gameName,
                tagLine: tagLine,
                profileIconId: summonerData.profileIconId,
                summonerLevel: summonerData.summonerLevel,
                revisionDate: BigInt(summonerData.revisionDate),
            }
        });
    } catch (err) {
        console.error(`Failed to upsert summoner ${puuid}`, err);
        return 0;
    }

    // Get Matches
    // We always fetch up to MATCHES_PER_PLAYER IDs to ensure we have enough candidates,
    // even if we only need a few. Fetching IDs is cheap.
    const matchIds = await fetchMatchIds(puuid, CONFIG.ROUTING, 0, CONFIG.MATCHES_PER_PLAYER);

    // Filter existing matches in DB to avoid re-processing
    const existingMatches = await prisma.match.findMany({
        where: { id: { in: matchIds } },
        select: { id: true }
    });
    const existingIds = new Set(existingMatches.map(m => m.id));
    const newMatchIds = matchIds.filter(id => !existingIds.has(id));

    // Apply Limit if in MATCHES mode
    // If limit is 5, we only take the first 5 new matches.
    const idsToProcess = (MODE === 'MATCHES') ? newMatchIds.slice(0, limit) : newMatchIds;

    let processedCount = 0;

    // Parallel Processing
    await mapWithConcurrency(idsToProcess, CONFIG.CONCURRENCY, async (matchId: string) => {
        const matchUrl = `https://${CONFIG.ROUTING}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
        const mRes = await riotFetchRaw(matchUrl);
        if (!mRes.ok) return;

        const matchData = JSON.parse(mRes.body || '{}');

        // OPTIMIZATION: Stop if match is from older patch
        const currentMajorMinor = CURRENT_PATCH.split('.').slice(0, 2).join('.');
        const matchVersion = matchData.info.gameVersion;
        if (!matchVersion.startsWith(currentMajorMinor)) {
            return;
        }

        try {


            // Save Match with Average Rank (Tier)
            // We use MatchHistoryService to ensure consistency, but we don't need full summoner context here
            // so we pass null for dbSummoner.
            await MatchHistoryService.saveMatchAndStats(
                { id: matchId, data: matchData },
                entry.puuid,
                CONFIG.REGION,
                null, // dbSummoner not needed if we just want to save match & stats
                tier // Pass Tier as Average Rank
            );

            await prisma.scannedMatch.upsert({
                where: { id: matchId },
                update: {},
                create: { id: matchId, patch: matchData.info.gameVersion, tier: tier }
            });

            processedCount++;
            if (MODE === 'MATCHES') {
                onMatchProcessed(); // Update progress bar per match in MATCHES mode
            }
        } catch (err) {
            // console.error(`Failed to process ${matchId}:`, err);
        }

        await delay(200); // Small delay to smooth out burst
    });

    return processedCount;
}

async function main() {
    const isConnected = await checkConnectivity();
    if (!isConnected) {
        console.error("❌ Aborting: Cannot connect to Riot API.");
        process.exit(1);
    }

    const tiersToProcess = CONFIG.TIER === 'ALL' ? TIERS : [CONFIG.TIER];

    TOTAL_TARGET_GLOBAL = tiersToProcess.length * TARGET_PER_TIER;
    GLOBAL_START_TIME = Date.now();

    startProgressTicker();

    for (const tier of tiersToProcess) {
        if (!TIERS.includes(tier)) {
            console.error(`Invalid Tier: ${tier}`);
            continue;
        }
        await processTier(tier);
    }

    CurrentProgress.active = false;
    console.log("\n✅ Seeding Complete!");
}

async function processTier(tier: string) {
    console.log(`\n--- Seeding Tier: ${tier} ---`);
    let processedForTier = 0;

    CurrentProgress.tier = tier;
    CurrentProgress.tierCurrent = processedForTier;
    CurrentProgress.tierTotal = TARGET_PER_TIER;

    const divisions = ['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(tier) ? ['I'] : DIVISIONS;

    updateProgressBar(tier, processedForTier, TARGET_PER_TIER);

    for (let i = 0; i < divisions.length; i++) {
        const division = divisions[i];
        if (processedForTier >= TARGET_PER_TIER) break;

        const remainingDivisions = divisions.length - i;
        const remainingTarget = TARGET_PER_TIER - processedForTier;
        const targetForDiv = Math.ceil(remainingTarget / remainingDivisions);

        processedForTier += await processDivision(tier, division, targetForDiv, processedForTier);
    }
    console.log("");
}

async function processDivision(tier: string, division: string, targetForDiv: number, currentTierProcessed: number) : Promise<number> {
    console.log(`\n🎯 Target for ${tier} ${division}: ${targetForDiv} matches`);

    let processedForDiv = 0;
    let page = 1;
    let keepFetching = true;
    let addedCountTotal = 0;

    while (keepFetching && processedForDiv < targetForDiv) {
        console.log(`\n🔍 Fetching players from ${tier} ${division} (Page ${page})...`);

        const players = await fetchRandomPlayers(tier, division, 10, page);

        if (players.length === 0) {
            console.warn(`\n⚠️ No more players found in ${tier} ${division}.`);
            keepFetching = false;
            break;
        }

        const { addedCount, stopTier } = await processPlayerBatch(players, tier, division, targetForDiv, processedForDiv, currentTierProcessed + addedCountTotal);
        addedCountTotal += addedCount;
        processedForDiv += addedCount;

        if (stopTier) break;

        page++;
        await delay(1000);
    }
    return addedCountTotal;
}

async function processPlayerBatch(players: any[], tier: string, division: string, targetForDiv: number, processedForDiv: number, processedForTier: number) {
    let addedCount = 0;
    let stopTier = false;

    for (const player of players) {
        if (processedForTier + addedCount >= TARGET_PER_TIER) {
            stopTier = true;
            break;
        }
        if (processedForDiv + addedCount >= targetForDiv) break;

        if (!player.puuid) continue;

        const alreadyScanned = await prisma.scannedSummoner.findUnique({
            where: {
                puuid_region: {
                    puuid: player.puuid,
                    region: CONFIG.REGION
                }
            }
        });

        if (alreadyScanned) continue;

        const limit = (MODE === 'MATCHES')
            ? (targetForDiv - (processedForDiv + addedCount))
            : CONFIG.MATCHES_PER_PLAYER;

        const matchesCount = await processPlayer(player, tier, limit, () => {
            if (MODE === 'MATCHES') {
                GLOBAL_PROCESSED++;
                CurrentProgress.tierCurrent = processedForTier + addedCount; // Approximation during batch
                updateProgressBar(tier, processedForTier + addedCount, TARGET_PER_TIER);
            }
        });

        if (MODE === 'MATCHES') {
             // In MATCHES mode, processPlayer returns loaded matches, but our loop counts matches processed via callback. 
             // Logic in original main was: processedForDiv += matchesCount (actually it was incremented via callback).
             // Wait, original main incremented processedForDiv INSIDE callback.
             // Here limit logic assumes we want `limit` matches.
             // We can track added matches via the matchesCount returned if needed, OR just rely on logic.
             // The callback updates globals. We need local counters.
             // The callback provided to processPlayer handles global updates.
             // We need to return how much we advanced to update `processedForDiv` in caller.
             // Actually `processPlayer` returns `processedCount`.
             addedCount += matchesCount;
        } else {
            addedCount++;
            GLOBAL_PROCESSED++;
            CurrentProgress.tierCurrent = processedForTier + addedCount;
            updateProgressBar(tier, processedForTier + addedCount, TARGET_PER_TIER);
        }
        
        await prisma.scannedSummoner.create({
            data: { puuid: player.puuid, region: CONFIG.REGION }
        });

        await delay(1000);
    }
    return { addedCount, stopTier };
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        CurrentProgress.active = false; // Ensure ticker stops
        await prisma.$disconnect();
    });
