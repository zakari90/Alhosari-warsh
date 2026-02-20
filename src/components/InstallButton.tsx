"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallButton() {
  const [canInstall, setCanInstall] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Hide button if app is already installed
    window.addEventListener("appinstalled", () => {
      setCanInstall(false);
      deferredPrompt.current = null;
    });

    // Check if already in standalone mode
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setCanInstall(false);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt.current) return;
    await deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === "accepted") {
      setCanInstall(false);
    }
    deferredPrompt.current = null;
  }, []);

  if (!canInstall) return null;

  return (
    <button
      className="install-btn"
      onClick={handleInstall}
      aria-label="تثبيت التطبيق"
    >
      📲 تثبيت
    </button>
  );
}
