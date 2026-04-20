"use client";

import React from "react";

interface SearchContainerProps {
    children: React.ReactNode;
    onSubmit?: (e: React.FormEvent) => void;
}

export const SearchContainer = ({ children, onSubmit }: SearchContainerProps) => {
    return (
        <section className="relative z-50 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-5xl">
                <form onSubmit={(e) => {e.preventDefault();if (onSubmit) onSubmit(e);}} className="w-full">
                    <div className="bg-[#111111] border border-white/10 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] rounded-2xl sm:rounded-full px-3 py-3 sm:px-4 sm:py-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            {children}
                        </div>
                    </div>
                </form>
            </div>
        </section>
    );
};