'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Star,
  Pencil,
  Trash2,
  MapPin,
  Users,
  Clock,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Download,
  ExternalLink,
  Image as ImageIcon,
  File,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useOrganizerStore } from '@/store/organizer-store';
import type { TimelineEntry } from '@/lib/types';
import { ENTRY_TYPE_CONFIG, PRIORITY_CONFIG, isImageType, formatFileSize } from '@/lib/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { clientDb } from '@/lib/client-db';

const CALL_TYPE_ICON: Record<string, React.ElementType> = {
  incoming: PhoneIncoming,
  outgoing: PhoneOutgoing,
  missed: PhoneMissed,
};

export function EntryDetail() {
  const isMobile = useIsMobile();
  const {
    entries,
    selectedEntryId,
    setSelectedEntryId,
    setEditingEntry,
    removeEntry,
    setImageLightbox,
  } = useOrganizerStore();

  const entry = entries.find((e) => e.id === selectedEntryId) || null;

  // Blob URL management for image thumbnails
  const blobUrlsRef = useRef<Map<string, string>>(new Map());
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});

  // Load blob URLs when entry changes
  useEffect(() => {
    if (!entry) return;

    // Cleanup previous URLs
    blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    blobUrlsRef.current.clear();

    const images = entry.attachments.filter((a) => isImageType(a.mimeType));
    const nonImages = entry.attachments.filter((a) => !isImageType(a.mimeType));
    const newImageUrls: Record<string, string> = {};
    const newFileUrls: Record<string, string> = {};
    const promises: Promise<void>[] = [];

    for (const att of images) {
      const attId = att.id;
      promises.push(
        clientDb.getAttachmentBlob(attId).then(({ thumbnail, blob }) => {
          const url = thumbnail
            ? URL.createObjectURL(thumbnail)
            : blob
              ? URL.createObjectURL(blob)
              : null;
          if (url) {
            blobUrlsRef.current.set(attId, url);
            newImageUrls[attId] = url;
          }
        }).catch(() => {})
      );
    }

    for (const att of nonImages) {
      const attId = att.id;
      promises.push(
        clientDb.getAttachmentBlob(attId).then(({ blob }) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            blobUrlsRef.current.set(attId, url);
            newFileUrls[attId] = url;
          }
        }).catch(() => {})
      );
    }

    Promise.all(promises).then(() => {
      setImageUrls(newImageUrls);
      setFileUrls(newFileUrls);
    });
  }, [entry?.id, entry?.attachments]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    const urls = blobUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  const handleClose = () => {
    setSelectedEntryId(null);
  };

  const handleStarToggle = async () => {
    if (!entry) return;
    const updated = await clientDb.updateEntry(entry.id, { isStarred: !entry.isStarred });
    useOrganizerStore.getState().updateEntry(updated);
  };

  const handleEdit = () => {
    if (!entry) return;
    setEditingEntry(entry);
    setSelectedEntryId(null);
  };

  const handleDelete = async () => {
    if (!entry) return;
    await clientDb.deleteEntry(entry.id);
    removeEntry(entry.id);
    setSelectedEntryId(null);
  };

  const handleDownloadFile = useCallback(async (attId: string, originalName: string) => {
    const url = fileUrls[attId];
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = originalName;
      link.click();
    }
  }, [fileUrls]);

  const images = entry?.attachments.filter((a) => isImageType(a.mimeType)) || [];
  const nonImages = entry?.attachments.filter((a) => !isImageType(a.mimeType)) || [];

  if (!entry) return null;

  const typeConfig = ENTRY_TYPE_CONFIG[entry.type];
  const priorityConfig = PRIORITY_CONFIG[entry.priority];
  const tags = entry.tags ? entry.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

  const content = (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Badge className={`${typeConfig.color} text-xs font-medium shrink-0`}>
          {typeConfig.label}
        </Badge>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-lg leading-tight">{entry.title}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {format(parseISO(entry.entryDate), 'EEEE, MMMM d, yyyy')}
            {entry.entryTime && <> at {entry.entryTime}</>}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={handleEdit}
          >
            <Pencil className="size-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 text-destructive">
                <Trash2 className="size-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Entry</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &quot;{entry.title}&quot;?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            variant="ghost"
            size="icon"
            className={`size-8 ${entry.isStarred ? 'text-amber-500' : 'text-muted-foreground'}`}
            onClick={handleStarToggle}
          >
            <Star className={`size-4 ${entry.isStarred ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {entry.priority !== 'normal' && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={`${priorityConfig.color} text-[11px]`}>
              {priorityConfig.label} Priority
            </Badge>
          </div>
        )}
        {entry.duration && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="size-3.5" />
            {entry.duration}
          </div>
        )}
        {entry.location && (
          <div className="flex items-center gap-2 text-muted-foreground col-span-full">
            <MapPin className="size-3.5 shrink-0" />
            {entry.location}
          </div>
        )}
        {entry.people && (
          <div className="flex items-center gap-2 text-muted-foreground col-span-full">
            <Users className="size-3.5 shrink-0" />
            {entry.people}
          </div>
        )}
        {entry.phoneNumber && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="size-3.5" />
            {entry.phoneNumber}
          </div>
        )}
        {entry.callType && CALL_TYPE_ICON[entry.callType] && (
          <div className="flex items-center gap-2 text-muted-foreground">
            {(() => {
              const CI = CALL_TYPE_ICON[entry.callType!];
              return <CI className="size-3.5" />;
            })()}
            {entry.callType}
          </div>
        )}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs font-normal gap-1">
              <Tag className="size-3" />
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Description */}
      {entry.description && (
        <div>
          <h4 className="text-sm font-medium mb-1.5">Description</h4>
          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap bg-muted/30 rounded-lg p-3">
            {entry.description}
          </div>
        </div>
      )}

      {/* Image Gallery */}
      {images.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Photos ({images.length})</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {images.map((att, index) => (
              <button
                key={att.id}
                onClick={() => setImageLightbox({ entryId: entry.id, index })}
                className="relative aspect-square rounded-lg overflow-hidden border bg-muted group"
              >
                <img
                  src={imageUrls[att.id] || ''}
                  alt={att.originalName}
                  className="size-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <ImageIcon className="size-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Other attachments */}
      {nonImages.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Files ({nonImages.length})</h4>
          <div className="flex flex-col gap-1.5">
            {nonImages.map((att) => (
              <button
                key={att.id}
                type="button"
                onClick={() => handleDownloadFile(att.id, att.originalName)}
                className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30 hover:bg-muted transition-colors text-sm group text-left w-full"
              >
                <File className="size-4 text-muted-foreground shrink-0" />
                <span className="flex-1 truncate">{att.originalName}</span>
                <span className="text-xs text-muted-foreground">{formatFileSize(att.fileSize)}</span>
                <Download className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer info */}
      <Separator />
      <p className="text-[11px] text-muted-foreground/60">
        Created {format(parseISO(entry.createdAt), 'MMM d, yyyy h:mm a')}
        {entry.updatedAt !== entry.createdAt && (
          <> · Updated {format(parseISO(entry.updatedAt), 'MMM d, yyyy h:mm a')}</>
        )}
      </p>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={!!selectedEntryId} onOpenChange={(open) => { if (!open) handleClose(); }}>
        <SheetContent side="bottom" className="max-h-[90vh]">
          <SheetHeader>
            <SheetTitle className="text-left">Entry Details</SheetTitle>
            <SheetDescription className="text-left sr-only">View entry details</SheetDescription>
          </SheetHeader>
          <ScrollArea className="max-h-[calc(90vh-100px)] px-4 pb-4">
            {content}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={!!selectedEntryId} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-left">Entry Details</SheetTitle>
          <SheetDescription className="text-left sr-only">View entry details</SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 -mx-6 px-6 pb-4">
          {content}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
