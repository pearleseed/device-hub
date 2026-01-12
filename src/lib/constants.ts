// Application constants

// Price range options for filtering (in VND millions)
export type PriceRange =
  | "all"
  | "under5"
  | "5to10"
  | "10to20"
  | "20to50"
  | "over50";

export const PRICE_RANGES: {
  value: PriceRange;
  label: string;
  min?: number;
  max?: number;
}[] = [
  { value: "all", label: "All Prices" },
  { value: "under5", label: "< 5 million", max: 5000000 },
  { value: "5to10", label: "5 - 10 million", min: 5000000, max: 10000000 },
  { value: "10to20", label: "10 - 20 million", min: 10000000, max: 20000000 },
  { value: "20to50", label: "20 - 50 million", min: 20000000, max: 50000000 },
  { value: "over50", label: "> 50 million", min: 50000000 },
];

// Category icon helper
export const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    laptop: "💻",
    mobile: "📱",
    tablet: "📲",
    monitor: "🖥️",
    accessories: "🎧",
    storage: "💾",
    ram: "🧠",
  };
  return icons[category] || "📦";
};

// Status color helper
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    available: "bg-status-available text-status-available-foreground",
    borrowed: "bg-status-borrowed text-status-borrowed-foreground",
    maintenance: "bg-status-maintenance text-status-maintenance-foreground",
  };
  return colors[status] || "";
};
