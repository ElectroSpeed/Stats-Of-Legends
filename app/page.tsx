'use client';

import React from 'react';
import { SearchHero } from '../components/SearchHero';
import { NavigationBlocks } from '../components/NavigationBlocks';

export default function Home() {
    return (
        <div>
            <SearchHero />
            <NavigationBlocks />
        </div>
    );
}
