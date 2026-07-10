import { ChildProcess, spawn } from "child_process";
import { Box, Text, useInput } from "ink";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerMetrics } from "../../hooks/useServerMetrics";
import type { LlamaProfile, Theme } from "../../types/index";
import { buildLlamaArgs } from "../../utils/llama";
import { ProgressBarGauge } from "../ui/ProgressBarGauge";
import { RunnerLayout } from "../ui/RunnerLayout";
import { TerminalScrollbar } from "../ui/TerminalScrollbar";

/**
╭─ resources ──────────────╮╭─ performance ───────────╮╭─ health ───────────────────────────────╮╭─ stastistics ────────╮
│ RAM  [ ▃▄▅▆   ]  22/32G  ││ CPU  ▰▰▱▱  42%          ││ (•‿•) model fits comfortably           │| ◔ 4d12h uptime       |
│ VRAM [ ▂▃▄▅▆█ ]  6.1/12G ││ GPU  ▰▰▰▱  81%          ││ (õ_õ) responses slow due to limits     │| $ 18.42 saved        |
│ CTX  [ ▂▂▃▄▅█ ]  31k/32k ││ TOK  ▰▰▰▱  142/s (fast) ││ (x_x) no more room for chat            │|──────────────────────|
│ KV   [ ▂▂▃    ]  2.1/8G  ││ TTFT ▰▱▱▱  0.8s (fast)  ││ tip: there is vram for higher ctx size │| model is running ●   |
╰──────────────────────────╯╰─────────────────────────╯╰────────────────────────────────────────╯╰──────────────────────╯

health messages:
- fazer um sistema que eu escrevo todas frases de health possíveis num array
- cada frase tem um priority
- as top 3 priority exibem no health panel

tips:
- cada resource/performance/metric eu transformo de número pra algo subjetivo: bom, medio, ruim
- com base no critério subjetivo:
  - numa tabela verdade eu faço todas as combinações possíveis entre as métricas
  - cada combinação vai ter sua tip (dica)

esse vai ser o melhor runner que já vi de LLM
 */

interface RunnerScreenProps {
  theme: Theme;
  profile: LlamaProfile;
  llamaServerBin: string;
  onExit: () => void;
}

interface LogLine {
  text: string;
  isError: boolean;
  timestamp: string;
}

