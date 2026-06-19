import { useEffect, useMemo, useState } from "react";

import GraphemeSplitter from "grapheme-splitter";
import { Box, Text } from "ink";

const splitter = new GraphemeSplitter();

const CURSOR = "▂";

const PHASES = {
  TYPING: "typing",
  VISIBLE: "visible",
  DELETING: "deleting",
  HIDDEN: "hidden",
};

function getTypingDelay(char) {
  if (char === ".") return 1000;
  if (char === "!") return 1500;
  if (char === "?") return 750;
  if (char === ",") return 160;
  if (char === " ") return 0;
  if (char === "\n") return 0;

  const hesitation = Math.random() < 0.12;

  if (hesitation) {
    return 120 + Math.random() * 120;
  }

  return 50 + Math.random() * 45;
}

function TypewriterText({
  text,
  color,
  visibleDuration = 5000,
  blinkSpeed = 250,
  onFinish,
}) {
  const glyphs = useMemo(() => {
    return splitter.splitGraphemes(text);
  }, [text]);

  const [cursorVisible, setCursorVisible] = useState(true);
  const [phase, setPhase] = useState(PHASES.TYPING);
  const [index, setIndex] = useState(0);

  // start effect on change text
  useEffect(() => {
    if (!text) return;

    setPhase(PHASES.TYPING);
    setIndex(0);
    setCursorVisible(true);
  }, [text]);

  // cursor piscando
  useEffect(() => {
    if (phase !== PHASES.TYPING) return;

    const interval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, blinkSpeed);

    return () => clearInterval(interval);
  }, [phase, blinkSpeed]);

  // DIGITANDO
  useEffect(() => {
    if (phase !== PHASES.TYPING) return;

    if (index >= glyphs.length) {
      setPhase(PHASES.VISIBLE);
      return;
    }

    const previousGlyph = index > 0 && glyphs[index - 1];

    const timeout = setTimeout(() => {
      const burst = Math.random() < 0.18;

      setIndex((v) => {
        const next = burst ? v + 2 : v + 1;
        return Math.min(next, glyphs.length);
      });
    }, getTypingDelay(previousGlyph));

    return () => clearTimeout(timeout);
  }, [phase, index, glyphs]);

  // VISÍVEL
  useEffect(() => {
    if (phase !== PHASES.VISIBLE) return;

    const timeout = setTimeout(() => {
      setPhase(PHASES.DELETING);
    }, visibleDuration);

    return () => clearTimeout(timeout);
  }, [phase, visibleDuration]);

  // APAGANDO
  useEffect(() => {
    if (phase !== PHASES.DELETING) return;

    if (index <= 0) {
      setPhase(PHASES.HIDDEN);

      onFinish?.();

      return;
    }

    const timeout = setTimeout(
      () => {
        setIndex((v) => {
          const next = v - 2; // apaga de 2 em 2 chars pra dar efeito mais rápido e fluído
          return Math.max(next, 0);
        });
      },
      8 + Math.random() * 4
    );

    return () => clearTimeout(timeout);
  }, [phase, index, onFinish]);

  const content = useMemo(() => {
    if (phase === PHASES.HIDDEN) {
      return "";
    }

    const visible = glyphs.slice(0, index).join("");

    if (phase === PHASES.TYPING && index < glyphs.length) {
      return visible + (cursorVisible ? CURSOR : "_");
    }

    return visible;
  }, [phase, glyphs, index, cursorVisible]);

  return <Text color={color}>{content}</Text>;
}

export function Toast({ theme, message, onFinish }) {
  return (
    message && (
      <Box flexDirection="row" justifyContent="flex-end" alignItems="flex-end">
        <Box flexDirection="column" justifyContent="flex-end">
          <Box
            paddingRight={2}
            flexDirection="column"
            justifyContent="center"
            backgroundColor={theme.fg}
            borderStyle={{
              topLeft: "▌",
              top: "",
              topRight: "▐",
              left: "▌",
              bottomLeft: "▌",
              bottom: "",
              bottomRight: "▐",
              right: "▐",
            }}
            borderTop={false}
            borderRight={true}
            borderBottom={false}
            borderLeft={true}
            borderBackgroundColor={theme.fg}
            borderColor={theme.accent}
          >
            <TypewriterText
              color={theme.bg}
              text={message}
              visibleDuration={5000}
              onFinish={onFinish}
            />
          </Box>
        </Box>

        <Box>
          <Text color={theme.accent}>▶</Text>
        </Box>
      </Box>
    )
  );
}
