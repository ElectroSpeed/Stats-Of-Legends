import { prisma } from '@/lib/prisma';
import { RiotService } from './RiotService';
import { getDurationBucket } from '../utils/matchUtils';

export class MatchProcessor {
    /**
     * Processes a match to update global Tier List statistics (ChampionStat, MatchupStat, DuoStat).
     * @param matchId The ID of the match (e.g., EUW1_123456)
     * @param region The region for Riot API calls (e.g., euw1) - Optional if jsonData is provided
     * @param tier The tier of the match (e.g., CHALLENGER)
     * @param jsonData Optional: The full match JSON data if already available (avoids re-fetch)
     */
    static async processMatch(matchId: string, region: string, tier: string = 'CHALLENGER', jsonData?: any) {
        try {
            // 1. Check if already scanned
            const existing = await prisma.scannedMatch.findUnique({ where: { id: matchId } });
            if (existing) {
                return { status: 'skipped', reason: 'Already scanned' };
            }

            let info: any;
            let patch: string;

            if (jsonData) {
                // Use provided JSON
                info = jsonData.info;
                patch = info.gameVersion.split('.').slice(0, 2).join('.');
            } else {
                // Fetch from Riot API
                let routing = 'europe';
                if (region.startsWith('na') || region.startsWith('br') || region.startsWith('la')) routing = 'americas';
                if (region.startsWith('kr') || region.startsWith('jp')) routing = 'asia';

                const match = await RiotService.getMatchDetails(routing, matchId);
                info = match.info;
                patch = info.gameVersion.split('.').slice(0, 2).join('.');
            }

            // Fetch Maps (cached by RiotService usually)
            const champMap = await RiotService.getChampionIdMap(patch + ".1");
            const itemMap = await RiotService.getItemMap(patch + ".1");

            // Duration Bucket
            const duration = info.gameDuration || 0;
            const durationBucket = getDurationBucket(duration);

            // Calculate Team Totals for Shares
            const teamStats: Record<number, { damage: number; gold: number }> = { 100: { damage: 0, gold: 0 }, 200: { damage: 0, gold: 0 } };
            for (const p of info.participants) {
                const tid = p.teamId;
                if (teamStats[tid]) {
                    teamStats[tid].damage += p.totalDamageDealtToChampions || 0;
                    teamStats[tid].gold += p.goldEarned || 0;
                }
            }

            // Process Bans
            await this.processBans(info, champMap, tier, patch, durationBucket);

            // Process Participants
            for (const p of info.participants) {
                await this.processSingleParticipant(p, info, matchId, region, tier, patch, durationBucket, champMap, itemMap, teamStats);
            }

            // Mark as Scanned
            await prisma.scannedMatch.create({
                data: {
                    id: matchId,
                    patch: patch,
                    tier: tier
                }
            });

            return { status: 'processed', patch };

        } catch (error: any) {
            console.error('MatchProcessor Error:', error);
            throw error;
        }
    }

    private static async processBans(info: any, champMap: any, tier: string, patch: string, durationBucket: string) {
        for (const team of info.teams) {
            for (const ban of team.bans) {
                if (ban.championId !== -1) {
                    const champName = champMap[ban.championId];
                    if (champName) {
                        await prisma.championStat.upsert({
                            where: {
                                championId_role_tier_patch_durationBucket: {
                                    championId: champName,
                                    role: 'ALL',
                                    tier: tier,
                                    patch: patch,
                                    durationBucket: durationBucket
                                }
                            },
                            update: { bans: { increment: 1 } },
                            create: {
                                championId: champName,
                                role: 'ALL',
                                tier: tier,
                                patch: patch,
                                durationBucket: durationBucket,
                                bans: 1
                            }
                        });
                    }
                }
            }
        }
    }

    private static async processSingleParticipant(p: any, info: any, matchId: string, region: string, tier: string, patch: string, durationBucket: string, champMap: any, itemMap: any, teamStats: any) {
        let role = this.normalizeRole(p.teamPosition);
        if (!role || role === 'Invalid') return;

        const championId = p.championName;
        const timelineData = await this.extractTimelineData(matchId, region, p.participantId);
        const itemStats = this.extractItems(p, timelineData.cleanEvents, itemMap);
        const runeStats = this.extractRunes(p);
        const spellStats = this.extractSpells(p);
        const skillOrderStats = this.extractSkillOrder(timelineData.skillOrderString, p.win);

        const shares = this.calculateShares(p, info, teamStats);

        await this.upsertChampionStats(p, info, role, tier, patch, durationBucket, shares, itemStats, runeStats, spellStats, skillOrderStats);
        await this.upsertMatchupStats(p, info, role, tier, patch, durationBucket, shares);
        await this.upsertDuoStats(p, info, role, tier, patch);
    }

