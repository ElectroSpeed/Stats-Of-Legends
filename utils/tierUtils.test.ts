import { describe, it, expect } from 'vitest';
import { getTargetTiers } from './tierUtils';

describe('tierUtils', () => {

  describe('getTargetTiers', () => {
    it('should return all tiers for ALL', () => {
      const tiers = getTargetTiers('ALL');
      expect(tiers.includes('IRON')).toBe(true);
      expect(tiers.includes('CHALLENGER')).toBe(true);
      expect(tiers.length).toBe(10);
    });

    it('should return correct slice for GOLD_PLUS', () => {
      const tiers = getTargetTiers('GOLD_PLUS');
      // Should include Gold, Plat, Emerald, Diamond, Master, Grandmaster, Challenger
      expect(tiers.includes('GOLD')).toBe(true);
      expect(tiers.includes('CHALLENGER')).toBe(true);
      expect(tiers.includes('SILVER')).toBe(false);
      expect(tiers.includes('IRON')).toBe(false);
    });

    it('should return correct slice for GOLD_MINUS', () => {
      const tiers = getTargetTiers('GOLD_MINUS');
      // Should include Gold, Silver, Bronze, Iron
      expect(tiers.includes('GOLD')).toBe(true);
      expect(tiers.includes('IRON')).toBe(true);
      expect(tiers.includes('PLATINUM')).toBe(false);
    });

    it('should return only the specific rank if it is exact', () => {
      const tiers = getTargetTiers('DIAMOND');
      expect(tiers).toEqual(['DIAMOND']);
    });
  });

});
