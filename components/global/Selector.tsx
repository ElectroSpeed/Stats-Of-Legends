import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface SelectorOption<T> {
    label: string;
    value: T;
}

interface SelectorProps<T> {
    options: SelectorOption<T>[];
    selected: T;
    onChange: (value: T) => void;
    label?: string;
    className?: string;
    buttonIcon?: React.ReactNode;
    buttonStyle?: "gold" | "small";
    size?: "medium" | "small";
}

export function Selector<T extends string | number>({options, selected, onChange, label, className, buttonIcon, buttonStyle = "gold", size = "medium",}: SelectorProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    const currentOption = options.find((o) => o.value === selected);

    const buttonClasses =
        size === "small"
            ? "flex items-center gap-1 px-2 py-1.5 rounded-full bg-[#121212] border border-white/10 text-[0.625rem] text-gray-400 hover:text-lol-gold hover:border-lol-gold/40 transition-all duration-300"
            : "flex items-center px-4 py-3 rounded-full bg-[#121212] border border-white/10 text-gray-400 hover:text-lol-gold hover:border-lol-gold/40 transition-all duration-300";

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            {label && <div className="text-xs uppercase text-gray-400 mb-1">{label}</div>}

            <button type="button" onClick={() => setIsOpen((prev) => !prev)} className={buttonClasses}>
                <div className="flex items-center gap-1">
                    {buttonIcon && (
                        <span className={`flex-shrink-0 ${currentOption ? "text-lol-gold" : "text-gray-400"}`}>
                            {buttonIcon}
                        </span>
                    )}
                    <span>{currentOption?.label}</span>
                </div>
                <ChevronDown className={`w-3 h-3 ml-1 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="absolute left-0 mt-2 min-w-full bg-[#121212] border border-white/10 rounded-2xl shadow-2xl p-2 z-[9999] max-h-60 overflow-y-auto">
                    {options.map((option) => {
                        const isSelected = option.value === selected;
                        return (
                            <button
                                key={option.value.toString()}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full px-4 py-2 text-left rounded-xl text-sm font-bold flex items-center justify-between transition-colors ${
                                    isSelected
                                        ? "text-lol-gold bg-white/5"
                                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                                }`}
                            >
                                <span>{option.label}</span>
                                {isSelected && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-lol-gold shadow-glow-gold" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}