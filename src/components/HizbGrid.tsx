"use client";

import { TOTAL_AHZAB } from "@/lib/quran-data";

interface HizbGridProps {
  onSelectHizb: (hizb: number) => void;
}

export default function HizbGrid({ onSelectHizb }: HizbGridProps) {
  return (
    <div className="hizb-grid">
      {Array.from({ length: TOTAL_AHZAB }, (_, i) => i + 1).map((hizb) => (
        <button
          key={hizb}
          className="hizb-card"
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
  );
}
