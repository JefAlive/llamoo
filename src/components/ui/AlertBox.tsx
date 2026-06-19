import { Box } from "ink";
import type { Theme } from "../../types";
import { BreathingText } from "./BreathingText";

interface AlertBoxProps {
  message: string;
  theme: Theme;
  blinking?: boolean;
}

export function AlertBox({ message, blinking = false, theme }: AlertBoxProps) {
  return (
    <Box
      flexDirection="column"
      paddingLeft={1}
      borderStyle={{
        topLeft: "",
        top: "",
        topRight: "",
        left: "▌",
        bottomLeft: "",
        bottom: "",
        bottomRight: "",
        right: "▐",
      }}
      borderColor={theme.warning}
      borderTop={false}
      borderRight={false}
      borderBottom={false}
      borderBackgroundColor={theme.bg}
      backgroundColor={theme.bg}
    >
      <BreathingText
        active={blinking}
        speed={0.1}
        fg={theme.warning}
        bg={theme.bg}
      >
        {message}
      </BreathingText>
    </Box>
  );
}
