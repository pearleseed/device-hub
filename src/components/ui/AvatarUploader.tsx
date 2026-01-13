import * as React from "react";
import { Upload, X, Loader2, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";
import { Progress } from "./progress";
import { toast } from "@/hooks/use-toast";
import { ImageCropperModal } from "./ImageCropperModal";

// Avatar configuration constants (mirrored from server config)
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_USER_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_DEVICE_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

export interface AvatarUploaderProps {
  currentAvatarUrl: string | null;
  onUploadSuccess: (newUrl: string) => void;
  onDelete: () => void;
  entityType: "user" | "device";
  entityId: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

interface UploadState {
  status: "idle" | "selecting" | "cropping" | "uploading" | "error";
  progress: number;
  error: string | null;
}

export function AvatarUploader({
  currentAvatarUrl,
  onUploadSuccess,
  onDelete,
  entityType,
  entityId,
  className,
  size = "md",
  disabled = false,
}: AvatarUploaderProps) {
  const [uploadState, setUploadState] = React.useState<UploadState>({
    status: "idle",
    progress: 0,
    error: null,
  });
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = React.useState(false);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const maxSize =
    entityType === "user" ? MAX_USER_AVATAR_SIZE : MAX_DEVICE_AVATAR_SIZE;
  const maxSizeMB = maxSize / (1024 * 1024);

  // Cleanup preview URL on unmount
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return "Invalid file format. Allowed: JPEG, PNG, WebP";
    }
    if (file.size > maxSize) {
      return `File size exceeds maximum allowed (${maxSizeMB}MB)`;
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setUploadState({ status: "error", progress: 0, error });
      toast({
        title: "Upload Error",
        description: error,
        variant: "destructive",
      });
      return;
    }

    // Create preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const newPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(newPreviewUrl);
    setSelectedFile(file);
    setIsCropperOpen(true);
    setUploadState({ status: "cropping", progress: 0, error: null });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsCropperOpen(false);
    setUploadState({ status: "uploading", progress: 0, error: null });

    try {
      const formData = new FormData();
      // Convert blob to file with proper extension
      const extension = selectedFile?.name.split(".").pop() || "jpg";
      const croppedFile = new File([croppedBlob], `avatar.${extension}`, {
        type: croppedBlob.type,
      });
      formData.append("avatar", croppedFile);

      const endpoint =
        entityType === "user"
          ? `/api/avatars/user/${entityId}`
          : `/api/avatars/device/${entityId}`;

      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();

      const uploadPromise = new Promise<{ avatarUrl: string }>(
        (resolve, reject) => {
          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              setUploadState((prev) => ({ ...prev, progress }));
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                if (response.success && response.data) {
                  resolve(response.data);
                } else {
                  reject(new Error(response.error || "Upload failed"));
                }
              } catch {
                reject(new Error("Invalid response from server"));
              }
            } else {
              try {
                const errorResponse = JSON.parse(xhr.responseText);
                reject(
                  new Error(
                    errorResponse.error ||
                      `Upload failed with status ${xhr.status}`,
                  ),
                );
              } catch {
                reject(new Error(`Upload failed with status ${xhr.status}`));
              }
            }
          });

          xhr.addEventListener("error", () => {
            reject(new Error("Network error during upload"));
          });

          xhr.addEventListener("abort", () => {
            reject(new Error("Upload was cancelled"));
          });

          xhr.open("POST", endpoint);
          xhr.send(formData);
        },
      );

      const result = await uploadPromise;

      setUploadState({ status: "idle", progress: 0, error: null });
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }

      onUploadSuccess(result.avatarUrl);
      toast({
        title: "Success",
        description: "Avatar uploaded successfully",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload avatar";
      setUploadState({ status: "error", progress: 0, error: errorMessage });
      toast({
        title: "Upload Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleCropCancel = () => {
    setIsCropperOpen(false);
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setUploadState({ status: "idle", progress: 0, error: null });
  };

  const handleDelete = async () => {
    if (!currentAvatarUrl) return;

    setUploadState({ status: "uploading", progress: 50, error: null });

    try {
      const endpoint =
        entityType === "user"
          ? `/api/avatars/user/${entityId}`
          : `/api/avatars/device/${entityId}`;

      const response = await fetch(endpoint, {
        method: "DELETE",
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to delete avatar");
      }

      setUploadState({ status: "idle", progress: 0, error: null });
      onDelete();
      toast({
        title: "Success",
        description: "Avatar deleted successfully",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete avatar";
      setUploadState({ status: "error", progress: 0, error: errorMessage });
      toast({
        title: "Delete Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const triggerFileSelect = () => {
    if (!disabled && uploadState.status !== "uploading") {
      fileInputRef.current?.click();
    }
  };

  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32",
  };

  const isUploading = uploadState.status === "uploading";

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* Avatar Display with Drag & Drop */}
      <div
        className={cn(
          "relative group cursor-pointer rounded-full transition-all",
          isDragOver && "ring-2 ring-primary ring-offset-2",
          disabled && "cursor-not-allowed opacity-50",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            triggerFileSelect();
          }
        }}
        aria-label={currentAvatarUrl ? "Change avatar" : "Upload avatar"}
        aria-disabled={disabled}
      >
        <Avatar className={cn(sizeClasses[size], "border-2 border-muted")}>
          <AvatarImage src={currentAvatarUrl || undefined} alt="Avatar" />
          <AvatarFallback className="bg-muted">
            <Camera className="h-1/3 w-1/3 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>

        {/* Overlay on hover */}
        {!disabled && !isUploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Upload className="h-1/4 w-1/4 text-white" />
          </div>
        )}

        {/* Upload progress overlay */}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/70">
            <Loader2 className="h-1/4 w-1/4 animate-spin text-white" />
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_MIME_TYPES.join(",")}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isUploading}
        aria-hidden="true"
      />

      {/* Progress bar */}
      {isUploading && (
        <div className="w-full max-w-[200px]">
          <Progress value={uploadState.progress} className="h-2" />
          <p className="mt-1 text-center text-xs text-muted-foreground">
            {uploadState.progress}%
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={triggerFileSelect}
          disabled={disabled || isUploading}
        >
          <Upload className="mr-1 h-4 w-4" />
          {currentAvatarUrl ? "Change" : "Upload"}
        </Button>

        {currentAvatarUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={disabled || isUploading}
          >
            <X className="mr-1 h-4 w-4" />
            Remove
          </Button>
        )}
      </div>

      {/* Error message */}
      {uploadState.error && (
        <p className="text-sm text-destructive" role="alert">
          {uploadState.error}
        </p>
      )}

      {/* Help text */}
      <p className="text-xs text-muted-foreground">
        JPEG, PNG, or WebP. Max {maxSizeMB}MB.
      </p>

      {/* Image Cropper Modal */}
      {selectedFile && previewUrl && (
        <ImageCropperModal
          imageFile={selectedFile}
          imageSrc={previewUrl}
          isOpen={isCropperOpen}
          onClose={handleCropCancel}
          onCropComplete={handleCropComplete}
          aspectRatio={1}
        />
      )}
    </div>
  );
}
