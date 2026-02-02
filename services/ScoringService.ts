import { Participant } from '../types';
import { MLService } from './MLService';

export interface ScoreResult {
    score: number; // 0-10
    grade: string; // S+, S, A, B, C, D
    breakdown: {
        kda: number;
        damage: number;
        gold: number;
        vision: number;
        cs: number;
        objective: number;
        utility: number;
        lane?: number;
    };
    comparison: 'AVERAGE' | 'GOOD' | 'EXCELLENT' | 'POOR';
    contribution?: number; // Marginal Win Probability Contribution
    sampleSize?: number; // N for confidence
}

// Weights per Role
const ROLE_WEIGHTS: Record<string, Record<string, number>> = {
    TOP: { damage: 0.20, gold: 0.15, cs: 0.15, kda: 0.15, vision: 0.10, objective: 0.10, utility: 0.15 },
    JUNGLE: { objective: 0.20, kda: 0.15, vision: 0.20, damage: 0.15, gold: 0.10, cs: 0.05, utility: 0.15 },
    MID: { damage: 0.25, gold: 0.20, kda: 0.20, cs: 0.15, vision: 0.10, objective: 0.05, utility: 0.05 },
    ADC: { damage: 0.30, gold: 0.25, cs: 0.20, kda: 0.15, objective: 0.05, vision: 0.05, utility: 0.00 },
    SUPPORT: { vision: 0.25, kda: 0.15, objective: 0.15, utility: 0.30, damage: 0.10, gold: 0.05, cs: 0.00 },
};

// Fallback if role is unknown
const DEFAULT_WEIGHTS = { damage: 0.20, gold: 0.20, kda: 0.20, cs: 0.20, vision: 0.10, objective: 0.10, utility: 0.00 };

// Class Modifiers (Multipliers to Role Weights)
const CLASS_MODIFIERS: Record<string, Record<string, number>> = {
    Mage: { damage: 1.2, utility: 0.8, vision: 1.0 },
    Assassin: { damage: 1.3, kda: 1.2, utility: 0.5, vision: 0.8 },
    Tank: { damage: 0.7, utility: 1.5, kda: 1.0, vision: 1.0 },
    Fighter: { damage: 1.1, utility: 0.9, kda: 1.0 },
    Marksman: { damage: 1.3, gold: 1.2, utility: 0.5 },
    Support: { utility: 1.3, vision: 1.2, damage: 0.7 }
};

export interface ScoreCalculationParams {
    participant: Participant;
    duration: number;
    championStats?: any;
    matchupStats?: any;
    teamStats?: { damage: number; gold: number; kills: number };
    laneStats?: { csd15: number; gd15: number; xpd15: number };
    averageRank?: string;
    matchupWinRate?: number;
    championClass?: string;
    weightedDeaths?: number;
}

export class ScoringService {

