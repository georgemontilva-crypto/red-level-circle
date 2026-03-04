/**
 * ImageCropperModal
 * Modal con cropper interactivo 2:3 para fotos de roster.
 * Usa createPortal para renderizar directamente en document.body
 * y evitar que overflow-hidden de contenedores padres lo bloquee.
 */

import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";

// ─── Helper: recortar imagen con canvas ──────────────────────────────────────

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
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo generar el recorte"))),
      "image/jpeg",
      0.92
    );
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ImageCropperModalProps {
  imageSrc: string;
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

  const modal = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.88)",
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          borderRadius: 16,
          overflow: "hidden",
          background: "#16191f",
          border: "1px solid #22262e",
          width: "min(92vw, 480px)",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #22262e",
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontFamily: "monospace",
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Ajustar foto del roster
          </span>
          <button
            onClick={onCancel}
            style={{
              background: "none",
              border: "none",
              color: "#9ca3af",
              cursor: "pointer",
              fontSize: 20,
              lineHeight: 1,
              padding: "0 4px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Área del cropper */}
        <div style={{ position: "relative", height: 380, background: "#0d0d0d" }}>
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
              cropAreaStyle: { border: "2px solid #dc2626", color: "rgba(220,38,38,0.3)" },
            }}
          />
        </div>

        {/* Slider de zoom */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 20px",
            borderTop: "1px solid #22262e",
          }}
        >
          <span style={{ fontSize: 12, color: "#9ca3af", fontFamily: "monospace", width: 40 }}>
            Zoom
          </span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ flex: 1, accentColor: "#dc2626" }}
          />
          <span
            style={{
              fontSize: 12,
              color: "#9ca3af",
              fontFamily: "monospace",
              width: 40,
              textAlign: "right",
            }}
          >
            {zoom.toFixed(1)}×
          </span>
        </div>

        {/* Botones */}
        <div style={{ display: "flex", gap: 12, padding: "0 20px 20px" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 12,
              border: "1px solid #22262e",
              background: "transparent",
              color: "#9ca3af",
              fontFamily: "monospace",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={processing}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 12,
              border: "none",
              background: processing ? "#7f1d1d" : "#dc2626",
              color: "#fff",
              fontFamily: "monospace",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.08em",
              cursor: processing ? "not-allowed" : "pointer",
              opacity: processing ? 0.7 : 1,
            }}
          >
            {processing ? "Procesando..." : "CONFIRMAR"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
