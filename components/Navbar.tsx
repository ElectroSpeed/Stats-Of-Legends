"use client";

import React, { useMemo } from "react";
import {
    House,
    Hammer,
    Trophy,
    ChartColumnIncreasing,
    Globe,
    Gamepad2
} from "lucide-react";

import { CURRENT_PATCH, TRANSLATIONS } from "../constants";
import { Language } from "../types";
import { SafeLink } from "./ui/SafeLink";
import { useSafeNavigation } from "../hooks/useSafeNavigation";
import { useLanguage } from "../app/LanguageContext";

import { Selector } from "./global/button/Selector";
import { SearchBar } from "./global/SearchBar";

import { DesktopNav } from "./navbar/DesktopNav";
import { MobileMenu } from "./navbar/MobileMenu";
import { PatchIndicator } from "./navbar/PatchIndicator";

const PATCH_URL_BASE =
    "https://www.leagueoflegends.com/fr-fr/news/game-updates/patch-";

const LANGUAGES: Language[] = ["FR", "EN", "ES", "KR"];
const CURRENT_YEAR_SHORT = "25";
const CURRENT_SEASON = "15";

export const Navbar = ({ currentView, onNavigate }) => {
    const { pathname } = useSafeNavigation();
    const { lang: currentLang, setLang: setCurrentLang } = useLanguage();
    const t = TRANSLATIONS[currentLang];

    const patchUrl = useMemo(() => {
        const [seasonRaw, patchNumber] = CURRENT_PATCH.split(".");
        if (!seasonRaw || !patchNumber) return "#";
        const season =
            seasonRaw === CURRENT_SEASON ? CURRENT_YEAR_SHORT : seasonRaw;
        return `${PATCH_URL_BASE}${season}-${patchNumber}-notes/`;
    }, []);

    const handleNavClick = (e, view) => {
        if (!onNavigate) return;
        e.preventDefault();
        onNavigate(view);
    };

    const isActive = (key, href) => {
        if (currentView) return currentView === key;
        return pathname === href;
    };

    const NAV_ITEMS = [
        { key: "home", href: "/", icon: <House className="w-4 h-4" />, label: t.home },
        { key: "builder", href: "/builder", icon: <Hammer className="w-4 h-4" />, label: t.builder },
        { key: "leaderboard", href: "/leaderboard", icon: <Trophy className="w-4 h-4" />, label: t.leaderboard },
        { key: "tierlist", href: "/tierlist", icon: <ChartColumnIncreasing className="w-4 h-4" />, label: t.tierlist },
    ];

    return (
        <nav className="sticky top-0 z-[2500] w-full bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 shadow-2xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="flex items-center justify-between py-4">

                    {/* LOGO */}
                    <SafeLink href="/" onClick={(e) => handleNavClick(e, "home")} className="flex items-center gap-3 group">
                        <div className="relative w-12 h-12 flex items-center justify-center">
                            <div className="absolute w-8 h-8 bg-lol-gold/25 rounded-full group-hover:w-14 group-hover:h-14 group-hover:bg-lol-red/20 group-hover:blur-sm transition-all duration-500" />
                            <div className="relative z-10 w-full h-full bg-[#121212] border border-lol-gold/30 rounded-2xl flex items-center justify-center group-hover:border-lol-red/50 transition-colors shadow-glow-gold group-hover:shadow-glow-red">
                                <Gamepad2 className="text-lol-gold w-6 h-6 group-hover:text-lol-red" />
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <span className="font-bold text-lg text-gray-100 uppercase">Stats Of</span>
                            <span className="font-bold text-lg tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-lol-gold to-lol-red uppercase">
                                Legends
                            </span>
                        </div>
                    </SafeLink>

                    {/* DESKTOP NAV */}
                    <div className="hidden lg:flex flex-1 justify-center">
                        <DesktopNav items={NAV_ITEMS} isActive={isActive} onNavigate={handleNavClick} />
                    </div>

                    {/* RIGHT */}
                    <div className="flex items-center gap-4">

                        <PatchIndicator patch={CURRENT_PATCH} url={patchUrl} />

                        {/* Desktop language */}
                        <div className="hidden lg:block w-28">
                            <Selector
                                options={LANGUAGES.map((l) => ({ label: l, value: l }))}
                                selected={currentLang}
                                onChange={setCurrentLang}
                                buttonIcon={<Globe className="w-4 h-4 text-lol-gold" />}
                            />
                        </div>

                        {/* Mobile menu */}
                        <MobileMenu
                            items={NAV_ITEMS}
                            currentLang={currentLang}
                            setLang={setCurrentLang}
                            languages={LANGUAGES}
                        />
                    </div>
                </div>

                {pathname !== "/" && (
                    <div className="mt-2 pb-2 px-2 md:px-0">
                        <SearchBar size="small" />
                    </div>
                )}
            </div>
        </nav>
    );
};