"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  X,
  FileImage,
  FileVideo,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import api from "@/lib/api";

interface UploadFile {
  id: string;
  file: File;
  preview: string;
  progress: number;
  status: "pending" | "uploading" | "complete" | "error";
  error?: string;
}

interface MediaUploaderProps {
  galleryId?: string;
  projectId?: string;
  onUploadComplete?: (uploadedFiles: { id: string; url: string }[]) => void;
  endpoint?: string;
}

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
];
const MAX_CONCURRENT = 3;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isVideo(file: File): boolean {
  return file.type.startsWith("video/");
}

export default function MediaUploader({
  galleryId,
  projectId,
  onUploadComplete,
  endpoint = "/admin/upload",
}: MediaUploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const validFiles = Array.from(newFiles).filter((f) =>
      ACCEPTED_TYPES.includes(f.type)
    );

    const uploadFiles: UploadFile[] = validFiles.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      preview: isVideo(file)
        ? ""
        : URL.createObjectURL(file),
      progress: 0,
      status: "pending" as const,
    }));

    setFiles((prev) => [...prev, ...uploadFiles]);
  }, []);

  const removeFile = (id: string) => {
    const controller = abortControllers.current.get(id);
    if (controller) controller.abort();
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  const uploadFile = async (uploadFile: UploadFile): Promise<{ id: string; url: string } | null> => {
    const controller = new AbortController();
    abortControllers.current.set(uploadFile.id, controller);

    setFiles((prev) =>
      prev.map((f) =>
        f.id === uploadFile.id ? { ...f, status: "uploading" as const } : f
      )
    );

    try {
      // Get presigned URL
      const { data: presignedData } = await api.post(`${endpoint}/presign`, {
        fileName: uploadFile.file.name,
        fileType: uploadFile.file.type,
        galleryId,
        projectId,
      });

      const presignedUrl = presignedData.data?.url || presignedData.url;
      const fileId = presignedData.data?.id || presignedData.id;

      // Upload to presigned URL
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", presignedUrl);
        xhr.setRequestHeader("Content-Type", uploadFile.file.type);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setFiles((prev) =>
              prev.map((f) =>
                f.id === uploadFile.id ? { ...f, progress } : f
              )
            );
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.status}`));
        };

        xhr.onerror = () => reject(new Error("Upload failed"));

        controller.signal.addEventListener("abort", () => xhr.abort());

        xhr.send(uploadFile.file);
      });

      // Confirm upload
      const { data: confirmData } = await api.post(`${endpoint}/confirm`, {
        id: fileId,
        galleryId,
        projectId,
      });

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? { ...f, status: "complete" as const, progress: 100 }
            : f
        )
      );

      abortControllers.current.delete(uploadFile.id);
      return { id: fileId, url: confirmData.data?.url || confirmData.url || "" };
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: "error" as const, error: err.message }
              : f
          )
        );
      }
      abortControllers.current.delete(uploadFile.id);
      return null;
    }
  };

  const startUpload = async () => {
    setUploading(true);
    const pendingFiles = files.filter((f) => f.status === "pending");
    const results: { id: string; url: string }[] = [];

    // Process in batches of MAX_CONCURRENT
    for (let i = 0; i < pendingFiles.length; i += MAX_CONCURRENT) {
      const batch = pendingFiles.slice(i, i + MAX_CONCURRENT);
      const batchResults = await Promise.all(batch.map(uploadFile));
      batchResults.forEach((r) => {
        if (r) results.push(r);
      });
    }

    setUploading(false);
    if (results.length > 0) {
      onUploadComplete?.(results);
    }
  };

  // Drag handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const totalFiles = files.length;
  const completedFiles = files.filter((f) => f.status === "complete").length;
  const allComplete =
    totalFiles > 0 && completedFiles === totalFiles && !uploading;
  const overallProgress =
    totalFiles > 0
      ? Math.round(files.reduce((sum, f) => sum + f.progress, 0) / totalFiles)
      : 0;

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed py-16 transition-all ${
          isDragging
            ? "border-gold bg-gold/5"
            : "border-gold/30 bg-dark/50 hover:border-gold/50 hover:bg-dark"
        }`}
      >
        <Upload
          className={`mb-3 h-10 w-10 transition-colors ${
            isDragging ? "text-gold" : "text-gold/60"
          }`}
        />
        <p className="text-sm font-medium text-cream">
          Drop files here or click to browse
        </p>
        <p className="mt-1 text-[10px] text-cream-muted/50">
          JPG, PNG, WebP, MP4, MOV
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED_TYPES.join(",")}
        onChange={(e) => e.target.files && addFiles(e.target.files)}
        className="hidden"
      />

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {/* Overall Progress */}
            {uploading && (
              <div className="rounded-xl border border-border bg-dark/50 p-4">
                <div className="mb-2 flex items-center justify-between text-xs text-cream-muted">
                  <span>
                    Uploading {completedFiles}/{totalFiles} files
                  </span>
                  <span>{overallProgress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-border">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-gold to-gold-light"
                    initial={{ width: 0 }}
                    animate={{ width: `${overallProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}

            {allComplete && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Upload Complete - {completedFiles} file
                {completedFiles !== 1 ? "s" : ""} uploaded
              </div>
            )}

            {files.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-3 rounded-xl border border-border bg-dark/50 p-3"
              >
                {/* Thumbnail */}
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-dark">
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : isVideo(file.file) ? (
                    <FileVideo className="h-5 w-5 text-cream-muted" />
                  ) : (
                    <FileImage className="h-5 w-5 text-cream-muted" />
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-cream">{file.file.name}</p>
                  <p className="text-[10px] text-cream-muted">
                    {formatSize(file.file.size)}
                  </p>

                  {/* Progress bar */}
                  {file.status === "uploading" && (
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-border">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-gold to-gold-light"
                        initial={{ width: 0 }}
                        animate={{ width: `${file.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="flex-shrink-0">
                  {file.status === "uploading" && (
                    <span className="text-xs text-gold">{file.progress}%</span>
                  )}
                  {file.status === "complete" && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  )}
                  {file.status === "error" && (
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  )}
                  {file.status === "pending" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(file.id);
                      }}
                      className="rounded-lg p-1 text-cream-muted hover:text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Upload Button */}
            {files.some((f) => f.status === "pending") && !uploading && (
              <button
                onClick={startUpload}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-dark py-3.5 text-sm font-semibold text-dark shadow-lg shadow-gold/20 transition-all hover:shadow-xl hover:shadow-gold/30"
              >
                <Upload className="h-4 w-4" />
                Upload{" "}
                {files.filter((f) => f.status === "pending").length} File
                {files.filter((f) => f.status === "pending").length !== 1
                  ? "s"
                  : ""}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
