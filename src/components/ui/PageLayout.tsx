import { Box } from "ink";
import React, { useRef } from "react";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { HintBar } from "../ui/StatusBar";
import { Pet } from "./Pet";

// Definição das propriedades do layout
interface HintItem {
  key: string;
  desc: string;
}

interface PageLayoutProps {
  theme: any;
  hints: HintItem[];
  header?: React.ReactNode; // Equivale ao children 1 (opcional)
  leftColumn: React.ReactNode; // Equivale ao children 2
  rightColumn: React.ReactNode; // Equivale ao children 3
  hasBorder?: boolean; // Substitui a lógica antiga do profiles.length
}

export function PageLayout({
  theme,
  hints,
  header,
  leftColumn,
  rightColumn,
  hasBorder = true,
}: PageLayoutProps) {
  const petRef = useRef(null);
  const { isDesktop, maxContainerColumns } = useResponsiveLayout();

  // Calcula as larguras das colunas baseado no ambiente
  const leftWidth = Math.floor(maxContainerColumns * (isDesktop ? 0.6 : 0.5));
  const rightWidth = Math.floor(maxContainerColumns * (isDesktop ? 0.4 : 0.5));

  return (
    <Box
      flexDirection="column"
      flexGrow={1}
      alignItems="center"
      backgroundColor={theme.bg}
    >
      <Box
        flexDirection="column"
        alignItems="center"
        justifyContent="space-around"
        width={maxContainerColumns}
        flexGrow={1}
        paddingY={1}
        gap={1}
      >
        {/* Renderiza o Header (children 1) apenas se ele for enviado */}
        <Box flexShrink={0}>{header}</Box>

        {/* Container das duas colunas */}
        <Box
          flexDirection="row"
          justifyContent="center"
          alignItems="center"
          gap={3}
          flexShrink={1}
        >
          {/* Coluna Esquerda (children 2) */}
          <Box
            flexDirection="column"
            width={leftWidth}
            height="100%"
            justifyContent="center"
          >
            {leftColumn}
          </Box>

          {/* Coluna Direita (children 3) */}
          <Box
            flexDirection="column"
            width={rightWidth}
            height="100%"
            paddingY={1}
            position="relative"
          >
            <Box
              flexDirection="column"
              borderStyle={
                hasBorder
                  ? {
                      topLeft: "▞",
                      top: "▀",
                      topRight: "▚",
                      right: "▐",
                      bottomRight: "▞",
                      bottom: "▄",
                      bottomLeft: "▚",
                      left: "▌",
                    }
                  : undefined
              }
              borderTop={true}
              borderRight={true}
              borderBottom={true}
              borderLeft={true}
              borderColor={theme.border}
              borderBackgroundColor={theme.bg}
              paddingX={1}
              paddingBottom={1}
            >
              {rightColumn}
            </Box>

            <Box
              position="absolute"
              bottom={0}
              right={-2}
              width={Math.floor(maxContainerColumns * 0.5)}
              justifyContent="flex-end"
              alignItems="flex-end"
            >
              <Box justifyContent="flex-end" paddingLeft={2}>
                <Pet ref={petRef} theme={theme} />
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Barra de atalhos inferior */}
        <HintBar theme={theme} hints={hints} />
      </Box>
    </Box>
  );
}
