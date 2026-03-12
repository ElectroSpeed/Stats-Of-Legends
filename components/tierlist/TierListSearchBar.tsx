"use client";

import { Search, ShieldHalf, BowArrow } from "lucide-react";
import { Selector } from "@/components/global/Selector";
import React from "react";

interface TierListSearchBarProps {
    rank: string;
    setRank: (v: string) => void;

    role: string;
    setRole: (v: string) => void;

    search: string;
    setSearch: (v: string) => void;
    
    ranks: readonly string[];
    roles: readonly { id: string; label: string }[];

    formatRank: (r: string) => string;
}

export const TierListSearchBar = ({rank, setRank, role, setRole, search, setSearch, ranks, roles, formatRank}: TierListSearchBarProps) => {
    return (
        <div className="relative z-50">
            <div className="relative mx-auto max-w-4xl">

                <div className="flex items-center rounded-full border border-lol-gold/40 bg-[#0b0b0b] px-4 py-3 backdrop-blur-xl shadow-[0_0_60px_rgba(0,0,0,0.6)]">
                    
                    {/* RANK */}
                    <Selector
                        selected={rank}
                        onChange={setRank}
                        options={ranks.map(r => ({label: formatRank(r), value: r}))}
                        buttonIcon={<ShieldHalf className={"w-4 h-4"} />}
                        size="medium"
                    />

                    <div className="mx-2" />

                    {/* ROLE */}
                    <Selector
                        selected={role}
                        onChange={setRole}
                        options={roles.map(r => ({label: r.label, value: r.id}))}
                        buttonIcon={<BowArrow className={"w-4 h-4"} />}
                        size="medium"
                    />

                    <div className="w-px bg-white/10 mx-6 h-8" />

                    {/* SEARCH */}
                    <Search className="w-5 h-5 text-gray-500 mr-3" />

                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search Champion..."
                        className="flex-grow bg-transparent outline-none border-none text-white placeholder:text-gray-500 text-lg font-medium"
                    />
                </div>
            </div>
        </div>
    );
};