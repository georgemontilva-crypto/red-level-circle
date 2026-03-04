/**
 * ImageCropperModal
 * Modal con cropper interactivo 2:3 (para fotos de roster).
 * Usa react-easy-crop + canvas para generar el blob recortado.
 */

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("No se pudo generar el recorte"));
    }, "image/jpeg", 0.92);
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ImageCropperModalProps {
  /** URL o data-URL de la imagen original */
  imageSrc: string;
  /** Relación de aspecto: por defecto 2/3 (portrait para roster) */
  aspect?: number;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function ImageCropperModal({
  imageSrc,
  aspect = 2 / 3,
  onConfirm,
  onCancel,
}: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      onConfirm(blob);
    } catch {
      /* noop */
    } finally {
      setProcessing(false);
    }
  };

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.85)" }}
    >
      <div
        className="relative flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: "#16191f",
          border: "1px solid #22262e",
          width: "min(92vw, 480px)",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#22262e]">
          <span className="text-sm font-mono font-bold text-white tracking-widest uppercase">
            Ajustar foto
          </span>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Cropper area */}
        <div className="relative" style={{ height: 380 }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: { background: "#0d0d0d" },
              cropAreaStyle: { border: "2px solid #dc2626" },
            }}
          />
        </div>

        {/* Zoom slider */}
        <div className="px-5 py-3 flex items-center gap-3 border-t border-[#22262e]">
          <span className="text-xs text-gray-400 font-mono w-10">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-red-600"
          />
          <span className="text-xs text-gray-400 font-mono w-10 text-right">
            {zoom.toFixed(1)}×
          </span>
        </div>

        {/* Botones */}
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-[#22262e] text-gray-400 hover:text-white text-sm font-mono font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={processing}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-mono font-bold tracking-widest transition-colors"
          >
            {processing ? "Procesando..." : "CONFIRMAR"}
          </button>
        </div>
      </div>
    </div>
  );
}
