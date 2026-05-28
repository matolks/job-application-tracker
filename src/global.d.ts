import type { PersistedAppState } from "./types";

declare global {
  interface Window {
    appStorage: {
      load: () => Promise<PersistedAppState | null>;
      save: (state: PersistedAppState) => Promise<boolean>;
      reset: () => Promise<boolean>;
      exportBackup: () => Promise<{ canceled: true } | { canceled: false; filePath: string }>;
      importBackup: () => Promise<PersistedAppState | null>;
      restoreLatestBackup: () => Promise<PersistedAppState | null>;
      openBackupFolder: () => Promise<{ opened: boolean; error?: string }>;
      clearOldBackups: () => Promise<{
        deletedCount: number;
        keptCount: number;
        backupDir: string;
      }>;
      openExternal: (url: string) => Promise<void>;
    };
  }
}

export {};