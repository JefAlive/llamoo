import { NvidiaSMI } from "@quik-fe/node-nvidia-smi";
import { execSync } from "child_process";
import fs from "fs";
import isWSL from "is-wsl";
import os from "os";
import si from "systeminformation";

export async function getUnifiedMetrics() {
  const [mem, load, graphics] = await Promise.all([
    si.mem(),
    si.currentLoad(),
    si.graphics(),
  ]);

  const wslMetrics = getWSLMetrics();
  const [nvidiaMetrics, llamaMetrics] = await Promise.all([
    await getNvidiaMetrics(),
    await getLlamaMetrics(),
  ]);

  // write graphics metrics to graphics.json file
  if (graphics) {
    const json = JSON.stringify(graphics, null, 2);
    fs.writeFileSync("./graphics.json", json);
  }

  const metrics = {
    cpuUsage: Math.ceil(load.currentLoad),
    ramTotalMB: Math.ceil(mem.total / 1024 / 1024 / 1024),
    ramUsedMB: Math.ceil(mem.active / 1024 / 1024 / 1024),
    vramTotalMB: Math.ceil(
      graphics.controllers?.[0]?.vram || 0 / 1024 / 1024 / 1024
    ),
    platform: os.platform(),
  };

  return {
    ...metrics,
    ...wslMetrics,
    ...nvidiaMetrics,
    ...llamaMetrics,
  };
}

const getWSLMetrics = () => {
  // Se for WSL, tenta buscar do Windows via Powershell interop
  if (isWSL) {
    try {
      const psCommand =
        'Get-CimInstance Win32_OperatingSystem | ForEach-Object { $os = $_; $cpu = (Get-CimInstance Win32_Processor | Select-Object -First 1).LoadPercentage; "{0},{1},{2}" -f $cpu, [Math]::Round($os.TotalVisibleMemorySize/1024), [Math]::Round(($os.TotalVisibleMemorySize - $os.FreePhysicalMemory)/1024) }';

      const raw = execSync(
        `powershell.exe -NoProfile -Command '${psCommand}'`,
        { encoding: "utf-8" }
      ).trim();
      const [cpu, ramTotal, ramUsed] = raw.split(",").map(Number);

      return {
        cpuUsage: cpu,
        ramTotalMB: Math.ceil(ramTotal / 1024),
        ramUsedMB: Math.ceil(ramUsed / 1024),
        platform: "wsl-host",
      };
    } catch (e) {
      // Se falhar (por exemplo, se o interop com o powershell estiver desabilitado nas configurações do WSL)
      // nós caímos silenciosamente para a leitura interna da VM
    }
  }

  return {};
};

const getNvidiaMetrics = async () => {
  const hasGpu = await NvidiaSMI.exist();
  if (!hasGpu) {
    return {
      vramUsedMB: 0,
      vramTotalMB: 0,
      gpuUsage: 0,
      gpuTemp: 0,
      gpuName: "",
    };
  }

  const gpuInfo = (await NvidiaSMI.Utils.getGPUInfo()) || { product_name: "" };
  const mem = (await NvidiaSMI.Utils.getMemoryUsage()) || { used: 0, total: 0 };
  const temp = (await NvidiaSMI.Utils.getTemperature()) || 0;
  const gpu = Number((await NvidiaSMI.Utils.getUtilization())?.gpu_util) || 0;

  return {
    gpuName: gpuInfo.product_name,
    vramUsedMB: Math.ceil(mem.used / 1024 / 1024 / 1024),
    vramTotalMB: Math.ceil(mem.total / 1024 / 1024 / 1024),
    gpuUsage: gpu,
    gpuTemp: temp,
  };
};

