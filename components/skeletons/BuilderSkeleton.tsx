import React from 'react';
import { Skeleton } from '../ui/Skeleton';

export const BuilderSkeleton = () => {
    return (
        <div className="max-w-[1600px] mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto min-h-[calc(100vh-80px)] animate-fadeIn">
            {/* Catalog Skeleton (Col 3) */}
            <div className="lg:col-span-3 flex flex-col gap-4">
                <Skeleton className="h-[74px] rounded-3xl" /> {/* Search */}
                <Skeleton className="h-[120px] rounded-3xl" /> {/* Filters */}
                <Skeleton className="flex-1 min-h-[500px] rounded-3xl" /> {/* Items list */}
            </div>

            {/* Builder Grid Skeleton (Col 6) */}
            <div className="lg:col-span-6 flex flex-col gap-6">
                <Skeleton className="h-[140px] rounded-[2rem]" /> {/* Champion Select Header */}
                <Skeleton className="h-[400px] rounded-[2rem]" /> {/* Item Slots Grid */}
                <Skeleton className="h-20 rounded-2xl" /> {/* Action Bar */}
            </div>

            {/* Stats Skeleton (Col 3) */}
            <div className="lg:col-span-3 flex flex-col gap-4">
                <Skeleton className="h-[200px] rounded-[2rem]" /> {/* Stat Ring/Dummy */}
                <Skeleton className="flex-1 min-h-[400px] rounded-[2rem]" /> {/* Runes/Stats */}
            </div>
        </div>
    );
};
