"use client";

import React, { useState } from "react";
import { Search, ArrowRight, Earth } from "lucide-react";
import { Region } from "../../types";
import { REGIONS, TRANSLATIONS, CURRENT_SEASON_INFO } from "../../constants";
import { useSafeNavigation } from "../../hooks/useSafeNavigation";
import { useLanguage } from "../../app/LanguageContext";
import { Selector } from "@/components/global/button/Selector";
import { CustomButton } from "@/components/global/button/CustomButton";
import { SearchContainer } from "./SearchContainer";

export const HomeSearchBar = () => {
    const [input, setInput] = useState("");
    const [selectedRegion, setSelectedRegion] = useState<Region>("EUW");

    const { push } = useSafeNavigation();
    const { lang } = useLanguage();
    const t = TRANSLATIONS[lang];

    const handleSubmit = () => {
        if (!input.trim()) return;

        const formattedInput = input.includes("#")
            ? input.replace("#", "-")
            : `${input}-${selectedRegion}`;

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

        </SearchContainer>
    );
};