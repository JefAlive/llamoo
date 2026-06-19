import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import type { Theme } from "../types/index";
import { HintBar } from "./StatusBar";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";
import { BreathingText } from "./ui/BreathingText";
import chalk from "chalk";
import { SelectableList } from "./ui/SelectableList";

interface DirManagerProps {
  theme: Theme;
  dirs: string[];
  onSave: (dirs: string[]) => void;
  onCancel: () => void;
}

export function DirManager({ theme, dirs, onSave, onCancel }: DirManagerProps) {
  const { maxContainerColumns } = useResponsiveLayout();

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
    <Box flexDirection="column" flexGrow={1} alignItems="center" justifyContent="space-between" backgroundColor={theme.bg}>
      <Box
        flexDirection="column"
        justifyContent="center"
        width={maxContainerColumns}
        flexGrow={1}
        gap={1}
      >
        <Text color={theme.dim} bold>
          model scan directories
        </Text>

        <Box flexDirection="column" paddingX={2}>
          {list.length === 0 && (
            <Text color={theme.warning}>No directories configured. Press [a] to add one.</Text>
          )}

          <SelectableList
            items={list.map((dir, i) => ({ id: i, label: dir }))}
            selectedIdx={selectedIdx}
            theme={theme}
          />
        </Box>

        {adding && (
          <Box gap={1}>
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
          <Box>
            <Text color={theme.error} bold>
              Remove "{list[confirmDelete]}"? [y] yes  [any] cancel
            </Text>
          </Box>
        )}

        <Box flexDirection="column" gap={1}>
          <Text color={theme.dim} bold>tips</Text>
          <Box paddingLeft={2} flexDirection="column">
            <Text color={theme.fg}>Use ~ for home directory (e.g. ~/models)</Text>
            <Text color={theme.fg}>Only the immediate directory is scanned (no recursion)</Text>
            <Text color={theme.fg}>Press [s] to sync models after adding dirs</Text>
          </Box>
        </Box>
      </Box>

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
