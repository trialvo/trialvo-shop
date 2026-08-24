"use client";

import { Button } from "@/components/ui/button";
import React from "react";
import { FiShare2 } from "react-icons/fi";

type Props = {
  onClick?: () => void;
};

const ShareButton: React.FC<Props> = ({ onClick }) => {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className="h-9 w-9 shrink-0 rounded-md border border-[#D0D0D0] bg-white p-0 text-[#191919] hover:border-[#191919]"
      aria-label="Share product"
    >
      <FiShare2 className="h-4 w-4" strokeWidth={1.75} />
    </Button>
  );
};

export default ShareButton;
