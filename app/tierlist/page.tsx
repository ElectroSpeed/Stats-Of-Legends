'use client';

import { Suspense } from "react";
import Hero from "@/components/global/Hero";
import { TierListSearchBar } from "@/components/tierlist/TierListSearchBar";
import { useTierListData } from "@/hooks/useTierListData";
import { FlexibleTable, Column } from "@/components/global/FlexibleTable";
import { TierBadge } from "@/components/tierlist/TierBadge";
import Image from "next/image";
import Link from "next/link";

import { REGIONS, ROLES, RANKS, formatRank } from "@/constants/search";
import { ChampionTier } from "@/types";
import { getChampionIconUrl } from "@/utils/ddragon";

function TierListContent() {

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
            label: 'Rank',
            sortable: true,
            className: "text-center"
        },

        {
            key: 'name',
            label: 'Champion',
            sortable: true,
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
                        className="rounded-full"
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
            label: 'Role',
            className: "text-center"
        },

        {
            key: 'tier',
            label: 'Tier',
            render: (champion) => (
                <TierBadge tier={champion.tier} size="sm" />
            ),
            className: 'text-center'
        },

        {
            key: 'winRate',
            label: 'Win Rate',
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
            label: 'Pick Rate',
            sortable: true,
            defaultDirection: 'desc',
            className: 'text-center'
        },

        {
            key: 'banRate',
            label: 'Ban Rate',
            sortable: true,
            defaultDirection: 'desc',
            className: 'text-center'
        },

        {
            key: 'counters',
            label: 'Counter Picks',
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
            label: 'Matches',
            sortable: true,
            defaultDirection: 'desc',
            className: 'text-center'
        },

        {
            key: 'trend',
            label: 'Trend',
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
                badgeText="PATCH META"
                title="Meta Tier List"
                description="The best champions in the current patch, analyzed by win rate, pick rate, and ban rate."
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
            />

            <div className="bg-[#121212] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl relative min-h-[400px]">

                {loading ? (

                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">

                        <div className="w-12 h-12 border-4 border-lol-gold border-t-transparent rounded-full animate-spin" />

                    </div>

                ) : (

                    <FlexibleTable<ChampionTier>
                        columns={columns}
                        data={sortedData}
                        defaultSort={{ key: 'rank', direction: 'asc' }}
                    />

                )}

            </div>
        </div>
    );
}

export default function TierListPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading...</div>}>
            <TierListContent />
        </Suspense>
    );
}