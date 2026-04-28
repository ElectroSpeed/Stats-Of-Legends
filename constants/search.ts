export const REGIONS = [
    "EUW",
    "NA",
    "KR",
    "EUNE",
    "BR",
    "LAN",
    "LAS",
    "OCE",
    "TR",
    "RU",
    "JP"
] as const;

export const REGION_TO_PLATFORM: Record<string, string> = {
    EUW: "euw1",
    NA: "na1",
    KR: "kr",
    EUNE: "eun1",
    OCE: "oc1",
    JP: "jp1",
    BR: "br1",
    LAN: "la1",
    LAS: "la2",
    TR: "tr1",
    RU: "ru"
};

export const ROLES = [
    { id: "ALL", label: "ALL ROLES" },
    { id: "TOP", label: "TOP" },
    { id: "JUNGLE", label: "JUNGLE" },
    { id: "MID", label: "MID" },
    { id: "ADC", label: "BOT" },
    { id: "SUPPORT", label: "SUPPORT" }
] as const;

export const RANKS = [
    "ALL",
    "CHALLENGER",
    "GRANDMASTER",
    "MASTER",
    "DIAMOND_PLUS",
    "DIAMOND",
    "EMERALD_PLUS",
    "EMERALD",
    "PLATINUM_PLUS",
    "PLATINUM",
    "GOLD_PLUS",
    "GOLD",
    "GOLD_MINUS",
    "SILVER",
    "BRONZE",
    "IRON"
] as const;

export const formatRank = (rank: string) => {
    if (rank === "ALL") return "ALL RANKS";
    if (rank.endsWith("_PLUS")) return `${rank.replace("_PLUS", "")} +`;
    if (rank.endsWith("_MINUS")) return `${rank.replace("_MINUS", "")} -`;
    return rank;
};