import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Category-specific placeholder images for devices
 * Uses Unsplash images as fallbacks when no device image is available
 */
const DEVICE_PLACEHOLDER_IMAGES: Record<string, string> = {
  laptop:
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop",
  mobile:
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop",
  tablet:
    "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop",
  monitor:
    "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=300&fit=crop",
  accessories:
    "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=300&fit=crop",
  default:
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop",
};

/**
 * Get the appropriate image URL for a device, falling back to category-specific placeholder
 * @param imageUrl - The device's current image URL (can be null/undefined/empty)
 * @param category - The device category for placeholder selection
 * @returns The image URL to display
 */
export function getDeviceImageUrl(
  imageUrl: string | null | undefined,
  category?: string,
): string {
  if (imageUrl && imageUrl.trim() !== "") {
    return imageUrl;
  }

  if (category && DEVICE_PLACEHOLDER_IMAGES[category]) {
    return DEVICE_PLACEHOLDER_IMAGES[category];
  }

  return DEVICE_PLACEHOLDER_IMAGES.default;
}

/**
 * Get the thumbnail URL for a device, with fallback to main image or placeholder
 * @param thumbnailUrl - The device's thumbnail URL
 * @param imageUrl - The device's main image URL
 * @param category - The device category for placeholder selection
 * @returns The thumbnail URL to display
 */
export function getDeviceThumbnailUrl(
  thumbnailUrl: string | null | undefined,
  imageUrl: string | null | undefined,
  category?: string,
): string {
  if (thumbnailUrl && thumbnailUrl.trim() !== "") {
    return thumbnailUrl;
  }

  return getDeviceImageUrl(imageUrl, category);
}
