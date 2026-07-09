# Real-Time Resource Monitoring

## Context

The runner screen is the main interface for users running `llama-server` instances. Currently, it shows resource usage via `ProgressBarGauge` components with static values hardcoded at creation time. This is misleading because:

- Context sizes are allocated dynamically by llama-server
- VRAM usage depends on batch processing and intermediate values  
- System load and number of concurrent requests affect CPU/GPU metrics
- KV cache grows during inference and shrinks during cleanup

The llama-server exposes metrics at `/metrics` when started with `--metrics` flag, returning JSON with memory, cuda, cpu, and usage statistics.

## Goals / Non-Goals

**Goals:**
- Display real-time metrics from the llama-server without significant performance penalty
- Fallback gracefully when the server doesn't expose metrics
- Provide accurate, timely information to users
- Work both online (server metrics) and offline (process monitoring)

**Non-Goals:**
- Sub-second granularity (100ms is plenty)
- Sub-GPU metrics (only aggregate across all GPUs)
- Historical metrics graphs (just current values)

## Decisions

### Decision 1: Hybrid polling strategy
**Decision**: Primary data source is the llama-server's `/metrics` endpoint via HTTP GET, polling every 500ms. Fallback to Linux `/proc` process monitoring when the server doesn't have the `--metrics` flag or when HTTP fails.

**Rationale**: Server metrics provide GPU-specific usage (VRAM, CUDA) and precise tokens/s measurements which `/proc` can't provide. HTTP polling is cheap (500ms interval). `/proc` is fast but slow and CPU-heavy.

**Alternative**: Poll `/proc` only - faster but no GPU metrics, works offline, slower update rate.

### Decision 2: Aggregate metrics
**Decision**: Report aggregate metrics across all GPUs, not per-GPU.

**Rationale**: The UI only shows one CPU/GPU bars, so reporting individual GPU usage would be confusing unless users have only one GPU. Aggregates are simpler for the general case.

**Alternative**: Show per-GPU metrics with color-coding or tooltips - adds complexity but more granular.

### Decision 3: 500ms polling interval
**Decision**: Poll every 500ms (0.5 seconds).

**Rationale**: Good balance between update latency (under 1s) and CPU overhead. Values will appear to "jitter" slightly but trend correctly.

**Alternative**: 100ms for higher refresh (more CPU), 1s for lower CPU.

### Decision 4: Metrics schema
**Decision**: Consume metrics in this format:
```json
{
  "memory": { "total": 16777216, "used": 10485760 },
  "cuda": { "used": 5368709120, "available": 8589934592 },
  "cpu": { "user": 0.5, "system": 0.3 },
  "usage": {
    "tokensPerSecond": 50,
    "tokensPerSecondPerGPU": { 0: 50, 1: 25 },
    "latency": 0.8,
    "tokensPerSecondPerLatency": 62
  }
}
```

**Rationale**: This is the documented schema in llama.cpp's server.cpp and server-http.h. Total memory is RAM, used is current consumption.

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Server offline** | Display fallback values | Try-catch around HTTP fetch, use /proc fallback |
| **Large model with many GPUs** | Aggregate hides per-GPU bottlenecks | Log per-GPU data in console, UI shows aggregate |
| **Context size changes** | Metrics may lag by 0.5s | 500ms is small enough that this is imperceptible |
| **Profile without --metrics** | Server can't serve metrics | Add check for flag, fall back to process monitoring |
| **CPU overhead** | 500ms every 0.5s is ~2 CPU seconds/day per runner | Negligible cost, much cheaper than users seeing wrong data |

## Metrics Mapping

| UI Gauge | Metrics | Calculation |
|----------|---------|-------------|
| RAM (G) | `memory.used` | `bytes / (1024^2)` |
| VRAM (G) | `cuda.used` | `bytes / (1024^2)` (null if no cuda) |
| CTX (k) | `ctxSize` (from `ctxSize` key in metrics) | `value / 1024` |
| KV (G) | `kvCache` (estimated from memory usage or profile) | `value / (1024^2)` |
| CPU (%) | `cpu.user` / `cpu.user + cpu.system` | `user / (user + system) * 100` |
| GPU (%) | aggregate all GPU `cpu` stats | Same as CPU |
| TOK (tok/s) | `usage.tokensPerSecond` | Direct |
| TTFT (s) | `usage.latency` | Direct (already in seconds) |

## Future Extensions
- Add per-GPU metrics in UI if user adds new "GPU detail" button
- Add "Live" indicator showing metrics are updating
- Add historical charts if users request (would require buffering)
