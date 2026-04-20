"use client";

import React from "react";
import { Search, ShieldHalf } from "lucide-react";
import { Selector } from "@/components/global/button/Selector";
import { SearchContainer } from "@/components/global/SearchContainer";

interface LeaderboardSearchBarProps {
    tier: string;
    setTier: (v: string) => void;
    tiers: readonly string[];
    search: string;
    setSearch: (v: string) => void;
    placeholder?: string;
}

export const LeaderboardSearchBar = ({tier, setTier, tiers, search, setSearch, placeholder = "Search Player..."}: LeaderboardSearchBarProps) => {

    const handleSubmit = () => {};

    return (
        <SearchContainer onSubmit={handleSubmit}>
            <div className="flex-shrink-0 mb-2 sm:mb-0 flex justify-center sm:block">
                <Selector
                    selected={tier}
                    onChange={setTier}
                    options={tiers.map((t) => ({ label: t, value: t }))}
                    buttonIcon={<ShieldHalf className="w-4 h-4" />}
                    size="medium"
                    className="w-full sm:w-auto"
                />
            </div>
            
            <div className="flex items-center flex-1 sm:px-3 py-2 sm:p-0">
                <div className="flex items-center w-full sm:bg-transparent bg-white/5 rounded-full px-6 py-3">
                    <Search className="w-5 h-5 text-gray-500 mr-3" />
                    <input
                        className="w-full bg-transparent outline-none border-none text-white placeholder:text-gray-500 text-base sm:text-xl font-medium"
                        placeholder={placeholder}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

        </SearchContainer>
    );
};