import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, ImageOff, X } from "lucide-react";
import Tooltip from "./Tooltip";

// Talep fotoğrafları için tam sayfa değil, ekranı kaplamayan responsive bir
// önizleme (lightbox). Arka plana tıklama ve Escape kapatır; fotoğrafın
// kendisine tıklamak kapatmaz. Açıkken body scroll'u kilitlenir.
const PhotoLightboxModal = ({ photos, activeIndex, onClose, onNavigate }) => {
  const [hasError, setHasError] = useState(false);

  const isOpen = activeIndex !== null && activeIndex !== undefined;
  const photo = isOpen ? photos[activeIndex] : null;
  const hasMultiple = photos.length > 1;

  useEffect(() => {
    setHasError(false);
  }, [activeIndex]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowLeft" && hasMultiple) {
        onNavigate((activeIndex - 1 + photos.length) % photos.length);
      } else if (event.key === "ArrowRight" && hasMultiple) {
        onNavigate((activeIndex + 1) % photos.length);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, activeIndex, hasMultiple, photos.length, onClose, onNavigate]);

  if (!isOpen || !photo) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/80 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Fotoğraf önizleme: ${photo.name}`}
    >
      <Tooltip content="Kapat">
        <button
          type="button"
          onClick={onClose}
          aria-label="Kapat"
          className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>
      </Tooltip>

      {hasMultiple && (
        <Tooltip content="Önceki fotoğraf">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onNavigate((activeIndex - 1 + photos.length) % photos.length);
            }}
            aria-label="Önceki fotoğraf"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:left-4"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        </Tooltip>
      )}

      {hasMultiple && (
        <Tooltip content="Sonraki fotoğraf">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onNavigate((activeIndex + 1) % photos.length);
            }}
            aria-label="Sonraki fotoğraf"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:right-4"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </Tooltip>
      )}

      <div
        className="flex max-h-[85vh] max-w-[90vw] flex-col items-center gap-3"
        onClick={(event) => event.stopPropagation()}
      >
        {hasError ? (
          <div className="flex h-64 w-64 max-w-full flex-col items-center justify-center gap-2 rounded-lg bg-white/10 text-white">
            <ImageOff className="h-8 w-8" />
            <p className="text-sm">Görsel yüklenemedi.</p>
          </div>
        ) : (
          <img
            src={photo.url}
            alt={photo.name}
            onError={() => setHasError(true)}
            className="max-h-[75vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
          />
        )}

        {hasMultiple && (
          <p className="text-xs font-medium text-white/70">
            {activeIndex + 1} / {photos.length} · {photo.name}
          </p>
        )}
      </div>
    </div>,
    document.body
  );
};

export default PhotoLightboxModal;
