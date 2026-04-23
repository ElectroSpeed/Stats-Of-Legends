"use client";

import React from "react";
import { Search, ShieldHalf, BowArrow } from "lucide-react";
import { Selector } from "@/components/global/button/Selector";
import { SearchContainer } from "@/components/global/SearchContainer";

interface TierListSearchBarProps {
    rank: string;
    setRank: (v: string) => void;
    ranks: readonly string[];
    formatRank: (r: string) => string;

    role: string;
    setRole: (v: string) => void;
    roles: readonly { id: string; label: string }[];

    search: string;
    setSearch: (v: string) => void;
    t?: any;
}

export const TierListSearchBar = ({rank, setRank, ranks, formatRank, role, setRole, roles, search, setSearch, t}: TierListSearchBarProps) => {

    const handleSubmit = () => {};

    return (
        <SearchContainer onSubmit={handleSubmit}>

            {/* Conteneur corrigé : flex-col pour mobile, flex-row pour desktop */}
            <div className="flex flex-col sm:flex-row gap-2 mb-2 sm:mb-0 w-full sm:w-auto flex-shrink-0">
                <Selector
                    selected={rank}
                    onChange={setRank}
                    options={ranks.map((r) => ({ label: formatRank(r), value: r }))}
                    buttonIcon={<ShieldHalf className="w-4 h-4" />}
                    size="medium"
                    className="w-full sm:w-auto"
                />

                <Selector
                    selected={role}
                    onChange={setRole}
                    options={roles.map((r) => ({ label: r.label, value: r.id }))}
                    buttonIcon={<BowArrow className="w-4 h-4" />}
                    size="medium"
                    className="w-full sm:w-auto"
                />
            </div>

            {/* SEARCH INPUT */}
            <div className="flex items-center flex-1 sm:px-3 py-2 sm:p-0 w-full">
                <div className="flex items-center w-full sm:bg-transparent bg-white/5 rounded-full px-6 py-3">
                    <Search className="w-5 h-5 text-gray-500 mr-3" />
                    <input
                        className="w-full bg-transparent outline-none border-none text-white placeholder:text-gray-500 text-base sm:text-xl font-medium"
                        placeholder={t?.searchChampion || "Search Champion..."}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

        </SearchContainer>
    );
};