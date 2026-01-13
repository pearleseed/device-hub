// Application constants

export type PriceRange = "all" | "under5" | "5to10" | "10to20" | "20to50" | "over50";

export const PRICE_RANGES: { value: PriceRange; label: string; min?: number; max?: number }[] = [
  { value: "all", label: "All Prices" },
  { value: "under5", label: "< 5 million", max: 5000000 },
  { value: "5to10", label: "5 - 10 million", min: 5000000, max: 10000000 },
  { value: "10to20", label: "10 - 20 million", min: 10000000, max: 20000000 },
  { value: "20to50", label: "20 - 50 million", min: 20000000, max: 50000000 },
  { value: "over50", label: "> 50 million", min: 50000000 },
];

const CATEGORY_ICONS: Record<string, string> = {
  laptop: "💻", mobile: "📱", tablet: "📲", monitor: "🖥️",
  accessories: "🎧", storage: "💾", ram: "🧠",
};

const STATUS_COLORS: Record<string, string> = {
  available: "bg-status-available text-status-available-foreground",
  borrowed: "bg-status-borrowed text-status-borrowed-foreground",
  maintenance: "bg-status-maintenance text-status-maintenance-foreground",
};

export const getCategoryIcon = (category: string): string => CATEGORY_ICONS[category] || "📦";
export const getStatusColor = (status: string): string => STATUS_COLORS[status] || "";
