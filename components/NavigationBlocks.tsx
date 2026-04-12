'use client';

import { Bot, Radio, Hammer } from "lucide-react";
import React from 'react';
import { useLanguage } from '@/app/LanguageContext';
import { TRANSLATIONS } from '@/constants';
import { SafeLink } from '@/components/ui/SafeLink';

export const NavigationBlocks = () => {
    const { lang } = useLanguage();
    const translation = TRANSLATIONS[lang];

    return (
        <section className="relative bg-[#111111] py-25">

            <div className="absolute top-0 left-0 w-full h-px border-t border-white/10" />

            <div className="max-w-7xl mx-auto px-15">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 text-center">

                    {/* Réel Temps */}
                    <FeatureCard
                        icon={<Radio className="w-12 h-12 mx-auto text-lol-gold" />}
                        title={translation.realTime}
                        desc={translation.realTimeDesc}
                        color="gold"
                    />

                    {/* AI Coach */}
                    <FeatureCard
                        icon={<Bot className="w-12 h-12 mx-auto text-amber-500" />}
                        title={translation.aiCoach}
                        desc={translation.aiCoachDesc}
                        color="amber"
                    />

                    {/* Builder */}
                    <SafeLink
                        href="/builder"
                        className="block h-full sm:col-span-2 lg:col-span-1 flex justify-center"
                    >
                        <FeatureCard
                            icon={<Hammer className="w-12 h-12 mx-auto text-lol-red" />}
                            title="Builder Noxus"
                            desc={translation.builderDesc}
                            color="red"
                        />
                    </SafeLink>

                </div>
            </div>
        </section>
    );
};

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    desc: string;
    color: 'gold' | 'red' | 'amber';
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, desc, color }) => {

    const colorMap = {
        gold: `
            border-lol-gold/80
            hover:border-lol-gold
            hover:shadow-[0_0_90px_rgba(200,170,110,0.2)]
        `,
        amber: `
            border-[#FE9A00]/60
            hover:border-[#FE9A00]/80
            hover:shadow-[0_0_90px_rgba(184,95,67,0.25)]
        `,
        red: `
            border-lol-red/80
            hover:border-lol-red
            hover:shadow-[0_0_90px_rgba(194,48,48,0.2)]
        `
    };

    return (
        <div className={`relative h-full w-full max-w-sm mx-auto p-10 rounded-3xl bg-[#18181b] border-2 transition-all duration-300 hover:-translate-y-3 group cursor-pointer ${colorMap[color]}`}>
            <div className="text-5xl mb-6">
                {icon}
            </div>

            <h3 className="text-xl font-bold text-white mb-3 font-display uppercase tracking-wide">
                {title}
            </h3>

            <p className="text-gray-400 text-sm leading-relaxed">
                {desc}
            </p>
        </div>
    );
};