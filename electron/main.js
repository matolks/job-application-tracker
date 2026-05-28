import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  clearOldBackups,
  closeDatabase,
  exportFullBackup,
  getBackupDirectory,
  importFullBackup,
  loadAppState,
  resetAppState,
  restoreLatestBackup,
  saveAppState,
} from "./database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEV_SERVER_URL =
  process.env.VITE_DEV_SERVER_URL ?? "http://localhost:5173";

const RENDERER_DIST = path.join(__dirname, "../dist");

let mainWindow = null;

function isAllowedRendererUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);

    if (app.isPackaged) {
      return url.protocol === "file:";
    }

    return url.origin === new URL(DEV_SERVER_URL).origin;
  } catch {
    return false;
  }
}

function assertTrustedSender(event) {
  if (!mainWindow || event.sender !== mainWindow.webContents) {
    throw new Error("Untrusted IPC sender.");
  }

  const senderUrl = event.senderFrame?.url ?? "";

  if (!isAllowedRendererUrl(senderUrl)) {
    throw new Error("Untrusted IPC sender URL.");
  }
}

function getBackupDefaultFileName() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `job-application-tracker-backup-${timestamp}.json`;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    icon: path.join(__dirname, "../build/icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

  mainWindow.webContents.on("will-navigate", (event) => {
    event.preventDefault();
  });

  if (app.isPackaged) {
    await mainWindow.loadFile(path.join(RENDERER_DIST, "index.html"));
  } else {
    await mainWindow.loadURL(DEV_SERVER_URL);
  }
}

ipcMain.handle("app-state:load", (event) => {
  assertTrustedSender(event);
  return loadAppState();
});

ipcMain.handle("app-state:save", (event, state) => {
  assertTrustedSender(event);
  return saveAppState(state);
});

ipcMain.handle("app-state:reset", (event) => {
  assertTrustedSender(event);
  return resetAppState();
});

ipcMain.handle("app-state:export-backup", async (event) => {
  assertTrustedSender(event);

  const result = await dialog.showSaveDialog(mainWindow, {
    title: "Export Backup",
    defaultPath: getBackupDefaultFileName(),
    filters: [{ name: "JSON Backup", extensions: ["json"] }],
  });

  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }

  await exportFullBackup(result.filePath);

  return {
    canceled: false,
    filePath: result.filePath,
  };
});

ipcMain.handle("app-state:import-backup", async (event) => {
  assertTrustedSender(event);

  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Import Backup",
    properties: ["openFile"],
    filters: [{ name: "JSON Backup", extensions: ["json"] }],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return importFullBackup(result.filePaths[0]);
});

ipcMain.handle("app-state:restore-latest-backup", async (event) => {
  assertTrustedSender(event);
  return restoreLatestBackup();
});

ipcMain.handle("app-state:open-backup-folder", async (event) => {
  assertTrustedSender(event);

  const backupDirectory = getBackupDirectory();
  const errorMessage = await shell.openPath(backupDirectory);

  return {
    opened: errorMessage === "",
    error: errorMessage || undefined,
  };
});

ipcMain.handle("app-state:clear-old-backups", async (event) => {
  assertTrustedSender(event);
  return clearOldBackups();
});

app.whenReady().then(createWindow);

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("before-quit", () => {
  closeDatabase();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
