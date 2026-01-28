import { Participant } from '../types';

export class AggregationService {
    static calculateAggregations(matches: any[], summoner: any, version: string) {
        const context = {
            championsMap: new Map<string, any>(),
            teammatesMap: new Map<string, any>(),
            heatmapData: {} as Record<string, { count: number; wins: number; losses: number }>,
            performance: { combat: 0, objectives: 0, vision: 0, farming: 0, survival: 0 } as any,
            totalScore: 0,
            scoreCount: 0,
            scores: [] as number[],
        }

        matches.forEach(match => this.processMatch(match, matches, context));

        this.finalizePerformance(context);
        context.performance.consistencyBadge = this.calculateConsistency(context.scores, context.totalScore, context.scoreCount);

        const lpHistory = this.extractLpHistory(summoner);
        const heatmap = this.generateDailyHeatmap(context.heatmapData);

        return {
            champions: Array.from(context.championsMap.values()).map(c => ({
                ...c,
                games: c.matches,
                kda: (c.kills + c.assists) / Math.max(1, c.deaths)
            })).sort((a, b) => b.matches - a.matches).slice(0, 5),
            heatmap,
            teammates: Array.from(context.teammatesMap.values()).map(t => ({
                name: t.summonerName,
                tag: t.tagLine,
                profileIconId: t.profileIconId,
                wins: t.wins,
                losses: t.matches - t.wins,
                winrate: Math.round((t.wins / t.matches) * 100),
                games: t.matches
            })).sort((a, b) => b.games - a.games).slice(0, 5),
            lpHistory,
            performance: context.performance
        };
    }

    private static processMatch(match: any, matches: any[], ctx: any) {
        const me = match.me;
        if (!me) return;

        this.updateChampionStats(me, ctx.championsMap);
        this.updateTeammatesStats(match, matches, ctx.teammatesMap);
        this.updateHeatmapStats(match, me, ctx.heatmapData);
        this.updatePerformanceStats(me, ctx);
    }

    private static updateChampionStats(me: any, championsMap: Map<string, any>) {
        const champName = me.champion.name;
        if (!championsMap.has(champName)) {
            championsMap.set(champName, {
                id: me.champion.id,
                name: champName,
                imageUrl: me.champion.imageUrl,
                matches: 0, wins: 0, kills: 0, deaths: 0, assists: 0,
                cs: 0, gold: 0, damage: 0,
            });
        }
        const champ = championsMap.get(champName);
        champ.matches++;
        if (me.win) champ.wins++;
        champ.kills += me.kills;
        champ.deaths += me.deaths;
        champ.assists += me.assists;
        champ.cs += me.cs;
        champ.gold += me.goldEarned;
        champ.damage += me.totalDamageDealtToChampions;
    }

    private static updateTeammatesStats(match: any, matches: any[], teammatesMap: Map<string, any>) {
        // Limit to last 20 matches for performance
        if (matches.indexOf(match) >= 20 || !match.teamMatesSummary || !Array.isArray(match.teamMatesSummary)) return;

        match.teamMatesSummary.forEach((tm: any) => {
            const key = `${tm.summonerName}#${tm.tagLine}`;
            if (!teammatesMap.has(key)) {
                teammatesMap.set(key, {
                    summonerName: tm.summonerName,
                    tagLine: tm.tagLine,
                    matches: 0, wins: 0, puuid: tm.puuid, profileIconId: tm.profileIconId
                });
            }
            const t = teammatesMap.get(key);
            t.matches++;
            if (tm.win) t.wins++;
        });
    }

    private static updateHeatmapStats(match: any, me: any, heatmapData: any) {
        const creation = new Date(match.gameCreation);
        if (!Number.isNaN(creation.getTime())) {
            const date = creation.toISOString().split('T')[0];
            if (!heatmapData[date]) heatmapData[date] = { count: 0, wins: 0, losses: 0 };
            heatmapData[date].count++;
            if (me.win) heatmapData[date].wins++;
            else heatmapData[date].losses++;
        }
    }

    private static updatePerformanceStats(me: any, ctx: any) {
        if (me.legendScoreBreakdown) {
            ctx.performance.combat += me.legendScoreBreakdown.damage || 0;
            ctx.performance.objectives += me.legendScoreBreakdown.objective || 0;
            ctx.performance.vision += me.legendScoreBreakdown.vision || 0;
            ctx.performance.farming += me.legendScoreBreakdown.cs || 0;
            ctx.performance.survival += me.legendScoreBreakdown.kda || 0;
            ctx.totalScore += me.legendScore;
            ctx.scoreCount++;
            ctx.scores.push(me.legendScore);
        }
    }

    private static finalizePerformance(ctx: any) {
        if (ctx.scoreCount > 0) {
            const zToScore = (z: number) => Math.max(0, Math.min(100, 50 + (z * 20)));
            ctx.performance.combat = zToScore(ctx.performance.combat / ctx.scoreCount);
            ctx.performance.objectives = zToScore(ctx.performance.objectives / ctx.scoreCount);
            ctx.performance.vision = zToScore(ctx.performance.vision / ctx.scoreCount);
            ctx.performance.farming = zToScore(ctx.performance.farming / ctx.scoreCount);
            ctx.performance.survival = zToScore(ctx.performance.survival / ctx.scoreCount);
        }
    }

    private static calculateConsistency(scores: number[], totalScore: number, scoreCount: number): string {
        if (scores.length < 5) return 'Average';
        const mean = totalScore / scoreCount;
        const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scoreCount;
        const stdDev = Math.sqrt(variance);

        if (stdDev < 8) return 'Rock Solid';
        if (stdDev > 18) return 'Coinflip';
        return 'Average';
    }

    private static extractLpHistory(summoner: any): any[] {
        const lpHistory: any[] = [];
        if (summoner.snapshots) {
            summoner.snapshots
                .filter((s: any) => s.queueType === 'RANKED_SOLO_5x5')
                .forEach((s: any) => {
                    lpHistory.push({
                        date: s.timestamp.toISOString().split('T')[0],
                        lp: s.leaguePoints,
                        tier: s.tier,
                        rank: s.rank
                    });
                });
        }
        return lpHistory;
    }

    private static generateDailyHeatmap(heatmapData: any): any[] {
        const heatmap = [];
        const today = new Date();
        for (let i = 119; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayData = heatmapData[dateStr] || { count: 0, wins: 0, losses: 0 };

            let intensity = 0;
            if (dayData.count > 0) {
                const wr = dayData.wins / dayData.count;
                if (dayData.count < 3) {
                    intensity = wr >= 0.5 ? 2 : 1;
                } else {
                    if (wr < 0.4) intensity = 2;
                    else if (wr <= 0.6) intensity = 3;
                    else intensity = 4;
                }
            }

            heatmap.push({
                date: dateStr,
                games: dayData.count,
                wins: dayData.wins,
                losses: dayData.losses,
                intensity
            });
        }
        return heatmap;
    }
}
