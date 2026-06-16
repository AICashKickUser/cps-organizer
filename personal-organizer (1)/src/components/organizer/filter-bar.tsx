'use client';

import { useState, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Search,
  Star,
  Download,
  Filter,
  CalendarDays,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { useOrganizerStore } from '@/store/organizer-store';
import { useIsMobile } from '@/hooks/use-mobile';
import type { EntryType, Priority } from '@/lib/types';
import { ENTRY_TYPE_CONFIG, PRIORITY_CONFIG } from '@/lib/types';
import { clientDb } from '@/lib/client-db';

function FilterSheetContent() {
  const {
    filterSearch,
    filterType,
    filterPriority,
    filterStarred,
    startDate,
    endDate,
    setFilterSearch,
    setFilterType,
    setFilterPriority,
    setFilterStarred,
    setStartDate,
    setEndDate,
  } = useOrganizerStore();

  const hasActiveFilters = filterSearch || filterType || filterPriority || filterStarred;

  const clearFilters = useCallback(() => {
    setFilterSearch('');
    setFilterType(null);
    setFilterPriority(null);
    setFilterStarred(false);
    setStartDate(format(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), 'yyyy-MM-dd'));
    setEndDate(format(new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0), 'yyyy-MM-dd'));
  }, [setFilterSearch, setFilterType, setFilterPriority, setFilterStarred, setStartDate, setEndDate]);

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Search title, description, people, location..."
          value={filterSearch}
          onChange={(e) => setFilterSearch(e.target.value)}
          className="pl-8 w-full"
        />
      </div>

      {/* Type filter */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Type</Label>
        <Select
          value={filterType || 'all'}
          onValueChange={(v) => setFilterType(v === 'all' ? null : v as EntryType)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <Separator className="my-1" />
            {Object.entries(ENTRY_TYPE_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Priority filter */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Priority</Label>
        <Select
          value={filterPriority || 'all'}
          onValueChange={(v) => setFilterPriority(v === 'all' ? null : v as Priority)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <Separator className="my-1" />
            {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Starred toggle */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="filter-starred"
          checked={filterStarred}
          onCheckedChange={(checked) => setFilterStarred(!!checked)}
        />
        <Label htmlFor="filter-starred" className="flex items-center gap-1.5 cursor-pointer">
          <Star className="size-3.5 text-amber-500" />
          Starred only
        </Label>
      </div>

      <Separator />

      {/* Date range */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Date Range</Label>
        <div className="grid grid-cols-2 gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-start text-xs font-normal">
                <CalendarDays className="mr-1.5 size-3.5" />
                {startDate ? format(parseISO(startDate), 'MMM d') : 'Start'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate ? parseISO(startDate) : undefined}
                onSelect={(date) => {
                  if (date) setStartDate(format(date, 'yyyy-MM-dd'));
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-start text-xs font-normal">
                <CalendarDays className="mr-1.5 size-3.5" />
                {endDate ? format(parseISO(endDate), 'MMM d') : 'End'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate ? parseISO(endDate) : undefined}
                onSelect={(date) => {
                  if (date) setEndDate(format(date, 'yyyy-MM-dd'));
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {hasActiveFilters && (
        <>
          <Separator />
          <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full">
            <X className="mr-1.5 size-3.5" />
            Clear Filters
          </Button>
        </>
      )}
    </div>
  );
}

export function FilterBar() {
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);

  const {
    filterSearch,
    filterType,
    filterPriority,
    filterStarred,
    startDate,
    endDate,
    setFilterSearch,
    setFilterType,
    setFilterPriority,
    setFilterStarred,
    setStartDate,
    setEndDate,
  } = useOrganizerStore();

  const handleExport = useCallback(async (fmt: 'json' | 'csv') => {
    let content: string;
    let mimeType: string;
    let ext: string;
    if (fmt === 'json') {
      content = await clientDb.exportJSON();
      mimeType = 'application/json';
      ext = 'json';
    } else {
      content = await clientDb.exportCSV();
      mimeType = 'text/csv';
      ext = 'csv';
    }
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `timeline-export.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  const hasActiveFilters = filterSearch || filterType || filterPriority || filterStarred;

  const clearFilters = useCallback(() => {
    setFilterSearch('');
    setFilterType(null);
    setFilterPriority(null);
    setFilterStarred(false);
    setStartDate(format(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), 'yyyy-MM-dd'));
    setEndDate(format(new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0), 'yyyy-MM-dd'));
  }, [setFilterSearch, setFilterType, setFilterPriority, setFilterStarred, setStartDate, setEndDate]);

  if (isMobile) {
    return (
      <div className="flex items-center gap-2 px-4 py-2">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Filter className="size-3.5" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-[10px]">!</Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <FilterSheetContent />
          </SheetContent>
        </Sheet>

        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0">
              <Download className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleExport('json')}>
              Export JSON
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('csv')}>
              Export CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-2">
      <div className="relative w-full sm:w-64 lg:w-72">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Search title, description, people, location..."
          value={filterSearch}
          onChange={(e) => setFilterSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      <Select
        value={filterType || 'all'}
        onValueChange={(v) => setFilterType(v === 'all' ? null : v as EntryType)}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <Separator className="my-1" />
          {Object.entries(ENTRY_TYPE_CONFIG).map(([key, config]) => (
            <SelectItem key={key} value={key}>
              {config.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filterPriority || 'all'}
        onValueChange={(v) => setFilterPriority(v === 'all' ? null : v as Priority)}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="All Priorities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          <Separator className="my-1" />
          {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
            <SelectItem key={key} value={key}>
              {config.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox
          checked={filterStarred}
          onCheckedChange={(checked) => setFilterStarred(!!checked)}
        />
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <Star className="size-3.5 text-amber-500" />
          Starred
        </span>
      </label>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs font-normal">
            <CalendarDays className="size-3.5" />
            {startDate && endDate
              ? `${format(parseISO(startDate), 'MMM d')} - ${format(parseISO(endDate), 'MMM d, yyyy')}`
              : 'Date Range'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={startDate ? parseISO(startDate) : undefined}
            onSelect={(date) => {
              if (date) setStartDate(format(date, 'yyyy-MM-dd'));
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <div className="ml-auto flex items-center gap-2">
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
            <X className="mr-1 size-3" />
            Clear
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="size-3.5" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleExport('json')}>
              Export as JSON
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('csv')}>
              Export as CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
