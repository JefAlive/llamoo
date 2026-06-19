import React from "react";
import { Box, Text } from "ink";
import { BreathingText } from "./BreathingText";
import chalk from "chalk";

interface SelectableItemData {
  id: string | number;
  label: string;
}

interface SelectableListProps {
  items: SelectableItemData[];
  selectedIdx: number;
  theme: any;
  scrollOffset?: number;
  listHeight?: number;
  emptyMessage?: string;
}

export function SelectableList({
  items,
  selectedIdx,
  theme,
  scrollOffset = 0,
  listHeight,
  emptyMessage = "No results for your search.",
}: SelectableListProps) {
  if (items.length === 0) {
    return (
      <Box>
        <Text color={theme.dim}>{emptyMessage}</Text>
      </Box>
    );
  }

  const visibleItems = listHeight
    ? items.slice(scrollOffset, scrollOffset + listHeight)
    : items;

  return (
    <Box flexDirection="column">
      {visibleItems.map((item, i) => {
        const realIdx = i + scrollOffset;
        const isSelected = realIdx === selectedIdx;

        return (
          <Box key={item.id} gap={1}>
            <Box>
              <BreathingText active fg={theme.accent} bg={theme.bg} speed={0.2}>
                {isSelected ? chalk.bold(">") : " "}
              </BreathingText>
            </Box>

            <Box height={1}>
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

      {listHeight && items.length > listHeight && (
        <Text color={theme.dim}>
          {`  ${scrollOffset + 1}-${Math.min(scrollOffset + listHeight, items.length)} of ${items.length}`}
        </Text>
      )}
    </Box>
  );
}
