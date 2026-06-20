import { Box, Text } from "ink";
import type { Theme } from "../../types";

interface TitleProps {
  title: string;
  theme: Theme;
}

export function Title({ title, theme }: TitleProps) {
  return (
    <Box flexShrink={0}>
      <Text color={theme.dim} italic bold underline>
        {title[0]}
      </Text>
      <Text color={theme.dim}>{title.slice(1)}</Text>
    </Box>
  );
}
