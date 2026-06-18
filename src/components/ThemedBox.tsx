import React from "react";
import { Box, Text } from "ink";
import type { Theme } from "../types/index.js";

interface ThemedBoxProps {
  theme: Theme;
  children: React.ReactNode;
  title?: string;
  dimmedText?: string;
  appendText?: string;
  width?: string | number;
  height?: string | number;
  flexDirection?: "row" | "column";
  flexGrow?: number;
  paddingX?: number;
  paddingY?: number;
  focused?: boolean;
  dimBorder?: boolean;
}

export function ThemedBox({
  theme,
  children,
  title,
  dimmedText,
  appendText,
  width,
  height,
  flexDirection = "column",
  flexGrow,
  paddingX = 1,
  paddingY = 0,
  focused = false,
  dimBorder = false,
}: ThemedBoxProps) {
  const borderColor = dimBorder
    ? theme.dim
    : focused
    ? theme.accent
    : theme.border;

  return (
    <Box
      borderColor={borderColor}
      flexDirection={flexDirection}
      width={width}
      height={height}
      flexGrow={flexGrow}
      paddingX={paddingX}
      paddingY={paddingY}
    >
      {title && (
        <Box marginBottom={0}>
          <Text color={focused ? theme.accent : theme.accentAlt} bold>
            {title}
            <Text dimColor>{dimmedText}</Text>
          </Text>
        </Box>
      )}
      {children}
      {appendText && (
        <Box marginTop={1}>
          <Text color={focused ? theme.accent : theme.accentAlt} bold dimColor>{appendText}</Text>
        </Box>
      )}
    </Box>
  );
}
