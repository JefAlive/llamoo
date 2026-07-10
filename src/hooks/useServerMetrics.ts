import { useEffect, useState } from "react";
import { getUnifiedMetrics } from "../utils/serverMetrics";

export interface ServerMetrics {
  ram: number;
  ramMax: number;
  vram: number;
  vramMax: number;
  cpu: number;
  gpu: number;
  tok: number;
  ttft: number;
  ctxUsed: number;
  ctxMax: number;
  kvUsed: number;
  kvMax: number;
}

function emptyMetrics(): ServerMetrics {
  return {
    ram: 0,
    ramMax: 0,
    vram: 0,
    vramMax: 0,
    cpu: 0,
    gpu: 0,
    tok: 0,
    ttft: 0,
    ctxUsed: 0,
    ctxMax: 0,
    kvUsed: 0,
    kvMax: 0,
  };
}

export function useServerMetrics(
  host: string,
  port: number,
  apiKey?: string
): { metrics: ServerMetrics; loading: boolean } {
  const [metrics, setMetrics] = useState<ServerMetrics>(emptyMetrics);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const poll = async () => {
      setLoading(true);
      try {
        const metrics = await getUnifiedMetrics();
        setMetrics({
          ram: metrics.ramUsedMB,
          ramMax: metrics.ramTotalMB,
          vram: metrics.vramUsedMB,
          vramMax: metrics.vramTotalMB,
          cpu: metrics.cpuUsage,
          gpu: metrics.gpuUsage,
          tok: metrics.tokensPerSecond || 0,
          ttft: 0,
          ctxUsed: metrics.ctxUsed || 0,
          ctxMax: metrics.ctxMax || 0,
          kvUsed: metrics.kvUsed || 0,
          kvMax: metrics.kvMax || 0,
        });
      } catch (error) {
        console.error("Failed to fetch metrics:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    poll();
    intervalId = setInterval(poll, 500);

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [host, port, apiKey]);

  return { metrics, loading };
}
