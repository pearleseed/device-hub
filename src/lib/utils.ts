import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DEVICE_PLACEHOLDER_IMAGES: Record<string, string> = {
  laptop: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop",
  mobile: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop",
  tablet: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop",
  monitor: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=300&fit=crop",
  accessories: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=300&fit=crop",
  default: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop",
};

export function getDeviceImageUrl(imageUrl: string | null | undefined, category?: string): string {
  if (imageUrl?.trim()) return imageUrl;
  return DEVICE_PLACEHOLDER_IMAGES[category || ""] || DEVICE_PLACEHOLDER_IMAGES.default;
}

export function getDeviceThumbnailUrl(
  thumbnailUrl: string | null | undefined,
  imageUrl: string | null | undefined,
  category?: string,
): string {
  return thumbnailUrl?.trim() || getDeviceImageUrl(imageUrl, category);
}

export function parseSpecs(specsJson: string | Record<string, string> | null | undefined): Record<string, string> {
  if (!specsJson) return {};
  if (typeof specsJson === "object") return specsJson;
  try {
    return JSON.parse(specsJson);
  } catch (e) {
    console.error("Failed to parse specs_json:", e);
    return {};
  }
}
