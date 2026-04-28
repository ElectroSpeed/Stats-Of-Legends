import { describe, it, expect } from 'vitest';
import { getChampionIconUrl, getItemIconUrl, getProfileIconUrl, getSpellIconUrl } from './ddragon';
import { CURRENT_PATCH } from '../constants';

// We need to mock constants if they aren't available, but vitest handles imports.
describe('ddragon utils', () => {

  describe('normalizeChampionId & getChampionIconUrl', () => {
    it('should generate standard champion url', () => {
      expect(getChampionIconUrl('Aatrox')).toBe(`https://ddragon.leagueoflegends.com/cdn/${CURRENT_PATCH}/img/champion/Aatrox.png`);
    });

    it('should strip .png from input', () => {
      expect(getChampionIconUrl('Ahri.png')).toBe(`https://ddragon.leagueoflegends.com/cdn/${CURRENT_PATCH}/img/champion/Ahri.png`);
    });

    it('should normalize special champion names', () => {
      expect(getChampionIconUrl('Wukong')).toBe(`https://ddragon.leagueoflegends.com/cdn/${CURRENT_PATCH}/img/champion/MonkeyKing.png`);
      expect(getChampionIconUrl('Kog\'Maw')).toBe(`https://ddragon.leagueoflegends.com/cdn/${CURRENT_PATCH}/img/champion/KogMaw.png`);
      expect(getChampionIconUrl('Nunu & Willump')).toBe(`https://ddragon.leagueoflegends.com/cdn/${CURRENT_PATCH}/img/champion/Nunu.png`);
      expect(getChampionIconUrl('Rek\'Sai')).toBe(`https://ddragon.leagueoflegends.com/cdn/${CURRENT_PATCH}/img/champion/RekSai.png`);
    });
  });

  describe('getItemIconUrl', () => {
    it('should format numeric item correctly', () => {
      expect(getItemIconUrl(1001)).toBe(`https://ddragon.leagueoflegends.com/cdn/${CURRENT_PATCH}/img/item/1001.png`);
    });

    it('should handle string item IDs', () => {
      expect(getItemIconUrl('3020')).toBe(`https://ddragon.leagueoflegends.com/cdn/${CURRENT_PATCH}/img/item/3020.png`);
    });
  });

  describe('getProfileIconUrl & getSpellIconUrl', () => {
    it('should format profile icon', () => {
      expect(getProfileIconUrl(588)).toBe(`https://ddragon.leagueoflegends.com/cdn/${CURRENT_PATCH}/img/profileicon/588.png`);
    });

    it('should format spell icon', () => {
      expect(getSpellIconUrl('SummonerFlash')).toBe(`https://ddragon.leagueoflegends.com/cdn/${CURRENT_PATCH}/img/spell/SummonerFlash.png`);
    });
  });

});
