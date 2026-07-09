/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const DB_NAME = 'nomis-videos-db';
const STORE_NAME = 'videos-store';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

const getDb = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
};

// Save a Blob or File to IndexedDB with a given video ID
export const saveVideoBlob = async (videoId: string, blob: Blob): Promise<void> => {
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(blob, videoId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("Failed to save video blob to IndexedDB:", err);
  }
};

// Retrieve a Blob from IndexedDB and return a temporary object URL
export const getVideoBlobUrl = async (videoId: string): Promise<string | null> => {
  try {
    const db = await getDb();
    const blob: Blob | null = await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(videoId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });

    if (blob) {
      return URL.createObjectURL(blob);
    }
    return null;
  } catch (err) {
    console.warn("Failed to retrieve video blob from IndexedDB:", err);
    return null;
  }
};
