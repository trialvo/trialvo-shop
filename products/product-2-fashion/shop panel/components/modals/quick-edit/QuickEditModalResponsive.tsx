"use client";

import React from "react";
import QuickEditModal, { QuickEditPayload } from "./QuickEditModal";
import QuickEditModalMobile from "./QuickEditModalMobile";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isTop?: boolean;
  zIndex?: number;
  payload: QuickEditPayload;
  className?: string;
};

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

const QuickEditModalResponsive: React.FC<Props> = (props) => {
  const isMobile = useMediaQuery("(max-width: 500px)");

  if (isMobile) return <QuickEditModalMobile {...props} />;
  return <QuickEditModal {...props} />;
};

export default QuickEditModalResponsive;