// Storage helpers using Cloudinary for image hosting
// Falls back to Forge API proxy if Cloudinary is not configured

import { v2 as cloudinary } from "cloudinary";

let cloudinaryConfigured = false;

function ensureCloudinaryConfig() {
  if (cloudinaryConfigured) return;
  const url = process.env.CLOUDINARY_URL;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (url) {
    // Parse from CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
    cloudinary.config({ cloudinary_url: url });
    cloudinaryConfigured = true;
  } else if (cloudName && apiKey && apiSecret) {
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
    cloudinaryConfigured = true;
  } else {
    throw new Error(
      "Cloudinary credentials missing: set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET"
    );
  }
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  ensureCloudinaryConfig();

  // Convert buffer to base64 data URI for Cloudinary upload
  const base64 = Buffer.isBuffer(data)
    ? data.toString("base64")
    : Buffer.from(data as any).toString("base64");

  const dataUri = `data:${contentType};base64,${base64}`;

  // Use the relKey as the public_id (strip extension, replace slashes with dashes for folder structure)
  const publicId = relKey.replace(/\.[^/.]+$/, ""); // remove extension

  const result = await cloudinary.uploader.upload(dataUri, {
    public_id: publicId,
    overwrite: true,
    resource_type: "image",
    // Use folder from the key path
    folder: undefined, // public_id already includes folder path
  });

  return {
    key: relKey,
    url: result.secure_url,
  };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  ensureCloudinaryConfig();
  const publicId = relKey.replace(/\.[^/.]+$/, "");
  const url = cloudinary.url(publicId, { secure: true });
  return { key: relKey, url };
}
