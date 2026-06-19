import React, { useEffect, useRef, useState } from "react";

import chalk from "chalk";
import { Text } from "ink";

type Props = {
  children: string;
  fg: string; // hex
  bg?: string; // hex (referência, não anima)
  speed?: number;
  fps?: number;
  active?: boolean;
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");

  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;

  const num = parseInt(full, 16);

  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function mixWave(phase: number) {
  // 🎮 pulsação assimétrica (arcade feel)
  const t = Math.sin(phase);

  return (t + 1) / 2;
}

function hardClip(x: number) {
  // 🔥 clipping estilo hardware
  if (x > 0.85) return 1;
  return x;
}

function mixBetween(a: number, b: number, t: number) {
  return lerp(a, b, hardClip(t));
}

function mixColor(
  fg: [number, number, number],
  bg: [number, number, number],
  t: number,
) {
  // 🎯 FG respira entre BG → FG
  return {
    r: Math.round(mixBetween(bg[0], fg[0], t)),
    g: Math.round(mixBetween(bg[1], fg[1], t)),
    b: Math.round(mixBetween(bg[2], fg[2], t)),
  };
}

export const BreathingText: React.FC<Props> = ({
  children,
  fg,
  bg = "#000000",
  speed = 0.2,
  fps = 30,
  active = true,
}) => {
  const fgRgb = hexToRgb(fg);
  const bgRgb = hexToRgb(bg);

  const [phase, setPhase] = useState(0);
  const frame = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      frame.current++;

      // 🕹️ fps estilo arcade
      if (frame.current % Math.max(1, Math.floor(60 / fps)) !== 0) return;

      setPhase((p) => p + speed);
    }, 16);

    return () => clearInterval(interval);
  }, [speed, fps]);

  const t = mixWave(phase);

  const color = mixColor(fgRgb, bgRgb, t);

  const styled = chalk.rgb(color.r, color.g, color.b);

  return <Text>{(active && styled(children)) || children}</Text>;
};
