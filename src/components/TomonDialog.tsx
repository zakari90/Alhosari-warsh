"use client";

import { useEffect, useRef } from "react";
import { TOMON_PER_HIZB, TOMON_LABELS } from "@/lib/quran-data";

interface TomonDialogProps {
  hizb: number | null;
  onSelectTomon: (hizb: number, tomon: number) => void;
  onClose: () => void;
}

export default function TomonDialog({
  hizb,
  onSelectTomon,
  onClose,
}: TomonDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (hizb !== null) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [hizb]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="tomon-dialog"
      onClick={handleBackdropClick}
      onClose={onClose}
    >
      {hizb !== null && (
        <div className="tomon-dialog-content">
          <div className="tomon-dialog-header">
            <h2>الحزب {hizb}</h2>
            <span className="tomon-dialog-subtitle">اختر الثُمن</span>
            <button
              className="tomon-close-btn"
              onClick={onClose}
              aria-label="إغلاق"
            >
              ✕
            </button>
          </div>
          <div className="tomon-grid">
            {Array.from({ length: TOMON_PER_HIZB }, (_, i) => i + 1).map(
              (tomon) => (
                <button
                  key={tomon}
                  className="tomon-card"
                  onClick={() => {
                    onSelectTomon(hizb, tomon);
                    onClose();
                  }}
                >
                  <span className="tomon-number">{tomon}</span>
                  <span className="tomon-label">{TOMON_LABELS[tomon - 1]}</span>
                </button>
              ),
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}
