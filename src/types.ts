export type ApplicationStatus = "Pending" | "Accepted" | "Rejected" | "Ghosted";

export type JobApplication = {
  id: number;
  dateApplied: string;
  companyName: string;
  link: string;
  coverLetter: boolean;
  reference: boolean;
  status: ApplicationStatus;
};

export type PersistedAppState = {
  version: number;
  applications: JobApplication[];
};

export type BackupExportResult = {
  canceled: boolean;
  filePath?: string;
};

export type BackupFolderResult = {
  opened: boolean;
  error?: string;
};

export type BackupCleanupResult = {
  deletedCount: number;
  keptCount: number;
  backupDir: string;
};
