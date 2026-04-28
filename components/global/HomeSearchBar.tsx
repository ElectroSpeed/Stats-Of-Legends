"use client";

import React, { useState, useEffect } from "react";
import { Search, ArrowRight, Earth } from "lucide-react";
import { Region } from "../../types";
import { REGIONS, TRANSLATIONS, CURRENT_SEASON_INFO } from "../../constants";
import { useSafeNavigation } from "../../hooks/useSafeNavigation";
import { useLanguage } from "../../app/LanguageContext";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { Selector } from "@/components/global/button/Selector";
import { CustomButton } from "@/components/global/button/CustomButton";
import { SearchContainer } from "./SearchContainer";

interface SearchHistoryItem {
    name: string;
    tag: string;
    region: Region;
}

interface GlobalSuggestion {
    puuid: string;
    gameName: string;
    tagLine: string;
    profileIconId: number;
    summonerLevel: number;
}

export const HomeSearchBar = () => {
    const [input, setInput] = useState("");
    const [selectedRegion, setSelectedRegion] = useState<Region>("EUW");
    const [isFocused, setIsFocused] = useState(false);
    const [recentSearches, setRecentSearches] = useLocalStorage<SearchHistoryItem[]>("recentSearches", []);
    const [globalSuggestions, setGlobalSuggestions] = useState<GlobalSuggestion[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [livePatch, setLivePatch] = useState("15.24.1");

    useEffect(() => {
        fetch('https://ddragon.leagueoflegends.com/api/versions.json')
            .then(res => res.json())
            .then(data => { if (data && data[0]) setLivePatch(data[0]); })
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (input.trim().length < 2) {
            setGlobalSuggestions([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fetch(`/api/summoner/search?q=${encodeURIComponent(input.trim())}`);
                if (res.ok) {
                    const data = await res.json();
                    setGlobalSuggestions(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [input]);

    const { push } = useSafeNavigation();
    const { lang } = useLanguage();
    const t = TRANSLATIONS[lang];

    const handleSubmit = () => {
        if (!input.trim()) return;

        let name = input;
        let tag = selectedRegion as string;

        if (input.includes("#")) {
            const parts = input.split("#");
            name = parts[0];
            tag = parts[1] || tag;
        } else if (input.includes("-")) {
            const parts = input.split("-");
            name = parts[0];
            tag = parts[1] || tag;
        }

        const formattedInput = input.includes("#")
            ? input.replace("#", "-")
            : `${input}-${selectedRegion}`;

        const newItem: SearchHistoryItem = { name, tag, region: selectedRegion };
        
        setRecentSearches(prev => {
            const list = prev || [];
            const filtered = list.filter(item => item.name !== name || item.tag !== tag || item.region !== selectedRegion);
            return [newItem, ...filtered].slice(0, 5);
        });

        setIsFocused(false);
        push(`/summoner/${selectedRegion}/${encodeURIComponent(formattedInput)}`);
    };

    return (
        <SearchContainer onSubmit={handleSubmit}>

            <div className="flex-shrink-0 mb-2 sm:mb-0">
                <Selector<Region>
                    selected={selectedRegion}
                    onChange={setSelectedRegion}
                    options={REGIONS.map((r) => ({ label: r, value: r }))}
                    buttonIcon={<Earth className="w-4 h-4" />}
                    size="medium"
                    className="w-full sm:w-auto"
                />
            </div>

            <div className="flex items-center flex-1 sm:px-3 py-2 sm:p-0">
                <div className="flex items-center w-full sm:bg-transparent bg-white/5 rounded-full px-6 py-3">
                    <Search className="w-5 h-5 text-gray-500 mr-3" />
                    <input
                        className="w-full bg-transparent outline-none border-none text-white placeholder:text-gray-500 text-base sm:text-xl font-medium"
                        placeholder={t.searchPlaceholder}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                    />
                </div>
            </div>

            <div className="mt-2 sm:mt-0 flex-shrink-0">
                <CustomButton
                    type="submit"
                    text={t.go}
                    iconRight={<ArrowRight className="w-5 h-5" />}
                    variant="gold"
                    size="medium"
                    className="w-full sm:w-auto"
                />
            </div>

            {/* RECENT SEARCHES OR GLOBAL SUGGESTIONS */}
            {isFocused && (input.length >= 2 || (recentSearches && recentSearches.length > 0)) && (
                <div className="absolute left-4 right-4 sm:left-6 sm:right-6 lg:left-8 lg:right-8 top-[85px] sm:top-[70px] mt-4 z-[3000] bg-[#121212]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] p-3 animate-fadeIn">
                    
                    {input.length >= 2 ? (
                        <>
                            <div className="text-xs uppercase tracking-widest text-gray-500 mb-2 px-2 flex justify-between">
                                <span>Global Players</span>
                                {isSearching && <span className="text-lol-gold animate-pulse">Loading...</span>}
                            </div>
                            <div className="space-y-1">
                                {globalSuggestions.length === 0 && !isSearching ? (
                                    <div className="px-3 py-2 text-sm text-gray-500 italic">No players found</div>
                                ) : (
                                    globalSuggestions.map((item, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => {
                                                const query = `${item.gameName}-${item.tagLine}`;
                                                setInput(query);
                                                setIsFocused(false);
                                                push(`/summoner/${selectedRegion}/${encodeURIComponent(query)}`);
                                            }}
                                            className="w-full flex justify-start items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-300 hover:bg-white/5 transition"
                                        >
                                            <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 flex-shrink-0 border border-white/5">
                                                <img 
                                                    src={`https://ddragon.leagueoflegends.com/cdn/${livePatch}/img/profileicon/${item.profileIconId}.png`} 
                                                    alt="" 
                                                    className="w-full h-full object-cover" 
                                                />
                                            </div>
                                            <div className="flex flex-col items-start leading-tight">
                                                <span className="font-bold text-white text-base">
                                                    {item.gameName}
                                                    <span className="text-gray-500 font-normal ml-0.5">#{item.tagLine}</span>
                                                </span>
                                                <span className="text-xs font-semibold text-lol-gold">Level {item.summonerLevel}</span>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="text-xs uppercase tracking-widest text-gray-500 mb-2 px-2">
                                Recent Searches
                            </div>
                            <div className="space-y-1">
                                {recentSearches.map((item, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => {
                                            const query = `${item.name}-${item.tag}`;
                                            setInput(query);
                                            setSelectedRegion(item.region);
                                            setIsFocused(false);
                                            push(`/summoner/${item.region}/${encodeURIComponent(query)}`);
                                        }}
                                        className="w-full flex justify-between items-center px-3 py-2 rounded-xl text-sm text-gray-300 hover:bg-white/5 transition"
                                    >
                                        <span>
                                            {item.name}
                                            <span className="text-gray-600">#{item.tag}</span>
                                        </span>
                                        <span className="text-xs text-lol-gold bg-lol-gold/10 px-2 py-0.5 rounded-md">
                                            {item.region}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

        </SearchContainer>
    );
};