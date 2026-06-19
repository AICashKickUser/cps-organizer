'use client';

import { useEffect, useState } from 'react';
import { Plus, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilterBar } from '@/components/organizer/filter-bar';
import { EntryForm } from '@/components/organizer/entry-form';
import { EntryDetail } from '@/components/organizer/entry-detail';
import { ImageLightbox } from '@/components/organizer/image-lightbox';
import { TimelineView } from '@/components/organizer/timeline-view';
import { StatsBar } from '@/components/organizer/stats-bar';
import { useOrganizerStore } from '@/store/organizer-store';
import { PinLock } from '@/components/pin-lock';
import { clientDb } from '@/lib/client-db';

function OrganizerApp() {
  const { setEntries, setLoading, setIsFormOpen } = useOrganizerStore();

  // Load entries from IndexedDB on mount
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    clientDb.getAllEntries().then((entries) => {
      if (mounted) {
        setEntries(entries);
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [setEntries, setLoading]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="size-8 sm:size-9 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Shield className="size-4 sm:size-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg leading-tight">Personal Organizer</h1>
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">
                Evidence &amp; Activity Timeline
              </p>
            </div>
          </div>
          <Button onClick={() => setIsFormOpen(true)} className="gap-1.5 sm:gap-2">
            <Plus className="size-4" />
            <span className="hidden sm:inline">New Entry</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <StatsBar />
        <FilterBar />
        <TimelineView />
      </main>

      {/* Dialogs / Sheets */}
      <EntryForm />
      <EntryDetail />
      <ImageLightbox />
    </div>
  );
}

export default function Home() {
  const [isLocked, setIsLocked] = useState(true);

  if (isLocked) {
    return <PinLock onUnlocked={() => setIsLocked(false)} />;
  }

  return <OrganizerApp />;
}
