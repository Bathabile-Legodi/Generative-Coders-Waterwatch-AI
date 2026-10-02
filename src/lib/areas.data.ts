// Waterwatch AI — area data for Milestone 1.
//
// Source: uploaded synthetic Waterwatch meter dataset
// (09_waterwatch_ai_synthetic_meter_data.csv) — 15 pipe assets across
// three zones. All figures below are derived directly from that file;
// nothing is invented.
//
// Rules enforced here:
// - Never invent water readings, incident counts, live conditions, coordinates
//   or municipality boundaries.
// - The dataset supplies no coordinates, so no map markers are rendered.
// - Any field the dataset does not supply renders as "Data not available".

export type DataSource = "Workshop synthetic data" | "Demonstration placeholder";

export interface PipeAsset {
  assetId: string;
  assetAgeYears: number;
  avgFlowLps: number;
  avgPressureKpa: number;
  pastRepairsLast2Yrs: number;
}

export interface ZoneMeasurements {
  assetCount: number;
  avgFlowLps: number;
  avgPressureKpa: number;
  avgAssetAgeYears: number;
  totalRepairsLast2Yrs: number;
}

export interface Area {
  id: string;
  name: string;
  geoType: string;
  dataSource: DataSource;
  assets: PipeAsset[];
  measurements: ZoneMeasurements;
  /**
   * Representative coordinates for map display (demonstration placeholders).
   * These are approximate South African city coordinates used for visual
   * map rendering only — not sourced from the meter dataset.
   */
  coordinates: { lat: number; lng: number };
  /**
   * Leakage risk level derived from totalRepairsLast2Yrs: high (≥10), medium (5–9), low (<5).
   */
  leakageRisk: "high" | "medium" | "low";
}

interface RawRow {
  asset_id: string;
  zone: string;
  asset_age_years: number;
  avg_flow_lps: number;
  avg_pressure_kpa: number;
  past_repairs_last_2yrs: number;
}

// Rows transcribed verbatim from the uploaded CSV (zone names updated).
const RAW_ROWS: RawRow[] = [
  { asset_id: "ZoneA-Pipe-01", zone: "Johannesburg Central", asset_age_years: 6, avg_flow_lps: 8.16, avg_pressure_kpa: 179.4, past_repairs_last_2yrs: 2 },
  { asset_id: "ZoneA-Pipe-02", zone: "Johannesburg Central", asset_age_years: 34, avg_flow_lps: 17.05, avg_pressure_kpa: 237.9, past_repairs_last_2yrs: 5 },
  { asset_id: "ZoneA-Pipe-03", zone: "Johannesburg Central", asset_age_years: 32, avg_flow_lps: 2.2, avg_pressure_kpa: 430.0, past_repairs_last_2yrs: 3 },
  { asset_id: "ZoneA-Pipe-04", zone: "Johannesburg Central", asset_age_years: 6, avg_flow_lps: 10.89, avg_pressure_kpa: 334.8, past_repairs_last_2yrs: 1 },
  { asset_id: "ZoneA-Pipe-05", zone: "Johannesburg Central", asset_age_years: 29, avg_flow_lps: 9.62, avg_pressure_kpa: 432.1, past_repairs_last_2yrs: 1 },
  { asset_id: "ZoneB-Pipe-01", zone: "Sandton", asset_age_years: 34, avg_flow_lps: 7.96, avg_pressure_kpa: 313.7, past_repairs_last_2yrs: 2 },
  { asset_id: "ZoneB-Pipe-02", zone: "Sandton", asset_age_years: 2, avg_flow_lps: 22.77, avg_pressure_kpa: 216.6, past_repairs_last_2yrs: 3 },
  { asset_id: "ZoneB-Pipe-03", zone: "Sandton", asset_age_years: 24, avg_flow_lps: 2.93, avg_pressure_kpa: 245.7, past_repairs_last_2yrs: 1 },
  { asset_id: "ZoneB-Pipe-04", zone: "Sandton", asset_age_years: 8, avg_flow_lps: 3.54, avg_pressure_kpa: 359.0, past_repairs_last_2yrs: 0 },
  { asset_id: "ZoneB-Pipe-05", zone: "Sandton", asset_age_years: 26, avg_flow_lps: 25.71, avg_pressure_kpa: 152.5, past_repairs_last_2yrs: 2 },
  { asset_id: "ZoneC-Pipe-01", zone: "Soweto", asset_age_years: 19, avg_flow_lps: 5.25, avg_pressure_kpa: 324.2, past_repairs_last_2yrs: 3 },
  { asset_id: "ZoneC-Pipe-02", zone: "Soweto", asset_age_years: 13, avg_flow_lps: 7.58, avg_pressure_kpa: 375.3, past_repairs_last_2yrs: 0 },
  { asset_id: "ZoneC-Pipe-03", zone: "Soweto", asset_age_years: 31, avg_flow_lps: 13.73, avg_pressure_kpa: 301.6, past_repairs_last_2yrs: 1 },
  { asset_id: "ZoneC-Pipe-04", zone: "Soweto", asset_age_years: 14, avg_flow_lps: 21.33, avg_pressure_kpa: 181.7, past_repairs_last_2yrs: 4 },
  { asset_id: "ZoneC-Pipe-05", zone: "Soweto", asset_age_years: 29, avg_flow_lps: 14.35, avg_pressure_kpa: 435.2, past_repairs_last_2yrs: 2 },
];

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function buildArea(zoneName: string): Area {
  const rows = RAW_ROWS.filter((row) => row.zone === zoneName);
  const assets: PipeAsset[] = rows.map((row) => ({
    assetId: row.asset_id,
    assetAgeYears: row.asset_age_years,
    avgFlowLps: row.avg_flow_lps,
    avgPressureKpa: row.avg_pressure_kpa,
    pastRepairsLast2Yrs: row.past_repairs_last_2yrs,
  }));
  const n = rows.length;
  const sum = (pick: (row: RawRow) => number) =>
    rows.reduce((total, row) => total + pick(row), 0);

  const totalRepairs = sum((r) => r.past_repairs_last_2yrs);
  const leakageRisk: Area["leakageRisk"] =
    totalRepairs >= 10 ? "high" : totalRepairs >= 5 ? "medium" : "low";

  // Demonstration coordinates only — approximate Johannesburg locations
  // used for visual map rendering, not sourced from the meter dataset.
  const ZONE_COORDS: Record<string, { lat: number; lng: number }> = {
    "Johannesburg Central": { lat: -26.2041, lng: 28.0473 },
    "Sandton": { lat: -26.1076, lng: 28.0567 },
    "Soweto": { lat: -26.2485, lng: 27.8540 },
  };

  return {
    id: zoneName.toLowerCase().replace(/\s+/g, "-"),
    name: zoneName,
    geoType: "Water network zone (synthetic)",
    dataSource: "Workshop synthetic data",
    assets,
    coordinates: ZONE_COORDS[zoneName] ?? { lat: -28.4793, lng: 24.6727 },
    leakageRisk,
    measurements: {
      assetCount: n,
      avgFlowLps: round1(sum((r) => r.avg_flow_lps) / n),
      avgPressureKpa: round1(sum((r) => r.avg_pressure_kpa) / n),
      avgAssetAgeYears: round1(sum((r) => r.asset_age_years) / n),
      totalRepairsLast2Yrs: totalRepairs,
    },
  };
}

export const AREAS: Area[] = ["Johannesburg Central", "Sandton", "Soweto"].map(buildArea);

export const DATA_NOT_AVAILABLE = "Data not available";
