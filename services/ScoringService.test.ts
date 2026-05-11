import { describe, it, expect } from 'vitest';
import { ScoringService } from './ScoringService';

describe('ScoringService - Calcul du Legend Score', () => {
    const mockParams = {
        participant: {
            kills: 10, assists: 5, deaths: 2,
            totalDamageDealtToChampions: 25000, goldEarned: 12000,
            visionScore: 30, teamId: 100, win: true, championName: 'Ezreal',
            teamPosition: 'ADC'
        },
        duration: 1800,
        teamStats: { damage: 100000, gold: 50000, kills: 30 }
    } as any;

    it('doit attribuer une note "S" ou "S+" pour une excellente performance', () => {
        const result = ScoringService.calculateScore(mockParams);

        expect(result.score).toBeGreaterThanOrEqual(85);
        expect(['S', 'S+']).toContain(result.grade);
        expect(result.comparison).toBe('EXCELLENT');
    });

    it('doit pénaliser lourdement un score si le joueur a trop de morts', () => {
        const badParams = { ...mockParams, participant: { ...mockParams.participant, deaths: 15, win: false } };
        const result = ScoringService.calculateScore(badParams);

        expect(result.score).toBeLessThan(40);
        expect(result.grade).toBe('D');
    });
});