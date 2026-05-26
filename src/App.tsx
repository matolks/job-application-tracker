import { useMemo, useState } from "react";
import { ExternalLink, Pencil, Plus, Search, Settings, Trash2 } from "lucide-react";
import "./App.css";

import type {
  ApplicationStatus,
  JobApplication
} from "./types"

// Constants

const STATUSES: ApplicationStatus[] = ["Pending", "Accepted", "Rejected", "Ghosted"];
// Temp Data
const APPLICATIONS: JobApplication[] = [];

// Derives a company name from a URL 
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

function pillClass(status: ApplicationStatus): string {
  return status.toLowerCase();
}

// Renders the Yes/No cover letter and reference columns
function BoolChip({ value }: { value: boolean }) {
  return (
    <span className={`bool-chip ${value ? "bool-yes" : "bool-no"}`}>
      {value ? "✓ Yes" : "No"}
    </span>
  );
}

// Main component
function App() {
  const [activeStatus, setActiveStatus] = useState<ApplicationStatus>("Pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [applications, setApplications] = useState<JobApplication[]>(APPLICATIONS);
  // Add modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newLink, setNewLink] = useState("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCoverLetter, setNewCoverLetter] = useState(false);
  const [newReference, setNewReference] = useState(false);
  // Edit modal state 
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLink, setEditLink] = useState("");
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editCoverLetter, setEditCoverLetter] = useState(false);
  const [editReference, setEditReference] = useState(false);

  // Count per status tab
  const countByStatus = useMemo(() => {
    const counts: Record<ApplicationStatus, number> = {
      Pending: 0,
      Accepted: 0,
      Rejected: 0,
      Ghosted: 0,
    };
    for (const app of applications) counts[app.status]++;
    return counts;
  }, [applications]);

  // Rows visible in the table
  const visibleApplications = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    return applications.filter(
      (app) =>
        app.status === activeStatus &&
        app.companyName.toLowerCase().includes(query)
    );
  }, [applications, activeStatus, searchTerm]);

  // Moves a single application to a new status
  function updateStatus(id: number, status: ApplicationStatus) {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status } : app))
    );
  }

  // Removes an application by id
  function deleteApplication(id: number) {
    setApplications((prev) => prev.filter((app) => app.id !== id));
  }

  // Add modal handlers
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
      link: newLink.trim(),
      coverLetter: newCoverLetter,
      reference: newReference,
      status: "Pending",
    };
    setApplications((prev) => [application, ...prev]);
    // Reset form fields 
    setNewLink("");
    setNewCompanyName("");
    setNewCoverLetter(false);
    setNewReference(false);
    setIsAddOpen(false);
    setActiveStatus("Pending");
  }

  // Edit modal handlers
  function openEdit(id: number) {
    const app = applications.find((a) => a.id === id);
    if (!app) return;
    setEditingId(id);
    setEditLink(app.link);
    setEditCompanyName(app.companyName);
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
              link: editLink.trim(),
              companyName: editCompanyName.trim(),
              coverLetter: editCoverLetter,
              reference: editReference,
            }
          : app
      )
    );
    setEditingId(null);
  }

  return (
    <main className="app-shell">
      {/* Top bar */}
      <header className="top-bar">
        {/* Status */}
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
          {/* Search */}
          <label className="search-box" aria-label="Search companies">
            <Search size={16} strokeWidth={2.5} aria-hidden />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search company…"
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
          <button className="icon-button" aria-label="Settings" title="Settings">
            <Settings size={20} strokeWidth={2.2} />
          </button>
        </div>
      </header>
      {/* Applications table */}
      <section className="applications-panel">
        <div className="table-header table-grid">
          <span>Date</span>
          <span>Company</span>
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
            visibleApplications.map((app) => (
              <article className="application-row table-grid" key={app.id}>
                <span className="date-text">{app.dateApplied}</span>
                <span className="company-name" title={app.companyName}>{app.companyName}</span>
                <a className="job-link" href={app.link} target="_blank" rel="noreferrer">
                  Open <ExternalLink size={11} aria-hidden />
                </a>
                <BoolChip value={app.coverLetter} />
                <BoolChip value={app.reference} />
                <span className={`status-pill ${pillClass(app.status)}`}>
                  {app.status}
                </span>
                <div className="row-actions">
                  {/* Edit */}
                  <button
                    className="icon-action"
                    onClick={() => openEdit(app.id)}
                    aria-label={`Edit ${app.companyName}`}
                  >
                    <Pencil size={13} />
                  </button>

                  {/* Status transition buttons */}
                  {STATUSES.filter((s) => s !== app.status).map((status) => (
                    <button key={status} onClick={() => updateStatus(app.id, status)}>
                      {status}
                    </button>
                  ))}

                  {/* Delete */}
                  <button
                    className="icon-action danger"
                    onClick={() => deleteApplication(app.id)}
                    aria-label={`Delete ${app.companyName}`}
                  >
                    <Trash2 size={13} />
                  </button>

                </div>
              </article>
            ))
          )}
        </div>
      </section>
      {/* Add application modal */}
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
      {/* Edit application modal */}
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
    </main>
  );
}

export default App;