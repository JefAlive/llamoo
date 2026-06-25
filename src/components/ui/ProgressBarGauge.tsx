import chalk from "chalk";
import { Box, Text } from "ink";
import type { Theme } from "../../types";

interface ProgressBarGaugeProps {
  name: string;
  value: number;
  maxValue: number;
  showMaxValue?: boolean;
  unit: string;
  theme: Theme;
  mode?: "neutral" | "critical";
  type?: "smooth" | "blocks";
}

export function ProgressBarGauge({
  name,
  value,
  maxValue,
  showMaxValue = true,
  unit,
  theme,
  type = "smooth",
}: ProgressBarGaugeProps) {
  const PERCENTAGE_BARS: Record<number, string> = {
    [0]: "",
    [10]: chalk.hex(theme.dim)("_"),
    [20]: chalk.hex(theme.fg)("_"),
    [35]: chalk.hex(theme.fg)("_▂"),
    [50]: chalk.hex(theme.fg)("_▂▃"),
    [65]: chalk.hex(theme.fg)("_▂▃▄"),
    [80]: "_▂▃▄▅" + chalk.hex(theme.warning)("▆"),
    [90]: "_▂▃▄▅" + chalk.hex(theme.warning)("▆▇"),
    [93]: "_▂▃▄" + chalk.hex(theme.warning)("▅") + chalk.hex(theme.error)("▆▇"),
    [96]: "_▂▃" + chalk.hex(theme.warning)("▄") + chalk.hex(theme.error)("▅▆▇"),
  };

  const BLOCKS_BARS: Record<number, string> = {
    [0]: "▱▱▱▱",
    [25]: "▰▱▱▱",
    [50]: "▰▰▱▱",
    [75]: "▰▰▰▱",
    [100]: "▰▰▰▰",
  };

  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
  let valStr = "";
  const formattedValue = value.toFixed(1).replace(".0", "");
  const formattedMaxValue = maxValue.toFixed(0).replace(".0", "");
  if (showMaxValue) {
    valStr = `${formattedValue}${chalk.hex(theme.dim)("/" + formattedMaxValue + unit)}`;
  } else {
    valStr = `${formattedValue}${chalk.hex(theme.dim)(unit)}`;
  }

  const selectedBar = type === "blocks" ? BLOCKS_BARS : PERCENTAGE_BARS;
  const size = type === "blocks" ? 4 : 7;

  const validKeys = Object.keys(selectedBar)
    .map(Number)
    .filter((key) => key <= percentage);
  const highestKey = Math.max(...validKeys);
  const barString = selectedBar[highestKey] || "";

  return (
    <Box gap={1} height={1}>
      <Box width={4}>
        <Text color={theme.fg} bold wrap="hard">
          {name}
        </Text>
      </Box>
      <Box width={1}>
        <Text color={theme.dim}>{"["}</Text>
      </Box>
      <Box width={size}>
        <Text>{barString}</Text>
      </Box>
      <Box width={1}>
        <Text color={theme.dim}>{"]"}</Text>
      </Box>
      <Box>
        <Text color={theme.fg}>{valStr}</Text>
      </Box>
    </Box>
  );
}
