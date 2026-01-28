import { prisma } from '@/lib/prisma';
import { getTargetTiers } from '@/utils/tierUtils';
import { Prisma } from '@prisma/client';

interface AggregatedStat {
    wins: number;
    matches: number;
}

interface ItemStat extends AggregatedStat { }
interface RuneStat extends AggregatedStat { }
interface SpellStat extends AggregatedStat { }
interface SkillOrderStat extends AggregatedStat { }


export class ChampionDetailService {
    static async getChampionDetails(championName: string, role: string, rank: string) {
        const targetTiers = getTargetTiers(rank);
        const stats = await this.fetchRawStats(championName, role, targetTiers);

        if (stats.length === 0) return null;

        const aggregated = this.aggregateRawStats(stats);
        
        const matchupStats = await this.fetchAndAggregateMatchups(championName, role, targetTiers);
        const duoStats = await this.fetchAndAggregateDuos(championName, role, targetTiers);

        // Get patch from stats (use the latest one found in the DB for this champ/tier)
        const patch = stats.length > 0 ? stats.sort((a, b) => b.patch.localeCompare(a.patch, undefined, { numeric: true }))[0].patch : 'Unknown';

        // Calculate Metrics
        const { winRate, pickRate, banRate, calculatedTier, totalMatches } = await this.calculateMetaStats(championName, role, targetTiers, aggregated.matches, aggregated.wins);

        // Extract Core Build
        const coreBuilds = this.extractCoreBuilds(aggregated.items);
        const bestCore = coreBuilds.length > 0 ? coreBuilds[0] : null;

        const { slot4, slot5, slot6 } = this.extractSlotOptions(aggregated.items, bestCore?.key);
        const startingItems = this.extractStartingItems(aggregated.items);
        const skillOrders = this.extractSkillOrders(aggregated.skillOrders);
        const topSkillPath = skillOrders.length > 0 ? skillOrders[0].path.split('-') : [];
        const runePages = this.extractRunePages(aggregated.runes);

        return {
            championId: championName,
            role,
            tier: calculatedTier,
            rank: rank,
            patch,
            winRate, pickRate, banRate, totalMatches,
            stats: aggregated,
            itemPaths: coreBuilds,
            startingItems,
            slot4, slot5, slot6,
            skillOrders, topSkillPath,
            runePages,
            matchups: matchupStats,
            duos: duoStats
        };
    }

    private static async fetchRawStats(championName: string, role: string, targetTiers: string[]) {
        const whereClause: Prisma.ChampionStatWhereInput = {
            championId: championName,
            tier: { in: targetTiers }
        };

        if (role && role !== 'ALL') whereClause.role = role;
        else whereClause.role = { not: 'ALL' };

        return prisma.championStat.findMany({ where: whereClause });
    }

    private static aggregateRawStats(stats: any[]) {
        const aggregated = {
            matches: 0, wins: 0,
            items: {} as Record<string, ItemStat>,
            runes: {} as Record<string, RuneStat>,
            spells: {} as Record<string, SpellStat>,
            skillOrders: {} as Record<string, SkillOrderStat>
        };

        for (const stat of stats) {
            aggregated.matches += stat.matches;
            aggregated.wins += stat.wins;
            this.mergeDeepStats(aggregated.items, stat.items);
            this.mergeDeepStats(aggregated.runes, stat.runes);
            this.mergeDeepStats(aggregated.spells, stat.spells);
            this.mergeDeepStats(aggregated.skillOrders, stat.skillOrder);
        }
        return aggregated;
    }

    private static mergeDeepStats(target: Record<string, AggregatedStat>, source: any) {
        const src = (source as Record<string, AggregatedStat>) || {};
        Object.entries(src).forEach(([id, data]) => {
            if (!target[id]) target[id] = { wins: 0, matches: 0 };
            target[id].wins += data.wins;
            target[id].matches += data.matches;
        });
    }

    private static async fetchAndAggregateMatchups(championName: string, role: string, targetTiers: string[]) {
        const matchupWhere: any = { championId: championName, tier: { in: targetTiers } };
        if (role && role !== 'ALL') matchupWhere.role = role;

        const matchups = await prisma.matchupStat.findMany({ where: matchupWhere });
        const aggregatedMatchups = new Map<string, { wins: number, matches: number }>();

        for (const m of matchups) {
            if (!aggregatedMatchups.has(m.opponentId)) aggregatedMatchups.set(m.opponentId, { wins: 0, matches: 0 });
            const curr = aggregatedMatchups.get(m.opponentId)!;
            curr.wins += m.wins;
            curr.matches += m.matches;
        }

        return Array.from(aggregatedMatchups.entries()).map(([id, stats]) => ({
            opponentId: id, ...stats, winRate: (stats.wins / stats.matches) * 100
        })).sort((a, b) => a.winRate - b.winRate);
    }

