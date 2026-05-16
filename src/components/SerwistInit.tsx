"use client";

import { useEffect, useState } from "react";

export default function SerwistInit() {
  const [error, setError] = useState<string | null>(null);

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
          console.log("🚀 Serwist Service Worker registered successfully");
        } catch (err: any) {
          console.error("❌ Serwist Service Worker registration failed:", err);
          setError(err?.message || "Registration failed");
        }
      };

      registerSerwist();
    }
  }, []);

  if (!error) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: "#fee2e2",
        color: "#b91c1c",
        padding: "8px",
        textAlign: "center",
        zIndex: 9999,
        fontSize: "12px",
        borderBottom: "1px solid #f87171",
      }}
    >
      SW Error: {error}
    </div>
  );
}
