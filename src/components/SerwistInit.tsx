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
          (window as any).serwist = serwist;

          const registration = await serwist.register();

          if (registration) {
            // Check for updates every 60 minutes
            setInterval(() => {
              registration.update();
            }, 60 * 60 * 1000);

            // Also check for updates when the page is refocused
            window.addEventListener("focus", () => {
              registration.update();
            });
          }

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
