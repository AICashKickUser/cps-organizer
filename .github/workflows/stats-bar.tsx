'use client';

import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import {
  BarChart3,
  Star,
  CalendarDays,
  ListOrdered,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useOrganizerStore } from '@/store/organizer-store';
import { ENTRY_TYPE_CONFIG } from '@/lib/types';

export function StatsBar() {
  const { entries, startDate, endDate } = useOrganizerStore();

  const stats = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    let starredCount = 0;

    for (const entry of entries) {
      typeCounts[entry.type] = (typeCounts[entry.type] || 0) + 1;
      if (entry.isStarred) starredCount++;
    }

    const topTypes = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return {
      total: entries.length,
      starredCount,
      topTypes,
    };
  }, [entries]);

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2">
      {/* Total entries */}
      <div className="flex items-center gap-1.5 bg-muted/50 rounded-md px-2.5 py-1.5">
        <ListOrdered className="size-3.5 text-emerald-600" />
        <span className="text-xs font-medium">{stats.total}</span>
        <span className="text-xs text-muted-foreground">entries</span>
      </div>

      {/* Starred */}
      {stats.starredCount > 0 && (
        <div className="flex items-center gap-1.5 bg-muted/50 rounded-md px-2.5 py-1.5">
          <Star className="size-3.5 text-amber-500 fill-amber-500" />
          <span className="text-xs font-medium">{stats.starredCount}</span>
          <span className="text-xs text-muted-foreground">starred</span>
        </div>
      )}

      {/* Top types */}
      {stats.topTypes.map(([type, count]) => {
        const config = ENTRY_TYPE_CONFIG[type as keyof typeof ENTRY_TYPE_CONFIG];
        if (!config) return null;
        return (
          <Badge
            key={type}
            variant="secondary"
            className={`${config.color} text-[11px] gap-1`}
          >
            {config.label}
            <span className="font-bold">{count}</span>
          </Badge>
        );
      })}

      {/* Date range */}
      <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground hidden sm:flex">
        <CalendarDays className="size-3" />
        <span>
          {format(parseISO(startDate), 'MMM d')} – {format(parseISO(endDate), 'MMM d, yyyy')}
        </span>
      </div>
    </div>
  );
}
