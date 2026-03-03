import { useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";

export function ImageUploader({
  label,
  value,
  onChange,
  folder = "admin",
  aspectRatio = "16/9",
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  aspectRatio?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadImage = trpc.admin.uploadImage.useMutation({
    onSuccess: (data) => { onChange(data.url); toast.success("Imagen subida"); },
    onError: (e) => toast.error(e.message),
  });

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Solo se permiten imágenes"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("La imagen no puede superar 5MB"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      uploadImage.mutate({ base64, mimeType: file.type as any, folder });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">{label}</label>
      <div
        className="relative rounded-lg border-2 border-dashed border-white/10 hover:border-red-600/50 transition-colors cursor-pointer overflow-hidden bg-zinc-800/50"
        style={{ aspectRatio }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      >
        {value ? (
          <>
            <img src={value} alt="preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-red-700 transition-colors"
            >
              <X size={12} />
            </button>
            <div className="absolute bottom-0 left-0 right-0 py-1 text-center text-xs text-white/70 bg-black/50">
              Click para cambiar
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            {uploadImage.isPending ? (
              <span className="w-6 h-6 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
            ) : (
              <>
                <Upload size={20} className="text-zinc-600" />
                <span className="text-xs text-zinc-500">Click o arrastra una imagen</span>
              </>
            )}
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}
