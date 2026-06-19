import React, { useState } from "react";
import { Box, Newline, Text, useInput } from "ink";
import type { Theme, ThemeName } from "../types/index";
import { themes } from "../themes/index";
import { HintBar } from "./StatusBar";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";
import { SelectableList } from "./ui/SelectableList";
import chalk from "chalk";
import { PageLayout } from "./ui/PageLayout";

const THEME_NAMES = Object.keys(themes) as ThemeName[];

interface ThemePickerProps {
  theme: Theme;
  currentTheme: ThemeName;
  onSelect: (name: ThemeName) => void;
  onCancel: () => void;
}

export function ThemePicker({ theme, currentTheme, onSelect, onCancel }: ThemePickerProps) {
  const { maxContainerColumns } = useResponsiveLayout();

  const [idx, setIdx] = useState(THEME_NAMES.indexOf(currentTheme));

  useInput((input, key) => {
    if (key.escape || input === "q") { onCancel(); return; }
    if (key.upArrow) setIdx((p) => Math.max(0, p - 1));
    else if (key.downArrow) setIdx((p) => Math.min(THEME_NAMES.length - 1, p + 1));
    else if (key.return) onSelect(THEME_NAMES[idx]);
  });

  const previewTheme = themes[THEME_NAMES[idx]];

  return (
    <PageLayout
      theme={previewTheme}
      hasBorder={true}
      leftColumn={
        <>
          <Box marginBottom={1}>
            <Text color={previewTheme.dim} bold>
              {'themes'}
            </Text>
          </Box>

          <SelectableList
            items={THEME_NAMES.map((name) => {
              const t = themes[name];
              const isCurrent = name === currentTheme;
              
              return {
                id: name,
                label: t.label?.toLowerCase() + (isCurrent ? chalk.hex(previewTheme.dim).italic(" [in use]") : "")
              };
            })}
            selectedIdx={idx}
            theme={previewTheme}
          />
        </>
      }
      rightColumn={
        <Box flexDirection="column" flexGrow={1}>
          <Box flexDirection="column" flexShrink={1}>
            <Text color={previewTheme.accent}>■ Headers</Text>
            <Text color={previewTheme.accentAlt}>■ Subheaders</Text>
            <Text color={previewTheme.success}>■ Success</Text>
            <Text color={previewTheme.warning}>■ Warning</Text>
            <Text color={previewTheme.error}>■ Error</Text>
          </Box>

          <Box flexDirection="column" flexShrink={0} gap={1} marginTop={1}>
            <Text color={previewTheme.accent} bold>{`> sample profiles`}</Text>

            <Box flexDirection="column">
              <Text color={previewTheme.accentAlt} bold>
                {"Llama-3.1-8B-Q4_K_M"}
              </Text>
              <Text color={previewTheme.fg}>{"Mistral-7B-Instruct"}</Text>
              <Text color={previewTheme.fg} wrap="truncate">
                {"Qwen3.5-9B-Q4_K_M "}
                <Text color={previewTheme.dim} italic>
                  (favorite)
                </Text>
              </Text>
            </Box>
          </Box>
        </Box>
      }
      hints={[
        { key: "↑↓", desc: "browse" },
        { key: "↵", desc: "apply" },
        { key: "ESC", desc: "cancel" },
      ]}
    />
  );
}
