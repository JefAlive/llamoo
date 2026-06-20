import chalk from "chalk";
import { Box, Text, useBoxMetrics } from "ink";
import { useRef } from "react";
import type { Theme } from "../../types";
import { BreathingText } from "./BreathingText";

interface SelectableItemData {
  id: string | number;
  label: string;
}

interface SelectableListProps {
  items: SelectableItemData[];
  selectedIdx: number;
  theme: Theme;
  emptyMessage?: string;
  scrollMargin?: number;
}

export function SelectableList({
  items,
  selectedIdx,
  theme,
  emptyMessage = "No results for your search.",
  scrollMargin = 2,
}: SelectableListProps) {
  const ref = useRef(null);
  const { height, hasMeasured } = useBoxMetrics(ref);

  if (items.length === 0) {
    return (
      <Box>
        <Text color={theme.dim}>{emptyMessage}</Text>
      </Box>
    );
  }

  // --- LÓGICA DE SCROLL DINÂMICO ---
  let scrollOffset = 0;

  if (hasMeasured && height && height > 0) {
    const safeMargin = Math.min(scrollMargin, Math.floor((height - 1) / 2));

    if (selectedIdx >= scrollOffset + height - safeMargin) {
      scrollOffset = selectedIdx - height + 1 + safeMargin;
    } else if (selectedIdx < scrollOffset + safeMargin) {
      scrollOffset = selectedIdx - safeMargin;
    }

    scrollOffset = Math.max(0, Math.min(scrollOffset, items.length - height));
  }

  const visibleItems = height
    ? items.slice(scrollOffset, scrollOffset + height)
    : items;

  // --- DETECÇÃO DE ITENS ESCONDIDOS ---
  const hasItemsAbove = scrollOffset > 0;
  const hasItemsBelow = height ? scrollOffset + height < items.length : false;

  return (
    <Box ref={ref} flexDirection="column" height="100%">
      {hasMeasured &&
        visibleItems.map((item, i) => {
          const realIdx = i + scrollOffset;
          const isSelected = realIdx === selectedIdx;

          // Decidir qual caractere mostrar na lateral esquerda (Setas de contexto ou marcador)
          let prefix = isSelected ? chalk.bold("█") : chalk.hex(theme.dim)("░");

          // Se for a primeira linha visível e tiver itens acima, coloca a seta pra cima
          if (i === 0 && hasItemsAbove) {
            prefix = chalk.hex(theme.dim)("⌃");
          }
          // Se for a última linha visível e tiver itens abaixo, coloca a seta pra baixo
          else if (i === visibleItems.length - 1 && hasItemsBelow) {
            prefix = chalk.hex(theme.dim)("⌄");
          }

          return (
            <Box key={item.id} gap={1} height={1}>
              <Box width={2}>
                {isSelected ? (
                  <BreathingText
                    active={isSelected}
                    fg={theme.accent}
                    bg={theme.bg}
                    speed={0.2}
                  >
                    {prefix}
                  </BreathingText>
                ) : (
                  <Text>{prefix}</Text>
                )}
              </Box>

              <Box flexGrow={1}>
                <Text
                  color={isSelected ? theme.accent : theme.fg}
                  bold={isSelected}
                  wrap="truncate-middle"
                >
                  {item.label}
                </Text>
              </Box>
            </Box>
          );
        })}
    </Box>
  );
}
