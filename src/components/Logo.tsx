import React from "react";
import { Box, Text } from "ink";
import type { Theme } from "../types/index.js";

interface LogoProps {
  theme: Theme;
}

const LLAMA_ASCII = `
(\\_/)
≽•ܫ•≼
(   )
`.trim();;

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
    <Box flexDirection="column" alignItems="center">
      <Box flexDirection="row">
        <Box>
          <Text>{LLAMA_ASCII}</Text>
        </Box>
        <Box flexDirection="column" marginLeft={2}>
          <Box flexDirection="row">
            <Box>
              <Text>{TITLE_ASCII_1}</Text>
            </Box>
            <Box marginLeft={1}>
              <Text color={theme.accent}>{TITLE_ASCII_2}</Text>
            </Box>
          </Box>
          <Box>
            <Text>{SUBTITLE}</Text>
          </Box>
        </Box>
      </Box>
      <Box marginTop={1}>
        <Text>
          The lazy <Text color={theme.accent} bold>llama-server</Text> TUI
        </Text>
      </Box>
    </Box>
  );
}