"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  Trash2,
  GripVertical,
  Star,
  Eye,
  Download,
  Settings,
  X,
  Loader2,
  CheckCircle,
  AlertTriangle,
  FileImage,
} from "lucide-react";
import api from "@/lib/api";

interface MediaItem {
  id: string;
  type: string;
  filenameOriginal: string;
  storageKeyThumbnail: string;
  width?: number;
  height?: number;
  fileSizeBytes: string;
  isHighlight: boolean;
  sortOrder: number;
}

interface GalleryDetail {
  id: string;
  title: string;
  slug: string;
  description?: string;
  status: string;
  mediaCount: number;
  downloadEnabled: boolean;
  watermarkEnabled: boolean;
  project: { id: string; title: string };
}

export default function AdminGalleryPage() {
  const params = useParams();
  const galleryId = params?.id as string;
  const [gallery, setGallery] = useState<GalleryDetail | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (galleryId) loadGallery();
  }, [galleryId]);

  const loadGallery = async () => {
    try {
      const [galleryRes, mediaRes] = await Promise.all([
        api.get(`/admin/galleries/${galleryId}`),
        api.get(`/admin/galleries/${galleryId}/media`),
      ]);
      setGallery(galleryRes.data.data || galleryRes.data);
      setMedia(mediaRes.data.data || mediaRes.data || []);
    } catch (err) {
      console.error("Failed to load gallery:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Request upload URLs
      const fileInfos = Array.from(files).map((f) => ({
        filename: f.name,
        contentType: f.type,
        size: f.size,
      }));

      const { data } = await api.post(
        `/admin/galleries/${galleryId}/media/upload-urls`,
        { files: fileInfos }
      );

      const uploads = data.uploads || data.data || [];

      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const upload = uploads[i];

        if (upload?.uploadUrl && file) {
          await fetch(upload.uploadUrl, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type },
          });
        }

        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      // Confirm uploads
      const filesArray = Array.from(files);
      await api.post(`/admin/galleries/${galleryId}/media/confirm-upload`, {
        files: uploads.map((u: any, i: number) => ({
          storageKey: u.storageKey,
          filename: filesArray[i]?.name,
          contentType: filesArray[i]?.type,
          size: filesArray[i]?.size,
        })),
      });

      loadGallery();
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const deleteMedia = async (mediaId: string) => {
    if (!confirm("Delete this media item?")) return;
    try {
      await api.delete(`/admin/media/${mediaId}`);
      setMedia((prev) => prev.filter((m) => m.id !== mediaId));
    } catch (err) {
      console.error("Failed to delete media:", err);
    }
  };

  const toggleHighlight = async (mediaId: string, isHighlight: boolean) => {
    try {
      await api.put(`/admin/media/${mediaId}`, { isHighlight: !isHighlight });
      setMedia((prev) =>
        prev.map((m) =>
          m.id === mediaId ? { ...m, isHighlight: !isHighlight } : m
        )
      );
    } catch (err) {
      console.error("Failed to toggle highlight:", err);
    }
  };

  const formatSize = (bytes: string | number) => {
    const b = typeof bytes === "string" ? parseInt(bytes) : bytes;
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-surface" />
        <div className="h-32 animate-pulse rounded-2xl bg-surface" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-square animate-pulse rounded-xl bg-surface" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {gallery?.project && (
            <Link
              href={`/admin/projects/${gallery.project.id}`}
              className="mb-1 flex items-center gap-1 text-xs text-gold hover:underline"
            >
              <ArrowLeft className="h-3 w-3" />
              {gallery.project.title}
            </Link>
          )}
          <h1 className="font-serif text-2xl font-bold text-cream">
            {gallery?.title || "Gallery"}
          </h1>
          <p className="mt-0.5 text-sm text-cream-muted">
            {media.length} media items · {gallery?.status}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-dark px-4 py-2.5 text-sm font-semibold text-dark shadow-lg shadow-gold/20 disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? `Uploading ${uploadProgress}%` : "Upload Media"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFilesSelected}
          />
        </div>
      </div>

      {/* Upload progress */}
      {uploading && (
        <div className="rounded-xl border border-gold/20 bg-gold/5 p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-gold">Uploading files...</span>
            <span className="font-medium text-gold">{uploadProgress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-dark">
            <motion.div
              className="h-full bg-gradient-to-r from-gold to-gold-light"
              initial={{ width: 0 }}
              animate={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Drop Zone */}
      {media.length === 0 && !uploading && (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-surface/30 py-16 transition-all hover:border-gold/30 hover:bg-gold/5"
        >
          <FileImage className="mb-3 h-12 w-12 text-cream-muted/40" />
          <p className="text-sm font-medium text-cream">
            Drop files here or click to upload
          </p>
          <p className="mt-1 text-xs text-cream-muted">
            Supports JPG, PNG, RAW, MP4, MOV
          </p>
        </button>
      )}

      {/* Media Grid */}
      {media.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {media.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.02, 0.3) }}
              className="group relative aspect-square overflow-hidden rounded-xl bg-surface"
            >
              <img
                src={`/api/media/${item.storageKeyThumbnail}`}
                alt={item.filenameOriginal}
                className="h-full w-full object-cover"
                loading="lazy"
              />

              {/* Overlay */}
              <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/60 via-transparent to-black/20 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex justify-end gap-1">
                  <button
                    onClick={() => toggleHighlight(item.id, item.isHighlight)}
                    className={`rounded-lg p-1.5 backdrop-blur-sm transition ${
                      item.isHighlight
                        ? "bg-gold/30 text-gold"
                        : "bg-dark/60 text-white hover:bg-gold/20"
                    }`}
                  >
                    <Star className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteMedia(item.id)}
                    className="rounded-lg bg-dark/60 p-1.5 text-white backdrop-blur-sm transition hover:bg-red-500/30 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div>
                  <p className="truncate text-xs text-white">
                    {item.filenameOriginal}
                  </p>
                  <p className="text-[10px] text-white/60">
                    {formatSize(item.fileSizeBytes)}
                  </p>
                </div>
              </div>

              {/* Highlight badge */}
              {item.isHighlight && (
                <div className="absolute left-1.5 top-1.5">
                  <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
