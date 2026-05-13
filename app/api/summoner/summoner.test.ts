
import { describe, it, expect, vi } from 'vitest';
import { GET } from './route';
import { SummonerService } from '@/services/SummonerService';

vi.mock('@/services/SummonerService', () => ({
    SummonerService: {
        getOrUpdateSummoner: vi.fn()
    },
    QUEUE_SOLO: 'RANKED_SOLO_5x5',
    QUEUE_FLEX: 'RANKED_FLEX_SR'
}));

vi.mock('@/services/MatchHistoryService', () => ({
    MatchHistoryService: {
        getMatchesForDisplay: vi.fn().mockResolvedValue([])
    }
}));

vi.mock('@/services/AggregationService', () => ({
    AggregationService: {
        calculateAggregations: vi.fn().mockReturnValue({ champions: [], heatmap: [], teammates: [], lpHistory: [], performance: {} })
    }
}));

vi.mock('@/services/DataDragonService', () => ({
    DataDragonService: {
        getLatestPatch: vi.fn().mockResolvedValue('14.1.1')
    }
}));

describe('API Route: GET /api/summoner', () => {
    it('should return 400 if name is missing', async () => {
        const req = new Request('http://localhost/api/summoner?region=EUW');
        const res = await GET(req as any);
        expect(res.status).toBe(400);
    });

    it('should return 404 if summoner is not found', async () => {
        vi.mocked(SummonerService.getOrUpdateSummoner).mockResolvedValue(null);
        const req = new Request('http://localhost/api/summoner?name=Unknown&tag=000&region=EUW');
        const res = await GET(req as any);
        expect(res.status).toBe(404);
    });
});
