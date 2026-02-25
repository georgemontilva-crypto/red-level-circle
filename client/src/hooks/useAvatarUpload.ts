import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const TARGET_SIZE = 288; // px — single source of truth for all avatars

/**
 * Crops the source image to a centered square and resizes it to TARGET_SIZE x TARGET_SIZE.
 * Returns a base64 JPEG string (without the data: prefix).
 */
function cropAndResizeToSquare(src: string): Promise<{ base64: string; mimeType: "image/jpeg" }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;

      const canvas = document.createElement("canvas");
      canvas.width = TARGET_SIZE;
      canvas.height = TARGET_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));

      ctx.drawImage(img, sx, sy, side, side, 0, 0, TARGET_SIZE, TARGET_SIZE);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      const base64 = dataUrl.split(",")[1];
      resolve({ base64, mimeType: "image/jpeg" });
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

interface UseAvatarUploadOptions {
  onSuccess?: (url: string) => void;
}

export function useAvatarUpload({ onSuccess }: UseAvatarUploadOptions = {}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const uploadMutation = trpc.profile.uploadImage.useMutation();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("La imagen no puede superar 10MB");
      return;
    }

    setUploading(true);
    try {
      // Read file as data URL
      const dataUrl = await new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = (e) => res(e.target?.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });

      // Crop to square and resize to 288x288
      const { base64, mimeType } = await cropAndResizeToSquare(dataUrl);

      // Upload to S3
      const { url } = await uploadMutation.mutateAsync({ base64, mimeType, type: "avatar" });

      setPreview(url);
      onSuccess?.(url);
      toast.success("Avatar actualizado");
    } catch {
      toast.error("Error al subir la imagen");
    } finally {
      setUploading(false);
    }
  };

  return { uploading, preview, setPreview, handleFile };
}
