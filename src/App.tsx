import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ExternalLink,
  FolderOpen,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  Settings,
  Trash2,
  Upload,
} from "lucide-react";
import "./App.css";

import type { ApplicationStatus, JobApplication, PersistedAppState } from "./types";

const STATUSES: ApplicationStatus[] = ["Saved", "Applied", "Accepted", "Rejected", "Ghosted"];
const EMPTY_APP_STATE: PersistedAppState = { version: 1, applications: [] };

function inferCompanyName(rawLink: string): string {
  try {
    const url = new URL(rawLink.startsWith("http") ? rawLink : `https://${rawLink}`);
    const firstPart = url.hostname.replace(/^www\./, "").split(".")[0];
    return firstPart
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  } catch {
    return "";
  }
}

function normalizeLink(rawLink: string): string {
  const trimmed = rawLink.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
}

function pillClass(status: ApplicationStatus): string {
  return status.toLowerCase();
}

function BoolChip({ value }: { value: boolean }) {
  return (
    <span className={`bool-chip ${value ? "bool-yes" : "bool-no"}`}>
      {value ? "✓ Yes" : "No"}
    </span>
  );
}

function App() {
  const [activeStatus, setActiveStatus] = useState<ApplicationStatus>("Saved");
  const [searchTerm, setSearchTerm] = useState("");
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [storageMessage, setStorageMessage] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newLink, setNewLink] = useState("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newCoverLetter, setNewCoverLetter] = useState(false);
  const [newReference, setNewReference] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLink, setEditLink] = useState("");
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editJobTitle, setEditJobTitle] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editCoverLetter, setEditCoverLetter] = useState(false);
  const [editReference, setEditReference] = useState(false);
  const [openActionId, setOpenActionId] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    let ignore = false;
    async function loadApplications() {
      try {
        const storedState = await window.appStorage.load();
        if (!ignore && storedState?.applications) {
          setApplications(storedState.applications);
        }
      } catch (error) {
        console.error(error);
        if (!ignore) setStorageMessage("Could not load saved applications.");
      } finally {
        if (!ignore) setIsLoaded(true);
      }
    }
    loadApplications();
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const state: PersistedAppState = { ...EMPTY_APP_STATE, applications };
    window.appStorage.save(state).catch((error) => {
      console.error(error);
      setStorageMessage("Could not save applications.");
    });
  }, [applications, isLoaded]);

  useEffect(() => {
    if (openActionId === null) return;
    function handleClick() {
      setOpenActionId(null);
      setMenuPos(null);
    }
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [openActionId]);

  const countByStatus = useMemo(() => {
    const counts: Record<ApplicationStatus, number> = {
      Saved: 0,
      Applied: 0,
      Accepted: 0,
      Rejected: 0,
      Ghosted: 0,
    };
    for (const app of applications) counts[app.status]++;
    return counts;
  }, [applications]);

  const visibleApplications = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    return applications.filter(
      (app) =>
        app.status === activeStatus &&
        (app.companyName.toLowerCase().includes(query) ||
          (app.jobTitle ?? "").toLowerCase().includes(query) ||
          (app.location ?? "").toLowerCase().includes(query)),
    );
  }, [applications, activeStatus, searchTerm]);

  const groupedApplications = useMemo(() => {
    const groups = new Map<string, JobApplication[]>();
    for (const app of visibleApplications) {
      const key = app.location?.trim() || "No Location";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(app);
    }
    return groups;
  }, [visibleApplications]);

  const openActionApp = applications.find((a) => a.id === openActionId) ?? null;

  function updateStatus(id: number, status: ApplicationStatus) {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status } : app)),
    );
  }

  function deleteApplication(id: number) {
    setApplications((prev) => prev.filter((app) => app.id !== id));
  }

  function handleLinkChange(value: string) {
    setNewLink(value);
    const inferred = inferCompanyName(value);
    if (inferred) setNewCompanyName(inferred);
  }

  function handleAddApplication() {
    if (!newLink.trim() || !newCompanyName.trim()) return;
    const application: JobApplication = {
      id: Date.now(),
      dateApplied: new Date().toISOString().slice(0, 10),
      companyName: newCompanyName.trim(),
      jobTitle: newJobTitle.trim(),
      location: newLocation.trim(),
      link: normalizeLink(newLink),
      coverLetter: newCoverLetter,
      reference: newReference,
      status: "Saved",
    };
    setApplications((prev) => [application, ...prev]);
    setNewLink("");
    setNewCompanyName("");
    setNewJobTitle("");
    setNewLocation("");
    setNewCoverLetter(false);
    setNewReference(false);
    setIsAddOpen(false);
    setActiveStatus("Saved");
  }

  function openEdit(id: number) {
    const app = applications.find((a) => a.id === id);
    if (!app) return;
    setEditingId(id);
    setEditLink(app.link);
    setEditCompanyName(app.companyName);
    setEditJobTitle(app.jobTitle ?? "");
    setEditLocation(app.location ?? "");
    setEditCoverLetter(app.coverLetter);
    setEditReference(app.reference);
  }

  function handleSaveEdit() {
    if (!editingId || !editLink.trim() || !editCompanyName.trim()) return;
    setApplications((prev) =>
      prev.map((app) =>
        app.id === editingId
          ? {
              ...app,
              link: normalizeLink(editLink),
              companyName: editCompanyName.trim(),
              jobTitle: editJobTitle.trim(),
              location: editLocation.trim(),
              coverLetter: editCoverLetter,
              reference: editReference,
            }
          : app,
      ),
    );
    setEditingId(null);
  }

  async function handleExportBackup() {
    const result = await window.appStorage.exportBackup();
    if (!result.canceled) setStorageMessage("Backup exported.");
  }

  async function handleImportBackup() {
    const restoredState = await window.appStorage.importBackup();
    if (!restoredState) return;
    setApplications(restoredState.applications);
    setStorageMessage("Backup imported.");
  }

  async function handleRestoreLatestBackup() {
    const restoredState = await window.appStorage.restoreLatestBackup();
    if (!restoredState) {
      setStorageMessage("No automatic backup found.");
      return;
    }
    setApplications(restoredState.applications);
    setStorageMessage("Latest automatic backup restored.");
  }

  async function handleOpenBackupFolder() {
    const result = await window.appStorage.openBackupFolder();
    setStorageMessage(
      result.opened ? "Backup folder opened." : result.error ?? "Could not open backup folder.",
    );
  }

  async function handleClearOldBackups() {
    const result = await window.appStorage.clearOldBackups();
    setStorageMessage(
      `Backup cleanup complete. Deleted ${result.deletedCount}, kept ${result.keptCount}.`,
    );
  }

  async function handleResetApplications() {
    await window.appStorage.reset();
    setApplications([]);
    setStorageMessage("Applications reset.");
    setIsSettingsOpen(false);
  }

  return (
    <main className="app-shell">
      <header className="top-bar">
        <nav className="status-slider" aria-label="Application status filter">
          {STATUSES.map((status) => (
            <button
              key={status}
              className={`status-tab${status === activeStatus ? " active" : ""}`}
              onClick={() => setActiveStatus(status)}
              aria-pressed={status === activeStatus}
            >
              {status}
              <span className="count-badge">{countByStatus[status]}</span>
            </button>
          ))}
        </nav>
        <div className="top-actions">
          <label className="search-box" aria-label="Search companies">
            <Search size={16} strokeWidth={2.5} aria-hidden />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search company, title, location…"
            />
          </label>
          <button
            className="icon-button"
            onClick={() => setIsAddOpen(true)}
            aria-label="Add application"
            title="Add application"
          >
            <Plus size={20} strokeWidth={2.8} />
          </button>
          <button
            className="icon-button"
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Settings"
            title="Settings"
          >
            <Settings size={20} strokeWidth={2.2} />
          </button>
        </div>
      </header>

      {storageMessage && <div className="storage-message">{storageMessage}</div>}

      <section>
        <div className="table-header table-grid">
          <span>Date</span>
          <span>Company</span>
          <span>Job Title</span>
          <span>Link</span>
          <span>Cover Letter</span>
          <span>Reference</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        <div className="table-body">
          {visibleApplications.length === 0 ? (
            <div className="empty-state">
              No {activeStatus.toLowerCase()} applications
              {searchTerm ? ` matching "${searchTerm}"` : ""}.
            </div>
          ) : (
            Array.from(groupedApplications.entries()).map(([location, apps], groupIndex) => (
              <div
                key={location}
                className={`location-group${groupIndex > 0 ? " location-group--gap" : ""}`}
              >
                <div className="location-group-panel">
                  <div className="location-group-header">
                    <span className="location-group-label">{location}</span>
                  </div>
                  {apps.map((app) => (
                    <article className="application-row table-grid" key={app.id}>
                      <span className="date-text">{app.dateApplied}</span>
                      <span className="company-name" title={app.companyName}>
                        {app.companyName}
                      </span>
                      <span className="job-title-text" title={app.jobTitle}>
                        {app.jobTitle || <span className="muted">—</span>}
                      </span>
                      <a className="job-link" href={app.link} target="_blank" rel="noreferrer">
                        Open <ExternalLink size={11} aria-hidden />
                      </a>
                      <BoolChip value={app.coverLetter} />
                      <BoolChip value={app.reference} />
                      <span className={`status-pill ${pillClass(app.status)}`}>
                        {app.status}
                      </span>
                      <div className="row-actions">
                        <button
                          className="icon-action"
                          onClick={() => openEdit(app.id)}
                          aria-label={`Edit ${app.companyName}`}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          className="action-menu-trigger"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            if (openActionId === app.id) {
                              setOpenActionId(null);
                              setMenuPos(null);
                            } else {
                              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                              setMenuPos({
                                top: rect.bottom + 5,
                                left: rect.left,
                              });
                              setOpenActionId(app.id);
                            }
                          }}
                          aria-label={`Actions for ${app.companyName}`}
                        >
                          Actions <ChevronDown size={12} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Action menu rendered at root level — escapes backdrop-filter stacking contexts */}
      {openActionApp != null && menuPos != null && (
        <div
          className="action-menu"
          style={{ top: menuPos.top, left: menuPos.left }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {STATUSES.filter((s) => s !== openActionApp.status).map((status) => (
            <button
              key={status}
              onClick={() => {
                updateStatus(openActionApp.id, status);
                setOpenActionId(null);
                setMenuPos(null);
              }}
            >
              {status}
            </button>
          ))}
          <button
            className="danger"
            onClick={() => {
              deleteApplication(openActionApp.id);
              setOpenActionId(null);
              setMenuPos(null);
            }}
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      )}

      {isAddOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={() => setIsAddOpen(false)}
          aria-modal="true"
          role="dialog"
          aria-labelledby="add-modal-title"
        >
          <section className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <h2 id="add-modal-title">Add application</h2>
            <label>
              Job link
              <input
                type="text"
                value={newLink}
                onChange={(e) => handleLinkChange(e.target.value)}
                placeholder="https://company.com/careers/job"
                autoFocus
              />
            </label>
            <label>
              Company name
              <input
                type="text"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="Auto-filled from link"
              />
            </label>
            <label>
              Job title
              <input
                type="text"
                value={newJobTitle}
                onChange={(e) => setNewJobTitle(e.target.value)}
                placeholder="e.g. Senior Software Engineer"
              />
            </label>
            <label>
              Location
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="e.g. New York, NY or Remote"
              />
            </label>
            <div className="checkbox-row">
              <label>
                <input
                  type="checkbox"
                  checked={newCoverLetter}
                  onChange={(e) => setNewCoverLetter(e.target.checked)}
                />
                Cover letter
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={newReference}
                  onChange={(e) => setNewReference(e.target.checked)}
                />
                Reference
              </label>
            </div>
            <div className="modal-actions">
              <button className="secondary-button" onClick={() => setIsAddOpen(false)}>
                Cancel
              </button>
              <button className="primary-button" onClick={handleAddApplication}>
                Add application
              </button>
            </div>
          </section>
        </div>
      )}

      {editingId !== null && (
        <div
          className="modal-backdrop"
          onMouseDown={() => setEditingId(null)}
          aria-modal="true"
          role="dialog"
          aria-labelledby="edit-modal-title"
        >
          <section className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <h2 id="edit-modal-title">Edit application</h2>
            <label>
              Job link
              <input
                type="text"
                value={editLink}
                onChange={(e) => setEditLink(e.target.value)}
              />
            </label>
            <label>
              Company name
              <input
                type="text"
                value={editCompanyName}
                onChange={(e) => setEditCompanyName(e.target.value)}
                autoFocus
              />
            </label>
            <label>
              Job title
              <input
                type="text"
                value={editJobTitle}
                onChange={(e) => setEditJobTitle(e.target.value)}
                placeholder="e.g. Senior Software Engineer"
              />
            </label>
            <label>
              Location
              <input
                type="text"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                placeholder="e.g. New York, NY or Remote"
              />
            </label>
            <div className="checkbox-row">
              <label>
                <input
                  type="checkbox"
                  checked={editCoverLetter}
                  onChange={(e) => setEditCoverLetter(e.target.checked)}
                />
                Cover letter
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={editReference}
                  onChange={(e) => setEditReference(e.target.checked)}
                />
                Reference
              </label>
            </div>
            <div className="modal-actions">
              <button className="secondary-button" onClick={() => setEditingId(null)}>
                Cancel
              </button>
              <button className="primary-button" onClick={handleSaveEdit}>
                Save changes
              </button>
            </div>
          </section>
        </div>
      )}

      {isSettingsOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={() => setIsSettingsOpen(false)}
          aria-modal="true"
          role="dialog"
          aria-labelledby="settings-modal-title"
        >
          <section className="modal settings-modal" onMouseDown={(e) => e.stopPropagation()}>
            <h2 id="settings-modal-title">Database Settings</h2>
            <p className="settings-copy">
              Application data is saved locally in a SQLite database. Backups are stored as JSON
              files.
            </p>
            <div className="settings-action-list">
              <button onClick={handleExportBackup}>
                <Save size={16} />
                Export backup
              </button>
              <button onClick={handleImportBackup}>
                <Upload size={16} />
                Import backup
              </button>
              <button onClick={handleRestoreLatestBackup}>
                <RotateCcw size={16} />
                Restore latest automatic backup
              </button>
              <button onClick={handleOpenBackupFolder}>
                <FolderOpen size={16} />
                Open backup folder
              </button>
              <button onClick={handleClearOldBackups}>
                <Trash2 size={16} />
                Clear old backups
              </button>
            </div>
            <div className="modal-actions split-actions">
              <button className="danger-button" onClick={handleResetApplications}>
                Reset applications
              </button>
              <button className="secondary-button" onClick={() => setIsSettingsOpen(false)}>
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default App;