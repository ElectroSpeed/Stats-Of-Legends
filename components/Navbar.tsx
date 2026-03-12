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
import { Selector } from "./global/Selector";
import { CustomButton } from "./global/CustomButton";
import { SearchBar } from "./global/SearchBar";

const PATCH_URL_BASE =
    "https://www.leagueoflegends.com/fr-fr/news/game-updates/patch-";

const LANGUAGES: Language[] = ["FR", "EN", "ES", "KR"];
const CURRENT_YEAR_SHORT = "25";
const CURRENT_SEASON = "15";

interface NavbarProps {
    currentView?: string;
    onNavigate?: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({currentView, onNavigate,}) => {
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

    const handleNavClick = (e: React.MouseEvent, view: string) => {
        if (!onNavigate) return;
        e.preventDefault();
        onNavigate(view);
    };

    const isActive = (key: string, href: string) => {
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
                
                <div className="grid grid-cols-3 items-center pt-4 pb-4">

                    {/* LOGO */}
                    <div className="flex items-center justify-start shrink-0">
                        <SafeLink href="/" onClick={(e) => handleNavClick(e, "home")} className="flex items-center gap-3 group">
                            <div className="relative w-12 h-12 flex items-center justify-center">
                                <div className="absolute w-8 h-8 bg-lol-gold/25 rounded-full transition-all duration-500 group-hover:w-14 group-hover:h-14 group-hover:bg-lol-red/20 group-hover:blur-sm" />
                                <div className="relative z-10 w-full h-full bg-[#121212] border border-lol-gold/30 rounded-2xl flex items-center justify-center group-hover:border-lol-red/50 transition-colors duration-300 shadow-glow-gold group-hover:shadow-glow-red">
                                    <Gamepad2 className="text-lol-gold w-6 h-6 group-hover:text-lol-red transition-colors" />
                                </div>
                            </div>

                            <div className="flex flex-col">
                                <span className="font-bold text-lg tracking-tight text-gray-100 uppercase leading-none">
                                    Stats Of
                                </span>
                                <span className="font-bold text-lg tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-lol-gold to-lol-red uppercase leading-none drop-shadow-sm">
                                    Legends
                                </span>
                            </div>
                        </SafeLink>
                    </div>

                    {/* NAVIGATION */}
                    <div className="hidden md:flex justify-center z-30">
                        <div className="flex items-center space-x-2">
                            {NAV_ITEMS.map((item) => (
                                <CustomButton
                                    key={item.key}
                                    href={item.href}
                                    onClick={(e) => handleNavClick(e, item.key)}
                                    text={item.label}
                                    iconLeft={item.icon}
                                    variant={isActive(item.key, item.href) ? "navbarActive" : "navbarGhost"}
                                />
                            ))}
                        </div>
                    </div>

                    {/* PATCH + LANGUAGE */}
                    <div className="flex items-center justify-end gap-6 shrink-0">
                        <PatchIndicator patch={CURRENT_PATCH} url={patchUrl} />
                        <div className="hidden md:block h-8 w-px bg-white/10" />
                        <div className="w-32">
                            <Selector
                                options={LANGUAGES.map((lang) => ({ label: lang, value: lang }))}
                                selected={currentLang}
                                onChange={setCurrentLang}
                                buttonIcon={<Globe className="w-4 h-4 text-lol-gold" />}
                            />
                        </div>
                    </div>

                </div>

                {pathname !== "/" && (
                    <div className="-mt-2 pb-2">
                        <SearchBar size="small" />
                    </div>
                )}

            </div>
        </nav>
    );
};

interface PatchIndicatorProps {
    patch: string;
    url: string;
}

const PatchIndicator: React.FC<PatchIndicatorProps> = ({ patch, url }) => (
    <div className="hidden md:flex flex-col items-end">
        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
            Current Patch
        </span>
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-lol-gold font-mono text-sm hover:text-lol-red transition-colors group"
        >
            <span className="w-2 h-2 rounded-full bg-lol-red shadow-[0_0_8px_#C23030] animate-pulse transition-transform group-hover:scale-125" />
            <span className="group-hover:underline underline-offset-4 decoration-lol-red/50">
                {patch}
            </span>
        </a>
    </div>
);