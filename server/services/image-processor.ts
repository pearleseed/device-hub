/**
 * Image Processor Service
 * Processes avatar images: resize to 1:1 aspect ratio and generate thumbnails.
 * Requirements: 3.1, 3.2, 3.3
 */

import sharp from "sharp";
import { AVATAR_SIZE, THUMBNAIL_SIZE } from "../config/avatar";

/**
 * Result of image processing containing original and thumbnail buffers
 */
export interface ProcessedImage {
  original: Buffer;
  thumbnail: Buffer;
  mimeType: string;
}

/**
 * Supported output formats
 */
type OutputFormat = "jpeg" | "png" | "webp";

/**
 * Maps MIME types to sharp output formats
 */
const MIME_TO_FORMAT: Record<string, OutputFormat> = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Gets the output format from a MIME type
 * @param mimeType - The input MIME type
 * @returns The sharp output format, defaults to 'jpeg' if unknown
 */
function getOutputFormat(mimeType: string): OutputFormat {
  return MIME_TO_FORMAT[mimeType] || "jpeg";
}

/**
 * Resizes and crops an image to a square (1:1 aspect ratio)
 * Uses center crop to maintain the most important part of the image
 * @param imageBuffer - The input image buffer
 * @param size - The target size (width and height)
 * @param format - The output format
 * @returns Promise resolving to the processed image buffer
 */
async function resizeToSquare(
  imageBuffer: Buffer,
  size: number,
  format: OutputFormat,
): Promise<Buffer> {
  const image = sharp(imageBuffer);

  // Resize and crop to square using cover fit (maintains aspect ratio, crops excess)
  const resized = image.resize(size, size, {
    fit: "cover",
    position: "center",
  });

  // Output in the specified format
  switch (format) {
    case "png":
      return resized.png({ quality: 90 }).toBuffer();
    case "webp":
      return resized.webp({ quality: 85 }).toBuffer();
    case "jpeg":
    default:
      return resized.jpeg({ quality: 85 }).toBuffer();
  }
}

/**
 * Processes an avatar image: resizes to standard avatar size and generates thumbnail
 * Both outputs maintain 1:1 aspect ratio as per Requirements 3.1, 3.2
 * @param imageBuffer - The raw image buffer to process
 * @param mimeType - The MIME type of the input image
 * @returns Promise resolving to ProcessedImage with original and thumbnail buffers
 * @throws Error if image processing fails
 */
export async function processAvatar(
  imageBuffer: Buffer,
  mimeType: string,
): Promise<ProcessedImage> {
  const format = getOutputFormat(mimeType);

  try {
    // Process both sizes in parallel for efficiency
    const [original, thumbnail] = await Promise.all([
      resizeToSquare(imageBuffer, AVATAR_SIZE, format),
      resizeToSquare(imageBuffer, THUMBNAIL_SIZE, format),
    ]);

    return {
      original,
      thumbnail,
      mimeType,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to process image: ${message}`);
  }
}

/**
 * Gets the dimensions of a processed image
 * Useful for verifying the output meets requirements
 * @param imageBuffer - The image buffer to analyze
 * @returns Promise resolving to width and height
 */
export async function getImageDimensions(
  imageBuffer: Buffer,
): Promise<{ width: number; height: number }> {
  const metadata = await sharp(imageBuffer).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
  };
}

/**
 * Validates that an image has 1:1 aspect ratio
 * @param imageBuffer - The image buffer to validate
 * @returns Promise resolving to true if aspect ratio is 1:1
 */
export async function isSquareImage(imageBuffer: Buffer): Promise<boolean> {
  const { width, height } = await getImageDimensions(imageBuffer);
  return width === height && width > 0;
}
