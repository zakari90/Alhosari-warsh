"use client";

import { useEffect } from "react";

export default function SerwistInit() {
  useEffect(() => {
    if ("serviceWorker" in navigator && typeof window !== "undefined") {
      const registerSerwist = async () => {
        try {
          // @ts-ignore
          const { Serwist } = await import("@serwist/window");
          const serwist = new Serwist("/sw.js", { scope: "/" });

          // Expose to window for PwaUpdater
          (window as any).serwist = serwist;

          await serwist.register();
          console.log("Serwist Service Worker registered successfully");
        } catch (error) {
          console.error("Serwist Service Worker registration failed:", error);
        }
      };

      registerSerwist();
    }
  }, []);

  return null;
}
