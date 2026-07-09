# Real-Time Resource Monitoring

## Why

The runner screen currently displays hardcoded values for RAM, VRAM, context size, memory usage, CPU, GPU, tokens/second, and time-to-first-token. This creates a misleading display that doesn't reflect the actual runtime state of the `llama-server`, especially when:

- Context sizes change (dynamic allocation)
- Multiple users/requests run concurrently
- GPU VRAM is partially used
- System load fluctuates
- Different profiles with different models load

Having real-time visibility into resource consumption allows users to:
- See if they're running out of VRAM mid-inference
- Monitor token generation rates
- Adjust context sizes based on actual usage
- Understand why responses are slow (CPU/GPU bottleneck?)

## What Changes

**New**: The runner screen now reads real-time metrics from the llama-server's `/metrics` HTTP endpoint and displays them in the stats bar instead of hardcoded values.

**BREAKING**: The runner screen requires the llama-server to be started with the `--metrics` flag to expose the metrics endpoint. Profiles must include this flag, or the runner will display placeholder values indicating unavailable metrics.

## Capabilities

### New Capabilities
- **resource-monitoring**: Read and display real-time metrics from the llama-server

## Impact

- `src/components/pages/RunnerScreen.tsx`: Updated to consume dynamic metrics instead of hardcoded values
- `src/utils/llamaMetrics.ts`: New utility for fetching server metrics (fallback to `/proc`)
- Profiles must include `--metrics` flag in custom flags, or fallback to local measurements

---

## Alternative Approaches

1. **Process monitoring only**: Read `/proc` memory and CPU stats directly without server API call
2. **Mock metrics**: Generate random metrics periodically
3. **Static values**: Keep hardcoded but document which values are displayed

**Selected**: Option 1 (hybrid - primary is server metrics, fallback is process monitoring) because:
- Server metrics include GPU-specific usage which `/proc` can't provide
- Lower CPU cost than polling `/proc`
- Better accuracy (server reports current usage, not accumulated)
