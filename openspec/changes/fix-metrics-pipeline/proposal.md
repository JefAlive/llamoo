## Why

The runner screen's real-time metrics display is broken. The llama-server `/metrics` endpoint exposes data in Prometheus exposition format, but `fetchServerMetrics` calls `response.json()` which throws on the text response. The entire server metrics path silently fails and falls back to OS-only data (RAM + CPU), leaving VRAM, CTX, KV, TOK, TTFT, and GPU permanently at zero. CPU also shows stale values because the OS fallback uses cumulative jiffies without delta tracking.

## What Changes

- **NEW**: `fetchPrometheusMetrics()` — parse llama-server's Prometheus-text `/metrics` endpoint with a lightweight line-by-line parser
- **NEW**: `mergeMetrics()` — combine Prometheus-derived values (tok/s, ctx size, KV cache) with OS-derived values (RAM used/total, CPU delta %) into a single `Metrics` object
- **MODIFIED**: `useServerMetrics` hook — try Prometheus first, fall back to OS-only when server is unreachable
- **FIX**: CPU delta tracking in OS fallback — calculate live CPU % from consecutive `os.cpus()` samples instead of raw cumulative jiffies
- **FIX**: KV estimate in OS fallback — use `estimateKVCache()` in the fallback path instead of hardcoded 0

## Capabilities

### New Capabilities
- `prometheus-metrics`: Parse Prometheus exposition format from llama-server `/metrics` endpoint and extract relevant metrics (tokens/second, context size, KV cache usage, slot state)

### Modified Capabilities
- `resource-monitoring`: Change metrics source from (non-existent JSON) to (Prometheus + OS hybrid). Update the source-of-truth for CTX, TOK, TTFT from the imaginary JSON fields to real Prometheus metric names (`llamacpp:n_tokens_max`, `llamacpp:predicted_tokens_seconds`, `llamacpp:prompt_tokens_seconds`). Add CPU delta tracking and KV estimate wiring in the OS fallback path.

## Impact

- `src/utils/llamaMetrics.ts`: Add Prometheus parser, modify `fetchServerMetrics` to detect and parse Prometheus format, add CPU delta state management
- `src/hooks/useServerMetrics.ts`: Update to use new parser, keep delta tracking refactor
- No UI changes — the `ProgressBarGauge` components and `RunnerScreen` stay the same
