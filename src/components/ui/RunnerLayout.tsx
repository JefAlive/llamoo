import { Box, Text, useBoxMetrics } from "ink";
import React, { useEffect, useRef } from "react";
import type { Theme } from "../../types/index";
import { HintBar } from "../ui/StatusBar";

interface RunnerLayoutProps {
  theme: Theme;
  statsElement: React.ReactNode; // Barra de CPU, RAM, GPU
  hints: { key: string; desc: string }[];
  scrollbar: React.ReactNode; // Componente de scrollbar que passaremos
  children: React.ReactNode; // Os logs em si
  onHeightMeasured: (height: number) => void; // Envia a altura disponível para o pai
}

export function RunnerLayout({
  theme,
  statsElement,
  hints,
  scrollbar,
  children,
  onHeightMeasured,
}: RunnerLayoutProps) {
  const containerRef = useRef(null);
  const { height, hasMeasured } = useBoxMetrics(containerRef);

  useEffect(() => {
    if (hasMeasured && height) {
      onHeightMeasured(height);
    }
  }, [height, hasMeasured, onHeightMeasured]);

  return (
    <Box
      flexDirection="column"
      flexGrow={1}
      alignItems="center"
      height="100%"
      backgroundColor={theme.bg}
      gap={1}
    >
      <Box flexShrink={0} width="100%">
        {statsElement}
      </Box>

      <Box ref={containerRef} flexGrow={1} width="100%" flexDirection="row">
        {hasMeasured && height && height > 0 ? (
          <>
            {/* Área de Logs */}
            <Box
              flexGrow={1}
              flexDirection="column"
              overflow="hidden"
              paddingLeft={1}
            >
              {children}
            </Box>

            {/* Scrollbar grudada na extrema direita */}
            <Box width={1} marginLeft={1} flexShrink={0}>
              {scrollbar}
            </Box>
          </>
        ) : (
          <Text color={theme.dim}>Initializing screen...</Text>
        )}
      </Box>

      <Box flexShrink={0}>
        <HintBar theme={theme} hints={hints} />
      </Box>
    </Box>
  );
}
