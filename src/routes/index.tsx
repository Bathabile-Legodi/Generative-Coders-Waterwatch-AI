import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AREAS,
  DATA_NOT_AVAILABLE,
  type Area,
} from "@/lib/areas.data";
import {
  runAnomalyDetection,
  topInspectionBriefs,
  type AnomalyResult,
  type DetectionStats,
  type InspectionBrief,
} from "@/lib/anomaly";
import {
  AlertTriangle,
  CheckCircle,
  ClipboardList,
  Droplets,
  FlaskConical,
  Gauge,
  Info,
  LayoutDashboard,
  MapPin,
  Search,
  ShieldAlert,
  Waves,
  Menu,
  X,
} from "lucide-react";


// Milestone 1: interactive geographical area dashboard only.
// No predictions, readings, alerts or notifications are produced here.
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Waterwatch AI — Water Network Overview",
      },
      {
        name: "description",
        content:
          "Municipal water-network operations dashboard: browse monitoring areas by name and geographical type, and view each area's monitoring information.",
      },
      {
        property: "og:title",
        content: "Waterwatch AI — Water Network Overview",
      },
      {
        property: "og:description",
        content:
          "Select a monitoring area to view its geographical type and reserved water-network measurement section.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});


function measurementRows(area: Area) {
  const m = area.measurements;
  return [
    { label: "Monitored pipe assets", value: String(m.assetCount) },
    { label: "Average flow rate", value: `${m.avgFlowLps.toFixed(1)} L/s` },
    { label: "Average pressure", value: `${m.avgPressureKpa.toFixed(1)} kPa` },
    { label: "Average asset age", value: `${m.avgAssetAgeYears.toFixed(1)} years` },
    { label: "Repairs (last 2 years)", value: String(m.totalRepairsLast2Yrs) },
    { label: "Reservoir level", value: DATA_NOT_AVAILABLE },
    { label: "Supply status", value: DATA_NOT_AVAILABLE },
  ];
}

function Index() {
  const [selectedArea, setSelectedArea] = useState<Area | null>(AREAS[0] ?? null);
  const [query, setQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);

  const visibleAreas = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return AREAS;
    return AREAS.filter((area) => area.name.toLowerCase().includes(q));
  }, [query]);

  const { results: anomalyResults, stats } = useMemo(() => runAnomalyDetection(), []);
  const briefs = useMemo(() => topInspectionBriefs(3), []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-10">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              Water Network Overview
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Select an area to view its monitoring information.
            </p>
          </div>

          {/* Illustrative zone overview */}
          <div className="mt-6">
            <LeakageMap
              areas={AREAS}
              selectedArea={selectedArea}
              onSelect={setSelectedArea}
            />
          </div>

          <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            {/* Areas: search + card grid */}
            <section aria-label="Monitoring areas" className="min-w-0">
              <SearchField query={query} onQueryChange={setQuery} />
              <AreaGrid
                areas={visibleAreas}
                query={query}
                selectedArea={selectedArea}
                onSelect={setSelectedArea}
              />
            </section>

            {/* Details panel */}
            <aside aria-label="Area details" className="lg:sticky lg:top-24">
              <DetailsPanel area={selectedArea} />
            </aside>
          </div>

          {/* ── Anomaly Detection Section ── */}
          <section
            id="anomaly-detection"
            aria-labelledby="anomaly-heading"
            className="mt-10 space-y-8"
          >
            {/* Section header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-teal">
                  Automated Analysis
                </p>
                <h2
                  id="anomaly-heading"
                  className="mt-1 text-xl font-bold tracking-tight text-foreground sm:text-2xl"
                >
                  Anomaly Detection &amp; Inspection Priority
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Unusual flow or pressure readings detected using transparent,
                  reproducible statistics on the workshop synthetic dataset.
                </p>
              </div>
              <button
                type="button"
                id="toggle-methodology"
                aria-expanded={showMethodology}
                onClick={() => setShowMethodology((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:border-teal/60 hover:text-foreground"
              >
                <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
                {showMethodology ? "Hide" : "View"} detection method
              </button>
            </div>

            {/* Detection methodology (collapsible) */}
            {showMethodology && (
              <MethodologyBox stats={stats} />
            )}

            {/* Inspection priority list */}
            <InspectionPriorityList results={anomalyResults} />

            {/* Top-3 inspection briefs */}
            <InspectionBriefs briefs={briefs} />
          </section>
        </div>
      </main>
    </div>
  );
}


