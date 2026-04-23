'use client';

import React, { Suspense } from 'react';
import Hero from '../components/global/Hero';
import { HomeSearchBar } from '../components/global/HomeSearchBar';
import { NavigationBlocks } from '../components/NavigationBlocks';
import { CURRENT_SEASON_INFO, TRANSLATIONS } from '../constants';
import { useLanguage } from '../app/LanguageContext';

export default function Home() {
    const { lang: ctxLang } = useLanguage();
    const t = TRANSLATIONS[ctxLang];

    const info = CURRENT_SEASON_INFO;

    return (
        <div>
            <Hero
                badgeText={info ? `${info.season} ${info.split}` : "Season 2025 Split 2"}
                title={t.heroTitle}
                highlight={t.heroHighlight}
                description={t.heroDesc}
            />

            {/* ✅ FIX ICI */}
            <Suspense fallback={<div className="h-20" />}>
                <HomeSearchBar />
            </Suspense>

            <NavigationBlocks />
        </div>
    );
}