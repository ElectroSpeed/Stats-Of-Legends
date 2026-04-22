import type { Metadata } from "next";
import React from 'react';
import { Inter, Cinzel } from "next/font/google";
import "./globals.css";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { LanguageProvider } from "./LanguageContext";
import Providers from "./providers";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});

const cinzel = Cinzel({
    subsets: ["latin"],
    variable: "--font-cinzel",
    display: "swap",
});

export const metadata: Metadata = {
    title: "Stats Of Legends",
    description: "Une interface moderne inspirée de dpm.lol pour Stats Of Legends, intégrant une analyse de match par IA.",
};

const MAIN_BG_COLOR = '#050505';

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fr" className="dark">
        <body
            suppressHydrationWarning={true}
            className={`${inter.variable} ${cinzel.variable} antialiased bg-[#050505] text-[#A09B8C] selection:bg-lol-red selection:text-white font-sans`}
        >
        <Providers>
            <LanguageProvider>
                {/* Conteneur global qui gère le débordement horizontal */}
                <div className="relative flex w-full flex-col overflow-x-hidden min-h-screen">
                    <React.Suspense fallback={<div className="h-20 w-full bg-[#050505]/80 backdrop-blur-xl border-b border-white/5" />}>
                        <Navbar />
                    </React.Suspense>
                    <main className="flex-grow">
                        {children}
                    </main>
                    <Footer />
                </div>
            </LanguageProvider>
        </Providers>
        </body>
        </html>
    );
}