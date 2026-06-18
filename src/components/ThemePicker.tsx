import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import type { Theme, ThemeName } from "../types/index.js";
import { themes } from "../themes/index.js";
import { ThemedBox } from "./ThemedBox.js";
import { HintBar } from "./StatusBar.js";

const THEME_NAMES = Object.keys(themes) as ThemeName[];

interface ThemePickerProps {
  theme: Theme;
  currentTheme: ThemeName;
  onSelect: (name: ThemeName) => void;
  onCancel: () => void;
}

export function ThemePicker({ theme, currentTheme, onSelect, onCancel }: ThemePickerProps) {
  const [idx, setIdx] = useState(THEME_NAMES.indexOf(currentTheme));

  useInput((input, key) => {
    if (key.escape || input === "q") { onCancel(); return; }
    if (key.upArrow) setIdx((p) => Math.max(0, p - 1));
    else if (key.downArrow) setIdx((p) => Math.min(THEME_NAMES.length - 1, p + 1));
    else if (key.return) onSelect(THEME_NAMES[idx]);
  });

  const previewTheme = themes[THEME_NAMES[idx]];

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box flexDirection="row" flexGrow={1} gap={1}>
        <ThemedBox theme={theme} title="THEMES" width={30} flexDirection="column" focused>
          {THEME_NAMES.map((name, i) => {
            const t = themes[name];
            const isSelected = i === idx;
            const isCurrent = name === currentTheme;
            return (
              <Box key={name}>
                {isSelected ? (
                  <Text color={theme.highlightFg} backgroundColor={theme.highlight} bold>
                    {` ▶ ${t.label}${isCurrent ? " ●" : ""}`.padEnd(26)}
                  </Text>
                ) : (
                  <Text color={isCurrent ? theme.accent : theme.fg}>
                    {"   " + t.label + (isCurrent ? " ●" : "")}
                  </Text>
                )}
              </Box>
            );
          })}
        </ThemedBox>

        {/* Preview panel */}
        <ThemedBox theme={previewTheme} title="PREVIEW" flexGrow={1} flexDirection="column">
          <Box flexDirection="column" gap={1}>
            <Text color={previewTheme.fg} bold>Theme: {previewTheme.label}</Text>

            <Box flexDirection="column">
              <Text color={previewTheme.accent}>■ Accent color (headers, selection)</Text>
              <Text color={previewTheme.accentAlt}>■ Alt accent (subheadings)</Text>
              <Text color={previewTheme.fg}>■ Foreground text (body)</Text>
              <Text color={previewTheme.dim}>■ Dim text (hints, labels)</Text>
              <Text color={previewTheme.success}>■ Success / positive</Text>
              <Text color={previewTheme.warning}>■ Warning</Text>
              <Text color={previewTheme.error}>■ Error / delete</Text>
              <Text color={previewTheme.cursor}>■ Cursor / selection</Text>
            </Box>

            <Box marginTop={1}>
              <Text color={previewTheme.highlightFg} backgroundColor={previewTheme.highlight} bold>
                {" Selected item preview "}
              </Text>
            </Box>

            <Box flexDirection="column" marginTop={1}>
              <Text color={previewTheme.dim}>Sample profile list:</Text>
              <Text color={previewTheme.highlightFg} backgroundColor={previewTheme.highlight} bold>
                {" ▶ Llama-3.1-8B-Q4_K_M     "}
              </Text>
              <Text color={previewTheme.fg}>{"   Mistral-7B-Instruct     "}</Text>
              <Text color={previewTheme.fg}>{"   Qwen2.5-14B-Q5_K_M     "}</Text>
            </Box>
          </Box>
        </ThemedBox>
      </Box>

      <HintBar
        theme={theme}
        hints={[
          { key: "↑↓", desc: "browse" },
          { key: "↵", desc: "apply" },
          { key: "ESC", desc: "cancel" },
        ]}
      />
    </Box>
  );
}