    /**
     * Calculates the Legend Score (0-10) for a participant.
     * @param params The calculation parameters
     */
    static calculateScore(params: ScoreCalculationParams): ScoreResult {
        const {
            participant: p,
            duration,
            championStats,
            matchupStats,
            teamStats,
            laneStats,
            matchupWinRate,
            championClass,
            weightedDeaths
        } = params;

        const role = p.teamPosition || 'MID';
        const stats = this.calculatePlayerStats(p, duration, teamStats || { damage: 1, gold: 1, kills: 1 }, weightedDeaths);
        
        // Weights
        let weights = { ...(ROLE_WEIGHTS[role] || DEFAULT_WEIGHTS) };
        this.applyClassModifiers(weights, championClass);

        // Z-Scores
        const zScores = this.calculateZScores(stats, championStats, matchupStats, role, laneStats);

        // Weighted Sum
        let rawScore = 0;
        let totalWeight = 0;

        Object.keys(weights).forEach(key => {
            const z = Math.max(-3, Math.min(3, zScores[key] || 0));
            rawScore += z * weights[key];
            totalWeight += weights[key];
        });

        if (laneStats) {
            const laneWeight = 0.15;
            const z = Math.max(-3, Math.min(3, zScores.lane || 0));
            rawScore += z * laneWeight;
            totalWeight += laneWeight;
        }

        if (totalWeight > 0) rawScore /= totalWeight;

        // Transform to 0-100 Scale
        let finalScore = this.transformToScore(rawScore);

        // Bonus for Winning
        if (p.win) finalScore += 10;

        // Matchup Difficulty Adjustment
        if (matchupWinRate !== undefined) {
            const difficultyMult = Math.max(0.8, Math.min(1.2, 0.5 / Math.max(0.3, matchupWinRate)));
            finalScore *= difficultyMult;
        }

        // Clamp
        finalScore = Math.max(0, Math.min(100, finalScore));

        // ML Contribution
        const contribution = MLService.calculateMarginalContribution(
            { ...stats, csd15: 0, gd15: 0 },
            {
                goldShare: this.getBaselineMean('gold', 'totalGold', 'totalGoldShare', championStats, matchupStats),
                damageShare: this.getBaselineMean('damage', 'totalDamage', 'totalDamageShare', championStats, matchupStats),
                visionPerMin: this.getBaselineMean('vision', 'totalVision', undefined, championStats, matchupStats),
                kda: this.getBaselineMean('kda', 'totalKills', undefined, championStats, matchupStats)
            }
        );

        if (contribution > 0.10) finalScore += 5.0;

        // Clamp again
        finalScore = Math.max(0, Math.min(100, finalScore));

        return {
            score: Math.round(finalScore),
            grade: this.getGrade(finalScore),
            breakdown: {
                kda: Number(zScores.kda.toFixed(2)),
                damage: Number(zScores.damage.toFixed(2)),
                gold: Number(zScores.gold.toFixed(2)),
                vision: Number(zScores.vision.toFixed(2)),
                cs: Number(zScores.cs.toFixed(2)),
                objective: Number(zScores.objective.toFixed(2)),
                utility: Number(zScores.utility.toFixed(2)),
                lane: laneStats ? Number(zScores.lane.toFixed(2)) : undefined
            },
            comparison: getScoreLabel(finalScore),
            contribution: Number(contribution.toFixed(3)),
            sampleSize: matchupStats?.matches || 0
        };
    }

    private static calculatePlayerStats(p: Participant, duration: number, teamStats: { damage: number; gold: number; kills: number }, weightedDeaths?: number) {
        const effectiveDeaths = weightedDeaths !== undefined ? weightedDeaths : p.deaths;
        return {
            kda: (p.kills + p.assists) / Math.max(1, effectiveDeaths),
            damageShare: (p.totalDamageDealtToChampions || 0) / Math.max(1, teamStats.damage),
            damagePerMin: (p.totalDamageDealtToChampions || 0) / duration,
            goldShare: (p.goldEarned || 0) / Math.max(1, teamStats.gold),
            goldPerMin: (p.goldEarned || 0) / duration,
            cs: ((p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0)) / duration,
            vision: p.visionScore / duration,
            objective: (p.challenges?.dragonTakedowns || 0) +
                (p.challenges?.baronTakedowns || 0) +
                (p.challenges?.turretTakedowns || 0) +
                (p.challenges?.inhibitorTakedowns || 0),
            utility: ((p.timeCCingOthers || 0) / duration) +
                (((p.totalHealsOnTeammates || 0) + (p.totalDamageShieldedOnTeammates || 0)) / 1000)
        };
    }

    private static applyClassModifiers(weights: Record<string, number>, championClass?: string) {
        if (championClass && CLASS_MODIFIERS[championClass]) {
            const mods = CLASS_MODIFIERS[championClass];
            Object.keys(mods).forEach(key => {
                if (weights[key]) weights[key] *= mods[key];
            });
        }
    }

