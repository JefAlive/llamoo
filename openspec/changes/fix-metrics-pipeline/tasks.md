## 1. Prometheus Parser

- [x] 1.1 Add `parsePrometheusMetrics(text: string): PromMetrics | null` to `src/utils/llamaMetrics.ts` — line-by-line regex parser for `llamacpp:*` and `kv_cache_size` metrics
- [x] 1.2 Update `fetchServerMetrics` to detect Prometheus format (skip `#` lines, parse `name value`) and call `parsePrometheusMetrics` instead of `response.json()`
- [x] 1.3 Add `fetchPrometheusMetrics` as a dedicated entry point that fetches `/metrics` text and pipes through `parsePrometheusMetrics`

## 2. CPU Delta Tracking

- [x] 2.1 Update `fetchProcMetrics` in `src/utils/llamaMetrics.ts` — use `os.totalmem()`, `os.freemem()`, and `os.cpus()`; no `/proc/stat` or `/proc/meminfo` file reads
- [x] 2.2 In `useServerMetrics` hook (`src/hooks/useServerMetrics.ts`), add `useRef` to hold previous `os.cpus()` sample, compute delta `dUser / (dUser + dSys) * 100`, return 0 on first poll

## 3. Merge & Fallback Wiring

- [x] 3.1 Add `mergeMetrics(prom: PromMetrics | null, proc: ProcMetrics): Metrics` in `llamaMetrics.ts` — OS values (RAM, CPU) are always present; server values (TOK, TTFT, CTX, KV) overlay from Prometheus when available
- [x] 3.2 In `useServerMetrics`, replace the two-branch logic with a single `mergeMetrics` call — try Prometheus first, fall back to OS-only on error/timeout
- [x] 3.3 Wire `estimateKVCache` into the OS-only fallback path so KV shows a non-zero estimate when server is unreachable

## 4. Cleanup & Verification

- [x] 4.1 Remove any remaining `/proc` file references (e.g. `fs.readFileSync` calls for `/proc/meminfo`, `/proc/stat`)
- [x] 4.2 Verify with `npm run build` (or `npm run tsc`) that the code compiles with zero errors
- [x] 4.3 Run `npm run lint` to confirm no lint regressions