// ─── Header ──────────────────────────────────────────────────────────────────

function Header({
  mobileMenuOpen,
  setMobileMenuOpen,
}: {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (v: boolean) => void;
}) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-navy shadow-lg">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-10">
          {/* Logo */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal/20 text-teal">
              <Droplets className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight text-white">
                Waterwatch AI
              </p>
              <p className="truncate text-[11px] text-white/50 hidden sm:block">
                Municipal water networks
              </p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1 ml-8">
            <a
              href="/"
              aria-current="page"
              className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-inset ring-teal/40 transition hover:bg-white/15"
            >
              <LayoutDashboard className="h-4 w-4 text-teal" aria-hidden="true" />
              Dashboard
            </a>
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {/* Status badge */}
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-teal/15 px-3 py-1 text-xs font-semibold text-teal">
              <span className="h-1.5 w-1.5 rounded-full bg-teal" />
              Synthetic Data Demo
            </span>

            {/* Mobile menu toggle */}
            <button
              type="button"
              id="mobile-menu-toggle"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex md:hidden h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {mobileMenuOpen && (
          <div className="border-t border-white/10 bg-navy px-4 pb-4 pt-2 md:hidden">
            <a
              href="/"
              aria-current="page"
              className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white ring-1 ring-inset ring-teal/40"
              onClick={() => setMobileMenuOpen(false)}
            >
              <LayoutDashboard className="h-4 w-4 text-teal" aria-hidden="true" />
              Dashboard
            </a>
            <p className="mt-4 px-1 text-[11px] text-white/40">
              Milestone 1 · Area overview
            </p>
          </div>
        )}
      </header>
    </>
  );
}

// ─── Leakage Map ─────────────────────────────────────────────────────────────

/**
 * South Africa simplified SVG outline + glowing dot markers.
 * Coordinates are projected from lat/lng into a 600×500 viewBox using
 * a simple linear projection calibrated to SA's bounding box.
 *
 * SA bounding box (approx):
 *   lat: -22.1° (north) to -34.8° (south)
 *   lng: 16.4° (west)  to 32.9° (east)
 */
const SA_LAT_MIN = -34.9;
const SA_LAT_MAX = -22.0;
const SA_LNG_MIN = 16.3;
const SA_LNG_MAX = 33.1;
const MAP_W = 600;
const MAP_H = 500;

function projectCoord(lat: number, lng: number) {
  const x = ((lng - SA_LNG_MIN) / (SA_LNG_MAX - SA_LNG_MIN)) * MAP_W;
  const y = ((SA_LAT_MAX - lat) / (SA_LAT_MAX - SA_LAT_MIN)) * MAP_H;
  return { x, y };
}

const RISK_COLORS: Record<Area["leakageRisk"], string> = {
  high: "#ef4444",   // red-500
  medium: "#f97316", // orange-500
  low: "#22d3ee",    // cyan-400
};

// REPAIR_LABEL: based on totalRepairsLast2Yrs (high ≥10, medium 5–9, low <5)
// These are zone-level repair counts, not live risk assessments.
const REPAIR_LABEL: Record<Area["leakageRisk"], string> = {
  high: "High repairs (≥10)",
  medium: "Medium repairs (5–9)",
  low: "Low repairs (<5)",
};


// Simplified South Africa SVG path (public domain outline)
// This is a rough representative outline using approximate coordinates.
const SA_PATH = `
  M 180 40
  L 230 10 L 310 5 L 380 20 L 440 40 L 510 70
  L 560 110 L 580 160 L 575 210 L 555 255
  L 530 290 L 500 315 L 470 330 L 445 360
  L 420 390 L 395 420 L 370 450 L 345 470
  L 320 480 L 300 475 L 280 460 L 255 440
  L 230 415 L 205 385 L 180 355 L 155 320
  L 130 285 L 110 250 L 90 210 L 75 165
  L 70 120 L 80 80 L 110 55 L 145 42 Z
`;

