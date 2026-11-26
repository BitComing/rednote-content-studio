import type { UploadedFile } from "./types";

export async function uploadFiles(files: File[]): Promise<UploadedFile[]> {
  return Promise.all(
    files.map(async (file) => {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || `上传失败：${file.name}`);
      }
      return payload as UploadedFile;
    }),
  );
}
