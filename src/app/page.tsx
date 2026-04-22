"use client";

import AudioPlayer from "@/components/AudioPlayer";
import DownloadManager from "@/components/DownloadManager";
import HizbGrid from "@/components/HizbGrid";
import InstallButton from "@/components/InstallButton";
import PwaUpdater from "@/components/PwaUpdater";
import TomonDialog from "@/components/TomonDialog";
import { useConnectivity } from "@/lib/useConnectivity";
import { useCallback, useState } from "react";

export default function Home() {
  const [selectedHizb, setSelectedHizb] = useState<number | null>(null);
  const [playingHizb, setPlayingHizb] = useState<number | null>(null);
  const [playingTomon, setPlayingTomon] = useState<number | null>(null);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const { isOnline, isChecking, isRestricted, isStable } = useConnectivity();

  const handleSelectTomon = useCallback((hizb: number, tomon: number) => {
    setPlayingHizb(hizb);
    setPlayingTomon(tomon);
  }, []);

  const handleTrackChange = useCallback((hizb: number, tomon: number) => {
    setPlayingHizb(hizb);
    setPlayingTomon(tomon);
  }, []);

  return (
    <>
      <header className="app-header">
        <div className="header-ornament">﷽</div>
        <h1 className="app-title">القرآن الكريم</h1>
        <p className="app-subtitle">
          الشيخ محمود خليل الحصري — رواية ورش عن نافع
        </p>
        <div className="header-connectivity">
          {isChecking ? (
            <span className="status-verifying">🔄 جارٍ التحقق...</span>
          ) : !isOnline ? (
            <span className="status-offline">⚡ وضع بدون إنترنت</span>
          ) : isRestricted ? (
            <span className="status-restricted">⚠️ اتصال محدود</span>
          ) : isStable ? (
            <span className="status-stable">✅ اتصال مستقر</span>
          ) : null}
        </div>

        {isStable && (
          <button
            className="download-header-btn"
            onClick={() => setDownloadOpen(true)}
            aria-label="تحميل"
          >
            📥 تحميل
          </button>
        )}
        <InstallButton />
      </header>

      <main className="app-main">
        <HizbGrid onSelectHizb={setSelectedHizb} activeHizb={playingHizb} />
      </main>

      <TomonDialog
        hizb={selectedHizb}
        onSelectTomon={handleSelectTomon}
        onClose={() => setSelectedHizb(null)}
      />

      <DownloadManager
        open={downloadOpen}
        onClose={() => setDownloadOpen(false)}
      />

      <AudioPlayer
        hizb={playingHizb}
        tomon={playingTomon}
        onTrackChange={handleTrackChange}
      />

      <PwaUpdater />
    </>
  );
}
