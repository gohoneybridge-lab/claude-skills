// core.tests — real tests over the observability module. Extend with tests
// for the product's own logic as you fill the template.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { withLatency, recordSaturation, recordTraffic } from "../observability";

describe("observability", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("withLatency returns the wrapped value and logs a latency signal", async () => {
    const result = await withLatency("op", async () => 42);
    expect(result).toBe(42);
    const line = (console.log as unknown as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0];
    expect(line).toContain('"signal":"latency"');
    expect(line).toContain('"ok":true');
  });

  it("withLatency records an error signal and rethrows on failure", async () => {
    await expect(withLatency("bad", async () => { throw new Error("boom"); })).rejects.toThrow("boom");
    const errLine = (console.error as unknown as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0];
    expect(errLine).toContain('"signal":"errors"');
    expect(errLine).toContain("boom");
  });

  it("recordSaturation clamps to the 0..1 range", () => {
    recordSaturation("cpu", 1.7);
    const line = (console.log as unknown as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0];
    expect(line).toContain('"value":1');
  });

  it("recordTraffic emits a traffic signal", () => {
    recordTraffic("hit");
    const line = (console.log as unknown as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0];
    expect(line).toContain('"signal":"traffic"');
  });
});
