'use client';

import React, { useState } from 'react';
import { Github, Twitter, Disc, Info } from 'lucide-react';
import { SafeLink } from './ui/SafeLink';
import { useLanguage } from '../app/LanguageContext';
import { TRANSLATIONS } from '../constants';

export const Footer = () => {
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const { lang } = useLanguage();
    const translation = TRANSLATIONS[lang];

    const handlePlaceholderClick = (e: React.MouseEvent, label: string) => {
        e.preventDefault();
        setToastMsg(`${label} ${translation.placeholderToast}`);
        setTimeout(() => setToastMsg(null), 3000);
    };

    return (
        <footer className="mt-auto relative bg-lol-panel border-t border-white/5 text-gray-400">
            {/* Toast */}
            {toastMsg && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-lol-card border border-lol-gold text-white px-5 py-2 rounded-full shadow-lg z-50 text-xs flex items-center gap-2">
                    <Info className="w-4 h-4 text-lol-gold" />
                    {toastMsg}
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 py-12">
                {/* GRID PRINCIPAL */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                    {/* COL 1 - BRAND */}
                    <div className="col-span-1 lg:col-span-2">
                        <h3 className="text-white text-xl font-bold uppercase mb-4 tracking-wider">
                            {translation.footerTitle}
                        </h3>

                        <p className="text-gray-500 text-sm max-w-md leading-relaxed">
                            {translation.footerTagline}
                        </p>

                        <div className="flex gap-3 mt-6">
                            <SocialIcon icon={<Twitter size={18} />} onClick={(e) => handlePlaceholderClick(e, 'Twitter')} />
                            <SocialIcon icon={<Github size={18} />} onClick={(e) => handlePlaceholderClick(e, 'GitHub')} />
                            <SocialIcon icon={<Disc size={18} />} onClick={(e) => handlePlaceholderClick(e, 'Discord')} />
                        </div>
                    </div>

                    {/* COL 2 - NAV */}
                    <div>
                        <h4 className="text-white text-xs font-bold uppercase mb-4 tracking-widest">Navigation</h4>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><SafeLink href="/" className="hover:text-lol-gold">{translation.navHome}</SafeLink></li>
                            <li><SafeLink href="/builder" className="hover:text-lol-gold">{translation.navBuilder}</SafeLink></li>
                            <li><SafeLink href="/leaderboard" className="hover:text-lol-gold">{translation.navLeaderboard}</SafeLink></li>
                            <li>
                                <button onClick={(e) => handlePlaceholderClick(e, 'API Status')} className="hover:text-lol-gold text-left">
                                    {translation.apiStatus}
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* COL 3 - RESOURCES */}
                    <div>
                        <h4 className="text-white text-xs font-bold uppercase mb-4 tracking-widest">{translation.resources}</h4>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li>
                                <a href="https://developer.riotgames.com/" target="_blank" rel="noreferrer" className="hover:text-lol-gold">
                                    {translation.riotApi}
                                </a>
                            </li>
                            <li>
                                <button onClick={(e) => handlePlaceholderClick(e, 'Privacy Policy')} className="hover:text-lol-gold text-left">
                                    {translation.privacyPolicy}
                                </button>
                            </li>
                            <li>
                                <button onClick={(e) => handlePlaceholderClick(e, 'Terms')} className="hover:text-lol-gold text-left">
                                    {translation.termsOfService}
                                </button>
                            </li>
                            <li>
                                <button onClick={(e) => handlePlaceholderClick(e, 'Support')} className="hover:text-lol-gold text-left">
                                    {translation.contactSupport}
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* COPYRIGHT */}
                <div className="mt-12 pt-6 border-t border-white/5 grid grid-cols-1 lg:grid-cols-4 gap-4">
                    <p className="text-xs text-gray-600 lg:col-span-1">{translation.footerCopyright}</p>
                    <p className="text-[10px] text-gray-700 leading-relaxed lg:col-start-3 lg:col-span-2 max-w-md">
                        {translation.footerDisclaimer}
                    </p>
                </div>
            </div>
        </footer>
    );
};

const SocialIcon = ({ icon, onClick }: { icon: React.ReactNode; onClick: (e: React.MouseEvent) => void }) => (
    <button
        onClick={onClick}
        className="w-10 h-10 rounded-full bg-lol-card border border-white/10 flex items-center justify-center text-gray-400 hover:text-lol-gold hover:border-lol-gold/40 transition"
    >
        {icon}
    </button>
);