const getLlamaMetrics = async (serverUrl = "http://127.0.0.1:8000") => {
  // Fazemos as 3 requisições em paralelo para evitar lentidão no loop da TUI
  const [metricsRes, propsRes, slotsRes] = await Promise.allSettled([
    fetch(`${serverUrl}/metrics`),
    fetch(`${serverUrl}/props`),
    fetch(`${serverUrl}/slots`),
  ]);

  // Valores padrão para as métricas coletadas do Prometheus (/metrics)
  let tokensPerSecond = 0;
  let promptTokensPerSecond = 0;
  let avgPrefillMsPerToken = 0;
  let nTokensMaxFallback = 0;

  // 1. Processa o endpoint /metrics (Velocidades)
  if (metricsRes.status === "fulfilled" && metricsRes.value.ok) {
    try {
      const text = await metricsRes.value.text();
      let promptSecondsTotal = 0;
      let promptTokensTotal = 0;

      const regex =
        /^\s*(llamacpp[:_][a-z0-9_]+)(?:\{[^}]+\})?\s+([0-9.eE+-]+)/gm;
      let match;
      while ((match = regex.exec(text)) !== null) {
        const rawName = match[1];
        const value = Number(match[2]);
        const normalizedName = rawName.replace(":", "_");

        switch (normalizedName) {
          case "llamacpp_predicted_tokens_seconds":
            tokensPerSecond = value;
            break;
          case "llamacpp_prompt_tokens_seconds":
            promptTokensPerSecond = value;
            break;
          case "llamacpp_prompt_seconds_total":
            promptSecondsTotal = value;
            break;
          case "llamacpp_prompt_tokens_total":
            promptTokensTotal = value;
            break;
          case "llamacpp_n_tokens_max": // Maior número de tokens observado em uma única chamada
            nTokensMaxFallback = value;
            break;
        }
      }

      if (promptTokensTotal > 0) {
        avgPrefillMsPerToken = (promptSecondsTotal / promptTokensTotal) * 1000;
      }
    } catch (err) {
      console.warn("Erro ao interpretar /metrics:", err.message);
    }
  }

  // 2. Processa o endpoint /props (Capacidade Máxima do Contexto)
  let ctxMax = 0;
  if (propsRes.status === "fulfilled" && propsRes.value.ok) {
    try {
      const props = await propsRes.value.json();
      // Tenta obter 'n_ctx' das configurações de geração ou da raiz do objeto
      ctxMax = Math.floor(
        (props.default_generation_settings?.n_ctx || props.n_ctx || 0) / 1024
      );
    } catch (err) {
      console.warn("Erro ao interpretar /props:", err.message);
    }
  }

  // Fallback caso /props esteja indisponível: usa o maior valor observado no Prometheus
  if (ctxMax === 0 && nTokensMaxFallback > 0) {
    ctxMax = nTokensMaxFallback;
  }

  // 3. Processa o endpoint /slots (Tokens armazenados no KV Cache)
  let ctxUsed = 0;
  if (slotsRes.status === "fulfilled" && slotsRes.value.ok) {
    try {
      const slots = await slotsRes.value.json();
      // "n_past" armazena o número exato de tokens cacheados no KV de cada slot
      ctxUsed = Math.floor(
        slots.reduce((total, slot) => total + (slot.n_past || 0), 0) / 1024
      );
    } catch (err) {
      console.warn("Erro ao interpretar /slots:", err.message);
    }
  }

  // Porcentagem de uso do KV cache
  const kvUsagePercent = ctxMax > 0 ? (ctxUsed / ctxMax) * 100 : 0;

  return {
    // Velocidades de processamento
    tokensPerSecond: Number(tokensPerSecond.toFixed(2)),
    promptTokensPerSecond: Number(promptTokensPerSecond.toFixed(2)),
    avgPrefillMsPerToken: Number(avgPrefillMsPerToken.toFixed(2)),

    // Contexto (ctx) e KV Cache
    ctxUsed,
    ctxMax,
    kvUsed: 0,
    kvMax: 0,
    kvUsagePercent: Number(kvUsagePercent.toFixed(1)),
  };
};