function LeakageMap({
  areas,
  selectedArea,
  onSelect,
}: {
  areas: Area[];
  selectedArea: Area | null;
  onSelect: (area: Area) => void;
}) {
  return (
    <section aria-labelledby="map-heading" className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-navy px-5 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-teal">
            Illustrative Zone Overview
          </p>
          <h2 id="map-heading" className="mt-0.5 text-base font-bold text-white">
            Zone Location Diagram
          </h2>
          <p className="mt-0.5 text-[10px] text-white/40">
            Dot positions are approximate SA city locations — not GPS coordinates from the dataset.
          </p>
        </div>
        {/* Legend — based on repair count, not live risk */}
        <div className="flex flex-col gap-1.5 text-right">
          {(["high", "medium", "low"] as const).map((r) => (
            <span key={r} className="flex items-center justify-end gap-1.5 text-[11px] text-white/70">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: RISK_COLORS[r] }}
              />
              {REPAIR_LABEL[r]}
            </span>
          ))}
        </div>
      </div>

      {/* Map canvas */}
      <div className="relative bg-[oklch(0.18_0.04_262)] p-2 sm:p-4">
        <svg
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          className="w-full max-h-[340px]"
          aria-label="Map of South Africa showing leakage areas"
          role="img"
        >
          <defs>
            {areas.map((area) => (
              <radialGradient
                key={`glow-${area.id}`}
                id={`glow-${area.id}`}
                cx="50%"
                cy="50%"
                r="50%"
              >
                <stop offset="0%" stopColor={RISK_COLORS[area.leakageRisk]} stopOpacity="0.9" />
                <stop offset="100%" stopColor={RISK_COLORS[area.leakageRisk]} stopOpacity="0" />
              </radialGradient>
            ))}
          </defs>

          {/* Grid lines */}
          {[100, 200, 300, 400].map((y) => (
            <line key={`h${y}`} x1={0} y1={y} x2={MAP_W} y2={y}
              stroke="oklch(0.5 0.04 260 / 15%)" strokeWidth={1} />
          ))}
          {[100, 200, 300, 400, 500].map((x) => (
            <line key={`v${x}`} x1={x} y1={0} x2={x} y2={MAP_H}
              stroke="oklch(0.5 0.04 260 / 15%)" strokeWidth={1} />
          ))}

          {/* South Africa outline */}
          <path
            d={SA_PATH}
            fill="oklch(0.28 0.05 262)"
            stroke="oklch(0.63 0.11 194 / 50%)"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />

          {/* Leakage zone markers */}
          {areas.map((area) => {
            const { x, y } = projectCoord(area.coordinates.lat, area.coordinates.lng);
            const isSelected = selectedArea?.id === area.id;
            const color = RISK_COLORS[area.leakageRisk];

            return (
              <g
                key={area.id}
                onClick={() => onSelect(area)}
                role="button"
                aria-label={`${area.name}: ${REPAIR_LABEL[area.leakageRisk]}. Click to view details.`}
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && onSelect(area)}
                style={{ cursor: "pointer" }}
              >
                {/* Outer glow circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 32 : 26}
                  fill={`url(#glow-${area.id})`}
                  opacity={isSelected ? 1 : 0.7}
                  style={{ transition: "r 0.3s ease, opacity 0.3s ease" }}
                />

                {/* Pulsing ring (CSS animation via style tag) */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 14 : 10}
                  fill="none"
                  stroke={color}
                  strokeWidth={isSelected ? 2 : 1.5}
                  opacity={0.5}
                  style={{
                    animation: "leakage-pulse 2s ease-in-out infinite",
                    transformOrigin: `${x}px ${y}px`,
                  }}
                />

                {/* Core dot */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 8 : 6}
                  fill={color}
                  stroke="white"
                  strokeWidth={isSelected ? 2 : 1.5}
                  style={{ transition: "r 0.3s ease" }}
                />

                {/* Label */}
                <text
                  x={x}
                  y={y + (isSelected ? 22 : 18)}
                  textAnchor="middle"
                  fontSize={isSelected ? 11 : 9}
                  fill="white"
                  fontWeight={isSelected ? "700" : "500"}
                  style={{ transition: "all 0.3s ease", pointerEvents: "none" }}
                >
                  {area.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Disclaimer */}
        <p className="mt-2 text-center text-[10px] italic text-white/30">
          Demonstration map — coordinates are approximate South African city locations,
          not sourced from the meter dataset.
        </p>
      </div>
    </section>
  );
}

// ─── Search ───────────────────────────────────────────────────────────────────

function SearchField({
  query,
  onQueryChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search areas by name…"
        aria-label="Filter areas by name"
        className="w-full rounded-xl border border-input bg-card py-2.5 pl-10 pr-4 text-sm text-foreground shadow-sm outline-none transition focus:border-teal focus:outline-none focus:ring-2 focus:ring-ring/40"
      />
    </div>
  );
}

// ─── Area Grid ────────────────────────────────────────────────────────────────

function AreaGrid({
  areas,
  query,
  selectedArea,
  onSelect,
}: {
  areas: Area[];
  query: string;
  selectedArea: Area | null;
  onSelect: (area: Area) => void;
}) {
  if (areas.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-border bg-card p-8 text-center">
        <p className="text-sm font-medium text-foreground">
          No areas match "{query.trim()}"
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try a different area name.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {areas.map((area) => (
        <AreaCard
          key={area.id}
          area={area}
          selected={selectedArea?.id === area.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

// ─── Area Card ────────────────────────────────────────────────────────────────

function AreaCard({
  area,
  selected,
  onSelect,
}: {
  area: Area;
  selected: boolean;
  onSelect: (area: Area) => void;
}) {
  const riskColor = {
    high: "text-red-500 bg-red-500/10",
    medium: "text-orange-400 bg-orange-500/10",
    low: "text-teal bg-teal/10",
  }[area.leakageRisk];

  return (
    <button
      type="button"
      onClick={() => onSelect(area)}
      aria-pressed={selected}
      className={`group rounded-2xl border bg-card p-5 text-left shadow-sm transition outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
        selected
          ? "border-teal ring-2 ring-teal/50"
          : "border-border hover:border-teal/60 hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
            selected ? "bg-navy text-teal" : "bg-teal-soft text-navy"
          }`}
        >
          <MapPin className="h-5 w-5" aria-hidden="true" />
        </span>
        {/* Repair-count badge — based on totalRepairsLast2Yrs */}
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${riskColor}`}>
          <AlertTriangle className="h-3 w-3" aria-hidden="true" />
          {REPAIR_LABEL[area.leakageRisk]}
        </span>
      </div>
      <h3 className="mt-4 truncate text-base font-bold text-foreground">
        {area.name}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{area.geoType}</p>
      <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-teal">
        View monitoring info
        <span
          aria-hidden="true"
          className="transition group-hover:translate-x-0.5"
        >
          →
        </span>
      </p>
    </button>
  );
}

// ─── Data Source Badge ────────────────────────────────────────────────────────

function DataSourceBadge({
  source,
  compact = false,
}: {
  source: Area["dataSource"];
  compact?: boolean;
}) {
  return (
    <span
      title={source}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full bg-secondary font-medium text-secondary-foreground ${
        compact ? "max-w-[9.5rem] px-2.5 py-1 text-left text-[11px] leading-tight" : "px-3 py-1.5 text-xs"
      }`}
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-teal"
      />
      <span className="min-w-0">{source}</span>
    </span>
  );
}

// ─── Details Panel ────────────────────────────────────────────────────────────

function DetailsPanel({ area }: { area: Area | null }) {
  if (!area) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">
          Select an area to view its monitoring information.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-navy px-6 py-5 text-white">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-teal">
          Area details
        </p>
        <h2 className="mt-1.5 text-xl font-bold">{area.name}</h2>
        <p className="mt-1 text-sm text-white/70">{area.geoType}</p>
      </div>

      <div className="space-y-6 px-6 py-6">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Data source
          </span>
          <DataSourceBadge source={area.dataSource} />
        </div>

        {/* Water-network measurements from the uploaded synthetic dataset.
            Fields the dataset does not supply render as "Data not available". */}
        <section aria-labelledby="measurements-heading">
          <h3
            id="measurements-heading"
            className="flex items-center gap-2 text-sm font-bold text-foreground"
          >
            <Gauge className="h-4 w-4 text-teal" aria-hidden="true" />
            Water-network measurements
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Averaged across this zone's monitored pipe assets.
          </p>
          <dl className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border">
            {measurementRows(area).map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-3 bg-surface px-4 py-3"
              >
                <dt className="min-w-0 truncate text-sm text-muted-foreground">
                  {row.label}
                </dt>
                <dd
                  className={`shrink-0 text-sm font-medium ${
                    row.value === DATA_NOT_AVAILABLE
                      ? "italic text-muted-foreground/70"
                      : "text-foreground"
                  }`}
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Per-asset readings from the dataset. */}
        <section aria-labelledby="assets-heading">
          <h3
            id="assets-heading"
            className="flex items-center gap-2 text-sm font-bold text-foreground"
          >
            <Waves className="h-4 w-4 text-teal" aria-hidden="true" />
            Monitored assets
          </h3>
          <div className="mt-3 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[22rem] text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/70 text-muted-foreground">
                  <th scope="col" className="px-3 py-2 font-semibold">Asset</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Age (yrs)</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Flow (L/s)</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Pressure (kPa)</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Repairs (2 yrs)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {area.assets.map((asset) => (
                  <tr key={asset.assetId} className="bg-surface">
                    <th scope="row" className="px-3 py-2 font-medium text-foreground">
                      {asset.assetId}
                    </th>
                    <td className="px-3 py-2 text-muted-foreground">{asset.assetAgeYears}</td>
                    <td className="px-3 py-2 text-muted-foreground">{asset.avgFlowLps}</td>
                    <td className="px-3 py-2 text-muted-foreground">{asset.avgPressureKpa}</td>
                    <td className="px-3 py-2 text-muted-foreground">{asset.pastRepairsLast2Yrs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

// ─── Detection Methodology Box ────────────────────────────────────────────────

function MethodologyBox({ stats }: { stats: DetectionStats }) {
  return (
    <div
      role="region"
      aria-label="Detection methodology"
      className="rounded-2xl border border-teal/20 bg-card p-5 shadow-sm"
    >
      <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
        <FlaskConical className="h-4 w-4 text-teal" aria-hidden="true" />
        Detection Method — Modified Z-score (Iglewicz &amp; Hoaglin 1993)
      </h3>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Unusual readings are identified using the <strong className="text-foreground">Modified Z-score</strong> method
        applied independently to flow rate (L/s) and pressure (kPa) across all {stats.totalAssets} pipe assets.
        {" "}Formula:{" "}
        <code className="rounded bg-secondary px-1 py-0.5 font-mono text-xs">M = 0.6745 × (xi − median) / MAD</code>
        {" "}where MAD = Median Absolute Deviation.
        Assets with{" "}
        <code className="rounded bg-secondary px-1 py-0.5 font-mono text-xs">|M| &gt; {stats.threshold}</code>
        {" "}are flagged. This is a standard, robust threshold for small datasets.
        Composite risk score = flow outlier magnitude (0–40 pts) + pressure outlier magnitude (0–40 pts) + asset age (0–10 pts) + past repairs (0–10 pts).
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Flow median", value: `${stats.flowMedian} L/s` },
          { label: "Flow MAD",    value: `${stats.flowMad} L/s` },
          { label: "Pressure median", value: `${stats.pressureMedian} kPa` },
          { label: "Pressure MAD",    value: `${stats.pressureMad} kPa` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-3">
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-base font-bold text-foreground">{value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-3 text-[11px] italic text-muted-foreground">
        Threshold ±{stats.threshold} · Source: 09_waterwatch_ai_synthetic_meter_data.csv ·
        Answer key not used · All calculations are deterministic arithmetic.
      </p>
    </div>
  );
}

// ─── Inspection Priority List ─────────────────────────────────────────────────

const FLAG_COLORS: Record<string, string> = {
  "flow-high":     "bg-orange-500/10 text-orange-500 border-orange-500/20",
  "flow-low":      "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "pressure-high": "bg-red-500/10 text-red-500 border-red-500/20",
  "pressure-low":  "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const FLAG_LABEL: Record<string, string> = {
  "flow-high":     "Flow ↑ High",
  "flow-low":      "Flow ↓ Low",
  "pressure-high": "Pressure ↑ High",
  "pressure-low":  "Pressure ↓ Low",
};

function InspectionPriorityList({ results }: { results: AnomalyResult[] }) {
  const flagged   = results.filter((r) => r.isFlagged);
  const unflagged = results.filter((r) => !r.isFlagged);

  return (
    <section aria-labelledby="priority-heading">
      <div className="flex flex-wrap items-center gap-3">
        <ClipboardList className="h-5 w-5 text-teal" aria-hidden="true" />
        <h3 id="priority-heading" className="text-base font-bold text-foreground">
          Inspection Priority List
        </h3>
        <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-500">
          {flagged.length} flagged
        </span>
        <span className="rounded-full bg-teal/10 px-2.5 py-0.5 text-xs font-semibold text-teal">
          {unflagged.length} within range
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        All {results.length} assets ranked by composite risk score (highest first).
        Flagged assets have at least one statistically unusual reading (|modified Z| &gt; 3.5).
      </p>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border shadow-sm">
        <table className="w-full min-w-[44rem] text-left text-xs" id="priority-table">
          <thead>
            <tr className="border-b border-border bg-navy text-white/70">
              <th scope="col" className="px-4 py-3 font-semibold">#</th>
              <th scope="col" className="px-4 py-3 font-semibold">Asset ID</th>
              <th scope="col" className="px-4 py-3 font-semibold">Zone</th>
              <th scope="col" className="px-4 py-3 font-semibold">Flow (L/s)</th>
              <th scope="col" className="px-4 py-3 font-semibold">Pressure (kPa)</th>
              <th scope="col" className="px-4 py-3 font-semibold">Age (yrs)</th>
              <th scope="col" className="px-4 py-3 font-semibold">Repairs</th>
              <th scope="col" className="px-4 py-3 font-semibold">Score</th>
              <th scope="col" className="px-4 py-3 font-semibold">Detection reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {results.map((r, idx) => (
              <tr
                key={r.assetId}
                className={`transition ${
                  r.isFlagged
                    ? "bg-red-500/5 hover:bg-red-500/8"
                    : "bg-surface hover:bg-secondary/40"
                }`}
              >
                <td className="px-4 py-3 font-medium text-muted-foreground">{idx + 1}</td>
                <td className="px-4 py-3 font-semibold text-foreground">{r.assetId}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.zone}</td>
                <td className="px-4 py-3 text-foreground">{r.avgFlowLps}</td>
                <td className="px-4 py-3 text-foreground">{r.avgPressureKpa}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.assetAgeYears}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.pastRepairsLast2Yrs}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      r.riskScore >= 55
                        ? "bg-red-500/15 text-red-500"
                        : r.riskScore >= 35
                        ? "bg-orange-500/15 text-orange-400"
                        : "bg-teal/10 text-teal"
                    }`}
                  >
                    {r.riskScore}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {r.isFlagged ? (
                    <div className="flex flex-wrap gap-1">
                      {r.reasons.map((reason) => (
                        <span
                          key={reason.flag}
                          title={reason.explanation}
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
                            FLAG_COLORS[reason.flag] ?? "bg-secondary text-foreground border-border"
                          }`}
                        >
                          {FLAG_LABEL[reason.flag]}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <CheckCircle className="h-3 w-3 text-teal" aria-hidden="true" />
                      Within range
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Inspection Briefs ────────────────────────────────────────────────────────

const URGENCY_STYLES: Record<string, string> = {
  Urgent:   "bg-red-500/10 text-red-500 border border-red-500/30",
  High:     "bg-orange-500/10 text-orange-400 border border-orange-500/30",
  Moderate: "bg-teal/10 text-teal border border-teal/30",
};

function InspectionBriefCard({ brief }: { brief: InspectionBrief }) {
  return (
    <article
      id={`brief-${brief.rank}`}
      aria-label={`Inspection brief for ${brief.assetId}`}
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      {/* Card header */}
      <div className="border-b border-border bg-navy px-5 py-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-teal">
              Priority #{brief.rank}
            </p>
            <p className="mt-0.5 text-base font-bold text-white">{brief.assetId}</p>
            <p className="text-xs text-white/60">{brief.zone}</p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
              URGENCY_STYLES[brief.urgency]
            }`}
          >
            {brief.urgency}
          </span>
        </div>

        {/* Risk score bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] text-white/50">
            <span>Composite risk score</span>
            <span className="font-bold text-white">{brief.riskScore} / 100</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-teal"
              style={{ width: `${brief.riskScore}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 px-5 py-5">
        {/* Measurements */}
        <section aria-label="Measurements">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Available measurements (from dataset)
          </p>
          <dl className="mt-2 grid grid-cols-2 gap-2">
            {[
              { label: "Flow",        value: `${brief.avgFlowLps} L/s` },
              { label: "Pressure",    value: `${brief.avgPressureKpa} kPa` },
              { label: "Age",         value: `${brief.assetAgeYears} yrs` },
              { label: "Repairs (2yr)", value: String(brief.pastRepairsLast2Yrs) },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg border border-border bg-surface p-2">
                <dt className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
                <dd className="mt-0.5 text-sm font-bold text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Detection reasons — deterministic */}
        <section aria-label="Detection reasons">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Why flagged (deterministic calculation)
          </p>
          <div className="mt-2 space-y-2">
            {brief.flags.map((f) => (
              <div
                key={f.flag}
                className={`rounded-lg border p-2.5 text-xs ${
                  FLAG_COLORS[f.flag] ?? "bg-secondary text-foreground border-border"
                }`}
              >
                <p className="font-semibold">{FLAG_LABEL[f.flag]}</p>
                <p className="mt-0.5 leading-relaxed opacity-90">{f.explanation}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Inspection checks */}
        <section aria-label="Recommended inspection checks">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Recommended inspection checks
          </p>
          <ul className="mt-2 space-y-1.5">
            {brief.inspectionChecks.map((check, i) => (
              <li key={i} className="flex gap-2 text-xs text-foreground">
                <span className="mt-0.5 shrink-0 text-teal" aria-hidden="true">✓</span>
                {check}
              </li>
            ))}
          </ul>
        </section>

        {/* Uncertainty */}
        <section aria-label="Uncertainty statement">
          <div className="flex items-start gap-2 rounded-lg border border-border bg-secondary/40 p-3">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Uncertainty: </strong>
              {brief.uncertainty}
            </p>
          </div>
        </section>
      </div>
    </article>
  );
}

function InspectionBriefs({ briefs }: { briefs: InspectionBrief[] }) {
  if (briefs.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No assets flagged — no inspection briefs generated.
      </div>
    );
  }

  return (
    <section aria-labelledby="briefs-heading" id="inspection-briefs">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-teal" aria-hidden="true" />
        <h3 id="briefs-heading" className="text-base font-bold text-foreground">
          Field-Team Inspection Briefs — Top {briefs.length} Priority Assets
        </h3>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Generated from statistical anomaly detection only. No AI-invented conditions or live readings.
        Field teams must apply engineering judgment before acting.
      </p>

      <div className="mt-4 grid gap-6 lg:grid-cols-3">
        {briefs.map((brief) => (
          <InspectionBriefCard key={brief.assetId} brief={brief} />
        ))}
      </div>
    </section>
  );
}
