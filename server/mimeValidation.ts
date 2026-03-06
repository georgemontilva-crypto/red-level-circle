/**
 * mimeValidation.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * FIX ALTO #7: Validación real de tipo MIME para uploads de imágenes.
 *
 * El problema: el cliente declara un mimeType (ej. "image/jpeg") pero el
 * servidor nunca verificaba que el contenido del buffer fuera realmente ese
 * tipo. Un atacante podía enviar un SVG con JavaScript embebido declarando
 * "image/jpeg", lo que podría resultar en XSS si el navegador renderiza el
 * archivo directamente.
 *
 * La solución: usar file-type para detectar el tipo real del buffer a partir
 * de sus magic bytes, y rechazar si no coincide con el tipo declarado.
 *
 * SVG es un caso especial: file-type no detecta SVG (es XML), así que se
 * valida con una inspección del contenido para detectar scripts embebidos.
 */

import { fileTypeFromBuffer } from "file-type";
import { TRPCError } from "@trpc/server";

/** MIME types permitidos para uploads de imágenes de usuario. */
export const ALLOWED_IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/bmp",
  "image/tiff",
] as const;

/** MIME types permitidos que incluyen SVG (solo para admins). */
export const ALLOWED_IMAGE_MIMES_WITH_SVG = [
  ...ALLOWED_IMAGE_MIMES,
  "image/svg+xml",
] as const;

/**
 * Valida que el buffer de una imagen coincida con el mimeType declarado.
 * Lanza TRPCError si el tipo real no coincide o si el SVG contiene scripts.
 *
 * @param buffer - Buffer de la imagen decodificada desde base64
 * @param declaredMime - Tipo MIME declarado por el cliente
 * @param allowSvg - Si true, permite SVG (solo para admins)
 */
export async function validateImageMime(
  buffer: Buffer,
  declaredMime: string,
  allowSvg = false
): Promise<void> {
  // SVG is XML-based; file-type cannot detect it from magic bytes.
  // Validate it separately by checking for embedded scripts.
  if (declaredMime === "image/svg+xml") {
    if (!allowSvg) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "SVG no está permitido en este contexto.",
      });
    }
    const svgContent = buffer.toString("utf-8");
    // Reject SVGs with embedded scripts or event handlers (XSS prevention)
    const dangerousPatterns = [
      /<script[\s>]/i,
      /javascript:/i,
      /on\w+\s*=/i,   // onclick=, onload=, onerror=, etc.
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /data:text\/html/i,
    ];
    for (const pattern of dangerousPatterns) {
      if (pattern.test(svgContent)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "El archivo SVG contiene contenido no permitido (scripts o event handlers).",
        });
      }
    }
    return; // SVG is clean
  }

  // For all other types, use file-type to detect real MIME from magic bytes
  const detected = await fileTypeFromBuffer(buffer);

  if (!detected) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No se pudo determinar el tipo del archivo. Asegúrate de subir una imagen válida.",
    });
  }

  // Normalize: file-type returns "image/jpeg" for JPEG, etc.
  if (detected.mime !== declaredMime) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `El tipo de archivo real (${detected.mime}) no coincide con el declarado (${declaredMime}). Por favor sube una imagen válida.`,
    });
  }
}
