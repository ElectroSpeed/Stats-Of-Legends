"use client";

import React, { useMemo, useState } from "react";

export interface Column<T> {
    key: string;
    label: string;
    sortable?: boolean;
    defaultDirection?: "asc" | "desc";
    render?: (item: T) => React.ReactNode;
    className?: string;
}

interface FlexibleTableProps<T> {
    columns: Column<T>[];
    data: T[];
    defaultSort?: { key: string; direction: "asc" | "desc" };
    maxItems?: number;
}

export function FlexibleTable<T>({
                                     columns,
                                     data,
                                     defaultSort,
                                     maxItems = 8
                                 }: FlexibleTableProps<T>) {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(
        defaultSort ?? null
    );

    const handleSort = (columnKey: string) => {
        const column = columns.find((c) => c.key === columnKey);
        if (!column?.sortable) return;

        if (sortConfig?.key === columnKey) {
            setSortConfig({
                key: columnKey,
                direction: sortConfig.direction === "asc" ? "desc" : "asc",
            });
            return;
        }

        setSortConfig({
            key: columnKey,
            direction: column.defaultDirection ?? "asc",
        });
    };

    const sortedData = useMemo(() => {
        if (!sortConfig) return data;
        const column = columns.find((c) => c.key === sortConfig.key);
        if (!column) return data;

        return [...data].sort((a: any, b: any) => {
            const first = a[column.key];
            const second = b[column.key];
            if (first == null) return 1;
            if (second == null) return -1;
            if (typeof first === "number" && typeof second === "number") {
                return sortConfig.direction === "asc" ? first - second : second - first;
            }
            const result = String(first).localeCompare(String(second));
            return sortConfig.direction === "asc" ? result : -result;
        });
    }, [data, sortConfig, columns]);

    const gridLayout = {
        display: 'grid',
        gridTemplateColumns: `repeat(${columns.length}, minmax(160px, 1fr))`,
        minWidth: "100%",
    };

    return (
        <div className="w-full bg-[#111111] border border-white/10 rounded-[2rem] shadow-2xl p-6 overflow-hidden">

            {/* Scroll horizontal unique */}
            <div className="overflow-x-auto pb-4 custom-scrollbar-horizontal">

                <div className="min-w-full w-max">

                    {/* En-tête de tri */}
                    <div style={gridLayout} className="px-3 mb-4">
                        {columns.map((col) => {
                            const isSorted = sortConfig?.key === col.key;

                            return (
                                <div
                                    key={col.key}
                                    className={`flex items-center px-4 justify-center ${col.sortable ? "cursor-pointer group/header" : ""}`}
                                    onClick={() => col.sortable && handleSort(col.key)}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${isSorted ? "text-lol-gold" : "text-gray-300"}`}>
                                            {col.label}
                                        </span>
                                        {col.sortable && (
                                            <div className={`flex flex-col -space-y-1 ${isSorted ? "opacity-100" : "opacity-20"}`}>
                                                <svg className={`w-2 h-2 ${isSorted && sortConfig.direction === "asc" ? "text-lol-gold" : "text-gray-400"}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 4l-8 8h16z" /></svg>
                                                <svg className={`w-2 h-2 ${isSorted && sortConfig.direction === "desc" ? "text-lol-gold" : "text-gray-400"}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 20l8-8H4z" /></svg>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Zone de défilement vertical remise à droite */}
                    <div
                        className="overflow-y-auto pr-2 custom-scrollbar scroll-smooth"
                        style={{ maxHeight: `calc(${maxItems} * 4.8rem)` }}
                    >
                        <div className="space-y-3">
                            {sortedData.map((item, rowIndex) => (
                                <div key={rowIndex} style={gridLayout} className="group flex items-stretch">
                                    {columns.map((col, colIndex) => {
                                        const isSorted = sortConfig?.key === col.key;
                                        const isCentered = col.className?.includes("text-center");

                                        const value = (col.key === "rank" || col.key === "absoluteRank")
                                            ? rowIndex + 1
                                            : col.render ? col.render(item) : (item as any)[col.key];

                                        return (
                                            <div
                                                key={col.key}
                                                className={`
                                                    py-4 px-4 flex items-center relative bg-[#181818] border-y border-white/5
                                                    ${isCentered ? "justify-center" : "justify-start"}
                                                    ${colIndex === 0 ? "border-l border-white/5 rounded-l-2xl" : ""}
                                                    ${colIndex === columns.length - 1 ? "border-r border-white/5 rounded-r-2xl" : ""}
                                                    ${col.className ?? ""}
                                                `}
                                            >
                                                {isSorted && <div className="absolute inset-0 bg-white/[0.02] pointer-events-none" />}
                                                <div className={`relative z-10 font-semibold text-sm whitespace-nowrap overflow-hidden text-ellipsis ${isSorted ? "text-lol-gold" : "text-gray-300"}`}>
                                                    {value}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}