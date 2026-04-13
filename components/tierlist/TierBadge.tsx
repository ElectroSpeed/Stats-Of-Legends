import React from 'react';

interface TierBadgeProps {
    tier: string;
    size?: 'sm' | 'md' | 'lg';
}

export const TierBadge: React.FC<TierBadgeProps> = ({ tier, size = 'md' }) => {

    const getColors = (t: string) => {
        switch (t) {
            case 'S+':
                return 'bg-gradient-to-br from-rose-500 to-red-600 border-red-700';
            case 'S':
                return 'bg-gradient-to-br from-orange-400 to-orange-600 border-orange-700';
            case 'A+':
                return 'bg-gradient-to-br from-amber-400 to-yellow-500 border-yellow-600';
            case 'A':
                return 'bg-gradient-to-br from-emerald-400 to-green-600 border-green-700';
            case 'B':
                return 'bg-gradient-to-br from-sky-400 to-blue-600 border-blue-700';
            case 'C':
                return 'bg-gradient-to-br from-violet-500 to-purple-700 border-purple-800';
            default:
                return 'bg-gradient-to-br from-gray-600 to-gray-800 border-gray-900';
        }
    };

    const getSize = (s: string) => {
        switch (s) {
            case 'sm':
                return 'w-7 h-7 text-xs';
            case 'lg':
                return 'w-12 h-12 text-lg';
            default:
                return 'w-9 h-9 text-sm';
        }
    };

    return (
        <span
            className={`
                flex items-center justify-center
                rounded-full
                border-2
                font-bold
                text-white
                tracking-wide
                hover:scale-110
                transition-transform
                ${getColors(tier)}
                ${getSize(size)}
            `}
        >
            {tier}
        </span>
    );
};