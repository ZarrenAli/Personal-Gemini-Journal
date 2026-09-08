/**
 * Privacy-First Local Health Data Storage
 * Cycle logs and preferences are stored purely in client-side IndexedDB / local storage
 * and never uploaded or synchronized to remote public database servers.
 */

import { CycleLogEntry, CycleSettings, UserPreferences } from '../types';

const DB_NAME = 'gemini_journal_health_vault';
const DB_VERSION = 1;
const STORE_LOGS = 'cycle_logs';
const STORE_SETTINGS = 'cycle_settings';

// Helper to open IndexedDB with fallback
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_LOGS)) {
        db.createObjectStore(STORE_LOGS, { keyPath: 'date' });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Fallback to localStorage if IndexedDB is blocked in sandboxed iframe
const LOCAL_STORAGE_LOGS_KEY = 'mindful_cycle_logs_local_vault';
const LOCAL_STORAGE_SETTINGS_KEY = 'mindful_cycle_settings_local_vault';
const USER_PREFERENCES_KEY = 'mindful_cycle_user_prefs';

export async function getCycleSettings(userId: string): Promise<CycleSettings> {
  const defaultSettings: CycleSettings = {
    enabled: false,
    averageCycleLength: 28,
    averagePeriodLength: 5,
    lastPeriodStartDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  };

  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_SETTINGS, 'readonly');
      const store = tx.objectStore(STORE_SETTINGS);
      const req = store.get(userId);
      req.onsuccess = () => {
        if (req.result && req.result.settings) {
          resolve(req.result.settings);
        } else {
          // fallback to localStorage
          const local = localStorage.getItem(`${LOCAL_STORAGE_SETTINGS_KEY}_${userId}`);
          resolve(local ? JSON.parse(local) : defaultSettings);
        }
      };
      req.onerror = () => {
        const local = localStorage.getItem(`${LOCAL_STORAGE_SETTINGS_KEY}_${userId}`);
        resolve(local ? JSON.parse(local) : defaultSettings);
      };
    });
  } catch {
    const local = localStorage.getItem(`${LOCAL_STORAGE_SETTINGS_KEY}_${userId}`);
    return local ? JSON.parse(local) : defaultSettings;
  }
}

export async function saveCycleSettings(userId: string, settings: CycleSettings): Promise<void> {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_SETTINGS_KEY}_${userId}`, JSON.stringify(settings));
    const db = await openDB();
    const tx = db.transaction(STORE_SETTINGS, 'readwrite');
    const store = tx.objectStore(STORE_SETTINGS);
    store.put({ id: userId, settings });
  } catch (err) {
    console.warn('Saved cycle settings to local storage fallback:', err);
  }
}

export async function getAllCycleLogs(userId: string): Promise<CycleLogEntry[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_LOGS, 'readonly');
      const store = tx.objectStore(STORE_LOGS);
      const req = store.getAll();
      req.onsuccess = () => {
        const result = (req.result as CycleLogEntry[]) || [];
        // Filter by user identifier prefix or return sorted
        resolve(result.sort((a, b) => b.date.localeCompare(a.date)));
      };
      req.onerror = () => {
        const local = localStorage.getItem(`${LOCAL_STORAGE_LOGS_KEY}_${userId}`);
        const parsed = local ? JSON.parse(local) : [];
        resolve(parsed.sort((a: CycleLogEntry, b: CycleLogEntry) => b.date.localeCompare(a.date)));
      };
    });
  } catch {
    const local = localStorage.getItem(`${LOCAL_STORAGE_LOGS_KEY}_${userId}`);
    const parsed: CycleLogEntry[] = local ? JSON.parse(local) : [];
    return parsed.sort((a, b) => b.date.localeCompare(a.date));
  }
}

export async function saveCycleLog(userId: string, entry: CycleLogEntry): Promise<void> {
  try {
    // Save to localStorage as backup
    const local = localStorage.getItem(`${LOCAL_STORAGE_LOGS_KEY}_${userId}`);
    const existing: CycleLogEntry[] = local ? JSON.parse(local) : [];
    const index = existing.findIndex((e) => e.date === entry.date);
    if (index >= 0) {
      existing[index] = entry;
    } else {
      existing.unshift(entry);
    }
    localStorage.setItem(`${LOCAL_STORAGE_LOGS_KEY}_${userId}`, JSON.stringify(existing));

    // Also persist to IndexedDB
    const db = await openDB();
    const tx = db.transaction(STORE_LOGS, 'readwrite');
    const store = tx.objectStore(STORE_LOGS);
    store.put(entry);
  } catch (err) {
    console.warn('Saved cycle log to local storage fallback:', err);
  }
}

export async function deleteCycleLog(userId: string, date: string): Promise<void> {
  try {
    const local = localStorage.getItem(`${LOCAL_STORAGE_LOGS_KEY}_${userId}`);
    if (local) {
      const existing: CycleLogEntry[] = JSON.parse(local);
      const filtered = existing.filter((e) => e.date !== date);
      localStorage.setItem(`${LOCAL_STORAGE_LOGS_KEY}_${userId}`, JSON.stringify(filtered));
    }
    const db = await openDB();
    const tx = db.transaction(STORE_LOGS, 'readwrite');
    const store = tx.objectStore(STORE_LOGS);
    store.delete(date);
  } catch (err) {
    console.warn('Failed to delete cycle log:', err);
  }
}

export function getUserPreferences(userId: string): UserPreferences {
  try {
    const stored = localStorage.getItem(`${USER_PREFERENCES_KEY}_${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return {
    enableCycleCompanion: false,
    onboardingDismissed: false,
  };
}

export function saveUserPreferences(userId: string, prefs: UserPreferences): void {
  try {
    localStorage.setItem(`${USER_PREFERENCES_KEY}_${userId}`, JSON.stringify(prefs));
  } catch (err) {
    console.warn('Failed to save user preferences:', err);
  }
}
