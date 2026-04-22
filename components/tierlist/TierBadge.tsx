import React from 'react';

interface TierBadgeProps {
    tier: string;
    size?: 'sm' | 'md' | 'lg';
}

export const TierBadge: React.FC<TierBadgeProps> = ({ tier, size = 'md' }) => {

    const getColors = (t: string) => {
        switch (t) {
            case 'S+':
                return 'border-red-600';
            case 'S':
                return 'border-orange-500';
            case 'A+':
                return 'border-yellow-500';
            case 'A':
                return 'border-green-500';
            case 'B':
                return 'border-blue-500';
            case 'C':
                return 'border-purple-500';
            case 'D':
                return 'border-gray-600';
            default:
                return 'border-gray-600';
        }
    };

    const getSize = (s: string) => {
        switch (s) {
            case 'sm':
                return 'w-7 h-7 text-[10px]';
            case 'lg':
                return 'w-12 h-12 text-base';
            default:
                return 'w-9 h-9 text-xs';
        }
    };

    return (
        <span
            className={`
                flex items-center justify-center
                rounded-full border-2 bg-transparent
                font-black tracking-widest text-white
                ${getColors(tier)}
                ${getSize(size)}
            `}
        >
            {tier}
        </span>
    );
};