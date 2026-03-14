import apiClient from "./client";

function toAbsolute(url: string): string {
  const base = (apiClient.defaults.baseURL ?? "http://localhost:8000").replace(/\/api\/v1$/, "");
  return url.startsWith("http") ? url : `${base}${url}`;
}

export const uploadsApi = {
  uploadImage: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("file", file);
    const res = await apiClient.post<{ url: string }>("/upload/image", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return toAbsolute(res.data.url);
  },

  uploadImages: async (files: File[]): Promise<string[]> => {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    const res = await apiClient.post<{ urls: string[] }>("/upload/images", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.urls.map(toAbsolute);
  },
};
