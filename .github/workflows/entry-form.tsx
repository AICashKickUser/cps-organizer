'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Loader2,
  Upload,
  X,
  Star,
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
  CalendarDays,
  ImagePlus,
  File,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { useOrganizerStore } from '@/store/organizer-store';
import type { EntryType, CallType } from '@/lib/types';
import { ENTRY_TYPE_CONFIG } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { isImageType } from '@/lib/types';
import { clientDb } from '@/lib/client-db';

const TYPE_ICONS: Record<string, React.ElementType> = {
  phone_call: Phone,
  photo: Camera,
  file: FileText,
  writing: PenLine,
  note: StickyNote,
  meeting: UsersRound,
  email: Mail,
  text_message: MessageSquare,
  other: CircleDot,
};

const CALL_TYPE_OPTIONS: { value: CallType; label: string; icon: React.ElementType }[] = [
  { value: 'incoming', label: 'Incoming', icon: PhoneIncoming },
  { value: 'outgoing', label: 'Outgoing', icon: PhoneOutgoing },
  { value: 'missed', label: 'Missed', icon: PhoneMissed },
];

interface UploadFile {
  file: File;
  preview?: string;
  id: string;
}

const entrySchema = z.object({
  type: z.enum(['phone_call', 'photo', 'file', 'writing', 'note', 'meeting', 'email', 'text_message', 'other']),
  title: z.string().min(1, 'Title is required'),
  entryDate: z.string().min(1, 'Date is required'),
  entryTime: z.string().optional(),
  duration: z.string().optional(),
  location: z.string().optional(),
  people: z.string().optional(),
  description: z.string().optional(),
  phone: z.string().optional(),
  phoneNumber: z.string().optional(),
  callType: z.enum(['incoming', 'outgoing', 'missed']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  isStarred: z.boolean().default(false),
  tags: z.string().optional(),
});

type EntryFormData = z.infer<typeof entrySchema>;

export function EntryForm() {
  const { isFormOpen, setIsFormOpen, editingEntry, addEntry, updateEntry } = useOrganizerStore();
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  const isEditing = !!editingEntry;

  const form = useForm<EntryFormData>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      type: 'note',
      title: '',
      entryDate: format(new Date(), 'yyyy-MM-dd'),
      entryTime: '',
      duration: '',
      location: '',
      people: '',
      description: '',
      phone: '',
      phoneNumber: '',
      callType: undefined,
      priority: 'normal',
      isStarred: false,
      tags: '',
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (editingEntry) {
      form.reset({
        type: editingEntry.type,
        title: editingEntry.title,
        entryDate: editingEntry.entryDate,
        entryTime: editingEntry.entryTime || '',
        duration: editingEntry.duration || '',
        location: editingEntry.location || '',
        people: editingEntry.people || '',
        description: editingEntry.description || '',
        phone: editingEntry.phone || '',
        phoneNumber: editingEntry.phoneNumber || '',
        callType: editingEntry.callType as CallType | undefined,
        priority: editingEntry.priority,
        isStarred: editingEntry.isStarred,
        tags: editingEntry.tags || '',
      });
    } else {
      form.reset({
        type: 'note',
        title: '',
        entryDate: format(new Date(), 'yyyy-MM-dd'),
        entryTime: '',
        duration: '',
        location: '',
        people: '',
        description: '',
        phone: '',
        phoneNumber: '',
        callType: undefined,
        priority: 'normal',
        isStarred: false,
        tags: '',
      });
    }
    setUploadFiles([]);
  }, [editingEntry, form, isFormOpen]);

  const selectedType = form.watch('type');
  const selectedDate = form.watch('entryDate');

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const newFiles: UploadFile[] = Array.from(files).map((file) => ({
      file,
      id: crypto.randomUUID(),
      preview: isImageType(file.type) ? URL.createObjectURL(file) : undefined,
    }));
    setUploadFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setUploadFiles((prev) => {
      const f = prev.find((p) => p.id === id);
      if (f?.preview) URL.revokeObjectURL(f.preview);
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const onSubmit = async (data: EntryFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        phone: data.phone || null,
        phoneNumber: data.phoneNumber || null,
        duration: data.duration || null,
        location: data.location || null,
        people: data.people || null,
        description: data.description || null,
        tags: data.tags || null,
      };

      if (isEditing && editingEntry) {
        // Update existing entry
        const updated = await clientDb.updateEntry(editingEntry.id, payload);
        // If there are new files, add them
        if (uploadFiles.length > 0) {
          const newAttachments = await clientDb.addFilesToEntry(
            editingEntry.id,
            uploadFiles.map((uf) => uf.file)
          );
          updated.attachments = [...editingEntry.attachments, ...newAttachments];
        }
        updateEntry(updated);
        toast({ title: 'Entry updated', description: 'Your timeline entry has been updated.' });
      } else {
        // Create new entry with files
        const created = await clientDb.createEntry(
          payload,
          uploadFiles.length > 0 ? uploadFiles.map((uf) => uf.file) : undefined
        );
        addEntry(created);
        toast({ title: 'Entry created', description: 'New timeline entry added.' });
      }

      setIsFormOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save entry. Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) setIsFormOpen(false); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Entry' : 'New Entry'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update your timeline entry details.' : 'Add a new entry to your timeline.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
          console.error('Form validation errors:', errors);
          toast({ title: 'Validation Error', description: 'Please check the required fields.', variant: 'destructive' });
        })} className="flex flex-col gap-4 mt-2">
          {/* Type selector grid */}
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {Object.entries(ENTRY_TYPE_CONFIG).map(([key, config]) => {
                const Icon = TYPE_ICONS[key] || CircleDot;
                const isSelected = selectedType === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => form.setValue('type', key as EntryType)}
                    className={`flex flex-col items-center gap-1 p-2 sm:p-3 rounded-lg border-2 text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-600'
                        : 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="size-4 sm:size-5" />
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Entry title..."
              {...form.register('title')}
            />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          {/* Date & Time row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarDays className="mr-2 size-4" />
                    {selectedDate ? format(new Date(selectedDate + 'T12:00:00'), 'MMM d, yyyy') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate ? new Date(selectedDate + 'T12:00:00') : undefined}
                    onSelect={(date) => {
                      if (date) {
                        form.setValue('entryDate', format(date, 'yyyy-MM-dd'));
                        setDatePickerOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.entryDate && (
                <p className="text-xs text-destructive">{form.formState.errors.entryDate.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="entryTime">Time</Label>
              <Input id="entryTime" placeholder="HH:MM" {...form.register('entryTime')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="duration">Duration</Label>
              <Input id="duration" placeholder="e.g. 30min, 1h" {...form.register('duration')} />
            </div>
          </div>

          {/* Phone call specific fields */}
          {selectedType === 'phone_call' && (
            <>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input id="phoneNumber" placeholder="+1 (555) 000-0000" {...form.register('phoneNumber')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Call Type</Label>
                  <Select
                    value={form.watch('callType') || 'incoming'}
                    onValueChange={(v) => form.setValue('callType', v as CallType)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CALL_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className="flex items-center gap-2">
                            <opt.icon className="size-3.5" />
                            {opt.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Location & People */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="Where did this happen?" {...form.register('location')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="people">People Involved</Label>
              <Input id="people" placeholder="Names, comma separated" {...form.register('people')} />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what happened in detail..."
              className="min-h-[100px] sm:min-h-[140px]"
              {...form.register('description')}
            />
          </div>

          <Separator />

          {/* Priority, Starred, Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={form.watch('priority')}
                onValueChange={(v) => form.setValue('priority', v as 'low' | 'normal' | 'high' | 'urgent')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tags">Tags</Label>
              <Input id="tags" placeholder="Comma separated" {...form.register('tags')} />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => form.setValue('isStarred', !form.watch('isStarred'))}
                className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-all ${
                  form.watch('isStarred')
                    ? 'border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700'
                    : 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                <Star className={`size-4 ${form.watch('isStarred') ? 'fill-current' : ''}`} />
                Starred
              </button>
            </div>
          </div>

          <Separator />

          {/* File upload */}
          <div className="space-y-2">
            <Label>Attachments</Label>
            <div
              ref={dragRef}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed rounded-lg p-4 text-center hover:border-emerald-300 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImagePlus className="size-8" />
                <p className="text-sm">Drop files here or click to browse</p>
                <p className="text-xs">Images, documents, or any other files</p>
              </div>
            </div>

            {/* File previews */}
            {uploadFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {uploadFiles.map((uf) => (
                  <div key={uf.id} className="relative group">
                    {uf.preview ? (
                      <div className="size-16 rounded-md overflow-hidden border">
                        <img src={uf.preview} alt={uf.file.name} className="size-full object-cover" />
                      </div>
                    ) : (
                      <div className="size-16 rounded-md border flex items-center justify-center bg-muted">
                        <File className="size-6 text-muted-foreground" />
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-1.5 -right-1.5 size-5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => { e.stopPropagation(); removeFile(uf.id); }}
                    >
                      <X className="size-3" />
                    </Button>
                    <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[64px] truncate">{uf.file.name}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Existing attachments when editing */}
            {isEditing && editingEntry?.attachments && editingEntry.attachments.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">Existing attachments: {editingEntry.attachments.length}</p>
                <div className="flex flex-wrap gap-2">
                  {editingEntry.attachments.map((att) => (
                    <div key={att.id} className="relative">
                      {att.thumbnailPath ? (
                        <div className="size-16 rounded-md overflow-hidden border">
                          <img src={att.thumbnailPath} alt={att.originalName} className="size-full object-cover" />
                        </div>
                      ) : (
                        <div className="size-16 rounded-md border flex items-center justify-center bg-muted">
                          <File className="size-6 text-muted-foreground" />
                        </div>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[64px] truncate">{att.originalName}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {isEditing ? 'Update Entry' : 'Create Entry'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
