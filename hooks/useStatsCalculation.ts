import { useState, useEffect } from 'react';
import { Champion, Item, Stats } from '../types';

export function useStatsCalculation(
    currentChampion: Champion | null,
    championLevel: number,
    selectedItems: (Item | null)[]
) {
    const [stats, setStats] = useState<Stats | null>(null);

    useEffect(() => {
        if (!currentChampion) return;
        const growth = currentChampion.statsGrowth;
        const base = currentChampion.baseStats!;
        const lvlMod = championLevel - 1;

        let computedStats: Stats = {
            hp: base.hp + (growth?.hp || 0) * lvlMod,
            hpRegen: base.hpRegen + (growth?.hpRegen || 0) * lvlMod,
            mp: base.mp + (growth?.mp || 0) * lvlMod,
            mpRegen: base.mpRegen + (growth?.mpRegen || 0) * lvlMod,
            ad: base.ad + (growth?.ad || 0) * lvlMod,
            ap: base.ap,
            armor: base.armor + (growth?.armor || 0) * lvlMod,
            mr: base.mr + (growth?.mr || 0) * lvlMod,
            attackSpeed: base.attackSpeed,
            haste: base.haste,
            crit: base.crit,
            moveSpeed: base.moveSpeed,
            lethality: 0,
            magicPen: 0,
            percentPen: 0
        };

        const bonusAsFromLevel = (growth?.attackSpeed || 0) * lvlMod;

        const { itemStats, itemBonusAs } = aggregateItemStats(selectedItems);

        // Apply item stats
        computedStats.ad += itemStats.ad || 0;
        computedStats.ap += itemStats.ap || 0;
        computedStats.hp += itemStats.hp || 0;
        computedStats.mp += itemStats.mp || 0;
        computedStats.mpRegen += itemStats.mpRegen || 0;
        computedStats.armor += itemStats.armor || 0;
        computedStats.mr += itemStats.mr || 0;
        computedStats.haste += itemStats.haste || 0;
        computedStats.crit += itemStats.crit || 0;
        computedStats.moveSpeed += itemStats.moveSpeed || 0;
        
        if (itemStats.magicPen) computedStats.magicPen = (computedStats.magicPen || 0) + itemStats.magicPen;
        if (itemStats.lethality) computedStats.lethality = (computedStats.lethality || 0) + itemStats.lethality;

        const totalBonusAs = bonusAsFromLevel + itemBonusAs;
        computedStats.attackSpeed = computedStats.attackSpeed * (1 + (totalBonusAs / 100));

        setStats(computedStats);
    }, [selectedItems, currentChampion, championLevel]);

    return stats;
}

function aggregateItemStats(items: (Item | null)[]) {
    const itemStats: Partial<Stats> = {};
    let itemBonusAs = 0;

    items.forEach(item => {
        if (!item?.stats) return;

        if (item.stats.ad) itemStats.ad = (itemStats.ad || 0) + item.stats.ad;
        if (item.stats.ap) itemStats.ap = (itemStats.ap || 0) + item.stats.ap;
        if (item.stats.hp) itemStats.hp = (itemStats.hp || 0) + item.stats.hp;
        if (item.stats.mp) itemStats.mp = (itemStats.mp || 0) + item.stats.mp;
        if (item.stats.mpRegen) itemStats.mpRegen = (itemStats.mpRegen || 0) + item.stats.mpRegen;
        if (item.stats.armor) itemStats.armor = (itemStats.armor || 0) + item.stats.armor;
        if (item.stats.mr) itemStats.mr = (itemStats.mr || 0) + item.stats.mr;
        if (item.stats.haste) itemStats.haste = (itemStats.haste || 0) + item.stats.haste;
        if (item.stats.crit) itemStats.crit = (itemStats.crit || 0) + item.stats.crit;
        if (item.stats.moveSpeed) itemStats.moveSpeed = (itemStats.moveSpeed || 0) + item.stats.moveSpeed;
        if (item.stats.attackSpeed) itemBonusAs += item.stats.attackSpeed;
        if (item.stats.magicPen) itemStats.magicPen = (itemStats.magicPen || 0) + item.stats.magicPen;
        if (item.stats.lethality) itemStats.lethality = (itemStats.lethality || 0) + item.stats.lethality;
    });

    return { itemStats, itemBonusAs };
}
