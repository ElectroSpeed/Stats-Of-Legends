import { describe, it, expect } from 'vitest';
import { getAverageRank } from './rankUtils';

describe('getAverageRank', () => {
  it('should return Unranked for empty array', () => {
    expect(getAverageRank([])).toBe('Unranked');
  });

  it('should return Unranked if no valid ranks are given', () => {
    expect(getAverageRank([null, undefined, ''])).toBe('Unranked');
  });

  it('should calculate the correct average for same rank', () => {
    expect(getAverageRank(['SILVER II', 'SILVER II'])).toBe('Silver II');
  });

  it('should calculate the average properly between different ranks', () => {
    // Silver II (tier 2 * 4 + 2 = 10) + Gold IV (tier 3 * 4 + 0 = 12) => Avg 11 (Silver I)
    expect(getAverageRank(['SILVER II', 'GOLD IV'])).toBe('Silver I');
  });

  it('should handle Master+ ranks correctly', () => {
    expect(getAverageRank(['MASTER', 'CHALLENGER'])).toBe('Grandmaster'); // Example average between Master(28) and Challenger(36) => 32 (Grandmaster)
  });
});
