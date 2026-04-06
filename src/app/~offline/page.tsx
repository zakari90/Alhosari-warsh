"use client";

import React from "react";

export default function OfflinePage() {
  return (
    <main
      className="app-main"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "70vh",
        textAlign: "center",
        gap: "1rem",
      }}
    >
      <div
        className="header-ornament"
        style={{ fontSize: "3.5rem", marginBottom: "1.5rem" }}
      >
        ﷽
      </div>
      <h1
        className="app-title"
        style={{ fontSize: "2rem", marginBottom: "0.5rem" }}
      >
        أنت غير متصل بالإنترنت
      </h1>
      <p
        className="app-subtitle"
        style={{
          fontSize: "1.1rem",
          maxWidth: "400px",
          lineHeight: "1.6",
          marginBottom: "2rem",
        }}
      >
        يبدو أنك تحاول الوصول إلى صفحة غير محفوظة.
        <br />
        انقر أدناه للعودة إلى الصفحة الرئيسية المحفوظة في وضع عدم الاتصال.
      </p>
      <button
        style={{
          padding: "0.85rem 2rem",
          background: "linear-gradient(135deg, var(--gold-primary), var(--gold-dark))",
          color: "var(--bg-primary)",
          border: "none",
          borderRadius: "14px",
          fontWeight: "bold",
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: "1.1rem",
          boxShadow: "0 4px 16px var(--gold-glow)",
        }}
        onClick={() => (window.location.href = "/")}
      >
        العودة للرئيسية
      </button>
    </main>
  );
}
