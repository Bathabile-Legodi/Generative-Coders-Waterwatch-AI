/**
 * Community Leak Reporting — /report
 * Mobile-first page for residents to report water leaks, broken pipes, and outages.
 * Features: photo upload, GPS, category selection, description, localStorage tracking.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  Droplets,
  FileText,
  Hammer,
  LayoutDashboard,
  Loader2,
  MapPin,
  Navigation,
  Plus,
  RotateCcw,
  Send,
  ShieldAlert,
  Trash2,
  WifiOff,
  X,
} from "lucide-react";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Report a Leak — Waterwatch AI" },
      { name: "description", content: "Report water leaks, broken pipes, and outages in your community." },
    ],
  }),
  component: ReportPage,
});

type Category = "leak" | "broken-pipe" | "outage";
type ReportStatus = "submitted" | "under-review" | "resolved";

interface GpsCoords { lat: number; lng: number; accuracy: number; }

interface LeakReport {
  id: string;
  category: Category;
  description: string;
  photoDataUrl: string | null;
  gps: GpsCoords | null;
  address: string;
  submittedAt: string;
  status: ReportStatus;
}

interface CategoryMeta {
  id: Category;
  label: string;
  description: string;
  Icon: React.FC<{ className?: string }>;
  color: string; bg: string; border: string;
}

const CATEGORIES: CategoryMeta[] = [
  { id: "leak",        label: "Water Leak",    description: "Visible water escaping from a pipe or fitting",     Icon: Droplets, color: "text-teal",      bg: "bg-teal/10",        border: "border-teal/40" },
  { id: "broken-pipe", label: "Broken Pipe",   description: "Damaged, burst or collapsed pipe infrastructure",   Icon: Hammer,   color: "text-orange-400", bg: "bg-orange-500/10",  border: "border-orange-500/30" },
  { id: "outage",      label: "Water Outage",  description: "No water supply or severely low pressure",         Icon: WifiOff,  color: "text-red-400",    bg: "bg-red-500/10",     border: "border-red-500/30" },
];

interface StatusMeta { label: string; color: string; bg: string; Icon: React.FC<{ className?: string }>; detail: string; }
const STATUS_META: Record<ReportStatus, StatusMeta> = {
  submitted:     { label: "Submitted",    color: "text-teal",      bg: "bg-teal/10",       Icon: Send,        detail: "awaiting review" },
  "under-review":{ label: "Under Review", color: "text-orange-400", bg: "bg-orange-500/10", Icon: Clock,       detail: "being investigated" },
  resolved:      { label: "Resolved",     color: "text-green-400",  bg: "bg-green-500/10",  Icon: CheckCircle2,detail: "issue has been addressed" },
};
const STATUS_ORDER: ReportStatus[] = ["submitted", "under-review", "resolved"];

const STORAGE_KEY = "waterwatch_leak_reports_v1";
function loadReports(): LeakReport[] {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) as LeakReport[] : []; } catch { return []; }
}
function saveReports(r: LeakReport[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(r)); } catch {}
}
function generateId() {
  return `WW-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,5).toUpperCase()}`;
}

function ReportPage() {
  const [reports, setReports] = useState<LeakReport[]>(() => loadReports());
  const [view, setView] = useState<"form" | "list">("form");
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => { saveReports(reports); }, [reports]);

  function handleNewReport(r: LeakReport) { setReports(prev => [r, ...prev]); setSubmitted(true); }
  function handleDelete(id: string) { setReports(prev => prev.filter(r => r.id !== id)); }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <ReportHeader view={view} setView={setView} reportCount={reports.length} />
      <main className="flex-1">
        {view === "form"
          ? submitted
            ? <SuccessScreen onNewReport={() => setSubmitted(false)} onViewReports={() => { setSubmitted(false); setView("list"); }} />
            : <ReportForm onSubmit={handleNewReport} />
          : <ReportList reports={reports} onDelete={handleDelete} onNewReport={() => { setSubmitted(false); setView("form"); }} />
        }
      </main>
    </div>
  );
}

function ReportHeader({ view, setView, reportCount }: { view: "form"|"list"; setView: (v: "form"|"list") => void; reportCount: number }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-navy shadow-lg">
      <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-3">
        <Link to="/" className="flex shrink-0 items-center gap-2 text-white/60 transition hover:text-white" aria-label="Dashboard">
          <Droplets className="h-5 w-5 text-teal" aria-hidden="true" />
          <span className="hidden text-xs font-semibold sm:block">Waterwatch AI</span>
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0 text-white/30" aria-hidden="true" />
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <ShieldAlert className="h-4 w-4 shrink-0 text-teal" aria-hidden="true" />
          <span className="truncate text-sm font-bold text-white">Community Leak Reporting</span>
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded-xl bg-white/10 p-1">
          <button id="tab-report-form" type="button" onClick={() => setView("form")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${view === "form" ? "bg-teal text-navy shadow-sm" : "text-white/60 hover:text-white"}`}>
            Report
          </button>
          <button id="tab-my-reports" type="button" onClick={() => setView("list")}
            className={`relative rounded-lg px-3 py-1.5 text-xs font-semibold transition ${view === "list" ? "bg-teal text-navy shadow-sm" : "text-white/60 hover:text-white"}`}>
            My Reports
            {reportCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none">
                {reportCount > 9 ? "9+" : reportCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

function FormSection({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-7">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal text-[11px] font-bold text-navy">{step}</span>
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function FieldError({ message }: { message: string }) {
  return (
    <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-400" role="alert">
      <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}

function ReportForm({ onSubmit }: { onSubmit: (r: LeakReport) => void }) {
  const [category, setCategory] = useState<Category | null>(null);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [gps, setGps] = useState<GpsCoords | null>(null);
  const [gpsState, setGpsState] = useState<"idle"|"loading"|"ok"|"error">("idle");
  const [gpsError, setGpsError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ category?: string; description?: string; location?: string; photo?: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setErrors(prev => ({ ...prev, photo: "Photo must be under 10 MB." })); return; }
    const reader = new FileReader();
    reader.onload = ev => { setPhotoDataUrl(ev.target?.result as string); setErrors(prev => ({ ...prev, photo: "" })); };
    reader.readAsDataURL(file);
  }

  function requestGps() {
    if (!navigator.geolocation) { setGpsState("error"); setGpsError("Geolocation not supported by your browser."); return; }
    setGpsState("loading");
    navigator.geolocation.getCurrentPosition(
      pos => { setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) }); setGpsState("ok"); },
      err => { setGpsState("error"); setGpsError(err.code === 1 ? "Location access denied. Enable it in browser settings." : "Could not get your location. Please try again."); },
      { timeout: 12000, enableHighAccuracy: true }
    );
  }

  function validate() {
    const e: { category?: string; description?: string; location?: string; photo?: string } = {};
    if (!category) e.category = "Please select a report category.";
    if (!description.trim() || description.trim().length < 10) e.description = "Please describe the issue (at least 10 characters).";
    if (!gps && !address.trim()) e.location = "Please share your GPS location or type an address.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setTimeout(() => {
      onSubmit({ id: generateId(), category: category!, description: description.trim(), photoDataUrl, gps, address: address.trim() || (gps ? "GPS location captured" : ""), submittedAt: new Date().toISOString(), status: "submitted" });
      setSubmitting(false);
    }, 900);
  }

  const catMeta = CATEGORIES.find(c => c.id === category);

  return (
    <form onSubmit={handleSubmit} noValidate className="mx-auto w-full max-w-2xl px-4 pb-12 pt-6">
      <div className="mb-7">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">Report an Issue</h1>
        <p className="mt-1 text-sm text-muted-foreground">Help your community by reporting water infrastructure problems. All reports are stored locally on this device.</p>
      </div>

      {/* Step 1: Category */}
      <FormSection step={1} title="What are you reporting?">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {CATEGORIES.map(({ id, label, description: desc, Icon, color, bg, border }) => {
            const isSelected = category === id;
            return (
              <button key={id} type="button" id={`category-${id}`} onClick={() => { setCategory(id); setErrors(prev => ({ ...prev, category: "" })); }}
                aria-pressed={isSelected}
                className={`relative flex flex-col items-start gap-2.5 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/60 ${isSelected ? `${border} ${bg} ring-2 ring-inset ring-teal/15` : "border-border bg-card hover:border-teal/40 hover:bg-secondary/30"}`}>
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${isSelected ? bg : "bg-secondary"}`}>
                  <Icon className={`h-5 w-5 ${isSelected ? color : "text-muted-foreground"}`} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">{label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{desc}</p>
                </div>
                {isSelected && <CheckCircle2 className={`absolute right-3 top-3 h-4 w-4 ${color}`} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
        {errors.category && <FieldError message={errors.category} />}
      </FormSection>

      {/* Step 2: Photo */}
      <FormSection step={2} title="Add a photo (optional)">
        <input ref={fileInputRef} type="file" id="photo-upload" accept="image/*" capture="environment" className="sr-only" onChange={handlePhotoChange} aria-label="Upload or take a photo" />
        {photoDataUrl ? (
          <div className="relative overflow-hidden rounded-2xl border border-border">
            <img src={photoDataUrl} alt="Uploaded photo preview" className="h-52 w-full object-cover sm:h-64" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                <Camera className="h-3 w-3" aria-hidden="true" /> Photo ready
              </span>
            </div>
            <div className="absolute bottom-3 right-3 flex gap-2">
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-xl bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/80">
                <RotateCcw className="h-3 w-3" aria-hidden="true" /> Retake
              </button>
              <button type="button" onClick={() => setPhotoDataUrl(null)}
                className="flex items-center gap-1.5 rounded-xl bg-red-500/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-red-500">
                <Trash2 className="h-3 w-3" aria-hidden="true" /> Remove
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => fileInputRef.current?.click()}
            className="group flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card py-10 transition hover:border-teal/60 hover:bg-secondary/20 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/60">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/10 transition group-hover:bg-teal/20">
              <Camera className="h-7 w-7 text-teal" aria-hidden="true" />
            </span>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">Tap to take a photo or upload</p>
              <p className="mt-0.5 text-xs text-muted-foreground">JPG · PNG · HEIC — max 10 MB</p>
            </div>
          </button>
        )}
        {errors.photo && <FieldError message={errors.photo} />}
      </FormSection>

      {/* Step 3: Location */}
      <FormSection step={3} title="Your location">
        <button type="button" id="gps-button" onClick={requestGps} disabled={gpsState === "loading"}
          className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/60 disabled:opacity-60 ${gpsState === "ok" ? "border-teal/40 bg-teal/5" : gpsState === "error" ? "border-red-500/30 bg-red-500/5" : "border-border bg-card hover:border-teal/40 hover:bg-secondary/30 active:scale-[0.99]"}`}>
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${gpsState === "ok" ? "bg-teal/15" : gpsState === "error" ? "bg-red-500/10" : "bg-secondary"}`}>
            {gpsState === "loading" ? <Loader2 className="h-5 w-5 animate-spin text-teal" aria-hidden="true" />
              : gpsState === "ok" ? <Navigation className="h-5 w-5 text-teal" aria-hidden="true" />
              : <MapPin className="h-5 w-5 text-muted-foreground" aria-hidden="true" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              {gpsState === "ok" ? "GPS location captured" : gpsState === "loading" ? "Getting your location…" : "Use my current location"}
            </p>
            {gpsState === "ok" && gps && (
              <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}<span className="ml-2 font-sans not-italic"> ±{gps.accuracy} m</span>
              </p>
            )}
            {gpsState === "idle" && <p className="mt-0.5 text-xs text-muted-foreground">Tap to share your GPS coordinates</p>}
          </div>
          {gpsState === "ok" && <CheckCircle2 className="h-5 w-5 shrink-0 text-teal" aria-hidden="true" />}
        </button>
        {gpsState === "error" && (
          <div className="mt-2 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400" role="alert">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />{gpsError}
          </div>
        )}
        <div className="mt-3">
          <label htmlFor="address-input" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Or type an address / landmark</label>
          <input id="address-input" type="text" value={address} onChange={e => { setAddress(e.target.value); setErrors(prev => ({ ...prev, location: "" })); }}
            placeholder="e.g. 12 Main Street, Soweto"
            className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30" />
        </div>
        {errors.location && <FieldError message={errors.location} />}
      </FormSection>

      {/* Step 4: Description */}
      <FormSection step={4} title="Describe the issue">
        <textarea id="description-input" value={description}
          onChange={e => { setDescription(e.target.value); setErrors(prev => ({ ...prev, description: "" })); }}
          placeholder={catMeta ? `Describe the ${catMeta.label.toLowerCase()} — when did it start, how severe is it, any safety concerns?` : "Describe what you see — when did it start, how severe is it, any safety hazard?"}
          rows={4} maxLength={600} aria-label="Issue description"
          className="w-full resize-none rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30" />
        <div className="mt-1 flex items-start justify-between gap-2">
          {errors.description ? <FieldError message={errors.description} /> : <span />}
          <span className="shrink-0 text-[11px] text-muted-foreground">{description.length}/600</span>
        </div>
      </FormSection>

      {/* Submit */}
      <div className="pt-2">
        <button type="submit" id="submit-report-button" disabled={submitting}
          className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-teal px-6 py-4 text-base font-bold text-navy shadow-lg shadow-teal/20 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60">
          {submitting ? <><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />Submitting…</> : <><Send className="h-5 w-5" aria-hidden="true" />Submit Report</>}
        </button>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">Reports are stored on this device only. This is a workshop demonstration — no data is sent to a server.</p>
      </div>
    </form>
  );
}

function SuccessScreen({ onNewReport, onViewReports }: { onNewReport: () => void; onViewReports: () => void }) {
  return (
    <div className="mx-auto flex min-h-[72vh] w-full max-w-2xl flex-col items-center justify-center px-4 py-10 text-center">
      <div className="relative mb-6">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-teal/10">
          <CheckCircle2 className="h-12 w-12 text-teal" aria-hidden="true" />
        </div>
        <div className="absolute inset-0 animate-ping rounded-full bg-teal/10" style={{ animationDuration: "1.5s" }} />
      </div>
      <h1 className="text-2xl font-bold text-foreground">Report Submitted!</h1>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">Thank you for helping your community. Your report has been saved and can be tracked under "My Reports".</p>
      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        <button type="button" id="view-my-reports-btn" onClick={onViewReports}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal px-6 py-3.5 text-sm font-bold text-navy shadow-lg shadow-teal/20 transition hover:brightness-110 active:scale-[0.98]">
          <FileText className="h-4 w-4" aria-hidden="true" />View My Reports
        </button>
        <button type="button" id="report-another-btn" onClick={onNewReport}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-6 py-3.5 text-sm font-semibold text-foreground transition hover:border-teal/60 active:scale-[0.98]">
          <Plus className="h-4 w-4" aria-hidden="true" />Report Another Issue
        </button>
        <Link to="/" className="mt-1 flex items-center justify-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
          <LayoutDashboard className="h-4 w-4" aria-hidden="true" />Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

function ReportList({ reports, onDelete, onNewReport }: { reports: LeakReport[]; onDelete: (id: string) => void; onNewReport: () => void }) {
  if (reports.length === 0) {
    return (
      <div className="mx-auto flex min-h-[72vh] w-full max-w-2xl flex-col items-center justify-center px-4 py-10 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
          <FileText className="h-9 w-9 text-muted-foreground" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-bold text-foreground">No reports yet</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">Submit your first report to start tracking it here.</p>
        <button type="button" onClick={onNewReport}
          className="mt-6 flex items-center gap-2 rounded-2xl bg-teal px-6 py-3.5 text-sm font-bold text-navy shadow-lg shadow-teal/20 transition hover:brightness-110 active:scale-[0.98]">
          <Plus className="h-4 w-4" aria-hidden="true" />Report an Issue
        </button>
      </div>
    );
  }
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-12 pt-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">My Reports</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">{reports.length} report{reports.length !== 1 ? "s" : ""} — stored on this device</p>
        </div>
        <button type="button" onClick={onNewReport}
          className="flex items-center gap-1.5 rounded-xl bg-teal px-3 py-2 text-xs font-bold text-navy transition hover:brightness-110 active:scale-[0.98]">
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />New
        </button>
      </div>
      {/* Status legend */}
      <div className="mb-5 flex items-center overflow-x-auto rounded-2xl border border-border bg-card px-4 py-3">
        {STATUS_ORDER.map((s, i) => {
          const meta = STATUS_META[s];
          const Icon = meta.Icon;
          return (
            <div key={s} className="flex items-center gap-0">
              <div className="flex items-center gap-1.5">
                <Icon className={`h-3.5 w-3.5 ${meta.color}`} aria-hidden="true" />
                <span className={`whitespace-nowrap text-[11px] font-semibold ${meta.color}`}>{meta.label}</span>
              </div>
              {i < STATUS_ORDER.length - 1 && <ChevronRight className="mx-2 h-3 w-3 shrink-0 text-muted-foreground/40" aria-hidden="true" />}
            </div>
          );
        })}
      </div>
      <div className="space-y-4" role="list" aria-label="Your submitted reports">
        {reports.map(report => <ReportCard key={report.id} report={report} onDelete={onDelete} />)}
      </div>
    </div>
  );
}

function ReportCard({ report, onDelete }: { report: LeakReport; onDelete: (id: string) => void }) {
  const cat = CATEGORIES.find(c => c.id === report.category)!;
  const { Icon: CatIcon, color, bg } = cat;
  const status = STATUS_META[report.status];
  const { Icon: StatusIcon } = status;
  const currentIdx = STATUS_ORDER.indexOf(report.status);

  const dateStr = new Date(report.submittedAt).toLocaleString("en-ZA", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <article role="listitem" aria-label={`Report ${report.id} — ${cat.label}`}
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-start gap-3 border-b border-border bg-navy px-4 py-3.5">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${bg}`}>
          <CatIcon className={`h-4 w-4 ${color}`} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-white">{cat.label}</p>
          <p className="font-mono text-[10px] text-white/40">{report.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${status.bg} ${status.color}`}>
            <StatusIcon className="h-3 w-3" aria-hidden="true" />{status.label}
          </span>
          <button type="button" onClick={() => onDelete(report.id)} aria-label={`Delete report ${report.id}`}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 transition hover:bg-white/10 hover:text-red-400">
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="space-y-3 p-4">
        {report.photoDataUrl && (
          <img src={report.photoDataUrl} alt={`Photo for report ${report.id}`} className="h-36 w-full rounded-xl object-cover" />
        )}
        <p className="text-sm leading-relaxed text-foreground">{report.description}</p>
        <div className="flex flex-wrap gap-2">
          {(report.gps || report.address) && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3 text-teal" aria-hidden="true" />
              {report.gps ? `${report.gps.lat.toFixed(4)}, ${report.gps.lng.toFixed(4)}` : report.address}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" aria-hidden="true" />{dateStr}
          </span>
        </div>
        <div className="pt-1">
          <div className="flex gap-1">
            {STATUS_ORDER.map((s, i) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= currentIdx ? "bg-teal" : "bg-border"}`} />
            ))}
          </div>
          <p className={`mt-1.5 text-[10px] font-semibold ${status.color}`}>{status.label} — {status.detail}</p>
        </div>
      </div>
    </article>
  );
}
