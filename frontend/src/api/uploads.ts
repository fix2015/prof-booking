import apiClient from "./client";

function toAbsolute(url: string): string {
  const base = (apiClient.defaults.baseURL ?? "").replace(/\/api\/v1$/, "");
  return url.startsWith("http") ? url : `${base}${url}`;
}

/** Resize an image client-side to max `maxPx` on the longest side, JPEG quality 0.85. */
async function resizeFile(file: File, maxPx = 1200): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      const scale = Math.min(1, maxPx / Math.max(width, height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], file.name, { type: "image/jpeg" }) : file),
        "image/jpeg",
        0.85,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

export const uploadsApi = {
  uploadImage: async (file: File, maxSize = 1200): Promise<string> => {
    const resized = await resizeFile(file, maxSize);
    const form = new FormData();
    form.append("file", resized);
    const res = await apiClient.post<{ url: string }>(
      `/upload/image?max_size=${maxSize}`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return toAbsolute(res.data.url);
  },

  uploadImages: async (files: File[], maxSize = 1200): Promise<string[]> => {
    const resized = await Promise.all(files.map((f) => resizeFile(f, maxSize)));
    const form = new FormData();
    resized.forEach((f) => form.append("files", f));
    const res = await apiClient.post<{ urls: string[] }>(
      `/upload/images?max_size=${maxSize}`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data.urls.map(toAbsolute);
  },
};
