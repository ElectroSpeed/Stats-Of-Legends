"use client";

import React, { useState } from "react";
import { Search, ArrowRight, Earth } from "lucide-react";
import { Region, SeasonInfo, Language } from "../../types";
import { REGIONS, CURRENT_SEASON_INFO, TRANSLATIONS } from "../../constants";
import { useSafeNavigation } from "../../hooks/useSafeNavigation";
import { useLanguage } from "../../app/LanguageContext";
import { Selector } from "@/components/global/button/Selector";
import { CustomButton } from "@/components/global/button/CustomButton";

interface SearchBarProps {
    onSearch?: (query: string, region: Region) => void;
    seasonInfo?: SeasonInfo;
    lang?: Language;
}

export const SearchBar: React.FC<SearchBarProps> = ({onSearch, seasonInfo, lang,}) => {
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

        const fullQuery = input.includes("#")
            ? input.replace("#", "-")
            : `${input}-${selectedRegion}`;

        if (onSearch) onSearch(fullQuery, selectedRegion);
        else push(`/summoner/${selectedRegion}/${encodeURIComponent(fullQuery)}`);
    };

    return (
        <section className="relative z-50 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-4xl">
                <form onSubmit={handleSubmit} className="w-full">

                    <div className="bg-[#111111] border border-white/10 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] rounded-2xl sm:rounded-full px-3 py-3 sm:px-4 sm:py-3">

                        <div className="flex flex-col sm:flex-row sm:items-center">

                            {/* REGION */}
                            <div className="flex-shrink-0 mb-2 sm:mb-0">
                                <Selector<Region>
                                    selected={selectedRegion}
                                    onChange={setSelectedRegion}
                                    options={REGIONS.map((r) => ({label: r, value: r,}))}
                                    buttonIcon={<Earth className="w-4 h-4" />}
                                    size="medium"
                                    className="w-full sm:w-auto"
                                />
                            </div>

                            {/* INPUT */}
                            <div className="flex items-center flex-1 sm:px-3 py-2 sm:p-0">
                                <div className="flex items-center w-full sm:bg-transparent bg-white/5 rounded-full px-6 py-3">
                                    <Search className="w-5 h-5 text-gray-500 mr-3" />

                                    <input
                                        className="w-full bg-transparent outline-none border-none text-white placeholder:text-gray-500 text-base sm:text-xl font-medium"
                                        placeholder={t.searchPlaceholder}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* BUTTON */}
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

                        </div>
                    </div>

                </form>
            </div>
        </section>
    );
};