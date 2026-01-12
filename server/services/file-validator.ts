/**
 * File Validator Service
 * Validates uploaded files against size, format, and dimension requirements.
 * Requirements: 1.1, 1.2, 2.2, 2.3
 */

import {
  ALLOWED_MIME_TYPES,
  MAX_USER_AVATAR_SIZE,
  MAX_DEVICE_AVATAR_SIZE,
  type AvatarEntityType,
} from "../config/avatar";

/**
 * Result of file validation
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Configuration for file validation
 */
export interface FileValidatorConfig {
  maxSizeBytes: number;
  allowedMimeTypes: readonly string[];
}

/**
 * Represents a file to be validated
 */
export interface FileToValidate {
  size: number;
  mimeType: string;
}

/**
 * Get the maximum file size for a given entity type
 * @param entityType - 'user' or 'device'
 * @returns Maximum file size in bytes
 */
export function getMaxSizeForEntity(entityType: AvatarEntityType): number {
  return entityType === "user" ? MAX_USER_AVATAR_SIZE : MAX_DEVICE_AVATAR_SIZE;
}

/**
 * Get the maximum file size in MB for display purposes
 * @param entityType - 'user' or 'device'
 * @returns Maximum file size in MB
 */
export function getMaxSizeMBForEntity(entityType: AvatarEntityType): number {
  return entityType === "user" ? 2 : 5;
}

/**
 * Validates a file's MIME type against allowed types
 * @param mimeType - The MIME type to validate
 * @param allowedMimeTypes - Array of allowed MIME types
 * @returns ValidationResult indicating if the MIME type is valid
 */
export function validateMimeType(
  mimeType: string,
  allowedMimeTypes: readonly string[] = ALLOWED_MIME_TYPES,
): ValidationResult {
  const isValid = allowedMimeTypes.includes(mimeType);

  if (!isValid) {
    return {
      valid: false,
      error: "Invalid file format. Allowed: JPEG, PNG, WebP",
    };
  }

  return { valid: true };
}

/**
 * Validates a file's size against maximum allowed size
 * @param fileSize - The file size in bytes
 * @param maxSizeBytes - Maximum allowed size in bytes
 * @returns ValidationResult indicating if the file size is valid
 */
export function validateFileSize(
  fileSize: number,
  maxSizeBytes: number,
): ValidationResult {
  if (fileSize > maxSizeBytes) {
    const maxSizeMB = maxSizeBytes / (1024 * 1024);
    return {
      valid: false,
      error: `File size exceeds maximum allowed (${maxSizeMB}MB)`,
    };
  }

  return { valid: true };
}

/**
 * Validates a file against all validation rules
 * @param file - The file to validate (with size and mimeType)
 * @param config - Validation configuration
 * @returns ValidationResult indicating if the file is valid
 */
export function validateFile(
  file: FileToValidate,
  config: FileValidatorConfig,
): ValidationResult {
  // Validate MIME type first
  const mimeResult = validateMimeType(file.mimeType, config.allowedMimeTypes);
  if (!mimeResult.valid) {
    return mimeResult;
  }

  // Validate file size
  const sizeResult = validateFileSize(file.size, config.maxSizeBytes);
  if (!sizeResult.valid) {
    return sizeResult;
  }

  return { valid: true };
}

/**
 * Validates an avatar file for a specific entity type
 * Convenience function that uses the appropriate size limits
 * @param file - The file to validate
 * @param entityType - 'user' or 'device'
 * @returns ValidationResult indicating if the file is valid
 */
export function validateAvatarFile(
  file: FileToValidate,
  entityType: AvatarEntityType,
): ValidationResult {
  const config: FileValidatorConfig = {
    maxSizeBytes: getMaxSizeForEntity(entityType),
    allowedMimeTypes: ALLOWED_MIME_TYPES,
  };

  return validateFile(file, config);
}
