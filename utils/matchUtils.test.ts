import { describe, it, expect } from 'vitest';
import { getDurationBucket, normalizeWardType, isWardItem } from './matchUtils';

describe('matchUtils', () => {

  describe('getDurationBucket', () => {
    it('should return 0-20 for games under 20 mins (1200s)', () => {
      expect(getDurationBucket(1199)).toBe('0-20');
      expect(getDurationBucket(600)).toBe('0-20');
    });

    it('should return 20-30 for games between 20 and 30 mins', () => {
      expect(getDurationBucket(1200)).toBe('20-30');
      expect(getDurationBucket(1799)).toBe('20-30');
    });

    it('should return 30+ for games above 30 mins', () => {
      expect(getDurationBucket(1800)).toBe('30+');
      expect(getDurationBucket(3600)).toBe('30+');
    });
  });

  describe('normalizeWardType', () => {
    it('should handle missing items', () => {
      expect(normalizeWardType(null)).toBeNull();
      expect(normalizeWardType(undefined)).toBeNull();
    });

    it('should detect Control Wards', () => {
      expect(normalizeWardType({ name: 'Control Ward' })).toBe('Control');
    });

    it('should detect Oracle Lens', () => {
      expect(normalizeWardType({ name: 'Oracle Lens' })).toBe('Oracle');
    });

    it('should detect Farsight', () => {
      expect(normalizeWardType({ name: 'Farsight Alteration' })).toBe('Farsight');
    });

    it('should return null for non-wards', () => {
      expect(normalizeWardType({ name: 'Long Sword' })).toBeNull();
    });
  });

});
