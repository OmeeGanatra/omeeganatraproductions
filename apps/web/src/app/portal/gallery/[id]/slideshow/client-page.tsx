"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";
import SlideshowPlayer from "@/components/portal/SlideshowPlayer";

interface GalleryImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
}

export default function SlideshowPage() {
  const params = useParams();
  const router = useRouter();
  const galleryId = params.id as string;

  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImages();
  }, [galleryId]);

  const fetchImages = async () => {
    try {
      const { data } = await api.get(`/portal/galleries/${galleryId}/images`);
      setImages(data.data || data || []);
    } catch {
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50">
      <SlideshowPlayer
        images={images.map((img) => ({
          id: img.id,
          url: img.url,
          caption: img.caption,
        }))}
        autoPlay
        interval={5000}
        onClose={handleClose}
      />
    </div>
  );
}