    private static normalizeRole(role: string): string {
        if (role === 'MIDDLE') return 'MID';
        if (role === 'BOTTOM') return 'ADC';
        if (role === 'UTILITY') return 'SUPPORT';
        return role;
    }

    private static async extractTimelineData(matchId: string, region: string, participantId: number) {
        let skillOrderString = '';
        let cleanEvents: any[] = [];
        try {
            let routing = 'europe';
            if (region.startsWith('na') || region.startsWith('br') || region.startsWith('la')) routing = 'americas';
            if (region.startsWith('kr') || region.startsWith('jp')) routing = 'asia';

            const timeline = await RiotService.getMatchTimeline(routing, matchId);
            
            // Skill Order
            const skillEvents = timeline.info.frames.flatMap((f: any) => f.events)
                .filter((e: any) => e.type === 'SKILL_LEVEL_UP' && e.participantId === participantId && e.skillSlot > 0 && e.skillSlot <= 4);
            const skillMap: Record<number, string> = { 1: 'Q', 2: 'W', 3: 'E', 4: 'R' };
            skillOrderString = skillEvents.map((e: any) => skillMap[e.skillSlot]).join('-');

            // Build Events
            const allItemEvents = timeline.info.frames.flatMap((f: any) => f.events)
                .filter((e: any) => e.participantId === participantId && ['ITEM_PURCHASED', 'ITEM_SOLD', 'ITEM_UNDO'].includes(e.type));

            for (const ev of allItemEvents) {
                if (ev.type === 'ITEM_PURCHASED' || ev.type === 'ITEM_SOLD') {
                    cleanEvents.push(ev);
                } else if (ev.type === 'ITEM_UNDO') {
                    const lastIdx = cleanEvents.length - 1;
                    if (lastIdx >= 0) {
                        const lastEv = cleanEvents[lastIdx];
                        if ((lastEv.type === 'ITEM_PURCHASED' && lastEv.itemId === ev.beforeId) || 
                            (lastEv.type === 'ITEM_SOLD' && lastEv.itemId === ev.afterId)) {
                            cleanEvents.pop();
                        }
                    }
                }
            }
        } catch (err) { /* Ignore */ }
        return { skillOrderString, cleanEvents };
    }

    private static extractItems(p: any, cleanEvents: any[], itemMap: any) {
        const IGNORED_ITEMS = new Set([3340, 3363, 3364, 3330, 2003, 2055, 2140, 2138, 2139, 1054, 1055, 1056, 1082, 1083, 1101, 1102, 1103]);
        const finalItems = [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5].filter(id => id && id !== 0 && !IGNORED_ITEMS.has(id));
        const items: Record<string, any> = {};

        const finalBuildKey = finalItems.sort((a, b) => a - b).join('-');
        if (finalBuildKey) items[finalBuildKey] = { wins: p.win ? 1 : 0, matches: 1, build: finalItems };

        for (const id of finalItems) {
            if (!items[id]) items[id] = { wins: 0, matches: 0 };
            items[id].wins += p.win ? 1 : 0;
            items[id].matches++;
        }

        if (cleanEvents.length > 0) {
             const VISION_ITEMS = new Set([3340, 3363, 3364, 3330, 2055, 2049, 2045, 2044]);
             const startingEvents = cleanEvents.filter(e => e.type === 'ITEM_PURCHASED' && e.timestamp <= 60000 && !VISION_ITEMS.has(e.itemId));
             if (startingEvents.length > 0) {
                 const startIds = startingEvents.map(e => e.itemId).sort((a: number, b: number) => a - b).join('-');
                 const key = `start_${startIds}`;
                 if (!items[key]) items[key] = { wins: 0, matches: 0 };
                 items[key].wins += p.win ? 1 : 0;
                 items[key].matches++;
             }

             const finalItemSet = new Set(finalItems);
             const buildPath = cleanEvents.filter(e => {
                 if (e.type !== 'ITEM_PURCHASED' || !finalItemSet.has(e.itemId)) return false;
                 const itemData = itemMap[e.itemId];
                 if (itemData) {
                     const isBoots = itemData.tags && itemData.tags.includes('Boots');
                     if (!isBoots && itemData.into && itemData.into.length > 0) return false;
                 }
                 return true;
             }).map(e => e.itemId);

             const uniqueBuildPath = Array.from(new Set(buildPath));
             if (uniqueBuildPath.length >= 1) {
                 const coreIds = uniqueBuildPath.slice(0, Math.min(uniqueBuildPath.length, 3));
                 const coreKey = `core_${coreIds.join('-')}`;
                 if (!items[coreKey]) items[coreKey] = { wins: 0, matches: 0 };
                 items[coreKey].wins += p.win ? 1 : 0;
                 items[coreKey].matches++;

                 [3, 4, 5].forEach(idx => {
                     if (uniqueBuildPath.length >= idx + 1) {
                         const slotKey = `${coreKey}_slot${idx + 1}_${uniqueBuildPath[idx]}`;
                         if (!items[slotKey]) items[slotKey] = { wins: 0, matches: 0 };
                         items[slotKey].wins += p.win ? 1 : 0;
                         items[slotKey].matches++;
                     }
                 });
             }
        }
        return items;
    }

