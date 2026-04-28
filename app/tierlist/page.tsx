'use client';

import { Suspense } from "react";
import Hero from "@/components/global/Hero";
import { TierListSearchBar } from "@/components/tierlist/TierListSearchBar";
import { useTierListData } from "@/hooks/useTierListData";
import { FlexibleTable, Column } from "@/components/global/FlexibleTable";
import { TierBadge } from "@/components/tierlist/TierBadge";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import Image from "next/image";
import Link from "next/link";

import { REGIONS, ROLES, RANKS, formatRank } from "@/constants/search";
import { ChampionTier } from "@/types";
import { getChampionIconUrl } from "@/utils/ddragon";
import { TRANSLATIONS } from "@/constants";
import { useLanguage } from "@/app/LanguageContext";

function TierListContent() {
    const { lang: language } = useLanguage();
    const t = TRANSLATIONS[language as keyof typeof TRANSLATIONS] || TRANSLATIONS.FR;

    const {
        selectedRole,
        setSelectedRole,
        selectedRank,
        setSelectedRank,
        searchQuery,
        setSearchQuery,
        sortedData,
        loading
    } = useTierListData();

    const columns: Column<ChampionTier>[] = [
        {
            key: 'rank',
            label: t.rankColumn || 'Rank',
            sortable: true,
            defaultDirection: 'asc',
            className: "text-center"
        },
        {
            key: 'name',
            label: t.championColumn || 'Champion',
            sortable: false,
            render: (champion) => (
                <Link
                    href={`/champions/${encodeURIComponent(champion.name)}?role=${encodeURIComponent(selectedRole)}&rank=${encodeURIComponent(selectedRank)}`}
                    className="flex items-center justify-center gap-2 hover:opacity-80 transition"
                >
                    <Image
                        src={getChampionIconUrl(champion.id)}
                        width={32}
                        height={32}
                        alt={champion.name}
                        className="rounded-full object-cover border-2 border-opacity-0 group-hover:border-opacity-50 transition-all"
                        style={{ borderColor: "#C8AA6E" }}
                    />

                    <span
                        className={`font-bold transition hover:text-lol-gold`}
                    >
                {champion.name}
            </span>
                </Link>
            )
        },

        {
            key: 'role',
            label: t.roleColumn || 'Role',
            sortable: true,
            className: 'text-center'
        },
        {
            key: 'tier',
            label: t.tierColumn || 'Tier',
            sortable: true,
            render: (champion) => (
                <TierBadge tier={champion.tier} size="sm" />
            ),
            className: 'text-center'
        },

        {
            key: 'winRate',
            label: t.winRate || 'Win Rate',
            sortable: true,
            defaultDirection: 'desc',
            render: (champion) => (
                <span className={champion.winRate >= 50 ? 'text-green-400' : 'text-red-400'}>
                    {champion.winRate}%
                </span>
            ),
            className: 'text-center'
        },

        {
            key: 'pickRate',
            label: t.pickRate || 'Pick Rate',
            sortable: true,
            defaultDirection: 'desc',
            className: 'text-center'
        },

        {
            key: 'banRate',
            label: t.banRate || 'Ban Rate',
            sortable: true,
            defaultDirection: 'desc',
            className: 'text-center'
        },

        {
            key: 'counters',
            label: t.counterPicksColumn || 'Counter Picks',
            render: (champion) => (
                <div className="flex justify-center gap-1">

                    {champion.counters?.map((counterName, i) => (
                        <Link
                            key={i}
                            href={`/champions/${encodeURIComponent(counterName)}?role=${encodeURIComponent(selectedRole)}&rank=${encodeURIComponent(selectedRank)}`}
                            title={counterName}
                            className="hover:scale-110 transition-transform"
                        >
                            <Image
                                src={getChampionIconUrl(counterName)}
                                alt={counterName}
                                width={24}
                                height={24}
                                className="rounded-full"
                            />
                        </Link>
                    ))}

                    {!champion.counters?.length && <span>-</span>}

                </div>
            )
        },

        {
            key: 'matches',
            label: t.matches || 'Matches',
            sortable: true,
            defaultDirection: 'desc',
            className: 'text-center'
        },

        {
            key: 'trend',
            label: t.trendColumn || 'Trend',
            render: (champion) => {

                switch (champion.trend) {

                    case 'up':
                        return <span className="text-green-400">⬆️</span>;

                    case 'down':
                        return <span className="text-red-400">⬇️</span>;

                    default:
                        return '-';
                }
            },
            className: 'text-center'
        }
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8" suppressHydrationWarning>

            <Hero
                badgeText={t.patchMeta || "PATCH META"}
                title={t.metaTierList || "Meta Tier List"}
                description={t.tierListDesc || "Les meilleurs champions du patch actuel. Analysé par win rate, pick rate et ban rate."}
            />

            <TierListSearchBar
                rank={selectedRank}
                setRank={setSelectedRank}
                role={selectedRole}
                setRole={setSelectedRole}
                search={searchQuery}
                setSearch={setSearchQuery}
                ranks={RANKS}
                roles={ROLES}
                formatRank={formatRank}
                t={t}
            />
            {loading ? (
                <TableSkeleton columns={10} rows={15} />
            ) : (
                <FlexibleTable<ChampionTier>
                    columns={columns}
                    data={sortedData}
                    defaultSort={{ key: 'rank', direction: 'asc' }}
                />
            )}
        </div>
    );
}

export default function TierListPage() {
    const { lang: language } = useLanguage();
    const t = TRANSLATIONS[language as keyof typeof TRANSLATIONS] || TRANSLATIONS.FR;
    return (
        <Suspense fallback={<Hero badgeText={t.patchMeta || "PATCH META"} title={t.metaTierList || "Meta Tier List"} description={t.loading || "Loading..."} />}>
            <TierListContent />
        </Suspense>
    );
}