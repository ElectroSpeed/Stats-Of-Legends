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

    const addStat = (stat: keyof Stats, value: number | undefined) => {
        if (value) itemStats[stat] = (itemStats[stat] || 0) + value;
    };

    items.forEach(item => {
        if (!item?.stats) return;

        addStat('ad', item.stats.ad);
        addStat('ap', item.stats.ap);
        addStat('hp', item.stats.hp);
        addStat('mp', item.stats.mp);
        addStat('mpRegen', item.stats.mpRegen);
        addStat('armor', item.stats.armor);
        addStat('mr', item.stats.mr);
        addStat('haste', item.stats.haste);
        addStat('crit', item.stats.crit);
        addStat('moveSpeed', item.stats.moveSpeed);
        addStat('magicPen', item.stats.magicPen);
        addStat('lethality', item.stats.lethality);
        
        if (item.stats.attackSpeed) itemBonusAs += item.stats.attackSpeed;
    });

    return { itemStats, itemBonusAs };
}