    private static extractRunes(p: any) {
        const perks = p.perks?.styles || [];
        const statPerks = p.perks?.statPerks || {};
        const runes: Record<string, any> = {};

        const primaryStyle = perks.find((s: any) => s.description === 'primaryStyle');
        const subStyle = perks.find((s: any) => s.description === 'subStyle');

        if (primaryStyle && subStyle) {
            const pIds = primaryStyle.selections.map((s: any) => s.perk).join('-');
            const sIds = subStyle.selections.map((s: any) => s.perk).join('-');
            const statIds = [statPerks.offense, statPerks.flex, statPerks.defense].filter(Boolean).join('-');
            const runePageKey = `${primaryStyle.style}-${subStyle.style}-${pIds}-${sIds}-${statIds}`;
            runes[`page_${runePageKey}`] = { wins: p.win ? 1 : 0, matches: 1 };
        }

        for (const style of perks) {
            for (const selection of style.selections) {
                if (!runes[selection.perk]) runes[selection.perk] = { wins: 0, matches: 0 };
                runes[selection.perk].wins += p.win ? 1 : 0;
                runes[selection.perk].matches++;
            }
        }
        [statPerks.offense, statPerks.flex, statPerks.defense].forEach(id => {
            if (id) {
                if (!runes[id]) runes[id] = { wins: 0, matches: 0 };
                runes[id].wins += p.win ? 1 : 0;
                runes[id].matches++;
            }
        });
        return runes;
    }

    private static extractSpells(p: any) {
        const spells: Record<string, any> = {};
        if (p.summoner1Id) spells[p.summoner1Id] = { wins: p.win ? 1 : 0, matches: 1 };
        if (p.summoner2Id) {
            if (!spells[p.summoner2Id]) spells[p.summoner2Id] = { wins: 0, matches: 0 };
            spells[p.summoner2Id].wins += p.win ? 1 : 0;
            spells[p.summoner2Id].matches++;
        }
        return spells;
    }

    private static extractSkillOrder(skillOrderString: string, win: boolean) {
        const skillOrderData: Record<string, any> = {};
        if (skillOrderString) {
            skillOrderData[skillOrderString] = { wins: win ? 1 : 0, matches: 1 };
        }
        return skillOrderData;
    }

    private static calculateShares(p: any, info: any, teamStats: any) {
        const myTeamStats = teamStats[p.teamId] || { damage: 1, gold: 1 };
        return {
            damageShare: (p.totalDamageDealtToChampions || 0) / Math.max(1, myTeamStats.damage),
            goldShare: (p.goldEarned || 0) / Math.max(1, myTeamStats.gold),
            visionPerMin: (p.visionScore || 0) / Math.max(1, (info.gameDuration || 1) / 60),
            objPart: p.challenges?.teamObjectives || 0
        };
    }

    private static async upsertChampionStats(p: any, info: any, role: string, tier: string, patch: string, durationBucket: string, shares: any, items: any, runes: any, spells: any, skillOrder: any) {
         const existingStat = await prisma.championStat.findUnique({
            where: {
                championId_role_tier_patch_durationBucket: {
                    championId: p.championName, role, tier, patch, durationBucket
                }
            }
        });

        if (existingStat) {
             const merge = (target: any, source: any) => {
                 const t = target || {};
                 Object.keys(source).forEach(k => {
                     if (t[k]) { t[k].wins += source[k].wins; t[k].matches += source[k].matches; }
                     else { t[k] = source[k]; }
                 });
                 return t;
             };

             await prisma.championStat.update({
                where: { id: existingStat.id },
                data: {
                    matches: { increment: 1 },
                    wins: { increment: p.win ? 1 : 0 },
                    totalKills: { increment: p.kills },
                    totalDeaths: { increment: p.deaths },
                    totalAssists: { increment: p.assists },
                    totalDamage: { increment: p.totalDamageDealtToChampions },
                    totalGold: { increment: p.goldEarned },
                    totalCs: { increment: (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0) },
                    totalVision: { increment: p.visionScore },
                    totalDuration: { increment: info.gameDuration },
                    totalDamageShare: { increment: shares.damageShare },
                    totalGoldShare: { increment: shares.goldShare },
                    totalVisionScorePerMin: { increment: shares.visionPerMin },
                    totalObjectiveParticipation: { increment: shares.objPart },
                    totalDamageShareSq: { increment: Math.pow(shares.damageShare, 2) },
                    items: merge(existingStat.items, items) as any,
                    runes: merge(existingStat.runes, runes) as any,
                    spells: merge(existingStat.spells, spells) as any,
                    skillOrder: merge(existingStat.skillOrder, skillOrder) as any
                }
            });
        } else {
            await prisma.championStat.create({
                data: {
                    championId: p.championName, role, tier, patch, durationBucket,
                    matches: 1, wins: p.win ? 1 : 0,
                    totalKills: p.kills, totalDeaths: p.deaths, totalAssists: p.assists,
                    totalDamage: p.totalDamageDealtToChampions, totalGold: p.goldEarned,
                    totalCs: (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0),
                    totalVision: p.visionScore, totalDuration: info.gameDuration,
                    totalDamageShare: shares.damageShare, totalGoldShare: shares.goldShare,
                    totalVisionScorePerMin: shares.visionPerMin, totalObjectiveParticipation: shares.objPart,
                    totalGd15Sq: 0, totalCsd15Sq: 0, totalXpd15Sq: 0,
                    totalDamageShareSq: Math.pow(shares.damageShare, 2),
                    items: items as any, runes: runes as any, spells: spells as any, skillOrder: skillOrder as any
                }
            });
        }
    }

