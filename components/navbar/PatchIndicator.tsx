import React from "react";

interface PatchIndicatorProps {
    patch: string;
    url: string;
}

export const PatchIndicator: React.FC<PatchIndicatorProps> = ({ patch, url }) => (
    <div className="flex flex-col items-end leading-tight">

        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
            <span className="sm:inline">Current Patch</span>
        </span>

        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 sm:gap-2 text-lol-gold font-mono text-xs sm:text-sm hover:text-lol-red transition-colors group">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-lol-red animate-pulse group-hover:scale-125 transition-transform" />
            <span className="group-hover:underline underline-offset-2">
                {patch}
            </span>
        </a>
    </div>
);