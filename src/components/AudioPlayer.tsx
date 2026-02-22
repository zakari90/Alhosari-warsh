"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  getAudioUrl,
  getNext,
  getPrevious,
  TOMON_LABELS,
} from "@/lib/quran-data";

interface AudioPlayerProps {
  hizb: number | null;
  tomon: number | null;
  onTrackChange: (hizb: number, tomon: number) => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AudioPlayer({
  hizb,
  tomon,
  onTrackChange,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [stopAtHizbEnd, setStopAtHizbEnd] = useState(true);
  const [repeatTomon, setRepeatTomon] = useState(false);

  const audioUrl =
    hizb !== null && tomon !== null ? getAudioUrl(hizb, tomon) : null;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    audio.src = audioUrl;
    audio.play().catch(() => {});
    setIsPlaying(true);

    // Explicitly cache the audio file for offline use
    if (typeof caches !== "undefined") {
      caches.open("quran-audio-cache").then(async (cache) => {
        const existing = await cache.match(audioUrl);
        if (!existing) {
          try {
            await cache.add(audioUrl);
          } catch {
            // Network error or offline — ignore
          }
        }
      });
    }
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      if (hizb !== null && tomon !== null) {
        if (repeatTomon) {
          audio.currentTime = 0;
          audio.play().catch(() => {});
        } else if (stopAtHizbEnd && tomon === 8) {
          setIsPlaying(false);
        } else {
          const next = getNext(hizb, tomon);
          if (next) {
            onTrackChange(next.hizb, next.tomon);
          } else {
            setIsPlaying(false);
          }
        }
      }
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, [hizb, tomon, onTrackChange, stopAtHizbEnd, repeatTomon]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }, [isPlaying]);

  const seek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Number(e.target.value);
  }, []);

  const goNext = useCallback(() => {
    if (hizb === null || tomon === null) return;
    const next = getNext(hizb, tomon);
    if (next) onTrackChange(next.hizb, next.tomon);
  }, [hizb, tomon, onTrackChange]);

  const goPrevious = useCallback(() => {
    if (hizb === null || tomon === null) return;
    const prev = getPrevious(hizb, tomon);
    if (prev) onTrackChange(prev.hizb, prev.tomon);
  }, [hizb, tomon, onTrackChange]);

  if (hizb === null || tomon === null) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="audio-player">
      <audio ref={audioRef} preload="metadata" />

      <div className="player-track-info">
        <span className="player-hizb">الحزب {hizb}</span>
        <span className="player-separator">—</span>
        <span className="player-tomon">{TOMON_LABELS[tomon - 1]}</span>
      </div>
      <div className="player-options">
        <button
          className={`player-btn player-btn-toggle ${
            repeatTomon ? "active" : ""
          }`}
          onClick={() => setRepeatTomon(!repeatTomon)}
          aria-label="تكرار الثمن"
          title="تكرار الثمن"
        >
          <span>تكرار الثمن</span>
          🔁
        </button>

        <button
          className={`player-btn player-btn-toggle ${
            stopAtHizbEnd ? "active" : ""
          }`}
          onClick={() => setStopAtHizbEnd(!stopAtHizbEnd)}
          aria-label="توقف عند نهاية الحزب"
          title="توقف عند نهاية الحزب"
        >
          <span>توقف عند نهاية الحزب</span>
          🛑
        </button>
      </div>

      <div className="player-controls">
        <button
          className="player-btn player-btn-skip"
          onClick={goPrevious}
          aria-label="السابق"
          disabled={!getPrevious(hizb, tomon)}
        >
          ⏭
        </button>

        <button
          className="player-btn player-btn-play"
          onClick={togglePlay}
          aria-label={isPlaying ? "إيقاف" : "تشغيل"}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>

        <button
          className="player-btn player-btn-skip"
          onClick={goNext}
          aria-label="التالي"
          disabled={!getNext(hizb, tomon)}
        >
          ⏮
        </button>
      </div>

      <div className="player-progress">
        <span className="player-time">{formatTime(currentTime)}</span>
        <div className="player-seekbar-wrapper">
          <div
            className="player-seekbar-fill"
            style={{ width: `${progress}%` }}
          />
          <input
            type="range"
            className="player-seekbar"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={seek}
            step={0.1}
          />
        </div>
        <span className="player-time">{formatTime(duration)}</span>
      </div>
    </div>
  );
}
