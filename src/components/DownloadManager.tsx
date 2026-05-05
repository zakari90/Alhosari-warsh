"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { TOTAL_AHZAB, TOMON_PER_HIZB, getAudioUrl } from "@/lib/quran-data";
import { useConnectivity } from "@/lib/useConnectivity";

interface DownloadManagerProps {
  open: boolean;
  onClose: () => void;
}

type DownloadMode = "idle" | "select";

export default function DownloadManager({
  open,
  onClose,
}: DownloadManagerProps) {
  const [mode, setMode] = useState<DownloadMode>("idle");
  const [cachedHizbs, setCachedHizbs] = useState<Set<number>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const abortRef = useRef(false);

  const { isOnline, isRestricted, isStable, isChecking, verify } =
    useConnectivity();

  useEffect(() => {
    if (open) {
      checkCachedHizbs();
    } else {
      setMode("idle");
    }
  }, [open]);

  // Abort if connection drops while downloading
  useEffect(() => {
    if (downloading && !isOnline) {
      abortRef.current = true;
      setErrorMsg("انقطع الاتصال بالإنترنت وتم إيقاف التحميل.");
    }
  }, [downloading, isOnline]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setErrorMsg(null); // Clear errors when opened
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const checkCachedHizbs = useCallback(async () => {
    try {
      const cache = await caches.open("quran-audio-cache");
      const keys = await cache.keys();
      const cachedUrls = new Set(keys.map((r) => new URL(r.url).pathname));

      const cached = new Set<number>();
      for (let h = 1; h <= TOTAL_AHZAB; h++) {
        let allCached = true;
        for (let t = 1; t <= TOMON_PER_HIZB; t++) {
          if (!cachedUrls.has(getAudioUrl(h, t))) {
            allCached = false;
            break;
          }
        }
        if (allCached) cached.add(h);
      }
      setCachedHizbs(cached);
    } catch {
      // Cache API not available
    }
  }, []);

  const downloadHizbs = useCallback(
    async (hizbs: number[]) => {
      setErrorMsg(null);
      setDownloading(true);
      abortRef.current = false;
      const total = hizbs.length * TOMON_PER_HIZB;
      setProgress({ done: 0, total });

      // Verify connection before starting
      const isCapable = await verify();
      if (!isCapable) {
        setDownloading(false);
        setErrorMsg(
          !isOnline
            ? "لا يوجد اتصال بالإنترنت لبدء التحميل."
            : "الإنترنت متصل لكن الخادم غير متاح. تأكد من اتصالك بإنترنت غير مقيد.",
        );
        return;
      }

      try {
        const cache = await caches.open("quran-audio-cache");
        const keys = await cache.keys();
        const cachedPaths = new Set(
          keys.map((k) => new URL(k.url, window.location.origin).pathname),
        );
        let done = 0;

        for (const h of hizbs) {
          for (let t = 1; t <= TOMON_PER_HIZB; t++) {
            if (abortRef.current) {
              setDownloading(false);
              return;
            }
            const url = getAudioUrl(h, t);
            const path = new URL(url, window.location.origin).pathname;

            if (!cachedPaths.has(path)) {
              const response = await fetch(url);
              await cache.put(url, response);
            }
            done++;
            setProgress({ done, total });
          }
        }
      } catch (err) {
        console.error("Download error:", err);
      }

      setDownloading(false);
      checkCachedHizbs();
    },
    [checkCachedHizbs],
  );

  const handleDownloadAll = () => {
    const allHizbs = Array.from({ length: TOTAL_AHZAB }, (_, i) => i + 1);
    downloadHizbs(allHizbs);
  };

  const handleDownloadHizb = (h: number) => {
    if (cachedHizbs.has(h) || downloading) return;
    downloadHizbs([h]);
  };

  const handleCancel = () => {
    abortRef.current = true;
  };

  const handleClose = useCallback(() => {
    if (downloading) {
      abortRef.current = true;
    }
    onClose();
  }, [downloading, onClose]);

  if (!open) return null;

  const pct =
    progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="download-overlay" onClick={handleClose}>
      <div
        className="download-dialog-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="download-dialog-header">
          <h2>تحميل للاستماع بدون إنترنت</h2>
          <button
            className="download-close-btn"
            onClick={handleClose}
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        {(!isStable || isChecking) && (
          <div
            className="download-offline-notice"
            style={{
              padding: "8px",
              backgroundColor: isRestricted
                ? "rgba(245, 158, 11, 0.1)"
                : "#fff3cd",
              color: isRestricted ? "#f59e0b" : "#856404",
              textAlign: "center",
              fontSize: "0.85rem",
              marginBottom: "10px",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: "8px",
            }}
          >
            {!isOnline
              ? "أنت غير متصل بالإنترنت. يمكنك فقط تصفح الملفات المحملة."
              : isRestricted
                ? "اتصالك بالإنترنت محدود. يرجى استخدام إنترنت غير مقيد للتحميل."
                : isChecking
                  ? "جارٍ التحقق من جودة الاتصال..."
                  : "يرجى الانتظار حتى استقرار الاتصال بالإنترنت."}
          </div>
        )}

        {errorMsg && (
          <div
            className="download-error-msg"
            style={{
              padding: "10px",
              color: "#f87171",
              backgroundColor: "rgba(248, 113, 113, 0.1)",
              borderRadius: "8px",
              margin: "0 20px 15px",
              textAlign: "center",
              fontSize: "0.9rem",
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Downloading progress */}
        {downloading && (
          <div className="download-progress-section">
            <div className="download-progress-bar-wrapper">
              <div
                className="download-progress-bar-fill"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="download-progress-info">
              <span>
                {progress.done} / {progress.total}
              </span>
              <span>{pct}%</span>
            </div>
            <button className="download-cancel-btn" onClick={handleCancel}>
              إلغاء
            </button>
          </div>
        )}

        {/* Mode selection */}
        {!downloading && mode === "idle" && (
          <div className="download-mode-buttons">
            <button
              className="download-action-btn"
              onClick={handleDownloadAll}
              disabled={!isStable || isChecking}
              style={{ opacity: !isStable || isChecking ? 0.6 : 1 }}
            >
              <span className="download-action-icon">📥</span>
              <span className="download-action-text">
                <strong>تحميل الكل</strong>
                <small>60 حزب — 480 ملف صوتي</small>
              </span>
            </button>
            <button
              className="download-action-btn"
              onClick={() => setMode("select")}
            >
              <span className="download-action-icon">🔢</span>
              <span className="download-action-text">
                <strong>اختيار حزب</strong>
                <small>استعرض أو اختر الأحزاب للتحميل</small>
              </span>
            </button>
          </div>
        )}

        {/* Hizb selection grid */}
        {!downloading && mode === "select" && (
          <>
            <div className="download-select-header">
              <button
                className="download-back-btn"
                onClick={() => setMode("idle")}
              >
                → رجوع
              </button>
            </div>
            <div className="download-hizb-grid">
              {Array.from({ length: TOTAL_AHZAB }, (_, i) => i + 1).map((h) => {
                const isCached = cachedHizbs.has(h);
                return (
                  <button
                    key={h}
                    className={`download-hizb-card ${isCached ? "download-hizb-cached" : ""}`}
                    onClick={() => handleDownloadHizb(h)}
                    disabled={
                      isCached || (!isCached && (!isStable || isChecking))
                    }
                  >
                    <span className="download-hizb-num">{h}</span>
                    {isCached && (
                      <span className="download-hizb-badge">✅</span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Footer close */}
        <div className="download-dialog-footer">
          <button className="download-footer-close-btn" onClick={handleClose}>
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
