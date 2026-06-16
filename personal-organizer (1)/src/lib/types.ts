export type EntryType = 
  | 'phone_call' 
  | 'photo' 
  | 'file' 
  | 'writing' 
  | 'note' 
  | 'meeting' 
  | 'email' 
  | 'text_message' 
  | 'other';

export type Priority = 'low' | 'normal' | 'high' | 'urgent';
export type CallType = 'incoming' | 'outgoing' | 'missed';

export interface TimelineEntry {
  id: string;
  type: EntryType;
  title: string;
  description: string | null;
  entryDate: string;
  entryTime: string | null;
  duration: string | null;
  location: string | null;
  people: string | null;
  phone: string | null;
  phoneNumber: string | null;
  callType: string | null;
  tags: string | null;
  priority: Priority;
  isStarred: boolean;
  createdAt: string;
  updatedAt: string;
  attachments: Attachment[];
}

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  filePath: string;
  thumbnailPath: string | null;
  width: number | null;
  height: number | null;
  entryId: string;
  createdAt: string;
}

export interface DayGroup {
  date: string; // YYYY-MM-DD
  label: string; // e.g. "Thursday, June 12, 2026"
  entries: TimelineEntry[];
}

export const ENTRY_TYPE_CONFIG: Record<EntryType, { label: string; icon: string; color: string }> = {
  phone_call: { label: 'Phone Call', icon: 'Phone', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
  photo: { label: 'Photo', icon: 'Camera', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
  file: { label: 'File', icon: 'FileText', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400' },
  writing: { label: 'Writing', icon: 'PenLine', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400' },
  note: { label: 'Note', icon: 'StickyNote', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' },
  meeting: { label: 'Meeting', icon: 'Users', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' },
  email: { label: 'Email', icon: 'Mail', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400' },
  text_message: { label: 'Text Message', icon: 'MessageSquare', color: 'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-400' },
  other: { label: 'Other', icon: 'CircleDot', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-600' },
  normal: { label: 'Normal', color: 'bg-slate-100 text-slate-600' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700' },
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function isImageType(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}