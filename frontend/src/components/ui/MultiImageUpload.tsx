import { useRef, useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { uploadsApi } from "@/api/uploads";
import { toast } from "@/hooks/useToast";

const MAX_PHOTOS = 10;

interface MultiImageUploadProps {
  /** Existing photo URLs already saved */
  photos: { id: number; image_url: string }[];
  onAdd: (urls: string[]) => void;
  onRemove: (id: number) => void;
  uploading?: boolean;
}

export function MultiImageUpload({ photos, onAdd, onRemove }: MultiImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const remaining = MAX_PHOTOS - photos.length;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files).slice(0, remaining);
    if (arr.length === 0) {
      toast({ title: `Maximum ${MAX_PHOTOS} photos allowed`, variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const urls = await uploadsApi.uploadImages(arr);
      onAdd(urls);
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {/* Existing photos */}
        {photos.map((photo) => (
          <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden group bg-gray-100">
            <img
              src={photo.image_url}
              alt="portfolio"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => onRemove(photo.id)}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {/* Add cell */}
        {remaining > 0 && (
          <button
            type="button"
            className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-gray-400 hover:text-gray-500 hover:bg-gray-50 transition-colors"
            onClick={() => !loading && inputRef.current?.click()}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Plus className="h-5 w-5" />
                <span className="text-[10px] font-medium">Add photos</span>
                <span className="text-[10px] text-muted-foreground">{remaining} left</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
      />
    </div>
  );
}
