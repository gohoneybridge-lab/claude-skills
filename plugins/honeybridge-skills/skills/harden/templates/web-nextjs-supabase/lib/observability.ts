// core.observability — the Four Golden Signals as structured events.
//
// Latency, traffic, errors, saturation. This is a minimal, dependency-free
// structured logger: swap the sink for your platform (Vercel/OTel/Datadog)
// without changing call sites. Never use bare console.log in hot paths — use
// these so every signal is queryable.

type Signal = "latency" | "traffic" | "errors" | "saturation";

interface Event {
  signal: Signal;
  name: string;
  value?: number; // ms for latency, count for traffic/errors, 0..1 for saturation
  attrs?: Record<string, string | number | boolean>;
}

function emit(e: Event): void {
  // Structured single-line JSON — parseable by any log backend.
  const line = JSON.stringify({ ts: new Date().toISOString(), ...e });
  if (e.signal === "errors") console.error(line);
  else console.log(line);
}

/** Traffic: count a request/operation. */
export function recordTraffic(name: string, attrs?: Event["attrs"]): void {
  emit({ signal: "traffic", name, value: 1, attrs });
}

/** Errors: record a failure with context. */
export function recordError(name: string, err: unknown, attrs?: Event["attrs"]): void {
  const message = err instanceof Error ? err.message : String(err);
  emit({ signal: "errors", name, attrs: { ...attrs, message } });
}

/** Saturation: report resource pressure as a 0..1 ratio. */
export function recordSaturation(name: string, ratio: number): void {
  emit({ signal: "saturation", name, value: Math.max(0, Math.min(1, ratio)) });
}

/** Latency: time an async operation and emit its duration in ms. */
export async function withLatency<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    emit({ signal: "latency", name, value: Date.now() - start, attrs: { ok: true } });
    return result;
  } catch (err) {
    emit({ signal: "latency", name, value: Date.now() - start, attrs: { ok: false } });
    recordError(name, err);
    throw err;
  }
}
