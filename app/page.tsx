'use client';

import React from 'react';
import { SearchHero } from '../components/SearchHero';
import { NavigationBlocks } from '../components/NavigationBlocks';

export default function Home() {
    return (
        <div className="animate-fadeIn">
            <React.Suspense fallback={<div className="h-[600px] w-full bg-[#050505] animate-pulse" />}>
                <SearchHero />
            </React.Suspense>

            <NavigationBlocks />
        </div>
    );
}
