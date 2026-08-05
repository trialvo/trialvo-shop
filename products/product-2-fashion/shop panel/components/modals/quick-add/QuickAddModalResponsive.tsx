"use client";

import React from "react";
import QuickAddModal from "./QuickAddModal";
import QuickAddModalMobile from "./QuickAddModalMobile";

type Props = React.ComponentProps<typeof QuickAddModal>;

function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const mql = globalThis.matchMedia(query);
    const onChange = () => setMatches(mql.matches);

    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

const QuickAddModalResponsive: React.FC<Props> = (props) => {
  const isMobile = useMediaQuery("(max-width: 500px)");

  if (isMobile) return <QuickAddModalMobile {...props} />;
  return <QuickAddModal {...props} />;
};

export default QuickAddModalResponsive;
