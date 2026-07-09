## MODIFIED Requirements

### Decision 1: Hybrid polling strategy
**Decision**: Primary data source is the llama-server's `/metrics` endpoint via HTTP GET, polling every 500ms. The endpoint returns **Prometheus exposition format** (not JSON). Fallback to Node `os` module (RAM, CPU) when the server is unreachable or HTTP fails.

**Rationale**: Server Prometheus metrics provide precise tokens/s and context measurements which the `os` module can't provide. HTTP polling is cheap (500ms interval). The `os` module is fast and avoids filesystem I/O.

**Migration**: Replace `response.json()` with Prometheus text parsing in `fetchServerMetrics`. Replace `/proc` file reads with `os.totalmem()`, `os.freemem()`, and `os.cpus()`.

### Decision 4: Metrics source — Prometheus exposition format
**Decision**: Consume metrics from the llama-server `/metrics` Prometheus endpoint, parsing `llamacpp:*` metric names:
```
llamacpp:n_tokens_max{} N          → CTX (max context tokens)
llamacpp:predicted_tokens_seconds{} N → TOK (tok/s)
llamacpp:prompt_tokens_seconds{} N  → TTFT (prompt tokens/s)
llamacpp:n_decode_total{} N         → KV_decode_time or total decode ops
kv_cache_size{} N                   → KV cache usage in bytes
```

**Rationale**: llama.cpp exposes all internal metrics as Prometheus-formatted text when run with `--metrics`. This is the reliable source of truth for server-specific values. The format is well-defined at https://prometheus.io/docs/instrumenting/exposition_formats/.

**Migration**: Remove the JSON schema from the original spec — llama-server does not expose a JSON metrics endpoint at `/metrics`.

### Metrics Mapping (updated)

| UI Gauge | Source | Calculation |
|----------|--------|-------------|
| RAM (G) | `os.totalmem() - os.freemem()` | `bytes / (1024^3)` |
| VRAM (G) | Prometheus `llamacpp:llm_cuda_used_bytes{}` or 0 | `bytes / (1024^3)` or 0 |
| CTX (k) | Prometheus `llamacpp:n_tokens_max{}` | `value / 1024` |
| KV (G) | Prometheus `kv_cache_size{}` or `estimateKVCache()` | `bytes / (1024^3)` |
| CPU (%) | `os.cpus()` delta (user / user+system) | `dUser / (dUser + dSys) * 100` |
| GPU (%) | Prometheus `llamacpp:llm_cuda_used_bytes{}` ratio or 0 | `used / available * 100` or 0 |
| TOK (tok/s) | Prometheus `llamacpp:predicted_tokens_seconds{}` | Direct |
| TTFT (s) | Prometheus `llamacpp:prompt_tokens_seconds{}` | Direct (already seconds) |
