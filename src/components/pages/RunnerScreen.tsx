import { ChildProcess, spawn } from "child_process";
import { Box, Text, useInput, useStdout } from "ink";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LlamaProfile, Theme } from "../../types/index";
import { buildLlamaArgs } from "../../utils/llama";
import { HintBar } from "../ui/StatusBar";

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
  const { stdout } = useStdout();
  const [lines, setLines] = useState<LogLine[]>([]);
  const [status, setStatus] = useState<
    "starting" | "running" | "stopped" | "error"
  >("starting");
  const [exitCode, setExitCode] = useState<number | null>(null);
  const procRef = useRef<ChildProcess | null>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);

  const termHeight = stdout?.rows ?? 24;
  const logHeight = Math.max(4, termHeight - 10);

  const addLine = useCallback(
    (text: string, isError: boolean) => {
      const timestamp = new Date().toLocaleTimeString("en-US", {
        hour12: false,
      });
      setLines((prev) => {
        const next = [...prev, { text, isError, timestamp }];
        // Cap at 2000 lines
        return next.length > 2000 ? next.slice(next.length - 2000) : next;
      });
      if (autoScroll) {
        setScrollOffset((prev) => Math.max(0, prev + 1));
      }
    },
    [autoScroll]
  );

  useEffect(() => {
    const args = buildLlamaArgs(profile);
    const cmd = llamaServerBin;

    addLine(`Starting: ${cmd} ${args.join(" ")}`, false);
    addLine(`${"─".repeat(60)}`, false);

    try {
      const proc = spawn(cmd, args, {
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env },
      });

      procRef.current = proc;

      proc.stdout?.on("data", (data: Buffer) => {
        const text = data.toString();
        for (const line of text.split("\n")) {
          if (line.trim()) addLine(line, false);
        }
      });

      proc.stderr?.on("data", (data: Buffer) => {
        const text = data.toString();
        for (const line of text.split("\n")) {
          if (line.trim()) addLine(line, true);
        }
      });

      proc.on("spawn", () => {
        setStatus("running");
        addLine(`Process started (PID ${proc.pid})`, false);
      });

      proc.on("error", (err) => {
        setStatus("error");
        addLine(`ERROR: ${err.message}`, true);
        if (err.message.includes("ENOENT")) {
          addLine(
            `Could not find '${cmd}'. Make sure llama-server is in your PATH.`,
            true
          );
        }
      });

      proc.on("close", (code) => {
        setStatus(code === 0 ? "stopped" : "error");
        setExitCode(code);
        addLine(`${"─".repeat(60)}`, false);
        addLine(`Process exited with code ${code}`, code !== 0);
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

  useInput((input, key) => {
    if (input === "q" || key.escape) {
      if (procRef.current && !procRef.current.killed) {
        procRef.current.kill("SIGTERM");
        addLine("Sent SIGTERM to process...", false);
      } else {
        onExit();
      }
      return;
    }
    if (input === "Q") {
      if (procRef.current && !procRef.current.killed) {
        procRef.current.kill("SIGKILL");
      }
      onExit();
      return;
    }
    if (key.upArrow) {
      setAutoScroll(false);
      setScrollOffset((p) => Math.max(0, p - 1));
    } else if (key.downArrow) {
      setScrollOffset((p) => {
        const maxOffset = Math.max(0, lines.length - logHeight);
        const next = Math.min(maxOffset, p + 1);
        if (next >= maxOffset) setAutoScroll(true);
        return next;
      });
    } else if (key.pageUp) {
      setAutoScroll(false);
      setScrollOffset((p) => Math.max(0, p - Math.floor(logHeight / 2)));
    } else if (key.pageDown) {
      setScrollOffset((p) => {
        const maxOffset = Math.max(0, lines.length - logHeight);
        const next = Math.min(maxOffset, p + Math.floor(logHeight / 2));
        if (next >= maxOffset) setAutoScroll(true);
        return next;
      });
    } else if (key.end || input === "G") {
      setAutoScroll(true);
      setScrollOffset(Math.max(0, lines.length - logHeight));
    } else if (key.home || input === "g") {
      setAutoScroll(false);
      setScrollOffset(0);
    }
  });

  // Auto-scroll to bottom when new lines added
  useEffect(() => {
    if (autoScroll) {
      setScrollOffset(Math.max(0, lines.length - logHeight));
    }
  }, [lines.length, autoScroll, logHeight]);

  const statusColor =
    status === "running"
      ? theme.success
      : status === "starting"
        ? theme.warning
        : status === "error"
          ? theme.error
          : theme.dim;

  const statusLabel =
    status === "running"
      ? `● RUNNING  ${profile.host}:${profile.port}`
      : status === "starting"
        ? "◌ STARTING..."
        : status === "error"
          ? `✗ ERROR (exit ${exitCode})`
          : `■ STOPPED (exit ${exitCode})`;

  const visibleLines = lines.slice(scrollOffset, scrollOffset + logHeight);

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Header */}
      <Box paddingX={1} gap={2} flexShrink={0}>
        <Text color={theme.accent} bold>
          RUNNING:
        </Text>
        <Text color={theme.fg}>{profile.name}</Text>
        <Text color={theme.dim}>|</Text>
        <Text color={statusColor} bold>
          {statusLabel}
        </Text>
        {!autoScroll && (
          <>
            <Text color={theme.dim}>|</Text>
            <Text color={theme.warning}>SCROLLED (G=bottom)</Text>
          </>
        )}
      </Box>

      {/* Log area */}
      <Box flexGrow={1} flexDirection="column" paddingX={1} paddingY={0}>
        <Text color={theme.dim} bold>
          output
        </Text>

        <Box flexDirection="column" height={logHeight} overflow="hidden">
          {visibleLines.map((line, i) => (
            <Box key={i}>
              <Text color={theme.dim}>{line.timestamp} </Text>
              <Text
                color={line.isError ? theme.error : theme.fg}
                wrap="truncate"
              >
                {line.text}
              </Text>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Scrollbar indicator */}
      <Box paddingX={1} flexShrink={0}>
        <Text color={theme.dim}>
          {lines.length > 0
            ? `Lines ${scrollOffset + 1}–${Math.min(scrollOffset + logHeight, lines.length)} of ${lines.length}`
            : "No output yet"}
        </Text>
      </Box>

      <HintBar
        theme={theme}
        hints={[
          { key: "↑↓/PgUp/PgDn", desc: "scroll" },
          { key: "G/g", desc: "bottom/top" },
          { key: "q/ESC", desc: "stop (SIGTERM)" },
          { key: "Q", desc: "force kill" },
        ]}
      />
    </Box>
  );
}
