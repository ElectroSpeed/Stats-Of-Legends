"use client";

import React, { useState } from "react";
import { Search, ArrowRight, Earth } from "lucide-react";
import { Region, SeasonInfo, Language } from "../../types";
import { REGIONS, CURRENT_SEASON_INFO, TRANSLATIONS } from "../../constants";
import { useSafeNavigation } from "../../hooks/useSafeNavigation";
import { useLanguage } from "../../app/LanguageContext";
import { Selector } from "@/components/global/Selector";
import { CustomButton } from "@/components/global/CustomButton";

interface SearchBarProps {
    onSearch?: (query: string, region: Region) => void;
    seasonInfo?: SeasonInfo;
    lang?: Language;
    size?: "medium" | "small";
}

export const SearchBar: React.FC<SearchBarProps> = ({onSearch, seasonInfo, lang, size = "medium",}) => {
    const isSmall = size === "small";

    const [input, setInput] = useState("");
    const [selectedRegion, setSelectedRegion] = useState<Region>("EUW");

    const { push } = useSafeNavigation();
    const { lang: ctxLang } = useLanguage();
    const t = lang ? TRANSLATIONS[lang] : TRANSLATIONS[ctxLang];
    const info = seasonInfo ?? CURRENT_SEASON_INFO;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        let name = input;
        let tag = selectedRegion as string;

        if (input.includes("#")) [name, tag] = input.split("#");
        else if (input.includes("-")) [name, tag] = input.split("-");

        const fullQuery = input.includes("#") ? input.replace("#", "-") : `${input}-${selectedRegion}`;

        if (onSearch) onSearch(fullQuery, selectedRegion);
        else
            push(`/summoner/${selectedRegion}/${encodeURIComponent(fullQuery)}`);
    };

    const containerPadding = isSmall ? "px-1 py-1" : "px-4 py-3";

    return (
        <div className={`relative ${isSmall ? "pb-1 z-100" : "sm:pb-16 z-100"}`}>
            <form
                onSubmit={handleSubmit}
                className={`relative mx-auto ${isSmall ? "max-w-[600px]" : "max-w-4xl"}`}
            >
                <div
                    className={`flex items-center rounded-full border border-lol-gold/40 bg-[#0b0b0b] ${containerPadding} ${
                        !isSmall ? "backdrop-blur-xl shadow-[0_0_60px_rgba(0,0,0,0.6)]" : ""
                    }`}
                >
                    {/* REGION */}
                    <Selector<Region>
                        selected={selectedRegion}
                        onChange={setSelectedRegion}
                        options={REGIONS.map((r) => ({ label: r, value: r }))}
                        buttonIcon={<Earth className={isSmall ? "w-2.5 h-2.5" : "w-4 h-4"} />}
                        size={size}
                    />

                    <div className={`w-px bg-white/10 ${isSmall ? "mx-2 h-5" : "mx-6 h-8"}`} />

                    {/* LOUPE GAUCHE */}
                    {!isSmall && <Search className="w-6 h-6 text-gray-500 mr-4" />}

                    <input
                        className={`flex-grow bg-transparent outline-none border-none text-white placeholder:text-gray-500 ${
                            isSmall ? "text-[0.625rem]" : "text-xl font-medium"
                        }`}
                        placeholder={t.searchPlaceholder}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />

                    {/* BOUTON */}
                    <CustomButton
                        type="submit"
                        text={t.go}
                        iconRight={isSmall ? <Search className="w-2.5 h-2.5" /> : <ArrowRight className="w-5 h-5" />}
                        variant="goldGradient"
                        size={size}
                    />
                </div>
            </form>
        </div>
    );
};