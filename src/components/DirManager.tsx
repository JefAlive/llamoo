import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import type { Theme } from "../types/index.js";
import { ThemedBox } from "./ThemedBox.js";
import { HintBar } from "./StatusBar.js";

interface DirManagerProps {
  theme: Theme;
  dirs: string[];
  onSave: (dirs: string[]) => void;
  onCancel: () => void;
}

export function DirManager({ theme, dirs, onSave, onCancel }: DirManagerProps) {
  const [list, setList] = useState<string[]>([...dirs]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [adding, setAdding] = useState(false);
  const [newDir, setNewDir] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  useInput((input, key) => {
    if (adding) return;

    if (confirmDelete !== null) {
      if (input === "y" || input === "Y") {
        setList((prev) => {
          const next = prev.filter((_, i) => i !== confirmDelete);
          return next;
        });
        setConfirmDelete(null);
        setSelectedIdx((p) => Math.max(0, p - 1));
      } else {
        setConfirmDelete(null);
      }
      return;
    }

    if (key.escape || input === "q") { onCancel(); return; }
    if (input === "s" && key.ctrl) { onSave(list); return; }
    if (key.return) { onSave(list); return; }

    if (key.upArrow) setSelectedIdx((p) => Math.max(0, p - 1));
    else if (key.downArrow) setSelectedIdx((p) => Math.min(list.length - 1, p + 1));
    else if (input === "a") {
      setNewDir("");
      setAdding(true);
    } else if (input === "x" && list.length > 0) {
      setConfirmDelete(selectedIdx);
    }
  });

  return (
    <Box flexDirection="column" flexGrow={1}>
      <ThemedBox theme={theme} title="SCAN DIRECTORIES" flexGrow={1} flexDirection="column" focused>
        <Text color={theme.dim}>
          Directories scanned for .gguf model files:
        </Text>

        <Box flexDirection="column" marginTop={1}>
          {list.length === 0 ? (
            <Text color={theme.warning}>No directories configured. Press [a] to add one.</Text>
          ) : (
            list.map((dir, i) => {
              const isSelected = i === selectedIdx;
              return (
                <Box key={i}>
                  {isSelected ? (
                    <Text color={theme.highlightFg} backgroundColor={theme.highlight} bold>
                      {` ▶ ${dir}`.padEnd(70)}
                    </Text>
                  ) : (
                    <Text color={theme.fg}>{"   " + dir}</Text>
                  )}
                </Box>
              );
            })
          )}
        </Box>

        {adding && (
          <Box marginTop={1} gap={1}>
            <Text color={theme.accent}>Add directory:</Text>
            <TextInput
              value={newDir}
              onChange={setNewDir}
              onSubmit={(val) => {
                if (val.trim()) {
                  setList((prev) => [...prev, val.trim()]);
                  setSelectedIdx(list.length);
                }
                setAdding(false);
                setNewDir("");
              }}
              focus={true}
            />
            <Text color={theme.dim}>(ESC to cancel)</Text>
          </Box>
        )}

        {confirmDelete !== null && (
          <Box marginTop={1}>
            <Text color={theme.error} bold>
              Remove "{list[confirmDelete]}"? [y] yes  [any] cancel
            </Text>
          </Box>
        )}

        <Box flexDirection="column" marginTop={2}>
          <Text color={theme.dim}>Tips:</Text>
          <Text color={theme.dim}>  • Use ~ for home directory (e.g. ~/models)</Text>
          <Text color={theme.dim}>  • Only the immediate directory is scanned (no recursion)</Text>
          <Text color={theme.dim}>  • Press [s] to sync models after adding dirs</Text>
        </Box>
      </ThemedBox>

      <HintBar
        theme={theme}
        hints={[
          { key: "a", desc: "add dir" },
          { key: "x", desc: "remove" },
          { key: "↵", desc: "save & close" },
          { key: "ESC", desc: "cancel" },
        ]}
      />
    </Box>
  );
}