    private static async fetchAndAggregateDuos(championName: string, role: string, targetTiers: string[]) {
        const duoWhere: any = { championId: championName, tier: { in: targetTiers } };
        if (role && role !== 'ALL') duoWhere.role = role;

        const duos = await prisma.duoStat.findMany({ where: duoWhere });
        const aggregatedDuos = new Map<string, { wins: number, matches: number, role: string }>();

        for (const d of duos) {
            const key = `${d.partnerId}_${d.partnerRole}`;
            if (!aggregatedDuos.has(key)) aggregatedDuos.set(key, { wins: 0, matches: 0, role: d.partnerRole });
            const curr = aggregatedDuos.get(key)!;
            curr.wins += d.wins;
            curr.matches += d.matches;
        }

        return Array.from(aggregatedDuos.entries()).map(([key, stats]) => ({
            partnerId: key.split('_')[0], partnerRole: stats.role, ...stats, winRate: (stats.wins / stats.matches) * 100
        })).sort((a, b) => b.matches - a.matches);
    }

    private static async calculateMetaStats(championName: string, role: string, targetTiers: string[], matches: number, wins: number) {
        const totalMatches = await prisma.scannedMatch.count({ where: { tier: { in: targetTiers } } });
        const banStat = await prisma.championStat.findFirst({
            where: { championId: championName, role: 'ALL', tier: { in: targetTiers } }
        });
        const bans = banStat ? banStat.bans : 0;

        const winRate = matches > 0 ? (wins / matches) * 100 : 0;
        const pickRate = totalMatches > 0 ? (matches / totalMatches) * 100 : 0;
        const banRate = totalMatches > 0 ? (bans / totalMatches) * 100 : 0;

        let calculatedTier: 'S+' | 'S' | 'A+' | 'A' | 'B' | 'C' | 'D' = 'B';
        if (winRate >= 53 && pickRate > 1) calculatedTier = 'S+';
        else if (winRate >= 52) calculatedTier = 'S';
        else if (winRate >= 51) calculatedTier = 'A+';
        else if (winRate >= 50) calculatedTier = 'A';
        else if (winRate >= 48) calculatedTier = 'B';
        else if (winRate >= 45) calculatedTier = 'C';
        else calculatedTier = 'D';

        return { winRate, pickRate, banRate, calculatedTier, totalMatches };
    }

    private static extractCoreBuilds(items: Record<string, ItemStat>) {
        return Object.entries(items)
            .filter(([key]) => key.startsWith('core_'))
            .map(([key, data]) => ({
                path: key.replace('core_', '').split('-').map(Number),
                wins: data.wins, matches: data.matches, winRate: (data.wins / data.matches) * 100,
                key: key
            }))
            .sort((a, b) => b.matches - a.matches);
    }

    private static extractSlotOptions(items: Record<string, ItemStat>, bestCoreKey?: string) {
        if (!bestCoreKey) return { slot4: [], slot5: [], slot6: [] };

        const getOptions = (slot: string) => Object.entries(items)
            .filter(([key]) => key.startsWith(`${bestCoreKey}_${slot}_`))
            .map(([key, data]) => ({
                id: Number(key.split('_').pop()),
                wins: data.wins, matches: data.matches, winRate: (data.wins / data.matches) * 100
            }))
            .sort((a, b) => b.matches - a.matches)
            .slice(0, 5);

        return { slot4: getOptions('slot4'), slot5: getOptions('slot5'), slot6: getOptions('slot6') };
    }

    private static extractStartingItems(items: Record<string, ItemStat>) {
        return Object.entries(items)
            .filter(([key]) => key.startsWith('start_'))
            .map(([key, data]) => ({
                items: key.replace('start_', '').split('-').map(Number),
                wins: data.wins, matches: data.matches, winRate: (data.wins / data.matches) * 100
            }))
            .sort((a, b) => b.matches - a.matches)
            .slice(0, 3);
    }

    private static extractSkillOrders(skillOrders: Record<string, SkillOrderStat>) {
        return Object.entries(skillOrders)
            .map(([key, data]) => ({
                path: key, wins: data.wins, matches: data.matches, winRate: (data.wins / data.matches) * 100
            }))
            .sort((a, b) => b.matches - a.matches)
            .slice(0, 3);
    }

    private static extractRunePages(runes: Record<string, RuneStat>) {
        return Object.entries(runes)
            .filter(([key]) => key.startsWith('page_'))
            .map(([key, data]) => {
                const parts = key.replace('page_', '').split('-');
                return {
                    primaryStyle: Number(parts[0]),
                    subStyle: Number(parts[1]),
                    perks: parts.slice(2).map(Number),
                    wins: data.wins, matches: data.matches, winRate: (data.wins / data.matches) * 100
                };
            })
            .sort((a, b) => b.matches - a.matches)
            .slice(0, 3);
    }
}
