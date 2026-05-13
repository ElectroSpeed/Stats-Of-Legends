import { describe, it, expect } from 'vitest';
import { ScoringService } from './ScoringService';

describe('ScoringService - Calcul du Legend Score', () => {
    const baseParams = {
        participant: {
            kills: 6, assists: 8, deaths: 4,
            totalDamageDealtToChampions: 18000, goldEarned: 10000,
            visionScore: 20, teamId: 100, win: true, championName: 'Ezreal',
            teamPosition: 'ADC', totalMinionsKilled: 180, neutralMinionsKilled: 12,
            timeCCingOthers: 20
        },
        duration: 1800,
        teamStats: { damage: 80000, gold: 50000, kills: 28 }
    } as any;

    it('retourne un résultat cohérent (bornes et labels)', () => {
        const result = ScoringService.calculateScore(baseParams);

        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
        expect(['S+', 'S', 'A', 'B', 'C', 'D']).toContain(result.grade);
        expect(['EXCELLENT', 'GOOD', 'AVERAGE', 'POOR']).toContain(result.comparison);
    });

    it('donne un score plus élevé pour de meilleures stats', () => {
        const strong = {
            ...baseParams,
            participant: { ...baseParams.participant, kills: 12, assists: 12, deaths: 2, goldEarned: 14000, totalDamageDealtToChampions: 30000, win: true }
        } as any;
        const weak = {
            ...baseParams,
            participant: { ...baseParams.participant, kills: 2, assists: 3, deaths: 8, goldEarned: 7000, totalDamageDealtToChampions: 9000, win: false }
        } as any;

        const strongResult = ScoringService.calculateScore(strong);
        const weakResult = ScoringService.calculateScore(weak);

        expect(strongResult.score).toBeGreaterThan(weakResult.score);
    });

    it('pénalise les morts en excès', () => {
        const badParams = { ...baseParams, participant: { ...baseParams.participant, deaths: 15, win: false } } as any;
        const goodParams = { ...baseParams, participant: { ...baseParams.participant, deaths: 2, win: true } } as any;

        const badResult = ScoringService.calculateScore(badParams);
        const goodResult = ScoringService.calculateScore(goodParams);

        expect(badResult.score).toBeLessThan(goodResult.score);
    });

    it('applique un bonus de victoire', () => {
        const winParams = { ...baseParams, participant: { ...baseParams.participant, win: true } } as any;
        const loseParams = { ...baseParams, participant: { ...baseParams.participant, win: false } } as any;

        const winResult = ScoringService.calculateScore(winParams);
        const loseResult = ScoringService.calculateScore(loseParams);

        expect(winResult.score).toBeGreaterThan(loseResult.score);
    });
});