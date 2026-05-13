import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { MatchProcessor } from './MatchProcessor';
import { prisma } from '@/lib/prisma';
import { RiotService } from './RiotService';

vi.mock('@/lib/prisma', () => ({
    prisma: {
        scannedMatch: { findUnique: vi.fn(), create: vi.fn() },
        championStat: { upsert: vi.fn(), findUnique: vi.fn(), update: vi.fn(), create: vi.fn() },
        matchupStat: { upsert: vi.fn() },
        duoStat: { upsert: vi.fn() }
    }
}));

vi.mock('./RiotService', () => ({
    RiotService: {
        getMatchDetails: vi.fn(),
        getMatchTimeline: vi.fn(),
        getChampionIdMap: vi.fn(),
        getItemMap: vi.fn()
    }
}));

describe('MatchProcessor - Orchestration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('doit interrompre le traitement si le matchId existe déjà (Idempotence)', async () => {
        // Simulation : Le match existe déjà en base
        (prisma.scannedMatch.findUnique as Mock).mockResolvedValue({ id: 'EUW1_123' });

        const result = await MatchProcessor.processMatch('EUW1_123', 'euw1');

        expect(result).toEqual({ status: 'skipped', reason: 'Already scanned' });
        // On vérifie qu'aucun appel API n'est fait pour économiser le quota
        expect(RiotService.getMatchDetails).not.toHaveBeenCalled();
    });

    it('doit échouer proprement si Riot Service renvoie une erreur', async () => {
        (prisma.scannedMatch.findUnique as Mock).mockResolvedValue(null);
        (RiotService.getMatchDetails as Mock).mockRejectedValue(new Error('API Timeout'));

        await expect(MatchProcessor.processMatch('EUW1_ERROR', 'euw1'))
            .rejects.toThrow('API Timeout');
    });
});