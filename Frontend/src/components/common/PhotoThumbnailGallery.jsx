import { useState } from "react";
import { Expand } from "lucide-react";
import PhotoLightboxModal from "./PhotoLightboxModal";
import { resolveFileUrl } from "../../utils/formatters";

// Talep fotoğrafları için ortak thumbnail galerisi + lightbox. attachments:
// [{ id, fileUrl, originalName }]. Kare, eşit boyutlu thumbnail'lar; tıklayınca
// aynı sayfada (yeni sekme açmadan) büyütülmüş önizleme açılır.
const PhotoThumbnailGallery = ({ attachments }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  if (!attachments?.length) return null;

  const photos = attachments.map((attachment) => ({
    id: attachment.id,
    url: resolveFileUrl(attachment.fileUrl),
    name: attachment.originalName,
  }));

  return (
    <>
      <div className="flex flex-wrap gap-2.5">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`${photo.name} fotoğrafını büyüt`}
            className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-navy-700/40"
          >
            <img
              src={photo.url}
              alt={photo.name}
              className="h-full w-full object-cover transition group-hover:scale-105 group-hover:brightness-90"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-slate-900/0 text-white opacity-0 transition group-hover:bg-slate-900/20 group-hover:opacity-100">
              <Expand className="h-4 w-4" />
            </span>
          </button>
        ))}
      </div>

      <PhotoLightboxModal
        photos={photos}
        activeIndex={activeIndex}
        onClose={() => setActiveIndex(null)}
        onNavigate={setActiveIndex}
      />
    </>
  );
};

export default PhotoThumbnailGallery;
