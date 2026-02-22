"use client";

import { useEffect, useState } from "react";

export default function PwaUpdater() {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      window.serwist
    ) {
      const serwist = window.serwist;

      // Listen for when a new service worker is waiting
      const onWaiting = () => {
        setShowUpdate(true);
      };

      serwist.addEventListener("waiting", onWaiting);

      return () => {
        serwist.removeEventListener("waiting", onWaiting);
      };
    }
  }, []);

  const handleUpdate = () => {
    if (typeof window !== "undefined" && window.serwist) {
      window.serwist.messageSkipWaiting();
      window.location.reload();
    }
  };

  if (!showUpdate) return null;

  return (
    <div className="pwa-update-banner">
      <div className="pwa-update-content">
        <span className="pwa-update-icon">✨</span>
        <div className="pwa-update-text">
          <strong>تحديث جديد متاح</strong>
          <p>
            يتوفر إصدار جديد من التطبيق. قم بالتحديث للحصول على آخر التحسينات.
          </p>
        </div>
        <button className="pwa-update-btn" onClick={handleUpdate}>
          تحديث الآن
        </button>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    serwist: any;
  }
}