export function RunnerScreen({
  theme,
  profile,
  llamaServerBin,
  onExit,
}: RunnerScreenProps) {
  const { metrics } = useServerMetrics(
    profile.host,
    profile.port,
    profile.apiKey
  );
  const [lines, setLines] = useState<LogLine[]>([]);
  const [status, setStatus] = useState<
    "starting" | "running" | "stopped" | "error"
  >("starting");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [exitCode, setExitCode] = useState<number | null>(null);
  const procRef = useRef<ChildProcess | null>(null);

  const [scrollOffset, setScrollOffset] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);

  // Altura dinâmica calculada pelo BoxMetrics do RunnerLayout
  const [measuredHeight, setMeasuredHeight] = useState<number>(0);

  const addLine = useCallback((text: string, isError: boolean) => {
    const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });
    setLines((prev) => {
      const next = [...prev, { text, isError, timestamp }];
      return next.length > 2000 ? next.slice(next.length - 2000) : next;
    });
  }, []);

  // Efeito de controle do Auto-scroll reativo à altura medida
  useEffect(() => {
    if (autoScroll && measuredHeight > 0) {
      setScrollOffset(Math.max(0, lines.length - measuredHeight));
    }
  }, [lines.length, autoScroll, measuredHeight]);

  // Código de inicialização do processo (inalterado por segurança)
  useEffect(() => {
    const args = buildLlamaArgs(profile);
    const cmd = llamaServerBin;

    try {
      const proc = spawn(cmd, args, {
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env },
      });
      procRef.current = proc;

      proc.stdout?.on("data", (data: Buffer) => {
        for (const line of data.toString().split("\n")) {
          if (line.trim()) addLine(line, false);
        }
      });

      proc.stderr?.on("data", (data: Buffer) => {
        for (const line of data.toString().split("\n")) {
          if (line.trim()) addLine(line, true);
        }
      });

      proc.on("spawn", () => setStatus("running"));
      proc.on("close", (code) => {
        setStatus(code === 0 ? "stopped" : "error");
        setExitCode(code);
      });
    } catch (err: any) {
      setStatus("error");
      addLine(`Failed to start: ${err.message}`, true);
    }

    return () => {
      if (procRef.current && !procRef.current.killed) {
        procRef.current.kill("SIGTERM");
      }
    };
  }, []);

  // Monitoramento de Teclas usando a altura do box dinâmico
  useInput((input, key) => {
    if (input === "q" || key.escape) {
      if (procRef.current && !procRef.current.killed) {
        procRef.current.kill("SIGTERM");
      } else {
        onExit();
      }
      return;
    }

    if (measuredHeight <= 0) return;

    if (key.upArrow) {
      setAutoScroll(false);
      setScrollOffset((p) => Math.max(0, p - 1));
    } else if (key.downArrow) {
      setScrollOffset((p) => {
        const maxOffset = Math.max(0, lines.length - measuredHeight);
        const next = Math.min(maxOffset, p + 1);
        if (next >= maxOffset) setAutoScroll(true);
        return next;
      });
    } else if (key.pageUp) {
      setAutoScroll(false);
      setScrollOffset((p) => Math.max(0, p - Math.floor(measuredHeight / 2)));
    } else if (key.pageDown) {
      setScrollOffset((p) => {
        const maxOffset = Math.max(0, lines.length - measuredHeight);
        const next = Math.min(maxOffset, p + Math.floor(measuredHeight / 2));
        if (next >= maxOffset) setAutoScroll(true);
        return next;
      });
    } else if (key.end || input === "G") {
      setAutoScroll(true);
    } else if (key.home || input === "g") {
      setAutoScroll(false);
      setScrollOffset(0);
    }
  });

  const visibleLines =
    measuredHeight > 0
      ? lines.slice(scrollOffset, scrollOffset + measuredHeight)
      : lines;

  // Render do Bloco de Stats do Topo
  const statsBarElement = (
    <Box width="100%" flexShrink={0}>
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={theme.dim}
        borderBackgroundColor={theme.bg}
        height={6}
        paddingX={1}
        position="relative"
      >
        <Box
          position="absolute"
          top={-1}
          left={0}
          paddingX={1}
          backgroundColor={theme.bg}
        >
          <Text color={theme.dim}>resources</Text>
        </Box>
        {/* RAM maps to memory.used/memory.total from server metrics */}
        <ProgressBarGauge
          name="RAM"
          value={metrics.ram ?? 0}
          maxValue={metrics.ramMax || 16}
          unit="G"
          theme={theme}
          type="smooth"
        />
        {/* VRAM maps to cuda.used/cuda.available from server metrics */}
        <ProgressBarGauge
          name="VRAM"
          value={metrics.vram ?? 0}
          maxValue={metrics.vramMax || 12}
          unit="G"
          theme={theme}
          type="smooth"
        />
        {/* CTX maps to ctxSize from server metrics (in K-tokens) */}
        <ProgressBarGauge
          name="CTX"
          value={metrics.ctxUsed ?? 0}
          maxValue={metrics.ctxMax || 128}
          unit="k"
          theme={theme}
          type="smooth"
        />
        {/* KV maps to kvCache from server metrics (estimated) */}
        <ProgressBarGauge
          name="KV"
          value={metrics.kvUsed ?? 0}
          maxValue={metrics.kvMax || 8}
          unit="G"
          theme={theme}
          type="smooth"
        />
      </Box>
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={theme.dim}
        borderBackgroundColor={theme.bg}
        height={6}
        flexGrow={1}
        paddingX={1}
        position="relative"
      >
        <Box
          position="absolute"
          top={-1}
          left={0}
          paddingX={1}
          backgroundColor={theme.bg}
        >
          <Text color={theme.dim}>performance</Text>
        </Box>
        {/* CPU maps to cpu.user from server metrics */}
        <ProgressBarGauge
          name="CPU"
          value={metrics.cpu ?? 0}
          maxValue={100}
          showMaxValue={false}
          unit="%"
          theme={theme}
          type="blocks"
        />
        {/* GPU maps to aggregate GPU cpu stats from server metrics */}
        <ProgressBarGauge
          name="GPU"
          value={metrics.gpu ?? 0}
          maxValue={100}
          showMaxValue={false}
          unit="%"
          theme={theme}
          type="blocks"
        />
        {/* TOK maps to usage.tokensPerSecond from server metrics */}
        <ProgressBarGauge
          name="TOK"
          value={Math.round(metrics.tok ?? 0)}
          maxValue={100}
          showMaxValue={false}
          unit="tok/s"
          theme={theme}
          type="blocks"
        />
        {/* TTFT maps to usage.latency from server metrics (in seconds) */}
        <ProgressBarGauge
          name="TTFT"
          value={metrics.ttft ?? 0}
          maxValue={5}
          showMaxValue={false}
          unit="s"
          theme={theme}
          type="blocks"
        />
      </Box>
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={theme.dim}
        borderBackgroundColor={theme.bg}
        height={6}
        position="relative"
      >
        <Box
          position="absolute"
          top={-1}
          left={0}
          paddingX={1}
          backgroundColor={theme.bg}
        >
          <Text color={theme.dim}>stats</Text>
        </Box>
        <Box paddingX={1}>
          <Text color={theme.fg}>◔ 4d12h uptime</Text>
        </Box>
        <Box paddingX={1}>
          <Text color={theme.fg}>$ 18.42 saved</Text>
        </Box>
        <Box
          borderColor={theme.dim}
          borderBackgroundColor={theme.bg}
          borderStyle="single"
          height={2}
          borderTop={true}
          borderBottom={false}
          borderRight={false}
          borderLeft={false}
          paddingX={1}
        >
          <Text
            color={
              {
                starting: theme.fg,
                running: theme.success,
                stopped: theme.warning,
                error: theme.error,
              }[status]
            }
          >
            model {status} ●
          </Text>
        </Box>
      </Box>
    </Box>
  );

  return (
    <RunnerLayout
      theme={theme}
      statsElement={statsBarElement}
      onHeightMeasured={setMeasuredHeight}
      hints={[
        { key: "↑↓/PgUp/PgDn", desc: "scroll" },
        { key: "G/g", desc: "bottom/top" },
        { key: "q/ESC", desc: "stop" },
      ]}
      scrollbar={
        <TerminalScrollbar
          totalItems={lines.length}
          visibleCount={measuredHeight}
          offset={scrollOffset}
          height={measuredHeight}
          theme={theme}
        />
      }
    >
      {/* Corpo central: Render de linhas puras limitadas a altura do container */}
      {visibleLines.map((line, i) => (
        <Box key={i} height={1}>
          <Box flexShrink={0}>
            <Text color={theme.dim}>{line.timestamp} </Text>
          </Box>
          <Box flexShrink={1}>
            <Text
              color={theme.fg /*line.isError ? theme.error : theme.fg*/}
              wrap="truncate-end"
            >
              {line.text}
            </Text>
          </Box>
        </Box>
      ))}
    </RunnerLayout>
  );
}
