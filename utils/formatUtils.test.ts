import { describe, it, expect } from 'vitest';
import { getRankColor, formatRank, getGradeColor, getKdaColorClass, getTimeAgo } from './formatUtils';

describe('formatUtils', () => {

  describe('getRankColor', () => {
    it('should return correct color for Iron', () => {
      expect(getRankColor('IRON')).toBe('#a19d94');
    });
    
    it('should return default color for unknown tier or empty', () => {
      expect(getRankColor('UNKNOWN')).toBe('#ffd700');
      expect(getRankColor(null)).toBe('#ffd700');
    });
  });

  describe('formatRank', () => {
    it('should handle unranked properly', () => {
      expect(formatRank('UNRANKED', 'I')).toBe('UNRANKED');
      expect(formatRank(null, null)).toBe('UNRANKED');
    });

    it('should format Master+ without rank number', () => {
      expect(formatRank('MASTER', 'I')).toBe('MASTER');
      expect(formatRank('CHALLENGER', 'I')).toBe('CHALLENGER');
    });

    it('should format normal tiers with rank number', () => {
      expect(formatRank('GOLD', 'IV')).toBe('GOLD IV');
    });
  });

  describe('getGradeColor', () => {
    it('should return yellow for S tiers', () => {
      expect(getGradeColor('S+')).toBe('text-yellow-400');
      expect(getGradeColor('S')).toBe('text-yellow-400');
    });

    it('should return emerald for A tier', () => {
      expect(getGradeColor('A')).toBe('text-emerald-400');
    });

    it('should return gray for no grade', () => {
      expect(getGradeColor(undefined)).toBe('text-gray-400');
    });
  });

  describe('getKdaColorClass', () => {
    it('should assign orange and animate burn for KDA >= 5', () => {
      expect(getKdaColorClass(6)).toContain('text-orange-500 animate-burn');
    });

    it('should assign gray for KDA < 3', () => {
      expect(getKdaColorClass(2)).toBe('text-gray-400');
    });
  });

  describe('getTimeAgo', () => {
    it('should format times correctly (mocking time is tricky, testing format structure)', () => {
      // 2 days ago
      const gameCreation = Date.now() - (2 * 24 * 60 * 60 * 1000);
      expect(getTimeAgo(gameCreation)).toBe('2d ago');
    });

    it('should handle undefined dates gracefully', () => {
      expect(getTimeAgo(undefined)).toBe('');
    });
  });
});
