"use client";

import { useState, useCallback } from "react";
import HizbGrid from "@/components/HizbGrid";
import TomonDialog from "@/components/TomonDialog";
import AudioPlayer from "@/components/AudioPlayer";
import InstallButton from "@/components/InstallButton";

export default function OfflinePage() {
  const [selectedHizb, setSelectedHizb] = useState<number | null>(null);
  const [playingHizb, setPlayingHizb] = useState<number | null>(null);
  const [playingTomon, setPlayingTomon] = useState<number | null>(null);

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

      <AudioPlayer
        hizb={playingHizb}
        tomon={playingTomon}
        onTrackChange={handleTrackChange}
      />
    </>
  );
}
