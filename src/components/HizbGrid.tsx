"use client";

import { useState, useEffect, useCallback } from "react";
import { TOTAL_AHZAB, TOMON_PER_HIZB, getAudioUrl } from "@/lib/quran-data";

interface HizbGridProps {
  onSelectHizb: (hizb: number) => void;
}

export default function HizbGrid({ onSelectHizb }: HizbGridProps) {
  const [isOffline, setIsOffline] = useState(false);
  // Map of hizb number -> "full" | "partial" | "none"
  const [cacheStatus, setCacheStatus] = useState<
    Record<number, "full" | "partial" | "none">
  >({});

  const checkAllCacheStatus = useCallback(async () => {
    if (typeof caches === "undefined") return;
    try {
      const cache = await caches.open("quran-audio-cache");
      const keys = await cache.keys();
      const cachedUrls = new Set(keys.map((r) => new URL(r.url).pathname));

      const status: Record<number, "full" | "partial" | "none"> = {};
      for (let hizb = 1; hizb <= TOTAL_AHZAB; hizb++) {
        let cached = 0;
        for (let t = 1; t <= TOMON_PER_HIZB; t++) {
          if (cachedUrls.has(getAudioUrl(hizb, t))) {
            cached++;
          }
        }
        if (cached === TOMON_PER_HIZB) status[hizb] = "full";
        else if (cached > 0) status[hizb] = "partial";
        else status[hizb] = "none";
      }
      setCacheStatus(status);
    } catch {
      // Cache API unavailable
    }
  }, []);

  useEffect(() => {
    const goOffline = () => {
      setIsOffline(true);
      checkAllCacheStatus();
    };
    const goOnline = () => setIsOffline(false);

    setIsOffline(!navigator.onLine);
    if (!navigator.onLine) {
      checkAllCacheStatus();
    }

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, [checkAllCacheStatus]);

  const getBorderClass = (hizb: number) => {
    if (!isOffline) return "";
    const s = cacheStatus[hizb];
    if (s === "full") return "hizb-cached";
    if (s === "partial") return "hizb-partial";
    return "hizb-not-cached";
  };

  return (
    <>
      {isOffline && (
        <div className="offline-legend">
          <div className="offline-legend-title">⚡ وضع بدون إنترنت</div>
          <div className="offline-legend-items">
            <span className="legend-item">
              <span className="legend-dot legend-dot-green"></span> محفوظ
              بالكامل
            </span>
            <span className="legend-item">
              <span className="legend-dot legend-dot-orange"></span> محفوظ
              جزئياً
            </span>
            <span className="legend-item">
              <span className="legend-dot legend-dot-red"></span> غير محفوظ
            </span>
          </div>
        </div>
      )}
      <div className="hizb-grid">
        {Array.from({ length: TOTAL_AHZAB }, (_, i) => i + 1).map((hizb) => (
          <button
            key={hizb}
            className={`hizb-card ${getBorderClass(hizb)}`}
            onClick={() => onSelectHizb(hizb)}
            aria-label={`الحزب ${hizb}`}
          >
            <div className="hizb-card-inner">
              <span className="hizb-ornament hizb-ornament-top">✦</span>
              <span className="hizb-number">{hizb}</span>
              <span className="hizb-label">حزب</span>
              <span className="hizb-ornament hizb-ornament-bottom">✦</span>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
