"use client";

import React, { useState } from "react";
import {Globe, Menu, X} from "lucide-react";
import { CustomButton } from "../global/button/CustomButton";
import { Selector } from "../global/button/Selector";

export const MobileMenu = ({items, currentLang, setLang, languages}) => {
    const [open, setOpen] = useState(false);

    return (
        <div className="lg:hidden relative">
            
            <button onClick={() => setOpen(!open)} className="relative z-[150] text-white w-8 h-8 flex items-center justify-center">
                <Menu className={`absolute transition-all duration-300 ${open ? "opacity-0 rotate-90 scale-75" : "opacity-100"}`}/>
                <X className={`absolute transition-all duration-300 ${open ? "opacity-100" : "opacity-0 -rotate-90 scale-75"}`}/>
            </button>

            {/* OVERLAY */}
            <div
                className={`fixed top-0 left-0 w-screen h-screen bg-black/40 z-[100] transition-opacity duration-300 ${
                    open ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                onClick={() => setOpen(false)}
            />

            {/* PANEL */}
            <div
                className={`fixed top-0 right-0 h-screen w-64 bg-[#111111] z-100 transform transition-transform duration-300 border-l border-white/10 ${open ? "translate-x-0" : "translate-x-full"}`}
            >
                <div className="flex flex-col h-full">
                    <span className="text-x font-bold text-white uppercase pl-[24px] pt-[32px] pb-[32px]">
                        Menu
                    </span>

                    <div className="flex flex-col px-3">
                        <div className="border-t border-white/10"></div>
                    </div>
                        
                    <div className="flex flex-col gap-2 px-3 py-4">

                        {items.map((item) => (
                            <CustomButton
                                key={item.key}
                                href={item.href}
                                text={item.label}
                                iconLeft={item.icon}
                                variant="classic"
                                onClick={() => setOpen(false)}
                                className="w-full justify-start px-3"
                            />
                        ))}

                        <div className="pt-4 mt-4 border-t border-white/10">
                            <Selector
                                options={languages.map((l) => ({ label: l, value: l }))}
                                selected={currentLang}
                                onChange={setLang}
                                buttonIcon={<Globe className="w-4 h-4 text-lol-gold" />}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};