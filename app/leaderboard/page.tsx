'use client';

import React, { useRef, useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { FlexibleTable, Column } from "@/components/global/FlexibleTable";
import Image from "next/image";
import Link from "next/link";
import Hero from "@/components/global/Hero";
import { Loader2 } from "lucide-react";
import { RANK_EMBLEMS } from "@/constants";
import { getProfileIconUrl } from "@/utils/ddragon";
import { formatRank } from "@/utils/formatUtils";
import { LeaderboardEntry } from "@/types";
import { LeaderboardSearchBar } from "@/components/leaderboard/LeaderboardSearchBar";

// Interface des props (optionnels)
interface LeaderboardPageProps {
    region?: string;
    tier?: string;
    mePuuid?: string;
}

export default function LeaderboardPage(props: LeaderboardPageProps) {
    // Valeurs par défaut
    const region = props.region ?? "EUW1";
    const [tier, setTier] = useState(props.tier ?? "ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const mePuuid = props.mePuuid ?? "";

    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Fonction fetch leaderboard
    const fetchLeaderboard = async ({ pageParam = undefined, queryKey }: any) => {
        const [_key, fetchRegion, fetchTier] = queryKey as string[];
        const cursorParam = pageParam ? `&cursor=${pageParam}` : "";
        const tierParam = fetchTier !== "ALL" ? `&tier=${fetchTier}` : "";
        const res = await fetch(`/api/leaderboard?region=${fetchRegion}${tierParam}${cursorParam}&limit=50`);
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
    };

    // useInfiniteQuery
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useInfiniteQuery({
        queryKey: ["leaderboard", region, tier],
        queryFn: fetchLeaderboard,
        getNextPageParam: (lastPage: any) => lastPage.nextCursor,
        initialPageParam: undefined,
    });

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.5 }
        );
        if (loadMoreRef.current) observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Flatten pages et ajouter absoluteRank
    const allPlayers: LeaderboardEntry[] = data?.pages.flatMap((page: any) => page.players) || [];

    // Filtrage local basé sur la barre de recherche
    const enrichedData = allPlayers
        .filter((player) =>
            player.summonerName.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map((player, index) => ({
            ...player,
            absoluteRank: index + 1,
        }));

    // Colonnes FlexibleTable
    const columns: Column<any>[] = [
        {
            key: "absoluteRank",
            label: "Rank",
            sortable: true,
            defaultDirection: "asc",
            className: "text-center font-bold",
            render: (player) => {
                const rank = player.absoluteRank;
                const color = rank === 1 ? "#FFD700" : rank === 2 ? "#C0C0C0" : rank === 3 ? "#CD7F32" : "#9ca3af";
                return <span style={{ color, fontWeight: 600 }}>{rank}</span>;
            },
        },
        {
            key: "summoner",
            label: "Summoner",
            sortable: false,
            render: (player) => (
                <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10">
                        <Image
                            src={getProfileIconUrl(player.profileIconId)}
                            alt={player.summonerName}
                            fill
                            className="rounded-full object-cover border-2 border-opacity-0 group-hover:border-opacity-50 transition-all"
                            style={{ borderColor: "#C8AA6E" }}
                        />
                        {player.puuid === mePuuid && (
                            <div className="absolute -bottom-1 -right-1 bg-lol-gold text-black text-[8px] font-bold px-1 rounded-full">
                                ME
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <Link
                            href={`/summoner/${player.region}/${player.summonerName}-${player.tagLine}`}
                            className="font-bold text-sm hover:text-lol-gold transition"
                        >
                            {player.summonerName}
                        </Link>
                        <span className="text-xs text-gray-500">#{player.tagLine}</span>
                    </div>
                </div>
            ),
        },
        {
            key: "tier",
            label: "Tier",
            sortable: false,
            className: "text-center",
            render: (player) => (
                <div className="flex items-center justify-center gap-2">
                    <div className="w-8 h-8 relative">
                        {RANK_EMBLEMS[player.tier] && (
                            <Image src={RANK_EMBLEMS[player.tier]} alt={player.tier} fill className="object-contain" />
                        )}
                    </div>
                    <span className="text-xs font-bold text-gray-300">{formatRank(player.tier, player.rank)}</span>
                </div>
            ),
        },
        {
            key: "winrate",
            label: "Winrate",
            sortable: true,
            defaultDirection: "desc",
            className: "text-center",
            render: (player) => (
                <span className={player.winrate >= 50 ? "text-lol-win" : "text-lol-loss"}>
                    {Math.round(player.winrate)}%
                </span>
            ),
        },
        {
            key: "legendScore",
            label: "Legend Score",
            sortable: true,
            defaultDirection: "desc",
            className: "text-center",
            render: (player) => (
                <span className="text-xs font-bold text-lol-gold text-center">
                    {player.legendScore > 0 ? player.legendScore.toFixed(1) : "-"}
                </span>
            ),
        },
    ];

    const TIERS = ["ALL", "CHALLENGER", "GRANDMASTER", "MASTER", "DIAMOND", "PLATINUM"];

    // Loading/Error Views
    if (status === "pending") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-lol-gold" />
            </div>
        );
    }
    if (status === "error") {
        return (
            <div className="min-h-screen flex items-center justify-center text-red-500">
                Error loading leaderboard.
            </div>
        );
    }

    return (
        <div className="pb-20">
            {/* Hero */}
            <Hero
                badgeText={`${region} RANKINGS`}
                title="Leaderboard"
                description={`The best players in ${region}. Rise to the top and become a Legend.`}
            />

            {/* Nouveau composant de recherche unifié */}
            <LeaderboardSearchBar
                tier={tier}
                setTier={setTier}
                tiers={TIERS}
                search={searchQuery}
                setSearch={setSearchQuery}
                placeholder="Search summoner in results..."
            />

            <div className="max-w-7xl mx-auto px-4 space-y-6">
                {/* Table */}
                <div className="bg-[#121212] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl relative min-h-[400px]">
                    <FlexibleTable
                        columns={columns}
                        data={enrichedData}
                        defaultSort={{ key: "absoluteRank", direction: "asc" }}
                    />
                </div>

                {/* Infinite scroll trigger */}
                <div ref={loadMoreRef} className="flex justify-center py-6">
                    {isFetchingNextPage ? (
                        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                    ) : hasNextPage ? (
                        <span className="text-xs text-gray-500">Scroll for more...</span>
                    ) : (
                        <span className="text-xs text-gray-500">End of Leaderboard</span>
                    )}
                </div>
            </div>
        </div>
    );
}