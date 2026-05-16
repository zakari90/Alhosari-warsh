"use client";

import { useState, useEffect, useCallback } from "react";
import { TOTAL_AHZAB, TOMON_PER_HIZB, getAudioUrl } from "@/lib/quran-data";
import { useConnectivity } from "@/lib/useConnectivity";

interface HizbGridProps {
  onSelectHizb: (hizb: number) => void;
  activeHizb?: number | null;
}

export default function HizbGrid({ onSelectHizb, activeHizb }: HizbGridProps) {
  const { isOnline, isChecking } = useConnectivity();
  // Map of hizb number -> "full" | "partial" | "none"
  const [cacheStatus, setCacheStatus] = useState<
    Record<number, "full" | "partial" | "none">
  >({});

  const checkAllCacheStatus = useCallback(async () => {
    if (typeof caches === "undefined") return;
    console.log("Cache API - checking all hizb cache status");
    try {
      const cache = await caches.open("quran-audio-cache");
      const keys = await cache.keys();
      const cachedUrls = new Set(
        keys.map((r) => new URL(r.url, window.location.origin).pathname),
      );

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

  // Re-check cache status on mount and whenever connectivity changes
  useEffect(() => {
    // Wrap in a promise to avoid synchronous setState warning and cascading renders
    Promise.resolve().then(() => {
      checkAllCacheStatus();
    });
  }, [isOnline, checkAllCacheStatus]);

  const getBorderClass = (hizb: number) => {
    const classes: string[] = [];
    if (activeHizb === hizb) classes.push("hizb-active");
    
    const s = cacheStatus[hizb];
    if (s === "full") classes.push("hizb-cached");
    else if (s === "partial") classes.push("hizb-partial");
    else if (!isOnline) classes.push("hizb-not-cached"); // Only show red when offline

    return classes.join(" ");
  };

  return (
    <>
      <div className="offline-legend">
        <div className="offline-legend-title">
          {isChecking ? "🔄 جارٍ التحقق من الاتصال..." : !isOnline ? "⚡ وضع بدون إنترنت" : "📱 حالة الحفظ"}
        </div>
        <div className="offline-legend-items">
          <span className="legend-item">
            <span className="legend-dot legend-dot-green"></span> محفوظ
            بالكامل
          </span>
          <span className="legend-item">
            <span className="legend-dot legend-dot-orange"></span> محفوظ
            جزئياً
          </span>
          {!isOnline && (
            <span className="legend-item">
              <span className="legend-dot legend-dot-red"></span> غير محفوظ
            </span>
          )}
        </div>
      </div>
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
