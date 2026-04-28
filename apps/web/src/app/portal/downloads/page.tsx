"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Clock, Package, CheckCircle } from "lucide-react";

export default function DownloadsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-cream md:text-3xl">Downloads</h1>
        <p className="mt-1 text-sm text-cream-muted">Download your photos and videos</p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface/50 py-20 text-center"
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/10">
          <Download className="h-8 w-8 text-gold" />
        </div>
        <h3 className="font-serif text-xl font-semibold text-cream">Download Your Memories</h3>
        <p className="mt-2 max-w-md text-sm text-cream-muted">
          Go to any gallery and click the download button to download individual photos or the full album as a ZIP file.
        </p>
      </motion.div>
    </div>
  );
}
