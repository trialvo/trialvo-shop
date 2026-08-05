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
      className="h-9 w-9 rounded-none border-[#999999] p-0"
      aria-label="Share product"
    >
      <FiShare2 className="h-5 w-5" />
    </Button>
  );
};

export default ShareButton;
