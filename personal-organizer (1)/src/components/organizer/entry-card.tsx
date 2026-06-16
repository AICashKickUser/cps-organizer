'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  Pencil,
  Trash2,
  MapPin,
  Users,
  Clock,
  Paperclip,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Camera,
  FileText,
  PenLine,
  StickyNote,
  UsersRound,
  Mail,
  MessageSquare,
  CircleDot,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { ENTRY_TYPE_CONFIG, PRIORITY_CONFIG, isImageType } from '@/lib/types';
import { clientDb } from '@/lib/client-db';

const ICON_MAP: Record<string, React.ElementType> = {
  Phone,
  Camera,
  FileText,
  PenLine,
  StickyNote,
  UsersRound,
  Mail,
  MessageSquare,
  CircleDot,
};

const CALL_TYPE_ICON: Record<string, React.ElementType> = {
  incoming: PhoneIncoming,
  outgoing: PhoneOutgoing,
  missed: PhoneMissed,
};

interface EntryCardProps {
  entry: TimelineEntry;
}

export function EntryCard({ entry }: EntryCardProps) {
  const {
    setSelectedEntryId,
    setEditingEntry,
    removeEntry,
  } = useOrganizerStore();

  const typeConfig = ENTRY_TYPE_CONFIG[entry.type];
  const priorityConfig = PRIORITY_CONFIG[entry.priority];
  const TypeIcon = ICON_MAP[typeConfig.icon] || CircleDot;

  const firstImage = entry.attachments.find((a) => isImageType(a.mimeType));
  const imageCount = entry.attachments.filter((a) => isImageType(a.mimeType)).length;
  const nonImageCount = entry.attachments.filter((a) => !isImageType(a.mimeType)).length;

  const tags = entry.tags ? entry.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

  // Blob URL management for image thumbnails
  const blobUrlsRef = useRef<Map<string, string>>(new Map());
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  useEffect(() => {
    if (firstImage) {
      const attId = firstImage.id;
      // Check if we already have a URL cached
      const cached = blobUrlsRef.current.get(attId);
      if (cached) {
        setThumbUrl(cached);
        return;
      }

      let cancelled = false;
      clientDb.getAttachmentBlob(attId).then(({ thumbnail, blob }) => {
        if (cancelled) return;
        const url = thumbnail
          ? URL.createObjectURL(thumbnail)
          : blob
            ? URL.createObjectURL(blob)
            : null;
        if (url) {
          blobUrlsRef.current.set(attId, url);
          setThumbUrl(url);
        }
      }).catch(() => {});

      return () => { cancelled = true; };
    } else {
      setThumbUrl(null);
    }
  }, [firstImage?.id]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    const urls = blobUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  const handleStarToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStarred = !entry.isStarred;
    clientDb.updateEntry(entry.id, { isStarred: newStarred }).then((updated) => {
      useOrganizerStore.getState().updateEntry(updated);
    }).catch(() => {});
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEntry(entry);
  };

  const handleDelete = async () => {
    await clientDb.deleteEntry(entry.id);
    removeEntry(entry.id);
  };

  const handleCardClick = () => {
    setSelectedEntryId(entry.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={(e) => { if (e.key === 'Enter') handleCardClick(); }}
        className="group relative rounded-lg border bg-card p-3 sm:p-4 shadow-sm transition-all hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
      >
        {/* Top row: type badge + actions */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className={`${typeConfig.color} text-[11px] font-medium gap-1`}>
              <TypeIcon className="size-3" />
              {typeConfig.label}
            </Badge>
            {entry.priority !== 'normal' && (
              <Badge variant="secondary" className={`${priorityConfig.color} text-[10px]`}>
                {priorityConfig.label}
              </Badge>
            )}
            {entry.callType && CALL_TYPE_ICON[entry.callType] && (
              <Badge variant="secondary" className="text-[10px] gap-1 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                {(() => { const CI = CALL_TYPE_ICON[entry.callType]; return <CI className="size-3" /> })()}
                {entry.callType}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={handleEdit}
            >
              <Pencil className="size-3.5" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Entry</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete &quot;{entry.title}&quot;? This action cannot be undone.
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
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-sm sm:text-base leading-tight mb-1 line-clamp-2">
          {entry.title}
        </h3>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mb-2">
          {entry.entryTime && (
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {entry.entryTime}
              {entry.duration && <span className="text-muted-foreground/70">({entry.duration})</span>}
            </span>
          )}
          {entry.location && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3" />
              <span className="truncate max-w-[150px]">{entry.location}</span>
            </span>
          )}
          {entry.people && (
            <span className="flex items-center gap-1">
              <Users className="size-3" />
              <span className="truncate max-w-[150px]">{entry.people}</span>
            </span>
          )}
          {entry.phoneNumber && (
            <span className="flex items-center gap-1">
              <Phone className="size-3" />
              <span>{entry.phoneNumber}</span>
            </span>
          )}
        </div>

        {/* Description */}
        {entry.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2">
            {entry.description}
          </p>
        )}

        {/* Thumbnail + Attachments */}
        {(thumbUrl || entry.attachments.length > 0) && (
          <div className="flex items-center gap-2 mt-1">
            {firstImage && thumbUrl && (
              <div className="size-12 sm:size-14 rounded-md overflow-hidden border bg-muted flex-shrink-0">
                <img
                  src={thumbUrl}
                  alt={firstImage.originalName}
                  className="size-full object-cover"
                />
              </div>
            )}
            {entry.attachments.length > 0 && (
              <Badge variant="secondary" className="text-[10px] gap-1">
                <Paperclip className="size-3" />
                {entry.attachments.length}
                {imageCount > 0 && ` (${imageCount} photo${imageCount > 1 ? 's' : ''})`}
                {nonImageCount > 0 && ` ${nonImageCount} file${nonImageCount > 1 ? 's' : ''}`}
              </Badge>
            )}
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px] font-normal py-0 px-1.5 gap-0.5">
                <Tag className="size-2.5" />
                {tag}
              </Badge>
            ))}
            {tags.length > 4 && (
              <Badge variant="outline" className="text-[10px] font-normal py-0 px-1.5">
                +{tags.length - 4}
              </Badge>
            )}
          </div>
        )}

        {/* Star toggle - bottom right */}
        <Button
          variant="ghost"
          size="icon"
          className={`absolute bottom-2 right-2 size-7 ${
            entry.isStarred
              ? 'text-amber-500 hover:text-amber-600 opacity-100'
              : 'text-muted-foreground/40 hover:text-amber-500 opacity-0 group-hover:opacity-100'
          } transition-all`}
          onClick={handleStarToggle}
        >
          <Star className={`size-3.5 ${entry.isStarred ? 'fill-current' : ''}`} />
        </Button>
      </div>
    </motion.div>
  );
}
