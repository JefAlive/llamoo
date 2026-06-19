import { Box, Text } from "ink";
import type { Theme } from "../../types/index";

interface LogoProps {
  theme: Theme;
}

const LLAMA_ASCII = `
(\\_/)
≽•ܫ•≼
(   )
`.trim();

const TITLE_ASCII_1 = `
█  █  █▀▄
█▄ █▄ █▀█
`.trim();

const TITLE_ASCII_2 = `
█▀█▀▄ █▀▄ █▀▄ █
█ █ █ █▄█ █▄█ ▄
`.trim();

const SUBTITLE = "What does the llama say?!";

export function Logo({ theme }: LogoProps) {
  return (
    <Box flexDirection="row">
      <Box>
        <Text color={theme.fg}>{LLAMA_ASCII}</Text>
      </Box>
      <Box flexDirection="column" marginLeft={2}>
        <Box flexDirection="row">
          <Box>
            <Text color={theme.dim}>{TITLE_ASCII_1}</Text>
          </Box>
          <Box marginLeft={1}>
            <Text color={theme.fg}>{TITLE_ASCII_2}</Text>
          </Box>
        </Box>
        <Box>
          <Text color={theme.dim}>{SUBTITLE}</Text>
        </Box>
      </Box>
    </Box>
  );
}
