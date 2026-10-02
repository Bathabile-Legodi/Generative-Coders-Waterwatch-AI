import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AREAS,
  DATA_NOT_AVAILABLE,
  type Area,
} from "@/lib/areas.data";
import {
  Droplets,
  Gauge,
  Layers,
  LayoutDashboard,
  MapPin,
  Radar,
  Search,
  Waves,
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

  const visibleAreas = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return AREAS;
    return AREAS.filter((area) => area.name.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-10">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Water Network Overview
            </h1>
            <p className="mt-2 text-base text-muted-foreground">
              Select an area to view its monitoring information.
            </p>
          </div>

          <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
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

            {/* Details panel: same page, updated on click without reload */}
            <aside aria-label="Area details" className="lg:sticky lg:top-6">
              <DetailsPanel area={selectedArea} />
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-navy px-5 py-7 text-white md:flex">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/20 text-teal">
          <Droplets className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-bold leading-tight">
            Waterwatch AI
          </p>
          <p className="truncate text-xs text-white/60">
            Municipal water networks
          </p>
        </div>
      </div>

      <nav aria-label="Main navigation" className="mt-10 flex-1">
        <p className="px-3 text-[11px] font-semibold uppercase tracking-widest text-white/40">
          Navigation
        </p>
        <ul className="mt-3 space-y-1">
          <li>
            <a
              href="/"
              aria-current="page"
              className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2.5 text-sm font-semibold text-white ring-1 ring-inset ring-teal/40"
            >
              <LayoutDashboard className="h-4 w-4 text-teal" aria-hidden="true" />
              Dashboard
            </a>
          </li>
        </ul>
      </nav>

      <p className="px-3 text-[11px] leading-relaxed text-white/40">
        Milestone 1 · Area overview
      </p>
    </aside>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-10">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy text-white md:hidden">
          <Droplets className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground md:hidden">
            Waterwatch AI
          </p>
          <p className="hidden truncate text-sm font-semibold text-foreground md:block">
            Dashboard
          </p>
          <p className="truncate text-xs text-muted-foreground">
            South African municipal water networks
          </p>
        </div>
      </div>
    </header>
  );
}

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
          No areas match “{query.trim()}”
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

function AreaCard({
  area,
  selected,
  onSelect,
}: {
  area: Area;
  selected: boolean;
  onSelect: (area: Area) => void;
}) {
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
        <DataSourceBadge source={area.dataSource} compact />
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

        {/* Reserved space for an interactive area map. No coordinates are
            available in the current data, so no markers are rendered. */}
        <section
          aria-labelledby="map-heading"
          className="rounded-xl border border-dashed border-border bg-secondary/60 p-4"
        >
          <h3
            id="map-heading"
            className="flex items-center gap-2 text-sm font-bold text-foreground"
          >
            <Layers className="h-4 w-4 text-teal" aria-hidden="true" />
            Area map
          </h3>
          <p className="mt-1.5 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <Radar
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal"
              aria-hidden="true"
            />
            Reserved for an interactive map of this area. Map markers appear
            once the area has coordinates.
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground/80 italic">
            <Waves className="h-3.5 w-3.5" aria-hidden="true" />
            Map not available — no coordinates in the current data
          </p>
        </section>
      </div>
    </div>
  );
}