    private static async upsertMatchupStats(p: any, info: any, role: string, tier: string, patch: string, durationBucket: string, shares: any) {
        const opponent = info.participants.find((op: any) => this.normalizeRole(op.teamPosition) === role && op.teamId !== p.teamId);
        if (opponent) {
            await prisma.matchupStat.upsert({
                where: {
                    championId_opponentId_role_tier_patch_durationBucket: {
                        championId: p.championName, opponentId: opponent.championName, role, tier, patch, durationBucket
                    }
                },
                update: {
                    matches: { increment: 1 }, wins: { increment: p.win ? 1 : 0 },
                    totalKills: { increment: p.kills }, totalDeaths: { increment: p.deaths }, totalAssists: { increment: p.assists },
                    totalDamage: { increment: p.totalDamageDealtToChampions }, totalGold: { increment: p.goldEarned },
                    totalCs: { increment: (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0) },
                    totalVision: { increment: p.visionScore }, totalDuration: { increment: info.gameDuration },
                    totalDamageShare: { increment: shares.damageShare }, totalGoldShare: { increment: shares.goldShare },
                    totalVisionScorePerMin: { increment: shares.visionPerMin }, totalObjectiveParticipation: { increment: shares.objPart },
                    totalDamageShareSq: { increment: Math.pow(shares.damageShare, 2) }
                },
                create: {
                    championId: p.championName, opponentId: opponent.championName, role, tier, patch, durationBucket,
                    matches: 1, wins: p.win ? 1 : 0,
                    totalKills: p.kills, totalDeaths: p.deaths, totalAssists: p.assists,
                    totalDamage: p.totalDamageDealtToChampions, totalGold: p.goldEarned,
                    totalCs: (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0),
                    totalVision: p.visionScore, totalDuration: info.gameDuration,
                    totalDamageShare: shares.damageShare, totalGoldShare: shares.goldShare,
                    totalVisionScorePerMin: shares.visionPerMin, totalObjectiveParticipation: shares.objPart,
                    totalDamageShareSq: Math.pow(shares.damageShare, 2),
                    totalGd15Sq: 0, totalCsd15Sq: 0, totalXpd15Sq: 0
                }
            });
        }
    }

    private static async upsertDuoStats(p: any, info: any, role: string, tier: string, patch: string) {
        const teamMates = info.participants.filter((tm: any) => tm.teamId === p.teamId && tm.participantId !== p.participantId);
        for (const mate of teamMates) {
            const mateRole = this.normalizeRole(mate.teamPosition);
            const validDuos = [['MID', 'JUNGLE'], ['ADC', 'SUPPORT'], ['TOP', 'JUNGLE']];
            const isDuo = validDuos.some(pair => (pair[0] === role && pair[1] === mateRole) || (pair[1] === role && pair[0] === mateRole));

            if (isDuo) {
                await prisma.duoStat.upsert({
                    where: {
                        championId_partnerId_role_partnerRole_tier_patch: {
                            championId: p.championName, partnerId: mate.championName, role, partnerRole: mateRole, tier, patch
                        }
                    },
                    update: { matches: { increment: 1 }, wins: { increment: p.win ? 1 : 0 } },
                    create: {
                        championId: p.championName, partnerId: mate.championName, role, partnerRole: mateRole, tier, patch,
                        matches: 1, wins: p.win ? 1 : 0
                    }
                });
            }
        }
    }
}
