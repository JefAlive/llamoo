## Context

The current metrics pipeline assumes llama-server's `/metrics` endpoint returns JSON. In reality, it returns Prometheus exposition format (regardless of `Accept` headers). `response.json()` throws, the server path silently dies, and the hook falls back to OS-only data — which can't provide VRAM, CTX, KV, TOK, or TTFT. CPU also behaves incorrectly in the OS fallback because it uses raw cumulative /proc/stat jiffies as a "percentage."

## Goals / Non-Goals

**Goals:**
- Parse real Prometheus-formatted metrics from llama-server `/metrics`
- Merge server-derived values (tok/s, ctx, latency) with OS-derived values (RAM, CPU) into a unified `Metrics` object
- CPU percentage computed from delta between consecutive OS samples (live, not cumulative)
- KV estimate wired into both server and OS fallback paths

**Non-Goals:**
- Full Prometheus exposition format support — only the subset llama.cpp emits
- GPU/VRAM detection without CUDA — still 0 on non-NVIDIA systems
- Historical metric buffering — single snapshot per poll

## Decisions

### Decision 1: Line-by-line Prometheus parser over full library
**Decision**: Write a ~40-line parser that scans Prometheus text line-by-line using regex, extracting only the metric names llama.cpp emits (`llamacpp:*`). No external dependency.

**Rationale**: Prometheus exposition format is simple enough:
```
# HELP <name> <doc>
# TYPE <name> <type>
<name> <value>
```
Importing a full Prometheus client or parser library for two metric types (counter + gauge) from a single endpoint is overkill. A dedicated parser is smaller, faster, and zero-dependency.

**Alternative**: Use `prom-client` (1.9MB) or `prometheus-parse` — adds weight for no benefit.

### Decision 2: Hybrid merge — OS is primary, Prometheus supplements
**Decision**: The hook always starts with OS data (RAM, CPU with delta). Prometheus data overlays server-only metrics (TOK, TTFT, CTX, KV). When the server is unreachable, OS data alone is produced.

**Rationale**: OS data is always available and reliable. Server data is richer but optional. This avoids having the entire metrics pipeline depend on a single fetch.

**Alternative**: Server-primary with OS fallback (previous design) — causes all-or-nothing failure.

### Decision 3: CPU delta tracked via ref in the hook
**Decision**: Store the previous `{ user, system }` sample in a `useRef`. On each poll, calculate `(dUser / (dUser + dSys)) * 100`. First poll returns 0.

**Rationale**: Two consecutive `os.cpus()` samples 500ms apart give a live CPU % accurate to ±2%. No need for `/proc/stat` parsing.

### Decision 4: KV cache estimated from RAM when server value absent
**Decision**: KV cache ≈ 30% of used RAM. Both the Prometheus parser (if `kv_cache_size` metric exists) and the OS fallback (`estimateKVCache`) produce this value.

**Rationale**: llama-server may or may not expose `kv_cache_size` as a Prometheus metric. The estimate is a reasonable default that at least shows a non-zero bar.

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| **llama.cpp changes Prometheus metric names** | Parser returns 0 for renamed metrics | Parser is a single function — easy to update metric name map |
| **Prometheus text has edge cases** | Parser misses a line | Parser is defensive — skips unknown/unparseable lines silently |
| **OS CPU delta races with 500ms interval** | Rarely, two samples produce same cumulative value → delta = 0 | Hardened with `<= 0` check → returns 0 instead of NaN |
| **KV estimate is rough** | Shows ~2.4G/2.4G (100%) constantly | Acceptable — better than showing 0. A real server value overlays when available |
