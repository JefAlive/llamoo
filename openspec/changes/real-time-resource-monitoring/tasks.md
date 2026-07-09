## 1. Core Implementation

- [x] 1.1 Create `src/utils/llamaMetrics.ts` with function to fetch server metrics from `/metrics` endpoint using `fetch()` API
- [x] 1.2 Implement fallback to Linux `/proc` monitoring when server metrics unavailable
- [x] 1.3 Convert metrics to UI units (bytes to GB, milliseconds to seconds, etc.)

## 2. State Management

- [x] 2.1 Add `useServerMetrics` hook in `src/hooks` or existing hook file
- [x] 2.2 Hook polls llama-server at 500ms interval
- [x] 2.3 Hook returns metrics object with: ram, vram, cpu, gpu, tok, ttft, ctxUsed, kvUsed

## 3. UI Update

- [x] 3.1 Update `ProgressBarGauge` component to accept `value` and `maxValue` dynamically
- [x] 3.2 Update `RunnerScreen.tsx` to consume metrics from hook
- [x] 3.3 Add fallback values when metrics unavailable (or show "--" for unavailable)

## 4. Profile Configuration

- [x] 4.1 Add `customFlags` field to Profile to include `--metrics` flag
- [x] 4.2 Set default profile to include `--metrics` so existing runners work
- [x] 4.3 Update ProfileEditor to allow users to edit custom flags

## 5. Testing & Edge Cases

- [ ] 5.1 Test with server running `--metrics` flag - metrics should update live
- [ ] 5.2 Test with server running WITHOUT `--metrics` - should fall back to `/proc`
- [ ] 5.3 Test when `llama-server` is not running - should show placeholder/error values
- [ ] 5.4 Verify all 8 metrics display: RAM, VRAM, CTX, KV, CPU, GPU, TOK, TTFT

## 6. Cleanup

- [x] 6.1 Remove hardcoded values from RunnerScreen.tsx stats bar
- [x] 6.2 Add comments explaining which metrics map to which gauges
