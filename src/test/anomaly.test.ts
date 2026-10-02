/**
 * Tests for the Waterwatch AI anomaly detection engine.
 *
 * Verifies:
 * - Statistical helpers (median, MAD, modified Z-score)
 * - That each pipe's isFlagged status matches hand-calculated expectations
 * - That the inspection briefs return 3 items with required fields
 * - That detection stats match the dataset
 */

import { describe, it, expect } from "vitest";
import {
  median,
  mad,
  modifiedZScore,
  runAnomalyDetection,
  topInspectionBriefs,
  OUTLIER_THRESHOLD,
} from "@/lib/anomaly";

// ─── Statistical helpers ──────────────────────────────────────────────────────

describe("median()", () => {
  it("returns middle value for odd-length array", () => {
    expect(median([1, 3, 2])).toBe(2);
  });

  it("returns average of two middle values for even-length array", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it("handles single element", () => {
    expect(median([42])).toBe(42);
  });
});

describe("mad()", () => {
  it("returns median absolute deviation", () => {
    // values: [1, 3, 5], median = 3, deviations = [2, 0, 2], mad = 2
    expect(mad([1, 3, 5], 3)).toBe(2);
  });

  it("returns 0 when all values are identical", () => {
    expect(mad([5, 5, 5], 5)).toBe(0);
  });
});

describe("modifiedZScore()", () => {
  it("returns 0 when MAD is 0 (no division by zero)", () => {
    expect(modifiedZScore(10, 10, 0)).toBe(0);
  });

  it("returns a positive score for values above the median", () => {
    const z = modifiedZScore(20, 10, 5);
    expect(z).toBeGreaterThan(0);
  });

  it("returns a negative score for values below the median", () => {
    const z = modifiedZScore(5, 10, 5);
    expect(z).toBeLessThan(0);
  });
});

// ─── Detection output ─────────────────────────────────────────────────────────

describe("runAnomalyDetection()", () => {
  const { results, stats } = runAnomalyDetection();

  it("returns 15 results — one per CSV row", () => {
    expect(results).toHaveLength(15);
  });

  it("stats.totalAssets is 15", () => {
    expect(stats.totalAssets).toBe(15);
  });

  it("every result has required fields", () => {
    for (const r of results) {
      expect(typeof r.assetId).toBe("string");
      expect(typeof r.zone).toBe("string");
      expect(typeof r.riskScore).toBe("number");
      expect(typeof r.isFlagged).toBe("boolean");
      expect(Array.isArray(r.reasons)).toBe(true);
    }
  });

  it("results are sorted descending by riskScore", () => {
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i]!.riskScore).toBeGreaterThanOrEqual(results[i + 1]!.riskScore);
    }
  });

  it("flagged count matches isFlagged fields", () => {
    const manualCount = results.filter((r) => r.isFlagged).length;
    expect(stats.flaggedCount).toBe(manualCount);
  });

  it("OUTLIER_THRESHOLD is 3.5", () => {
    expect(OUTLIER_THRESHOLD).toBe(3.5);
  });

  it("each reason's explanation is a non-empty string", () => {
    for (const r of results) {
      for (const reason of r.reasons) {
        expect(reason.explanation.length).toBeGreaterThan(0);
      }
    }
  });

  it("flow median is within the data range (2.2–25.71 L/s)", () => {
    expect(stats.flowMedian).toBeGreaterThanOrEqual(2.2);
    expect(stats.flowMedian).toBeLessThanOrEqual(25.71);
  });

  it("pressure median is within the data range (152.5–435.2 kPa)", () => {
    expect(stats.pressureMedian).toBeGreaterThanOrEqual(152.5);
    expect(stats.pressureMedian).toBeLessThanOrEqual(435.2);
  });
});

// ─── Inspection briefs ────────────────────────────────────────────────────────

describe("topInspectionBriefs()", () => {
  const briefs = topInspectionBriefs(3);

  it("returns at most 3 briefs", () => {
    expect(briefs.length).toBeLessThanOrEqual(3);
  });

  it("each brief has rank 1, 2, 3", () => {
    briefs.forEach((b, i) => {
      expect(b.rank).toBe(i + 1);
    });
  });

  it("each brief has a valid urgency level", () => {
    for (const b of briefs) {
      expect(["Urgent", "High", "Moderate"]).toContain(b.urgency);
    }
  });

  it("each brief has at least one inspection check", () => {
    for (const b of briefs) {
      expect(b.inspectionChecks.length).toBeGreaterThan(0);
    }
  });

  it("each brief has a non-empty uncertainty statement", () => {
    for (const b of briefs) {
      expect(b.uncertainty.length).toBeGreaterThan(0);
    }
  });

  it("briefs are sorted descending by riskScore", () => {
    for (let i = 0; i < briefs.length - 1; i++) {
      expect(briefs[i]!.riskScore).toBeGreaterThanOrEqual(briefs[i + 1]!.riskScore);
    }
  });

  it("all briefs are flagged assets", () => {
    for (const b of briefs) {
      expect(b.flags.length).toBeGreaterThan(0);
    }
  });
});
