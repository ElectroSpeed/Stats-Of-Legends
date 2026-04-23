"use client";

import React from "react";
import { SafeLink } from "@/components/ui/SafeLink";
import { getButtonClasses, Variant, Size } from "./ButtonStyles";

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

export const CustomButton: React.FC<CustomButtonProps> = ({text, iconLeft, iconRight, href, onClick, type = "button", variant = "gold", className = "", fullWidth = false, size = "medium",}) => {
    const buttonClasses = getButtonClasses({
        variant,
        size,
        fullWidth,
        className,
    });

    const content = (
        <>
            {iconLeft && <span className="flex items-center">{iconLeft}</span>}
            {text && <span>{text}</span>}
            {iconRight && <span className="flex items-center">{iconRight}</span>}
        </>
    );

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
