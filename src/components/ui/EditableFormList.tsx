import chalk from "chalk";
import { Box, Text, useBoxMetrics } from "ink";
import TextInput from "ink-text-input";
import { useRef } from "react";
import type { Theme } from "../../types";
import { BreathingText } from "./BreathingText";

// O contrato mínimo que qualquer objeto de campo precisa ter
interface BaseField {
  key: string;
  label: string;
  type: string;
}

// Transformamos a interface em Genérica usando <T extends BaseField>
interface EditableFormListProps<T extends BaseField> {
  fields: T[];
  fieldIdx: number;
  editing: boolean;
  editVal: string;
  setEditVal: (val: string) => void;
  getVal: (field: T) => string; // Agora aceita o tipo exato do seu FieldDef
  theme: Theme;
  emptyMessage?: string;
  scrollMargin?: number;
}

// Adicionamos o <T extends BaseField> na assinatura da função
export function EditableFormList<T extends BaseField>({
  fields,
  fieldIdx,
  editing,
  editVal,
  setEditVal,
  getVal,
  theme,
  emptyMessage = "No fields available.",
  scrollMargin = 2,
}: EditableFormListProps<T>) {
  const ref = useRef(null);
  const { height, hasMeasured } = useBoxMetrics(ref);

  if (fields.length === 0) {
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

    if (fieldIdx >= scrollOffset + height - safeMargin) {
      scrollOffset = fieldIdx - height + 1 + safeMargin;
    } else if (fieldIdx < scrollOffset + safeMargin) {
      scrollOffset = fieldIdx - safeMargin;
    }

    scrollOffset = Math.max(0, Math.min(scrollOffset, fields.length - height));
  }

  const visibleFields = height
    ? fields.slice(scrollOffset, scrollOffset + height)
    : fields;

  const hasItemsAbove = scrollOffset > 0;
  const hasItemsBelow = height ? scrollOffset + height < fields.length : false;

  return (
    <Box ref={ref} flexDirection="column" height="100%">
      {hasMeasured &&
        visibleFields.map((field, i) => {
          const realIdx = i + scrollOffset;
          const isSelected = realIdx === fieldIdx;
          const valStr = getVal(field); // O TypeScript agora sabe que 'field' é do seu tipo FieldDef!

          let prefix = isSelected ? chalk.bold("█") : chalk.hex(theme.dim)("░");

          if (i === 0 && hasItemsAbove) {
            prefix = chalk.hex(theme.dim)("⌃");
          } else if (i === visibleFields.length - 1 && hasItemsBelow) {
            prefix = chalk.hex(theme.dim)("⌄");
          }

          return (
            <Box key={field.key} gap={1} height={1}>
              <Box width={2} flexShrink={0}>
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

              <Box flexShrink={0} width={19} height={1}>
                <Text
                  color={isSelected ? theme.accent : theme.fg}
                  bold={isSelected}
                >
                  {field.label}
                </Text>
              </Box>

              <Box flexGrow={1} flexShrink={1} height={1}>
                {isSelected &&
                editing &&
                field.type !== "bool" &&
                field.type !== "select" ? (
                  <Box gap={0}>
                    <Text color={theme.accent}>[</Text>
                    <TextInput
                      value={editVal}
                      onChange={setEditVal}
                      focus={true}
                    />
                    <Text color={theme.accent}>]</Text>
                  </Box>
                ) : (
                  <Text
                    color={isSelected ? theme.accent : theme.dim}
                    wrap="truncate-middle"
                  >
                    {valStr || "—"}
                  </Text>
                )}
              </Box>
            </Box>
          );
        })}
    </Box>
  );
}
