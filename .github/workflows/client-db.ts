// 100% client-side database using IndexedDB
// All data stays on YOUR device only — nothing sent to any server

import type { TimelineEntry, Attachment } from '@/lib/types';

const DB_NAME = 'personal-organizer';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('entries')) {
        const entryStore = db.createObjectStore('entries', { keyPath: 'id' });
        entryStore.createIndex('entryDate', 'entryDate', { unique: false });
        entryStore.createIndex('type', 'type', { unique: false });
        entryStore.createIndex('priority', 'priority', { unique: false });
        entryStore.createIndex('isStarred', 'isStarred', { unique: false });
      }

      if (!db.objectStoreNames.contains('attachments')) {
        const attStore = db.createObjectStore('attachments', { keyPath: 'id' });
        attStore.createIndex('entryId', 'entryId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

async function tx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = fn(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Generate a unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

// Create a thumbnail from an image blob using Canvas
async function createThumbnail(blob: Blob, maxSize = 400): Promise<Blob | null> {
  if (!blob.type.startsWith('image/')) return null;
  try {
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(maxSize / bitmap.width, maxSize / bitmap.height, 1);
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, w, h);

    return await canvas.convertToBlob({ type: 'image/webp', quality: 0.8 });
  } catch {
    return null;
  }
}

// Get image dimensions
async function getImageDimensions(blob: Blob): Promise<{ width: number; height: number } | null> {
  if (!blob.type.startsWith('image/')) return null;
  try {
    const bitmap = await createImageBitmap(blob);
    const dims = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dims;
  } catch {
    return null;
  }
}

// ========== PUBLIC API ==========

export const clientDb = {
  // Load all entries (without blob data, with object URLs for display)
  async getAllEntries(): Promise<TimelineEntry[]> {
    const entries = await tx<TimelineEntry[]>('entries', 'readonly', (store) => store.getAll());

    // Load attachments for each entry
    for (const entry of entries) {
      const attachments = await tx<Attachment[]>('attachments', 'readonly', (store) => {
        const index = store.index('entryId');
        return index.getAll(entry.id);
      });
      entry.attachments = attachments;
    }

    return entries;
  },

  // Create a new entry with optional file attachments
  async createEntry(
    data: Omit<TimelineEntry, 'id' | 'createdAt' | 'updatedAt' | 'attachments'>,
    files?: File[]
  ): Promise<TimelineEntry> {
    const now = new Date().toISOString();
    const id = generateId();

    const entry: TimelineEntry = {
      ...data,
      id,
      entryDate: data.entryDate,
      createdAt: now,
      updatedAt: now,
      attachments: [],
    };

    // Save entry first
    await tx('entries', 'readwrite', (store) => store.put(entry));

    // Save files as attachments
    if (files && files.length > 0) {
      for (const file of files) {
        const attId = generateId();
        const dims = await getImageDimensions(file);
        const thumbnail = await createThumbnail(file);

        const attachment: Attachment = {
          id: attId,
          filename: attId + '_' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_'),
          originalName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          filePath: `blob:${attId}`, // marker, actual blob loaded on demand
          thumbnailPath: thumbnail ? `thumb:${attId}` : null,
          width: dims?.width || null,
          height: dims?.height || null,
          entryId: id,
          createdAt: now,
        };

        // Store the actual blob data in a separate object store entry
        // We'll use the attachment record itself + store blobs separately
        await tx('attachments', 'readwrite', (store) => store.put(attachment));

        // Store file blob with a composite key
        const db = await getDB();
        await new Promise<void>((resolve, reject) => {
          const transaction = db.transaction('attachments', 'readwrite');
          const store = transaction.objectStore('attachments');

          // Store the raw blob data alongside the attachment
          const blobRecord = { ...attachment, _blob: file, _thumbnail: thumbnail };
          const putReq = store.put(blobRecord);
          putReq.onsuccess = () => resolve();
          putReq.onerror = () => reject(putReq.error);
        });

        entry.attachments.push(attachment);
      }
    }

    return entry;
  },

  // Update an entry
  async updateEntry(id: string, updates: Partial<TimelineEntry>): Promise<TimelineEntry> {
    const existing = await tx<TimelineEntry>('entries', 'readonly', (store) => store.get(id));
    if (!existing) throw new Error('Entry not found');

    const updated: TimelineEntry = {
      ...existing,
      ...updates,
      id, // ensure ID doesn't change
      updatedAt: new Date().toISOString(),
    };

    await tx('entries', 'readwrite', (store) => store.put(updated));

    // Reload attachments
    const attachments = await tx<Attachment[]>('attachments', 'readonly', (store) => {
      const index = store.index('entryId');
      return index.getAll(id);
    });
    updated.attachments = attachments;

    return updated;
  },

  // Delete an entry and all its attachments
  async deleteEntry(id: string): Promise<void> {
    // Delete all attachments for this entry
    const attachments = await tx<Attachment[]>('attachments', 'readonly', (store) => {
      const index = store.index('entryId');
      return index.getAll(id);
    });

    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('attachments', 'readwrite');
      const store = transaction.objectStore('attachments');
      for (const att of attachments) {
        store.delete(att.id);
      }
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });

    // Delete the entry
    await tx('entries', 'readwrite', (store) => store.delete(id));
  },

  // Get a single entry with full details
  async getEntry(id: string): Promise<TimelineEntry | null> {
    const entry = await tx<TimelineEntry>('entries', 'readonly', (store) => store.get(id));
    if (!entry) return null;

    const attachments = await tx<Attachment[]>('attachments', 'readonly', (store) => {
      const index = store.index('entryId');
      return index.getAll(id);
    });
    entry.attachments = attachments;

    return entry;
  },

  // Get the raw blob for an attachment (for display/download)
  async getAttachmentBlob(attId: string): Promise<{ blob: Blob | null; thumbnail: Blob | null }> {
    try {
      const record = await tx<any>('attachments', 'readonly', (store) => store.get(attId));
      return {
        blob: record?._blob || null,
        thumbnail: record?._thumbnail || null,
      };
    } catch {
      return { blob: null, thumbnail: null };
    }
  },

  // Add files to an existing entry
  async addFilesToEntry(entryId: string, files: File[]): Promise<Attachment[]> {
    const now = new Date().toISOString();
    const newAttachments: Attachment[] = [];

    for (const file of files) {
      const attId = generateId();
      const dims = await getImageDimensions(file);
      const thumbnail = await createThumbnail(file);

      const attachment: Attachment = {
        id: attId,
        filename: attId + '_' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_'),
        originalName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        filePath: `blob:${attId}`,
        thumbnailPath: thumbnail ? `thumb:${attId}` : null,
        width: dims?.width || null,
        height: dims?.height || null,
        entryId,
        createdAt: now,
      };

      // Store with blob data
      const db = await getDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction('attachments', 'readwrite');
        const store = transaction.objectStore('attachments');
        const blobRecord = { ...attachment, _blob: file, _thumbnail: thumbnail };
        const putReq = store.put(blobRecord);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      });

      newAttachments.push(attachment);
    }

    return newAttachments;
  },

  // Export all entries as JSON (without blob data, metadata only)
  async exportJSON(): Promise<string> {
    const entries = await this.getAllEntries();
    // Strip blob references for clean export
    const clean = entries.map((e) => ({
      ...e,
      attachments: e.attachments.map((a) => ({
        id: a.id,
        originalName: a.originalName,
        mimeType: a.mimeType,
        fileSize: a.fileSize,
        width: a.width,
        height: a.height,
        entryId: a.entryId,
        createdAt: a.createdAt,
      })),
    }));
    return JSON.stringify(clean, null, 2);
  },

  // Export all entries as CSV
  async exportCSV(): Promise<string> {
    const entries = await this.getAllEntries();
    const headers = ['Date', 'Time', 'Type', 'Title', 'Description', 'Duration', 'Location', 'People', 'Phone', 'Priority', 'Starred', 'Tags', 'Attachments'];
    const rows = entries.map((e) => [
      e.entryDate?.slice(0, 10) || '',
      e.entryTime || '',
      e.type,
      `"${(e.title || '').replace(/"/g, '""')}"`,
      `"${(e.description || '').replace(/"/g, '""')}"`,
      e.duration || '',
      e.location || '',
      e.people || '',
      e.phoneNumber || e.phone || '',
      e.priority,
      e.isStarred ? 'Yes' : 'No',
      e.tags || '',
      e.attachments.map((a) => a.originalName).join('; '),
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },
};