/**
 * Image Processor Service - Resize and generate thumbnails
 */
import sharp from "sharp";
import { AVATAR_SIZE, THUMBNAIL_SIZE } from "../config/avatar";

export interface ProcessedImage { original: Buffer; thumbnail: Buffer; mimeType: string; }

type OutputFormat = "jpeg" | "png" | "webp";
const MIME_TO_FORMAT: Record<string, OutputFormat> = { "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp" };

/**
 * Helper to resize image to a square with center crop.
 * Converts to the target format (jpeg/png/webp) with optimized quality settings.
 */
const resizeToSquare = async (buf: Buffer, size: number, fmt: OutputFormat): Promise<Buffer> => {
  const img = sharp(buf).resize(size, size, { fit: "cover", position: "center" });
  return fmt === "png" ? img.png({ quality: 90 }).toBuffer()
       : fmt === "webp" ? img.webp({ quality: 85 }).toBuffer()
       : img.jpeg({ quality: 85 }).toBuffer();
};

/**
 * Process a raw uploaded image buffer.
 * Generates both a main avatar and a smaller thumbnail.
 * Preserves the original format if supported (JPEG/PNG/WEBP), defaults to JPEG.
 */
export async function processAvatar(imageBuffer: Buffer, mimeType: string): Promise<ProcessedImage> {
  const fmt = MIME_TO_FORMAT[mimeType] || "jpeg";
  try {
    // Parallel processing for speed
    const [original, thumbnail] = await Promise.all([
      resizeToSquare(imageBuffer, AVATAR_SIZE, fmt),
      resizeToSquare(imageBuffer, THUMBNAIL_SIZE, fmt),
    ]);
    return { original, thumbnail, mimeType };
  } catch (e) {
    throw new Error(`Failed to process image: ${e instanceof Error ? e.message : "Unknown error"}`);
  }
}

export const getImageDimensions = async (buf: Buffer) => {
  const m = await sharp(buf).metadata();
  return { width: m.width || 0, height: m.height || 0 };
};

export const isSquareImage = async (buf: Buffer) => {
  const { width, height } = await getImageDimensions(buf);
  return width === height && width > 0;
};
