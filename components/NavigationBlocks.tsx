'use client';

import React from 'react';
import { useLanguage } from '@/app/LanguageContext';
import { TRANSLATIONS } from '@/constants';
import { SafeLink } from '@/components/ui/SafeLink';

export const NavigationBlocks = () => {
    const { lang } = useLanguage();
    const translation = TRANSLATIONS[lang];

    return (
        <section className="relative bg-[#111111] py-28">

            <div className="absolute top-0 left-0 w-full h-px bg-lol-gold/40" />

            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">

                    <FeatureCard icon="⚡" title={translation.realTime} desc={translation.realTimeDesc} color="gold" />

                    <FeatureCard icon="🤖" title={translation.aiCoach} desc={translation.aiCoachDesc} color="amber" />

                    <SafeLink href="/builder" className="block h-full">
                        <FeatureCard icon="⚔️" title="Builder Noxus" desc={translation.builderDesc} color="red" />
                    </SafeLink>

                </div>
            </div>
        </section>
    );
};

interface FeatureCardProps {icon: string;title: string;desc: string;color: 'gold' | 'red' | 'amber';}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, desc, color }) => {

    const colorMap = {
        gold: `
            border-lol-gold/50
            hover:border-lol-gold/70
            hover:shadow-[0_0_90px_rgba(200,170,110,0.2)]
        `,
        amber: `
            border-[#B85F43]/50
            hover:border-[#B85F43]/80
            hover:shadow-[0_0_90px_rgba(184,95,67,0.25)]
        `,
        red: `
            border-lol-red/50
            hover:border-lol-red/70
            hover:shadow-[0_0_90px_rgba(194,48,48,0.2)]
        `
    };

    return (
        <div className={`relative h-full p-10 rounded-3xl bg-[#18181b] border transition-all duration-300 hover:-translate-y-3 group cursor-pointer ${colorMap[color]}`}>
            <div className="text-5xl mb-6 transition-transform duration-300 group-hover:scale-110">
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