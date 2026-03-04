"use client";

import React from "react";
import { SafeLink } from "@/components/ui/SafeLink";

type Variant = "goldGradient" | "navbarActive" | "navbarGhost";
type Size = "medium" | "small";

interface CustomButtonProps {
    text?: string;
    iconLeft?: React.ReactNode;
    iconRight?: React.ReactNode;
    href?: string;
    onClick?: (e: React.MouseEvent) => void;
    type?: "button" | "submit" | "reset";
    variant?: Variant;
    className?: string;
    fullWidth?: boolean;
    size?: Size;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
                                                              text,
                                                              iconLeft,
                                                              iconRight,
                                                              href,
                                                              onClick,
                                                              type = "button",
                                                              variant = "goldGradient",
                                                              className = "",
                                                              fullWidth = false,
                                                              size = "medium",
                                                          }) => {

    const base = `
        inline-flex items-center justify-center gap-2
        rounded-full font-bold uppercase tracking-wider
        transition-all duration-300 whitespace-nowrap
        ${fullWidth ? "w-full" : ""}
    `;

    const sizes: Record<Size, string> = {
        medium: "px-6 py-3 text-sm",
        small: "px-3 py-1.5 text-[0.625rem]", // encore plus petit
    };

    const variants: Record<Variant, string> = {
        goldGradient: `
            bg-gradient-to-r from-lol-gold to-[#e1b255]
            text-[#050505]
            border border-lol-gold/40
            hover:brightness-105
        `,
        navbarActive: `
            bg-lol-gold text-[#050505]
            shadow-[0_0_15px_rgba(200,170,110,0.3)]
        `,
        navbarGhost: `
            text-gray-400 hover:text-white
            hover:bg-white/5
        `,
    };

    const content = (
        <>
            {iconLeft && <span className="flex items-center">{iconLeft}</span>}
            {text && <span>{text}</span>}
            {iconRight && <span className="flex items-center">{iconRight}</span>}
        </>
    );

    const buttonClasses = `${base} ${sizes[size]} ${variants[variant]} ${className}`;

    if (href) {
        return (
            <SafeLink href={href} onClick={onClick} className={buttonClasses}>
                {content}
            </SafeLink>
        );
    }

    return (
        <button type={type} onClick={onClick} className={buttonClasses}>
            {content}
        </button>
    );
};