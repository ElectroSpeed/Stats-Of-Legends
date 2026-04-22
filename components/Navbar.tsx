"use client";

import React, { useMemo, useState } from "react";
import {House, Hammer, Trophy, ChartColumnIncreasing, Globe, Search} from "lucide-react";

import { Logo } from "./icons/Logo";

import { CURRENT_PATCH, TRANSLATIONS } from "../constants";
import { Language } from "../types";
import { SafeLink } from "./ui/SafeLink";
import { useSafeNavigation } from "../hooks/useSafeNavigation";
import { useLanguage } from "../app/LanguageContext";

import { Selector } from "./global/button/Selector";
import { CustomButton } from "./global/button/CustomButton";

import { DesktopNav } from "./navbar/DesktopNav";
import { MobileMenu } from "./navbar/MobileMenu";
import { PatchIndicator } from "./navbar/PatchIndicator";
import { HomeSearchBar } from "./global/HomeSearchBar";

const PATCH_URL_BASE = "https://www.leagueoflegends.com/fr-fr/news/game-updates/patch-";

const LANGUAGES: Language[] = ["FR", "EN", "ES", "KR"];
const CURRENT_YEAR_SHORT = "25";
const CURRENT_SEASON = "15";

type NavbarProps = { currentView?: string; onNavigate?: (view: string) => void; };

export const Navbar = ({ currentView, onNavigate }: NavbarProps) => {
    const { pathname } = useSafeNavigation();
    const { lang: currentLang, setLang: setCurrentLang } = useLanguage();
    const t = TRANSLATIONS[currentLang];

    const [openSearch, setOpenSearch] = useState(false);

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
        <>
            <nav className="sticky top-0 z-[100] w-full bg-[#111111]/90 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-[15px]">
                    <div className="flex items-center justify-between py-4 gap-2">
                        
                        <SafeLink
                            href="/"
                            onClick={(e) => handleNavClick(e, "home")}
                            className="flex items-center gap-2 sm:gap-3 group shrink-0"
                        >
                            <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                                <Logo className="w-full h-full text-white group-hover:text-lol-gold transition-colors" />
                            </div>

                            <div className="flex flex-col leading-none">
                                <span className="font-bold text-sm sm:text-lg text-white uppercase">
                                    Stats Of
                                </span>
                                <span className="font-bold text-sm sm:text-lg tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-lol-gold to-lol-red uppercase">
                                    Legends
                                </span>
                            </div>
                        </SafeLink>

                        {/* NAV : Hidden on mobile */}
                        <div className="hidden lg:flex flex-1 justify-center">
                            <DesktopNav
                                items={NAV_ITEMS}
                                isActive={isActive}
                                onNavigate={handleNavClick}
                            />
                        </div>
                        
                        <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0">
                            
                            {pathname !== "/" && (
                                <CustomButton
                                    onClick={() => setOpenSearch(true)}
                                    iconLeft={<Search className="w-4 h-4 sm:w-5 h-5" />}
                                    variant="classic"
                                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center p-0"
                                />
                            )}
                            
                            <PatchIndicator patch={CURRENT_PATCH} url={patchUrl} />

                            <div className="hidden lg:block w-28">
                                <Selector
                                    options={LANGUAGES.map((l) => ({ label: l, value: l }))}
                                    selected={currentLang}
                                    onChange={setCurrentLang}
                                    buttonIcon={<Globe className="w-4 h-4 text-lol-gold" />}
                                />
                            </div>

                            <MobileMenu
                                items={NAV_ITEMS}
                                currentLang={currentLang}
                                setLang={setCurrentLang}
                                languages={LANGUAGES}
                            />
                        </div>
                    </div>
                </div>
            </nav>

            {/* SEARCH PANEL */}
            {openSearch && (
                <div className="fixed inset-0 z-[999]">
                    <div
                        className="fixed inset-0 bg-black/40 animate-in fade-in duration-200"
                        onMouseDown={() => setOpenSearch(false)}
                    />
                    <div
                        className="absolute top-20 left-0 w-full p-4 sm:p-6 z-[150] animate-in slide-in-from-top-4 duration-200"
                        onMouseDown={() => setOpenSearch(false)}
                    >
                        <div
                            className="mx-auto max-w-4xl"
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <HomeSearchBar />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};