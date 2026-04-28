import { describe, it, expect } from 'vitest';
import { assignRoles } from './liveGameUtils';

describe('liveGameUtils', () => {

  describe('assignRoles', () => {
    it('should assign smite to jungle correctly', () => {
      const participants = [
        { summonerName: 'P1', spell1Id: 4, spell2Id: 11, inferredRole: 'MID' }, // Has smite, should be JUNGLE despite 'MID' inference
        { summonerName: 'P2', spell1Id: 4, spell2Id: 14, inferredRole: 'MID' }, // Actual MID
        { summonerName: 'P3', spell1Id: 4, spell2Id: 12, inferredRole: 'TOP' },
        { summonerName: 'P4', spell1Id: 4, spell2Id: 7, inferredRole: 'ADC' },
        { summonerName: 'P5', spell1Id: 4, spell2Id: 3, inferredRole: 'SUPPORT' },
      ];

      const roles = assignRoles(participants);
      
      expect(roles.JUNGLE.summonerName).toBe('P1');
      expect(roles.MID.summonerName).toBe('P2');
      expect(roles.TOP.summonerName).toBe('P3');
      expect(roles.ADC.summonerName).toBe('P4');
      expect(roles.SUPPORT.summonerName).toBe('P5');
    });

    it('should handle all 5 players getting assigned a role', () => {
        const participants = [
            { summonerName: 'P1', inferredRole: 'TOP' },
            { summonerName: 'P2', inferredRole: 'JUNGLE', spell1Id: 11 },
            { summonerName: 'P3', inferredRole: 'MID' },
            { summonerName: 'P4', inferredRole: 'ADC' },
            { summonerName: 'P5', inferredRole: 'SUPPORT' },
        ];
        const roles = assignRoles(participants);

        expect(Object.values(roles).every(v => v !== null)).toBe(true);
        expect(roles.TOP.summonerName).toBe('P1');
    });
  });

});
