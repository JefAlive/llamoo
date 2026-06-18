import { useWindowSize } from 'ink';
import { useMemo } from 'react';

const COLUMNS = {
  "TINY": 38,
  "MOBILE": 50,
  "TABLET": 80,
  "DESKTOP": 120,
}

const ROWS = {
  "SHORT": 35,
  "SHORTEST": 25,
}

export function useResponsiveLayout() {
  const { columns, rows } = useWindowSize();

  const isTiny = columns < COLUMNS.TINY;
  const isMobile = columns < COLUMNS.MOBILE;
  const isTablet = columns >= COLUMNS.MOBILE && columns < COLUMNS.DESKTOP;
  const isDesktop = columns >= COLUMNS.DESKTOP;

  const isShort = rows < ROWS.SHORT;
  const isShortest = rows < ROWS.SHORTEST;

  const maxContainerColumns = useMemo(() => {
    if (isTiny) return COLUMNS.TINY - 2;
    if (isMobile) return COLUMNS.MOBILE - 6;
    if (isTablet) return COLUMNS.TABLET - 14;

    const containerColumns = Math.floor(COLUMNS.DESKTOP * 0.75);
    return containerColumns % 2 === 0 ? containerColumns : containerColumns - 1;
  }, [columns]);

  return {
    rows,
    columns,
    maxContainerColumns,

    isTiny,
    isMobile,
    isTablet,
    isDesktop,

    isShort,
    isShortest,
  };
}
