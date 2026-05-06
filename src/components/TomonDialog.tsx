"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { TOMON_PER_HIZB, TOMON_LABELS, getAudioUrl } from "@/lib/quran-data";
import { useConnectivity } from "@/lib/useConnectivity";

interface TomonDialogProps {
  hizb: number | null;
  onSelectTomon: (hizb: number, tomon: number) => void;
  onClose: () => void;
}

export default function TomonDialog({
  hizb,
  onSelectTomon,
  onClose,
}: TomonDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { isOnline } = useConnectivity();
  const [cachedTomon, setCachedTomon] = useState<Set<number>>(new Set());

  const checkCacheStatus = useCallback(async () => {
    if (hizb === null || typeof caches === "undefined") return;
    try {
      const cache = await caches.open("quran-audio-cache");
      const cached = new Set<number>();
      
      for (let t = 1; t <= TOMON_PER_HIZB; t++) {
        const url = getAudioUrl(hizb, t);
        const match = await cache.match(url);
        if (match) cached.add(t);
      }
      setCachedTomon(cached);
    } catch {
      // Cache API unavailable
    }
  }, [hizb]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (hizb !== null) {
      if (!dialog.open) dialog.showModal();
      checkCacheStatus();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [hizb, checkCacheStatus]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="tomon-dialog"
      onClick={handleBackdropClick}
      onClose={onClose}
    >
      {hizb !== null && (
        <div className="tomon-dialog-content">
          <div className="tomon-dialog-header">
            <h2>الحزب {hizb}</h2>
            <span className="tomon-dialog-subtitle">اختر الثُمن</span>
            <button
              className="tomon-close-btn"
              onClick={onClose}
              aria-label="إغلاق"
            >
              ✕
            </button>
          </div>
          <div className="tomon-grid">
            {Array.from({ length: TOMON_PER_HIZB }, (_, i) => i + 1).map(
              (tomon) => {
                const isCached = cachedTomon.has(tomon);
                const borderClass = isCached 
                  ? "hizb-cached" 
                  : !isOnline ? "hizb-not-cached" : "";

                return (
                  <button
                    key={tomon}
                    className={`tomon-card ${borderClass}`}
                    onClick={() => {
                      onSelectTomon(hizb, tomon);
                      onClose();
                    }}
                  >
                    <span className="tomon-number">{tomon}</span>
                    <span className="tomon-label">{TOMON_LABELS[tomon - 1]}</span>
                  </button>
                );
              },
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}
