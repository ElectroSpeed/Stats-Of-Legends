import { describe, it, expect } from 'vitest';
import { formatTier, getSpellName } from './championUtils';

describe('championUtils', () => {

  describe('formatTier', () => {
    it('should format ALL to All Ranks', () => {
      expect(formatTier('ALL')).toBe('All Ranks');
    });

    it('should append + for _PLUS tiers', () => {
      expect(formatTier('GOLD_PLUS')).toBe('GOLD +');
      expect(formatTier('DIAMOND_PLUS')).toBe('DIAMOND +');
    });

    it('should return exact string if not matching _PLUS or ALL', () => {
      expect(formatTier('CHALLENGER')).toBe('CHALLENGER');
      expect(formatTier('MASTER')).toBe('MASTER');
    });
  });

  describe('getSpellName', () => {
    it('should return valid spell names for valid ids', () => {
      expect(getSpellName('4')).toBe('SummonerFlash');
      expect(getSpellName('14')).toBe('SummonerDot');
      expect(getSpellName('11')).toBe('SummonerSmite');
    });

    it('should return SummonerFlash as default for unknown id', () => {
      expect(getSpellName('999')).toBe('SummonerFlash');
      expect(getSpellName('invalid')).toBe('SummonerFlash');
    });
  });

});
