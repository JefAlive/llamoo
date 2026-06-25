import { Box, Text } from "ink";
import type { Theme } from "../../types";

interface TerminalScrollbarProps {
  totalItems: number;
  visibleCount: number;
  offset: number;
  height: number;
  theme: Theme;
}

export function TerminalScrollbar({
  totalItems,
  visibleCount,
  offset,
  height,
  theme,
}: TerminalScrollbarProps) {
  if (totalItems <= visibleCount || height <= 0) {
    // Se tudo cabe na tela, renderiza apenas uma linha guia sutil
    return (
      <Box flexDirection="column" height={height}>
        {Array.from({ length: height }).map((_, i) => (
          <Text key={i} color={theme.dim}>
            │
          </Text>
        ))}
      </Box>
    );
  }

  // Cálculos de proporção da barra
  const handleHeight = Math.max(
    1,
    Math.round((visibleCount / totalItems) * height)
  );
  const maxOffset = totalItems - visibleCount;
  const pct = offset / maxOffset;
  const startY = Math.min(
    height - handleHeight,
    Math.round(pct * (height - handleHeight))
  );

  return (
    <Box flexDirection="column" height={height}>
      {Array.from({ length: height }).map((_, i) => {
        const isHandle = i >= startY && i < startY + handleHeight;
        return (
          <Text key={i} color={isHandle ? theme.accent : theme.dim}>
            {isHandle ? "█" : "│"}
          </Text>
        );
      })}
    </Box>
  );
}
