"use client";

import React, { useMemo, useState } from "react";
import { SortButton } from "@/components/global/SortButton";

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
}

export function FlexibleTable<T>({
                                     columns,
                                     data,
                                     defaultSort,
                                 }: FlexibleTableProps<T>) {

    const [sortConfig, setSortConfig] = useState<
        { key: string; direction: "asc" | "desc" } | null
    >(defaultSort ?? null);

    /* ---------------------------- SORT HANDLER ---------------------------- */

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

    /* ----------------------------- SORT LOGIC ----------------------------- */

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
                return sortConfig.direction === "asc"
                    ? first - second
                    : second - first;
            }

            const result = String(first).localeCompare(String(second));

            return sortConfig.direction === "asc" ? result : -result;
        });
    }, [data, sortConfig, columns]);

    /* ------------------------------ RENDER -------------------------------- */

    return (
        <div className="overflow-x-auto w-full bg-[#121212] border border-lol-gold/40 rounded-[2rem] shadow-2xl p-6 text-sm">

            <table
                className="w-full text-center border-separate"
                style={{ borderSpacing: "0 0.5rem" }}
            >

                {/* HEADER */}

                <thead>
                <tr className="bg-[#181818]">

                    {columns.map((col, index) => (
                        <th
                            key={col.key}
                            className={`
                                py-3 px-3 font-bold uppercase whitespace-nowrap
                                ${index === 0 ? "rounded-l-2xl" : ""}
                                ${index === columns.length - 1 ? "rounded-r-2xl" : ""}
                            `}
                        >
                            <div className="flex justify-center">

                                <SortButton
                                    label={col.label}
                                    columnKey={col.key}
                                    sortable={col.sortable}
                                    defaultDirection={col.defaultDirection}
                                    activeSort={sortConfig}
                                    onSort={handleSort}
                                />

                            </div>
                        </th>
                    ))}

                </tr>
                </thead>

                {/* BODY */}

                <tbody>

                {sortedData.map((item, rowIndex) => (

                    <tr
                        key={rowIndex}
                        className="hover:bg-white/5 transition-colors rounded-2xl overflow-hidden"
                    >

                        {columns.map((col, colIndex) => {

                            const isSorted = sortConfig?.key === col.key;

                            const value =
                                col.key === "rank"
                                    ? sortConfig?.direction === "desc"
                                        ? sortedData.length - rowIndex
                                        : rowIndex + 1
                                    : col.render
                                        ? col.render(item)
                                        : (item as any)[col.key];

                            return (
                                <td
                                    key={col.key}
                                    className={`
                                        py-3 px-3 relative text-center
                                        bg-[#1c1c1c]
                                        ${col.className ?? ""}
                                        ${colIndex === 0 ? "rounded-l-2xl" : ""}
                                        ${colIndex === columns.length - 1 ? "rounded-r-2xl" : ""}
                                    `}
                                >

                                    {isSorted && (
                                        <div className="absolute inset-0 bg-white/10 rounded-2xl z-0" />
                                    )}

                                    <div
                                        className={`
                                            relative z-10 flex justify-center items-center font-semibold
                                            ${isSorted ? "text-white" : "text-gray-400"}
                                        `}
                                    >
                                        {value}
                                    </div>

                                </td>
                            );
                        })}

                    </tr>
                ))}

                </tbody>

            </table>

        </div>
    );
}