    private static calculateZScores(stats: any, championStats: any, matchupStats: any, role: string, laneStats?: any) {
        const zScores: Record<string, number> = {};
        
        // Helper: Variance-Based Normalization
        const getStdDev = (mean: number, key: string) => Math.max(mean * 0.4, 0.1);

        // KDA
        const baselineKda = this.getBaselineMean('kda', 'totalKills', undefined, championStats, matchupStats);
        zScores.kda = (stats.kda - baselineKda) / getStdDev(baselineKda, 'kda');

        // Damage
        const baselineDmgShare = this.getBaselineMean('damage', 'totalDamage', 'totalDamageShare', championStats, matchupStats);
        const zDmgShare = (stats.damageShare - baselineDmgShare) / getStdDev(baselineDmgShare, 'damageShare');
        const baselineDmgPerMin = (championStats?.totalDamage && championStats?.totalDuration)
            ? championStats.totalDamage / (championStats.totalDuration / 60)
            : 600;
        const zDmgPerMin = (stats.damagePerMin - baselineDmgPerMin) / getStdDev(baselineDmgPerMin, 'damagePerMin');
        zScores.damage = Math.max(zDmgShare, zDmgPerMin);

        // Gold
        const baselineGoldShare = this.getBaselineMean('gold', 'totalGold', 'totalGoldShare', championStats, matchupStats);
        const zGoldShare = (stats.goldShare - baselineGoldShare) / getStdDev(baselineGoldShare, 'goldShare');
        const baselineGoldPerMin = (championStats?.totalGold && championStats?.totalDuration)
            ? championStats.totalGold / (championStats.totalDuration / 60)
            : 400;
        const zGoldPerMin = (stats.goldPerMin - baselineGoldPerMin) / getStdDev(baselineGoldPerMin, 'goldPerMin');
        zScores.gold = Math.max(zGoldShare, zGoldPerMin);

        // CS, Vision, Objective
        const baselineCs = this.getBaselineMean('cs', 'totalCs', undefined, championStats, matchupStats);
        zScores.cs = (stats.cs - baselineCs) / getStdDev(baselineCs, 'cs');

        const baselineVision = this.getBaselineMean('vision', 'totalVision', undefined, championStats, matchupStats);
        zScores.vision = (stats.vision - baselineVision) / getStdDev(baselineVision, 'vision');

        const baselineObj = this.getBaselineMean('objective', 'totalObjectiveParticipation', undefined, championStats, matchupStats) || 2;
        zScores.objective = (stats.objective - baselineObj) / getStdDev(baselineObj, 'objective');

        // Utility
        let baselineUtil = 2;
        if (role === 'SUPPORT' || role === 'JUNGLE') baselineUtil = 10;
        else if (role === 'TOP' || role === 'MID') baselineUtil = 5;
        zScores.utility = (stats.utility - baselineUtil) / (baselineUtil * 0.5);

        // Lane
        if (laneStats) {
            zScores.lane = (laneStats.csd15 / 20 + laneStats.gd15 / 1000 + laneStats.xpd15 / 1000) / 3;
        } else {
            zScores.lane = 0;
        }

        return zScores;
    }

    private static getBaselineMean(key: string, totalKey: string, shareKey?: string, championStats?: any, matchupStats?: any) {
        const defaults = { kda: 3, damage: 600, gold: 400, cs: 6, vision: 1, objective: 0 };
        let globalMean = defaults[key as keyof typeof defaults];

        if (championStats && championStats.matches > 0) {
             globalMean = this.extractMeanFromStats(championStats, key, totalKey, shareKey) ?? globalMean;
        }

        let sampleMean = globalMean;
        let n = 0;
        if (matchupStats && matchupStats.matches > 0) {
            n = matchupStats.matches;
            sampleMean = this.extractMeanFromStats(matchupStats, key, totalKey, shareKey) ?? globalMean;
        }

        // Shrinkage
        if (n === 0) return globalMean;
        const alpha = n / (n + 10);
        return alpha * sampleMean + (1 - alpha) * globalMean;
    }

    private static extractMeanFromStats(stats: any, key: string, totalKey: string, shareKey?: string): number | null {
        if (shareKey && stats[shareKey] !== undefined) {
            return stats[shareKey] / stats.matches;
        }
        if (stats[totalKey] !== undefined) {
             if (key === 'cs' || key === 'vision') {
                const totalMin = (stats.totalDuration || 1) / 60;
                return stats[totalKey] / totalMin;
            }
            if (key === 'kda') {
                const k = stats.totalKills / stats.matches;
                const d = stats.totalDeaths / stats.matches;
                const a = stats.totalAssists / stats.matches;
                return (k + a) / Math.max(1, d);
            }
        }
        return null;
    }

    private static transformToScore(rawScore: number): number {
        // Logistic Approximation
        const percentile = 1 / (1 + Math.exp(-1.7 * rawScore));
        return percentile * 100;
    }

    private static getGrade(score: number): string {
        if (score >= 95) return 'S+';
        if (score >= 85) return 'S';
        if (score >= 75) return 'A';
        if (score >= 60) return 'B';
        if (score >= 40) return 'C';
        return 'D';
    }
}

function getScoreLabel(score: number): 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' {
    if (score >= 75) return 'EXCELLENT';
    if (score >= 60) return 'GOOD';
    if (score >= 40) return 'AVERAGE';
    return 'POOR';
}
