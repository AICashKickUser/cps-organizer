'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useOrganizerStore } from '@/store/organizer-store';
import { isImageType } from '@/lib/types';
import { clientDb } from '@/lib/client-db';

export function ImageLightbox() {
  const { entries, imageLightbox, setImageLightbox } = useOrganizerStore();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const handleClose = useCallback(() => {
    setImageLightbox(null);
  }, [setImageLightbox]);

  // Load blob URL for current image
  useEffect(() => {
    if (!imageLightbox) {
      // Cleanup when lightbox closes
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      return;
    }

    const entry = entries.find((e) => e.id === imageLightbox.entryId);
    if (!entry) return;

    const images = entry.attachments.filter((a) => isImageType(a.mimeType));
    const currentImage = images[imageLightbox.index];
    if (!currentImage) return;

    const attId = currentImage.id;

    // Cleanup previous URL
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    let cancelled = false;
    clientDb.getAttachmentBlob(attId).then(({ blob }) => {
      if (cancelled || !blob) return;
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      setImageUrl(url);
    }).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [entries, imageLightbox?.entryId, imageLightbox?.index]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  if (!imageLightbox) return null;

  const entry = entries.find((e) => e.id === imageLightbox.entryId);
  if (!entry) return null;

  const images = entry.attachments.filter((a) => isImageType(a.mimeType));
  if (images.length === 0) return null;

  const currentImage = images[imageLightbox.index];
  if (!currentImage) return null;

  const goToPrev = () => {
    const newIndex = imageLightbox.index > 0 ? imageLightbox.index - 1 : images.length - 1;
    setImageLightbox({ ...imageLightbox, index: newIndex });
  };

  const goToNext = () => {
    const newIndex = imageLightbox.index < images.length - 1 ? imageLightbox.index + 1 : 0;
    setImageLightbox({ ...imageLightbox, index: newIndex });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrev();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'Escape') handleClose();
  };

  const handleDownload = () => {
    if (!imageUrl || !currentImage) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = currentImage.originalName;
    link.click();
  };

  return (
    <Dialog open={!!imageLightbox} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent
        className="max-w-[95vw] max-h-[95vh] bg-black/95 border-white/10 p-0 overflow-hidden sm:max-w-[90vw]"
        showCloseButton={false}
        onKeyDown={handleKeyDown}
      >
        <DialogTitle className="sr-only">Image Viewer</DialogTitle>
        <DialogDescription className="sr-only">Viewing image {imageLightbox.index + 1} of {images.length}</DialogDescription>

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 size-8 text-white/70 hover:text-white hover:bg-white/10"
          onClick={handleClose}
        >
          <X className="size-5" />
        </Button>

        {/* Image counter */}
        <div className="absolute top-3 left-3 z-10 bg-black/50 text-white/80 text-xs px-2 py-1 rounded-full">
          {imageLightbox.index + 1} / {images.length}
        </div>

        {/* Main content */}
        <div className="flex items-center justify-center size-full min-h-[60vh] relative">
          {/* Prev button */}
          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 z-10 size-10 text-white/70 hover:text-white hover:bg-white/10"
              onClick={goToPrev}
            >
              <ChevronLeft className="size-6" />
            </Button>
          )}

          {/* Image */}
          <div className="flex items-center justify-center w-full h-full p-4">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={currentImage.originalName}
                className="max-w-full max-h-[85vh] object-contain rounded-sm"
              />
            ) : (
              <div className="text-white/50 text-sm">Loading...</div>
            )}
          </div>

          {/* Next button */}
          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 z-10 size-10 text-white/70 hover:text-white hover:bg-white/10"
              onClick={goToNext}
            >
              <ChevronRight className="size-6" />
            </Button>
          )}
        </div>

        {/* Bottom bar */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-4 flex items-end justify-between">
          <div className="text-white/80 text-sm truncate mr-4">
            {currentImage.originalName}
            {currentImage.width && currentImage.height && (
              <span className="text-white/50 ml-2">
                {currentImage.width}×{currentImage.height}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/10 gap-1.5"
              onClick={handleDownload}
            >
              <Download className="size-4" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
