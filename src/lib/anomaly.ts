/**
 * Waterwatch AI — Anomaly Detection Engine
 *
 * Method: Modified Z-score (Iglewicz & Hoaglin 1993) on flow and pressure.
 *   1. Compute the median and Median Absolute Deviation (MAD) of each metric
 *      across all 15 pipe assets.
 *   2. Modified Z-score = 0.6745 × (xi − median) / MAD
 *   3. Assets with |modified Z| > THRESHOLD (3.5) are flagged as statistical
 *      outliers — a widely used non-parametric rule robust to small datasets.
 *
 * Composite risk score (0–100):
 *   - Flow outlier magnitude  → 0–40 pts
 *   - Pressure outlier magnitude → 0–40 pts
 *   - Asset age               → 0–10 pts (≥25 yrs = 10)
 *   - Past repairs            → 0–10 pts (≥4 = 10)
 *
 * Source: 09_waterwatch_ai_synthetic_meter_data.csv (15 pipes).
 * The answer key is NOT used. Nothing is invented.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type AnomalyFlag = "flow-high" | "flow-low" | "pressure-high" | "pressure-low";

export interface FlaggedReason {
  flag: AnomalyFlag;
  measuredValue: number;
  datasetMedian: number;
  datasetMad: number;
  modifiedZScore: number;
  threshold: number;
  explanation: string;
}

export interface AnomalyResult {
  assetId: string;
  zone: string;
  assetAgeYears: number;
  avgFlowLps: number;
  avgPressureKpa: number;
  pastRepairsLast2Yrs: number;
  reasons: FlaggedReason[];
  riskScore: number;
  isFlagged: boolean;
}

export interface DetectionStats {
  flowMedian: number;
  flowMad: number;
  pressureMedian: number;
  pressureMad: number;
  threshold: number;
  totalAssets: number;
  flaggedCount: number;
}

// ─── Raw data verbatim from CSV ───────────────────────────────────────────────

interface RawPipe {
  assetId: string;
  zone: string;
  assetAgeYears: number;
  avgFlowLps: number;
  avgPressureKpa: number;
  pastRepairsLast2Yrs: number;
}

const PIPES: RawPipe[] = [
  { assetId: "ZoneA-Pipe-01", zone: "Johannesburg Central", assetAgeYears: 6,  avgFlowLps: 8.16,  avgPressureKpa: 179.4, pastRepairsLast2Yrs: 2 },
  { assetId: "ZoneA-Pipe-02", zone: "Johannesburg Central", assetAgeYears: 34, avgFlowLps: 17.05, avgPressureKpa: 237.9, pastRepairsLast2Yrs: 5 },
  { assetId: "ZoneA-Pipe-03", zone: "Johannesburg Central", assetAgeYears: 32, avgFlowLps: 2.2,   avgPressureKpa: 430.0, pastRepairsLast2Yrs: 3 },
  { assetId: "ZoneA-Pipe-04", zone: "Johannesburg Central", assetAgeYears: 6,  avgFlowLps: 10.89, avgPressureKpa: 334.8, pastRepairsLast2Yrs: 1 },
  { assetId: "ZoneA-Pipe-05", zone: "Johannesburg Central", assetAgeYears: 29, avgFlowLps: 9.62,  avgPressureKpa: 432.1, pastRepairsLast2Yrs: 1 },
  { assetId: "ZoneB-Pipe-01", zone: "Sandton", assetAgeYears: 34, avgFlowLps: 7.96,  avgPressureKpa: 313.7, pastRepairsLast2Yrs: 2 },
  { assetId: "ZoneB-Pipe-02", zone: "Sandton", assetAgeYears: 2,  avgFlowLps: 22.77, avgPressureKpa: 216.6, pastRepairsLast2Yrs: 3 },
  { assetId: "ZoneB-Pipe-03", zone: "Sandton", assetAgeYears: 24, avgFlowLps: 2.93,  avgPressureKpa: 245.7, pastRepairsLast2Yrs: 1 },
  { assetId: "ZoneB-Pipe-04", zone: "Sandton", assetAgeYears: 8,  avgFlowLps: 3.54,  avgPressureKpa: 359.0, pastRepairsLast2Yrs: 0 },
  { assetId: "ZoneB-Pipe-05", zone: "Sandton", assetAgeYears: 26, avgFlowLps: 25.71, avgPressureKpa: 152.5, pastRepairsLast2Yrs: 2 },
  { assetId: "ZoneC-Pipe-01", zone: "Soweto", assetAgeYears: 19, avgFlowLps: 5.25,  avgPressureKpa: 324.2, pastRepairsLast2Yrs: 3 },
  { assetId: "ZoneC-Pipe-02", zone: "Soweto", assetAgeYears: 13, avgFlowLps: 7.58,  avgPressureKpa: 375.3, pastRepairsLast2Yrs: 0 },
  { assetId: "ZoneC-Pipe-03", zone: "Soweto", assetAgeYears: 31, avgFlowLps: 13.73, avgPressureKpa: 301.6, pastRepairsLast2Yrs: 1 },
  { assetId: "ZoneC-Pipe-04", zone: "Soweto", assetAgeYears: 14, avgFlowLps: 21.33, avgPressureKpa: 181.7, pastRepairsLast2Yrs: 4 },
  { assetId: "ZoneC-Pipe-05", zone: "Soweto", assetAgeYears: 29, avgFlowLps: 14.35, avgPressureKpa: 435.2, pastRepairsLast2Yrs: 2 },
];

// ─── Statistical helpers ──────────────────────────────────────────────────────

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]!
    : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

export function mad(values: number[], med: number): number {
  const deviations = values.map((v) => Math.abs(v - med));
  return median(deviations);
}

export function modifiedZScore(value: number, med: number, madValue: number): number {
  if (madValue === 0) return 0;
  return (0.6745 * (value - med)) / madValue;
}

function r2(v: number): number {
  return Math.round(v * 100) / 100;
}

// ─── Detection constant ───────────────────────────────────────────────────────

export const OUTLIER_THRESHOLD = 3.5;

// ─── Build reasons ────────────────────────────────────────────────────────────

function buildReasons(
  pipe: RawPipe,
  flowMed: number,
  flowMadVal: number,
  presMed: number,
  presMadVal: number,
): FlaggedReason[] {
  const reasons: FlaggedReason[] = [];

  const flowZ = modifiedZScore(pipe.avgFlowLps, flowMed, flowMadVal);
  const presZ = modifiedZScore(pipe.avgPressureKpa, presMed, presMadVal);

  if (Math.abs(flowZ) > OUTLIER_THRESHOLD) {
    const dir = flowZ > 0 ? "high" : "low";
    reasons.push({
      flag: `flow-${dir}` as AnomalyFlag,
      measuredValue: pipe.avgFlowLps,
      datasetMedian: r2(flowMed),
      datasetMad: r2(flowMadVal),
      modifiedZScore: r2(flowZ),
      threshold: OUTLIER_THRESHOLD,
      explanation:
        dir === "high"
          ? `Flow rate ${pipe.avgFlowLps} L/s is unusually HIGH (modified Z = ${r2(flowZ)}, threshold ±${OUTLIER_THRESHOLD}; dataset median ${r2(flowMed)} L/s). Possible causes: burst pipe, meter fault, or uncontrolled discharge.`
          : `Flow rate ${pipe.avgFlowLps} L/s is unusually LOW (modified Z = ${r2(flowZ)}, threshold ±${OUTLIER_THRESHOLD}; dataset median ${r2(flowMed)} L/s). Possible causes: blockage, valve closure, or significant upstream leak.`,
    });
  }

  if (Math.abs(presZ) > OUTLIER_THRESHOLD) {
    const dir = presZ > 0 ? "high" : "low";
    reasons.push({
      flag: `pressure-${dir}` as AnomalyFlag,
      measuredValue: pipe.avgPressureKpa,
      datasetMedian: r2(presMed),
      datasetMad: r2(presMadVal),
      modifiedZScore: r2(presZ),
      threshold: OUTLIER_THRESHOLD,
      explanation:
        dir === "high"
          ? `Pressure ${pipe.avgPressureKpa} kPa is unusually HIGH (modified Z = ${r2(presZ)}, threshold ±${OUTLIER_THRESHOLD}; dataset median ${r2(presMed)} kPa). High pressure stresses pipe walls and joints, increasing failure risk.`
          : `Pressure ${pipe.avgPressureKpa} kPa is unusually LOW (modified Z = ${r2(presZ)}, threshold ±${OUTLIER_THRESHOLD}; dataset median ${r2(presMed)} kPa). Possible causes: active leak, burst, or heavy downstream demand.`,
    });
  }

  return reasons;
}

function riskScore(pipe: RawPipe, flowZ: number, presZ: number): number {
  const flowPts = Math.min(40, (Math.abs(flowZ) / OUTLIER_THRESHOLD) * 20);
  const presPts = Math.min(40, (Math.abs(presZ) / OUTLIER_THRESHOLD) * 20);
  const agePts  = Math.min(10, (pipe.assetAgeYears / 25) * 10);
  const repPts  = Math.min(10, (pipe.pastRepairsLast2Yrs / 4) * 10);
  return Math.round(flowPts + presPts + agePts + repPts);
}

// ─── Public API ───────────────────────────────────────────────────────────────

let _cached: { results: AnomalyResult[]; stats: DetectionStats } | null = null;

export function runAnomalyDetection(): { results: AnomalyResult[]; stats: DetectionStats } {
  if (_cached) return _cached;

  const flows     = PIPES.map((p) => p.avgFlowLps);
  const pressures = PIPES.map((p) => p.avgPressureKpa);

  const flowMed    = median(flows);
  const flowMadVal = mad(flows, flowMed);
  const presMed    = median(pressures);
  const presMadVal = mad(pressures, presMed);

  const results: AnomalyResult[] = PIPES.map((pipe) => {
    const flowZ   = modifiedZScore(pipe.avgFlowLps,     flowMed, flowMadVal);
    const presZ   = modifiedZScore(pipe.avgPressureKpa, presMed, presMadVal);
    const reasons = buildReasons(pipe, flowMed, flowMadVal, presMed, presMadVal);
    const score   = riskScore(pipe, flowZ, presZ);

    return {
      assetId:            pipe.assetId,
      zone:               pipe.zone,
      assetAgeYears:      pipe.assetAgeYears,
      avgFlowLps:         pipe.avgFlowLps,
      avgPressureKpa:     pipe.avgPressureKpa,
      pastRepairsLast2Yrs: pipe.pastRepairsLast2Yrs,
      reasons,
      riskScore:  score,
      isFlagged:  reasons.length > 0,
    };
  });

  results.sort((a, b) => b.riskScore - a.riskScore || a.assetId.localeCompare(b.assetId));

  const stats: DetectionStats = {
    flowMedian:      r2(flowMed),
    flowMad:         r2(flowMadVal),
    pressureMedian:  r2(presMed),
    pressureMad:     r2(presMadVal),
    threshold:       OUTLIER_THRESHOLD,
    totalAssets:     PIPES.length,
    flaggedCount:    results.filter((r) => r.isFlagged).length,
  };

  _cached = { results, stats };
  return _cached;
}

// ─── Inspection briefs ────────────────────────────────────────────────────────

export type UrgencyLevel = "Urgent" | "High" | "Moderate";

export interface InspectionBrief {
  rank: number;
  assetId: string;
  zone: string;
  assetAgeYears: number;
  avgFlowLps: number;
  avgPressureKpa: number;
  pastRepairsLast2Yrs: number;
  riskScore: number;
  urgency: UrgencyLevel;
  flags: FlaggedReason[];
  inspectionChecks: string[];
  uncertainty: string;
}

function urgencyFromScore(score: number): UrgencyLevel {
  if (score >= 55) return "Urgent";
  if (score >= 35) return "High";
  return "Moderate";
}

function checksForFlags(flags: FlaggedReason[]): string[] {
  const checks: string[] = [];
  for (const f of flags) {
    if (f.flag === "flow-high") {
      checks.push(
        "Verify meter calibration and check for stuck-open control valves.",
        "Inspect upstream junction for signs of backflow or pressure surge.",
        "Look for water ponding or ground saturation near the pipe route.",
      );
    } else if (f.flag === "flow-low") {
      checks.push(
        "Check for partial or full valve closure along the segment.",
        "Inspect pipe for visible blockages, sediment build-up, or crimping.",
        "Assess upstream supply pressure to isolate demand-side vs supply-side cause.",
      );
    } else if (f.flag === "pressure-high") {
      checks.push(
        "Inspect pressure-reducing valve (PRV) settings and condition.",
        "Check pipe joints and fittings for micro-cracks or seepage under high pressure.",
        "Review recent operational changes that may have reduced downstream demand.",
      );
    } else if (f.flag === "pressure-low") {
      checks.push(
        "Trace the segment for visible leaks, wet patches, or soil erosion.",
        "Test upstream isolation valve status and check for partial blockage.",
        "Measure pressure at multiple points along the segment to locate the drop zone.",
      );
    }
  }
  return [...new Set(checks)];
}

function uncertaintyStatement(pipe: RawPipe): string {
  const parts = [
    "Assessment is based on averaged readings from the synthetic workshop dataset only.",
    "Time-series variation, real-time sensor readings, and field conditions are unavailable.",
  ];
  if (pipe.assetAgeYears > 0 && pipe.pastRepairsLast2Yrs > 0) {
    parts.push(
      `Asset age (${pipe.assetAgeYears} yrs) and repair history (${pipe.pastRepairsLast2Yrs} repair(s)) are context factors — structural condition requires physical inspection to confirm.`,
    );
  }
  parts.push(
    "Statistical flagging does not guarantee a fault; field teams should apply engineering judgment.",
  );
  return parts.join(" ");
}

export function topInspectionBriefs(n = 3): InspectionBrief[] {
  const { results } = runAnomalyDetection();
  const flagged = results.filter((r) => r.isFlagged);
  return flagged.slice(0, n).map((r, i) => ({
    rank:               i + 1,
    assetId:            r.assetId,
    zone:               r.zone,
    assetAgeYears:      r.assetAgeYears,
    avgFlowLps:         r.avgFlowLps,
    avgPressureKpa:     r.avgPressureKpa,
    pastRepairsLast2Yrs: r.pastRepairsLast2Yrs,
    riskScore:          r.riskScore,
    urgency:            urgencyFromScore(r.riskScore),
    flags:              r.reasons,
    inspectionChecks:   checksForFlags(r.reasons),
    uncertainty:        uncertaintyStatement({
      assetId:            r.assetId,
      zone:               r.zone,
      assetAgeYears:      r.assetAgeYears,
      avgFlowLps:         r.avgFlowLps,
      avgPressureKpa:     r.avgPressureKpa,
      pastRepairsLast2Yrs: r.pastRepairsLast2Yrs,
    }),
  }));
}
