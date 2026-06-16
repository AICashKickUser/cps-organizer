'use client';

import { motion } from 'framer-motion';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { CalendarDays, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EntryCard } from '@/components/organizer/entry-card';
import { useOrganizerStore } from '@/store/organizer-store';

export function TimelineView() {
  const { entries, isLoading, getGroupedEntries, setIsFormOpen } = useOrganizerStore();
  const groupedEntries = getGroupedEntries();

  const formatDateLabel = (dateStr: string, label: string): string => {
    const date = parseISO(dateStr);
    if (isToday(date)) return `Today · ${format(date, 'MMMM d, yyyy')}`;
    if (isYesterday(date)) return `Yesterday · ${format(date, 'MMMM d, yyyy')}`;
    return label;
  };

  // Empty state
  if (!isLoading && entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <div className="size-20 rounded-full bg-muted flex items-center justify-center">
            <CalendarDays className="size-10 text-muted-foreground" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-semibold text-lg">No entries yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Start building your evidence and activity timeline. Add your first entry to begin documenting.
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)} className="gap-2 mt-2">
            <Plus className="size-4" />
            Add Your First Entry
          </Button>
        </motion.div>
      </div>
    );
  }

  // Filtered empty state
  if (!isLoading && groupedEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-3 text-center"
        >
          <div className="size-16 rounded-full bg-muted flex items-center justify-center">
            <CalendarDays className="size-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="font-medium">No matching entries</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or search terms.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsFormOpen(true)} className="gap-1.5 mt-1">
            <Plus className="size-3.5" />
            New Entry
          </Button>
        </motion.div>
      </div>
    );
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 mb-6">
            <div className="flex flex-col items-center">
              <div className="size-3 rounded-full bg-muted animate-pulse" />
              <div className="w-0.5 flex-1 bg-muted animate-pulse mt-1" />
            </div>
            <div className="flex-1 space-y-3">
              <div className="h-5 w-48 bg-muted rounded animate-pulse" />
              <div className="h-24 bg-muted rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {groupedEntries.map((group, groupIdx) => (
        <motion.div
          key={group.date}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: groupIdx * 0.05 }}
          className="mb-8"
        >
          {/* Sticky date header */}
          <div className="sticky top-0 z-10 -mx-4 px-4 py-2 bg-background/90 backdrop-blur-sm border-b border-t border-border/50">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-emerald-500" />
              <h2 className="font-semibold text-sm tracking-wide text-foreground/80 uppercase">
                {formatDateLabel(group.date, group.label)}
              </h2>
              <span className="text-xs text-muted-foreground ml-1">
                ({group.entries.length})
              </span>
            </div>
          </div>

          {/* Timeline entries */}
          <div className="relative mt-4 ml-4 sm:ml-6">
            {/* Vertical timeline line */}
            <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />

            <div className="flex flex-col gap-4">
              {group.entries.map((entry) => (
                <div key={entry.id} className="relative pl-6 sm:pl-8">
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-4 -translate-x-1/2 size-2.5 rounded-full border-2 border-emerald-400 bg-background z-[1]" />

                  <EntryCard entry={entry} />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
