import { Box, Text } from "ink";
import type { Theme } from "../../types/index";

interface StatusBarProps {
  theme: Theme;
  left: string;
  right?: string;
  center?: string;
}

export function StatusBar({ theme, left, right, center }: StatusBarProps) {
  return (
    <Box
      borderStyle="single"
      borderColor={theme.border}
      paddingX={1}
      justifyContent="space-between"
      flexShrink={0}
    >
      <Text color={theme.dim}>{left}</Text>
      {center && <Text color={theme.accent}>{center}</Text>}
      {right && <Text color={theme.dim}>{right}</Text>}
    </Box>
  );
}

interface HintBarProps {
  theme: Theme;
  hints: Array<{ key: string; desc: string }>;
}

export function HintBar({ theme, hints }: HintBarProps) {
  return (
    <Box flexShrink={0} paddingX={1} gap={2}>
      {hints.map(({ key, desc }, i) => (
        <Box key={i} gap={1}>
          <Text color={theme.fg} bold>
            {key}
          </Text>
          <Text color={theme.dim}>{desc}</Text>
        </Box>
      ))}
    </Box>
  );
}
