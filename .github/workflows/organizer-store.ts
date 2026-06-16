import { create } from 'zustand';
import type { TimelineEntry, EntryType, Priority, DayGroup } from '@/lib/types';
import { format, parseISO, startOfDay, isSameDay } from 'date-fns';

interface OrganizerState {
  entries: TimelineEntry[];
  isLoading: boolean;
  selectedDate: Date | null;
  startDate: string;
  endDate: string;
  filterType: EntryType | null;
  filterPriority: Priority | null;
  filterSearch: string;
  filterStarred: boolean;
  selectedEntryId: string | null;
  isFormOpen: boolean;
  editingEntry: TimelineEntry | null;
  imageLightbox: { entryId: string; index: number } | null;

  setEntries: (entries: TimelineEntry[]) => void;
  addEntry: (entry: TimelineEntry) => void;
  updateEntry: (entry: TimelineEntry) => void;
  removeEntry: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setSelectedDate: (date: Date | null) => void;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setFilterType: (type: EntryType | null) => void;
  setFilterPriority: (priority: Priority | null) => void;
  setFilterSearch: (search: string) => void;
  setFilterStarred: (starred: boolean) => void;
  setSelectedEntryId: (id: string | null) => void;
  setIsFormOpen: (open: boolean) => void;
  setEditingEntry: (entry: TimelineEntry | null) => void;
  setImageLightbox: (value: { entryId: string; index: number } | null) => void;

  getGroupedEntries: () => DayGroup[];
}

export const useOrganizerStore = create<OrganizerState>((set, get) => {
  const today = new Date();
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);

  return {
    entries: [],
    isLoading: false,
    selectedDate: null,
    startDate: format(lastMonth, 'yyyy-MM-dd'),
    endDate: format(nextMonth, 'yyyy-MM-dd'),
    filterType: null,
    filterPriority: null,
    filterSearch: '',
    filterStarred: false,
    selectedEntryId: null,
    isFormOpen: false,
    editingEntry: null,
    imageLightbox: null,

    setEntries: (entries) => set({ entries }),
    addEntry: (entry) => set((s) => ({ entries: [entry, ...s.entries] })),
    updateEntry: (entry) => set((s) => ({
      entries: s.entries.map((e) => (e.id === entry.id ? entry : e)),
      editingEntry: s.editingEntry?.id === entry.id ? entry : s.editingEntry,
    })),
    removeEntry: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
    setLoading: (isLoading) => set({ isLoading }),
    setSelectedDate: (selectedDate) => set({ selectedDate }),
    setStartDate: (startDate) => set({ startDate }),
    setEndDate: (endDate) => set({ endDate }),
    setFilterType: (filterType) => set({ filterType }),
    setFilterPriority: (filterPriority) => set({ filterPriority }),
    setFilterSearch: (filterSearch) => set({ filterSearch }),
    setFilterStarred: (filterStarred) => set({ filterStarred }),
    setSelectedEntryId: (selectedEntryId) => set({ selectedEntryId }),
    setIsFormOpen: (isFormOpen) => set({ isFormOpen, editingEntry: isFormOpen ? null : undefined }),
    setEditingEntry: (editingEntry) => set({ editingEntry, isFormOpen: !!editingEntry }),
    setImageLightbox: (imageLightbox) => set({ imageLightbox }),

    getGroupedEntries: () => {
      const { entries, selectedDate, filterType, filterPriority, filterSearch, filterStarred } = get();

      let filtered = [...entries];

      if (selectedDate) {
        filtered = filtered.filter((e) => isSameDay(parseISO(e.entryDate), selectedDate));
      }
      if (filterType) {
        filtered = filtered.filter((e) => e.type === filterType);
      }
      if (filterPriority) {
        filtered = filtered.filter((e) => e.priority === filterPriority);
      }
      if (filterStarred) {
        filtered = filtered.filter((e) => e.isStarred);
      }
      if (filterSearch.trim()) {
        const q = filterSearch.toLowerCase();
        filtered = filtered.filter(
          (e) =>
            e.title.toLowerCase().includes(q) ||
            (e.description && e.description.toLowerCase().includes(q)) ||
            (e.people && e.people.toLowerCase().includes(q)) ||
            (e.location && e.location.toLowerCase().includes(q)) ||
            (e.tags && e.tags.toLowerCase().includes(q)) ||
            (e.phoneNumber && e.phoneNumber.toLowerCase().includes(q)) ||
            (e.phone && e.phone.toLowerCase().includes(q))
        );
      }

      // Sort by date desc, then time desc
      filtered.sort((a, b) => {
        const dateDiff = parseISO(b.entryDate).getTime() - parseISO(a.entryDate).getTime();
        if (dateDiff !== 0) return dateDiff;
        if (a.entryTime && b.entryTime) return b.entryTime.localeCompare(a.entryTime);
        if (a.entryTime) return -1;
        if (b.entryTime) return 1;
        return 0;
      });

      // Group by date
      const groups: DayGroup[] = [];
      let currentDate = '';

      for (const entry of filtered) {
        const entryDate = entry.entryDate;
        const dayStr = format(parseISO(entryDate), 'yyyy-MM-dd');
        if (dayStr !== currentDate) {
          currentDate = dayStr;
          groups.push({
            date: dayStr,
            label: format(parseISO(entryDate), 'EEEE, MMMM d, yyyy'),
            entries: [],
          });
        }
        groups[groups.length - 1].entries.push(entry);
      }

      return groups;
    },
  };
});