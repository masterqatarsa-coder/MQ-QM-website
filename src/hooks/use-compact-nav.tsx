import * as React from "react";

const COMPACT_NAV_BREAKPOINT = 1024;

export function useIsCompactNav() {
  const [isCompactNav, setIsCompactNav] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${COMPACT_NAV_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsCompactNav(window.innerWidth < COMPACT_NAV_BREAKPOINT);
    };

    mql.addEventListener("change", onChange);
    setIsCompactNav(window.innerWidth < COMPACT_NAV_BREAKPOINT);

    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isCompactNav;
}
