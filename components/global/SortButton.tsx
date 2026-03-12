"use client";

import React from "react";
import { ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";
import { CustomButton } from "@/components/global/CustomButton";

interface SortButtonProps {
    label: string;
    columnKey: string;
    sortable?: boolean;
    defaultDirection?: "asc" | "desc";
    activeSort?: { key: string; direction: "asc" | "desc" } | null;
    onSort: (key: string) => void;
}

export const SortButton: React.FC<SortButtonProps> = ({label, columnKey, sortable, defaultDirection = "asc", activeSort, onSort,}) => {

    const isSorted = activeSort?.key === columnKey;

    const renderIcon = () => {
        if (!sortable) return null;

        if (!isSorted) {
            return <ArrowUpDown className="w-4 h-4 opacity-30" />;
        }

        const isAsc = activeSort?.direction === "asc";

        const showAsc = defaultDirection === "asc" ? isAsc : !isAsc;

        return showAsc
            ? <ChevronUp className="w-4 h-4 text-green-500" />
            : <ChevronDown className="w-4 h-4 text-red-500" />;
    };

    return (
        <CustomButton
            text={label}
            iconRight={renderIcon()}
            variant="navbarGhost"
            size="small"
            onClick={() => sortable && onSort(columnKey)}
            className={`!uppercase !font-bold${isSorted ? "text-white bg-white/10" : "text-gray-400"}`}
        />
    );
};