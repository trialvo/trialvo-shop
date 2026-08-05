"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { FiChevronRight } from "react-icons/fi";
import type { MenuNode } from "./menu.types";

type Props = {
  nodes: MenuNode[];
  onNodeClick: (node: MenuNode) => void;
  className?: string;
};

const INTERNAL_OPEN_SUB_PREFIX = "__open_sub__:";

const MenuList: React.FC<Props> = ({ nodes, onNodeClick, className }) => {
  return (
    <div className={cn("divide-y", className)}>
      {nodes.map((n) => {
        const hasChildren = Boolean(n.children?.length);

        const opensNested =
          typeof n.href === "string" && n.href.startsWith(INTERNAL_OPEN_SUB_PREFIX);

        const showChevron = hasChildren || opensNested;

        return (
          <button
            key={n.label}
            type="button"
            onClick={() => onNodeClick(n)}
            className={cn(
              "flex w-full items-center justify-between px-4 py-3 text-left cursor-pointer",
              "bg-white hover:bg-black/2",
            )}
          >
            <span className="text-base font-medium text-black">{n.label}</span>

            {showChevron ? (
              <FiChevronRight className="h-6 w-6 text-black" />
            ) : (
              <span className="w-6" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default MenuList;
