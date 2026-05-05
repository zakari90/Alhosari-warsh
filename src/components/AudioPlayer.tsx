"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  getAudioUrl,
  getNext,
  getPrevious,
  TOMON_LABELS,
} from "@/lib/quran-data";
import { useConnectivity } from "@/lib/useConnectivity";

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
  const repeatCountRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [stopAtHizbEnd, setStopAtHizbEnd] = useState(true);
  const [repeatTomon, setRepeatTomon] = useState(false);
  const [repeatDisplay, setRepeatDisplay] = useState(0);
  const [isCurrentTrackCached, setIsCurrentTrackCached] = useState(false);
  const { isStable, isChecking, isRestricted, verify } = useConnectivity();

  const REPEAT_MAX = 10;

  const audioUrl =
    hizb !== null && tomon !== null ? getAudioUrl(hizb, tomon) : null;

  // Reset repeat count when track changes
  useEffect(() => {
    repeatCountRef.current = 0;
    setRepeatDisplay(0);

    // Check if new track is cached
    const checkCache = async () => {
      if (typeof caches === "undefined" || !audioUrl) return;
      try {
        const cache = await caches.open("quran-audio-cache");
        const keys = await cache.keys();
        const path = new URL(audioUrl, window.location.origin).pathname;
        const exists = keys.some(
          (k) => new URL(k.url, window.location.origin).pathname === path
        );
        setIsCurrentTrackCached(exists);
      } catch {
        setIsCurrentTrackCached(false);
      }
    };
    checkCache();
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    let currentPathname = "";
    try {
      currentPathname = audio.src ? new URL(audio.src, globalThis.location.origin).pathname : "";
    } catch (e) {}

    if (currentPathname === audioUrl) {
      if (audio.paused) {
        // Only auto-play if cached or stable
        if (isCurrentTrackCached || isStable) {
          audio.play().catch(() => {});
        }
      }
    } else {
      audio.src = audioUrl;
      if (isCurrentTrackCached || isStable) {
        audio.play().catch(() => {});
      }
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
        if (repeatTomon && repeatCountRef.current < REPEAT_MAX - 1) {
          repeatCountRef.current += 1;
          setRepeatDisplay(repeatCountRef.current);
          audio.currentTime = 0;
          audio.play().catch(() => {});
        } else if (repeatTomon && repeatCountRef.current >= REPEAT_MAX - 1) {
          // Finished all 10 repeats, move to next or stop
          repeatCountRef.current = 0;
          setRepeatDisplay(0);
          if (stopAtHizbEnd && tomon === 8) {
            setIsPlaying(false);
          } else {
            const next = getNext(hizb, tomon);
            if (next) {
              // Play immediately to bypass mobile background/lock-screen restrictions
              const nextUrl = getAudioUrl(next.hizb, next.tomon);
              audio.src = nextUrl;
              audio.play().catch(() => {});
              onTrackChange(next.hizb, next.tomon);
            } else {
              setIsPlaying(false);
            }
          }
        } else if (stopAtHizbEnd && tomon === 8) {
          setIsPlaying(false);
        } else {
          const next = getNext(hizb, tomon);
          if (next) {
            // Play immediately to bypass mobile background/lock-screen restrictions
            const nextUrl = getAudioUrl(next.hizb, next.tomon);
            audio.src = nextUrl;
            audio.play().catch(() => {});
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

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, []);

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
        {isCurrentTrackCached ? (
          <span className="player-cached-badge" title="ملف محفوظ">✅</span>
        ) : (
          <span className="player-remote-badge" title="بث مباشر">🌐</span>
        )}
      </div>
      <div className="player-options">
        <button
          className={`player-btn player-btn-toggle ${
            repeatTomon ? "active" : ""
          }`}
          onClick={() => {
            if (repeatTomon) {
              repeatCountRef.current = 0;
              setRepeatDisplay(0);
            }
            setRepeatTomon(!repeatTomon);
          }}
          aria-label="تكرار الثمن 10 مرات"
          title="تكرار الثمن 10 مرات"
        >
          <span>
            تكرار الثمن{" "}
            {repeatTomon
              ? `(${repeatDisplay + 1}/${REPEAT_MAX})`
              : `(${REPEAT_MAX}×)`}
          </span>
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
          disabled={!isCurrentTrackCached && !isStable && isChecking}
        >
          {isChecking && !isCurrentTrackCached ? "🔄" : isPlaying ? "⏸" : "▶"}
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
