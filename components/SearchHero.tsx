"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, ArrowRight, ChevronDown } from "lucide-react";
import { Region, SeasonInfo, Language } from "../types";
import { REGIONS, CURRENT_SEASON_INFO, TRANSLATIONS } from "../constants";
import { useSafeNavigation } from "../hooks/useSafeNavigation";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useLanguage } from "../app/LanguageContext";

interface SearchHeroProps {
    onSearch?: (query: string, region: Region) => void;
    seasonInfo?: SeasonInfo;
    lang?: Language;
}

interface RecentSearch {
    name: string;
    tag: string;
    region: Region;
    timestamp: number;
}

export const SearchHero: React.FC<SearchHeroProps> = ({
                                                          onSearch,
                                                          seasonInfo,
                                                          lang,
                                                      }) => {

    const [input, setInput] = useState("");
    const [selectedRegion, setSelectedRegion] = useState<Region>("EUW");

    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loadingSuggest, setLoadingSuggest] = useState(false);

    const [isFocused, setIsFocused] = useState(false);
    const [isRegionMenuOpen, setIsRegionMenuOpen] = useState(false);

    const [recentSearches, setRecentSearches] =
        useLocalStorage<RecentSearch[]>("recent_searches_v1", []);

    const { push } = useSafeNavigation();
    const { lang: ctxLang } = useLanguage();

    const t = lang ? TRANSLATIONS[lang] : TRANSLATIONS[ctxLang];

    const wrapperRef = useRef<HTMLFormElement>(null);

    const info = seasonInfo ?? CURRENT_SEASON_INFO;

    /* ====================================================== */
    /* GLOBAL OUTSIDE CLOSE HANDLER */
    /* ====================================================== */

    useEffect(() => {

        const handleClickOutside = (event: MouseEvent) => {

            if (wrapperRef.current &&
                !wrapperRef.current.contains(event.target as Node)) {

                setIsFocused(false);
                setIsRegionMenuOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsFocused(false);
                setIsRegionMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };

    }, []);

    /* ====================================================== */

    const addToRecent = (gameName: string, tagLine: string, region: Region) => {

        setRecentSearches((prev) => {

            const filtered = prev.filter(
                (item) =>
                    !(
                        item.name.toLowerCase() === gameName.toLowerCase() &&
                        item.tag.toLowerCase() === tagLine.toLowerCase() &&
                        item.region === region
                    )
            );

            return [
                { name: gameName, tag: tagLine, region, timestamp: Date.now() },
                ...filtered,
            ].slice(0, 5);
        });
    };

    /* ====================================================== */

    const handleSubmit = (e: React.FormEvent) => {

        e.preventDefault();

        if (!input.trim()) return;

        let name = input;
        let tag = selectedRegion as string;

        if (input.includes("#")) {
            [name, tag] = input.split("#");
        } else if (input.includes("-")) {
            [name, tag] = input.split("-");
        }

        addToRecent(name, tag, selectedRegion);

        const fullQuery = input.includes("#")
            ? input.replace("#", "-")
            : `${input}-${selectedRegion}`;

        if (onSearch) onSearch(fullQuery, selectedRegion);
        else push(`/summoner/${selectedRegion}/${encodeURIComponent(fullQuery)}`);

        setSuggestions([]);
        setIsFocused(false);
    };

    /* ====================================================== */

    useEffect(() => {

        if (!input || input.length < 3) {
            setSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {

            setLoadingSuggest(true);

            try {

                const res = await fetch(
                    `/api/riot/search?query=${encodeURIComponent(input)}&region=${encodeURIComponent(selectedRegion)}`
                );

                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(data.suggestions || []);
                }

            } catch (err) {
                console.error(err);
            } finally {
                setLoadingSuggest(false);
            }

        }, 500);

        return () => clearTimeout(timer);

    }, [input, selectedRegion]);

    /* ====================================================== */

    return (
        <div className="relative z-[2000] overflow-visible py-24 sm:py-32 border-b border-white/5">

            <div className="relative z-[2100] max-w-4xl mx-auto px-4 text-center">

                {/* Badge */}
                <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-lol-gold/10 border border-lol-gold/20 text-lol-gold text-xs font-bold tracking-widest uppercase shadow-[0_0_40px_rgba(200,170,110,0.12)]">
                    {info ? `${info.season} ${info.split}` : "Season 2025 Split 2"}
                </div>

                {/* Title */}
                <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-7xl mb-8 font-display uppercase">
                    {t.heroTitle}
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-lol-gold to-lol-red">
                        {t.heroHighlight}
                    </span>
                </h1>

                <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-400 mb-12 font-light">
                    {t.heroDesc}
                </p>

                {/* FORM ROOT */}
                <form
                    ref={wrapperRef}
                    onSubmit={handleSubmit}
                    className="relative max-w-4xl mx-auto z-[2200]"
                >

                    {/* SEARCH BAR */}
                    <div className="relative flex items-center rounded-full px-4 py-3 border border-lol-gold/50 bg-gradient-to-b from-[#0b0b0b] to-[#060606] backdrop-blur-xl shadow-[0_0_60px_rgba(0,0,0,0.6)]">

                        {/* REGION SELECTOR */}
                        <div className="relative z-[2300]">

                            <button
                                type="button"
                                onClick={() => {
                                    setIsRegionMenuOpen(prev => !prev);
                                    setIsFocused(false);
                                }}
                                className="px-4 py-3 rounded-full flex items-center gap-2 bg-lol-gold text-[#050505] font-bold uppercase text-sm tracking-wider"
                            >
                                <span>{selectedRegion}</span>

                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isRegionMenuOpen ? "rotate-180" : ""}`} />
                            </button>

                            {isRegionMenuOpen && (
                                <div className="absolute left-0 top-full mt-3 w-36 z-[3000] backdrop-blur-xl bg-[#121212]/95 border border-white/10 rounded-2xl shadow-2xl p-2 animate-fadeIn">

                                    {REGIONS.map(region => (
                                        <button
                                            key={region}
                                            type="button"
                                            onClick={() => {
                                                setSelectedRegion(region);
                                                setIsRegionMenuOpen(false);
                                            }}
                                            className={`
                                            w-full px-4 py-2 text-xs font-bold flex items-center justify-between rounded-xl transition-all
                                            ${selectedRegion === region
                                                ? "text-lol-gold bg-white/5"
                                                : "text-gray-400 hover:bg-white/5 hover:text-white"}
                                            `}
                                        >
                                            <span>{region}</span>

                                            {selectedRegion === region && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-lol-gold shadow-glow-gold" />
                                            )}
                                        </button>
                                    ))}

                                </div>
                            )}
                        </div>

                        <div className="h-8 w-px bg-white/10 mx-6" />

                        <Search className="w-6 h-6 text-gray-600 mr-4" />

                        <input
                            className="flex-grow bg-transparent outline-none border-none text-white text-xl font-medium placeholder:text-gray-600"
                            placeholder={t.searchPlaceholder}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onFocus={() => {
                                setIsFocused(true);
                                setIsRegionMenuOpen(false);
                            }}
                        />

                        <button type="submit" className="px-6 py-3 rounded-full flex items-center gap-2 bg-gradient-to-r from-lol-gold to-[#e1b255] text-[#050505] font-bold uppercase text-sm border border-lol-gold/40 hover:brightness-105">
                            <span>{t.go}</span>
                            <ArrowRight className="w-5 h-5"/>
                        </button>

                    </div>

                    {/* RECENT SEARCHES */}
                    {isFocused && recentSearches.length > 0 && (
                        <div className="absolute left-0 right-0 mt-4 z-[3000] bg-[#121212]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-3 animate-fadeIn">

                            <div className="text-xs uppercase tracking-widest text-gray-500 mb-2 px-2">
                                Recent Searches
                            </div>

                            <div className="space-y-1">
                                {recentSearches.map((item, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => {
                                            const query = `${item.name}-${item.tag}`;
                                            setInput(query);

                                            if (onSearch)
                                                onSearch(query, item.region);
                                            else
                                                push(`/summoner/${item.region}/${encodeURIComponent(query)}`);

                                            setIsFocused(false);
                                        }}
                                        className="w-full flex justify-between items-center px-3 py-2 rounded-xl text-sm text-gray-300 hover:bg-white/5 transition"
                                    >
                                        <span>
                                            {item.name}
                                            <span className="text-gray-600">#{item.tag}</span>
                                        </span>

                                        <span className="text-xs text-lol-gold">
                                            {item.region}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                </form>
            </div>
        </div>
    );
};