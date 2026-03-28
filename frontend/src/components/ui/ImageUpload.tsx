import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { uploadsApi } from "@/api/uploads";
import { Spinner } from "./spinner";
import { toast } from "@/hooks/useToast";

interface ImageUploadProps {
  currentUrl?: string;
  onUpload: (url: string) => void;
  label?: string;
  shape?: "square" | "circle";
  size?: number; // px
  maxSize?: number; // max image dimension sent to backend
}

export function ImageUpload({
  currentUrl,
  onUpload,
  label = "Upload Image",
  shape = "square",
  size = 96,
  maxSize = 1200,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(currentUrl);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadsApi.uploadImage(file, maxSize);
      setPreview(url);
      onUpload(url);
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const borderRadius = shape === "circle" ? "rounded-ds-full" : "rounded-ds-md";

  return (
    <div className="flex flex-col items-center gap-ds-2">
      <div
        className={`relative border-2 border-dashed border-ds-border bg-ds-bg-secondary flex items-center justify-center cursor-pointer hover:border-ds-border-strong hover:bg-ds-bg-tertiary transition-colors ${borderRadius} overflow-hidden`}
        style={{ width: size, height: size }}
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {uploading ? (
          <Spinner size="sm" />
        ) : preview ? (
          <>
            <img
              src={preview}
              alt="preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center group">
              <Upload className="h-5 w-5 text-ds-text-inverse opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-ds-1 text-ds-text-secondary">
            <Upload className="h-5 w-5" />
            <span className="ds-caption text-center px-ds-2">Upload</span>
          </div>
        )}
        {preview && !uploading && (
          <button
            type="button"
            className="absolute top-ds-1 right-ds-1 bg-black/60 text-ds-text-inverse rounded-ds-full p-0.5 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              setPreview(undefined);
              onUpload("");
            }}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      <span className="ds-caption text-ds-text-secondary">{label}</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
