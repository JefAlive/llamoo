import { Box, Text } from 'ink';
import { useEffect, useState } from 'react';

const LLAMA_ASCII = `
(\\_/)
≽•ܫ•≼
(   )
`.trim();

const LLAMA_ASCII_BLINKING = `
(\\_/)
≽-ܫ-≼
(   )
`.trim();

export function PixelSprite({ width, height, assetId, theme }) {
  const [blinking, setBlinking] = useState(false);

  useEffect(() => {
    let timeout;

    const scheduleBlink = () => {
      // Entre 2 e 8 segundos até a próxima sequência
      const nextDelay = 2000 + Math.random() * 8000;

      timeout = setTimeout(() => {
        const doubleBlink = Math.random() < 0.3;

        const doBlink = (callback) => {
          setBlinking(true);

          setTimeout(() => {
            setBlinking(false);

            if (callback) {
              callback();
            } else {
              scheduleBlink();
            }
          }, doubleBlink ? 180 : 350); // olho fechado
        };

        if (doubleBlink) {
          doBlink(() => {
            setTimeout(() => {
              doBlink();
            }, 220);
          });
        } else {
          doBlink();
        }
      }, nextDelay);
    };

    scheduleBlink();

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  const b = assetId & 0xff;
  const hexColor = '#0000' + b.toString(16).padStart(2, '0');

  const hasImageSupport = false;

  return (
    <>
      {hasImageSupport && (
        <Box width={width} height={height} flexDirection="column">
          <Text color={hexColor}>⎋</Text>
        </Box>
      )}

      {!hasImageSupport && (
        <Box
          minWidth={6}
          height={3}
          flexDirection="column"
          alignItems="flex-end"
        >
          <Text bold color={theme.info}>
            {blinking ? LLAMA_ASCII_BLINKING : LLAMA_ASCII}
          </Text>
        </Box>
      )}
    </>
  );
}