"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { FiChevronRight } from "react-icons/fi";
import type { MenuNode } from "./menu.types";

const INTERNAL_OPEN_SUB_PREFIX = "__open_sub__:";

type MenuRowProps = {
  label: string;
  onClick?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  showChevron?: boolean;
  active?: boolean;
  danger?: boolean;
  staticRow?: boolean;
  className?: string;
};

export function MenuRow({
  label,
  onClick,
  icon: Icon,
  leading,
  trailing,
  showChevron = false,
  active = false,
  danger = false,
  staticRow = false,
  className,
}: MenuRowProps): React.ReactElement {
  const classNames = cn(
    "flex w-full items-center gap-3 border-b border-[#E5E5E5] bg-white px-4 py-3.5 text-left",
    !staticRow && "hover:bg-black/2",
    className,
  );

  const content = (
    <>
      {leading}
      {Icon ? (
        <Icon className={cn("h-5 w-5 shrink-0", danger ? "text-red-600" : "text-black/70")} />
      ) : null}

      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm",
          danger ? "font-medium text-red-600" : "font-medium text-black",
          active && "font-semibold",
        )}
      >
        {label}
      </span>

      {trailing}
      {showChevron ? <FiChevronRight className="h-5 w-5 shrink-0 text-black/40" /> : null}
    </>
  );

  if (staticRow) {
    return <div className={classNames}>{content}</div>;
  }

  return (
    <button type="button" onClick={onClick} className={classNames}>
      {content}
    </button>
  );
}

type Props = {
  nodes: MenuNode[];
  onNodeClick: (node: MenuNode) => void;
  className?: string;
};

const MenuList: React.FC<Props> = ({ nodes, onNodeClick, className }) => {
  return (
    <div className={className}>
      {nodes.map((n) => {
        const hasChildren = Boolean(n.children?.length);
        const opensNested =
          typeof n.href === "string" && n.href.startsWith(INTERNAL_OPEN_SUB_PREFIX);

        return (
          <MenuRow
            key={n.label}
            label={n.label}
            onClick={() => onNodeClick(n)}
            showChevron={hasChildren || opensNested}
          />
        );
      })}
    </div>
  );
};

export default MenuList;
