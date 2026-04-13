import React from "react";
import { CustomButton } from "../global/button/CustomButton";

export const DesktopNav = ({ items, isActive, onNavigate }) => {
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