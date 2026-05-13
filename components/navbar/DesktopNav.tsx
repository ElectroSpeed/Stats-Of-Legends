import React from "react";
import { CustomButton } from "../global/button/CustomButton";

type NavItem = {
    key: string;
    href: string;
    icon: React.ReactNode;
    label: string;
};

type DesktopNavProps = {
    items: NavItem[];
    isActive: (key: string, href: string) => boolean;
    onNavigate: (e: React.MouseEvent, key: string) => void;
};

export const DesktopNav: React.FC<DesktopNavProps> = ({ items, isActive, onNavigate }) => {
    return (
        <div className="flex items-center space-x-2">
            {items.map((item) => (
                <CustomButton
                    key={item.key}
                    href={item.href}
                    onClick={(e) => onNavigate(e, item.key)}
                    text={item.label}
                    iconLeft={item.icon}
                    variant={isActive(item.key, item.href) ? "gold" : "classic"}
                />
            ))}
        </div>
    );
};