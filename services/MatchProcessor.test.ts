/*import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MatchProcessor } from './MatchProcessor';
import { prisma } from '@/lib/prisma';
import { RiotService } from './RiotService';

// Syntaxe spécifique à Vitest pour le mocking
vi.mock('@/lib/prisma', () => ({
    prisma: {
        scannedMatch: { findUnique: vi.fn(), create: vi.fn() },
        championStat: { upsert: vi.fn(), findUnique: vi.fn(), update: vi.fn() }
    }
}));
vi.mock('./RiotService');

describe('MatchProcessor - Orchestration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('doit interrompre le traitement si le matchId existe déjà (Idempotence)', async () => {
        // Simulation : Le match existe déjà en base
        (prisma.scannedMatch.findUnique as jest.Mock).mockResolvedValue({ id: 'EUW1_123' });

        const result = await MatchProcessor.processMatch('EUW1_123', 'euw1');

        expect(result).toEqual({ status: 'skipped', reason: 'Already scanned' });
        // On vérifie qu'aucun appel API n'est fait pour économiser le quota
        expect(RiotService.getMatchDetails).not.toHaveBeenCalled();
    });

    it('doit échouer proprement si Riot Service renvoie une erreur', async () => {
        (prisma.scannedMatch.findUnique as jest.Mock).mockResolvedValue(null);
        (RiotService.getMatchDetails as jest.Mock).mockRejectedValue(new Error('API Timeout'));

        await expect(MatchProcessor.processMatch('EUW1_ERROR', 'euw1'))
            .rejects.toThrow('API Timeout');
    });
});