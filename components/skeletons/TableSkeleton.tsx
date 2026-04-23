import React from 'react';
import { Skeleton } from '../ui/Skeleton';

interface TableSkeletonProps {
    columns?: number;
    rows?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ columns = 5, rows = 10 }) => {
    return (
        <div className="w-full bg-white/5 border border-white/5 rounded-2xl overflow-hidden animate-fadeIn shadow-2xl backdrop-blur-sm">
            {/* Header */}
            <div className="flex border-b border-white/10 p-4 bg-white/5">
                {Array.from({ length: columns }).map((_, i) => (
                    <div key={`header-${i}`} className="flex-1 px-4 flex items-center justify-center">
                        <Skeleton className="h-3 w-1/2 rounded-full" />
                    </div>
                ))}
            </div>
            
            {/* Body */}
            <div className="divide-y divide-white/5">
                {Array.from({ length: rows }).map((_, r) => (
                    <div key={`row-${r}`} className="flex items-center p-4 hover:bg-white/[0.02] transition-colors">
                        {Array.from({ length: columns }).map((_, c) => (
                            <div key={`cell-${r}-${c}`} className={`flex-1 px-4 flex items-center ${c === 1 ? 'justify-start' : 'justify-center'} gap-4`}>
                                {/* Show avatar skeleton only on the second typical name/avatar column */}
                                {c === 1 && (
                                    <Skeleton className="h-8 w-8 flex-shrink-0 rounded-full" />
                                )}
                                <Skeleton className={`h-4 ${c === 0 ? 'w-6' : 'w-1/2'} rounded-full`} />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};
